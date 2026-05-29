# ZERO_DAY Frontend

Статический Telegram Mini App prototype без сборки.

Сейчас frontend нужен для проверки UX и полного MVP-loop:

- HUD игрока.
- SVG-карта города.
- Лента активных угроз.
- Tab bar.
- Экраны инструментов, коллекции, демона, отряда, сюжета и магазина.
- Packet Rain на Canvas.
- Подключение к backend API.
- Fallback mock-режим, если backend недоступен.

## Структура

```text
frontend/
  index.html
  app.js                 Главный экранный контроллер и gameplay loop
  styles.css             Entry CSS с @import
  src/
    runtime.js           Telegram WebApp runtime, API base, haptics
    mockState.js         Начальное mock-состояние для offline/dev режима
  styles/
    foundations.css      Tokens, base, app shell, HUD
    components.css       Cards, buttons, shop/tools components
    screens.css          Map, tabs, collection and screen layouts
    overlays.css         Packet Rain overlay, toast, reward sheet
    responsive.css       Mobile and reduced-motion rules
```

## Запуск

```powershell
cd C:\Users\uragu\telegram-bot\zero-day-defenders-network\frontend
py -3 -m http.server 5173
```

Открыть:

```text
http://localhost:5173
```

## Подключение к API

По умолчанию frontend пытается подключиться к локальному backend:

```text
http://localhost:8090
```

Для другого API можно задать URL в консоли браузера:

```js
localStorage.setItem("ZDNET_API_BASE", "https://your-api.example.com")
location.reload()
```

Сброс:

```js
localStorage.removeItem("ZDNET_API_BASE")
location.reload()
```

## Технический долг

`styles.css` уже разделен на тематические файлы. Следующий правильный шаг - дальше дробить [app.js](app.js):

```text
src/
  main.js
  api.js
  state.js
  router.js
  screens/
  minigames/
  ui/
```

До полного разделения `app.js` лучше не добавлять крупные новые экраны.
