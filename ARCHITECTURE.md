# Архитектура системы БегуДоставка

## Общая схема

```
┌─────────────────────────────────────────────────────────────┐
│                    КЛИЕНТЫ                                   │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Клиент App   │ Курьер App   │ Админ Web    │ Поддержка Web  │
│ (iOS/Android)│ (iOS/Android)│ (React)      │ (React)        │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                            │
                    ┌───────▼────────┐
                    │   API Gateway  │
                    │   (Rate limit, │
                    │    Auth check) │
                    └───────┬────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
┌──────▼──────┐    ┌────────▼────────┐   ┌──────▼──────┐
│   Orders    │    │   Users/Auth    │   │  Payments   │
│   Service   │    │    Service      │   │   Service   │
└──────┬──────┘    └────────┬────────┘   └──────┬──────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
       ┌──────▼──────┐           ┌────────▼────────┐
       │  PostgreSQL │           │     Redis       │
       │  (Primary)  │           │  (Cache/Queue)  │
       └─────────────┘           └─────────────────┘
```

---

## Backend архитектура

### Микросервисы (или монолит на старте)

**Рекомендация:** Начать с монолита, потом разделить на микросервисы.

#### Монолит (MVP, первые 6 месяцев)
```
backend/
├── src/
│   ├── api/              # REST API endpoints
│   │   ├── auth/
│   │   ├── orders/
│   │   ├── users/
│   │   ├── payments/
│   │   └── admin/
│   ├── services/         # Бизнес-логика
│   │   ├── pricing/
│   │   ├── matching/     # Поиск курьеров
│   │   ├── notifications/
│   │   └── analytics/
│   ├── models/           # База данных
│   ├── utils/            # Вспомогательные функции
│   └── config/           # Конфигурация
├── tests/
└── package.json
```

#### Микросервисы (при масштабировании)
```
services/
├── auth-service/         # Аутентификация
├── order-service/        # Заказы
├── user-service/         # Пользователи
├── payment-service/      # Платежи
├── notification-service/ # Уведомления
├── matching-service/     # Поиск курьеров
└── analytics-service/    # Аналитика
```

---

## Технологический стек

### Backend

**Язык:** Node.js + TypeScript (или Python + FastAPI)

**Почему Node.js:**
- Быстрая разработка
- Большая экосистема
- WebSocket для реального времени
- Хорошо для I/O операций

**Фреймворк:** Express.js / Fastify

**API:** REST + WebSocket (для трекинга в реальном времени)

### База данных

**Основная:** PostgreSQL 15+
- Надёжность
- ACID транзакции
- PostGIS для геолокации
- JSON поддержка

**Кэш:** Redis
- Сессии пользователей
- Кэш частых запросов
- Очереди задач
- Pub/Sub для уведомлений

**Поиск:** Elasticsearch (опционально, для логов)

### Файловое хранилище

**S3-совместимое:**
- AWS S3 / Cloudflare R2 / MinIO
- Фото документов
- Фото доставок
- Аватары

### Очереди

**Redis Queue / BullMQ:**
- Отправка SMS
- Отправка email
- Обработка платежей
- Генерация отчётов

---

## Frontend архитектура

### Мобильные приложения

**Технология:** React Native

**Структура:**
```
mobile/
├── src/
│   ├── screens/          # Экраны
│   │   ├── client/
│   │   ├── courier/
│   │   └── common/
│   ├── components/       # Компоненты
│   ├── navigation/       # Навигация
│   ├── services/         # API клиенты
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── orders.ts
│   │   └── websocket.ts
│   ├── store/            # State management (Redux/Zustand)
│   ├── utils/
│   └── config/
├── android/
├── ios/
└── package.json
```

**Библиотеки:**
- React Navigation - навигация
- React Native Maps - карты
- Socket.io-client - WebSocket
- Axios - HTTP запросы
- Redux Toolkit / Zustand - состояние
- React Native Push Notification - уведомления

### Веб-приложения (Админ/Поддержка)

**Технология:** React.js + TypeScript

