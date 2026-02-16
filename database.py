import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Получаем URL из переменных окружения
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_connection():
    """Создаёт подключение к базе данных."""
    return psycopg2.connect(DATABASE_URL, sslmode='require')

def init_db():
    """Инициализация базы данных."""
    conn = get_connection()
    cursor = conn.cursor()
    
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
    conn.close()
    print("✅ База данных PostgreSQL инициализирована")

def update_database_structure():
    """Обновление структуры базы данных."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Проверяем и создаём таблицы при необходимости
    tables = {
        'user_activity': '''
            CREATE TABLE user_activity (
                id SERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                action TEXT NOT NULL,
                class_name TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        ''',
        'user_favorites': '''
            CREATE TABLE user_favorites (
                id SERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                fav_type TEXT NOT NULL,
                value TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id),
                UNIQUE(user_id, fav_type, value)
            )
        ''',
        'news': '''
            CREATE TABLE news (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        '''
    }
    
    for table_name, create_sql in tables.items():
        cursor.execute(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table_name}')")
        exists = cursor.fetchone()[0]
        if not exists:
            cursor.execute(create_sql)
            print(f"✅ Добавлена таблица {table_name}")
    
    conn.commit()
    conn.close()

def add_user(user_id, username=None, first_name=None, last_name=None, language_code=None):
    """Добавляет или обновляет пользователя."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO users (user_id, username, first_name, last_name, language_code, last_active)
        VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
            username = EXCLUDED.username,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            language_code = EXCLUDED.language_code,
            last_active = CURRENT_TIMESTAMP
    ''', (user_id, username, first_name, last_name, language_code))
    conn.commit()
    conn.close()

def log_user_activity(user_id, action, class_name=None):
    """Логирует активность пользователя."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO user_activity (user_id, action, class_name)
        VALUES (%s, %s, %s)
    ''', (user_id, action, class_name))
    conn.commit()
    conn.close()

def get_active_users_24h():
    """Возвращает количество активных пользователей за 24 часа."""
    conn = get_connection()
    cursor = conn.cursor()
    yesterday = (datetime.now() - timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute('SELECT COUNT(DISTINCT user_id) FROM user_activity WHERE timestamp > %s', (yesterday,))
    count = cursor.fetchone()[0]
    conn.close()
    return count or 0

def get_popular_classes():
    """Возвращает популярные классы за неделю."""
    conn = get_connection()
    cursor = conn.cursor()
    week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute('''
        SELECT class_name, COUNT(*) as cnt
        FROM user_activity
        WHERE class_name IS NOT NULL AND timestamp > %s
        GROUP BY class_name
        ORDER BY cnt DESC
        LIMIT 5
    ''', (week_ago,))
    results = cursor.fetchall()
    conn.close()
    return [row[0] for row in results if row[0]] if results else []

def get_peak_hours():
    """Возвращает пиковые часы использования."""
    conn = get_connection()
    cursor = conn.cursor()
    week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute('''
        SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as cnt
        FROM user_activity
        WHERE timestamp > %s
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
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM users')
    count = cursor.fetchone()[0]
    conn.close()
    return count

def get_all_users():
    """Возвращает всех пользователей."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT user_id, username, first_name, last_name FROM users')
    users = cursor.fetchall()
    conn.close()
    return users

def add_substitution(date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name):
    """Добавляет замену."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO substitutions
        (date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ''', (date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name))
    conn.commit()
    conn.close()
    print(f"✅ Замена добавлена: {date} {class_name} урок {lesson_number}")

def get_substitutions_for_date(date):
    """Получает замены на дату."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM substitutions WHERE date = %s ORDER BY class_name, lesson_number
    ''', (date,))
    results = cursor.fetchall()
    conn.close()
    return results

def get_substitutions_for_class_date(class_name, date):
    """Получает замены для класса на дату."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM substitutions
        WHERE class_name = %s AND date = %s
        ORDER BY lesson_number
    ''', (class_name, date))
    results = cursor.fetchall()
    conn.close()
    return results

def get_substitutions_by_teacher_and_date(teacher_name, date):
    """Получает замены для учителя на дату."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM substitutions
        WHERE (new_teacher = %s OR old_teacher = %s) AND date = %s
        ORDER BY lesson_number
    ''', (teacher_name, teacher_name, date))
    results = cursor.fetchall()
    conn.close()
    return results

