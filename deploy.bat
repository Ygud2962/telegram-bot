@echo off
setlocal EnableExtensions
chcp 65001 > nul

cd /d "%~dp0"

echo.
echo ========================================
echo   DEPLOY - MAIN BRANCH
echo ========================================
echo.

set /p MSG="Commit message (English): "
if "%MSG%"=="" set "MSG=update"

echo [1/6] Checking merge conflicts...
for /f %%i in ('git diff --name-only --diff-filter=U') do (
  echo ERROR: unresolved conflict in %%i
  goto conflict_error
)

echo [2/6] Detecting current branch...
for /f %%i in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%i"
if not defined BRANCH goto error
echo Current branch: %BRANCH%

if /I not "%BRANCH%"=="main" (
  echo [3/6] Switching to main...
  git switch main 2>nul || git checkout main
  if errorlevel 1 goto error
) else (
  echo [3/6] Already on main.
)

echo [4/6] Syncing with origin/main...
git pull --ff-only origin main
if errorlevel 1 goto error

echo [5/6] Creating commit if needed...
git add -A
git diff --cached --quiet
if not errorlevel 1 (
  git commit -m "%MSG%"
  if errorlevel 1 goto error
) else (
  echo No local changes to commit.
)

echo [6/6] Pushing main...
git push origin main
if errorlevel 1 goto error

echo.
echo ========================================
echo   Done! main is deployed.
echo ========================================
echo.
pause
exit /b 0

:conflict_error
echo.
echo Resolve conflicts first, then run deploy.bat again.
echo Example:
echo   git add ^<file^>
echo   git commit
echo.
pause
exit /b 1

:error
echo.
echo ========================================
echo   ERROR! Check the output above.
echo ========================================
echo.
pause
exit /b 1
