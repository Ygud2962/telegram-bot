import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = 'school_bot.db'

def init_db():
    """Инициализация базы данных."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Таблица замен
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS substitutions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            day TEXT NOT NULL,
            lesson_number INTEGER NOT NULL,
            old_subject TEXT NOT NULL,
            new_subject TEXT NOT NULL,
            old_teacher TEXT NOT NULL,
            new_teacher TEXT NOT NULL,
            class_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Таблица пользователей (для рассылки и аналитики)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            language_code TEXT,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Таблица активности пользователей (для аналитики)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            class_name TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')

    # Таблица статуса бота (техрежим)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bot_status (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            maintenance_mode INTEGER DEFAULT 0,
            maintenance_until TEXT DEFAULT NULL,
            maintenance_message TEXT DEFAULT NULL
        )
    ''')
    cursor.execute('INSERT OR IGNORE INTO bot_status (id, maintenance_mode) VALUES (1, 0)')
    
    # Таблица школьных новостей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Индексы для оптимизации
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_date ON substitutions(date)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_class_date ON substitutions(class_name, date)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_teacher_date ON substitutions(new_teacher, date)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON user_activity(timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at)')

    conn.commit()
    conn.close()
    print("✅ База данных инициализирована")

def update_database_structure():
    """Обновление структуры базы данных при необходимости."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Проверяем наличие таблицы активности
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_activity'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE user_activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                class_name TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        ''')
        print("✅ Добавлена таблица активности пользователей")

    # Проверяем наличие столбца last_active в таблице users
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'last_active' not in columns:
        cursor.execute('ALTER TABLE users ADD COLUMN last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        print("✅ Добавлен столбец last_active в таблицу users")

    # Проверяем наличие таблицы новостей
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='news'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✅ Добавлена таблица школьных новостей")
        cursor.execute('CREATE INDEX idx_news_published ON news(published_at)')
        print("✅ Добавлен индекс idx_news_published")

    # Проверяем наличие индексов
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_activity_timestamp'")
    if not cursor.fetchone():
        cursor.execute('CREATE INDEX idx_activity_timestamp ON user_activity(timestamp)')
        print("✅ Добавлен индекс idx_activity_timestamp")

    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_activity_user'")
    if not cursor.fetchone():
        cursor.execute('CREATE INDEX idx_activity_user ON user_activity(user_id)')
        print("✅ Добавлен индекс idx_activity_user")

    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_last_active'")
    if not cursor.fetchone():
        cursor.execute('CREATE INDEX idx_users_last_active ON users(last_active)')
        print("✅ Добавлен индекс idx_users_last_active")

    conn.commit()
    conn.close()

def add_user(user_id, username=None, first_name=None, last_name=None, language_code=None):
    """Добавляет или обновляет пользователя в базе данных."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO users (user_id, username, first_name, last_name, language_code, last_active)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ''', (user_id, username, first_name, last_name, language_code))
    conn.commit()
    conn.close()

def log_user_activity(user_id, action, class_name=None):
    """Логирует активность пользователя для аналитики."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO user_activity (user_id, action, class_name)
        VALUES (?, ?, ?)
    ''', (user_id, action, class_name))
    conn.commit()
    conn.close()

def get_active_users_24h():
    """Возвращает количество активных пользователей за последние 24 часа."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    yesterday = (datetime.now() - timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute('SELECT COUNT(DISTINCT user_id) FROM user_activity WHERE timestamp > ?', (yesterday,))
    count = cursor.fetchone()[0]
    conn.close()
    return count or 0

def get_popular_classes():
    """Возвращает список популярных классов за последнюю неделю."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute('''
        SELECT class_name, COUNT(*) as cnt
        FROM user_activity
        WHERE class_name IS NOT NULL AND timestamp > ?
        GROUP BY class_name
        ORDER BY cnt DESC
        LIMIT 5
    ''', (week_ago,))
    results = cursor.fetchall()
    conn.close()
    return [row[0] for row in results if row[0]] if results else []

def get_peak_hours():
    """Возвращает пиковые часы использования бота за последнюю неделю."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute('''
        SELECT strftime('%H', timestamp) as hour, COUNT(*) as cnt
        FROM user_activity
        WHERE timestamp > ?
        GROUP BY hour
        ORDER BY cnt DESC
        LIMIT 3
    ''', (week_ago,))
    results = cursor.fetchall()
    conn.close()
    if results:
        hours = [f"{int(row[0]):02d}:00" for row in results]
        return ", ".join(hours)
    return "Нет данных"

def get_user_count():
    """Возвращает количество пользователей."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM users')
    count = cursor.fetchone()[0]
    conn.close()
    return count

def get_all_users():
    """Возвращает список всех пользователей."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT user_id, username, first_name, last_name FROM users')
    users = cursor.fetchall()
    conn.close()
    return users

def add_substitution(date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name):
    """Добавление замены в базу данных."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO substitutions
        (date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name))
    conn.commit()
    conn.close()
    print(f"✅ Замена добавлена: {date} {class_name} урок {lesson_number}")

def get_substitutions_for_date(date):
    """Получение всех замен на конкретную дату."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM substitutions WHERE date = ? ORDER BY class_name, lesson_number
    ''', (date,))
    results = cursor.fetchall()
    conn.close()
    return results

