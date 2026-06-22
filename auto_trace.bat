@echo off
:: Di chuyen den thu muc chua file bat nay
cd /d "%~dp0"
echo Dang tu dong trace va dong bo toan bo anh PNG sang SVG (animationCandidate)...
echo.
call npm run crop:vtracer:auto
echo.
echo Da hoan thanh tu dong hoa!
pause
