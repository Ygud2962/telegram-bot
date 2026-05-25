# Frontend Prototype

Статический прототип Telegram Mini App без сборки.

## Запуск

Открыть `index.html` в браузере или отдать папку любым static server.

Пример:

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\frontend
py -3 -m http.server 5173
```

Затем открыть:

```text
http://localhost:5173
```

## Что уже есть

- HUD.
- SVG-карта.
- Threat feed.
- Таб-бар.
- Статические экраны инструментов, коллекции, демона, отряда, сюжета, магазина.
- Прототип Packet Rain на Canvas.
- Автоподключение к backend `http://localhost:8090`.
- Fallback в mock-режим, если backend не запущен.

Это не production frontend, а первый UX/interaction slice для проверки направления.

## Подключение к другому API

В консоли браузера:

```js
localStorage.setItem("ZDNET_API_BASE", "https://your-api.example.com")
location.reload()
```
