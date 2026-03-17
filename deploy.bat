@echo off
git checkout dev
git add .
set /p msg="Edit summary: "
git commit -m "%msg%"
git push origin dev
git checkout main
git merge dev
git push origin main
echo.
echo Done! The bot has been updated.
pause