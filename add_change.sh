#!/bin/bash
# Быстрое добавление записи в журнал изменений бота.
# Использование:
#   ./add_change.sh bot "Заголовок" "Подробное описание"
#   ./add_change.sh games "Игра работает" "Описание деталей"
#   ./add_change.sh school "Объявление" "Текст"
#
# Первый аргумент — раздел: bot | games | school | cipher | update
# Второй — заголовок
# Третий — подробное описание (опционально)

SCOPE="${1:-bot}"
TITLE="${2:-Без названия}"
DETAILS="${3:-}"

if [ -z "$TITLE" ] || [ "$TITLE" = "Без названия" ]; then
  echo "❌ Использование: $0 <scope> <title> [details]"
  echo "   scope: bot | games | school | cipher"
  exit 1
fi

# Защита от SQL-инъекций через простую замену одинарных кавычек
TITLE_ESC="${TITLE//\'/\'\'}"
DETAILS_ESC="${DETAILS//\'/\'\'}"

docker exec school-bot-postgres-1 psql -U bot -d school_bot -c \
  "INSERT INTO project_change_log (scope, change_type, title, details, source, used_in_news) VALUES ('$SCOPE', 'update', '$TITLE_ESC', '$DETAILS_ESC', 'manual', FALSE);"

echo ""
echo "✅ Запись добавлена в журнал:"
echo "   Раздел:   $SCOPE"
echo "   Заголовок: $TITLE"
[ -n "$DETAILS" ] && echo "   Детали:   $DETAILS"
echo ""
echo "📋 Текущие неиспользованные записи:"
docker exec school-bot-postgres-1 psql -U bot -d school_bot -c \
  "SELECT id, scope, title FROM project_change_log WHERE used_in_news = FALSE ORDER BY id;"
