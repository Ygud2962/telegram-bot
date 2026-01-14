import sqlite3
import datetime

def init_db():
    """Инициализация базы данных и создание таблиц."""
    conn = sqlite3.connect('school_bot.db')
    cur = conn.cursor()

    # Таблица для хранения замен
    cur.execute('''
        CREATE TABLE IF NOT EXISTS substitutions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,         -- Дата замены в формате YYYY-MM-DD
            day_of_week TEXT,           -- День недели
            lesson_number INTEGER,      -- Номер урока
            old_subject TEXT,           -- Старый предмет
            new_subject TEXT,           -- Новый предмет
            old_teacher TEXT,           -- Старый учитель
            new_teacher TEXT            -- Новый учитель
        )
    ''')

    conn.commit()
    conn.close()

def add_substitution(date, day_of_week, lesson_num, old_subj, new_subj, old_teacher, new_teacher):
    """Добавление новой замены в базу данных."""
    conn = sqlite3.connect('school_bot.db')
    cur = conn.cursor()
    cur.execute('''INSERT INTO substitutions 
                   (date, day_of_week, lesson_number, old_subject, new_subject, old_teacher, new_teacher) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (date, day_of_week, lesson_num, old_subj, new_subj, old_teacher, new_teacher))
    conn.commit()
    conn.close()

def get_substitutions_for_date(target_date):
    """Получение всех замен на конкретную дату."""
    conn = sqlite3.connect('school_bot.db')
    cur = conn.cursor()
    cur.execute("SELECT * FROM substitutions WHERE date = ?", (target_date,))
    data = cur.fetchall()
    conn.close()
    return data

def get_all_substitutions():
    """Получение всех замен (для админ-панели)."""
    conn = sqlite3.connect('school_bot.db')
    cur = conn.cursor()
    cur.execute("SELECT * FROM substitutions ORDER BY date DESC")
    data = cur.fetchall()
    conn.close()
    return data

def delete_substitution(sub_id):
    """Удаление замены по ID."""
    conn = sqlite3.connect('school_bot.db')
    cur = conn.cursor()
    cur.execute("DELETE FROM substitutions WHERE id = ?", (sub_id,))
    conn.commit()
    conn.close()
    