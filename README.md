# 🏫 School Telegram Bot + Mini App

<div align="center">

# 🔐 ШИВРОВАЛЬЩИК · 1941-1945
### Школьный Telegram-бот + образовательная Telegram Mini App

<!-- AUTOVERSION:START -->
[![Версия бота](https://img.shields.io/badge/🤖_ВЕРСИЯ-8.0.0-2196F3?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ygud2962/telegram-bot)
[![Версия игры](https://img.shields.io/badge/🎮_ВЕРСИЯ-1.2.0-FF9800?style=for-the-badge&logo=html5&logoColor=white)](https://ygud2962.github.io/telegram-bot/)

| Компонент | Версия |
|---|---|
| 🤖 Bot | **8.0.0** |
| 🎮 Game | **1.2.0** |
<!-- AUTOVERSION:END -->

[![Статус](https://img.shields.io/badge/✅_СТАТУС-РАБОТАЕТ-brightgreen?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/school_hoiniki_sch3_bot)
[![Python](https://img.shields.io/badge/🐍_PYTHON-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/🗄_POSTGRESQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Deploy](https://img.shields.io/badge/🚀_DEPLOY-Railway-6f4cff?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)
[![AI](https://img.shields.io/badge/🤖_AI-Groq_llama--3.3--70b-FF6B35?style=for-the-badge&logo=openai&logoColor=white)](https://groq.com/)

**Расписание · Замены · Новости · ИИ-помощник · Игра "Шивровальщик"**

[📱 Открыть бота](https://t.me/school_hoiniki_sch3_bot) · [🎮 Играть в Шивровальщика](https://ygud2962.github.io/telegram-bot/)

</div>

---

## ✨ Что это

Единая школьная система в Telegram:
- бот для учеников, родителей, учителей и администраторов;
- оперативные замены и новости;
- Telegram Mini App игра "Шивровальщик" с рейтингом и достижениями.

---

## ⚡ Основные возможности

- 📚 Расписание по классам и учителям (день/неделя/сейчас).
- 🔄 Замены уроков (вручную и через фото с ИИ-распознаванием).
- 📣 Новости школы с публикацией и рассылкой.
- ⭐ Раздел "Избранное" для быстрого доступа.
- 🤖 ИИ-помощник (режимы ученик/педагог).
- 🎮 Игра "Шивровальщик" с синхронизацией прогресса.
- 👑 Админ-панель: пользователи, техрежим, игра, аналитика.

---

## 🎮 Игра "Шивровальщик"

Мини-игра о событиях 1941-1945 годов на территории Беларуси:
- 6 глав и 36 заданий;
- 6 типов шифров;
- таблица лидеров и достижения;
- доступ через кнопку `🎮 Шивровальщик` в боте.

---

## 🚀 Быстрый старт

```bash
git clone https://github.com/ygud2962/telegram-bot.git
cd telegram-bot
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate
pip install -r requirements.txt
python bot.py
```

---

## ⚙️ Переменные окружения

| Переменная | Обязательно | Описание |
|---|---:|---|
| `BOT_TOKEN` | ✅ | Токен Telegram-бота |
| `DATABASE_URL` | ✅ | Подключение к PostgreSQL |
| `GAME_URL` | ✅ | Публичный URL игры |
| `BOT_PUBLIC_URL` | ✅ | Публичный URL бота для `/game_sync`, `/game_state` и `/game_leaderboard` |
| `BOT_VERSION` | ⛳ | Версия бота (по умолчанию `8.0.0`) |
| `GAME_VERSION` | ⛳ | Версия игры (по умолчанию `1.2.0`) |
| `GROQ_API_KEY` | ⛳ | Ключ Groq для ИИ-помощника |
| `GAME_BETA` | ⛳ | Режим беты игры (`0` или `1`) |
| `GAME_AUTH_REQUIRED` | ⛳ | Обязательная проверка Telegram `init_data` для API игры (`1` по умолчанию) |
| `GAME_AUTH_TTL_SEC` | ⛳ | Срок жизни `init_data` в секундах (по умолчанию `86400`) |

---

## 🔄 Автообновление версий в README

В проекте есть скрипт:

```bash
python scripts/update_readme_versions.py
```

Он автоматически берёт версии из `bot.py` (`BOT_VERSION` и `GAME_VERSION`) и обновляет:
- блок `AUTOVERSION` в начале README;
- значения по умолчанию в таблице переменных окружения.

Скрипт также запускается в `deploy.bat` перед коммитом/пушем.

---

## 🧱 Стек

- `python-telegram-bot` 20.x
- `aiohttp`
- `httpx`
- `PostgreSQL`
- `pytz`
- HTML/CSS/Vanilla JS (Mini App)

---

## 🗂 Структура проекта

```text
telegram-bot/
├─ bot.py
├─ database.py
├─ game/
│  ├─ index.html
│  └─ game.js (legacy-файл, текущий runtime использует inline-скрипт в `index.html`)
├─ scripts/
│  ├─ deploy-vscode.ps1
│  └─ update_readme_versions.py
├─ deploy.bat
├─ requirements.txt
└─ README.md
```

---

## 🧪 Проверки перед деплоем

```bash
python -m py_compile bot.py database.py game_security.py
python -m unittest tests.test_game_security
python scripts/update_readme_versions.py
```

Рекомендуется проверить вручную в Telegram:
1. `/version`
2. Главное меню и кнопки
3. Разделы `Расписание`, `Замены`, `Новости`
4. Открытие Mini App и синхронизацию игры

---

## 💬 Контакты

- Бот: [@school_hoiniki_sch3_bot](https://t.me/school_hoiniki_sch3_bot)
- Администратор: [@Yury_hud](https://t.me/Yury_hud)

---

## 📜 Лицензия

Проект создан в образовательных целях.  
Использование кода разрешено с указанием автора.

© 2026 ГУО "Средняя школа №3 г. Хойники"
