import psycopg2
from psycopg2 import pool
import os
from datetime import datetime, timedelta
import pytz
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL не установлен!")

db_pool = None


def init_pool():
    global db_pool
    if db_pool is None:
        db_pool = pool.SimpleConnectionPool(
            minconn=1, maxconn=5,
            dsn=DATABASE_URL, sslmode='require'
        )
        logger.info("✅ Пул соединений PostgreSQL инициализирован (maxconn=5)")


def get_connection():
    if db_pool is None:
        raise RuntimeError("Пул не инициализирован! Вызовите init_pool()")
    return db_pool.getconn()


def release_connection(conn):
    if db_pool is not None and conn is not None:
        db_pool.putconn(conn)


# ──────────────────────────────────────────────
#  ИНИЦИАЛИЗАЦИЯ БД
# ──────────────────────────────────────────────
def init_db():
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
        cur = conn.cursor()

        # Пользователи
        cur.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id    BIGINT PRIMARY KEY,
                username   TEXT,
                first_name TEXT,
                last_name  TEXT,
                language_code TEXT,
                role       TEXT DEFAULT 'user',
                joined_at  TIMESTAMPTZ DEFAULT NOW(),
                last_active TIMESTAMPTZ DEFAULT NOW(),
                last_news_check TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_news_check TIMESTAMPTZ DEFAULT NOW()")

        # Учителя (авторегистрация)
        cur.execute('''
            CREATE TABLE IF NOT EXISTS teachers (
                id          SERIAL PRIMARY KEY,
                full_name   TEXT UNIQUE NOT NULL,
                telegram_id BIGINT DEFAULT 0,
                registered  BOOLEAN DEFAULT FALSE,
                registered_at TIMESTAMPTZ
            )
        ''')

        # Замены
        cur.execute('''
            CREATE TABLE IF NOT EXISTS substitutions (
                id           SERIAL PRIMARY KEY,
                date         TEXT NOT NULL,
                day          TEXT NOT NULL,
                lesson_number INTEGER NOT NULL,
                old_subject  TEXT NOT NULL,
                new_subject  TEXT NOT NULL,
                old_teacher  TEXT NOT NULL,
                new_teacher  TEXT NOT NULL,
                class_name   TEXT NOT NULL,
                created_at   TIMESTAMPTZ DEFAULT NOW()
            )
        ''')

        # Активность пользователей
        cur.execute('''
            CREATE TABLE IF NOT EXISTS user_activity (
                id        SERIAL PRIMARY KEY,
                user_id   BIGINT NOT NULL,
                action    TEXT NOT NULL,
                class_name TEXT,
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        ''')

        # Техрежим
        cur.execute('''
            CREATE TABLE IF NOT EXISTS bot_status (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                maintenance_mode INTEGER DEFAULT 0,
                maintenance_until TEXT,
                maintenance_message TEXT
            )
        ''')
        cur.execute("INSERT INTO bot_status (id, maintenance_mode) VALUES (1, 0) ON CONFLICT DO NOTHING")

        # Избранное
        cur.execute('''
            CREATE TABLE IF NOT EXISTS user_favorites (
                id         SERIAL PRIMARY KEY,
                user_id    BIGINT NOT NULL,
                fav_type   TEXT NOT NULL,
                value      TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                UNIQUE(user_id, fav_type, value)
            )
        ''')

        # Новости
        cur.execute('''
            CREATE TABLE IF NOT EXISTS news (
                id           SERIAL PRIMARY KEY,
                title        TEXT NOT NULL,
                content      TEXT NOT NULL,
                published_at TIMESTAMPTZ DEFAULT NOW(),
                views_count  INTEGER DEFAULT 0
            )
        ''')
        cur.execute("ALTER TABLE news ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0")

        # Просмотры новостей
        cur.execute('''
            CREATE TABLE IF NOT EXISTS news_views (
                id        SERIAL PRIMARY KEY,
                news_id   INTEGER NOT NULL REFERENCES news(id) ON DELETE CASCADE,
                user_id   BIGINT  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                viewed_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(news_id, user_id)
            )
        ''')

        # Профили пользователей (роль + данные регистрации)
        cur.execute('''
            CREATE TABLE IF NOT EXISTS user_profiles (
                user_id      BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
                role         TEXT NOT NULL DEFAULT 'guest',
                display_name TEXT,
                class_name   TEXT,
                registered_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')

        # Подписки на замены классов
        cur.execute('''
            CREATE TABLE IF NOT EXISTS class_subscriptions (
                id         SERIAL PRIMARY KEY,
                user_id    BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                class_name TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, class_name)
            )
        ''')
        cur.execute('CREATE INDEX IF NOT EXISTS idx_class_sub_class ON class_subscriptions(class_name)')

        # Индексы
        for idx_sql in [
            'CREATE INDEX IF NOT EXISTS idx_sub_date ON substitutions(date)',
            'CREATE INDEX IF NOT EXISTS idx_sub_class_date ON substitutions(class_name, date)',
            'CREATE INDEX IF NOT EXISTS idx_sub_teacher ON substitutions(new_teacher, date)',
            'CREATE INDEX IF NOT EXISTS idx_activity_ts ON user_activity(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_users_active ON users(last_active)',
            'CREATE INDEX IF NOT EXISTS idx_fav_user ON user_favorites(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_news_pub ON news(published_at)',
            'CREATE INDEX IF NOT EXISTS idx_teachers_tgid ON teachers(telegram_id)',
        ]:
            cur.execute(idx_sql)

        conn.commit()
        logger.info("✅ БД инициализирована")
    except Exception as e:
        logger.error(f"❌ Ошибка init_db: {e}")
        raise
    finally:
        if conn:
            conn.close()


# ──────────────────────────────────────────────
#  ПОЛЬЗОВАТЕЛИ
# ──────────────────────────────────────────────
def update_user_and_log(user_id, action, class_name=None,
                        username=None, first_name=None,
                        last_name=None, language_code=None):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO users (user_id, username, first_name, last_name, language_code, last_active)
            VALUES (%s,%s,%s,%s,%s,NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                username      = COALESCE(EXCLUDED.username,      users.username),
                first_name    = COALESCE(EXCLUDED.first_name,    users.first_name),
                last_name     = COALESCE(EXCLUDED.last_name,     users.last_name),
                language_code = COALESCE(EXCLUDED.language_code, users.language_code),
                last_active   = NOW()
        ''', (user_id, username, first_name, last_name, language_code))
        cur.execute(
            'INSERT INTO user_activity (user_id, action, class_name) VALUES (%s,%s,%s)',
            (user_id, action, class_name)
        )
        conn.commit()
    except Exception as e:
        logger.error(f"update_user_and_log error {user_id}: {e}")
        if conn:
            conn.rollback()
    finally:
        release_connection(conn)


