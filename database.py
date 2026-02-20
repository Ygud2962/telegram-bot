import sqlite3
import logging
from datetime import datetime, timedelta
import threading

logger = logging.getLogger(__name__)

DB_NAME = 'school_bot.db'
conn = None
lock = threading.Lock()

def get_connection():
    """Получает соединение с базой данных."""
    global conn
    if conn is None:
        conn = sqlite3.connect(DB_NAME, check_same_thread=False)
        conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Инициализирует базу данных и создаёт все необходимые таблицы."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Таблица пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            language_code TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_active TEXT DEFAULT CURRENT_TIMESTAMP,
            last_news_check TEXT
        )
    ''')
    
    # Таблица замен
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS substitutions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            day TEXT NOT NULL,
            lesson_num INTEGER NOT NULL,
            old_subject TEXT NOT NULL,
            new_subject TEXT NOT NULL,
            old_teacher TEXT NOT NULL,
            new_teacher TEXT NOT NULL,
            class_name TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица новостей (с колонкой views)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            views INTEGER DEFAULT 0
        )
    ''')
    
    # Таблица реакций на новости
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS news_reactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            news_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            emoji TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(news_id, user_id),
            FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
        )
    ''')
    
    # Таблица избранного
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            fav_type TEXT NOT NULL,
            value TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, fav_type, value)
        )
    ''')
    
    # Таблица активности пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            target TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица техрежима
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS maintenance (
            id INTEGER PRIMARY KEY,
            enabled INTEGER DEFAULT 0,
            until TEXT,
            message TEXT
        )
    ''')
    
    # Инициализация техрежима
    cursor.execute('SELECT COUNT(*) FROM maintenance')
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO maintenance (id, enabled) VALUES (1, 0)')
    
    # Добавляем колонку views в news, если её нет
    try:
        cursor.execute('ALTER TABLE news ADD COLUMN views INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass  # Колонка уже существует
    
    # Добавляем колонку last_news_check в users, если её нет
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN last_news_check TEXT')
    except sqlite3.OperationalError:
        pass  # Колонка уже существует
    
    conn.commit()
    logger.info("✅ База данных инициализирована")

def init_pool():
    """Инициализирует пул соединений (для совместимости)."""
    logger.info("✅ Пул соединений инициализирован")

# ================== ПОЛЬЗОВАТЕЛИ ==================
def update_user_and_log(user_id, action, target, username, first_name, last_name, language_code):
    """Добавляет или обновляет пользователя и логирует действие."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        cursor.execute('''
            INSERT OR REPLACE INTO users (id, username, first_name, last_name, language_code, last_active)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ''', (user_id, username, first_name, last_name, language_code))
        cursor.execute('''
            INSERT INTO user_activity (user_id, action, target) VALUES (?, ?, ?)
        ''', (user_id, action, target))
        conn.commit()

def get_user_count():
    """Возвращает общее количество пользователей."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM users')
    return cursor.fetchone()[0]

def get_all_users():
    """Возвращает всех пользователей."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, first_name, last_name FROM users')
    return cursor.fetchall()

def get_active_users_24h():
    """Возвращает количество активных пользователей за 24 часа."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT COUNT(DISTINCT user_id) FROM user_activity 
        WHERE created_at >= datetime('now', '-1 day')
    ''')
    return cursor.fetchone()[0]

def get_popular_classes():
    """Возвращает самые популярные классы за неделю."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT target, COUNT(*) as cnt FROM user_activity 
        WHERE action LIKE '%class%' AND created_at >= datetime('now', '-7 days')
        GROUP BY target ORDER BY cnt DESC LIMIT 3
    ''')
    return [row[0] for row in cursor.fetchall()]

def get_peak_hours():
    """Возвращает пиковые часы активности."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT strftime('%H', created_at) as hour, COUNT(*) as cnt 
        FROM user_activity 
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY hour ORDER BY cnt DESC LIMIT 3
    ''')
    result = cursor.fetchall()
    return ', '.join([f"{row[0]}:00" for row in result]) if result else "Нет данных"

def log_user_activity(user_id, action, target=None):
    """Логирует действие пользователя."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        cursor.execute('''
            INSERT INTO user_activity (user_id, action, target) VALUES (?, ?, ?)
        ''', (user_id, action, target))
        conn.commit()

def update_user_last_news_check(user_id):
    """Обновляет время последней проверки новостей пользователем."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        cursor.execute('''
            UPDATE users SET last_news_check = CURRENT_TIMESTAMP WHERE id = ?
        ''', (user_id,))
        conn.commit()

def count_new_news_since(user_id):
    """Считает новые новости с последней проверки пользователем."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT last_news_check FROM users WHERE id = ?
    ''', (user_id,))
    result = cursor.fetchone()
    if not result or not result[0]:
        cursor.execute('SELECT COUNT(*) FROM news')
        return cursor.fetchone()[0]
    cursor.execute('''
        SELECT COUNT(*) FROM news 
        WHERE created_at > ?
    ''', (result[0],))
    return cursor.fetchone()[0]

# ================== ЗАМЕНЫ ==================
def add_substitution(date, day, lesson_num, old_subject, new_subject, old_teacher, new_teacher, class_name):
    """Добавляет замену в базу данных."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        cursor.execute('''
            INSERT INTO substitutions (date, day, lesson_num, old_subject, new_subject, old_teacher, new_teacher, class_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (date, day, lesson_num, old_subject, new_subject, old_teacher, new_teacher, class_name))
        conn.commit()
        return cursor.lastrowid

def get_substitutions_for_date(date_str):
    """Возвращает все замены на указанную дату."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM substitutions WHERE date = ? ORDER BY lesson_num
    ''', (date_str,))
    return cursor.fetchall()

def get_substitutions_for_class_date(class_name, date_str):
    """Возвращает замены для конкретного класса на дату."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM substitutions WHERE class_name = ? AND date = ? ORDER BY lesson_num
    ''', (class_name, date_str))
    return cursor.fetchall()

