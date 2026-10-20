@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   ============================================
echo    发布到 https://dusash.github.io
echo   ============================================
echo.
echo   这个脚本会把你本地的改动提交并推送到 GitHub，
echo   推送后 GitHub 会自动构建，大约 1 分钟后线上更新。
echo.
set /p MSG=  这次更新了什么？（直接回车 = "更新文章"）: 
if "%MSG%"=="" set MSG=更新文章

set GIT="C:\Program Files\Git\cmd\git.exe"

%GIT% add -A
%GIT% commit -m "%MSG%"
if errorlevel 1 (
  echo.
  echo   没有检测到改动，无需发布。
  echo.
  pause
  exit /b 0
)
%GIT% push

echo.
echo   --------------------------------------------
echo   已推送。大约 1 分钟后访问 https://dusash.github.io 查看。
echo   想看构建有没有成功，去这里：
echo   https://github.com/dusash/dusash.github.io/actions
echo   --------------------------------------------
echo.
pause