def log_user_activity(user_id, action, class_name=None):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('UPDATE users SET last_active=NOW() WHERE user_id=%s', (user_id,))
        cur.execute(
            'INSERT INTO user_activity (user_id, action, class_name) VALUES (%s,%s,%s)',
            (user_id, action, class_name)
        )
        conn.commit()
    except Exception as e:
        logger.error(f"log_user_activity error: {e}")
        if conn:
            conn.rollback()
    finally:
        release_connection(conn)


def get_user_count():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM users')
        return cur.fetchone()[0] or 0
    except Exception as e:
        logger.error(f"get_user_count: {e}")
        return 0
    finally:
        release_connection(conn)


def get_all_users():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT user_id, username, first_name, last_name FROM users ORDER BY joined_at DESC')
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_all_users: {e}")
        return []
    finally:
        release_connection(conn)


def get_user_role(user_id):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT role FROM users WHERE user_id=%s', (user_id,))
        row = cur.fetchone()
        return row[0] if row else 'user'
    except Exception as e:
        logger.error(f"get_user_role: {e}")
        return 'user'
    finally:
        release_connection(conn)


# ──────────────────────────────────────────────
#  ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
# ──────────────────────────────────────────────
def get_user_profile(user_id):
    """Возвращает профиль пользователя или None."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT role, display_name, class_name, registered_at
            FROM user_profiles WHERE user_id=%s
        ''', (user_id,))
        row = cur.fetchone()
        if row:
            return {'role': row[0], 'display_name': row[1],
                    'class_name': row[2], 'registered_at': row[3]}
        return None
    except Exception as e:
        logger.error(f"get_user_profile: {e}")
        return None
    finally:
        release_connection(conn)


def save_user_profile(user_id, role, display_name=None, class_name=None):
    """Сохраняет или обновляет профиль пользователя."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO user_profiles (user_id, role, display_name, class_name, registered_at)
            VALUES (%s, %s, %s, %s, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                role         = EXCLUDED.role,
                display_name = EXCLUDED.display_name,
                class_name   = EXCLUDED.class_name,
                registered_at = NOW()
        ''', (user_id, role, display_name, class_name))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"save_user_profile: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        release_connection(conn)


def delete_user_profile(user_id):
    """Удаляет профиль пользователя (сброс регистрации)."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM user_profiles WHERE user_id=%s', (user_id,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"delete_user_profile: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        release_connection(conn)


def get_profile_stats():
    """Возвращает статистику по ролям для аналитики."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT role, COUNT(*) FROM user_profiles GROUP BY role ORDER BY COUNT(*) DESC
        ''')
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_profile_stats: {e}")
        return []
    finally:
        release_connection(conn)


