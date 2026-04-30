const db = require('../config/database');

const auditLog = (action, resourceType = null) => {
  return async (req, res, next) => {
    // Сохраняем оригинальные методы
    const originalJson = res.json;
    const originalSend = res.send;

    // Переопределяем res.json
    res.json = function(data) {
      // Логируем только успешные операции
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAudit(req, action, resourceType, data).catch(err => {
          console.error('Audit log error:', err);
        });
      }
      return originalJson.call(this, data);
    };

    // Переопределяем res.send
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAudit(req, action, resourceType, data).catch(err => {
          console.error('Audit log error:', err);
        });
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

const logAudit = async (req, action, resourceType, responseData) => {
  try {
    const userId = req.user?.id || null;
    const resourceId = req.params?.id || responseData?.id || null;

    const details = {
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
      body: sanitizeBody(req.body)
    };

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await db.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, resourceType, resourceId, JSON.stringify(details), ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

// Удаляем чувствительные данные из логов
const sanitizeBody = (body) => {
  if (!body) return null;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'card_number', 'cvv'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
};

// Прямое логирование (для использования вне middleware)
const logAction = async (userId, action, resourceType, resourceId, details) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, resourceType, resourceId, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

module.exports = {
  auditLog,
  logAction
};
