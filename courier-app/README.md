# БегуДоставка - Приложение для курьеров

Мобильное приложение для курьеров на Flutter.

## Возможности

- 📱 Регистрация и авторизация курьера
- 📦 Просмотр доступных заказов
- ✅ Принятие заказов
- 🗺️ Навигация к точкам
- 📍 Отслеживание локации в реальном времени
- 🚚 Управление статусами доставки
- 💰 Статистика заработка
- 👤 Управление профилем
- 🔔 Push-уведомления о новых заказах

## Технологии

- Flutter 3.0+
- Provider (State Management)
- Yandex MapKit
- HTTP/Dio
- Geolocator (GPS tracking)
- Firebase (Push notifications)
- Background Location

## Установка

### Требования

- Flutter SDK 3.0 или выше
- Dart SDK 3.0 или выше
- Android Studio / Xcode
- Yandex MapKit API ключ

### Шаги установки

1. Установите зависимости:
```bash
cd courier-app
flutter pub get
```

2. Настройте Yandex MapKit:
   - Получите API ключ на https://developer.tech.yandex.ru/
   - Добавьте ключ в AndroidManifest.xml и Info.plist

3. Настройте Firebase:
   - Создайте проект в Firebase Console
   - Скачайте google-services.json (Android) и GoogleService-Info.plist (iOS)
   - Поместите файлы в соответствующие директории

4. Настройте разрешения для геолокации:
   - Android: добавьте разрешения в AndroidManifest.xml
   - iOS: добавьте описания в Info.plist

5. Настройте API endpoint:
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
│   ├── earnings/            # Заработок
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
- `POST /auth/register` - Регистрация курьера
- `POST /auth/login` - Вход
- `GET /orders?status=pending` - Доступные заказы
- `GET /couriers/my-orders` - Мои заказы
- `POST /order-actions/:id/accept` - Принять заказ
- `POST /order-actions/:id/start-delivery` - Начать доставку
- `POST /order-actions/:id/complete` - Завершить доставку
- `POST /courier-tracking/update-location` - Обновить локацию

## Отслеживание локации

Приложение автоматически отправляет координаты курьера на сервер каждые 10 секунд при включенном режиме "Онлайн".

Для работы в фоновом режиме необходимо:
- Android: настроить foreground service
- iOS: включить Background Modes

## Конфигурация

Измените настройки в `lib/services/api_service.dart`:
- `baseUrl` - адрес backend сервера

Настройки геолокации в `lib/providers/location_provider.dart`:
- `distanceFilter` - минимальное расстояние для обновления (метры)
- Интервал обновления локации

## Разрешения

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

### iOS (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Необходимо для отслеживания вашей локации во время доставки</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Необходимо для отслеживания вашей локации в фоновом режиме</string>
```

## Лицензия

Proprietary
