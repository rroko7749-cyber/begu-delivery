const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ADMIN: Получить все настройки
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const settings = await db.query(
      `SELECT s.*, u.name as updated_by_name
       FROM system_settings s
       LEFT JOIN users u ON s.updated_by = u.id
       ORDER BY s.key`
    );

    res.json(settings.rows);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Получить настройку по ключу
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { key } = req.params;

    const result = await db.query(
      'SELECT * FROM system_settings WHERE key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Установить/обновить настройку
router.put('/:key', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { key } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value required' });
    }

    const result = await db.query(
      `INSERT INTO system_settings (key, value, description, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO UPDATE
       SET value = $2, description = COALESCE($3, system_settings.description),
           updated_by = $4, updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value), description, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Удалить настройку
router.delete('/:key', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { key } = req.params;

    const result = await db.query(
      'DELETE FROM system_settings WHERE key = $1 RETURNING *',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Получить логи аудита
router.get('/audit/logs', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      user_id,
      action,
      resource_type,
      limit = 100,
      offset = 0
    } = req.query;

    let query = `
      SELECT a.*, u.name as user_name, u.phone as user_phone
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (user_id) {
      query += ` AND a.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    if (action) {
      query += ` AND a.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (resource_type) {
      query += ` AND a.resource_type = $${paramIndex}`;
      params.push(resource_type);
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const logs = await db.query(query, params);

    // Получаем общее количество
    let countQuery = 'SELECT COUNT(*) FROM audit_logs WHERE 1=1';
    const countParams = [];
    let countIndex = 1;

    if (user_id) {
      countQuery += ` AND user_id = $${countIndex}`;
      countParams.push(user_id);
      countIndex++;
    }

    if (action) {
      countQuery += ` AND action = $${countIndex}`;
      countParams.push(action);
      countIndex++;
    }

    if (resource_type) {
      countQuery += ` AND resource_type = $${countIndex}`;
      countParams.push(resource_type);
      countIndex++;
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      logs: logs.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Статистика аудита
router.get('/audit/stats', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await db.query(`
      SELECT
        COUNT(*) as total_logs,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT action) as unique_actions,
        MIN(created_at) as first_log,
        MAX(created_at) as last_log
      FROM audit_logs
    `);

    const actionStats = await db.query(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `);

    const userStats = await db.query(`
      SELECT u.name, u.phone, COUNT(a.id) as action_count
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      GROUP BY u.id, u.name, u.phone
      ORDER BY action_count DESC
      LIMIT 10
    `);

    res.json({
      overall: stats.rows[0],
      top_actions: actionStats.rows,
      top_users: userStats.rows
    });
  } catch (error) {
    console.error('Audit stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
