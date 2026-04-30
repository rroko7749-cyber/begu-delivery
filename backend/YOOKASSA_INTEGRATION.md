# Интеграция с ЮKassa - Инструкция

## Настройка

### 1. Получение учётных данных

1. Зарегистрируйтесь на [yookassa.ru](https://yookassa.ru)
2. Создайте магазин в личном кабинете
3. Получите:
   - `shopId` - ID магазина
   - `secretKey` - Секретный ключ

### 2. Настройка .env

Добавьте в `.env` файл:

```env
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
FRONTEND_URL=http://localhost:19006
```

### 3. Настройка Webhook

В личном кабинете ЮKassa настройте webhook:

**URL:** `https://your-domain.com/api/v1/payments/webhook/yookassa`

**События:**
- `payment.succeeded` - Успешная оплата
- `payment.canceled` - Отмена платежа
- `refund.succeeded` - Успешный возврат

## API Endpoints

### 1. Оплата заказа картой

**POST** `/api/v1/payments/order/:orderId`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "return_url": "https://your-app.com/orders/123"
}
```

**Response:**
```json
{
  "success": true,
  "payment_id": "2d8f5c8e-000f-5000-8000-1234567890ab",
  "confirmation_url": "https://yoomoney.ru/checkout/payments/v2/contract?orderId=...",
  "amount": 350
}
```

**Использование:**
1. Клиент создаёт заказ
2. Клиент вызывает этот эндпоинт
3. Получает `confirmation_url`
4. Открывает URL в браузере/WebView
5. Пользователь оплачивает
6. ЮKassa отправляет webhook
7. Статус заказа обновляется автоматически

### 2. Оплата депозита курьера

**POST** `/api/v1/payments/deposit`

**Headers:**
```
Authorization: Bearer <token>
```

**Role:** `courier`

**Body:**
```json
{
  "return_url": "https://your-app.com/courier/verification"
}
```

**Response:**
```json
{
  "success": true,
  "payment_id": "2d8f5c8e-000f-5000-8000-1234567890ab",
  "confirmation_url": "https://yoomoney.ru/checkout/payments/v2/contract?orderId=...",
  "amount": 5000
}
```

### 3. Проверка статуса платежа

**GET** `/api/v1/payments/:paymentId/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "payment_id": "2d8f5c8e-000f-5000-8000-1234567890ab",
  "status": "succeeded",
  "paid": true,
  "amount": 350
}
```

**Статусы:**
- `pending` - Ожидает оплаты
- `waiting_for_capture` - Ожидает подтверждения
- `succeeded` - Успешно оплачен
- `canceled` - Отменён

### 4. Вывод средств курьером

**POST** `/api/v1/payments/withdraw`

**Headers:**
```
Authorization: Bearer <token>
```

**Role:** `courier`

**Body:**
```json
{
  "amount": 1000,
  "card_number": "1234567812345678"
}
```

**Response:**
```json
{
  "success": true,
  "amount": 1000,
  "message": "Выплата будет обработана в течение 1-3 рабочих дней"
}
```

**Примечание:** Для выплат нужен отдельный договор с ЮKassa. Пока используется упрощённая схема.

### 5. История платежей

**GET** `/api/v1/payments/history`

**Headers:**
```
Authorization: Bearer <token>
```

**Query params:**
- `limit` (default: 50)
- `offset` (default: 0)
- `type` (optional: order, deposit, withdrawal, refund)

**Response:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "type": "order",
      "amount": 350,
      "method": "card",
      "status": "completed",
      "description": "Оплата заказа #BG12345678",
      "created_at": "2026-04-29T13:00:00Z",
      "completed_at": "2026-04-29T13:01:00Z"
    }
  ],
  "total": 10
}
```

## Обработка наличных платежей

Для заказов с `payment_method: "cash"`:

