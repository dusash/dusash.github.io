@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   dusash blog - local preview
echo   Address: http://localhost:4000
echo   Close this window to stop the server.
echo.
start "" cmd /c "timeout /t 5 >nul & start http://localhost:4000"
call "node_modules\.bin\hexo.cmd" server -p 4000
echo.
echo   Server stopped.
pause
