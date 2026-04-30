const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Генерация уникального реферального кода
const generateReferralCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let exists = true;

  while (exists) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const result = await db.query(
      'SELECT id FROM users WHERE referral_code = $1',
      [code]
    );
    exists = result.rows.length > 0;
  }

  return code;
};

// Получить свой реферальный код
router.get('/my-code', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    let user = await db.query(
      'SELECT referral_code FROM users WHERE id = $1',
      [userId]
    );

    // Если кода нет - генерируем
    if (!user.rows[0].referral_code) {
      const code = await generateReferralCode();
      await db.query(
        'UPDATE users SET referral_code = $1 WHERE id = $2',
        [code, userId]
      );
      user = await db.query(
        'SELECT referral_code FROM users WHERE id = $1',
        [userId]
      );
    }

    res.json({ referral_code: user.rows[0].referral_code });
  } catch (error) {
    console.error('Get referral code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Применить реферальный код
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { referral_code } = req.body;

    if (!referral_code) {
      return res.status(400).json({ error: 'Referral code required' });
    }

    // Проверяем что пользователь ещё не использовал реферальный код
    const currentUser = await db.query(
      'SELECT referred_by FROM users WHERE id = $1',
      [userId]
    );

    if (currentUser.rows[0].referred_by) {
      return res.status(400).json({ error: 'Вы уже использовали реферальный код' });
    }

    // Находим владельца реферального кода
    const referrer = await db.query(
      'SELECT id, referral_code FROM users WHERE referral_code = $1',
      [referral_code.toUpperCase()]
    );

    if (referrer.rows.length === 0) {
      return res.status(404).json({ error: 'Реферальный код не найден' });
    }

    const referrerId = referrer.rows[0].id;

    // Нельзя использовать свой код
    if (referrerId === userId) {
      return res.status(400).json({ error: 'Нельзя использовать свой реферальный код' });
    }

    // Получаем настройки бонусов
    const settings = await db.query(
      `SELECT value FROM system_settings WHERE key IN ('referral_bonus_referrer', 'referral_bonus_referee')`
    );

    let referrerBonus = 100; // По умолчанию 100₽
    let refereeBonus = 50;   // По умолчанию 50₽

    settings.rows.forEach(row => {
      if (row.key === 'referral_bonus_referrer') {
        referrerBonus = parseFloat(row.value);
      } else if (row.key === 'referral_bonus_referee') {
        refereeBonus = parseFloat(row.value);
      }
    });

    // Начинаем транзакцию
    await db.query('BEGIN');

    try {
      // Устанавливаем реферера
      await db.query(
        'UPDATE users SET referred_by = $1 WHERE id = $2',
        [referrerId, userId]
      );

      // Начисляем бонус рефереру
      await db.query(
        'UPDATE users SET balance = balance + $1, referral_bonus = referral_bonus + $1 WHERE id = $2',
        [referrerBonus, referrerId]
      );

      // Начисляем бонус новому пользователю
      await db.query(
        'UPDATE users SET balance = balance + $1, referral_bonus = referral_bonus + $1 WHERE id = $2',
        [refereeBonus, userId]
      );

      // Создаём уведомления
      await db.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          referrerId,
          'referral_bonus',
          'Реферальный бонус!',
          `Вы получили ${referrerBonus}₽ за приглашение друга`,
          JSON.stringify({ amount: referrerBonus })
        ]
      );

      await db.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          'referral_bonus',
          'Бонус за регистрацию!',
          `Вы получили ${refereeBonus}₽ за использование реферального кода`,
          JSON.stringify({ amount: refereeBonus })
        ]
      );

      await db.query('COMMIT');

      res.json({
        success: true,
        bonus_received: refereeBonus,
        referrer_bonus: referrerBonus
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Apply referral code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Статистика рефералов
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await db.query(
      `SELECT
        COUNT(*) as total_referrals,
        SUM(CASE WHEN u.total_orders > 0 THEN 1 ELSE 0 END) as active_referrals,
        (SELECT referral_bonus FROM users WHERE id = $1) as total_earned
       FROM users u
       WHERE u.referred_by = $1`,
      [userId]
    );

    const referrals = await db.query(
      `SELECT id, name, phone, created_at, total_orders
       FROM users
       WHERE referred_by = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      stats: stats.rows[0],
      referrals: referrals.rows
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Настройки реферальной программы
router.get('/admin/settings', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const settings = await db.query(
      `SELECT * FROM system_settings WHERE key LIKE 'referral_%'`
    );

    res.json(settings.rows);
  } catch (error) {
    console.error('Get referral settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Обновить настройки
router.put('/admin/settings', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { referral_bonus_referrer, referral_bonus_referee } = req.body;

    if (referral_bonus_referrer !== undefined) {
      await db.query(
        `INSERT INTO system_settings (key, value, description, updated_by)
         VALUES ('referral_bonus_referrer', $1, 'Бонус для пригласившего', $2)
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_by = $2, updated_at = NOW()`,
        [JSON.stringify(referral_bonus_referrer), req.user.id]
      );
    }

    if (referral_bonus_referee !== undefined) {
      await db.query(
        `INSERT INTO system_settings (key, value, description, updated_by)
         VALUES ('referral_bonus_referee', $1, 'Бонус для приглашённого', $2)
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_by = $2, updated_at = NOW()`,
        [JSON.stringify(referral_bonus_referee), req.user.id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update referral settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Статистика реферальной программы
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await db.query(
      `SELECT
        COUNT(DISTINCT referred_by) as total_referrers,
        COUNT(*) as total_referrals,
        SUM(referral_bonus) as total_bonuses_paid,
        AVG(referral_bonus) as avg_bonus_per_user
       FROM users
       WHERE referred_by IS NOT NULL`
    );

    const topReferrers = await db.query(
      `SELECT
        u.id, u.name, u.phone, u.referral_code,
        COUNT(r.id) as referral_count,
        u.referral_bonus as total_earned
       FROM users u
       LEFT JOIN users r ON r.referred_by = u.id
       WHERE u.referral_code IS NOT NULL
       GROUP BY u.id
       ORDER BY referral_count DESC
       LIMIT 10`
    );

    res.json({
      overall: stats.rows[0],
      top_referrers: topReferrers.rows
    });
  } catch (error) {
    console.error('Admin referral stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