# ──────────────────────────────────────────────
#  ПОДПИСКИ НА ЗАМЕНЫ КЛАССА
# ──────────────────────────────────────────────
def subscribe_class(user_id, class_name):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO class_subscriptions (user_id, class_name)
            VALUES (%s, %s) ON CONFLICT DO NOTHING
        ''', (user_id, class_name))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"subscribe_class: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        release_connection(conn)


def get_class_subscribers(class_name):
    """Возвращает список user_id подписанных на замены класса."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT user_id FROM class_subscriptions WHERE class_name=%s
        ''', (class_name,))
        return [r[0] for r in cur.fetchall()]
    except Exception as e:
        logger.error(f"get_class_subscribers: {e}")
        return []
    finally:
        release_connection(conn)


def get_all_teachers_db():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT full_name, telegram_id, registered FROM teachers ORDER BY full_name')
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_all_teachers_db: {e}")
        return []
    finally:
        release_connection(conn)


def get_teacher_telegram_id(full_name):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT telegram_id FROM teachers WHERE full_name=%s', (full_name,))
        row = cur.fetchone()
        return row[0] if row else 0
    except Exception as e:
        logger.error(f"get_teacher_telegram_id: {e}")
        return 0
    finally:
        release_connection(conn)


def register_teacher(full_name, telegram_id):
    """Привязывает Telegram-ID к учителю по имени. Возвращает True при успехе."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE teachers SET telegram_id=%s, registered=TRUE, registered_at=NOW()
            WHERE full_name=%s
        ''', (telegram_id, full_name))
        updated = cur.rowcount
        conn.commit()
        return updated > 0
    except Exception as e:
        logger.error(f"register_teacher: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        release_connection(conn)


def find_teacher_by_telegram_id(telegram_id):
    """Возвращает имя учителя по Telegram-ID или None."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT full_name FROM teachers WHERE telegram_id=%s', (telegram_id,))
        row = cur.fetchone()
        return row[0] if row else None
    except Exception as e:
        logger.error(f"find_teacher_by_telegram_id: {e}")
        return None
    finally:
        release_connection(conn)


def seed_teachers(teacher_names: list):
    """Заполняет таблицу teachers из списка имён (только если ещё нет записей)."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM teachers')
        if cur.fetchone()[0] > 0:
            return  # уже заполнена
        for name in teacher_names:
            cur.execute(
                'INSERT INTO teachers (full_name) VALUES (%s) ON CONFLICT DO NOTHING',
                (name,)
            )
        conn.commit()
        logger.info(f"✅ Таблица teachers заполнена ({len(teacher_names)} записей)")
    except Exception as e:
        logger.error(f"seed_teachers: {e}")
        if conn:
            conn.rollback()
    finally:
        release_connection(conn)


# ──────────────────────────────────────────────
#  НОВОСТИ
# ──────────────────────────────────────────────
def add_news(title, content):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO news (title, content) VALUES (%s,%s) RETURNING id',
            (title, content)
        )
        news_id = cur.fetchone()[0]
        conn.commit()
        return news_id
    except Exception as e:
        logger.error(f"add_news: {e}")
        raise
    finally:
        release_connection(conn)


def get_news_page_asc(offset=0, limit=5):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, title, content, published_at, views_count
            FROM news ORDER BY published_at ASC
            OFFSET %s LIMIT %s
        ''', (offset, limit))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_news_page_asc: {e}")
        return []
    finally:
        release_connection(conn)


def get_latest_news(limit=3):
    """Возвращает N последних новостей (новые сверху)."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, title, content, published_at, views_count
            FROM news ORDER BY published_at DESC LIMIT %s
        ''', (limit,))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_latest_news: {e}")
        return []
    finally:
        release_connection(conn)


def get_archive_news_page(offset=0, limit=5):
    """Возвращает страницу архивных новостей (без последних 3), новые сверху."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, title, content, published_at, views_count
            FROM news ORDER BY published_at DESC
            OFFSET %s LIMIT %s
        ''', (offset, limit))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_archive_news_page: {e}")
        return []
    finally:
        release_connection(conn)


