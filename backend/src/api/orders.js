const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const { calculatePrice } = require('../services/pricing');
const { startCourierSearch } = require('../services/courierSearch');
const { v4: uuidv4 } = require('uuid');

// Создать заказ
router.post('/',
  authenticateToken,
  body('points').isArray({ min: 2 }).withMessage('Минимум 2 точки'),
  body('points.*.address').notEmpty(),
  body('points.*.location.lat').isFloat(),
  body('points.*.location.lng').isFloat(),
  body('points.*.type').isIn(['pickup', 'delivery']),
  body('description').optional().isString(),
  body('weight_kg').optional().isFloat({ min: 0 }),
  body('urgency').optional().isIn(['normal', 'fast', 'express']),
  body('payment_method').isIn(['cash', 'card', 'balance']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { points, description, weight_kg, urgency, payment_method } = req.body;
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const pricing = await calculatePrice({
        points,
        weight_kg: weight_kg || 0,
        urgency: urgency || 'normal',
      });

      const orderNumber = `BG${Date.now().toString().slice(-8)}`;

      const orderResult = await client.query(
        `INSERT INTO orders (
          order_number, client_id, status, base_price, final_price,
          pricing_factors, payment_method, description, weight_kg, urgency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          orderNumber,
          req.user.userId,
          'pending',
          pricing.base_price,
          pricing.final_price,
          JSON.stringify(pricing.factors),
          payment_method,
          description,
          weight_kg,
          urgency || 'normal',
        ]
      );

      const order = orderResult.rows[0];

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

        await client.query(
          `INSERT INTO order_points (
            order_id, sequence, address, location, type,
            contact_name, contact_phone, confirmation_code, notes
          ) VALUES ($1, $2, $3, POINT($4, $5), $6, $7, $8, $9, $10)`,
          [
            order.id,
            i,
            point.address,
            point.location.lng,
            point.location.lat,
            point.contact_name,
            point.contact_phone,
            confirmationCode,
            point.notes,
          ]
        );
      }

      if (payment_method === 'card') {
        // TODO: Интеграция с платёжной системой
      }

      await client.query('COMMIT');

      // Запускаем автоматический поиск курьеров (асинхронно)
      startCourierSearch(order.id).catch(error => {
        console.error('Courier search error:', error);
      });

      res.status(201).json({
        order_id: order.id,
        order_number: order.order_number,
        status: 'searching_courier',
        price: pricing.final_price,
        pricing_breakdown: pricing.factors,
        message: 'Заказ создан, ищем курьера...'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Ошибка создания заказа' });
    } finally {
      client.release();
    }
  }
);

// Получить список заказов
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*,
        json_agg(
          json_build_object(
            'id', op.id,
            'sequence', op.sequence,
            'address', op.address,
            'type', op.type,
            'status', op.status
          ) ORDER BY op.sequence
        ) as points
      FROM orders o
      LEFT JOIN order_points op ON o.id = op.order_id
      WHERE o.client_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 50`,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// Получить детали заказа
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND (client_id = $2 OR courier_id = $2)',
      [req.params.id, req.user.userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const pointsResult = await db.query(
      'SELECT * FROM order_points WHERE order_id = $1 ORDER BY sequence',
      [req.params.id]
    );

    const order = orderResult.rows[0];
    order.points = pointsResult.rows;

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Ошибка получения заказа' });
  }
});

// Отменить заказ
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  const { reason } = req.body;

  try {
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND client_id = $2',
      [req.params.id, req.user.userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];

    if (!['pending', 'searching_courier', 'accepted'].includes(order.status)) {
      return res.status(400).json({ error: 'Заказ нельзя отменить на данном этапе' });
    }

    let refundAmount = order.final_price;
    let penalty = 0;

    if (order.status === 'accepted') {
      penalty = 100;
      refundAmount -= penalty;
    } else if (order.status === 'searching_courier') {
      penalty = 50;
      refundAmount -= penalty;
    }

    await db.query(
      `UPDATE orders SET
        status = 'cancelled',
        cancelled_at = NOW(),
        cancelled_by = $1,
        cancellation_reason = $2
      WHERE id = $3`,
      [req.user.userId, reason, req.params.id]
    );

    res.json({
      success: true,
      refund_amount: refundAmount,
      penalty: penalty,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Ошибка отмены заказа' });
  }
});

// Оценить заказ
router.post('/:id/rating',
  authenticateToken,
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString(),
  async (req, res) => {
    const { rating, comment } = req.body;

    try {
      const orderResult = await db.query(
        'SELECT * FROM orders WHERE id = $1 AND (client_id = $2 OR courier_id = $2) AND status = $3',
        [req.params.id, req.user.userId, 'completed']
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Заказ не найден или не завершён' });
      }

      const order = orderResult.rows[0];
      const toUserId = order.client_id === req.user.userId ? order.courier_id : order.client_id;

      await db.query(
        'INSERT INTO ratings (order_id, from_user_id, to_user_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
        [req.params.id, req.user.userId, toUserId, rating, comment]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Rate order error:', error);
      res.status(500).json({ error: 'Ошибка оценки заказа' });
    }
  }
);

module.exports = router;
