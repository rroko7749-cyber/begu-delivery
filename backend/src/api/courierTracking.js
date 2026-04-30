const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Получить всех курьеров с их текущими координатами
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        c.user_id,
        u.phone,
        u.name,
        c.is_online,
        c.is_busy,
        c.latitude,
        c.longitude,
        c.last_location_update,
        c.completed_orders,
        COUNT(DISTINCT CASE WHEN o.created_at::date = CURRENT_DATE THEN o.id END) as orders_today
      FROM couriers c
      INNER JOIN users u ON u.id = c.user_id
      LEFT JOIN orders o ON o.courier_id = c.user_id
      WHERE c.verification_status = 'approved'
      GROUP BY c.user_id, u.phone, u.name, c.is_online, c.is_busy, c.latitude, c.longitude, c.last_location_update, c.completed_orders
      ORDER BY c.is_online DESC, u.name
    `);

    const couriers = result.rows.map(row => ({
      id: row.user_id,
      name: row.name || row.phone,
      phone: row.phone,
      status: row.is_online && !row.is_busy ? 'active' : 'idle',
      lat: row.latitude ? parseFloat(row.latitude) : null,
      lng: row.longitude ? parseFloat(row.longitude) : null,
      last_update: row.last_location_update,
      current_order: row.is_busy ? 'В работе' : null,
      orders_today: parseInt(row.orders_today) || 0
    }));

    res.json(couriers);
  } catch (error) {
    console.error('Get courier tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить координаты курьера (для мобильного приложения)
router.post('/update-location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const courierId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    await db.query(
      `UPDATE couriers
       SET latitude = $1, longitude = $2, last_location_update = NOW()
       WHERE id = $3`,
      [latitude, longitude, courierId]
    );

    // Отправить обновление через WebSocket всем подключенным админам
    if (global.wss) {
      const message = JSON.stringify({
        type: 'courier_location_update',
        courier_id: courierId,
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        status: req.user.status || 'idle',
        timestamp: new Date().toISOString()
      });

      global.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update courier location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить историю перемещений курьера
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    let query = `
      SELECT
        latitude,
        longitude,
        created_at
      FROM courier_location_history
      WHERE courier_id = $1
    `;
    const params = [id];

    if (date) {
      query += ` AND created_at::date = $2`;
      params.push(date);
    } else {
      query += ` AND created_at >= NOW() - INTERVAL '24 hours'`;
    }

    query += ` ORDER BY created_at ASC`;

    const result = await db.query(query, params);

    const history = result.rows.map(row => ({
      lat: parseFloat(row.latitude),
      lng: parseFloat(row.longitude),
      timestamp: row.created_at
    }));

    res.json(history);
  } catch (error) {
    console.error('Get courier history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
