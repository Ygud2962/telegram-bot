# ZERO_DAY: Защитники сети

Telegram Mini App игра про кибербезопасность для школьников 5-11 классов.

Игрок выступает стажером SOC-центра города "Новый Сектор": отражает ежедневные цифровые угрозы, прокачивает инструменты, собирает карточки угроз и развивает кибер-питомца.

## Текущий статус

Проект находится в MVP-разработке.

Готовый вертикальный срез:

- Telegram Mini App frontend без сборки.
- Backend API на стандартном Python HTTP-сервере.
- In-memory режим для быстрой разработки.
- PostgreSQL режим для проверки сохранения прогресса.
- Packet Rain как первая мини-игра.
- Энергия, награды, карточки, gacha и платежный контур.

## Структура

```text
zero-day-defenders-network/
  backend/                  Backend API, доменная логика, тесты и dev tools
  frontend/                 Статический Telegram Mini App prototype
  schemas/                  SQL, OpenAPI и JSON Schema
  docs/                     GDD, ТЗ, архитектура, backlog и контент-пак
  scripts/                  Quality gate scripts
  docker-compose.yml        Локальный PostgreSQL для разработки
  .env.example              Пример переменных окружения
```

## Документы

- [GDD](docs/GDD.md) - полный Game Design Document.
- [ТЗ](docs/TECH_SPEC.md) - техническое задание.
- [Контент-пак](docs/CONTENT_PACK.md) - эпизод 1, карточки, баланс, push, ачивки.
- [Архитектура](docs/ARCHITECTURE.md) - frontend/backend, server authority, payments, push.
- [MVP backlog](docs/MVP_BACKLOG.md) - задачи и приоритеты.
- [OpenAPI](schemas/openapi.yaml) - черновой контракт API.
- [SQL-схема](schemas/database.sql) - PostgreSQL схема.

## Быстрый запуск

Backend:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
$env:ZDNET_DEV_AUTH='1'
py -3 -m zdnet_backend.server
```

Frontend:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\frontend
py -3 -m http.server 5173
```

Открыть:

```text
http://localhost:5173
```

## PostgreSQL режим

Поднять локальную БД:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network
docker compose up -d postgres
```

Применить миграцию:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
$env:ZDNET_DATABASE_URL='postgresql://zdnet:zdnet_dev_password@127.0.0.1:55432/zdnet'
py -3 -m zdnet_backend.migrate
```

Запустить backend с PostgreSQL:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
$env:ZDNET_DEV_AUTH='1'
$env:ZDNET_STORAGE='postgres'
$env:ZDNET_DATABASE_URL='postgresql://zdnet:zdnet_dev_password@127.0.0.1:55432/zdnet'
py -3 -m zdnet_backend.server
```

## Проверки

Перед изменениями в gameplay, платежах или сохранении прогресса запускать:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network
.\scripts\dev_check.ps1
```

С PostgreSQL:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network
.\scripts\dev_check.ps1 -WithPostgres
```

## Правило разработки

Сначала стабилизируем вертикальный срез:

1. Telegram auth.
2. Карта.
3. Packet Rain.
4. Энергия.
5. Награды.
6. Карточки и gacha.
7. Сохранение в PostgreSQL.
8. Админский seed-контент.

Новые фичи добавлять только после проверки, что этот цикл стабильно работает после перезапуска backend.
