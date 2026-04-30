# Инструкция по сборке APK файлов

## Шаг 1: Установка Flutter

### Автоматическая установка (рекомендуется)

Запустите PowerShell от имени администратора и выполните:

```powershell
# Скачать Flutter
Invoke-WebRequest -Uri "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.19.6-stable.zip" -OutFile "$env:TEMP\flutter.zip"

# Распаковать в C:\flutter
Expand-Archive -Path "$env:TEMP\flutter.zip" -DestinationPath "C:\" -Force

# Добавить в PATH
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\flutter\bin", [EnvironmentVariableTarget]::Machine)

# Обновить текущую сессию
$env:Path += ";C:\flutter\bin"

# Проверить установку
flutter doctor
```

### Ручная установка

1. Скачайте Flutter SDK: https://docs.flutter.dev/get-started/install/windows
2. Распакуйте в `C:\flutter`
3. Добавьте `C:\flutter\bin` в PATH:
   - Откройте "Система" → "Дополнительные параметры системы"
   - "Переменные среды" → "Path" → "Изменить"
   - Добавьте `C:\flutter\bin`
4. Перезапустите командную строку
5. Выполните: `flutter doctor`

## Шаг 2: Настройка Android SDK

Flutter использует Android SDK, который уже установлен в `C:\bat\android-sdk`.

Проверьте, что установлены:
- Android SDK Platform-Tools
- Android SDK Build-Tools
- Android SDK Platform (API 33 или выше)

```cmd
flutter doctor --android-licenses
```

Примите все лицензии, нажимая `y`.

## Шаг 3: Сборка APK

Просто запустите скрипт:

```cmd
C:\bat\delivery-app\build-apk.bat
```

Скрипт автоматически:
1. Проверит наличие Flutter
2. Установит зависимости для обоих приложений
3. Соберёт APK файлы
4. Скопирует их в корень проекта

## Результат

После успешной сборки вы получите:

- `C:\bat\delivery-app\begu-client-app.apk` - приложение для клиентов
- `C:\bat\delivery-app\begu-courier-app.apk` - приложение для курьеров

## Установка на Android устройство

1. Скопируйте APK файл на телефон
2. Откройте файл на телефоне
3. Разрешите установку из неизвестных источников
4. Установите приложение

## Возможные проблемы

### Flutter не найден
```
ОШИБКА: Flutter не найден!
```
**Решение:** Установите Flutter (см. Шаг 1)

### Ошибка лицензий Android SDK
```
Android sdkmanager not found
```
**Решение:** Выполните `flutter doctor --android-licenses`

### Ошибка сборки
```
Gradle build failed
```
**Решение:** 
1. Проверьте подключение к интернету
2. Выполните: `flutter clean && flutter pub get`
3. Попробуйте снова

### Недостаточно памяти
```
Out of memory error
```
**Решение:** Закройте другие программы и попробуйте снова

## Дополнительные команды

### Сборка только клиентского приложения
```cmd
cd C:\bat\delivery-app\client-app
flutter build apk --release
```

### Сборка только приложения курьера
```cmd
cd C:\bat\delivery-app\courier-app
flutter build apk --release
```

### Сборка с разделением по архитектурам (меньший размер)
```cmd
flutter build apk --split-per-abi --release
```

Это создаст отдельные APK для:
- `app-armeabi-v7a-release.apk` (32-bit ARM)
- `app-arm64-v8a-release.apk` (64-bit ARM)
- `app-x86_64-release.apk` (64-bit x86)

## Тестирование

После установки APK:

1. **Клиентское приложение:**
   - Зарегистрируйтесь или войдите
   - Создайте тестовый заказ
   - Проверьте отслеживание

2. **Приложение курьера:**
   - Зарегистрируйтесь как курьер
   - Включите режим "Онлайн"
   - Примите заказ
   - Проверьте навигацию

## Важно

⚠️ **Перед сборкой для продакшена:**

1. Измените `baseUrl` в `lib/services/api_service.dart` на реальный адрес сервера
2. Настройте Firebase для push-уведомлений
3. Добавьте Yandex MapKit API ключ
4. Подпишите APK с помощью keystore для публикации в Google Play

## Поддержка

При возникновении проблем:
1. Проверьте `flutter doctor`
2. Посмотрите логи сборки
3. Убедитесь, что backend запущен и доступен
