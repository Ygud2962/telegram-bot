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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER NOT NULL
        )
    ''')

    # Таблица пользователей (для рассылки)
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

    # Таблица статистики использования
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usage_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            details TEXT
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

    # Индексы для оптимизации
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_date ON substitutions(date)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_class_date ON substitutions(class_name, date)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_teacher_date ON substitutions(new_teacher, date)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_created_at ON substitutions(created_at)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_stats(timestamp)')

    conn.commit()
    conn.close()
    print("✅ База данных инициализирована")

def update_database_structure():
    """Обновление структуры базы данных при необходимости."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Проверяем наличие таблицы пользователей
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE users (
                user_id INTEGER PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                language_code TEXT,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✅ Добавлена таблица пользователей")
    
    # Добавляем поле last_active если его нет
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'last_active' not in columns:
        cursor.execute('ALTER TABLE users ADD COLUMN last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        print("✅ Добавлено поле last_active в таблицу пользователей")
    
    # Проверяем наличие таблицы статистики
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='usage_stats'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE usage_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                details TEXT
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_stats(timestamp)')
        print("✅ Добавлена таблица статистики использования")
    
    # Проверяем наличие поля created_by в substitutions
    cursor.execute("PRAGMA table_info(substitutions)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'created_by' not in columns:
        cursor.execute('ALTER TABLE substitutions ADD COLUMN created_by INTEGER NOT NULL DEFAULT 0')
        print("✅ Добавлено поле created_by в таблицу замен")
    
    # Проверяем наличие поля created_at в substitutions
    if 'created_at' not in columns:
        cursor.execute('ALTER TABLE substitutions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        print("✅ Добавлено поле created_at в таблицу замен")
    
    # Проверяем наличие таблицы статуса бота
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bot_status'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE bot_status (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                maintenance_mode INTEGER DEFAULT 0,
                maintenance_until TEXT DEFAULT NULL,
                maintenance_message TEXT DEFAULT NULL
            )
        ''')
        cursor.execute('INSERT OR IGNORE INTO bot_status (id, maintenance_mode) VALUES (1, 0)')
        print("✅ Добавлена таблица статуса бота")

    # Проверяем наличие индексов
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_sub_date'")
    if not cursor.fetchone():
        cursor.execute('CREATE INDEX idx_sub_date ON substitutions(date)')
        print("✅ Добавлен индекс idx_sub_date")

    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_sub_class_date'")
    if not cursor.fetchone():
        cursor.execute('CREATE INDEX idx_sub_class_date ON substitutions(class_name, date)')
        print("✅ Добавлен индекс idx_sub_class_date")

    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_sub_teacher_date'")
    if not cursor.fetchone():
        cursor.execute('CREATE INDEX idx_sub_teacher_date ON substitutions(new_teacher, date)')
        print("✅ Добавлен индекс idx_sub_teacher_date")
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_sub_created_at'")
    if not cursor.fetchone():
        cursor.execute('CREATE INDEX idx_sub_created_at ON substitutions(created_at)')
        print("✅ Добавлен индекс idx_sub_created_at")
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_usage_timestamp'")
    if not cursor.fetchone():
        cursor.execute('CREATE INDEX idx_usage_timestamp ON usage_stats(timestamp)')
        print("✅ Добавлен индекс idx_usage_timestamp")

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

def update_user_activity(user_id):
    """Обновляет время последней активности пользователя."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE user_id = ?
    ''', (user_id,))
    conn.commit()
    conn.close()

def get_all_users():
    """Возвращает список всех пользователей."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT user_id, username, first_name, last_name, joined_at, last_active FROM users ORDER BY last_active DESC')
    users = cursor.fetchall()
    conn.close()
    return users

def get_user_count():
    """Возвращает количество пользователей."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM users')
    count = cursor.fetchone()[0]
    conn.close()
    return count

def get_active_users_count(days=7):
    """Возвращает количество активных пользователей за последние N дней."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT COUNT(*) FROM users 
        WHERE last_active >= datetime('now', '-{} days')
    '''.format(days))
    count = cursor.fetchone()[0]
    conn.close()
    return count

def add_substitution(date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name, created_by):
    """Добавление замены в базу данных."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO substitutions 
        (date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name, created_by))
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

def get_substitutions_count(date_from=None, date_to=None):
    """Получение количества замен за период."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    if date_from and date_to:
        cursor.execute('''
            SELECT COUNT(*) FROM substitutions 
            WHERE date BETWEEN ? AND ?
        ''', (date_from, date_to))
    elif date_from:
        cursor.execute('''
            SELECT COUNT(*) FROM substitutions 
            WHERE date >= ?
        ''', (date_from,))
    else:
        cursor.execute('SELECT COUNT(*) FROM substitutions')
    
    count = cursor.fetchone()[0]
    conn.close()
    return count

def get_teacher_substitution_stats(days=30):
    """Получение статистики замен по учителям за последние N дней."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    date_from = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    # Статистика по заменяющим учителям
    cursor.execute('''
        SELECT new_teacher, COUNT(*) as count 
        FROM substitutions 
        WHERE date >= ? 
        GROUP BY new_teacher 
        ORDER BY count DESC 
        LIMIT 10
    ''', (date_from,))
    replacing = cursor.fetchall()
    
    # Статистика по заменяемым учителям
    cursor.execute('''
        SELECT old_teacher, COUNT(*) as count 
        FROM substitutions 
        WHERE date >= ? 
        GROUP BY old_teacher 
        ORDER BY count DESC 
        LIMIT 10
    ''', (date_from,))
    replaced = cursor.fetchall()
    
    conn.close()
    return replacing, replaced

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

#================== ФУНКЦИИ УПРАВЛЕНИЯ ТЕХРЕЖИМОМ ==================
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

#================== ФУНКЦИИ СТАТИСТИКИ ==================
def log_user_action(user_id, action, details=None):
    """Логирование действий пользователя."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO usage_stats (user_id, action, details)
        VALUES (?, ?, ?)
    ''', (user_id, action, details))
    conn.commit()
    conn.close()

def get_usage_stats(days=7):
    """Получение статистики использования за последние N дней."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT action, COUNT(*) as count
        FROM usage_stats
        WHERE timestamp >= datetime('now', '-{} days')
        GROUP BY action
        ORDER BY count DESC
    '''.format(days))
    
    stats = cursor.fetchall()
    conn.close()
    return stats

def get_daily_active_users(days=14):
    """Получение статистики активных пользователей по дням."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT DATE(last_active) as date, COUNT(*) as count
        FROM users
        WHERE last_active >= datetime('now', '-{} days')
        GROUP BY DATE(last_active)
        ORDER BY date DESC
    '''.format(days))
    
    stats = cursor.fetchall()
    conn.close()
    return stats