**Структура:**
```
web/
├── src/
│   ├── pages/            # Страницы
│   │   ├── Dashboard/
│   │   ├── Orders/
│   │   ├── Users/
│   │   ├── Analytics/
│   │   └── Support/
│   ├── components/       # Компоненты
│   ├── services/         # API
│   ├── store/            # State
│   └── utils/
└── package.json
```

**UI библиотека:** Material-UI / Ant Design

---

## API дизайн

### REST API

**Базовый URL:** `https://api.begudelivery.ru/v1`

**Аутентификация:** Bearer JWT токен

#### Основные endpoints:

**Auth:**
```
POST   /auth/send-code          # Отправить SMS код
POST   /auth/verify-code        # Проверить код
POST   /auth/refresh            # Обновить токен
POST   /auth/logout             # Выход
```

**Users:**
```
GET    /users/me                # Мой профиль
PUT    /users/me                # Обновить профиль
POST   /users/me/avatar         # Загрузить аватар
GET    /users/:id               # Профиль пользователя
```

**Orders:**
```
POST   /orders                  # Создать заказ
GET    /orders                  # Список заказов
GET    /orders/:id              # Детали заказа
PUT    /orders/:id/cancel       # Отменить заказ
PUT    /orders/:id/status       # Обновить статус
POST   /orders/:id/rating       # Оценить заказ
```

**Couriers:**
```
GET    /couriers/available      # Доступные заказы
PUT    /couriers/me/status      # Онлайн/оффлайн
PUT    /couriers/me/location    # Обновить геолокацию
POST   /couriers/orders/:id/accept  # Принять заказ
```

**Payments:**
```
POST   /payments/card           # Оплата картой
POST   /payments/withdraw       # Вывод средств
GET    /payments/history        # История платежей
```

**Admin:**
```
GET    /admin/dashboard         # Статистика
GET    /admin/orders            # Все заказы
GET    /admin/users             # Все пользователи
PUT    /admin/users/:id/verify  # Верифицировать курьера
```

### WebSocket

**URL:** `wss://api.begudelivery.ru/ws`

**События:**

**Клиент слушает:**
```javascript
// Обновление статуса заказа
socket.on('order:status', (data) => {
  // { orderId, status, courierLocation }
});

// Новое сообщение в чате
socket.on('chat:message', (data) => {
  // { chatId, message, sender }
});

// Курьер прибыл
socket.on('courier:arrived', (data) => {
  // { orderId, pointId }
});
```

**Курьер слушает:**
```javascript
// Новый заказ рядом
socket.on('order:new', (data) => {
  // { orderId, distance, price }
});

// Заказ отменён
socket.on('order:cancelled', (data) => {
  // { orderId, reason }
});
```

**Курьер отправляет:**
```javascript
// Обновление геолокации (каждые 5 сек)
socket.emit('location:update', {
  lat: 55.7558,
  lng: 37.6173
});
```

---

## Безопасность

### Аутентификация и авторизация

**JWT токены:**
```javascript
{
  access_token: "eyJhbGc...",  // 15 минут
  refresh_token: "eyJhbGc...", // 30 дней
  token_type: "Bearer"
}
```

**Payload:**
```javascript
{
  userId: "uuid",
  role: "client" | "courier" | "admin" | "support",
  iat: 1234567890,
  exp: 1234567890
}
```

**Middleware проверки:**
```javascript
// Проверка токена
app.use('/api/*', authenticateToken);

// Проверка роли
app.use('/api/admin/*', requireRole(['admin']));
```

### Rate limiting

```javascript
// Общий лимит
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // 100 запросов
}));

// Лимит на SMS
app.use('/auth/send-code', rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 1 // 1 SMS в минуту
}));
```

### Защита от SQL injection

```javascript
// Используем параметризованные запросы
db.query(
  'SELECT * FROM users WHERE phone = $1',
  [phone]
);
```

### XSS защита

```javascript
// Helmet.js
app.use(helmet());

// Санитизация входных данных
const sanitized = validator.escape(userInput);
```

### CORS

```javascript
app.use(cors({
  origin: [
    'https://begudelivery.ru',
    'https://admin.begudelivery.ru'
  ],
  credentials: true
}));
```

