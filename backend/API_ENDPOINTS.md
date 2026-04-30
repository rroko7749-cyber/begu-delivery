# API Endpoints - БегуДоставка

## Базовый URL
```
http://localhost:3000/api/v1
```

## Аутентификация

### POST /auth/send-code
Отправить SMS с кодом подтверждения
```json
{
  "phone": "+79991234567"
}
```

### POST /auth/verify-code
Проверить код и получить токены
```json
{
  "phone": "+79991234567",
  "code": "123456"
}
```

### POST /auth/refresh
Обновить access token
```json
{
  "refresh_token": "..."
}
```

---

## Пользователи

### GET /users/me
Получить профиль текущего пользователя
**Headers:** `Authorization: Bearer <token>`

### PUT /users/me
Обновить профиль
**Headers:** `Authorization: Bearer <token>`
```json
{
  "name": "Иван Иванов",
  "email": "ivan@example.com"
}
```

---

## Заказы

### POST /orders
Создать новый заказ
**Headers:** `Authorization: Bearer <token>`
```json
{
  "points": [
    {
      "address": "Москва, ул. Ленина, 1",
      "location": { "lat": 55.751244, "lng": 37.618423 },
      "type": "pickup",
      "contact_name": "Иван",
      "contact_phone": "+79991234567"
    },
    {
      "address": "Москва, ул. Пушкина, 10",
      "location": { "lat": 55.761244, "lng": 37.628423 },
      "type": "delivery",
      "contact_name": "Мария",
      "contact_phone": "+79997654321"
    }
  ],
  "description": "Документы",
  "weight_kg": 0.5,
  "urgency": "normal",
  "payment_method": "card"
}
```

**Response:**
```json
{
  "order_id": "uuid",
  "order_number": "BG12345678",
  "status": "searching_courier",
  "price": 350,
  "pricing_breakdown": {
    "base_price": 240,
    "distance_km": 2.5,
    "time_coefficient": 1.0,
    "weather_coefficient": 1.0,
    "urgency_coefficient": 1.0,
    "weight_surcharge": 0,
    "final_price": 350
  },
  "message": "Заказ создан, ищем курьера..."
}
```

### GET /orders
Получить список заказов пользователя
**Headers:** `Authorization: Bearer <token>`
**Query params:** `status`, `limit`, `offset`

### GET /orders/:id
Получить детали заказа
**Headers:** `Authorization: Bearer <token>`

### POST /orders/:id/cancel
Отменить заказ
**Headers:** `Authorization: Bearer <token>`
```json
{
  "reason": "Передумал"
}
```

### POST /orders/:id/rate
Оценить заказ
**Headers:** `Authorization: Bearer <token>`
```json
{
  "rating": 5,
  "comment": "Отличный курьер!"
}
```

---

## Действия с заказами

### POST /order-actions/:id/increase-price
Повысить цену заказа (после 5 минут поиска)
**Headers:** `Authorization: Bearer <token>`
```json
{
  "new_price": 450
}
```

### POST /order-actions/:id/points/:pointId/confirm
Подтвердить получение/доставку по коду (только курьер)
**Headers:** `Authorization: Bearer <token>`
**Role:** courier
```json
{
  "confirmation_code": "123456"
}
```

---

## Курьеры

### POST /couriers/register
Регистрация курьера (заполнение профиля)
**Headers:** `Authorization: Bearer <token>`
```json
{
  "first_name": "Иван",
  "last_name": "Петров",
  "transport_type": "bicycle",
  "city": "Москва"
}
```

### POST /couriers/me/documents
Загрузка документов курьера
**Headers:** `Authorization: Bearer <token>`
**Content-Type:** `multipart/form-data`
**Fields:**
- `passport` (file, required)
- `driver_license` (file, required for motorcycle/car)
- `vehicle_photo` (file, required for bicycle/motorcycle/car)

### POST /couriers/me/deposit
Внесение депозита 5000₽
**Headers:** `Authorization: Bearer <token>`
```json
{
  "payment_method": "card"
}
```

### PUT /couriers/me/status
Обновить статус онлайн/оффлайн
**Headers:** `Authorization: Bearer <token>`
**Role:** courier
```json
{
  "is_online": true
}
```

