const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Получить чат по заказу
router.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Проверяем что пользователь участник заказа
    const orderCheck = await db.query(
      'SELECT client_id, courier_id FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderCheck.rows[0];
    if (order.client_id !== userId && order.courier_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Получаем или создаём чат
    let chat = await db.query(
      'SELECT * FROM chats WHERE order_id = $1',
      [orderId]
    );

    if (chat.rows.length === 0 && order.courier_id) {
      // Создаём чат если курьер назначен
      const newChat = await db.query(
        `INSERT INTO chats (order_id, client_id, courier_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [orderId, order.client_id, order.courier_id]
      );
      chat = newChat;
    }

    if (chat.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not available yet' });
    }

    res.json(chat.rows[0]);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить сообщения чата
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    // Проверяем доступ к чату
    const chatCheck = await db.query(
      'SELECT * FROM chats WHERE id = $1 AND (client_id = $2 OR courier_id = $2)',
      [chatId, userId]
    );

    if (chatCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Получаем сообщения
    const messages = await db.query(
      `SELECT cm.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.chat_id = $1
       ORDER BY cm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [chatId, limit, offset]
    );

    // Отмечаем сообщения как прочитанные
    await db.query(
      `UPDATE chat_messages
       SET read = TRUE
       WHERE chat_id = $1 AND sender_id != $2 AND read = FALSE`,
      [chatId, userId]
    );

    res.json({
      messages: messages.rows.reverse(),
      total: messages.rows.length
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Отправить сообщение
router.post('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { message, type = 'text', attachment_url } = req.body;

    if (!message && !attachment_url) {
      return res.status(400).json({ error: 'Message or attachment required' });
    }

    // Проверяем доступ к чату
    const chatCheck = await db.query(
      'SELECT * FROM chats WHERE id = $1 AND (client_id = $2 OR courier_id = $2)',
      [chatId, userId]
    );

    if (chatCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const chat = chatCheck.rows[0];

    // Создаём сообщение
    const newMessage = await db.query(
      `INSERT INTO chat_messages (chat_id, sender_id, message, type, attachment_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [chatId, userId, message || '', type, attachment_url]
    );

    // Обновляем время последнего обновления чата
    await db.query(
      'UPDATE chats SET updated_at = NOW() WHERE id = $1',
      [chatId]
    );

    // Отправляем уведомление получателю
    const recipientId = userId === chat.client_id ? chat.courier_id : chat.client_id;

    await db.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        recipientId,
        'new_message',
        'Новое сообщение',
        message ? message.substring(0, 100) : 'Вложение',
        JSON.stringify({ chat_id: chatId, message_id: newMessage.rows[0].id })
      ]
    );

    // Получаем полную информацию о сообщении
    const fullMessage = await db.query(
      `SELECT cm.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.id = $1`,
      [newMessage.rows[0].id]
    );

    res.status(201).json(fullMessage.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить список чатов пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await db.query(
      `SELECT
        c.*,
        o.order_number,
        o.status as order_status,
        CASE
          WHEN c.client_id = $1 THEN courier.name
          ELSE client.name
        END as other_user_name,
        CASE
          WHEN c.client_id = $1 THEN courier.avatar_url
          ELSE client.avatar_url
        END as other_user_avatar,
        (SELECT COUNT(*) FROM chat_messages
         WHERE chat_id = c.id AND sender_id != $1 AND read = FALSE) as unread_count,
        (SELECT message FROM chat_messages
         WHERE chat_id = c.id
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chat_messages
         WHERE chat_id = c.id
         ORDER BY created_at DESC LIMIT 1) as last_message_at
       FROM chats c
       JOIN orders o ON c.order_id = o.id
       JOIN users client ON c.client_id = client.id
       JOIN users courier ON c.courier_id = courier.id
       WHERE c.client_id = $1 OR c.courier_id = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    );

    res.json(chats.rows);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
