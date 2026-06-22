@echo off
:: Di chuyen den thu muc chua file bat nay
cd /d "%~dp0"
echo Dang don dep toan bo cac tep anh nhap va bao cao (Generated)...
echo.
call npm run crop:vtracer:clear
echo.
echo Da hoan thanh don dep!
pause
