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
            class_name TEXT NOT NULL
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
    
    # Таблица настроек пользователей (для функции "Мой класс")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id INTEGER PRIMARY KEY,
            class_name TEXT,
            teacher_name TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active)')
    
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
    
    # Проверяем наличие столбца last_active в таблице users
    cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in cursor.fetchall()]
    if 'last_active' not in columns:
        cursor.execute('ALTER TABLE users ADD COLUMN last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        print("✅ Добавлен столбец last_active в таблицу users")
    
    # Проверяем наличие таблицы настроек пользователей
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_settings'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE user_settings (
                user_id INTEGER PRIMARY KEY,
                class_name TEXT,
                teacher_name TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✅ Добавлена таблица user_settings")
    
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
    
    # Проверяем, есть ли уже пользователь
    cursor.execute('SELECT user_id FROM users WHERE user_id = ?', (user_id,))
    if cursor.fetchone():
        # Обновляем данные и last_active
        cursor.execute('''
            UPDATE users 
            SET username = ?, first_name = ?, last_name = ?, language_code = ?, last_active = CURRENT_TIMESTAMP
            WHERE user_id = ?
        ''', (username, first_name, last_name, language_code, user_id))
    else:
        cursor.execute('''
            INSERT INTO users (user_id, username, first_name, last_name, language_code, last_active)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ''', (user_id, username, first_name, last_name, language_code))
    
    conn.commit()
    conn.close()

def get_all_users():
    """Возвращает список всех пользователей."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT user_id, username, first_name, last_name FROM users ORDER BY joined_at DESC')
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

def get_active_users_count(days=30):
    """Возвращает количество активных пользователей за указанное количество дней."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT COUNT(*) FROM users 
        WHERE last_active >= datetime('now', ?)
    ''', (f'-{days} days',))
    
    count = cursor.fetchone()[0]
    conn.close()
    return count

def get_user_class(user_id):
    """Возвращает сохраненный класс пользователя."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT class_name FROM user_settings WHERE user_id = ?', (user_id,))
    result = cursor.fetchone()
    
    conn.close()
    return result[0] if result else None

def set_user_class(user_id, class_name):
    """Устанавливает класс для пользователя."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO user_settings (user_id, class_name, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
    ''', (user_id, class_name))
    
    conn.commit()
    conn.close()

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

def get_substitutions_count(days=7):
    """Возвращает количество замен за указанное количество дней."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT COUNT(*) FROM substitutions 
        WHERE date >= date('now', ?)
    ''', (f'-{days} days',))
    
    count = cursor.fetchone()[0]
    conn.close()
    return count

def get_top_classes_by_substitutions(days=7):
    """Возвращает топ классов по количеству замен за указанное количество дней."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT class_name, COUNT(*) as count 
        FROM substitutions 
        WHERE date >= date('now', ?)
        GROUP BY class_name 
        ORDER BY count DESC
    ''', (f'-{days} days',))
    
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

# ============ ФУНКЦИИ УПРАВЛЕНИЯ ТЕХРЕЖИМОМ ============
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
