const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const db = require('../config/database');

// Повысить цену заказа (после 5 минут поиска)
router.post('/:id/increase-price',
  authenticateToken,
  body('new_price').isFloat({ min: 0 }).withMessage('Укажите новую цену'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { new_price } = req.body;

    try {
      const orderResult = await db.query(
        'SELECT * FROM orders WHERE id = $1 AND client_id = $2',
        [req.params.id, req.user.userId]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Заказ не найден' });
      }

      const order = orderResult.rows[0];

      if (order.status !== 'searching_courier') {
        return res.status(400).json({ error: 'Заказ уже принят или завершён' });
      }

      if (new_price <= order.final_price) {
        return res.status(400).json({ error: 'Новая цена должна быть выше текущей' });
      }

      // Обновляем цену заказа
      const newCourierEarnings = Math.round(new_price * 0.85);

      await db.query(
        `UPDATE orders SET
          final_price = $1,
          courier_earnings = $2,
          updated_at = NOW()
         WHERE id = $3`,
        [new_price, newCourierEarnings, req.params.id]
      );

      // Уведомляем курьеров о повышении цены
      const { startCourierSearch } = require('../services/courierSearch');
      startCourierSearch(req.params.id).catch(error => {
        console.error('Re-notify couriers error:', error);
      });

      res.json({
        success: true,
        new_price,
        courier_earnings: newCourierEarnings,
        message: 'Цена повышена, курьеры уведомлены'
      });
    } catch (error) {
      console.error('Increase price error:', error);
      res.status(500).json({ error: 'Ошибка повышения цены' });
    }
  }
);

