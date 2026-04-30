# База данных БегуДоставка

## Архитектура

**Основная БД:** PostgreSQL (надёжность, транзакции)  
**Кэш:** Redis (быстрый доступ, сессии)  
**Файлы:** S3-совместимое хранилище (фото, документы)

---

## Схема базы данных

### 1. users (Пользователи)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE,
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    name VARCHAR(255),
    role VARCHAR(20) NOT NULL, -- 'client', 'courier', 'admin', 'support'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'blocked', 'deleted'
    avatar_url TEXT,
    rating DECIMAL(3,2) DEFAULT 5.0,
    total_orders INTEGER DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0, -- для курьеров (депозит/долг)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);
```

### 2. couriers (Курьеры - расширение users)
```sql
CREATE TABLE couriers (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    transport_type VARCHAR(20), -- 'foot', 'bicycle', 'motorcycle', 'car'
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    
    -- Документы
    passport_photo_url TEXT,
    driver_license_url TEXT,
    vehicle_photo_url TEXT,
    
    -- Рабочая зона
    work_zone JSONB, -- {city: 'Moscow', districts: ['Center', 'North']}
    current_location POINT, -- PostGIS для геолокации
    
    -- Статус работы
    is_online BOOLEAN DEFAULT FALSE,
    is_busy BOOLEAN DEFAULT FALSE,
    
    -- Статистика
    completed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_online (is_online),
    INDEX idx_location USING GIST (current_location)
);
```

### 3. orders (Заказы)
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL, -- человекочитаемый номер
    
    -- Участники
    client_id UUID NOT NULL REFERENCES users(id),
    courier_id UUID REFERENCES users(id),
    
    -- Статус
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- 'pending' -> 'searching_courier' -> 'accepted' -> 
    -- 'courier_arrived' -> 'picked_up' -> 'in_transit' -> 
    -- 'delivered' -> 'completed' / 'cancelled'
    
    -- Цена
    base_price DECIMAL(10,2) NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    client_bonus DECIMAL(10,2) DEFAULT 0, -- доплата от клиента
    pricing_factors JSONB, -- все коэффициенты для прозрачности
    
    -- Оплата
    payment_method VARCHAR(20), -- 'cash', 'card', 'balance'
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
    commission DECIMAL(10,2), -- комиссия сервиса
    courier_earnings DECIMAL(10,2), -- заработок курьера
    
    -- Детали
    description TEXT,
    weight_kg DECIMAL(5,2),
    urgency VARCHAR(20) DEFAULT 'normal', -- 'normal', 'fast', 'express'
    
    -- Время
    created_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    delivered_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Отмена
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    
    INDEX idx_client (client_id),
    INDEX idx_courier (courier_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at DESC)
);
```

### 4. order_points (Точки маршрута)
```sql
CREATE TABLE order_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL, -- порядок точек
    
    -- Адрес
    address TEXT NOT NULL,
    location POINT NOT NULL,
    
    -- Тип
    type VARCHAR(20) NOT NULL, -- 'pickup', 'delivery'
    
    -- Контакт
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Статус
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'arrived', 'completed'
    arrived_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Подтверждение
    confirmation_code VARCHAR(6), -- код для подтверждения
    confirmation_photo_url TEXT,
    notes TEXT,
    
    INDEX idx_order (order_id, sequence),
    INDEX idx_location USING GIST (location)
);
```

### 5. payments (Платежи)
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    type VARCHAR(20) NOT NULL, -- 'order', 'deposit', 'withdrawal', 'commission'
    amount DECIMAL(10,2) NOT NULL,
    
    method VARCHAR(20), -- 'cash', 'card', 'balance', 'bank_transfer'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    
    -- Для онлайн-платежей
    payment_provider VARCHAR(50), -- 'yookassa', 'stripe'
    provider_payment_id VARCHAR(255),
    
    description TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    INDEX idx_order (order_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);
```

### 6. ratings (Рейтинги и отзывы)
```sql
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    
    from_user_id UUID NOT NULL REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(order_id, from_user_id, to_user_id),
    INDEX idx_to_user (to_user_id)
);
```

### 7. chats (Чаты)
```sql
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    
    participants UUID[] NOT NULL, -- массив user_id
    
    created_at TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP,
    
    INDEX idx_order (order_id),
    INDEX idx_participants USING GIN (participants)
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    
    sender_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_chat (chat_id, created_at DESC)
);
```

### 8. support_tickets (Обращения в поддержку)
```sql
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    assigned_to UUID REFERENCES users(id), -- сотрудник поддержки
    
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50), -- 'order_issue', 'payment', 'courier', 'technical', 'other'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_assigned (assigned_to)
);

CREATE TABLE support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    sender_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    
    is_internal BOOLEAN DEFAULT FALSE, -- внутренняя заметка
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_ticket (ticket_id, created_at)
);
```

### 9. promo_codes (Промокоды)
```sql
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    
    type VARCHAR(20) NOT NULL, -- 'discount_percent', 'discount_fixed', 'free_delivery'
    value DECIMAL(10,2) NOT NULL,
    
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_code (code),
    INDEX idx_active (is_active)
);

CREATE TABLE promo_code_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    
    discount_amount DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(promo_code_id, user_id, order_id)
);
```

### 10. notifications (Уведомления)
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    type VARCHAR(50) NOT NULL, -- 'order_update', 'payment', 'message', 'promo'
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    
    data JSONB, -- дополнительные данные
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    sent_via VARCHAR(20)[], -- ['push', 'sms', 'email']
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_user (user_id, created_at DESC),
    INDEX idx_unread (user_id, is_read)
);
```

### 11. audit_logs (Логи действий)
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'order', 'user', 'payment'
    entity_id UUID,
    
    old_data JSONB,
    new_data JSONB,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_user (user_id, created_at DESC),
    INDEX idx_entity (entity_type, entity_id)
);
```

### 12. system_settings (Настройки системы)
```sql
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Примеры настроек:
-- 'pricing.base_rate' -> 120
-- 'pricing.per_km_rate' -> 40
-- 'pricing.max_multiplier' -> 3.0
-- 'commission.rate' -> 0.15
```

---

## Индексы для производительности

```sql
-- Поиск курьеров рядом
CREATE INDEX idx_couriers_online_location 
ON couriers USING GIST (current_location) 
WHERE is_online = TRUE AND is_busy = FALSE;

-- Активные заказы
CREATE INDEX idx_orders_active 
ON orders (status, created_at DESC) 
WHERE status IN ('pending', 'searching_courier', 'accepted', 'in_transit');

-- Поиск заказов курьера
CREATE INDEX idx_orders_courier_recent 
ON orders (courier_id, created_at DESC) 
WHERE courier_id IS NOT NULL;
```

---

## Триггеры для автоматизации

```sql
-- Обновление рейтинга пользователя
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET rating = (
        SELECT AVG(rating) 
        FROM ratings 
        WHERE to_user_id = NEW.to_user_id
    )
    WHERE id = NEW.to_user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating
AFTER INSERT ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();

-- Обновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

---

## Бэкапы

**Стратегия:**
- Полный бэкап: каждый день в 3:00
- Инкрементальный: каждый час
- Хранение: 30 дней
- Репликация: 2 копии в разных дата-центрах

**Команда:**
```bash
pg_dump -Fc begudelivery > backup_$(date +%Y%m%d).dump
```

---

**База данных спроектирована. Продолжаем?**
