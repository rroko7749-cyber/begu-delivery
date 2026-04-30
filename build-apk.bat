@echo off
setlocal

set JAVA_HOME=C:\bat\jdk\jdk-17.0.10+7
set ANDROID_HOME=C:\bat\android-sdk
set FLUTTER_HOME=C:\flutter
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%FLUTTER_HOME%\bin;%PATH%

echo ========================================
echo Сборка Flutter APK для БегуДоставка
echo ========================================
echo.
echo Java: %JAVA_HOME%
echo Android SDK: %ANDROID_HOME%
echo Flutter: %FLUTTER_HOME%
echo.

REM Проверка Flutter
where flutter >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Flutter не найден!
    echo.
    echo Установите Flutter:
    echo 1. Скачайте: https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.19.6-stable.zip
    echo 2. Распакуйте в C:\flutter
    echo 3. Запустите этот скрипт снова
    echo.
    pause
    exit /b 1
)

echo Flutter версия:
flutter --version
echo.

REM Сборка клиентского приложения
echo ========================================
echo Сборка клиентского приложения...
echo ========================================
cd C:\bat\delivery-app\client-app

echo Установка зависимостей...
call flutter pub get

echo Сборка APK...
call flutter build apk --release

if exist "build\app\outputs\flutter-apk\app-release.apk" (
    echo.
    echo ✓ Клиентское приложение собрано успешно!
    copy "build\app\outputs\flutter-apk\app-release.apk" "..\begu-client-app.apk"
    echo Скопировано в: C:\bat\delivery-app\begu-client-app.apk
) else (
    echo.
    echo ✗ Ошибка сборки клиентского приложения
)

echo.
echo.

REM Сборка приложения курьера
echo ========================================
echo Сборка приложения курьера...
echo ========================================
cd C:\bat\delivery-app\courier-app

echo Установка зависимостей...
call flutter pub get

echo Сборка APK...
call flutter build apk --release

if exist "build\app\outputs\flutter-apk\app-release.apk" (
    echo.
    echo ✓ Приложение курьера собрано успешно!
    copy "build\app\outputs\flutter-apk\app-release.apk" "..\begu-courier-app.apk"
    echo Скопировано в: C:\bat\delivery-app\begu-courier-app.apk
) else (
    echo.
    echo ✗ Ошибка сборки приложения курьера
)

echo.
echo.
echo ========================================
echo Сборка завершена!
echo ========================================
echo.
echo APK файлы:
echo - Клиентское: C:\bat\delivery-app\begu-client-app.apk
echo - Курьерское: C:\bat\delivery-app\begu-courier-app.apk
echo.
echo Установите APK на Android устройство для тестирования
echo.
pause
