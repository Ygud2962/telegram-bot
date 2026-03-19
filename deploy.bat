@echo off
chcp 65001 > nul
echo.
echo ========================================
echo   DEPLOY - СШ №3 Шифровальщик
echo ========================================
echo.

set /p MSG="Commit message (English): "
if "%MSG%"=="" set MSG=update

cd /d "%~dp0"

echo.
echo [1/5] Switching to dev...
git checkout dev
if errorlevel 1 goto error

echo [2/5] Committing changes...
git add .
git commit -m "%MSG%"

echo [3/5] Pushing dev...
git push origin dev
if errorlevel 1 goto error

echo [4/5] Switching to main...
git checkout main

echo [4/5] Syncing main with remote...
git fetch origin main
git reset --hard origin/main

echo [5/5] Merging dev into main...
git merge dev --no-edit
if errorlevel 1 goto error

echo [5/5] Pushing main...
git push origin main
if errorlevel 1 goto error

git checkout dev

echo.
echo ========================================
echo   Done! The bot has been updated.
echo ========================================
echo.
pause
exit /b 0

:error
echo.
echo ========================================
echo   ERROR! Check the output above.
echo ========================================
echo.
pause
exit /b 1
