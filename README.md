<!-- HEADER -->
<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=28&duration=3000&color=38b6ff&center=true&vCenter=true&multiline=false&lines=🤖+SchoolBot;Telegram+бот+для+школы" alt="Typing SVG" />
</p>

<p align="center">
  <strong>Умный помощник для отслеживания замен, расписания и школьных новостей</strong>
</p>

<p align="center">
  <a href="#-возможности">✨ Возможности</a> •
  <a href="#-быстрый-старт">🚀 Старт</a> •
  <a href="#-настройка">⚙️ Настройка</a> •
  <a href="#-деплой">📦 Деплой</a> •
  <a href="#-для-разработчиков">👨‍💻 Dev</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Telegram_Bot-API-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram Bot">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Статус-✅_Работает-brightgreen?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/Версия-1.0-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/Часовой_пояс-Europe/Minsk-orange?style=flat-square" alt="Timezone">
</p>

---

## 🎯 О проекте

> 🏫 **SchoolBot** — это современный Telegram-бот, созданный для автоматизации школьной жизни.  
> Мгновенные уведомления о заменах, удобное расписание, персональные настройки и школьные новости — всё в одном месте.

┌─────────────────────────────────┐
│ 📱 Пользователь открывает бота │
│ ▼ │
│ 🔹 Выбирает класс/учителя │
│ 🔹 Получает актуальные замены │
│ 🔹 Сохраняет в «Избранное» │
│ 🔹 Читает школьные новости │
│ ▼ │
│ ⚡ Всё за 2-3 клика! │
└─────────────────────────────────┘


---

## ✨ Возможности

### 👥 Для учеников и родителей
| Иконка | Функция | Описание |
|:---:|---|---|
| 🔁 | **Замены учителей** | Мгновенные уведомления об изменениях в расписании |
| 📅 | **Расписание** | Актуальное расписание по классам 5–11 |
| 🌟 | **Моё / Избранное** | Сохранение частых запросов для быстрого доступа |
| 🔍 | **Умный поиск** | Фильтрация по дате, классу, учителю или предмету |
| 📰 | **Школьные новости** | Лента объявлений от администрации |
| 🔔 | **Звонки и питание** | Расписание уроков и время обедов |

