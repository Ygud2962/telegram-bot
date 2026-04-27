#!/usr/bin/env python3
"""
One-shot updater for the latest "bot" news item.

Usage (Railway shell):
  python scripts/update_latest_bot_news.py
"""

import os
import sys
from textwrap import dedent

NEWS_TITLE = "🚀 Обновление: запуск игры, аудио и новости"
NEWS_CONTENT = dedent(
    """
    Привет! Большой пакет исправлений и улучшений:

    ✅ Главный фикс запуска игры
    • Исправлено зависание на стартовом экране «Загрузка...»
    • Усилен boot-процесс: добавлены fallback-пути загрузки скриптов и таймауты
    • Кнопки «Начать миссию» и «Как играть» теперь надежно запускают игру даже после повторной загрузки

    🛡 Стабильность доступа
    • Улучшена обработка ролей/доступов (admin/tester/player)
    • Добавлены безопасные fallback-сценарии для открытия первой главы, чтобы игра не блокировалась

    📰 Новости в боте (новая структура)
    • Раздел «Новости» разделен на:
      - 🏫 Новости школы
      - 🤖 Новости бота
    • Все технические апдейты и changelog перенесены в «Новости бота»
    • При публикации новости админ теперь выбирает раздел (школа/бот)
    • Добавлен перенос новости между разделами прямо из интерфейса

    🎮 Улучшения игры
    • Повышен контраст интерфейса: текст лучше читается на низкой яркости
    • Полностью обновлен дизайн блока достижений: четкое выделение полученных/неполученных
    • Добавлены 5 эпичных royalty-free треков в настройки:
      - Mars, The Bringer Of War
      - 1812 Overture
      - Night on Bald Mountain
      - Dies Irae (Gregorian Chant)
      - William Tell Overture
    • Добавлен выбор трека в настройках
    • Добавлены игровые звуки: победа / поражение / потеря жизни
    • Добавлено раздельное включение/выключение:
      - фоновой музыки
      - звуковых эффектов
    • Добавлены отдельные регуляторы громкости:
      - для музыки
      - для звуковых эффектов

    🧩 Технический итог
    • Игра больше не должна зависать на экране загрузки
    • Аудио и настройки работают раздельно и сохраняются
    • Лента новостей стала структурированной и удобной для администрирования
    """
).strip()


def main() -> int:
    try:
        import psycopg2  # type: ignore
    except Exception:
        print("ERROR: psycopg2 is not installed in this environment.")
        return 1

    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        print("ERROR: DATABASE_URL is not set.")
        return 1

    with psycopg2.connect(database_url, sslmode="require") as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title
                FROM news
                WHERE category = 'bot'
                ORDER BY published_at DESC, id DESC
                LIMIT 1
                """
            )
            row = cur.fetchone()

            if row:
                news_id, old_title = row
                cur.execute(
                    """
                    UPDATE news
                    SET title=%s,
                        content=%s,
                        category='bot',
                        published_at=NOW()
                    WHERE id=%s
                    """,
                    (NEWS_TITLE, NEWS_CONTENT, news_id),
                )
                print(f"Updated bot news #{news_id}: {old_title!r} -> {NEWS_TITLE!r}")
            else:
                cur.execute(
                    """
                    INSERT INTO news (title, content, category, published_at)
                    VALUES (%s, %s, 'bot', NOW())
                    RETURNING id
                    """,
                    (NEWS_TITLE, NEWS_CONTENT),
                )
                news_id = cur.fetchone()[0]
                print(f"Created bot news #{news_id}: {NEWS_TITLE!r}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