### PUT /couriers/me/location
Обновить геолокацию
**Headers:** `Authorization: Bearer <token>`
**Role:** courier
```json
{
  "lat": 55.751244,
  "lng": 37.618423
}
```

### GET /couriers/available
Получить доступные заказы для курьера
**Headers:** `Authorization: Bearer <token>`
**Role:** courier

### POST /couriers/orders/:id/accept
Принять заказ
**Headers:** `Authorization: Bearer <token>`
**Role:** courier

### PUT /couriers/orders/:id/status
Обновить статус заказа
**Headers:** `Authorization: Bearer <token>`
**Role:** courier
```json
{
  "status": "picked_up"
}
```
**Статусы:** `courier_arrived`, `picked_up`, `in_transit`, `delivered`

---

## Уведомления

### GET /notifications
Получить уведомления пользователя
**Headers:** `Authorization: Bearer <token>`
**Query params:**
- `limit` (default: 50)
- `offset` (default: 0)
- `unread_only` (true/false)

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "new_order",
      "title": "Новый заказ рядом с вами!",
      "body": "Заказ #BG12345678 на 350₽ (1.5 км от вас)",
      "data": {
        "order_id": "uuid",
        "order_number": "BG12345678",
        "distance_km": 1.5,
        "price": 350
      },
      "read": false,
      "created_at": "2026-04-29T13:00:00Z"
    }
  ],
  "unread_count": 5,
  "total": 10
}
```

### PUT /notifications/:id/read
Отметить уведомление как прочитанное
**Headers:** `Authorization: Bearer <token>`

### PUT /notifications/read-all
Отметить все уведомления как прочитанные
**Headers:** `Authorization: Bearer <token>`

### DELETE /notifications/:id
Удалить уведомление
**Headers:** `Authorization: Bearer <token>`

---

## Админ панель

### GET /admin/dashboard
Получить статистику
**Headers:** `Authorization: Bearer <token>`
**Role:** admin

### GET /admin/orders
Получить все заказы
**Headers:** `Authorization: Bearer <token>`
**Role:** admin, support
**Query params:** `status`, `limit`, `offset`

### GET /admin/users
Получить всех пользователей
**Headers:** `Authorization: Bearer <token>`
**Role:** admin
**Query params:** `role`, `limit`, `offset`

### GET /admin/couriers/pending
Получить курьеров на проверке
**Headers:** `Authorization: Bearer <token>`
**Role:** admin

### GET /admin/couriers/:id
Получить детали курьера
**Headers:** `Authorization: Bearer <token>`
**Role:** admin

### PUT /admin/users/:id/verify
Верифицировать/отклонить курьера
**Headers:** `Authorization: Bearer <token>`
**Role:** admin
```json
{
  "status": "verified",
  "reason": "Причина отклонения (если rejected)"
}
```

### PUT /admin/users/:id/status
Заблокировать/разблокировать пользователя
**Headers:** `Authorization: Bearer <token>`
**Role:** admin
```json
{
  "status": "blocked"
}
```

---

## Платежи

### POST /payments/card
Оплата картой (TODO: интеграция с ЮKassa)
**Headers:** `Authorization: Bearer <token>`

### POST /payments/withdraw
Вывод средств курьером (TODO)
**Headers:** `Authorization: Bearer <token>`

### GET /payments/history
История платежей (TODO)
**Headers:** `Authorization: Bearer <token>`

---

## Типы уведомлений

- `new_order` - Новый заказ для курьера
- `price_increase_offer` - Предложение повысить цену (через 5 мин)
- `order_cancelled` - Заказ отменён
- `order_accepted` - Заказ принят курьером
- `order_completed` - Заказ выполнен
- `courier_verified` - Курьер верифицирован
- `courier_rejected` - Курьер отклонён

---

## Статусы заказа

1. `pending` - Создан, ожидает оплаты
2. `searching_courier` - Ищем курьера (автоматически)
3. `accepted` - Курьер принял заказ
4. `courier_arrived` - Курьер прибыл на точку отправления
5. `picked_up` - Груз забран
6. `in_transit` - В пути
7. `delivered` - Доставлен (все точки)
8. `completed` - Завершён (оплачен)
9. `cancelled` - Отменён

---

## Коды ошибок

- `400` - Неверные данные
- `401` - Не авторизован
- `403` - Доступ запрещён
- `404` - Не найдено
- `500` - Внутренняя ошибка сервера
