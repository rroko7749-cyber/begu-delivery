const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// Получить мой профиль
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, phone, email, name, role, status, avatar_url, rating, total_orders, balance, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
});

// Обновить профиль
router.put('/me',
  authenticateToken,
  body('name').optional().isLength({ min: 2, max: 255 }),
  body('email').optional().isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    values.push(req.user.userId);

    try {
      const result = await db.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING id, phone, email, name, role, avatar_url, rating`,
        values
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Ошибка обновления профиля' });
    }
  }
);

// Загрузить аватар
router.post('/me/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar_url } = req.body;

    if (!avatar_url) {
      return res.status(400).json({ error: 'Avatar URL required' });
    }

    // В реальном приложении здесь была бы загрузка файла в S3
    // Сейчас просто сохраняем URL
    const result = await db.query(
      'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, avatar_url',
      [avatar_url, req.user.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Получить профиль пользователя по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, role, avatar_url, rating, total_orders, created_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Ошибка получения пользователя' });
  }
});

module.exports = router;
