#!/usr/bin/env python3
"""
One-shot updater for the latest "bot" news item.

Usage (Railway shell):
  python scripts/update_latest_bot_news.py
"""

import os
import sys
from textwrap import dedent

NEWS_TITLE = "🚀 Обновление: фиксы игры, кеша, логов и новостей"
NEWS_CONTENT = dedent(
    """
    Привет! Коротко по последним правкам:

    ✅ Критичный фикс игры
    • Исправлена проверка ответов: после нажатия «Проверить» прогресс снова корректно идет дальше.
    • Для стабильности добавлен fallback-хешер SHA-256 (если в WebView недоступен crypto.subtle).
    • Убран дублирующий код викторины, который мог приводить к конфликтам логики.

    🧩 Сообщение о баге прямо из задания
    • Во всех заданиях добавлена кнопка «⚠ Сообщить об ошибке».
    • По кнопке открывается окно с инструкцией сделать скриншот.
    • Добавлены действия:
      - «Ок» — закрыть окно
      - «Связаться с администрацией» — переход в чат администратора (@Yury_hud)

    🧹 Сброс кеша для всех игроков
    • В «Настройки» добавлена кнопка «Очистить кеш».
    • Работает в любых режимах (player/tester/admin).
    • Очищает только локальный кеш устройства и перезагружает игру.

    🔊 Аудио и интерфейс (из последних обновлений)
    • Добавлены 5 epic royalty-free треков + выбор трека.
    • Раздельные переключатели и громкость: музыка / звуковые эффекты.
    • Добавлены SFX для победы, поражения и потери жизни.
    • Улучшена читаемость интерфейса и контраст достижений.

    📰 Новости бота
    • Лента новостей разделена на «Новости школы» и «Новости бота».
    • Технические апдейты и changelog перенесены в «Новости бота».
    • При публикации новости админ выбирает раздел (школа/бот).

    🛠 Логи и стабильность бота
    • Уменьшен шум в логах при редеплое: отфильтрованы ожидаемые 409 Conflict getUpdates.
    • Добавлено ограничение повторных предупреждений о конфликте polling.
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

