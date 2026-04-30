# Быстрый старт - Mock сервер

## Что это?

Mock-сервер для тестирования БегуДоставка **БЕЗ** установки PostgreSQL, Redis и других зависимостей.

Данные хранятся в памяти и сбрасываются при перезапуске.

## Запуск

```bash
cd C:\bat\delivery-app\backend
npm run mock
```

Сервер запустится на http://localhost:3000

## Доступные эндпоинты

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Список всех эндпоинтов
```bash
curl http://localhost:3000/api/v1/endpoints
```

### 3. Регистрация (отправка SMS)
```bash
curl -X POST http://localhost:3000/api/v1/auth/send-code \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"+79991234567\"}"
```

**Код будет в ответе и в логах!**

### 4. Верификация кода
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-code \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"+79991234567\", \"code\": \"123456\"}"
```

Получишь токен (base64 строка).

### 5. Создать заказ
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{
    \"points\": [
      {
        \"address\": \"Москва, ул. Ленина, 1\",
        \"location\": {\"lat\": 55.751244, \"lng\": 37.618423},
        \"type\": \"pickup\",
        \"contact_name\": \"Иван\",
        \"contact_phone\": \"+79991234567\"
      },
      {
        \"address\": \"Москва, ул. Пушкина, 10\",
        \"location\": {\"lat\": 55.761244, \"lng\": 37.628423},
        \"type\": \"delivery\",
        \"contact_name\": \"Мария\",
        \"contact_phone\": \"+79997654321\"
      }
    ],
    \"description\": \"Документы\",
    \"weight_kg\": 0.5,
    \"urgency\": \"normal\",
    \"payment_method\": \"cash\"
  }"
```

### 6. Список заказов
```bash
curl http://localhost:3000/api/v1/orders
```

### 7. Регистрация курьера
```bash
curl -X POST http://localhost:3000/api/v1/couriers/register \
  -H "Content-Type: application/json" \
  -d "{
    \"first_name\": \"Иван\",
    \"last_name\": \"Петров\",
    \"transport_type\": \"bicycle\",
    \"city\": \"Москва\"
  }"
```

### 8. Админ панель
```bash
curl http://localhost:3000/api/v1/admin/dashboard
```

## Что работает

✅ Регистрация через SMS (коды в ответе)
✅ Создание заказов
✅ Расчёт цены
✅ Регистрация курьеров
✅ Админ статистика

## Что НЕ работает

❌ Автопоиск курьеров
❌ Коды подтверждения
❌ Реальные платежи
❌ Уведомления
❌ Геолокация
❌ Данные не сохраняются

## Для полной версии

Установи PostgreSQL по инструкции в `SETUP_INSTRUCTIONS.md` и используй:

```bash
npm run dev
```
