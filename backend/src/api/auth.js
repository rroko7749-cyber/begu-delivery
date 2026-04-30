const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { client: redis } = require('../config/redis');
const { sendSMS } = require('../services/sms');
const { authenticateToken } = require('../middleware/auth');

const smsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: 'Можно отправить только 1 SMS в минуту',
});

// Отправить SMS код
router.post('/send-code',
  smsLimiter,
  body('phone').matches(/^\+7\d{10}$/).withMessage('Неверный формат телефона'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await redis.setEx(`sms:${phone}`, 600, code);
      await redis.setEx(`sms:attempts:${phone}`, 600, '0');

      await sendSMS(phone, `Ваш код: ${code}\nБегуДоставка`);

      res.json({ success: true, message: 'Код отправлен' });
    } catch (error) {
      console.error('Send SMS error:', error);
      res.status(500).json({ error: 'Ошибка отправки SMS' });
    }
  }
);

// Проверить код и войти
router.post('/verify-code',
  body('phone').matches(/^\+7\d{10}$/),
  body('code').isLength({ min: 6, max: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, code } = req.body;

    try {
      const attempts = parseInt(await redis.get(`sms:attempts:${phone}`) || '0');
      if (attempts >= 3) {
        return res.status(429).json({ error: 'Превышено количество попыток' });
      }

      const savedCode = await redis.get(`sms:${phone}`);
      if (!savedCode) {
        return res.status(400).json({ error: 'Код истёк или не был отправлен' });
      }

      if (savedCode !== code) {
        await redis.setEx(`sms:attempts:${phone}`, 600, (attempts + 1).toString());
        return res.status(400).json({ error: 'Неверный код' });
      }

      let user = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);

      if (user.rows.length === 0) {
        const result = await db.query(
          'INSERT INTO users (phone, phone_verified, role) VALUES ($1, true, $2) RETURNING *',
          [phone, 'client']
        );
        user = result;
      } else {
        await db.query('UPDATE users SET phone_verified = true, last_login_at = NOW() WHERE phone = $1', [phone]);
      }

      const userData = user.rows[0];

      const accessToken = jwt.sign(
        { userId: userData.id, role: userData.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY }
      );

      const refreshToken = jwt.sign(
        { userId: userData.id, role: userData.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY }
      );

      await redis.del(`sms:${phone}`);
      await redis.del(`sms:attempts:${phone}`);

      res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        user: {
          id: userData.id,
          phone: userData.phone,
          name: userData.name,
          role: userData.role,
          rating: userData.rating,
        },
      });
    } catch (error) {
      console.error('Verify code error:', error);
      res.status(500).json({ error: 'Ошибка авторизации' });
    }
  }
);

// Обновить токен
router.post('/refresh',
  body('refresh_token').notEmpty(),
  async (req, res) => {
    const { refresh_token } = req.body;

    try {
      const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);

      const accessToken = jwt.sign(
        { userId: decoded.userId, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY }
      );

      res.json({
        access_token: accessToken,
        token_type: 'Bearer',
      });
    } catch (error) {
      res.status(403).json({ error: 'Недействительный refresh token' });
    }
  }
);

// Logout (добавить токен в blacklist)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token) {
      // Получаем время жизни токена
      const decoded = jwt.decode(token);
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

      // Добавляем токен в blacklist на время его жизни
      if (expiresIn > 0) {
        await redis.setEx(`blacklist:${token}`, expiresIn, '1');
      }
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
