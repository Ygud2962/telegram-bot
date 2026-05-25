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

## Тесты

```powershell
cd C:\Users\uragu\telegram-bot
py -3 -m unittest discover zero-day-defenders-network\backend\tests -q
```
