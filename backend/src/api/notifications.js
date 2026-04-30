const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// Получить уведомления пользователя
router.get('/',
  authenticateToken,
  async (req, res) => {
    const { limit = 50, offset = 0, unread_only = false } = req.query;

    try {
      let query = 'SELECT * FROM notifications WHERE user_id = $1';
      const values = [req.user.userId];

      if (unread_only === 'true') {
        query += ' AND read = false';
      }

      query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      values.push(limit, offset);

      const result = await db.query(query, values);

      // Получаем количество непрочитанных
      const unreadResult = await db.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
        [req.user.userId]
      );

      res.json({
        notifications: result.rows,
        unread_count: parseInt(unreadResult.rows[0].count),
        total: result.rows.length
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Ошибка получения уведомлений' });
    }
  }
);

// Отметить уведомление как прочитанное
router.put('/:id/read',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await db.query(
        'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [req.params.id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Уведомление не найдено' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ error: 'Ошибка обновления уведомления' });
    }
  }
);

// Отметить все уведомления как прочитанные
router.put('/read-all',
  authenticateToken,
  async (req, res) => {
    try {
      await db.query(
        'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
        [req.user.userId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Mark all read error:', error);
      res.status(500).json({ error: 'Ошибка обновления уведомлений' });
    }
  }
);

// Удалить уведомление
router.delete('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await db.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
        [req.params.id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Уведомление не найдено' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: 'Ошибка удаления уведомления' });
    }
  }
);

module.exports = router;
