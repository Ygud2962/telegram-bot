# ZERO_DAY Backend

Минимальный backend для `ZERO_DAY: Защитники сети`.

Цель текущего backend - дать стабильный MVP-контур без лишних зависимостей:

- Telegram auth / dev auth.
- Bootstrap состояния игрока.
- Старт и завершение попыток угроз.
- Расчет наград.
- Gacha / Zero Cache.
- Платежный контур Telegram Stars.
- In-memory и PostgreSQL storage.

## Почему стандартный HTTP-сервер

MVP использует стандартный `http.server`, чтобы запускаться без установки framework-зависимостей. Доменная логика вынесена отдельно, поэтому позже можно перейти на FastAPI, aiohttp или другой production framework без переписывания игры с нуля.

## Запуск in-memory

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

Для локального тестирования включается `ZDNET_DEV_AUTH=1`.

Пример payload для auth:

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

Миграция:

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

PostgreSQL adapter хранит authoritative snapshot в `zdnet.player_snapshots` и зеркалит основные поля в `players`, `player_wallet`, `player_energy`, `player_progress`.

Это осознанный MVP-подход: быстро получить надежную persistence-модель, пока доменная модель еще меняется.

## Платежи

Платежный контур не выдает награды при создании счета.

Порядок:

1. Frontend вызывает `POST /api/payments/invoice`.
2. Backend создает pending payment с уникальным `invoicePayload`.
3. Telegram подтверждает оплату через `successful_payment` в боте или webhook.
4. Backend вызывает `grant_payment(payload)`.
5. Повторный grant по тому же payload не выдает награду второй раз.
6. `fairScore` не меняется от покупок.

Продукты используют `XTR` Telegram Stars.

Локальная проверка grant без Telegram:

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

После запуска API с `ZDNET_DEV_AUTH=1`:

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

Проверяет, что прогресс, gacha и платежные grant сохраняются после пересоздания repository.

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\backend
$env:ZDNET_DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'
py -3 tools\check_postgres_persistence.py
```
