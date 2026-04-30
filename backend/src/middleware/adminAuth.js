const db = require('../config/database');

// Иерархия ролей (от высшего к низшему)
const ROLE_HIERARCHY = {
  super_admin: 5,
  admin: 4,
  manager: 3,
  support: 2,
  analyst: 1
};

// Права доступа для каждой роли
const ROLE_PERMISSIONS = {
  super_admin: ['*'], // Полный доступ ко всему
  admin: [
    'admins.view',
    'admins.create',
    'admins.update',
    'admins.delete',
    'users.view',
    'users.update',
    'users.delete',
    'couriers.view',
    'couriers.verify',
    'orders.view',
    'orders.update',
    'support.view',
    'support.update',
    'promocodes.view',
    'promocodes.create',
    'promocodes.update',
    'referrals.view',
    'referrals.update',
    'settings.view',
    'settings.update',
    'audit.view',
    'stats.view'
  ],
  manager: [
    'users.view',
    'couriers.view',
    'couriers.verify',
    'orders.view',
    'orders.update',
    'promocodes.view',
    'promocodes.create',
    'promocodes.update',
    'referrals.view',
    'stats.view'
  ],
  support: [
    'support.view',
    'support.update',
    'orders.view',
    'users.view'
  ],
  analyst: [
    'stats.view',
    'orders.view',
    'users.view',
    'audit.view'
  ]
};

// Middleware для проверки роли админа
const requireAdminRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Получаем роль админа из БД
      const result = await db.query(
        'SELECT role, is_active FROM admins WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Admin not found' });
      }

      const admin = result.rows[0];

      if (!admin.is_active) {
        return res.status(403).json({ error: 'Admin account is disabled' });
      }

      // Проверяем, есть ли роль админа в списке разрешённых
      if (!allowedRoles.includes(admin.role)) {
        return res.status(403).json({
          error: 'Access denied',
          required_role: allowedRoles,
          your_role: admin.role
        });
      }

      // Добавляем роль в req для дальнейшего использования
      req.admin = {
        id: req.user.id,
        username: req.user.username,
        role: admin.role
      };

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Middleware для проверки конкретного разрешения
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Получаем роль админа
      const result = await db.query(
        'SELECT role, is_active FROM admins WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Admin not found' });
      }

      const admin = result.rows[0];

      if (!admin.is_active) {
        return res.status(403).json({ error: 'Admin account is disabled' });
      }

      // Суперадмин имеет все права
      if (admin.role === 'super_admin') {
        req.admin = {
          id: req.user.id,
          username: req.user.username,
          role: admin.role
        };
        return next();
      }

      // Проверяем разрешение для роли
      const permissions = ROLE_PERMISSIONS[admin.role] || [];

      if (!permissions.includes(permission)) {
        return res.status(403).json({
          error: 'Permission denied',
          required_permission: permission,
          your_role: admin.role
        });
      }

      req.admin = {
        id: req.user.id,
        username: req.user.username,
        role: admin.role
      };

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Проверка, может ли админ управлять другим админом
const canManageAdmin = (managerRole, targetRole) => {
  const managerLevel = ROLE_HIERARCHY[managerRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;

  // Можно управлять только теми, кто ниже по иерархии
  return managerLevel > targetLevel;
};

module.exports = {
  requireAdminRole,
  requirePermission,
  canManageAdmin,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS
};
