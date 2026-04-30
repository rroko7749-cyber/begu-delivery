const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Применить промокод к заказу
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code, order_id } = req.body;

    if (!code || !order_id) {
      return res.status(400).json({ error: 'Code and order_id required' });
    }

    // Получаем промокод
    const promoResult = await db.query(
      `SELECT * FROM promo_codes
       WHERE code = $1 AND is_active = TRUE`,
      [code.toUpperCase()]
    );

    if (promoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Промокод не найден или неактивен' });
    }

    const promo = promoResult.rows[0];

    // Проверяем срок действия
    const now = new Date();
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return res.status(400).json({ error: 'Промокод ещё не активен' });
    }
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return res.status(400).json({ error: 'Промокод истёк' });
    }

    // Проверяем лимит использований
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return res.status(400).json({ error: 'Промокод исчерпан' });
    }

    // Проверяем лимит на пользователя
    const userUsageResult = await db.query(
      'SELECT COUNT(*) as count FROM promo_code_uses WHERE promo_code_id = $1 AND user_id = $2',
      [promo.id, userId]
    );

    if (parseInt(userUsageResult.rows[0].count) >= promo.user_limit) {
      return res.status(400).json({ error: 'Вы уже использовали этот промокод' });
    }

    // Получаем заказ
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND client_id = $2',
      [order_id, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];

    // Проверяем минимальную сумму заказа
    if (promo.min_order_amount && order.final_price < promo.min_order_amount) {
      return res.status(400).json({
        error: `Минимальная сумма заказа для этого промокода: ${promo.min_order_amount}₽`
      });
    }

    // Рассчитываем скидку
    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = (order.final_price * promo.discount_value) / 100;
    } else if (promo.discount_type === 'fixed') {
      discountAmount = promo.discount_value;
    }

    // Применяем максимальную скидку
    if (promo.max_discount && discountAmount > promo.max_discount) {
      discountAmount = promo.max_discount;
    }

    // Скидка не может быть больше суммы заказа
    if (discountAmount > order.final_price) {
      discountAmount = order.final_price;
    }

    // Начинаем транзакцию
    await db.query('BEGIN');

    try {
      // Обновляем заказ
      const newPrice = order.final_price - discountAmount;
      await db.query(
        'UPDATE orders SET final_price = $1, client_bonus = $2 WHERE id = $3',
        [newPrice, discountAmount, order_id]
      );

      // Записываем использование промокода
      await db.query(
        `INSERT INTO promo_code_uses (promo_code_id, user_id, order_id, discount_amount)
         VALUES ($1, $2, $3, $4)`,
        [promo.id, userId, order_id, discountAmount]
      );

      // Увеличиваем счётчик использований
      await db.query(
        'UPDATE promo_codes SET usage_count = usage_count + 1 WHERE id = $1',
        [promo.id]
      );

      await db.query('COMMIT');

      res.json({
        success: true,
        discount_amount: discountAmount,
        new_price: newPrice,
        original_price: order.final_price
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Apply promo code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Проверить промокод (без применения)
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { code, order_amount } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code required' });
    }

    const promoResult = await db.query(
      `SELECT * FROM promo_codes
       WHERE code = $1 AND is_active = TRUE`,
      [code.toUpperCase()]
    );

    if (promoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Промокод не найден' });
    }

    const promo = promoResult.rows[0];

    // Проверки
    const now = new Date();
    const errors = [];

    if (promo.valid_from && new Date(promo.valid_from) > now) {
      errors.push('Промокод ещё не активен');
    }
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      errors.push('Промокод истёк');
    }
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      errors.push('Промокод исчерпан');
    }
    if (promo.min_order_amount && order_amount && order_amount < promo.min_order_amount) {
      errors.push(`Минимальная сумма заказа: ${promo.min_order_amount}₽`);
    }

    // Рассчитываем потенциальную скидку
    let discountAmount = 0;
    if (order_amount) {
      if (promo.discount_type === 'percentage') {
        discountAmount = (order_amount * promo.discount_value) / 100;
      } else if (promo.discount_type === 'fixed') {
        discountAmount = promo.discount_value;
      }

      if (promo.max_discount && discountAmount > promo.max_discount) {
        discountAmount = promo.max_discount;
      }
      if (discountAmount > order_amount) {
        discountAmount = order_amount;
      }
    }

    res.json({
      valid: errors.length === 0,
      errors,
      promo: {
        code: promo.code,
        type: promo.type,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        min_order_amount: promo.min_order_amount,
        max_discount: promo.max_discount
      },
      estimated_discount: discountAmount
    });
  } catch (error) {
    console.error('Validate promo code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Создать промокод
router.post('/admin/create', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      code,
      type,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount,
      usage_limit,
      user_limit,
      valid_from,
      valid_until
    } = req.body;

    if (!code || !type || !discount_type || !discount_value) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.query(
      `INSERT INTO promo_codes (
        code, type, discount_type, discount_value,
        min_order_amount, max_discount, usage_limit, user_limit,
        valid_from, valid_until, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        code.toUpperCase(),
        type,
        discount_type,
        discount_value,
        min_order_amount || null,
        max_discount || null,
        usage_limit || null,
        user_limit || 1,
        valid_from || null,
        valid_until || null,
        req.user.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Промокод уже существует' });
    }
    console.error('Create promo code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Список промокодов
router.get('/admin/list', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { is_active, type } = req.query;

    let query = `
      SELECT p.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM promo_code_uses WHERE promo_code_id = p.id) as actual_usage
      FROM promo_codes p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
      query += ` AND p.is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    if (type) {
      query += ` AND p.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('List promo codes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Обновить промокод
router.put('/admin/:id', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { is_active, usage_limit, valid_until } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(is_active);
      paramIndex++;
    }

    if (usage_limit !== undefined) {
      updates.push(`usage_limit = $${paramIndex}`);
      params.push(usage_limit);
      paramIndex++;
    }

    if (valid_until !== undefined) {
      updates.push(`valid_until = $${paramIndex}`);
      params.push(valid_until);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(id);

    const result = await db.query(
      `UPDATE promo_codes SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update promo code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Статистика промокода
router.get('/admin/:id/stats', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const stats = await db.query(
      `SELECT
        COUNT(*) as total_uses,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(discount_amount) as total_discount,
        AVG(discount_amount) as avg_discount
       FROM promo_code_uses
       WHERE promo_code_id = $1`,
      [id]
    );

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Promo code stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
