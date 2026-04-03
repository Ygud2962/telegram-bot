# 🎓 School Telegram Bot + Web Game

<div align="center">

![status](https://img.shields.io/badge/status-production-22c55e?style=for-the-badge)
![python](https://img.shields.io/badge/python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![postgres](https://img.shields.io/badge/postgresql-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![railway](https://img.shields.io/badge/deploy-railway-6f4cff?style=for-the-badge&logo=railway&logoColor=white)

### 🔖 Current Release

| Component | Version |
|---|---|
| 🤖 Bot | **7.1.0** |
| 🎮 Game | **1.1.0** |

`/version` в боте показывает актуальные версии в рантайме.

</div>

---

## ✨ Что это
Единая система для школы:
- Telegram-бот: расписание, замены, новости, уведомления, админ-панель.
- WebApp-игра «Шифровальщик»: главы, рейтинг, достижения, роли, синхронизация с БД.

---

## 🚀 Ключевые возможности
- 📚 Расписание по классам и учителям
- 🔄 Замены (вручную + распознавание по фото)
- 📰 Новости и массовая рассылка
- 🎮 Встроенная игра с лидербордом и достижениями
- 🛡️ Роли и режимы доступа
- 📈 Админ-аналитика

---

## 🎮 Режимы доступа игры
Глобальный режим включается в админ-панели `Управление игрой`:

| Режим | Поведение |
|---|---|
| `closed` | ❌ Доступ к игре закрыт всем игрокам |
| `beta` | 🧪 Доступ только разрешённым (бета-список / tester / admin / bot-admin) |
| `open` | ✅ Доступ открыт всем |

> Смена режима: `Бета-режим` / `Игра открыта` / `Игра закрыта`.

---

## 🧱 Технологии
- `python-telegram-bot` 20.x
- `aiohttp` (HTTP для WebApp sync/state)
- `PostgreSQL`
- `httpx`
- `pytz`

---

## ⚙️ Переменные окружения
| Variable | Required | Description |
|---|---:|---|
| `BOT_TOKEN` | ✅ | Токен Telegram-бота |
| `DATABASE_URL` | ✅ | Подключение к PostgreSQL |
| `GAME_URL` | ✅ | Публичный URL WebApp-игры |
| `BOT_PUBLIC_URL` | ✅ | Публичный URL бота для `/game_sync` и `/game_state` |
| `BOT_VERSION` | ⛳ | Версия бота (по умолчанию `7.1.0`) |
| `GAME_VERSION` | ⛳ | Версия игры (по умолчанию `1.1.0`) |
| `GROQ_API_KEY` | ⛳ | Ключ ИИ-помощника |

---

## 🧭 Быстрый старт
1. Настройте переменные окружения.
2. Установите зависимости:
   ```bash
   pip install -r requirements.txt
   ```
3. Запустите бота:
   ```bash
   python bot.py
   ```

---

## 📂 Структура
```text
telegram-bot/
├─ bot.py            # Telegram bot + HTTP endpoints для игры
├─ database.py       # SQL-логика и доступ к PostgreSQL
├─ game/
│  └─ index.html     # WebApp-игра
├─ requirements.txt
├─ Procfile
└─ README.md
```

---

## 🧪 Проверки перед деплоем
```bash
python -m py_compile bot.py database.py
```

Рекомендуется проверить в Telegram:
1. `/version`
2. Открытие WebApp
3. Переключение режимов `closed/beta/open`
4. Синхронизацию прогресса и рейтинга

---

## 💬 Контакты
- Telegram: [@school_hoiniki_sch3_bot](https://t.me/school_hoiniki_sch3_bot)
- Администратор: [@Yury_hud](https://t.me/Yury_hud)

<div align="center">

### ⭐ If this project helps your school — give it a star on GitHub

</div>
