import psycopg2
from psycopg2 import pool
import os
from datetime import datetime, timedelta
import pytz
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Получаем URL базы данных из переменной окружения Railway
DATABASE_URL = os.environ.get('DATABASE_URL')

if not DATABASE_URL:
    raise ValueError("❌ Переменная окружения DATABASE_URL не установлена! "
                     "Убедитесь, что в Railway добавлена бесплатная PostgreSQL база данных.")

# 🔑 ГЛОБАЛЬНЫЙ ПУЛ СОЕДИНЕНИЙ (создаётся ОДИН РАЗ при запуске)
db_pool = None

def init_pool():
    """Инициализирует пул соединений после создания структуры БД."""
    global db_pool
    if db_pool is None:
        try:
            db_pool = pool.SimpleConnectionPool(
                minconn=1,
                maxconn=7,  # Railway Free Tier поддерживает только 1-2 соединения
                dsn=DATABASE_URL,
                sslmode='require'
            )
            logger.info("✅ Пул соединений PostgreSQL инициализирован")
        except Exception as e:
            logger.error(f"❌ Ошибка создания пула соединений: {e}")
            raise

def get_connection():
    """Быстрое получение соединения из пула (мгновенно после инициализации)."""
    if db_pool is None:
        raise RuntimeError("Пул соединений не инициализирован! Вызовите init_pool() после init_db()")
    return db_pool.getconn()

def release_connection(conn):
    """Возврат соединения в пул (НЕ закрываем физически!)."""
    if db_pool is not None and conn is not None:
        db_pool.putconn(conn)

def init_db():
    """Инициализация базы данных PostgreSQL (использует прямое соединение, НЕ пул)."""
    conn = None
    try:
        # Прямое соединение для инициализации (пул ещё не создан)
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
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
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Таблица пользователей (BIGINT для Telegram ID)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id BIGINT PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                language_code TEXT,
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Таблица активности пользователей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_activity (
                id SERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                action TEXT NOT NULL,
                class_name TEXT,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        ''')

        # Таблица статуса бота (техрежим)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bot_status (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                maintenance_mode INTEGER DEFAULT 0,
                maintenance_until TEXT,
                maintenance_message TEXT
            )
        ''')
        cursor.execute('''
            INSERT INTO bot_status (id, maintenance_mode) 
            VALUES (1, 0) 
            ON CONFLICT (id) DO NOTHING
        ''')

        # Таблица избранного пользователей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_favorites (
                id SERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                fav_type TEXT NOT NULL,
                value TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                UNIQUE(user_id, fav_type, value)
            )
        ''')

        # Таблица школьных новостей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Индексы для оптимизации
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_date ON substitutions(date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_class_date ON substitutions(class_name, date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_teacher_date ON substitutions(new_teacher, date)')
        # Добавляем индекс для старого учителя (ускорит запросы с OR)
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sub_old_teacher_date ON substitutions(old_teacher, date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON user_activity(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_favorites_type ON user_favorites(fav_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at)')

        conn.commit()
        logger.info("✅ PostgreSQL база данных инициализирована")
        print("✅ PostgreSQL база данных инициализирована")
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации БД: {e}")
        raise
    finally:
        if conn:
            conn.close()

# ==================== ФУНКЦИИ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ (ОПТИМИЗИРОВАННЫЕ) ====================
def update_user_activity(user_id, action, class_name=None, username=None, first_name=None, last_name=None, language_code=None):
    """
    Обновляет информацию о пользователе и логирует действие одним вызовом.
    Выполняется в одной транзакции.
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        # Вставляем или обновляем пользователя
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
        
        # Логируем действие
        cursor.execute('''
            INSERT INTO user_activity (user_id, action, class_name)
            VALUES (%s, %s, %s)
        ''', (user_id, action, class_name))
        
        conn.commit()
    except Exception as e:
        logger.error(f"Ошибка при обновлении активности пользователя {user_id}: {e}")
        # Если произошла ошибка, пробуем откатить (хотя commit не был выполнен)
        if conn:
            conn.rollback()
        # Не пробрасываем исключение дальше, чтобы не ломать бота
    finally:
        release_connection(conn)

# Для обратной совместимости оставляем старые функции, но они будут вызывать новую
def add_user(user_id, username=None, first_name=None, last_name=None, language_code=None):
    # Просто вызываем update_user_activity без action
    update_user_activity(user_id, 'registered', None, username, first_name, last_name, language_code)

def log_user_activity(user_id, action, class_name=None):
    # Вызываем update_user_activity, оставляя старые данные пользователя без изменений
    # Для этого нужно сначала получить текущие данные пользователя? 
    # Но чтобы не делать дополнительный запрос, можно передать None, и ON CONFLICT не обновит их.
    # Однако last_active обновится благодаря SET last_active = CURRENT_TIMESTAMP.
    # Это нормально.
    update_user_activity(user_id, action, class_name, None, None, None, None)

# ==================== ФУНКЦИИ АНАЛИТИКИ ====================
def get_active_users_24h():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        yesterday = datetime.now(pytz.utc) - timedelta(hours=24)
        cursor.execute(
            'SELECT COUNT(DISTINCT user_id) FROM user_activity WHERE timestamp > %s', 
            (yesterday,)
        )
        count = cursor.fetchone()[0]
        return count or 0
    except Exception as e:
        logger.error(f"Ошибка получения активных пользователей: {e}")
        return 0
    finally:
        release_connection(conn)

def get_popular_classes():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        week_ago = datetime.now(pytz.utc) - timedelta(days=7)
        cursor.execute('''
            SELECT class_name, COUNT(*) as cnt
            FROM user_activity
            WHERE class_name IS NOT NULL AND timestamp > %s
            GROUP BY class_name
            ORDER BY cnt DESC
            LIMIT 5
        ''', (week_ago,))
        results = cursor.fetchall()
        return [row[0] for row in results if row[0]] if results else []
    except Exception as e:
        logger.error(f"Ошибка получения популярных классов: {e}")
        return []
    finally:
        release_connection(conn)

def get_peak_hours():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        week_ago = datetime.now(pytz.utc) - timedelta(days=7)
        cursor.execute('''
            SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as cnt
            FROM user_activity
            WHERE timestamp > %s
            GROUP BY hour
            ORDER BY cnt DESC
            LIMIT 3
        ''', (week_ago,))
        results = cursor.fetchall()
        if results:
            hours = [f"{int(row[0]):02d}:00" for row in results]
            return ", ".join(hours)
        return "Нет данных"
    except Exception as e:
        logger.error(f"Ошибка получения пиковых часов: {e}")
        return "Ошибка"
    finally:
        release_connection(conn)

def get_user_count():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM users')
        count = cursor.fetchone()[0]
        return count or 0
    except Exception as e:
        logger.error(f"Ошибка получения количества пользователей: {e}")
        return 0
    finally:
        release_connection(conn)

def get_all_users():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT user_id, username, first_name, last_name FROM users')
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Ошибка получения списка пользователей: {e}")
        return []
    finally:
        release_connection(conn)

# ==================== ФУНКЦИИ УПРАВЛЕНИЯ ЗАМЕНАМИ ====================
def add_substitution(date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO substitutions 
            (date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', (date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name))
        conn.commit()
        logger.info(f"✅ Замена добавлена: {date} {class_name} урок {lesson_number}")
    except Exception as e:
        logger.error(f"Ошибка добавления замены: {e}")
        raise
    finally:
        release_connection(conn)

def get_substitutions_for_date(date):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM substitutions WHERE date = %s ORDER BY class_name, lesson_number
        ''', (date,))
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Ошибка получения замен на дату {date}: {e}")
        return []
    finally:
        release_connection(conn)

