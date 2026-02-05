import sqlite3
import os

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
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Индексы для оптимизации
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_date ON substitutions(date)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_class_date ON substitutions(class_name, date)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_teacher_date ON substitutions(new_teacher, date)')
    
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
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✅ Добавлена таблица пользователей")
    
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
    
    conn.commit()
    conn.close()

def add_user(user_id, username=None, first_name=None, last_name=None, language_code=None):
    """Добавляет или обновляет пользователя в базе данных."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO users (user_id, username, first_name, last_name, language_code)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, username, first_name, last_name, language_code))
    
    conn.commit()
    conn.close()

def get_all_users():
    """Возвращает список всех пользователей."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT user_id, username, first_name, last_name FROM users')
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
    def add_or_update_user_bulk(user_data_list):
    """Добавляет или обновляет несколько пользователей за раз."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    for user_data in user_data_list:
        user_id, username, first_name, last_name, language_code = user_data
        cursor.execute('''
            INSERT OR REPLACE INTO users (user_id, username, first_name, last_name, language_code)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, username, first_name, last_name, language_code))
    
    conn.commit()
    conn.close()