def get_all_substitutions():
    """Получает все замены."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM substitutions ORDER BY date DESC, class_name, lesson_number
    ''')
    results = cursor.fetchall()
    conn.close()
    return results

def delete_substitution(sub_id):
    """Удаляет замену."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM substitutions WHERE id = %s', (sub_id,))
    conn.commit()
    conn.close()
    print(f"✅ Замена ID={sub_id} удалена")

def clear_all_substitutions():
    """Очищает все замены."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM substitutions')
    conn.commit()
    conn.close()
    print("✅ Все замены удалены")

def set_maintenance_mode(enabled: bool, until: str = None, message: str = None):
    """Включает/выключает техрежим."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE bot_status
        SET maintenance_mode = %s, maintenance_until = %s, maintenance_message = %s
        WHERE id = 1
    ''', (1 if enabled else 0, until, message))
    conn.commit()
    conn.close()

def get_maintenance_status():
    """Получает статус техрежима."""
    conn = get_connection()
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

def add_favorite(user_id, fav_type, value):
    """Добавляет в избранное."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO user_favorites (user_id, fav_type, value)
            VALUES (%s, %s, %s)
            ON CONFLICT DO NOTHING
        ''', (user_id, fav_type, value))
        conn.commit()
        print(f"✅ Добавлено в избранное: {fav_type}={value} для пользователя {user_id}")
    except Exception as e:
        print(f"Ошибка добавления в избранное: {e}")
    finally:
        conn.close()

def remove_favorite(user_id, fav_type, value):
    """Удаляет из избранного."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            DELETE FROM user_favorites
            WHERE user_id = %s AND fav_type = %s AND value = %s
        ''', (user_id, fav_type, value))
        conn.commit()
        print(f"✅ Удалено из избранного: {fav_type}={value} для пользователя {user_id}")
    except Exception as e:
        print(f"Ошибка удаления из избранного: {e}")
    finally:
        conn.close()

def get_user_favorites(user_id):
    """Получает избранное пользователя."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT fav_type, value FROM user_favorites
            WHERE user_id = %s
            ORDER BY created_at DESC
        ''', (user_id,))
        results = cursor.fetchall()
        return results
    except Exception as e:
        print(f"Ошибка получения избранного: {e}")
        return []
    finally:
        conn.close()

def is_favorite(user_id, fav_type, value):
    """Проверяет, в избранном ли элемент."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT 1 FROM user_favorites
            WHERE user_id = %s AND fav_type = %s AND value = %s
        ''', (user_id, fav_type, value))
        return cursor.fetchone() is not None
    except Exception as e:
        print(f"Ошибка проверки избранного: {e}")
        return False
    finally:
        conn.close()

def add_news(title, content):
    """Добавляет новость."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO news (title, content) VALUES (%s, %s)', (title, content))
    conn.commit()
    news_id = cursor.lastrowid
    conn.close()
    return news_id

def get_latest_news(limit=5):
    """Получает последние новости."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, title, content, published_at
        FROM news
        ORDER BY published_at DESC
        LIMIT %s
    ''', (limit,))
    results = cursor.fetchall()
    conn.close()
    return results

def get_all_news():
    """Получает все новости."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, title, content, published_at
        FROM news
        ORDER BY published_at DESC
    ''')
    results = cursor.fetchall()
    conn.close()
    return results

def get_news_by_id(news_id):
    """Получает новость по ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, content, published_at FROM news WHERE id = %s', (news_id,))
    result = cursor.fetchone()
    conn.close()
    return result

def delete_news(news_id):
    """Удаляет новость."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM news WHERE id = %s', (news_id,))
    conn.commit()
    conn.close()
    print(f"✅ Новость ID={news_id} удалена")