1. Курьер принимает наличные от клиента
2. При завершении заказа с баланса курьера списывается комиссия (15%)
3. Остальное остаётся курьеру

**Пример:**
- Заказ: 1000₽ наличными
- Комиссия: 150₽ (15%)
- Курьер получает: 850₽
- С баланса курьера списывается: 150₽

**Важно:** Курьер должен иметь депозит 5000₽ для работы с наличными.

## Возврат средств

Возврат происходит автоматически при:
- Отмене заказа клиентом (до принятия курьером)
- Автоотмене через 10 минут (курьер не найден)

**Процесс:**
1. Система создаёт запись о возврате в БД
2. Вызывается `createRefund()` из сервиса ЮKassa
3. ЮKassa возвращает деньги на карту клиента
4. Webhook подтверждает возврат

## Webhook обработка

**URL:** `/api/v1/payments/webhook/yookassa`

**Метод:** POST

**Обрабатываемые события:**

### payment.succeeded
```json
{
  "type": "payment.succeeded",
  "event": "payment.succeeded",
  "object": {
    "id": "2d8f5c8e-000f-5000-8000-1234567890ab",
    "status": "succeeded",
    "paid": true,
    "amount": {
      "value": "350.00",
      "currency": "RUB"
    },
    "metadata": {
      "order_id": "uuid"
    }
  }
}
```

**Действия:**
1. Обновляет статус платежа в БД
2. Обновляет статус заказа (если оплата заказа)
3. Отправляет уведомление пользователю (если депозит)

### payment.canceled
```json
{
  "type": "payment.canceled",
  "event": "payment.canceled",
  "object": {
    "id": "2d8f5c8e-000f-5000-8000-1234567890ab",
    "status": "canceled"
  }
}
```

**Действия:**
1. Обновляет статус платежа в БД
2. Отменяет заказ (если оплата заказа)

### refund.succeeded
```json
{
  "type": "refund.succeeded",
  "event": "refund.succeeded",
  "object": {
    "id": "2d8f5c8e-000f-5000-8000-1234567890ab",
    "payment_id": "original_payment_id",
    "status": "succeeded",
    "amount": {
      "value": "350.00",
      "currency": "RUB"
    }
  }
}
```

**Действия:**
1. Обновляет статус возврата в БД
2. Отправляет уведомление клиенту

## Тестирование

### Тестовые карты ЮKassa

**Успешная оплата:**
- Номер: `5555 5555 5555 4477`
- Срок: любой будущий
- CVC: любой
- 3DS: `12345`

**Отклонённая оплата:**
- Номер: `5555 5555 5555 5599`

### Тестовый режим

В тестовом режиме используйте тестовые ключи из личного кабинета ЮKassa.

## Безопасность

1. **Никогда не храните** номера карт в БД (только последние 4 цифры)
2. **Проверяйте подпись** webhook от ЮKassa
3. **Используйте HTTPS** для production
4. **Храните ключи** в переменных окружения, не в коде

## Troubleshooting

### Ошибка: "Ошибка создания платежа"
- Проверьте `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY`
- Убедитесь что магазин активирован в ЮKassa

### Webhook не приходит
- Проверьте URL webhook в настройках ЮKassa
- Убедитесь что сервер доступен из интернета
- Проверьте логи сервера

### Платёж завис в статусе "pending"
- Проверьте статус вручную через GET `/payments/:id/status`
- Возможно пользователь не завершил оплату

## Дополнительные возможности

### Рекуррентные платежи
Для подписок можно настроить автоплатежи через ЮKassa.

### Сплит-платежи
Для автоматического распределения средств между платформой и курьерами.

### Холдирование средств
Для блокировки средств до завершения заказа.

## Документация ЮKassa

- [API Reference](https://yookassa.ru/developers/api)
- [SDK для Node.js](https://github.com/yoomoney/yookassa-sdk-nodejs)
- [Webhook](https://yookassa.ru/developers/using-api/webhooks)
