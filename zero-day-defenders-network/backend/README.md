# Backend Scaffold

Минимальный backend-прототип для `ZERO_DAY: ЗАЩИТНИКИ СЕТИ`.

## Почему стандартный HTTP

MVP backend сделан на стандартном `http.server`, чтобы запускаться без установки зависимостей. Доменная логика отделена от HTTP-слоя, чтобы позже можно было перейти на FastAPI, aiohttp или другой production-фреймворк.

## Запуск

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

## Тесты

```powershell
cd C:\Users\uragu\telegram-bot
py -3 -m unittest discover zero-day-defenders-network\backend\tests -q
```
