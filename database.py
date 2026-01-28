import sqlite3
import datetime

DB_NAME = "school_bot.db"

def init_db():
    """Создание таблиц, если их нет."""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()

    # Таблица замен
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
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute('''INSERT INTO substitutions 
                   (date, day_of_week, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                (date, day_of_week, lesson_num, old_subj, new_subj, old_teacher, new_teacher, class_name))
    conn.commit()
    conn.close()


def get_substitutions_for_date(target_date):
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("SELECT * FROM substitutions WHERE date = ?", (target_date,))
    data = cur.fetchall()
    conn.close()
    return data


def get_all_substitutions():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("SELECT * FROM substitutions ORDER BY date DESC")
    data = cur.fetchall()
    conn.close()
    return data


def delete_substitution(sub_id):
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("DELETE FROM substitutions WHERE id = ?", (sub_id,))
    conn.commit()
    conn.close()


def clear_all_substitutions():
    """Очищает все записи о заменах"""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("DELETE FROM substitutions")
    conn.commit()
    conn.close()