def get_substitutions_for_class_date(class_name, date):
    """Получение замен для конкретного класса на дату."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM substitutions
        WHERE class_name = ? AND date = ?
        ORDER BY lesson_number
    ''', (class_name, date))
    results = cursor.fetchall()
    conn.close()
    return results

def get_substitutions_by_teacher_and_date(teacher_name, date):
    """Получение замен для конкретного учителя на дату."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM substitutions
        WHERE (new_teacher = ? OR old_teacher = ?) AND date = ?
        ORDER BY lesson_number
    ''', (teacher_name, teacher_name, date))
    results = cursor.fetchall()
    conn.close()
    return results

def get_all_substitutions():
    """Получение всех замен из базы данных."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM substitutions ORDER BY date DESC, class_name, lesson_number
    ''')
    results = cursor.fetchall()
    conn.close()
    return results

def delete_substitution(sub_id):
    """Удаление замены по ID."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM substitutions WHERE id = ?', (sub_id,))
    conn.commit()
    conn.close()
    print(f"✅ Замена ID={sub_id} удалена")

def clear_all_substitutions():
    """Очистка всей таблицы замен."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM substitutions')
    conn.commit()
    conn.close()
    print("✅ Все замены удалены")

# ==================== ФУНКЦИИ УПРАВЛЕНИЯ ТЕХРЕЖИМОМ ====================
def set_maintenance_mode(enabled: bool, until: str = None, message: str = None):
    """Включить/выключить техрежим."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE bot_status
        SET maintenance_mode = ?, maintenance_until = ?, maintenance_message = ?
        WHERE id = 1
    ''', (1 if enabled else 0, until, message))
    conn.commit()
    conn.close()

def get_maintenance_status():
    """Получить текущий статус техрежима."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT maintenance_mode, maintenance_until, maintenance_message FROM bot_status WHERE id = 1')
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            'enabled': bool(row[0]),
            'until': row[1],
            'message': row[2]
        }
    return {'enabled': False, 'until': None, 'message': None}

# ==================== ФУНКЦИИ ДЛЯ ШКОЛЬНЫХ НОВОСТЕЙ ====================
def add_news(title, content):
    """Добавляет новость в базу данных."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('INSERT INTO news (title, content) VALUES (?, ?)', (title, content))
    conn.commit()
    news_id = cursor.lastrowid
    conn.close()
    return news_id

def get_latest_news(limit=5):
    """Получает последние новости из базы данных."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, title, content, published_at 
        FROM news 
        ORDER BY published_at DESC 
        LIMIT ?
    ''', (limit,))
    results = cursor.fetchall()
    conn.close()
    return results

def get_all_news():
    """Получает все новости из базы данных."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, title, content, published_at 
        FROM news 
        ORDER BY published_at DESC
    ''')
    results = cursor.fetchall()
    conn.close()
    return results
