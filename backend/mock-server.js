const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// In-memory хранилище для тестирования
const mockDB = {
  users: [],
  orders: [],
  couriers: [],
  notifications: [],
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'mock',
    message: 'Mock server для тестирования без PostgreSQL'
  });
});

// Mock Auth
app.post('/api/v1/auth/send-code', (req, res) => {
  const { phone } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  console.log(`📱 SMS код для ${phone}: ${code}`);

  res.json({
    success: true,
    message: 'Код отправлен (проверьте логи сервера)',
    debug_code: code // Только для тестирования!
  });
});

app.post('/api/v1/auth/verify-code', (req, res) => {
  const { phone, code } = req.body;

  // Принимаем любой 6-значный код для тестирования
  if (code && code.length === 6) {
    const userId = `user_${Date.now()}`;
    const user = {
      id: userId,
      phone,
      role: 'client',
      created_at: new Date().toISOString()
    };

    mockDB.users.push(user);

    const token = Buffer.from(JSON.stringify({ userId, phone, role: 'client' })).toString('base64');

    res.json({
      success: true,
      access_token: token,
      refresh_token: token,
      user: {
        id: userId,
        phone,
        role: 'client'
      }
    });
  } else {
    res.status(400).json({ error: 'Неверный код' });
  }
});

// Mock Orders
app.post('/api/v1/orders', (req, res) => {
  const { points, description, weight_kg, urgency, payment_method } = req.body;

  if (!points || points.length < 2) {
    return res.status(400).json({ error: 'Минимум 2 точки' });
  }

  // Простой расчёт цены
  const distance = points.length * 2; // Примерно 2км на точку
  let basePrice = 240;
  if (distance > 2) {
    basePrice += (distance - 2) * 40;
  }

  const finalPrice = Math.round(basePrice * 1.2); // С коэффициентами

  const order = {
    id: `order_${Date.now()}`,
    order_number: `BG${Date.now().toString().slice(-8)}`,
    status: 'searching_courier',
    points,
    description,
    weight_kg,
    urgency: urgency || 'normal',
    payment_method,
    base_price: basePrice,
    final_price: finalPrice,
    created_at: new Date().toISOString()
  };

  mockDB.orders.push(order);

  console.log(`📦 Создан заказ ${order.order_number} на ${finalPrice}₽`);

  res.status(201).json({
    order_id: order.id,
    order_number: order.order_number,
    status: 'searching_courier',
    price: finalPrice,
    message: 'Заказ создан (mock режим)'
  });
});

app.get('/api/v1/orders', (req, res) => {
  res.json({
    orders: mockDB.orders,
    total: mockDB.orders.length
  });
});

// Mock Notifications
app.get('/api/v1/notifications', (req, res) => {
  res.json({
    notifications: mockDB.notifications,
    unread_count: mockDB.notifications.filter(n => !n.read).length,
    total: mockDB.notifications.length
  });
});

// Mock Couriers
app.post('/api/v1/couriers/register', (req, res) => {
  const { first_name, last_name, transport_type, city } = req.body;

  const courier = {
    id: `courier_${Date.now()}`,
    name: `${first_name} ${last_name}`,
    transport_type,
    city,
    verification_status: 'pending',
    created_at: new Date().toISOString()
  };

  mockDB.couriers.push(courier);

  console.log(`🚴 Зарегистрирован курьер: ${courier.name}`);

  res.status(201).json({
    success: true,
    message: 'Профиль курьера создан (mock режим)',
    courier_id: courier.id
  });
});

// Mock Admin
app.get('/api/v1/admin/dashboard', (req, res) => {
  res.json({
    total_clients: mockDB.users.filter(u => u.role === 'client').length,
    total_couriers: mockDB.couriers.length,
    orders_today: mockDB.orders.length,
    orders_pending: mockDB.orders.filter(o => o.status === 'searching_courier').length,
    revenue_today: mockDB.orders.reduce((sum, o) => sum + o.final_price, 0)
  });
});

// Список всех эндпоинтов
app.get('/api/v1/endpoints', (req, res) => {
  res.json({
    message: 'Mock API для тестирования БегуДоставка',
    endpoints: [
      'GET /health',
      'POST /api/v1/auth/send-code',
      'POST /api/v1/auth/verify-code',
      'POST /api/v1/orders',
      'GET /api/v1/orders',
      'GET /api/v1/notifications',
      'POST /api/v1/couriers/register',
      'GET /api/v1/admin/dashboard',
      'GET /api/v1/endpoints'
    ],
    note: 'Это mock-версия для тестирования без PostgreSQL. Данные хранятся в памяти и сбрасываются при перезапуске.'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint не найден',
    available_endpoints: '/api/v1/endpoints'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Mock сервер БегуДоставка запущен!');
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📋 Список эндпоинтов: http://localhost:${PORT}/api/v1/endpoints`);
  console.log('');
  console.log('⚠️  Это mock-версия для тестирования без PostgreSQL');
  console.log('💾 Данные хранятся в памяти и сбросятся при перезапуске');
  console.log('');
  console.log('Для полной версии установите PostgreSQL и используйте npm run dev');
  console.log('');
});
