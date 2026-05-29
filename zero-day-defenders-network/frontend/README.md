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

Сейчас [app.js](app.js) и [styles.css](styles.css) слишком большие. Следующий правильный шаг - разделить frontend на модули:

```text
src/
  main.js
  api.js
  state.js
  router.js
  screens/
  minigames/
  ui/
styles/
  tokens.css
  layout.css
  components.css
  screens.css
  animations.css
```

До разделения модулей лучше не добавлять крупные новые экраны.
