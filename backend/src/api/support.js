const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Создать тикет
router.post('/tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, category, order_id, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message required' });
    }

    // Создаём тикет
    const ticket = await db.query(
      `INSERT INTO support_tickets (user_id, order_id, subject, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, order_id || null, subject, category || 'general']
    );

    // Добавляем первое сообщение
    await db.query(
      `INSERT INTO support_messages (ticket_id, sender_id, message)
       VALUES ($1, $2, $3)`,
      [ticket.rows[0].id, userId, message]
    );

    res.status(201).json(ticket.rows[0]);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить список тикетов
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT
        t.*,
        u.name as user_name,
        u.phone as user_phone,
        (SELECT COUNT(*) FROM support_messages WHERE ticket_id = t.id) as message_count,
        (SELECT message FROM support_messages
         WHERE ticket_id = t.id
         ORDER BY created_at DESC LIMIT 1) as last_message
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      WHERE t.user_id = $1
    `;

    const params = [userId];

    if (status) {
      query += ' AND t.status = $2';
      params.push(status);
    }

    query += ' ORDER BY t.updated_at DESC';

    const tickets = await db.query(query, params);
    res.json(tickets.rows);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить тикет по ID
router.get('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ticket = await db.query(
      `SELECT t.*, u.name as user_name, u.phone as user_phone
       FROM support_tickets t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket.rows[0]);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить сообщения тикета
router.get('/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Проверяем доступ
    const ticketCheck = await db.query(
      'SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await db.query(
      `SELECT sm.*, u.name as sender_name, u.role as sender_role
       FROM support_messages sm
       JOIN users u ON sm.sender_id = u.id
       WHERE sm.ticket_id = $1 AND sm.is_internal = FALSE
       ORDER BY sm.created_at ASC`,
      [id]
    );

    res.json(messages.rows);
  } catch (error) {
    console.error('Get ticket messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Добавить сообщение в тикет
router.post('/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { message, attachment_url } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Проверяем доступ
    const ticketCheck = await db.query(
      'SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Добавляем сообщение
    const newMessage = await db.query(
      `INSERT INTO support_messages (ticket_id, sender_id, message, attachment_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, userId, message, attachment_url || null]
    );

    // Обновляем время тикета
    await db.query(
      'UPDATE support_tickets SET updated_at = NOW() WHERE id = $1',
      [id]
    );

    res.status(201).json(newMessage.rows[0]);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Закрыть тикет
router.put('/tickets/:id/close', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      `UPDATE support_tickets
       SET status = 'closed', closed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Получить все тикеты
router.get('/admin/tickets', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin', 'support'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, priority } = req.query;

    let query = `
      SELECT
        t.*,
        u.name as user_name,
        u.phone as user_phone,
        admin.name as assigned_to_name,
        (SELECT COUNT(*) FROM support_messages WHERE ticket_id = t.id) as message_count
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users admin ON t.assigned_to = admin.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      query += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    query += ' ORDER BY t.priority DESC, t.created_at DESC';

    const tickets = await db.query(query, params);
    res.json(tickets.rows);
  } catch (error) {
    console.error('Admin get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Назначить тикет
router.put('/admin/tickets/:id/assign', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin', 'support'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { assigned_to } = req.body;

    const result = await db.query(
      `UPDATE support_tickets
       SET assigned_to = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [assigned_to || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN: Изменить статус/приоритет тикета
router.put('/admin/tickets/:id', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'super_admin', 'support'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { status, priority } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;

      if (status === 'closed') {
        updates.push(`closed_at = NOW()`);
      }
    }

    if (priority) {
      updates.push(`priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await db.query(
      `UPDATE support_tickets
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
