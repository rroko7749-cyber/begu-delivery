# БегуДоставка - Клиентское приложение

Мобильное приложение для заказа доставки на Flutter.

## Возможности

- 📱 Регистрация и авторизация
- 📦 Создание заказов доставки
- 🗺️ Выбор точек на карте
- 📍 Отслеживание заказа в реальном времени
- 💳 Применение промокодов
- 📜 История заказов
- 👤 Управление профилем
- 🔔 Push-уведомления

## Технологии

- Flutter 3.0+
- Provider (State Management)
- Yandex MapKit
- HTTP/Dio
- Firebase (Push notifications)
- Shared Preferences

## Установка

### Требования

- Flutter SDK 3.0 или выше
- Dart SDK 3.0 или выше
- Android Studio / Xcode
- Yandex MapKit API ключ

### Шаги установки

1. Установите зависимости:
```bash
cd client-app
flutter pub get
```

2. Настройте Yandex MapKit:
   - Получите API ключ на https://developer.tech.yandex.ru/
   - Добавьте ключ в AndroidManifest.xml и Info.plist

3. Настройте Firebase:
   - Создайте проект в Firebase Console
   - Скачайте google-services.json (Android) и GoogleService-Info.plist (iOS)
   - Поместите файлы в соответствующие директории

4. Настройте API endpoint:
   - Откройте `lib/services/api_service.dart`
   - Измените `baseUrl` на адрес вашего backend сервера

## Запуск

### Android
```bash
flutter run
```

### iOS
```bash
flutter run
```

### Сборка релиза

Android:
```bash
flutter build apk --release
```

iOS:
```bash
flutter build ios --release
```

## Структура проекта

```
lib/
├── main.dart                 # Точка входа
├── screens/                  # Экраны приложения
│   ├── auth/                # Авторизация
│   ├── home/                # Главный экран
│   ├── order/               # Заказы
│   └── profile/             # Профиль
├── providers/               # State management
├── services/                # API сервисы
├── models/                  # Модели данных
├── widgets/                 # Переиспользуемые виджеты
└── utils/                   # Утилиты
```

## API

Приложение работает с backend API на `http://localhost:3000/api/v1`

Основные endpoints:
- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход
- `POST /orders` - Создание заказа
- `GET /orders` - Список заказов
- `GET /orders/:id` - Детали заказа

## Конфигурация

Измените настройки в `lib/services/api_service.dart`:
- `baseUrl` - адрес backend сервера

## Лицензия

Proprietary
