const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { sendPushNotification, sendEventPush } = require('../services/fcm');

// Зарегистрировать FCM токен
router.post('/register-token', authenticateToken, async (req, res) => {
  try {
    const { fcm_token } = req.body;

    if (!fcm_token) {
      return res.status(400).json({ error: 'FCM token required' });
    }

    await db.query(
      'UPDATE users SET fcm_token = $1, updated_at = NOW() WHERE id = $2',
      [fcm_token, req.user.userId]
    );

    res.json({ success: true, message: 'FCM token registered' });
  } catch (error) {
    console.error('Register FCM token error:', error);
    res.status(500).json({ error: 'Failed to register token' });
  }
});

// Удалить FCM токен (при logout)
router.delete('/unregister-token', authenticateToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE users SET fcm_token = NULL, updated_at = NOW() WHERE id = $1',
      [req.user.userId]
    );

    res.json({ success: true, message: 'FCM token unregistered' });
  } catch (error) {
    console.error('Unregister FCM token error:', error);
    res.status(500).json({ error: 'Failed to unregister token' });
  }
});

// Тестовое уведомление
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { title, body } = req.body;

    const result = await sendPushNotification(req.user.userId, {
      title: title || 'Тестовое уведомление',
      body: body || 'Это тестовое push-уведомление от БегуДоставка',
      data: { test: 'true' }
    });

    res.json(result);
  } catch (error) {
    console.error('Test push error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// ADMIN: Отправить уведомление пользователю
router.post('/admin/send', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { user_id, title, body, data } = req.body;

    if (!user_id || !title || !body) {
      return res.status(400).json({ error: 'user_id, title and body required' });
    }

    const result = await sendPushNotification(user_id, {
      title,
      body,
      data: data || {}
    });

    res.json(result);
  } catch (error) {
    console.error('Admin send push error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ADMIN: Отправить broadcast уведомление
router.post('/admin/broadcast', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, body, role, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'title and body required' });
    }

    // Получаем пользователей
    let query = 'SELECT id FROM users WHERE fcm_token IS NOT NULL';
    const params = [];

    if (role) {
      query += ' AND role = $1';
      params.push(role);
    }

    const users = await db.query(query, params);
    const userIds = users.rows.map(u => u.id);

    if (userIds.length === 0) {
      return res.json({ success: false, message: 'No users with FCM tokens found' });
    }

    const { sendPushNotificationToMultiple } = require('../services/fcm');
    const result = await sendPushNotificationToMultiple(userIds, {
      title,
      body,
      data: data || {}
    });

    res.json({
      ...result,
      total_users: userIds.length
    });
  } catch (error) {
    console.error('Broadcast push error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

module.exports = router;