def get_substitutions_for_class_date(class_name, date):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM substitutions
            WHERE class_name = %s AND date = %s
            ORDER BY lesson_number
        ''', (class_name, date))
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Ошибка получения замен для класса {class_name} на {date}: {e}")
        return []
    finally:
        release_connection(conn)

def get_substitutions_by_teacher_and_date(teacher_name, date):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM substitutions
            WHERE (new_teacher = %s OR old_teacher = %s) AND date = %s
            ORDER BY lesson_number
        ''', (teacher_name, teacher_name, date))
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Ошибка получения замен для учителя {teacher_name} на {date}: {e}")
        return []
    finally:
        release_connection(conn)

def get_teacher_substitutions_between(teacher_name, start_date, end_date):
    """
    Возвращает все замены, где учитель выступает как новый или старый,
    за период дат от start_date до end_date включительно.
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM substitutions
            WHERE date >= %s AND date <= %s
              AND (new_teacher = %s OR old_teacher = %s)
            ORDER BY date, lesson_number
        ''', (start_date, end_date, teacher_name, teacher_name))
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Ошибка получения замен для учителя {teacher_name} за период {start_date} - {end_date}: {e}")
        return []
    finally:
        release_connection(conn)

def get_all_substitutions():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM substitutions ORDER BY date DESC, class_name, lesson_number
        ''')
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Ошибка получения всех замен: {e}")
        return []
    finally:
        release_connection(conn)

def delete_substitution(sub_id):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM substitutions WHERE id = %s', (sub_id,))
        conn.commit()
        logger.info(f"✅ Замена ID={sub_id} удалена")
    except Exception as e:
        logger.error(f"Ошибка удаления замены ID={sub_id}: {e}")
        raise
    finally:
        release_connection(conn)

def clear_all_substitutions():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM substitutions')
        conn.commit()
        logger.info("✅ Все замены удалены")
    except Exception as e:
        logger.error(f"Ошибка очистки замен: {e}")
        raise
    finally:
        release_connection(conn)

# ==================== ФУНКЦИИ УПРАВЛЕНИЯ ТЕХРЕЖИМОМ ====================
def set_maintenance_mode(enabled: bool, until: str = None, message: str = None):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE bot_status
            SET maintenance_mode = %s, maintenance_until = %s, maintenance_message = %s
            WHERE id = 1
        ''', (1 if enabled else 0, until, message))
        conn.commit()
        status = "включен" if enabled else "выключен"
        logger.info(f"🔧 Техрежим {status}. До: {until}")
    except Exception as e:
        logger.error(f"Ошибка установки техрежима: {e}")
        raise
    finally:
        release_connection(conn)

def get_maintenance_status():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT maintenance_mode, maintenance_until, maintenance_message FROM bot_status WHERE id = 1')
        row = cursor.fetchone()
        if row:
            return {
                'enabled': bool(row[0]),
                'until': row[1],
                'message': row[2]
            }
        return {'enabled': False, 'until': None, 'message': None}
    except Exception as e:
        logger.error(f"Ошибка получения статуса техрежима: {e}")
        return {'enabled': False, 'until': None, 'message': None}
    finally:
        release_connection(conn)

# ==================== ФУНКЦИИ УПРАВЛЕНИЯ ИЗБРАННЫМ ====================
def add_favorite(user_id, fav_type, value):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO user_favorites (user_id, fav_type, value)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, fav_type, value) DO NOTHING
        ''', (user_id, fav_type, value))
        conn.commit()
        logger.info(f"✅ Добавлено в избранное: {fav_type}={value} для пользователя {user_id}")
    except Exception as e:
        logger.error(f"Ошибка добавления в избранное: {e}")
    finally:
        release_connection(conn)

def remove_favorite(user_id, fav_type, value):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM user_favorites
            WHERE user_id = %s AND fav_type = %s AND value = %s
        ''', (user_id, fav_type, value))
        conn.commit()
        logger.info(f"✅ Удалено из избранного: {fav_type}={value} для пользователя {user_id}")
    except Exception as e:
        logger.error(f"Ошибка удаления из избранного: {e}")
    finally:
        release_connection(conn)

def get_user_favorites(user_id):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT fav_type, value FROM user_favorites
            WHERE user_id = %s
            ORDER BY created_at DESC
        ''', (user_id,))
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Ошибка получения избранного для пользователя {user_id}: {e}")
        return []
    finally:
        release_connection(conn)

def is_favorite(user_id, fav_type, value):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 1 FROM user_favorites
            WHERE user_id = %s AND fav_type = %s AND value = %s
        ''', (user_id, fav_type, value))
        return cursor.fetchone() is not None
    except Exception as e:
        logger.error(f"Ошибка проверки избранного: {e}")
        return False
    finally:
        release_connection(conn)

# ==================== ФУНКЦИИ ДЛЯ ШКОЛЬНЫХ НОВОСТЕЙ ====================
def add_news(title, content):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO news (title, content) VALUES (%s, %s) RETURNING id',
            (title, content)
        )
        news_id = cursor.fetchone()[0]
        conn.commit()
        logger.info(f"✅ Новость добавлена (ID={news_id})")
        return news_id
    except Exception as e:
        logger.error(f"Ошибка добавления новости: {e}")
        raise
    finally:
        release_connection(conn)

def get_latest_news(limit=5):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, title, content, published_at
            FROM news
            ORDER BY published_at DESC
            LIMIT %s
        ''', (limit,))
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Ошибка получения последних новостей: {e}")
        return []
    finally:
        release_connection(conn)

def get_all_news():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, title, content, published_at
            FROM news
            ORDER BY published_at DESC
        ''')
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Ошибка получения всех новостей: {e}")
        return []
    finally:
        release_connection(conn)

def get_news_by_id(news_id):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT id, title, content, published_at FROM news WHERE id = %s',
            (news_id,)
        )
        return cursor.fetchone()
    except Exception as e:
        logger.error(f"Ошибка получения новости ID={news_id}: {e}")
        return None
    finally:
        release_connection(conn)

def delete_news(news_id):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM news WHERE id = %s', (news_id,))
        conn.commit()
        logger.info(f"✅ Новость ID={news_id} удалена")
    except Exception as e:
        logger.error(f"Ошибка удаления новости ID={news_id}: {e}")
        raise
    finally:
        release_connection(conn)

# ==================== ИНИЦИАЛИЗАЦИЯ ПРИ ИМПОРТЕ ====================
if __name__ == "__main__":
    try:
        init_db()
        print("✅ База данных успешно инициализирована")
    except Exception as e:
        print(f"❌ Критическая ошибка инициализации БД: {e}")
        exit(1)
