const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const db = require('../config/database');
const {
  createOrderPayment,
  createDepositPayment,
  getPaymentStatus,
  createRefund,
  createPayout,
  handleWebhook
} = require('../services/yookassa');

// Создать платёж для заказа
router.post('/order/:orderId',
  authenticateToken,
  async (req, res) => {
    try {
      const orderResult = await db.query(
        'SELECT * FROM orders WHERE id = $1 AND client_id = $2',
        [req.params.orderId, req.user.userId]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Заказ не найден' });
      }

      const order = orderResult.rows[0];

      if (order.payment_status === 'completed') {
        return res.status(400).json({ error: 'Заказ уже оплачен' });
      }

      // Создаём платёж в ЮKassa
      const payment = await createOrderPayment({
        orderId: order.id,
        amount: order.final_price,
        description: `Оплата заказа #${order.order_number}`,
        returnUrl: req.body.return_url,
      });

      // Сохраняем платёж в БД
      await db.query(
        `UPDATE payments SET
          payment_provider = $1,
          provider_payment_id = $2,
          status = $3,
          metadata = $4
         WHERE order_id = $5 AND type = $6`,
        [
          'yookassa',
          payment.payment_id,
          'pending',
          JSON.stringify({ confirmation_url: payment.confirmation_url }),
          order.id,
          'order'
        ]
      );

      res.json({
        success: true,
        payment_id: payment.payment_id,
        confirmation_url: payment.confirmation_url,
        amount: payment.amount,
      });
    } catch (error) {
      console.error('Create order payment error:', error);
      res.status(500).json({ error: error.message || 'Ошибка создания платежа' });
    }
  }
);

// Создать платёж депозита курьера
router.post('/deposit',
  authenticateToken,
  requireRole(['courier']),
  async (req, res) => {
    try {
      const DEPOSIT_AMOUNT = 5000;

      // Проверяем что депозит ещё не оплачен
      const existingPayment = await db.query(
        'SELECT * FROM payments WHERE user_id = $1 AND type = $2 AND status = $3',
        [req.user.userId, 'deposit', 'completed']
      );

      if (existingPayment.rows.length > 0) {
        return res.status(400).json({ error: 'Депозит уже оплачен' });
      }

      // Создаём платёж в ЮKassa
      const payment = await createDepositPayment({
        userId: req.user.userId,
        amount: DEPOSIT_AMOUNT,
        returnUrl: req.body.return_url,
      });

      // Сохраняем платёж в БД
      await db.query(
        `INSERT INTO payments (
          user_id, type, amount, method, status,
          payment_provider, provider_payment_id, description, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          req.user.userId,
          'deposit',
          DEPOSIT_AMOUNT,
          'card',
          'pending',
          'yookassa',
          payment.payment_id,
          'Депозит курьера для работы с наличными заказами',
          JSON.stringify({ confirmation_url: payment.confirmation_url })
        ]
      );

      res.json({
        success: true,
        payment_id: payment.payment_id,
        confirmation_url: payment.confirmation_url,
        amount: payment.amount,
      });
    } catch (error) {
      console.error('Create deposit payment error:', error);
      res.status(500).json({ error: error.message || 'Ошибка создания платежа' });
    }
  }
);

// Проверить статус платежа
router.get('/:paymentId/status',
  authenticateToken,
  async (req, res) => {
    try {
      const paymentResult = await db.query(
        'SELECT * FROM payments WHERE provider_payment_id = $1',
        [req.params.paymentId]
      );

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Платёж не найден' });
      }

      const dbPayment = paymentResult.rows[0];

      // Проверяем что платёж принадлежит пользователю
      if (dbPayment.user_id !== req.user.userId) {
        return res.status(403).json({ error: 'Доступ запрещён' });
      }

      // Получаем актуальный статус из ЮKassa
      const yookassaPayment = await getPaymentStatus(req.params.paymentId);

      // Обновляем статус в БД если изменился
      if (yookassaPayment.status !== dbPayment.status) {
        await db.query(
          'UPDATE payments SET status = $1 WHERE id = $2',
          [yookassaPayment.status, dbPayment.id]
        );
      }

      res.json({
        payment_id: yookassaPayment.payment_id,
        status: yookassaPayment.status,
        paid: yookassaPayment.paid,
        amount: yookassaPayment.amount,
      });
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({ error: error.message || 'Ошибка получения статуса' });
    }
  }
);

// Вывод средств курьером
router.post('/withdraw',
  authenticateToken,
  requireRole(['courier']),
  body('amount').isFloat({ min: 100 }).withMessage('Минимальная сумма вывода 100₽'),
  body('card_number').isLength({ min: 16, max: 19 }).withMessage('Неверный номер карты'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, card_number } = req.body;

    try {
      // Проверяем баланс
      const userResult = await db.query(
        'SELECT balance FROM users WHERE id = $1',
        [req.user.userId]
      );

      const balance = parseFloat(userResult.rows[0].balance);

      if (balance < amount) {
        return res.status(400).json({ error: 'Недостаточно средств на балансе' });
      }

      // Создаём выплату
      const payout = await createPayout({
        userId: req.user.userId,
        amount,
        description: 'Вывод заработка курьера',
        cardNumber: card_number,
      });

      // Списываем с баланса
      await db.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [amount, req.user.userId]
      );

      // Сохраняем в БД
      await db.query(
        `INSERT INTO payments (
          user_id, type, amount, method, status, description, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.user.userId,
          'withdrawal',
          amount,
          'card',
          'pending',
          'Вывод заработка',
          JSON.stringify({ card_number: card_number.slice(-4), payout_id: payout.payout_id })
        ]
      );

      res.json({
        success: true,
        amount,
        message: payout.message,
      });
    } catch (error) {
      console.error('Withdraw error:', error);
      res.status(500).json({ error: error.message || 'Ошибка вывода средств' });
    }
  }
);

