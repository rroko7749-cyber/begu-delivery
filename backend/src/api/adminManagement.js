const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireAdminRole, requirePermission, canManageAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// Получить список всех админов (только для super_admin и admin)
router.get('/', authenticateToken, requirePermission('admins.view'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        a.id,
        a.username,
        a.full_name,
        a.email,
        a.role,
        a.is_active,
        a.created_at,
        a.last_login_at,
        creator.username as created_by_username
      FROM admins a
      LEFT JOIN admins creator ON a.created_by = creator.id
      ORDER BY a.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Создать нового админа (только для super_admin и admin)
router.post('/', authenticateToken, requirePermission('admins.create'), async (req, res) => {
  try {
    const { username, password, full_name, email, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password and role are required' });
    }

    // Проверяем, может ли текущий админ создать админа с такой ролью
    if (!canManageAdmin(req.admin.role, role)) {
      return res.status(403).json({
        error: 'You cannot create admin with this role',
        your_role: req.admin.role,
        target_role: role
      });
    }

    // Проверяем допустимые роли
    const validRoles = ['super_admin', 'admin', 'manager', 'support', 'analyst'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Только super_admin может создавать других super_admin
    if (role === 'super_admin' && req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super_admin can create other super_admins' });
    }

    // Проверяем, не существует ли уже такой username
    const existing = await db.query('SELECT id FROM admins WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаём админа
    const result = await db.query(`
      INSERT INTO admins (username, password_hash, full_name, email, role, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, full_name, email, role, is_active, created_at
    `, [username, passwordHash, full_name, email, role, req.admin.id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить админа
router.put('/:id', authenticateToken, requirePermission('admins.update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, is_active } = req.body;

    // Получаем текущего админа
    const targetAdmin = await db.query('SELECT role FROM admins WHERE id = $1', [id]);
    if (targetAdmin.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Проверяем права на изменение
    if (!canManageAdmin(req.admin.role, targetAdmin.rows[0].role)) {
      return res.status(403).json({ error: 'You cannot manage this admin' });
    }

    // Если меняется роль, проверяем права
    if (role && role !== targetAdmin.rows[0].role) {
      if (!canManageAdmin(req.admin.role, role)) {
        return res.status(403).json({ error: 'You cannot assign this role' });
      }
    }

    // Нельзя деактивировать самого себя
    if (id === req.admin.id && is_active === false) {
      return res.status(400).json({ error: 'You cannot deactivate yourself' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramIndex}`);
      values.push(full_name);
      paramIndex++;
    }

    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }

    if (role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(`
      UPDATE admins
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, full_name, email, role, is_active, updated_at
    `, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удалить админа
router.delete('/:id', authenticateToken, requirePermission('admins.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Нельзя удалить самого себя
    if (id === req.admin.id) {
      return res.status(400).json({ error: 'You cannot delete yourself' });
    }

    // Получаем админа для проверки прав
    const targetAdmin = await db.query('SELECT role FROM admins WHERE id = $1', [id]);
    if (targetAdmin.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Проверяем права на удаление
    if (!canManageAdmin(req.admin.role, targetAdmin.rows[0].role)) {
      return res.status(403).json({ error: 'You cannot delete this admin' });
    }

    await db.query('DELETE FROM admins WHERE id = $1', [id]);

    res.json({ success: true, message: 'Admin deleted' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Сбросить пароль админа
router.post('/:id/reset-password', authenticateToken, requirePermission('admins.update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Получаем админа для проверки прав
    const targetAdmin = await db.query('SELECT role FROM admins WHERE id = $1', [id]);
    if (targetAdmin.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Проверяем права
    if (!canManageAdmin(req.admin.role, targetAdmin.rows[0].role)) {
      return res.status(403).json({ error: 'You cannot reset password for this admin' });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    await db.query(
      'UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, id]
    );

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
