import os
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import logging
import atexit

logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get('DATABASE_URL')

# Создаем пул подключений (5-10 подключений достаточно)
db_pool = None

def init_db_pool():
    """Инициализация пула подключений к базе данных."""
    global db_pool
    try:
        db_pool = psycopg2.pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=DATABASE_URL,
            sslmode='require'
        )
        logger.info("✅ Пул подключений к БД инициализирован")
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации пула подключений: {e}")
        raise

def get_connection():
    """Получает подключение из пула."""
    if db_pool is None:
        init_db_pool()
    return db_pool.getconn()

def release_connection(conn):
    """Возвращает подключение в пул."""
    if db_pool is not None:
        db_pool.putconn(conn)

# Автоматическое закрытие пула при завершении
def close_db_pool():
    """Закрывает пул подключений при завершении работы."""
    global db_pool
    if db_pool is not None:
        db_pool.closeall()
        logger.info("✅ Пул подключений закрыт")

atexit.register(close_db_pool)

def init_db():
    """Инициализация базы данных."""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Таблица замен
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS substitutions (
                id SERIAL PRIMARY KEY,
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
        
        # Таблица пользователей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id BIGINT PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                language_code TEXT,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Таблица активности пользователей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_activity (
                id SERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                action TEXT NOT NULL,
                class_name TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        ''')
        
        # Таблица статуса бота
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bot_status (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                maintenance_mode INTEGER DEFAULT 0,
                maintenance_until TEXT DEFAULT NULL,
                maintenance_message TEXT DEFAULT NULL
            )
        ''')
        cursor.execute('INSERT INTO bot_status (id, maintenance_mode) VALUES (1, 0) ON CONFLICT DO NOTHING')
        
        # Таблица избранного
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_favorites (
                id SERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                fav_type TEXT NOT NULL,
                value TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id),
                UNIQUE(user_id, fav_type, value)
            )
        ''')
        
        # Таблица новостей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Индексы
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_date ON substitutions(date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_class_date ON substitutions(class_name, date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_teacher_date ON substitutions(new_teacher, date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON user_activity(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_favorites_type ON user_favorites(fav_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at)')
        
        conn.commit()
        print("✅ База данных PostgreSQL инициализирована")
    except Exception as e:
        logger.error(f"Ошибка инициализации БД: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        release_connection(conn)

def execute_query(query, params=None, fetch='all'):
    """Универсальная функция для выполнения запросов."""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        if fetch == 'all':
            result = cursor.fetchall()
        elif fetch == 'one':
            result = cursor.fetchone()
        elif fetch == 'rowcount':
            result = cursor.rowcount
        else:
            result = None
        
        conn.commit()
        return result
    except Exception as e:
        logger.error(f"Ошибка выполнения запроса: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        release_connection(conn)

def add_user(user_id, username=None, first_name=None, last_name=None, language_code=None):
    """Добавляет или обновляет пользователя."""
    query = '''
        INSERT INTO users (user_id, username, first_name, last_name, language_code, last_active)
        VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
            username = EXCLUDED.username,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            language_code = EXCLUDED.language_code,
            last_active = CURRENT_TIMESTAMP
    '''
    execute_query(query, (user_id, username, first_name, last_name, language_code), fetch=None)

def log_user_activity(user_id, action, class_name=None):
    """Логирует активность пользователя."""
    query = 'INSERT INTO user_activity (user_id, action, class_name) VALUES (%s, %s, %s)'
    execute_query(query, (user_id, action, class_name), fetch=None)

def get_active_users_24h():
    """Возвращает количество активных пользователей за 24 часа."""
    yesterday = (datetime.now() - timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')
    query = 'SELECT COUNT(DISTINCT user_id) FROM user_activity WHERE timestamp > %s'
    result = execute_query(query, (yesterday,), fetch='one')
    return result[0] if result else 0

def get_user_count():
    """Возвращает количество пользователей."""
    query = 'SELECT COUNT(*) FROM users'
    result = execute_query(query, fetch='one')
    return result[0] if result else 0

def add_substitution(date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name):
    """Добавляет замену."""
    query = '''
        INSERT INTO substitutions
        (date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    '''
    execute_query(query, (date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name), fetch=None)
    print(f"✅ Замена добавлена: {date} {class_name} урок {lesson_number}")

def get_substitutions_for_date(date):
    """Получает замены на дату."""
    query = 'SELECT * FROM substitutions WHERE date = %s ORDER BY class_name, lesson_number'
    return execute_query(query, (date,))

def get_substitutions_for_class_date(class_name, date):
    """Получает замены для класса на дату."""
    query = '''
        SELECT * FROM substitutions
        WHERE class_name = %s AND date = %s
        ORDER BY lesson_number
    '''
    return execute_query(query, (class_name, date))

def get_substitutions_by_teacher_and_date(teacher_name, date):
    """Получает замены для учителя на дату."""
    query = '''
        SELECT * FROM substitutions
        WHERE (new_teacher = %s OR old_teacher = %s) AND date = %s
        ORDER BY lesson_number
    '''
    return execute_query(query, (teacher_name, teacher_name, date))

def get_all_substitutions():
    """Получает все замены."""
    query = 'SELECT * FROM substitutions ORDER BY date DESC, class_name, lesson_number'
    return execute_query(query)

def delete_substitution(sub_id):
    """Удаляет замену."""
    query = 'DELETE FROM substitutions WHERE id = %s'
    execute_query(query, (sub_id,), fetch=None)
    print(f"✅ Замена ID={sub_id} удалена")

def clear_all_substitutions():
    """Очищает все замены."""
    query = 'DELETE FROM substitutions'
    execute_query(query, fetch=None)
    print("✅ Все замены удалены")

def set_maintenance_mode(enabled: bool, until: str = None, message: str = None):
    """Включает/выключает техрежим."""
    query = '''
        UPDATE bot_status
        SET maintenance_mode = %s, maintenance_until = %s, maintenance_message = %s
        WHERE id = 1
    '''
    execute_query(query, (1 if enabled else 0, until, message), fetch=None)

def get_maintenance_status():
    """Получает статус техрежима."""
    query = 'SELECT maintenance_mode, maintenance_until, maintenance_message FROM bot_status WHERE id = 1'
    row = execute_query(query, fetch='one')
    if row:
        return {
            'enabled': bool(row[0]),
            'until': row[1],
            'message': row[2]
        }
    return {'enabled': False, 'until': None, 'message': None}

def add_favorite(user_id, fav_type, value):
    """Добавляет в избранное."""
    query = '''
        INSERT INTO user_favorites (user_id, fav_type, value)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING
    '''
    execute_query(query, (user_id, fav_type, value), fetch=None)
    print(f"✅ Добавлено в избранное: {fav_type}={value} для пользователя {user_id}")

def remove_favorite(user_id, fav_type, value):
    """Удаляет из избранного."""
    query = '''
        DELETE FROM user_favorites
        WHERE user_id = %s AND fav_type = %s AND value = %s
    '''
    execute_query(query, (user_id, fav_type, value), fetch=None)
    print(f"✅ Удалено из избранного: {fav_type}={value} для пользователя {user_id}")

def get_user_favorites(user_id):
    """Получает избранное пользователя."""
    query = '''
        SELECT fav_type, value FROM user_favorites
        WHERE user_id = %s
        ORDER BY created_at DESC
    '''
    return execute_query(query, (user_id,))

def is_favorite(user_id, fav_type, value):
    """Проверяет, в избранном ли элемент."""
    query = '''
        SELECT 1 FROM user_favorites
        WHERE user_id = %s AND fav_type = %s AND value = %s
    '''
    result = execute_query(query, (user_id, fav_type, value), fetch='one')
    return result is not None

def add_news(title, content):
    """Добавляет новость."""
    query = 'INSERT INTO news (title, content) VALUES (%s, %s) RETURNING id'
    result = execute_query(query, (title, content), fetch='one')
    return result[0] if result else None

def get_latest_news(limit=5):
    """Получает последние новости."""
    query = '''
        SELECT id, title, content, published_at
        FROM news
        ORDER BY published_at DESC
        LIMIT %s
    '''
    return execute_query(query, (limit,))

def get_all_news():
    """Получает все новости."""
    query = '''
        SELECT id, title, content, published_at
        FROM news
        ORDER BY published_at DESC
    '''
    return execute_query(query)

def get_news_by_id(news_id):
    """Получает новость по ID."""
    query = 'SELECT id, title, content, published_at FROM news WHERE id = %s'
    return execute_query(query, (news_id,), fetch='one')

def delete_news(news_id):
    """Удаляет новость."""
    query = 'DELETE FROM news WHERE id = %s'
    execute_query(query, (news_id,), fetch=None)
    print(f"✅ Новость ID={news_id} удалена")

def get_all_users():
    """Возвращает всех пользователей."""
    query = 'SELECT user_id, username, first_name, last_name FROM users'
    return execute_query(query)

def get_popular_classes():
    """Возвращает популярные классы за неделю."""
    week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
    query = '''
        SELECT class_name, COUNT(*) as cnt
        FROM user_activity
        WHERE class_name IS NOT NULL AND timestamp > %s
        GROUP BY class_name
        ORDER BY cnt DESC
        LIMIT 5
    '''
    results = execute_query(query, (week_ago,))
    return [row[0] for row in results if row[0]] if results else []

def get_peak_hours():
    """Возвращает пиковые часы использования."""
    week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
    query = '''
        SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as cnt
        FROM user_activity
        WHERE timestamp > %s
        GROUP BY hour
        ORDER BY cnt DESC
        LIMIT 3
    '''
    results = execute_query(query, (week_ago,))
    if results:
        hours = [f"{int(row[0]):02d}:00" for row in results]
        return ", ".join(hours)
    return "Нет данных"
