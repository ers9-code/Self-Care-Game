@echo off
setlocal
set "ROOT=%~dp0."
set "SCRIPT=%ROOT%\reset-exe-server.ps1"

if not exist "%SCRIPT%" (
  echo RESET.EXE launcher could not find reset-exe-server.ps1
  pause
  exit /b 1
)

start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%SCRIPT%" -Root "%ROOT%" -PreferredPort 48741 -Open
endlocal
