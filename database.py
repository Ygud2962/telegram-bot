import sqlite3
import datetime

DB_NAME = "school_bot.db"

def init_db():
    """Создание таблиц, если их нет."""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    # Таблица замен (обновленная с полем class_name)
    cur.execute('''
        CREATE TABLE IF NOT EXISTS substitutions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            day_of_week TEXT,
            lesson_number INTEGER,
            old_subject TEXT,
            new_subject TEXT,
            old_teacher TEXT,
            new_teacher TEXT,
            class_name TEXT
        )
    ''')

    # Таблица пользователей
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            name TEXT,
            surname TEXT,
            role TEXT,
            registered_at TEXT
        )
    ''')

    conn.commit()
    conn.close()


# ===================== ПОЛЬЗОВАТЕЛИ =====================

def save_user(user_id, name, surname, role):
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute(
        "INSERT OR REPLACE INTO users (user_id, name, surname, role, registered_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, name, surname, role, datetime.datetime.now().isoformat())
    )
    conn.commit()
    conn.close()


def get_user(user_id):
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("SELECT user_id, name, surname, role FROM users WHERE user_id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()

    if row:
        return {
            "user_id": row[0],
            "name": row[1],
            "surname": row[2],
            "role": row[3]
        }
    return None


# ===================== ЗАМЕНЫ =====================

def add_substitution(date, day_of_week, lesson_num, old_subj, new_subj, old_teacher, new_teacher, class_name):
    """Добавляет замену с указанием класса."""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute('''INSERT INTO substitutions 
                   (date, day_of_week, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                (date, day_of_week, lesson_num, old_subj, new_subj, old_teacher, new_teacher, class_name))
    conn.commit()
    conn.close()


def get_substitutions_for_date(target_date):
    """Получает замены на указанную дату."""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("SELECT * FROM substitutions WHERE date = ?", (target_date,))
    data = cur.fetchall()
    conn.close()
    return data


def get_substitutions_for_class_date(class_name, target_date):
    """Получает замены для конкретного класса на указанную дату."""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("SELECT * FROM substitutions WHERE class_name = ? AND date = ? ORDER BY lesson_number", 
                (class_name, target_date))
    data = cur.fetchall()
    conn.close()
    return data


def get_all_substitutions():
    """Получает все замены."""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("SELECT * FROM substitutions ORDER BY date DESC, class_name, lesson_number")
    data = cur.fetchall()
    conn.close()
    return data


def delete_substitution(sub_id):
    """Удаляет замену по ID."""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("DELETE FROM substitutions WHERE id = ?", (sub_id,))
    conn.commit()
    conn.close()


def get_active_substitutions_for_class_date(class_name, date):
    """
    Получает активные замены для указанного класса и даты.
    """
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("SELECT * FROM substitutions WHERE class_name = ? AND date = ? ORDER BY lesson_number", 
                (class_name, date))
    data = cur.fetchall()
    conn.close()
    return data


def clear_all_substitutions():
    """
    Очищает все записи о заменах из базы данных.
    """
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("DELETE FROM substitutions")
    conn.commit()
    conn.close()
    return True


def get_substitutions_by_teacher_and_date(teacher_name, target_date):
    """Получает замены для учителя на указанную дату."""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("SELECT * FROM substitutions WHERE (old_teacher = ? OR new_teacher = ?) AND date = ?", 
                (teacher_name, teacher_name, target_date))
    data = cur.fetchall()
    conn.close()
    return data


def update_database_structure():
    """
    Обновляет структуру базы данных, добавляя отсутствующие столбцы.
    Эта функция должна быть вызвана при запуске бота.
    """
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    
    try:
        # Проверяем существование столбца class_name
        cur.execute("PRAGMA table_info(substitutions)")
        columns = cur.fetchall()
        column_names = [col[1] for col in columns]
        
        # Если столбца class_name нет, добавляем его
        if 'class_name' not in column_names:
            cur.execute("ALTER TABLE substitutions ADD COLUMN class_name TEXT")
            print("✅ Добавлен столбец class_name в таблицу substitutions")
        
        conn.commit()
        print("✅ Структура базы данных обновлена")
    except Exception as e:
        print(f"❌ Ошибка обновления структуры БД: {e}")
    finally:
        conn.close()