### 👨‍🏫 Для учителей
```diff
+ Персональная лента замен по фамилии
+ Быстрый доступ к своему расписанию
+ Уведомления о важных объявлениях

⚙️ Для администраторов
+ ➕ Добавление/удаление замен в 2 клика
+ 📝 Публикация и редактирование новостей
+ 🔧 Техрежим с кастомным сообщением
+ 📊 Аналитика: пользователи, активность, пики
+ 👥 Мониторинг аудитории бота

🚀 Быстрый старт
<details open>
<summary><b>📦 Установка за 5 шагов</b></summary>
# 1️⃣ Клонируем репозиторий
git clone https://github.com/Ygud2962/telegram-bot.git
cd telegram-bot

# 2️⃣ Создаём виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows

# 3️⃣ Устанавливаем зависимости
pip install -r requirements.txt

# 4️⃣ Настраиваем переменные окружения
cp .env.example .env
# Отредактируйте .env, добавив BOT_TOKEN и другие параметры

# 5️⃣ Инициализируем БД и запускаем
python database.py  # Создание таблиц
python bot.py       # 🎉 Запуск!

⚙️ Настройка
🔐 Переменные окружения (.env)
# 🤖 Telegram
BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# 🗄 База данных (опционально, по умолчанию SQLite)
DATABASE_URL=postgresql://user:pass@localhost/schoolbot?sslmode=require

# 👤 Администратор
ADMIN_ID=123456789

# 🪵 Логирование
LOG_LEVEL=INFO  # DEBUG | INFO | WARNING | ERROR

🎨 Кастомизация
# bot.py — основные настройки
TIMEZONE = "Europe/Minsk"          # 🕐 Часовой пояс
DEFAULT_CLASS_RANGE = (5, 11)      # 🏫 Диапазон классов
MAX_FAVORITES_PER_USER = 10        # ⭐ Лимит избранного

🗄 База данных
Поддерживаемые СУБД
✅ PostgreSQL  — рекомендуется для production
✅ SQLite      — идеально для локальной разработки

📊 Схема данных
erDiagram
    users ||--o{ user_activity : "логирует"
    users ||--o{ user_favorites : "сохраняет"
    substitutions ||--o{ user_activity : "просматривают"
    news ||--o{ users : "получают"
    
    users {
        int id PK
        int telegram_id UK
        string username
        datetime first_seen
    }
    substitutions {
        int id PK
        string teacher
        string class_group
        date substitution_date
        string reason
    }
    news {
        int id PK
        string title
        text content
        datetime published_at
    }

📦 Деплой
🚂 Railway (рекомендуется ⭐)
<p align="center">
<a href="https://railway.app/new/template?template=https://github.com/Ygud2962/telegram-bot">
<img src="https://railway.app/button.svg" alt="Deploy on Railway" height="40">
</a>
</p>

Пошагово:
Нажмите кнопку Deploy выше
Подключите GitHub-репозиторий
Добавьте переменные: BOT_TOKEN, ADMIN_ID
Добавьте плагин PostgreSQL (автоматически создаст DATABASE_URL)
Готово! 🎉 Бот запустится автоматически
🎨 Render
# render.yaml (опционально)
services:
  - type: worker
    name: schoolbot
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python bot.py
    envVars:
      - key: BOT_TOKEN
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: schoolbot-db
          property: connectionString

🖥 Локальный сервер (production)
# Используем systemd для автозапуска (Linux)
sudo nano /etc/systemd/system/schoolbot.service

[Unit]
Description=SchoolBot Telegram Bot
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/schoolbot
ExecStart=/opt/schoolbot/venv/bin/python bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
sudo systemctl enable --now schoolbot
sudo systemctl status schoolbot  # ✅ Проверка статуса

👨‍💻 Для разработчиков
🧰 Технологический стек
<p align="center">
<img src="https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white&style=flat" alt="Python">
<img src="https://img.shields.io/badge/python--telegram--bot-20.7-2CA5E0?logo=telegram&style=flat" alt="PTB">
<img src="https://img.shields.io/badge/psycopg2-4169E1?logo=postgresql&style=flat" alt="psycopg2">
<img src="https://img.shields.io/badge/pytz-Europe/Minsk-orange?style=flat" alt="pytz">

📁 Структура проекта
telegram-bot/
├── 🤖 bot.py          # Ядро бота: обработчики, клавиатуры, логика
├── 🗄 database.py     # Работа с БД: CRUD, пул, аналитика
├── 🔧 migration.py    # Скрипты миграции схемы БД
├── 📦 requirements.txt# Зависимости Python
├── 🚀 Procfile        # Конфиг для Railway/Render
├── 🔒 .env.example    # Шаблон переменных окружения
├── 🙈 .gitignore      # Исключения для Git
├── 🐍 .python-version # Версия Python для pyenv
└── 📄 README.md       # Вы здесь!

🧪 Тестирование
# Запуск в режиме отладки
LOG_LEVEL=DEBUG python bot.py

# Проверка подключения к БД
python -c "from database import get_connection; print(get_connection().status)"

# Линтинг и форматирование
pip install black isort flake8
black . && isort . && flake8 .

🤝 Contribution Guide
graph LR
    A[Fork репозитория] --> B[Создать ветку feature/xxx]
    B --> C[Внести изменения + тесты]
    C --> D[black/isort форматирование]
    D --> E[Push + Pull Request]
    E --> F[Code Review ✅]
    F --> G[Merge в main 🎉]

🔧 Команды бота
👤 Пользовательские
Команда
Описание
Пример
/start
🏠 Главное меню и приветствие
—
/teachers
👥 Список учителей для поиска
—
🌟 Моё
⭐ Управление избранными запросами
Кнопка в меню
🔐 Административные (только для ADMIN_ID)
Команда
Действие
Режим
/test
🧪 Отправка тестового уведомления
Мгновенно
/add_sub
➕ Добавление замены
🎛 Интерактивный
/del_sub <id>
❌ Удаление замены по ID
CLI
/add_news
📰 Публикация новости
🎛 Интерактивный
`/maintenance on
off`
🔧 Вкл/выкл техрежим
/stats
📊 Показ статистики бота
Мгновенно
💡 Совет: Используйте /add_sub и /add_news — они запускают удобный пошаговый мастер добавления!
❓ FAQ
<details>
<summary><b>❓ Бот не отвечает после запуска</b></summary>

✅ Проверьте:
BOT_TOKEN указан верно и без лишних пробелов
Бот активирован в @BotFather
Нет ошибок в консоли при запуске python bot.py
Порт не занят (если используете webhook)
</details>

<details>
<summary><b>❓ Ошибка подключения к PostgreSQL</b></summary>

✅ Убедитесь, что:
DATABASE_URL содержит правильные учетные данные
Для облачных БД добавлен параметр ?sslmode=require
Сервер БД разрешает подключения с вашего IP
У пользователя есть права на создание таблиц
</details>

<details>
<summary><b>❓ Как обновить расписание классов?</b></summary>

✅ Отредактируйте словарь SCHEDULE_STRUCTURED в bot.py:

SCHEDULE_STRUCTURED = {
    "5А": {
        "Понедельник": [
            {"lesson": 1, "subject": "Математика", "teacher": "Иванова А.А.", "room": "205"},
        ]
    }
}

→ Перезапустите бота: systemctl restart schoolbot или просто Ctrl+C / python bot.py
</details>

<details>
<summary><b>❓ Где посмотреть логи?</b></summary>

✅ Варианты:
Локально: вывод в консоль или файл (если настроен logging.FileHandler)
Railway: вкладка Logs в панели проекта
Render: раздел Events → View Logs
Systemd: journalctl -u schoolbot -f
</details>
gantt
    title Дорожная карта SchoolBot
    dateFormat  YYYY-MM
    section Ядро
    Оптимизация БД           :done,    des1, 2026-01, 2026-02
    Кэширование Redis        :active,  des2, 2026-02, 2026-03
    section Функции
    Экспорт расписания PDF   :         des3, 2026-03, 2026-04
    Голосовые уведомления    :         des4, 2026-04, 2026-05
    section Интеграции
    Google Calendar sync     :         des5, 2026-05, 2026-06
    Школьный портал API      :         des6, 2026-06, 2026-07

<img src="https://img.shields.io/badge/asyncio-✅-brightgreen?style=flat" alt="asyncio">
</p>


💬 Поддержка и обратная связь
🐛 Нашли баг?        → Создайте [Issue](https://github.com/Ygud2962/telegram-bot/issues)
💡 Есть идея?        → Откройте [Discussion](https://github.com/Ygud2962/telegram-bot/discussions)
🤝 Хотите помочь?    → Прочитайте [CONTRIBUTING.md](CONTRIBUTING.md)
📧 Личное сообщение  → @Ygud2962 в Telegram

📄 Лицензия
<p align="center">
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/128px-MIT_logo.svg.png" width="64" alt="MIT License">
</p>
MIT License © 2026 Ygud2962

Разрешается бесплатное использование, копирование, модификация 
и распространение ПО при условии сохранения уведомления об авторских правах.

Полный текст: https://opensource.org/licenses/MIT
<p align="center">
<sub>Сделано с ❤️ для школьного сообщества</sub><br>
<sub>🇧🇾 Europe/Minsk (UTC+3) • Последнее обновление: Февраль 2026</sub>
</p>

<p align="center">
<a href="https://github.com/Ygud2962/telegram-bot">
<img src="https://img.shields.io/github/stars/Ygud2962/telegram-bot?style=social" alt="GitHub Stars">
</a>
<a href="https://github.com/Ygud2962/telegram-bot/fork">
<img src="https://img.shields.io/github/forks/Ygud2962/telegram-bot?style=social" alt="GitHub Forks">
</a>
</p>

<p align="center">
<strong>⭐ Понравился проект? Поставьте звезду — это лучшая поддержка!</strong>
</p>