def get_total_news_count():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM news')
        return cur.fetchone()[0] or 0
    except Exception as e:
        logger.error(f"get_total_news_count: {e}")
        return 0
    finally:
        release_connection(conn)


def get_news_detail(news_id):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'SELECT id, title, content, published_at, views_count FROM news WHERE id=%s',
            (news_id,)
        )
        row = cur.fetchone()
        if not row:
            return None
        return {'id': row[0], 'title': row[1], 'content': row[2],
                'published_at': row[3], 'views_count': row[4]}
    except Exception as e:
        logger.error(f"get_news_detail: {e}")
        return None
    finally:
        release_connection(conn)


def get_news_by_id(news_id):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT id, title, content, published_at FROM news WHERE id=%s', (news_id,))
        return cur.fetchone()
    except Exception as e:
        logger.error(f"get_news_by_id: {e}")
        return None
    finally:
        release_connection(conn)


def get_recent_news(limit=15):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'SELECT id, title, content, published_at FROM news ORDER BY published_at DESC LIMIT %s',
            (limit,)
        )
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_recent_news: {e}")
        return []
    finally:
        release_connection(conn)


def increment_news_views(news_id, user_id):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT 1 FROM news_views WHERE news_id=%s AND user_id=%s', (news_id, user_id))
        if cur.fetchone():
            return False
        cur.execute('INSERT INTO news_views (news_id, user_id) VALUES (%s,%s)', (news_id, user_id))
        cur.execute('UPDATE news SET views_count=views_count+1 WHERE id=%s', (news_id,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"increment_news_views: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        release_connection(conn)


def update_news(news_id, title, content):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('UPDATE news SET title=%s, content=%s WHERE id=%s', (title, content, news_id))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"update_news: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        release_connection(conn)


def delete_news(news_id):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM news WHERE id=%s', (news_id,))
        conn.commit()
    except Exception as e:
        logger.error(f"delete_news: {e}")
        raise
    finally:
        release_connection(conn)


def count_new_news_since(user_id):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT last_news_check FROM users WHERE user_id=%s', (user_id,))
        row = cur.fetchone()
        last_check = row[0] if row and row[0] else datetime(2000, 1, 1, tzinfo=pytz.utc)
        cur.execute('SELECT COUNT(*) FROM news WHERE published_at > %s', (last_check,))
        return cur.fetchone()[0] or 0
    except Exception as e:
        logger.error(f"count_new_news_since: {e}")
        return 0
    finally:
        release_connection(conn)


def update_user_last_news_check(user_id):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('UPDATE users SET last_news_check=NOW() WHERE user_id=%s', (user_id,))
        conn.commit()
    except Exception as e:
        logger.error(f"update_user_last_news_check: {e}")
    finally:
        release_connection(conn)


# ──────────────────────────────────────────────
#  ЗАМЕНЫ
# ──────────────────────────────────────────────
def add_substitution(date, day, lesson_number, old_subject, new_subject,
                     old_teacher, new_teacher, class_name):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO substitutions
            (date, day, lesson_number, old_subject, new_subject, old_teacher, new_teacher, class_name)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        ''', (date, day, lesson_number, old_subject, new_subject,
              old_teacher, new_teacher, class_name))
        conn.commit()
        logger.info(f"✅ Замена: {date} {class_name} урок {lesson_number}")
    except Exception as e:
        logger.error(f"add_substitution: {e}")
        raise
    finally:
        release_connection(conn)


def get_substitutions_for_date(date):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'SELECT * FROM substitutions WHERE date=%s ORDER BY class_name, lesson_number',
            (date,)
        )
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_substitutions_for_date: {e}")
        return []
    finally:
        release_connection(conn)


def get_substitutions_for_class_date(class_name, date):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'SELECT * FROM substitutions WHERE class_name=%s AND date=%s ORDER BY lesson_number',
            (class_name, date)
        )
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_substitutions_for_class_date: {e}")
        return []
    finally:
        release_connection(conn)


def get_teacher_substitutions_between(teacher_name, start_date, end_date):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT * FROM substitutions
            WHERE date >= %s AND date <= %s
              AND (new_teacher=%s OR old_teacher=%s)
            ORDER BY date, lesson_number
        ''', (start_date, end_date, teacher_name, teacher_name))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_teacher_substitutions_between: {e}")
        return []
    finally:
        release_connection(conn)


def get_all_substitutions(limit=200):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'SELECT * FROM substitutions ORDER BY date DESC, class_name, lesson_number LIMIT %s',
            (limit,)
        )
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_all_substitutions: {e}")
        return []
    finally:
        release_connection(conn)


