# ZERO_DAY: ЗАЩИТНИКИ СЕТИ

Новый проект: Telegram Mini App игра про кибербезопасность для школьников 5-11 классов.

## Документы

- [GDD](docs/GDD.md) - полный Game Design Document.
- [ТЗ](docs/TECH_SPEC.md) - техническое задание для разработки Telegram Mini App.
- [Контент-пак](docs/CONTENT_PACK.md) - эпизод 1 на 30 дней, стартовые карточки, баланс, пуши, ачивки.
- [Архитектура](docs/ARCHITECTURE.md) - разделение frontend/backend, server authority, payments, push.
- [MVP backlog](docs/MVP_BACKLOG.md) - эпики, задачи, приоритеты, 6-недельный план.
- [JSON-схема прогресса](schemas/player-progress.schema.json) - структура сохранения игрока.
- [OpenAPI](schemas/openapi.yaml) - черновой контракт API.
- [SQL-схема](schemas/database.sql) - черновая PostgreSQL-схема.
- [Frontend prototype](frontend/README.md) - статический прототип Mini App.
- [Backend scaffold](backend/README.md) - dev API: auth, bootstrap, attempts, gacha, payments.

## Ключевые ограничения

- Никаких тестов с вариантами ответа.
- Все знания подаются через интерактив: свайпы, drag-and-drop, графы, пазлы, тайминг.
- Донат не влияет на соревновательный рейтинг.
- Все "взломы" являются безопасной симуляцией защиты.
- Аудитория: 10-17 лет, без навыков программирования.

## Быстрый запуск прототипа

Backend:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
$env:ZDNET_DEV_AUTH='1'
py -3 -m zdnet_backend.server
```

PostgreSQL режим:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
$env:ZDNET_DEV_AUTH='1'
$env:ZDNET_STORAGE='postgres'
$env:ZDNET_DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'
py -3 -m zdnet_backend.server
```

Frontend:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\frontend
py -3 -m http.server 5173
```

Открыть `http://localhost:5173`.