// Подтвердить получение/доставку по коду
router.post('/:id/points/:pointId/confirm',
  authenticateToken,
  requireRole(['courier']),
  body('confirmation_code').isLength({ min: 6, max: 6 }).withMessage('Код должен быть 6 цифр'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { confirmation_code } = req.body;

    try {
      // Проверяем что заказ принадлежит курьеру
      const orderResult = await db.query(
        'SELECT * FROM orders WHERE id = $1 AND courier_id = $2',
        [req.params.id, req.user.userId]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Заказ не найден' });
      }

      // Проверяем точку и код
      const pointResult = await db.query(
        'SELECT * FROM order_points WHERE id = $1 AND order_id = $2',
        [req.params.pointId, req.params.id]
      );

      if (pointResult.rows.length === 0) {
        return res.status(404).json({ error: 'Точка не найдена' });
      }

      const point = pointResult.rows[0];

      if (point.status === 'completed') {
        return res.status(400).json({ error: 'Точка уже завершена' });
      }

      if (point.confirmation_code !== confirmation_code) {
        return res.status(400).json({ error: 'Неверный код подтверждения' });
      }

      // Обновляем статус точки
      await db.query(
        `UPDATE order_points SET
          status = $1,
          completed_at = NOW()
         WHERE id = $2`,
        ['completed', req.params.pointId]
      );

      // Проверяем все ли точки завершены
      const allPointsResult = await db.query(
        'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $1) as completed FROM order_points WHERE order_id = $2',
        ['completed', req.params.id]
      );

      const { total, completed } = allPointsResult.rows[0];

      let orderStatus = 'in_transit';
      let updateFields = {};

      if (parseInt(completed) === parseInt(total)) {
        // Все точки завершены - заказ выполнен
        orderStatus = 'completed';
        updateFields = {
          status: 'completed',
          completed_at: 'NOW()',
          payment_status: 'completed'
        };

        // Начисляем заработок курьеру
        const order = orderResult.rows[0];
        await db.query(
          `UPDATE users SET
            balance = balance + $1,
            total_orders = total_orders + 1,
            updated_at = NOW()
           WHERE id = $2`,
          [order.courier_earnings, req.user.userId]
        );

        await db.query(
          `UPDATE couriers SET
            is_busy = false,
            completed_orders = completed_orders + 1,
            total_earnings = total_earnings + $1,
            updated_at = NOW()
           WHERE user_id = $2`,
          [order.courier_earnings, req.user.userId]
        );

        // Уведомляем клиента
        await db.query(
          `INSERT INTO notifications (user_id, type, title, body, data, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            order.client_id,
            'order_completed',
            'Заказ выполнен!',
            `Заказ #${order.order_number} успешно доставлен. Оцените работу курьера.`,
            JSON.stringify({
              order_id: order.id,
              order_number: order.order_number
            })
          ]
        );
      }

      await db.query(
        `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
        [orderStatus, req.params.id]
      );

      res.json({
        success: true,
        point_status: 'completed',
        order_status: orderStatus,
        message: orderStatus === 'completed' ? 'Заказ полностью выполнен!' : 'Точка подтверждена'
      });
    } catch (error) {
      console.error('Confirm point error:', error);
      res.status(500).json({ error: 'Ошибка подтверждения' });
    }
  }
);

// Курьер отменяет заказ
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Cancellation reason required' });
    }

    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND courier_id = $2',
      [req.params.id, req.user.userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];

    // Можно отменить только заказы в статусе accepted или in_progress
    if (!['accepted', 'in_progress'].includes(order.status)) {
      return res.status(400).json({ error: 'Заказ нельзя отменить в текущем статусе' });
    }

    // Проверяем лимиты отмен
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cancelStats = await db.query(
      `SELECT COUNT(*) as today_cancels
       FROM orders
       WHERE courier_id = $1
         AND cancelled_by = $1
         AND cancelled_at >= $2`,
      [req.user.userId, today]
    );

    const todayCancels = parseInt(cancelStats.rows[0].today_cancels);

    if (todayCancels >= 3) {
      return res.status(400).json({ error: 'Превышен лимит отмен на сегодня (3/день)' });
    }

    // Проверяем недельный лимит
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekStats = await db.query(
      `SELECT COUNT(*) as week_cancels
       FROM orders
       WHERE courier_id = $1
         AND cancelled_by = $1
         AND cancelled_at >= $2`,
      [req.user.userId, weekAgo]
    );

    const weekCancels = parseInt(weekStats.rows[0].week_cancels);

    if (weekCancels >= 5) {
      return res.status(400).json({ error: 'Превышен лимит отмен на неделю (5/неделя)' });
    }

    await db.query('BEGIN');

    try {
      // Отменяем заказ
      await db.query(
        `UPDATE orders SET
          status = 'cancelled',
          cancelled_by = $1,
          cancelled_at = NOW(),
          cancellation_reason = $2,
          courier_id = NULL,
          updated_at = NOW()
         WHERE id = $3`,
        [req.user.userId, reason, req.params.id]
      );

      // Освобождаем курьера
      await db.query(
        'UPDATE couriers SET is_busy = false, cancelled_orders = cancelled_orders + 1 WHERE user_id = $1',
        [req.user.userId]
      );

      // Возвращаем деньги клиенту если оплачено
      if (order.payment_status === 'paid') {
        await db.query(
          'UPDATE users SET balance = balance + $1 WHERE id = $2',
          [order.final_price, order.client_id]
        );

        await db.query(
          `INSERT INTO payments (order_id, user_id, type, amount, status, description)
           VALUES ($1, $2, 'refund', $3, 'completed', 'Возврат за отменённый заказ')`,
          [order.id, order.client_id, order.final_price]
        );
      }

      // Уведомляем клиента
      await db.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          order.client_id,
          'order_cancelled',
          'Заказ отменён',
          `Курьер отменил заказ #${order.order_number}. Причина: ${reason}`,
          JSON.stringify({ order_id: order.id, order_number: order.order_number })
        ]
      );

      // Снижаем рейтинг курьера за отмену
      await db.query(
        'UPDATE users SET rating = GREATEST(rating - 0.1, 1.0) WHERE id = $1',
        [req.user.userId]
      );

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Заказ отменён',
        warning: `Отмен сегодня: ${todayCancels + 1}/3, за неделю: ${weekCancels + 1}/5`
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Ошибка отмены заказа' });
  }
});

module.exports = router;
