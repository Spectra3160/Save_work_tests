@echo off
chcp 65001 >nul
title Сборка Windows-приложения (.exe) — Охрана труда
echo ============================================================
echo   Автоматическая сборка приложения "Охрана труда" в .EXE
echo ============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [!] На компьютере не найден Node.js.
  echo     Скачайте и установите Node.js LTS с сайта https://nodejs.org/
  echo     Затем снова запустите этот файл двойным кликом.
  echo.
  pause
  exit /b 1
)

echo [1/3] Установка зависимостей проекта...
call npm install
if %errorlevel% neq 0 goto :error

echo.
echo [2/3] Сборка интерфейса и создание .exe файлов...
call npm run build:windows
if %errorlevel% neq 0 goto :error

echo.
echo ============================================================
echo   ГОТОВО! Файлы .exe находятся в папке "release"
echo ============================================================
explorer "%~dp0release"
pause
exit /b 0

:error
echo.
echo [!] Произошла ошибка при сборке. Проверьте подключение к интернету
echo     и попробуйте запустить файл ещё раз.
echo.
pause
exit /b 1
