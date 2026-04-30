const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./config/database');
const { connectRedis } = require('./config/redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Слишком много запросов, попробуйте позже',
});
app.use(limiter);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', require('./api/auth'));
app.use('/api/v1/admin-auth', require('./api/adminAuth'));
app.use('/api/v1/admin-management', require('./api/adminManagement'));
app.use('/api/v1/users', require('./api/users'));
app.use('/api/v1/orders', require('./api/orders'));
app.use('/api/v1/order-actions', require('./api/orderActions'));
app.use('/api/v1/couriers', require('./api/couriers'));
app.use('/api/v1/courier-tracking', require('./api/courierTracking'));
app.use('/api/v1/payments', require('./api/payments'));
app.use('/api/v1/admin', require('./api/admin'));
app.use('/api/v1/notifications', require('./api/notifications'));
app.use('/api/v1/chats', require('./api/chats'));
app.use('/api/v1/support', require('./api/support'));
app.use('/api/v1/promo-codes', require('./api/promoCodes'));
app.use('/api/v1/referrals', require('./api/referrals'));
app.use('/api/v1/settings', require('./api/settings'));
app.use('/api/v1/push', require('./api/pushNotifications'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера',
  });
});

// WebSocket setup
const socketAuth = require('./middleware/socketAuth');
io.use(socketAuth);

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.userId}`);

  // Присоединиться к комнате заказа
  socket.on('join:order', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`User ${socket.userId} joined order ${orderId}`);
  });

  // Покинуть комнату заказа
  socket.on('leave:order', (orderId) => {
    socket.leave(`order:${orderId}`);
  });

  // Присоединиться к комнате чата
  socket.on('join:chat', (chatId) => {
    socket.join(`chat:${chatId}`);
    console.log(`User ${socket.userId} joined chat ${chatId}`);
  });

  // Покинуть комнату чата
  socket.on('leave:chat', (chatId) => {
    socket.leave(`chat:${chatId}`);
  });

  // Обновление локации курьера
  socket.on('courier:location', async (data) => {
    const { lat, lng, orderId } = data;

    try {
      // Обновляем локацию в БД
      await db.query(
        'UPDATE couriers SET current_location_lat = $1, current_location_lng = $2 WHERE user_id = $3',
        [lat, lng, socket.userId]
      );

      // Отправляем обновление клиенту
      if (orderId) {
        io.to(`order:${orderId}`).emit('courier:location:update', { lat, lng });
      }
    } catch (error) {
      console.error('Location update error:', error);
    }
  });

  // Курьер онлайн/оффлайн
  socket.on('courier:status', async (isOnline) => {
    try {
      await db.query(
        'UPDATE couriers SET is_online = $1 WHERE user_id = $2',
        [isOnline, socket.userId]
      );
    } catch (error) {
      console.error('Status update error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.userId}`);
  });
});

// Экспортируем io для использования в других модулях
app.set('io', io);

// Start server
const startServer = async () => {
  try {
    // Подключаем Redis (опционально)
    try {
      await connectRedis();
    } catch (error) {
      console.log('⚠️  Starting without Redis');
    }

    // Проверяем подключение к БД
    await db.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Создаём таблицу админов
    const { createAdminTable } = require('./utils/migrateAdmins');
    await createAdminTable();

    // Добавляем поля для отслеживания курьеров
    const { addCourierLocationFields } = require('./utils/migrateCourierLocation');
    await addCourierLocationFields();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
