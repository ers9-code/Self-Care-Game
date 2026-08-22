@echo off
setlocal
set "ROOT=%~dp0."
set "SCRIPT=%ROOT%\reset-exe-server.ps1"

if not exist "%SCRIPT%" (
  echo RESET.EXE stop script could not find reset-exe-server.ps1
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" -Root "%ROOT%" -PreferredPort 48741 -Stop
endlocal