def delete_substitution(sub_id):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM substitutions WHERE id=%s', (sub_id,))
        conn.commit()
    except Exception as e:
        logger.error(f"delete_substitution: {e}")
        raise
    finally:
        release_connection(conn)


def clear_all_substitutions():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM substitutions')
        conn.commit()
    except Exception as e:
        logger.error(f"clear_all_substitutions: {e}")
        raise
    finally:
        release_connection(conn)


# ──────────────────────────────────────────────
#  ТЕХРЕЖИМ
# ──────────────────────────────────────────────
def set_maintenance_mode(enabled: bool, until: str = None, message: str = None):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'UPDATE bot_status SET maintenance_mode=%s, maintenance_until=%s, maintenance_message=%s WHERE id=1',
            (1 if enabled else 0, until, message)
        )
        conn.commit()
    except Exception as e:
        logger.error(f"set_maintenance_mode: {e}")
        raise
    finally:
        release_connection(conn)


def get_maintenance_status():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT maintenance_mode, maintenance_until, maintenance_message FROM bot_status WHERE id=1')
        row = cur.fetchone()
        if row:
            return {'enabled': bool(row[0]), 'until': row[1], 'message': row[2]}
        return {'enabled': False, 'until': None, 'message': None}
    except Exception as e:
        logger.error(f"get_maintenance_status: {e}")
        return {'enabled': False, 'until': None, 'message': None}
    finally:
        release_connection(conn)


# ──────────────────────────────────────────────
#  ИЗБРАННОЕ
# ──────────────────────────────────────────────
def add_favorite(user_id, fav_type, value):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO user_favorites (user_id, fav_type, value) VALUES (%s,%s,%s) ON CONFLICT DO NOTHING',
            (user_id, fav_type, value)
        )
        conn.commit()
    except Exception as e:
        logger.error(f"add_favorite: {e}")
    finally:
        release_connection(conn)


def remove_favorite(user_id, fav_type, value):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'DELETE FROM user_favorites WHERE user_id=%s AND fav_type=%s AND value=%s',
            (user_id, fav_type, value)
        )
        conn.commit()
    except Exception as e:
        logger.error(f"remove_favorite: {e}")
    finally:
        release_connection(conn)


def get_user_favorites(user_id):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'SELECT fav_type, value FROM user_favorites WHERE user_id=%s ORDER BY created_at DESC',
            (user_id,)
        )
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_user_favorites: {e}")
        return []
    finally:
        release_connection(conn)


def is_favorite(user_id, fav_type, value):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'SELECT 1 FROM user_favorites WHERE user_id=%s AND fav_type=%s AND value=%s',
            (user_id, fav_type, value)
        )
        return cur.fetchone() is not None
    except Exception as e:
        logger.error(f"is_favorite: {e}")
        return False
    finally:
        release_connection(conn)


# ──────────────────────────────────────────────
#  АНАЛИТИКА
# ──────────────────────────────────────────────
def get_active_users_24h():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        yesterday = datetime.now(pytz.utc) - timedelta(hours=24)
        cur.execute(
            'SELECT COUNT(DISTINCT user_id) FROM user_activity WHERE timestamp > %s',
            (yesterday,)
        )
        return cur.fetchone()[0] or 0
    except Exception as e:
        logger.error(f"get_active_users_24h: {e}")
        return 0
    finally:
        release_connection(conn)


def get_popular_classes():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        week_ago = datetime.now(pytz.utc) - timedelta(days=7)
        cur.execute('''
            SELECT class_name, COUNT(*) as cnt FROM user_activity
            WHERE class_name IS NOT NULL AND timestamp > %s
            GROUP BY class_name ORDER BY cnt DESC LIMIT 5
        ''', (week_ago,))
        return [r[0] for r in cur.fetchall() if r[0]]
    except Exception as e:
        logger.error(f"get_popular_classes: {e}")
        return []
    finally:
        release_connection(conn)


def get_peak_hours():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        week_ago = datetime.now(pytz.utc) - timedelta(days=7)
        cur.execute('''
            SELECT EXTRACT(HOUR FROM timestamp) as h, COUNT(*) as cnt
            FROM user_activity WHERE timestamp > %s
            GROUP BY h ORDER BY cnt DESC LIMIT 3
        ''', (week_ago,))
        rows = cur.fetchall()
        return ", ".join(f"{int(r[0]):02d}:00" for r in rows) if rows else "Нет данных"
    except Exception as e:
        logger.error(f"get_peak_hours: {e}")
        return "Ошибка"
    finally:
        release_connection(conn)