// История платежей
router.get('/history',
  authenticateToken,
  async (req, res) => {
    const { limit = 50, offset = 0, type } = req.query;

    try {
      let query = 'SELECT * FROM payments WHERE user_id = $1';
      const values = [req.user.userId];

      if (type) {
        query += ' AND type = $2';
        values.push(type);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
      values.push(limit, offset);

      const result = await db.query(query, values);

      res.json({
        payments: result.rows.map(p => ({
          id: p.id,
          type: p.type,
          amount: parseFloat(p.amount),
          method: p.method,
          status: p.status,
          description: p.description,
          created_at: p.created_at,
          completed_at: p.completed_at,
        })),
        total: result.rows.length,
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({ error: 'Ошибка получения истории платежей' });
    }
  }
);

// Webhook от ЮKassa
router.post('/webhook/yookassa',
  express.json(),
  async (req, res) => {
    try {
      const notification = req.body;
      const event = await handleWebhook(notification);

      if (event.event === 'payment_succeeded') {
        const client = await db.pool.connect();

        try {
          await client.query('BEGIN');

          // Обновляем статус платежа
          const paymentResult = await client.query(
            'UPDATE payments SET status = $1, completed_at = NOW() WHERE provider_payment_id = $2 RETURNING *',
            ['completed', event.payment_id]
          );

          if (paymentResult.rows.length > 0) {
            const payment = paymentResult.rows[0];

            // Если это оплата заказа
            if (payment.type === 'order' && payment.order_id) {
              await client.query(
                'UPDATE orders SET payment_status = $1 WHERE id = $2',
                ['completed', payment.order_id]
              );
            }

            // Если это депозит курьера
            if (payment.type === 'deposit') {
              // Депозит будет начислен при верификации админом
              await client.query(
                `INSERT INTO notifications (user_id, type, title, body, created_at)
                 VALUES ($1, $2, $3, $4, NOW())`,
                [
                  payment.user_id,
                  'deposit_paid',
                  'Депозит оплачен',
                  'Ваш депозит успешно оплачен. Ожидайте верификации документов администратором.'
                ]
              );
            }
          }

          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Ошибка обработки webhook' });
    }
  }
);

module.exports = router;
