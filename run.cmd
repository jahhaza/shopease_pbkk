@echo off
setlocal
cd /d "%~dp0"
set "SHOPEASE_PHP=C:\xampp_new\php\php.exe"
if not "%~1"=="" set "SHOPEASE_PHP=%~1"
if not exist "%SHOPEASE_PHP%" (
    echo PHP tidak ditemukan. Berikan lokasi php.exe sebagai argumen run.cmd.
    exit /b 1
)
"%SHOPEASE_PHP%" spark serve
exit /b %errorlevel%