def get_teacher_substitutions_between(teacher_name, start_date, end_date):
    """Возвращает замены для учителя за период."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM substitutions 
        WHERE (old_teacher LIKE ? OR new_teacher LIKE ?) 
        AND date BETWEEN ? AND ?
        ORDER BY date, lesson_num
    ''', (f'%{teacher_name}%', f'%{teacher_name}%', start_date, end_date))
    return cursor.fetchall()

def get_all_substitutions():
    """Возвращает все замены."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM substitutions ORDER BY date DESC, lesson_num')
    return cursor.fetchall()

def clear_all_substitutions():
    """Очищает все замены."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        cursor.execute('DELETE FROM substitutions')
        conn.commit()

def delete_substitution(sub_id):
    """Удаляет замену по ID."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        cursor.execute('DELETE FROM substitutions WHERE id = ?', (sub_id,))
        conn.commit()

# ================== НОВОСТИ ==================
def add_news(title, content):
    """Добавляет новость в базу данных."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        cursor.execute('''
            INSERT INTO news (title, content, created_at, views)
            VALUES (?, ?, CURRENT_TIMESTAMP, 0)
        ''', (title, content))
        conn.commit()
        return cursor.lastrowid

def get_latest_news(limit=5):
    """Возвращает последние новости."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, title, content, created_at, views FROM news 
        ORDER BY created_at DESC LIMIT ?
    ''', (limit,))
    return cursor.fetchall()

def get_all_news():
    """Возвращает все новости."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, content, created_at, views FROM news ORDER BY created_at DESC')
    return cursor.fetchall()

def get_news_by_id(news_id):
    """Возвращает новость по ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, content, created_at, views FROM news WHERE id = ?', (news_id,))
    return cursor.fetchone()

def delete_news(news_id):
    """Удаляет новость по ID."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        cursor.execute('DELETE FROM news WHERE id = ?', (news_id,))
        conn.commit()

# === ПАГИНАЦИЯ НОВОСТЕЙ ===
def get_news_page(limit=5, offset=0):
    """Возвращает страницу новостей с пагинацией."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, title, content, created_at, views 
        FROM news 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    ''', (limit, offset))
    return cursor.fetchall()

def get_news_count():
    """Возвращает общее количество новостей."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM news')
    return cursor.fetchone()[0]

def increment_news_views(news_id):
    """Увеличивает счётчик просмотров новости."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        cursor.execute('UPDATE news SET views = views + 1 WHERE id = ?', (news_id,))
        conn.commit()

# === РЕАКЦИИ НА НОВОСТИ ===
def add_news_reaction(news_id, user_id, emoji):
    """Добавляет или обновляет реакцию пользователя на новость."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        if emoji is None:
            cursor.execute('DELETE FROM news_reactions WHERE news_id = ? AND user_id = ?', (news_id, user_id))
        else:
            cursor.execute('''
                INSERT OR REPLACE INTO news_reactions (news_id, user_id, emoji, created_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ''', (news_id, user_id, emoji))
        conn.commit()

def get_news_reactions(news_id):
    """Возвращает все реакции на новость с группировкой по эмодзи."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT emoji, COUNT(*) as count 
        FROM news_reactions 
        WHERE news_id = ? 
        GROUP BY emoji
        ORDER BY count DESC
    ''', (news_id,))
    return cursor.fetchall()

def get_user_reaction(news_id, user_id):
    """Возвращает реакцию конкретного пользователя на новость."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT emoji FROM news_reactions 
        WHERE news_id = ? AND user_id = ?
    ''', (news_id, user_id))
    result = cursor.fetchone()
    return result[0] if result else None

# ================== ИЗБРАННОЕ ==================
def add_favorite(user_id, fav_type, value):
    """Добавляет в избранное."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        cursor.execute('''
            INSERT OR IGNORE INTO favorites (user_id, fav_type, value)
            VALUES (?, ?, ?)
        ''', (user_id, fav_type, value))
        conn.commit()

def remove_favorite(user_id, fav_type, value):
    """Удаляет из избранного."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        cursor.execute('''
            DELETE FROM favorites WHERE user_id = ? AND fav_type = ? AND value = ?
        ''', (user_id, fav_type, value))
        conn.commit()

def get_user_favorites(user_id):
    """Возвращает все избранное пользователя."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT fav_type, value FROM favorites WHERE user_id = ?
    ''', (user_id,))
    return cursor.fetchall()

def is_favorite(user_id, fav_type, value):
    """Проверяет, есть ли в избранном."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT COUNT(*) FROM favorites WHERE user_id = ? AND fav_type = ? AND value = ?
    ''', (user_id, fav_type, value))
    return cursor.fetchone()[0] > 0

# ================== ТЕХРЕЖИМ ==================
def get_maintenance_status():
    """Возвращает статус техрежима."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT enabled, until, message FROM maintenance WHERE id = 1')
    result = cursor.fetchone()
    return {
        'enabled': bool(result[0]) if result else False,
        'until': result[1] if result else None,
        'message': result[2] if result else None
    }

def set_maintenance_mode(enabled, until=None, message=None):
    """Устанавливает статус техрежима."""
    conn = get_connection()
    cursor = conn.cursor()
    with lock:
        cursor.execute('''
            UPDATE maintenance SET enabled = ?, until = ?, message = ? WHERE id = 1
        ''', (1 if enabled else 0, until, message))
        conn.commit()

# ================== УТИЛИТЫ ==================
def close_connection():
    """Закрывает соединение с базой данных."""
    global conn
    if conn:
        conn.close()
        conn = None
