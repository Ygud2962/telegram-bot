# Backend Scaffold

Минимальный backend-прототип для `ZERO_DAY: ЗАЩИТНИКИ СЕТИ`.

## Почему стандартный HTTP

MVP backend сделан на стандартном `http.server`, чтобы запускаться без установки зависимостей. Доменная логика отделена от HTTP-слоя, чтобы позже можно было перейти на FastAPI, aiohttp или другой production-фреймворк.

## Запуск

In-memory режим:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
$env:ZDNET_DEV_AUTH='1'
py -3 -m zdnet_backend.server
```

Сервер:

```text
http://localhost:8090
```

## Dev auth

Для локального тестирования можно включить `ZDNET_DEV_AUTH=1` и отправить:

```json
{
  "initData": "",
  "startParam": "dev",
  "devTelegramId": 1001,
  "devNickname": "rookie"
}
```

В production `ZDNET_DEV_AUTH` должен быть выключен, а `BOT_TOKEN` должен быть задан.

## PostgreSQL режим

Применить миграцию:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
$env:ZDNET_DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'
py -3 -m zdnet_backend.migrate
```

Запуск API с PostgreSQL:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
$env:ZDNET_DEV_AUTH='1'
$env:ZDNET_STORAGE='postgres'
$env:ZDNET_DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'
py -3 -m zdnet_backend.server
```

Текущий PostgreSQL adapter сохраняет authoritative snapshot в `zdnet.player_snapshots` и зеркалит базовые поля в `players`, `player_wallet`, `player_energy`, `player_progress`. Это осознанный MVP-подход: быстро получить надежную персистентность, пока доменная модель еще меняется.

## Платежи

Контур платежей не начисляет награды при создании счета.

Порядок:

1. Frontend вызывает `POST /api/payments/invoice`.
2. Backend создает pending payment с уникальным `invoicePayload`.
3. Telegram подтверждает оплату через `successful_payment` в боте или webhook.
4. Backend вызывает `grant_payment(payload)`.
5. Повторный grant по тому же payload не выдает награду второй раз.
6. `fairScore` не меняется от покупок.

Продукты используют `XTR` Telegram Stars. Для локального режима без Telegram можно проверить выдачу через:

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8090/api/payments/webhook/telegram `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"payload":"zdnet:...","telegramPaymentChargeId":"test"}'
```

## Тесты

```powershell
cd C:\Users\uragu\telegram-bot
py -3 -m unittest discover zero-day-defenders-network\backend\tests -q
```

## MVP smoke test

Run this after starting the API with `ZDNET_DEV_AUTH=1`. It validates the full MVP loop:
dev auth -> bootstrap -> threat attempt -> rewards -> cache opening -> invoice creation -> Telegram payment grant -> idempotent duplicate payment.

Standalone backend:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
$env:ZDNET_DEV_AUTH='1'
py -3 -m zdnet_backend.server
```

In another terminal:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
py -3 tools\smoke_mvp.py --base-url http://127.0.0.1:8090
```

Bot-mounted API:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
py -3 tools\smoke_mvp.py --base-url https://your-domain.example/zdnet_api
```

## PostgreSQL persistence gate

Run this when `ZDNET_DATABASE_URL` points to a real PostgreSQL database. It creates a temporary player, writes gameplay, gacha and payment state, recreates the repository three times, and verifies that progress and paid grants survive restart without duplicate rewards.

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
$env:ZDNET_DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'
py -3 tools\check_postgres_persistence.py
```

## Local PostgreSQL with Docker

From the project root:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network
docker compose up -d postgres
```

Dev DSN:

```text
postgresql://zdnet:zdnet_dev_password@127.0.0.1:55432/zdnet
```

Full backend gate:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network
.\scripts\dev_check.ps1 -WithPostgres
```
