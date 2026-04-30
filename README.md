# БегуДоставка - Платформа доставки

Полнофункциональная платформа для организации доставки, включающая backend API, админ-панель и мобильные приложения.

## Структура проекта

```
delivery-app/
├── backend/              # Node.js/Express API сервер
├── admin-panel/          # React админ-панель
├── client-app/           # Flutter приложение для клиентов
└── courier-app/          # Flutter приложение для курьеров
```

## Компоненты

### 1. Backend API (Node.js + Express + PostgreSQL)
- Управление пользователями, заказами, курьерами
- JWT авторизация, WebSocket real-time
- Геолокация, промокоды, платежи
- Запуск: `cd backend && npm install && npm start`
- URL: http://localhost:3000

### 2. Админ-панель (React + Vite)
- Дашборд, управление курьерами и заказами
- Карта отслеживания курьеров в реальном времени
- Система поддержки, промокоды, аудит
- Ролевая система (super_admin, admin, manager, support, analyst)
- Запуск: `cd admin-panel && npm install && npm run dev`
- URL: http://localhost:5173
- Логин: admin / admin123

### 3. Клиентское приложение (Flutter)
- Создание заказов, отслеживание, промокоды
- Запуск: `cd client-app && flutter pub get && flutter run`

### 4. Приложение для курьеров (Flutter)
- Принятие заказов, навигация, отслеживание локации
- Статистика заработка
- Запуск: `cd courier-app && flutter pub get && flutter run`

## Быстрый старт

1. **База данных**: `CREATE DATABASE delivery_app;`

2. **Backend .env**:
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/delivery_app
JWT_SECRET=your-secret-key
```

3. **Запуск**:
```bash
# Backend
cd backend && npm install && npm start

# Админ-панель
cd admin-panel && npm install && npm run dev

# Мобильные приложения
cd client-app && flutter pub get && flutter run
cd courier-app && flutter pub get && flutter run
```

## API Endpoints

- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/login` - Вход
- `POST /api/v1/orders` - Создать заказ
- `GET /api/v1/orders` - Список заказов
- `POST /api/v1/order-actions/:id/accept` - Принять заказ
- `GET /api/v1/courier-tracking` - Локации курьеров
- `GET /api/v1/admin/dashboard` - Статистика

## Требования

- Node.js 16+
- PostgreSQL 12+
- Flutter 3.0+

## Особенности

- 🚀 Низкий порог входа для курьеров
- 💰 Справедливая комиссия (15% вместо 20-30%)
- 📱 Простой интерфейс
- 🗺️ Трекинг в реальном времени
- ⚡ Быстрые выплаты

## Архитектура

### Приложения
1. **Клиент** - создание и отслеживание заказов
2. **Курьер** - принятие заказов и доставка
3. **Админ** - управление платформой

### Технологии
- React Native (Android + iOS)
- Firebase (Backend, Auth, Database)
- Яндекс.Карты API
- ЮKassa (платежи)

## Структура проекта

```
delivery-app/
├── src/
│   ├── screens/          # Экраны приложения
│   │   ├── client/       # Экраны клиента
│   │   ├── courier/      # Экраны курьера
│   │   └── common/       # Общие экраны (авторизация и т.д.)
│   ├── components/       # Переиспользуемые компоненты
│   ├── services/         # API, Firebase, геолокация
│   ├── utils/            # Вспомогательные функции
│   └── navigation/       # Навигация приложения
├── android/              # Android конфигурация
├── ios/                  # iOS конфигурация
└── package.json
```

## MVP функции

### Клиент
- Регистрация/вход
- Создание заказа (откуда → куда)
- Просмотр доступных курьеров
- Трекинг заказа на карте
- Чат с курьером
- История заказов

### Курьер
- Регистрация/вход
- Просмотр доступных заказов
- Принятие заказа
- Навигация к точкам
- Чат с клиентом
- История заработка

## Установка

```bash
# Установить зависимости
npm install

# Запустить на Android
npm run android

# Запустить на iOS
npm run ios
```

## Монетизация

- Комиссия 15% с каждого заказа
- Курьер получает 85%
- Клиент платит полную стоимость

## Roadmap

### Этап 1: MVP (текущий)
- [x] Структура проекта
- [ ] Экраны клиента
- [ ] Экраны курьера
- [ ] Firebase интеграция
- [ ] Базовая навигация

### Этап 2: Функциональность
- [ ] Геолокация и карты
- [ ] Чат
- [ ] Уведомления
- [ ] Тестирование

### Этап 3: Запуск
- [ ] Онлайн-оплата
- [ ] Рейтинги
- [ ] Бонусная система
- [ ] Публикация в Google Play

### Этап 4: Масштабирование
- [ ] iOS версия
- [ ] Админ-панель
- [ ] Аналитика
- [ ] Расширение на города
