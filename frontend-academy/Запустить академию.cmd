@echo off
chcp 65001 >nul
cd /d "%~dp0"
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Не найден Node.js с npm. Установите Node.js по инструкции README.
  pause
  exit /b 1
)
node -e "fetch('http://127.0.0.1:4173/', {signal: AbortSignal.timeout(1500)}).then(r => r.text()).then(t => process.exit(t.includes('Frontend Academy') ? 0 : 1)).catch(() => process.exit(1))" >nul 2>nul
if not errorlevel 1 (
  start "" "http://127.0.0.1:4173/"
  exit /b 0
)
echo После появления строки Local откройте http://127.0.0.1:4173/ в браузере.
echo Оставьте это окно открытым во время обучения.
call npm.cmd run dev
pause
