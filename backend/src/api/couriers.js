const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const db = require('../config/database');
const { getDistance } = require('../services/pricing');
const { uploadFile } = require('../services/s3');
const multer = require('multer');

// Настройка multer для загрузки в память
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неверный формат файла. Разрешены: JPG, PNG, PDF'));
    }
  },
});

// Регистрация курьера (заполнение профиля)
router.post('/register',
  authenticateToken,
  body('first_name').isLength({ min: 2, max: 100 }).withMessage('Имя: 2-100 символов'),
  body('last_name').isLength({ min: 2, max: 100 }).withMessage('Фамилия: 2-100 символов'),
  body('transport_type').isIn(['foot', 'bicycle', 'motorcycle', 'car']).withMessage('Неверный тип транспорта'),
  body('city').isLength({ min: 2, max: 100 }).withMessage('Город: 2-100 символов'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, transport_type, city } = req.body;

    try {
      // Проверка что пользователь ещё не курьер
      const existingCourier = await db.query(
        'SELECT * FROM couriers WHERE user_id = $1',
        [req.user.userId]
      );

      if (existingCourier.rows.length > 0) {
        return res.status(400).json({ error: 'Вы уже зарегистрированы как курьер' });
      }

      // Обновляем имя пользователя
      await db.query(
        'UPDATE users SET name = $1, role = $2, updated_at = NOW() WHERE id = $3',
        [`${first_name} ${last_name}`, 'courier', req.user.userId]
      );

      // Создаём профиль курьера
      await db.query(
        `INSERT INTO couriers (
          user_id, transport_type, work_zone, verification_status
        ) VALUES ($1, $2, $3, $4)`,
        [
          req.user.userId,
          transport_type,
          JSON.stringify({ city }),
          'pending'
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Профиль курьера создан. Загрузите документы для верификации.',
        next_step: 'POST /couriers/me/documents'
      });
    } catch (error) {
      console.error('Courier registration error:', error);
      res.status(500).json({ error: 'Ошибка регистрации курьера' });
    }
  }
);

// Загрузка документов курьера
router.post('/me/documents',
  authenticateToken,
  requireRole(['courier']),
  upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'driver_license', maxCount: 1 },
    { name: 'vehicle_photo', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const courierResult = await db.query(
        'SELECT * FROM couriers WHERE user_id = $1',
        [req.user.userId]
      );

      if (courierResult.rows.length === 0) {
        return res.status(404).json({ error: 'Профиль курьера не найден' });
      }

      const courier = courierResult.rows[0];

      if (courier.verification_status === 'verified') {
        return res.status(400).json({ error: 'Вы уже верифицированы' });
      }

      const files = req.files;
      const uploadedUrls = {};

      // Загрузка паспорта (обязательно)
      if (files.passport && files.passport[0]) {
        const result = await uploadFile(files.passport[0], 'documents/passports');
        uploadedUrls.passport_photo_url = result.url;
      } else {
        return res.status(400).json({ error: 'Фото паспорта обязательно' });
      }

      // Загрузка прав (для авто/мото)
      if (files.driver_license && files.driver_license[0]) {
        const result = await uploadFile(files.driver_license[0], 'documents/licenses');
        uploadedUrls.driver_license_url = result.url;
      } else if (['motorcycle', 'car'].includes(courier.transport_type)) {
        return res.status(400).json({ error: 'Водительские права обязательны для авто/мото' });
      }

      // Загрузка фото транспорта (для всех кроме пеших)
      if (files.vehicle_photo && files.vehicle_photo[0]) {
        const result = await uploadFile(files.vehicle_photo[0], 'documents/vehicles');
        uploadedUrls.vehicle_photo_url = result.url;
      } else if (courier.transport_type !== 'foot') {
        return res.status(400).json({ error: 'Фото транспорта обязательно' });
      }

      // Обновляем профиль курьера
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      Object.entries(uploadedUrls).forEach(([key, value]) => {
        updateFields.push(`${key} = $${paramCount++}`);
        values.push(value);
      });

      values.push(req.user.userId);

      await db.query(
        `UPDATE couriers SET ${updateFields.join(', ')}, updated_at = NOW() WHERE user_id = $${paramCount}`,
        values
      );

      res.json({
        success: true,
        message: 'Документы загружены. Внесите депозит 5000₽ для завершения регистрации.',
        uploaded: Object.keys(uploadedUrls),
        next_step: 'POST /couriers/me/deposit'
      });
    } catch (error) {
      console.error('Upload documents error:', error);
      res.status(500).json({ error: error.message || 'Ошибка загрузки документов' });
    }
  }
);