---

## Масштабирование

### Горизонтальное масштабирование

**Load Balancer (Nginx):**
```
                    ┌──────────┐
                    │  Nginx   │
                    │  (LB)    │
                    └────┬─────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
   │ API #1  │      │ API #2  │     │ API #3  │
   └─────────┘      └─────────┘     └─────────┘
```

**Конфигурация Nginx:**
```nginx
upstream api_backend {
    least_conn;
    server api1:3000;
    server api2:3000;
    server api3:3000;
}

server {
    listen 443 ssl;
    server_name api.begudelivery.ru;
    
    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

### База данных

**Репликация (Master-Slave):**
```
┌──────────┐
│  Master  │ ◄─── Запись
└────┬─────┘
     │ Репликация
     ├──────────┬──────────┐
┌────▼────┐ ┌───▼─────┐ ┌──▼──────┐
│ Slave 1 │ │ Slave 2 │ │ Slave 3 │ ◄─── Чтение
└─────────┘ └─────────┘ └─────────┘
```

**Шардинг (при очень большой нагрузке):**
- По городам
- По ID пользователя

### Кэширование

**Уровни кэша:**

1. **Application cache (Redis):**
   - Профили пользователей (TTL: 5 мин)
   - Список активных заказов (TTL: 30 сек)
   - Настройки системы (TTL: 1 час)

2. **CDN cache (Cloudflare):**
   - Статические файлы
   - Изображения
   - API responses (для публичных данных)

3. **Database query cache:**
   - Частые запросы
   - Агрегации

---

## Мониторинг и логирование

### Метрики (Prometheus + Grafana)

**Что мониторим:**
- CPU, RAM, Disk
- Количество запросов в секунду
- Время ответа API
- Количество ошибок
- Количество активных пользователей
- Количество заказов в час

**Алерты:**
- CPU > 80% → уведомление
- Ошибки > 5% → критичный алерт
- API response time > 1s → предупреждение

### Логирование (ELK Stack)

**Elasticsearch + Logstash + Kibana**

**Что логируем:**
- Все API запросы
- Ошибки
- Действия пользователей
- Изменения в заказах
- Платежи

**Формат лога:**
```json
{
  "timestamp": "2026-04-29T02:30:00Z",
  "level": "info",
  "service": "order-service",
  "userId": "uuid",
  "action": "order_created",
  "orderId": "uuid",
  "metadata": {
    "price": 936,
    "points": 3
  }
}
```

### Error tracking (Sentry)

- Автоматический отлов ошибок
- Stack traces
- Контекст ошибки
- Уведомления в Telegram

---

## CI/CD

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: docker build -t api .
      - run: docker push registry/api:latest
      
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: ssh server "docker pull registry/api:latest"
      - run: ssh server "docker-compose up -d"
```

### Окружения

- **Development** - для разработки
- **Staging** - для тестирования
- **Production** - боевой сервер

---

## Инфраструктура

### Минимальная конфигурация (старт)

**1 сервер (Hetzner CPX31):**
- 4 vCPU
- 8 GB RAM
- 160 GB SSD
- €12/мес

**Что на нём:**
- API (Node.js)
- PostgreSQL
- Redis
- Nginx

### Масштабированная конфигурация (10k заказов/день)

**3 API сервера** (по €12/мес) = €36/мес
**1 Database сервер** (€24/мес)
**1 Redis сервер** (€12/мес)
**CDN** (Cloudflare, бесплатно)

**Итого:** ~€72/мес ($80/мес)

---

## Резюме архитектуры

✅ **Монолит на старте** → микросервисы при росте  
✅ **PostgreSQL + Redis** → надёжность + скорость  
✅ **React Native** → iOS + Android из одной базы  
✅ **WebSocket** → трекинг в реальном времени  
✅ **Горизонтальное масштабирование** → готовы к росту  
✅ **Мониторинг** → видим всё что происходит  
✅ **CI/CD** → быстрые деплои  

**Архитектура готова! Можем начинать разработку.**
