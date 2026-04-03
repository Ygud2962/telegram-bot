@echo off
setlocal EnableExtensions
chcp 65001 > nul

cd /d "%~dp0"

echo.
echo ========================================
echo   DEPLOY - MAIN BRANCH
echo ========================================
echo.

set "MSG=%*"
if not defined MSG (
  set "MSG=auto deploy: %DATE% %TIME:~0,8%"
)
set "BRANCH=main"

rem Clear broken proxy vars if they are set in environment.
set "HTTP_PROXY="
set "HTTPS_PROXY="
set "ALL_PROXY="
set "GIT_HTTP_PROXY="
set "GIT_HTTPS_PROXY="
set "GIT_SSL_BACKEND=openssl"

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

echo [4/6] Creating commit if needed...
echo x> ".git\__perm_test.tmp" 2>nul
if not exist ".git\__perm_test.tmp" (
  echo INFO: local .git is read-only, switching to safe deploy mode...
  call :safe_mode
  goto :eof
)
del ".git\__perm_test.tmp" >nul 2>nul

git add -A
git diff --cached --quiet
if not errorlevel 1 (
  git commit -m "%MSG%"
  if errorlevel 1 goto error
) else (
  echo No local changes to commit.
)

echo [5/6] Pushing main...
call :push_with_login
if errorlevel 1 goto error

echo [6/6] Done.

echo.
echo ========================================
echo   Done! Pushed to GitHub/main.
echo   Railway deploy starts automatically via GitHub integration.
echo ========================================
echo.
exit /b 0

:safe_mode
set "SOURCE_DIR=%CD%"
set "TEMP_REPO=%TEMP%\telegram-bot-deploy-%RANDOM%%RANDOM%"

echo [4/6] Preparing temporary clean repository...
for /f "delims=" %%i in ('git config --get remote.origin.url') do set "REMOTE_URL=%%i"
if not defined REMOTE_URL goto error

git -c http.sslBackend=openssl clone --branch main --single-branch "%REMOTE_URL%" "%TEMP_REPO%"
if errorlevel 1 goto error

echo [5/6] Syncing files to temporary repository...
robocopy "%SOURCE_DIR%" "%TEMP_REPO%" /MIR /XD ".git" "node_modules" ".venv" "venv" "__pycache__" ".pytest_cache" ".mypy_cache" >nul
if errorlevel 8 goto error

echo [6/6] Commit and push from temporary repository...
pushd "%TEMP_REPO%" >nul
git add -A
git diff --cached --quiet
if not errorlevel 1 (
  git commit -m "%MSG%"
  if errorlevel 1 (
    popd >nul
    goto error
  )
) else (
  echo No local changes to commit.
)

call :push_with_login
if errorlevel 1 (
  popd >nul
  goto error
)
popd >nul

rmdir /s /q "%TEMP_REPO%" >nul 2>nul

echo.
echo ========================================
echo   Done! Pushed to GitHub/main (safe mode).
echo   Railway deploy starts automatically via GitHub integration.
echo ========================================
echo.
exit /b 0

:conflict_error
echo.
echo Resolve conflicts first, then run deploy.bat again.
echo Example:
echo   git add ^<file^>
echo   git commit
echo.
exit /b 1

:push_with_login
git -c http.sslBackend=openssl push origin main
if not errorlevel 1 exit /b 0

echo Push failed. Trying GitHub login via Credential Manager...
git credential-manager version >nul 2>nul
if not errorlevel 1 (
  git credential-manager github login
  if errorlevel 1 (
    echo GitHub login failed.
    exit /b 1
  )
) else (
  git credential-manager-core --version >nul 2>nul
  if errorlevel 1 (
    echo Credential Manager not found. Push cannot continue.
    echo Install latest Git for Windows, then sign in once:
    echo   https://git-scm.com/download/win
    exit /b 1
  )
  git credential-manager-core configure
  if errorlevel 1 (
    echo Credential Manager Core configure failed.
    exit /b 1
  )
)

git -c http.sslBackend=openssl push origin main
if errorlevel 1 exit /b 1
exit /b 0

:error
if defined TEMP_REPO (
  if exist "%TEMP_REPO%" rmdir /s /q "%TEMP_REPO%" >nul 2>nul
)
echo.
echo ========================================
echo   ERROR! Check the output above.
echo ========================================
echo If error mentions credentials/HTTPS:
echo   1) Open Git Bash once and run: git credential-manager configure
echo   2) Then run: git fetch origin
echo   3) Re-run deploy.bat
echo.
exit /b 1
