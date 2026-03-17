@echo off
git checkout dev
git add .
set /p msg="Комментарий к правке: "
git commit -m "%msg%"
git push origin dev
git checkout main
git merge dev
git push origin main
echo.
echo Готово! Бот обновлён.
pause