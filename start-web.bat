@echo off
echo Запуск DeliveryPro веб-версии...
echo.
echo Открой на телефоне: http://%COMPUTERNAME%:8000
echo Или узнай IP: ipconfig
echo.
cd web
python -m http.server 8000
pause
