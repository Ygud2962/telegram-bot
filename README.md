# 🏫 School Telegram Bot + Mini App

## 🔐 «Шифровальщик» (1941–1945)
Школьный Telegram-бот с расписанием/заменами/новостями и встроенной образовательной Mini App-игрой.

<!-- AUTOVERSION:START -->
[![Версия бота](https://img.shields.io/badge/🤖_ВЕРСИЯ-9.0.0-2196F3?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ygud2962/telegram-bot)
[![Версия игры](https://img.shields.io/badge/🎮_ВЕРСИЯ-1.2.17-FF9800?style=for-the-badge&logo=html5&logoColor=white)](https://ygud2962.github.io/telegram-bot/)

| Компонент | Версия |
|---|---|
| 🤖 Bot | **9.0.0** |
| 🎮 Game | **1.2.17** |
<!-- AUTOVERSION:END -->

[Бот в Telegram](https://t.me/school_hoiniki_sch3_bot)

---

## Что в проекте

- Telegram-бот на `python-telegram-bot`.
- PostgreSQL (пользователи, расписание, замены, новости, прогресс игры).
- Встроенный HTTP-сервер `aiohttp` в том же процессе:
  - отдает Mini App (`/game`, `/game/`, `/index.html`);
  - принимает API синхронизации игры (`/game_sync`, `/game_state`, `/game_leaderboard`, `/game_reset`).
- Клиент игры на `HTML/CSS/Vanilla JS` (`game/index.html`, `game/game.js`).

---

## Основные возможности

### Бот
- Расписание по классам/учителям.
- Замены (вручную и через фото с AI-разбором).
- Новости с разделением на:
  - `🏫 Новости школы`
  - `🤖 Новости бота`
- Админ-панель: пользователи, режимы игры, роли, публикации, техрежим.
- AI-помощник (через `GROQ_API_KEY`, если ключ задан).

### Игра
- 6 глав, 36 заданий, 6 типов шифров/задач.
- Рейтинг, достижения, артефакты.
- Автосохранение прогресса в БД.
- Продолжение главы после выхода.
- Перезапуск главы с подтверждением и штрафом.
- Настройки звука:
  - 5 CC0-треков;
  - вкл/выкл музыки и эффектов;
  - отдельная громкость музыки/эффектов.
- Кнопка «Сообщить об ошибке» с переходом к админу игры.

### Реферальная система («Агенты»)
- Личная ссылка: `https://t.me/<bot_username>?start=ref_<user_id>`.
- Бонусы:
  - новому игроку: `+50` стартовых очков;
  - пригласившему: `+30` за каждую главу, пройденную агентом.
- В игре в профиле показываются:
  - агрегированная статистика по агентам;
  - список агентов и их вклад.
- Добавлены достижения за рефералов (первый агент, 3 агента, бонусные очки).

---

## Роли и доступ (важно)

В проекте разделены **админ бота** и **роль в игре**.

- `bot_admin` (таблица `bot_admins`): права на админку бота.
- `game_role` (таблица `game_roles`): `admin`, `tester`, `player`.

`bot_admin` **не делает пользователя автоматически** `game admin`.

### Режимы доступа к игре
- `closed`: доступ только `game admin`.
- `beta`: `game admin` + `tester` + пользователи из beta-списка.
- `open`: доступ всем.

---

## Быстрый старт (локально)

```bash
git clone https://github.com/ygud2962/telegram-bot.git
cd telegram-bot
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python bot.py
```

---

## Переменные окружения

### Обязательные

| Переменная | Описание |
|---|---|
| `BOT_TOKEN` | токен Telegram-бота |
| `DATABASE_URL` | строка подключения PostgreSQL |
| `GAME_URL` | публичный URL Mini App (рекомендуется `https://<domain>/game/`) |
| `BOT_PUBLIC_URL` | публичный URL backend бота (`https://<domain>`) |

### Рекомендуемые/опциональные

| Переменная | По умолчанию | Описание |
|---|---|---|
| `PORT` | `8080` | порт HTTP-сервера |
| `BOT_VERSION` | `9.0.0` | версия бота (показывается в `/version`) |
| `GAME_VERSION` | `1.2.17` | версия игры (cache-bust Mini App) |
| `GAME_BETA` | `0` | legacy-флаг беты (текущий режим задается через админку/БД) |
| `GAME_AUTH_REQUIRED` | `1` | проверять подпись Telegram `init_data` |
| `GAME_AUTH_TTL_SEC` | `86400` | TTL `init_data` в секундах |
| `GROQ_API_KEY` | пусто | ключ для AI-помощника |
| `DB_STARTUP_MAX_WAIT_SEC` | `180` | сколько ждать БД при старте |
| `DB_STARTUP_RETRY_SEC` | `5` | шаг повторной попытки БД |
| `SLOW_DB_MS` | `350` | порог warning для медленных DB-вызовов |
| `SLOW_CALLBACK_MS` | `1000` | порог warning для медленных callback-обработчиков |

`RAILWAY_PUBLIC_DOMAIN` / `RAILWAY_STATIC_URL` могут использоваться как fallback для `BOT_PUBLIC_URL`.

---

## Настройка Railway (рекомендуемая схема)

1. Подключите PostgreSQL в Railway.
2. Добавьте переменные:
   - `BOT_TOKEN`
   - `DATABASE_URL`
   - `BOT_PUBLIC_URL=https://<your-service>.up.railway.app`
   - `GAME_URL=https://<your-service>.up.railway.app/game/`
   - `GAME_VERSION=<текущая версия>`
3. После изменений фронта увеличивайте `GAME_VERSION` (например, `1.2.17 -> 1.2.18`).
4. Открывайте игру только через кнопку бота, а не старую вкладку WebView.

---

## Сброс прогресса и «агенты»

Админ-панель поддерживает 2 режима сброса:

- `Только очки/главы` — реферальные связи остаются.
- `С агентами` — реферальные связи удаляются.

Это доступно:
- для сброса конкретного игрока;
- для массового сброса;
- для self-reset у `game admin`.

---

## API Mini App (внутренний)

- `POST /game_sync` — синхронизация прогресса из клиента в БД.
- `GET /game_state?user_id=...` — состояние игрока (роль, очки, главы, reset_token, агенты).
- `GET /game_leaderboard?user_id=...` — рейтинг.
- `POST /game_reset` — self-reset (разрешен только `game admin`, с опцией `drop_referrals`).
- `GET /health` — healthcheck.

При включенном `GAME_AUTH_REQUIRED=1` API ожидает валидный Telegram `init_data`.

---

## Команды бота

- `/start` — главное меню
- `/cancel` — отмена текущего сценария
- `/version` — версия и базовый статус
- `/teacher` — регистрация учителя
- `/claim_admin` — техническая команда первичного назначения админа

---

## Проверка перед деплоем

```bash
python -m py_compile bot.py database.py game_security.py
python -m unittest tests.test_game_security
python scripts/update_readme_versions.py
```

---

## Частые проблемы

### 1) `Game failed to load` / зависание экрана загрузки
- Убедитесь, что `GAME_URL` и `BOT_PUBLIC_URL` корректны.
- Увеличьте `GAME_VERSION`.
- Переоткройте Mini App из кнопки в боте.

### 2) В логах `409 Conflict getUpdates`
В проекте есть lock и фильтрация шума при overlap-редеплоях. Кратковременный `409` во время переключения инстанса допустим.

### 3) Прогресс «не совпадает» между ботом и игрой
- Проверьте, что игра открыта с актуальным `GAME_VERSION`.
- Проверьте, что backend доступен по `BOT_PUBLIC_URL`.
- Проверьте ответы `/game_state` и `/game_sync`.

---

## Структура проекта

```text
telegram-bot/
├─ bot.py
├─ database.py
├─ game_security.py
├─ ui_texts.py
├─ game/
│  ├─ index.html
│  ├─ game.js
│  └─ security_patch.js
├─ scripts/
│  ├─ deploy-vscode.ps1
│  ├─ update_readme_versions.py
│  └─ update_latest_bot_news.py
├─ tests/
│  └─ test_game_security.py
├─ deploy.bat
└─ README.md
```

---

## Полезные скрипты

- `deploy.bat` — деплой через `main` (с авто-обновлением версий README).
- `scripts/update_readme_versions.py` — синхронизация блока версий в README.
- `scripts/update_latest_bot_news.py` — обновление тех-новостей (если используется в процессе релизов).

---

## Контакты

- Бот: [@school_hoiniki_sch3_bot](https://t.me/school_hoiniki_sch3_bot)
- Админ: [@Yury_hud](https://t.me/Yury_hud)