// Внесение депозита
router.post('/me/deposit',
  authenticateToken,
  requireRole(['courier']),
  body('payment_method').isIn(['card', 'bank_transfer']).withMessage('Неверный способ оплаты'),
  async (req, res) => {
    const { payment_method } = req.body;
    const DEPOSIT_AMOUNT = 5000;

    try {
      const courierResult = await db.query(
        'SELECT * FROM couriers WHERE user_id = $1',
        [req.user.userId]
      );

      if (courierResult.rows.length === 0) {
        return res.status(404).json({ error: 'Профиль курьера не найден' });
      }

      const courier = courierResult.rows[0];

      if (courier.verification_status === 'verified') {
        return res.status(400).json({ error: 'Вы уже верифицированы' });
      }

      if (!courier.passport_photo_url) {
        return res.status(400).json({ error: 'Сначала загрузите документы' });
      }

      // Проверяем что депозит ещё не оплачен
      const existingPayment = await db.query(
        'SELECT * FROM payments WHERE user_id = $1 AND type = $2 AND status = $3',
        [req.user.userId, 'deposit', 'completed']
      );

      if (existingPayment.rows.length > 0) {
        return res.status(400).json({ error: 'Депозит уже оплачен' });
      }

      // Перенаправляем на эндпоинт платежей для создания платежа
      res.json({
        success: true,
        message: 'Для оплаты депозита используйте POST /api/v1/payments/deposit',
        amount: DEPOSIT_AMOUNT,
        next_step: 'POST /api/v1/payments/deposit'
      });
    } catch (error) {
      console.error('Deposit error:', error);
      res.status(500).json({ error: 'Ошибка создания платежа' });
    }
  }
);

// Обновить статус (онлайн/оффлайн)
router.put('/me/status',
  authenticateToken,
  requireRole(['courier']),
  body('is_online').isBoolean(),
  async (req, res) => {
    const { is_online } = req.body;

    try {
      await db.query(
        'UPDATE couriers SET is_online = $1, updated_at = NOW() WHERE user_id = $2',
        [is_online, req.user.userId]
      );

      res.json({ success: true, is_online });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: 'Ошибка обновления статуса' });
    }
  }
);

