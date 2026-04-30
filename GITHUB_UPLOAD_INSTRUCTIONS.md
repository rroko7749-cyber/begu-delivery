# Инструкция по загрузке на GitHub и автоматической сборке APK

## Вариант 1: Через веб-интерфейс GitHub (самый простой)

1. **Создайте новый репозиторий на GitHub:**
   - Перейдите на https://github.com/new
   - Название: `begu-delivery`
   - Сделайте приватным или публичным
   - НЕ добавляйте README, .gitignore или лицензию
   - Нажмите "Create repository"

2. **Загрузите код:**
   ```bash
   cd C:\bat\delivery-app
   git remote add origin https://github.com/ВАШ_USERNAME/begu-delivery.git
   git branch -M main
   git push -u origin main
   ```

3. **Запустите сборку:**
   - Перейдите в репозиторий на GitHub
   - Откройте вкладку "Actions"
   - Нажмите на workflow "Build Flutter APK"
   - Нажмите "Run workflow" → "Run workflow"
   - Подождите 5-10 минут

4. **Скачайте APK:**
   - После завершения сборки откройте завершенный workflow
   - В разделе "Artifacts" скачайте:
     - `client-app-release` - приложение для клиентов
     - `courier-app-release` - приложение для курьеров

## Вариант 2: Локальная сборка (требует установки Flutter)

Если хотите собрать локально, выполните:

```powershell
# Скачать Flutter
Invoke-WebRequest -Uri "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.19.6-stable.zip" -OutFile "$env:TEMP\flutter.zip"

# Распаковать
Expand-Archive -Path "$env:TEMP\flutter.zip" -DestinationPath "C:\" -Force

# Добавить в PATH
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\flutter\bin", [EnvironmentVariableTarget]::Machine)
$env:Path += ";C:\flutter\bin"

# Принять лицензии Android
flutter doctor --android-licenses

# Собрать APK
cd C:\bat\delivery-app
.\build-apk.bat
```

## Вариант 3: Использовать готовый сервис

Можно использовать Codemagic или AppCenter для автоматической сборки:
- https://codemagic.io
- https://appcenter.ms

## Текущий статус

✅ Код готов и закоммичен
✅ GitHub Actions workflow настроен
✅ API endpoints настроены на ваш локальный сервер (172.28.144.1:3000)
⏳ Нужно загрузить на GitHub для автоматической сборки

## Важно

После получения APK файлов:
1. Установите на Android устройство
2. Убедитесь, что устройство в той же сети что и ПК (172.28.144.1)
3. Backend должен быть запущен: `cd C:\bat\delivery-app\backend && npm start`
4. Админ-панель: `cd C:\bat\delivery-app\admin-panel && npm run dev`

Все действия в приложениях будут отображаться в админ-панели в реальном времени!
