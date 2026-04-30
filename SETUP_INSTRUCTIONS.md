# Инструкция по настройке сервера для БегуДоставка

## Проблема с автоматической установкой

PostgreSQL не удаётся установить автоматически. Используем альтернативные подходы.

## Вариант 1: Ручная установка PostgreSQL (Рекомендуется)

### Шаг 1: Скачать PostgreSQL
1. Открой браузер
2. Перейди на https://www.postgresql.org/download/windows/
3. Скачай **PostgreSQL 16** (Windows x86-64)
4. Запусти установщик

### Шаг 2: Установка
- **Password для postgres:** `postgres`
- **Port:** `5432`
- **Locale:** `Russian, Russia` или `Default locale`
- Остальное - по умолчанию

### Шаг 3: Создать базу данных
Открой **pgAdmin 4** (установится вместе с PostgreSQL):
1. Подключись к серверу (пароль: `postgres`)
2. Правый клик на **Databases** → **Create** → **Database**
3. Имя: `begudelivery`
4. Owner: `postgres`
5. Сохрани

---

## Вариант 2: Docker (Если установлен Docker)

```bash
# Запустить PostgreSQL в контейнере
docker run --name postgres-begu -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=begudelivery -p 5432:5432 -d postgres:16

# Запустить Redis
docker run --name redis-begu -p 6379:6379 -d redis:7
```

---

## Вариант 3: SQLite (Для быстрого тестирования)

Можно временно использовать SQLite вместо PostgreSQL для тестирования логики (без геолокации).

**Минусы:**
- Нет PostGIS (геолокация)
- Нет полноценных транзакций
- Только для разработки

---

## После установки PostgreSQL

### 1. Настроить .env файл

Создай файл `C:\bat\delivery-app\backend\.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=begudelivery
DB_USER=postgres
DB_PASSWORD=postgres

# Redis (пока можно без него)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=super_secret_key_change_in_production_12345
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# SMS Provider (заглушка для тестирования)
SMS_API_KEY=test_key
SMS_SENDER=BeguDelivery

# Payment (заглушка для тестирования)
YOOKASSA_SHOP_ID=test_shop_id
YOOKASSA_SECRET_KEY=test_secret_key

# Frontend URL
FRONTEND_URL=http://localhost:19006

# Maps (заглушка)
YANDEX_MAPS_API_KEY=test_key

# S3 Storage (заглушка)
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY=test_key
S3_SECRET_KEY=test_secret
S3_BUCKET=begudelivery

# Weather API (заглушка)
WEATHER_API_KEY=test_key

# Commission
COMMISSION_RATE=0.15
```

### 2. Запустить миграцию

```bash
cd C:\bat\delivery-app\backend
npm run migrate
```

Должно вывести:
```
Creating database schema...
✅ Database schema created successfully
Migration completed
```

### 3. Запустить сервер

```bash
npm run dev
```

Должно вывести:
```
✅ Database connected
🚀 Server running on port 3000
```

### 4. Проверить работу

Открой браузер: http://localhost:3000/health

Должно вернуть:
```json
{
  "status": "ok",
  "timestamp": "2026-04-29T14:30:00.000Z"
}
```

---

## Что можно тестировать без внешних сервисов

### ✅ Работает без API ключей:
- Регистрация пользователей (SMS коды будут в логах)
- Создание заказов
- Расчёт цены
- Автопоиск курьеров
- Коды подтверждения
- Уведомления
- История платежей

### ❌ Не работает без API ключей:
- Реальная отправка SMS
- Реальные платежи через ЮKassa
- Загрузка файлов в S3
- Погодные коэффициенты
- Геокодирование адресов

---

## Тестирование через Postman/curl

### 1. Регистрация (отправка SMS кода)

```bash
curl -X POST http://localhost:3000/api/v1/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+79991234567"}'
```

**Код будет в логах сервера!** Ищи строку типа:
```
SMS code for +79991234567: 123456
```

### 2. Верификация кода

```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+79991234567", "code": "123456"}'
```

Получишь токены:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

### 3. Создать заказ

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "points": [
      {
        "address": "Москва, ул. Ленина, 1",
        "location": {"lat": 55.751244, "lng": 37.618423},
        "type": "pickup",
        "contact_name": "Иван",
        "contact_phone": "+79991234567"
      },
      {
        "address": "Москва, ул. Пушкина, 10",
        "location": {"lat": 55.761244, "lng": 37.628423},
        "type": "delivery",
        "contact_name": "Мария",
        "contact_phone": "+79997654321"
      }
    ],
    "description": "Документы",
    "weight_kg": 0.5,
    "urgency": "normal",
    "payment_method": "cash"
  }'
```

---

## Следующие шаги после установки

1. ✅ Установить PostgreSQL
2. ✅ Создать базу данных
3. ✅ Настроить .env
4. ✅ Запустить миграцию
5. ✅ Запустить сервер
6. ✅ Протестировать базовые эндпоинты
7. 🔄 Подключить реальные сервисы (SMS, ЮKassa, S3)

---

## Нужна помощь?

Напиши на каком этапе возникла проблема, и я помогу её решить!
