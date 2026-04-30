const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const db = require('../config/database');

// Получить статистику
router.get('/dashboard',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const stats = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE role = 'client') as total_clients,
          (SELECT COUNT(*) FROM users WHERE role = 'courier') as total_couriers,
          (SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours') as orders_today,
          (SELECT COUNT(*) FROM orders WHERE status = 'searching_courier') as orders_pending,
          (SELECT COUNT(*) FROM orders WHERE status IN ('accepted', 'in_transit')) as orders_active,
          (SELECT SUM(final_price) FROM orders WHERE status = 'completed' AND created_at > NOW() - INTERVAL '24 hours') as revenue_today
      `);

      res.json(stats.rows[0]);
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({ error: 'Ошибка получения статистики' });
    }
  }
);

// Получить все заказы
router.get('/orders',
  authenticateToken,
  requireRole(['admin', 'super_admin', 'support']),
  async (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
      let query = `
        SELECT o.*,
          u1.name as client_name, u1.phone as client_phone,
          u2.name as courier_name, u2.phone as courier_phone
        FROM orders o
        LEFT JOIN users u1 ON o.client_id = u1.id
        LEFT JOIN users u2 ON o.courier_id = u2.id
      `;

      const values = [];
      if (status) {
        query += ' WHERE o.status = $1';
        values.push(status);
      }

      query += ' ORDER BY o.created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
      values.push(limit, offset);

      const result = await db.query(query, values);
      res.json(result.rows);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Ошибка получения заказов' });
    }
  }
);

// Получить всех пользователей
router.get('/users',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  async (req, res) => {
    const { role, limit = 50, offset = 0 } = req.query;

    try {
      let query = 'SELECT id, phone, email, name, role, status, rating, total_orders, created_at FROM users';
      const values = [];

      if (role) {
        query += ' WHERE role = $1';
        values.push(role);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
      values.push(limit, offset);

      const result = await db.query(query, values);
      res.json(result.rows);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
  }
);

// Получить курьеров на проверке
router.get('/couriers/pending',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const result = await db.query(`
        SELECT
          u.id,
          u.phone,
          u.name,
          u.email,
          u.created_at,
          c.transport_type,
          c.work_zone,
          c.verification_status,
          c.passport_photo_url,
          c.driver_license_url,
          c.vehicle_photo_url,
          c.created_at as courier_created_at,
          (SELECT COUNT(*) FROM payments WHERE user_id = u.id AND type = 'deposit' AND status = 'completed') as deposit_paid
        FROM users u
        INNER JOIN couriers c ON u.id = c.user_id
        WHERE c.verification_status = 'pending'
        ORDER BY c.created_at ASC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('Get pending couriers error:', error);
      res.status(500).json({ error: 'Ошибка получения курьеров на проверке' });
    }
  }
);

// Получить детали курьера для верификации
router.get('/couriers/:id',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const result = await db.query(`
        SELECT
          u.id,
          u.phone,
          u.name,
          u.email,
          u.rating,
          u.total_orders,
          u.balance,
          u.created_at,
          c.transport_type,
          c.work_zone,
          c.verification_status,
          c.passport_photo_url,
          c.driver_license_url,
          c.vehicle_photo_url,
          c.is_online,
          c.is_busy,
          c.completed_orders,
          c.cancelled_orders,
          c.total_earnings,
          c.created_at as courier_created_at
        FROM users u
        INNER JOIN couriers c ON u.id = c.user_id
        WHERE u.id = $1
      `, [req.params.id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Курьер не найден' });
      }

      // Получить историю платежей
      const paymentsResult = await db.query(
        'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
        [req.params.id]
      );

      res.json({
        ...result.rows[0],
        payments: paymentsResult.rows
      });
    } catch (error) {
      console.error('Get courier details error:', error);
      res.status(500).json({ error: 'Ошибка получения данных курьера' });
    }
  }
);

// Верифицировать курьера
router.put('/users/:id/verify',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  async (req, res) => {
    const { status, reason } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    if (status === 'rejected' && !reason) {
      return res.status(400).json({ error: 'Укажите причину отклонения' });
    }

    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Проверяем что курьер существует и на проверке
      const courierResult = await client.query(
        'SELECT * FROM couriers WHERE user_id = $1',
        [req.params.id]
      );

      if (courierResult.rows.length === 0) {
        throw new Error('Курьер не найден');
      }

      const courier = courierResult.rows[0];

      if (courier.verification_status !== 'pending') {
        throw new Error('Курьер уже обработан');
      }

      // Проверяем что депозит оплачен
      const depositResult = await client.query(
        'SELECT * FROM payments WHERE user_id = $1 AND type = $2 AND status = $3',
        [req.params.id, 'deposit', 'completed']
      );

      if (status === 'verified' && depositResult.rows.length === 0) {
        throw new Error('Депозит не оплачен');
      }

      // Обновляем статус верификации
      await client.query(
        'UPDATE couriers SET verification_status = $1, updated_at = NOW() WHERE user_id = $2',
        [status, req.params.id]
      );

      // Если одобрен - начисляем депозит на баланс
      if (status === 'verified' && depositResult.rows.length > 0) {
        const depositAmount = depositResult.rows[0].amount;
        await client.query(
          'UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2',
          [depositAmount, req.params.id]
        );
      }

      // TODO: Отправить уведомление курьеру (email/push)

      await client.query('COMMIT');

      res.json({
        success: true,
        status,
        message: status === 'verified'
          ? 'Курьер верифицирован и может начать работу'
          : `Курьер отклонён. Причина: ${reason}`
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Verify courier error:', error);
      res.status(400).json({ error: error.message || 'Ошибка верификации курьера' });
    } finally {
      client.release();
    }
  }
);

// Заблокировать/разблокировать пользователя
router.put('/users/:id/status',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  async (req, res) => {
    const { status } = req.body;

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    try {
      await db.query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, req.params.id]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ error: 'Ошибка обновления статуса' });
    }
  }
);

module.exports = router;