// Обновить геолокацию
router.put('/me/location',
  authenticateToken,
  requireRole(['courier']),
  body('lat').isFloat(),
  body('lng').isFloat(),
  async (req, res) => {
    const { lat, lng } = req.body;

    try {
      await db.query(
        'UPDATE couriers SET current_location = POINT($1, $2), updated_at = NOW() WHERE user_id = $3',
        [lng, lat, req.user.userId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({ error: 'Ошибка обновления геолокации' });
    }
  }
);

// Получить доступные заказы
router.get('/available',
  authenticateToken,
  requireRole(['courier']),
  async (req, res) => {
    try {
      const courierResult = await db.query(
        'SELECT * FROM couriers WHERE user_id = $1',
        [req.user.userId]
      );

      if (courierResult.rows.length === 0) {
        return res.status(404).json({ error: 'Профиль курьера не найден' });
      }

      const courier = courierResult.rows[0];

      if (!courier.is_online || courier.is_busy) {
        return res.json([]);
      }

      const ordersResult = await db.query(
        `SELECT o.*,
          (SELECT json_agg(
            json_build_object(
              'id', op.id,
              'address', op.address,
              'location', ARRAY[ST_X(op.location::geometry), ST_Y(op.location::geometry)],
              'type', op.type
            ) ORDER BY op.sequence
          ) FROM order_points op WHERE op.order_id = o.id) as points
        FROM orders o
        WHERE o.status = 'searching_courier'
        AND o.created_at > NOW() - INTERVAL '30 minutes'
        ORDER BY o.created_at DESC
        LIMIT 20`
      );

      const orders = ordersResult.rows.map(order => {
        if (order.points && order.points.length > 0) {
          const firstPoint = order.points[0];
          const distance = getDistance(
            courier.current_location.y,
            courier.current_location.x,
            firstPoint.location[1],
            firstPoint.location[0]
          );

          return {
            id: order.id,
            order_number: order.order_number,
            distance_km: Math.round(distance * 10) / 10,
            points_count: order.points.length,
            price: order.final_price,
            courier_earnings: order.courier_earnings || Math.round(order.final_price * 0.85),
            urgency: order.urgency,
            created_at: order.created_at,
          };
        }
        return null;
      }).filter(o => o && o.distance_km <= 5);

      orders.sort((a, b) => a.distance_km - b.distance_km);

      res.json(orders);
    } catch (error) {
      console.error('Get available orders error:', error);
      res.status(500).json({ error: 'Ошибка получения заказов' });
    }
  }
);

// Принять заказ
router.post('/orders/:id/accept',
  authenticateToken,
  requireRole(['courier']),
  async (req, res) => {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const courierResult = await client.query(
        'SELECT * FROM couriers WHERE user_id = $1 FOR UPDATE',
        [req.user.userId]
      );

      if (courierResult.rows.length === 0) {
        throw new Error('Профиль курьера не найден');
      }

      const courier = courierResult.rows[0];

      if (!courier.is_online || courier.is_busy) {
        throw new Error('Вы не можете принять заказ');
      }

      const orderResult = await client.query(
        'SELECT * FROM orders WHERE id = $1 AND status = $2 FOR UPDATE',
        [req.params.id, 'searching_courier']
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Заказ не найден или уже принят');
      }

      await client.query(
        'UPDATE orders SET courier_id = $1, status = $2, accepted_at = NOW() WHERE id = $3',
        [req.user.userId, 'accepted', req.params.id]
      );

      await client.query(
        'UPDATE couriers SET is_busy = true WHERE user_id = $1',
        [req.user.userId]
      );

      await client.query('COMMIT');

      res.json({ success: true, order_id: req.params.id });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Accept order error:', error);
      res.status(400).json({ error: error.message || 'Ошибка принятия заказа' });
    } finally {
      client.release();
    }
  }
);

// Обновить статус заказа
router.put('/orders/:id/status',
  authenticateToken,
  requireRole(['courier']),
  body('status').isIn(['courier_arrived', 'picked_up', 'in_transit', 'delivered']),
  async (req, res) => {
    const { status } = req.body;

    try {
      const orderResult = await db.query(
        'SELECT * FROM orders WHERE id = $1 AND courier_id = $2',
        [req.params.id, req.user.userId]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Заказ не найден' });
      }

      const updateFields = ['status = $1', 'updated_at = NOW()'];
      const values = [status];
      let paramCount = 2;

      if (status === 'picked_up') {
        updateFields.push(`picked_up_at = NOW()`);
      } else if (status === 'delivered') {
        updateFields.push(`delivered_at = NOW()`);
      }

      values.push(req.params.id);

      await db.query(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        values
      );

      if (status === 'delivered') {
        await db.query(
          'UPDATE orders SET status = $1, completed_at = NOW() WHERE id = $2',
          ['completed', req.params.id]
        );

        await db.query(
          'UPDATE couriers SET is_busy = false, completed_orders = completed_orders + 1 WHERE user_id = $1',
          [req.user.userId]
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Ошибка обновления статуса' });
    }
  }
);

module.exports = router;
