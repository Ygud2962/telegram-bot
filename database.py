import psycopg2
from psycopg2 import pool
import os
import time
from datetime import datetime, timedelta
import pytz
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL не установлен!")

db_pool = None
_TEMP_CONNECTION_IDS: set[int] = set()
_POLLING_LOCK_CONN = None
_POLLING_LOCK_KEY = 82445031

# Параметры retry при потере связи с БД
_DB_RETRY_ATTEMPTS = 5        # попыток переподключения
_DB_RETRY_DELAYS   = [1, 2, 4, 8, 15]  # секунды между попытками


def init_pool():
    """Инициализирует пул соединений с retry."""
    global db_pool
    last_err = None
    for attempt, delay in enumerate(_DB_RETRY_DELAYS, 1):
        try:
            if db_pool is not None:
                try:
                    db_pool.closeall()
                except Exception:
                    pass
            db_pool = pool.SimpleConnectionPool(
                minconn=1, maxconn=10,
                dsn=DATABASE_URL, sslmode='require',
                connect_timeout=10,
            )
            logger.info(f"✅ Пул PostgreSQL инициализирован (попытка {attempt})")
            return
        except Exception as e:
            last_err = e
            if attempt < _DB_RETRY_ATTEMPTS:
                logger.warning(f"⚠️  БД недоступна (попытка {attempt}/{_DB_RETRY_ATTEMPTS}), жду {delay}с: {e}")
                time.sleep(delay)
    logger.error(f"❌ Не удалось подключиться к БД после {_DB_RETRY_ATTEMPTS} попыток: {last_err}")
    raise last_err


def _try_new_connection():
    """Создаёт новое прямое соединение с retry."""
    last_err = None
    for attempt, delay in enumerate(_DB_RETRY_DELAYS[:3], 1):  # макс 3 попытки для одного запроса
        try:
            conn = psycopg2.connect(
                DATABASE_URL, sslmode='require', connect_timeout=10
            )
            return conn
        except Exception as e:
            last_err = e
            if attempt < 3:
                logger.warning(f"⚠️  Переподключение к БД (попытка {attempt}/3), жду {delay}с")
                time.sleep(delay)
    raise last_err


def _pool_is_dead():
    """Проверяет, сломан ли пул (закрыт или None)."""
    global db_pool
    if db_pool is None:
        return True
    try:
        # SimpleConnectionPool не имеет .closed, проверяем через getconn/putconn
        conn = db_pool.getconn()
        db_pool.putconn(conn)
        return False
    except Exception:
        return True


def get_connection():
    """Возвращает живое соединение из пула. При обрыве — пересоздаёт с retry."""
    global db_pool
    if db_pool is None:
        init_pool()
    try:
        conn = db_pool.getconn()
    except pool.PoolError:
        logger.warning("⚠️ Пул БД исчерпан, открываю временное подключение")
        conn = _try_new_connection()
        _TEMP_CONNECTION_IDS.add(id(conn))
    except Exception:
        # Пул сломан — пересоздаём
        logger.warning("⚠️  Пул соединений сломан, пересоздаём...")
        db_pool = None  # сбрасываем чтобы init_pool не пытался закрыть сломанный пул
        init_pool()
        conn = db_pool.getconn()
    try:
        # Проверяем что соединение живое
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        return conn
    except Exception:
        # Соединение мёртвое — закрываем и создаём новое напрямую
        release_connection(conn)
        try:
            new_conn = _try_new_connection()
            # Кладём новое соединение обратно в пул и берём его
            try:
                db_pool.putconn(new_conn)
            except Exception:
                try:
                    new_conn.close()
                except Exception:
                    pass
                raise
            return db_pool.getconn()
        except Exception as e:
            logger.error(f"Не удалось переподключиться к БД: {e}")
            raise


def release_connection(conn):
    global db_pool
    if conn is None:
        return
    if id(conn) in _TEMP_CONNECTION_IDS:
        _TEMP_CONNECTION_IDS.discard(id(conn))
        try:
            conn.close()
        except Exception:
            pass
        return
    if db_pool is None:
        try:
            conn.close()
        except Exception:
            pass
        return
    try:
        # Если соединение в плохом состоянии — закрываем его
        if conn.closed:
            db_pool.putconn(conn, close=True)
        else:
            db_pool.putconn(conn)
    except Exception:
        pass


def _safe_rollback(conn):
    """Безопасный rollback — не падает если соединение уже закрыто."""
    if conn is None:
        return
    try:
        if not conn.closed:
            conn.rollback()
    except Exception:
        pass


def acquire_polling_lock(lock_key: int = _POLLING_LOCK_KEY) -> bool:
    """Пытается взять глобальную advisory-блокировку для polling (один инстанс бота)."""
    global _POLLING_LOCK_CONN
    if _POLLING_LOCK_CONN is not None:
        try:
            if not _POLLING_LOCK_CONN.closed:
                return True
        except Exception:
            _POLLING_LOCK_CONN = None

    conn = None
    try:
        conn = psycopg2.connect(
            DATABASE_URL, sslmode='require', connect_timeout=10
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("SELECT pg_try_advisory_lock(%s)", (lock_key,))
        row = cur.fetchone()
        cur.close()
        if row and bool(row[0]):
            _POLLING_LOCK_CONN = conn
            logger.info("✅ Polling lock acquired")
            return True
        conn.close()
        return False
    except Exception as e:
        logger.warning(f"⚠️ Не удалось взять polling lock: {e}")
        try:
            if conn:
                conn.close()
        except Exception:
            pass
        return False


def wait_for_polling_lock(max_wait_sec: int = 180, interval_sec: int = 5) -> bool:
    """Ждёт освобождения polling lock до max_wait_sec."""
    interval = max(1, int(interval_sec))
    attempts = max(1, int(max_wait_sec) // interval)
    for i in range(attempts):
        if acquire_polling_lock():
            return True
        if i < attempts - 1:
            logger.warning(
                f"⏳ Polling lock занят другим инстансом, жду {interval}с "
                f"(попытка {i + 1}/{attempts})"
            )
            time.sleep(interval)
    return False


def release_polling_lock(lock_key: int = _POLLING_LOCK_KEY) -> None:
    """Освобождает advisory lock polling при остановке процесса."""
    global _POLLING_LOCK_CONN
    conn = _POLLING_LOCK_CONN
    _POLLING_LOCK_CONN = None
    if conn is None:
        return
    try:
        if not conn.closed:
            cur = conn.cursor()
            try:
                cur.execute("SELECT pg_advisory_unlock(%s)", (lock_key,))
            finally:
                cur.close()
    except Exception:
        pass
    finally:
        try:
            conn.close()
        except Exception:
            pass



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

        # Результаты игры "Шивровальщик"
        cur.execute('''
            CREATE TABLE IF NOT EXISTS game_results (
                id           SERIAL PRIMARY KEY,
                user_id      BIGINT NOT NULL,
                user_name    TEXT,
                chapter      INTEGER DEFAULT 0,
                score        INTEGER DEFAULT 0,
                total_score  INTEGER DEFAULT 0,
                completed    INTEGER DEFAULT 0,
                game_over    BOOLEAN DEFAULT FALSE,
                failed       BOOLEAN DEFAULT FALSE,
                updated_at   TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id)
            )
        ''')
        cur.execute('CREATE INDEX IF NOT EXISTS idx_game_score ON game_results(total_score DESC)')
        cur.execute('CREATE INDEX IF NOT EXISTS idx_game_user  ON game_results(user_id)')
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE')
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS achievement_count INTEGER DEFAULT 0')
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS achievement_pts INTEGER DEFAULT 0')
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS restart_mode VARCHAR(20) DEFAULT NULL')
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS failed BOOLEAN DEFAULT FALSE')
        # Таблица управления главами игры
        cur.execute('''
            CREATE TABLE IF NOT EXISTS game_chapters (
                chapter_id   INTEGER PRIMARY KEY,
                is_open      BOOLEAN DEFAULT FALSE,
                open_at      TIMESTAMPTZ,
                updated_at   TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        # Глобальный режим доступа к игре:
        # beta (только белый список), open (для всех), closed (закрыта)
        cur.execute('''
            CREATE TABLE IF NOT EXISTS game_access_settings (
                id          INTEGER PRIMARY KEY CHECK (id = 1),
                access_mode TEXT NOT NULL DEFAULT 'beta',
                updated_at  TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        cur.execute('''
            INSERT INTO game_access_settings (id, access_mode)
            VALUES (1, 'beta')
            ON CONFLICT (id) DO NOTHING
        ''')
        # Инициализируем таблицу ролей
        cur.execute('''
            CREATE TABLE IF NOT EXISTS game_roles (
                user_id    BIGINT PRIMARY KEY,
                role       TEXT DEFAULT 'player',
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')

        # Таблица доступа к главам для конкретных игроков
        # (для обычных игроков главы открываются индивидуально через админа)
        cur.execute('''
            CREATE TABLE IF NOT EXISTS player_chapter_access (
                user_id    BIGINT NOT NULL,
                chapter_id INTEGER NOT NULL,
                granted_at TIMESTAMPTZ DEFAULT NOW(),
                granted_by BIGINT,
                PRIMARY KEY (user_id, chapter_id)
            )
        ''')

        cur.execute('''
            INSERT INTO game_chapters (chapter_id, is_open)
            VALUES (1,FALSE),(2,FALSE),(3,FALSE),(4,FALSE),(5,FALSE),(6,FALSE)
            ON CONFLICT (chapter_id) DO NOTHING
        ''')

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
        err_text = str(e)
        if 'Connection refused' in err_text or 'could not connect to server' in err_text:
            logger.warning(f"⚠️ init_db: БД ещё не готова: {e}")
        else:
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
            _safe_rollback(conn)
    finally:
        release_connection(conn)


def log_user_activity(user_id, action, class_name=None):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Гарантируем существование пользователя перед записью активности,
        # чтобы не нарушать FK-ограничение user_activity_user_id_fkey
        cur.execute(
            'INSERT INTO users (user_id, last_active) VALUES (%s, NOW()) '
            'ON CONFLICT (user_id) DO UPDATE SET last_active = NOW()',
            (user_id,)
        )
        cur.execute(
            'INSERT INTO user_activity (user_id, action, class_name) VALUES (%s,%s,%s)',
            (user_id, action, class_name)
        )
        conn.commit()
    except Exception as e:
        logger.error(f"log_user_activity error: {e}")
        if conn:
            _safe_rollback(conn)
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


def get_user_info(user_id):
    """Возвращает информацию о пользователе: dict или None."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'SELECT user_id, username, first_name, last_name FROM users WHERE user_id=%s',
            (user_id,)
        )
        row = cur.fetchone()
        if row:
            return {'user_id': row[0], 'username': row[1],
                    'first_name': row[2], 'last_name': row[3]}
        return None
    except Exception as e:
        logger.error(f"get_user_info: {e}")
        return None
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
            _safe_rollback(conn)
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
            _safe_rollback(conn)
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
            _safe_rollback(conn)
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
    if isinstance(full_name, dict):
        full_name = full_name.get('full_name')
    if not full_name:
        return False
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
            _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def find_teacher_by_telegram_id(telegram_id):
    """Возвращает {'full_name': ..., 'registered_at': ...} или None."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'SELECT full_name, registered_at FROM teachers WHERE telegram_id=%s',
            (telegram_id,)
        )
        row = cur.fetchone()
        if row:
            return {'full_name': row[0], 'registered_at': row[1]}
        return None
    except Exception as e:
        logger.error(f"find_teacher_by_telegram_id: {e}")
        return None
    finally:
        release_connection(conn)


def unregister_teacher(full_name):
    """Сбрасывает telegram_id и registered для учителя — освобождает имя."""
    # Защита: если случайно передали dict — извлекаем строку
    if isinstance(full_name, dict):
        full_name = full_name.get('full_name')
    if not full_name:
        return False
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE teachers SET telegram_id=0, registered=FALSE, registered_at=NULL
            WHERE full_name=%s
        ''', (full_name,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"unregister_teacher: {e}")
        if conn:
            _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def get_registered_teacher_names():
    """Возвращает set имён учителей которые уже зарегистрировались в боте."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT full_name FROM teachers WHERE registered=TRUE AND telegram_id != 0')
        return {row[0] for row in cur.fetchall()}
    except Exception as e:
        logger.error(f"get_registered_teacher_names: {e}")
        return set()
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
            _safe_rollback(conn)
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


def get_news(offset=0, limit=8, order='DESC'):
    """Универсальная функция получения новостей. Заменяет get_news_page_asc,
    get_latest_news, get_archive_news_page, get_recent_news."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        if order == 'ASC':
            cur.execute('''
                SELECT id, title, content, published_at, views_count
                FROM news ORDER BY published_at ASC
                OFFSET %s LIMIT %s
            ''', (offset, limit))
        else:
            cur.execute('''
                SELECT id, title, content, published_at, views_count
                FROM news ORDER BY published_at DESC
                OFFSET %s LIMIT %s
            ''', (offset, limit))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_news: {e}")
        return []
    finally:
        release_connection(conn)


# Алиасы для обратной совместимости
def get_archive_news_page(offset=0, limit=8):
    return get_news(offset=offset, limit=limit, order='DESC')

def get_latest_news(limit=3):
    return get_news(offset=0, limit=limit, order='DESC')

def get_recent_news(limit=15):
    return get_news(offset=0, limit=limit, order='DESC')

def get_news_page_asc(offset=0, limit=5):
    return get_news(offset=offset, limit=limit, order='ASC')



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
    """Возвращает кортеж (id, title, content, published_at) или None."""
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
            _safe_rollback(conn)
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
            _safe_rollback(conn)
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

# ──────────────────────────────────────────────
#  ИГРА "ШИВРОВАЛЬЩИК"
# ──────────────────────────────────────────────

def save_game_result(user_id, user_name, chapter, score, total_score,
                     completed, game_over=False, failed=False):
    """Сохраняет/обновляет результат игрока. БД всегда принимает новое значение."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO game_results
                (user_id, user_name, chapter, score, total_score, completed, game_over, failed, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                user_name   = EXCLUDED.user_name,
                chapter     = EXCLUDED.chapter,
                score       = EXCLUDED.score,
                total_score = EXCLUDED.total_score,
                completed   = EXCLUDED.completed,
                game_over   = EXCLUDED.game_over,
                failed      = EXCLUDED.failed,
                updated_at  = NOW()
        ''', (user_id, user_name, chapter, score, total_score,
              completed, game_over, failed))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"save_game_result error {user_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)




def register_game_player(user_id, user_name=None):
    """Регистрирует игрока при первом открытии — НИКОГДА не трогает очки/прогресс."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO game_results (user_id, user_name, chapter, score, total_score, completed, updated_at)
            VALUES (%s, %s, 0, 0, 0, 0, NOW())
            ON CONFLICT (user_id) DO UPDATE
                SET user_name = EXCLUDED.user_name
        ''', (user_id, user_name))
        conn.commit()
    except Exception as e:
        logger.error(f"register_game_player error {user_id}: {e}")
        _safe_rollback(conn)
    finally:
        release_connection(conn)

def get_game_players_count():
    """Возвращает количество участников рейтинга (только role=player)."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT COUNT(*)
            FROM game_results gr
            LEFT JOIN game_roles rol ON gr.user_id = rol.user_id
            WHERE NOT COALESCE(gr.banned, FALSE)
              AND COALESCE(rol.role, 'player') = 'player'
              AND gr.total_score > 0
        ''')
        return cur.fetchone()[0]
    except Exception as e:
        logger.error(f"get_game_players_count error: {e}")
        return 0
    finally:
        release_connection(conn)

def get_game_leaderboard(limit=20):
    """Возвращает публичный топ игроков.
    Админы, тестировщики и игроки с 0 очков НЕ включаются."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT
                gr.user_id, gr.user_name, gr.total_score, gr.completed,
                gr.game_over,
                COALESCE(rol.role, 'player') AS role,
                COALESCE(gr.achievement_count, 0) AS achievement_count,
                COALESCE(gr.achievement_pts,   0) AS achievement_pts
            FROM game_results gr
            LEFT JOIN game_roles rol ON gr.user_id = rol.user_id
            WHERE NOT COALESCE(gr.banned, FALSE)
              AND COALESCE(rol.role, 'player') NOT IN ('admin', 'tester')
              AND gr.total_score > 0
            ORDER BY gr.total_score DESC, gr.updated_at ASC
            LIMIT %s
        ''', (limit,))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_game_leaderboard error: {e}")
        return []
    finally:
        release_connection(conn)


def get_game_result(user_id):
    """Возвращает результат конкретного игрока или None."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT user_id, user_name, total_score, completed, game_over, updated_at,
                   COALESCE(banned, FALSE) as banned
            FROM game_results
            WHERE user_id = %s
        ''', (user_id,))
        return cur.fetchone()
    except Exception as e:
        logger.error(f"get_game_result error {user_id}: {e}")
        return None
    finally:
        release_connection(conn)


def reset_game_result(user_id):
    """Сбрасывает прогресс конкретного игрока (обнуляет, не удаляет), включая достижения."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE game_results
            SET chapter=0, score=0, total_score=0, completed=0,
                game_over=FALSE, failed=FALSE,
                achievement_count=0, achievement_pts=0,
                updated_at=NOW()
            WHERE user_id=%s
        """, (user_id,))
        updated = cur.rowcount
        conn.commit()
        return updated > 0
    except Exception as e:
        logger.error(f"reset_game_result error {user_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def update_achievement_stats(user_id, achievement_count, achievement_pts):
    """Обновляет статистику достижений игрока. Всегда записывает переданное значение."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE game_results
            SET achievement_count = %s,
                achievement_pts   = %s,
                updated_at        = NOW()
            WHERE user_id = %s
        ''', (achievement_count, achievement_pts, user_id))
        conn.commit()
    except Exception as e:
        logger.error(f"update_achievement_stats error {user_id}: {e}")
        _safe_rollback(conn)
    finally:
        release_connection(conn)


def reset_game_result_soft(user_id, mode='penalty'):
    """Мягкий сброс — сохраняет очки, только снимает game_over.
    mode='penalty': game_over=FALSE, restart_mode='penalty' (+10с к заданиям)
    mode='nopts':   game_over=FALSE, restart_mode='nopts'   (без очков)
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Добавляем колонку если нет
        cur.execute("""
            ALTER TABLE game_results
            ADD COLUMN IF NOT EXISTS restart_mode VARCHAR(20) DEFAULT NULL
        """)
        cur.execute("""
            UPDATE game_results
            SET game_over=FALSE, restart_mode=%s, updated_at=NOW()
            WHERE user_id=%s
        """, (mode, user_id))
        updated = cur.rowcount
        conn.commit()
        return updated > 0
    except Exception as e:
        logger.error(f"reset_game_result_soft error {user_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def get_restart_mode(user_id):
    """Возвращает режим перезапуска для игрока или None."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT restart_mode FROM game_results WHERE user_id=%s
        """, (user_id,))
        row = cur.fetchone()
        return row[0] if row else None
    except Exception as e:
        logger.error(f"get_restart_mode error {user_id}: {e}")
        return None
    finally:
        release_connection(conn)


def clear_restart_mode(user_id):
    """Сбрасывает restart_mode после того как игрок начал заново."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE game_results SET restart_mode=NULL WHERE user_id=%s
        """, (user_id,))
        conn.commit()
    except Exception as e:
        logger.error(f"clear_restart_mode error {user_id}: {e}")
        _safe_rollback(conn)
    finally:
        release_connection(conn)


def reset_all_game_results():
    """Сбрасывает прогресс всех игроков включая достижения и доступ к главам."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE game_results
            SET chapter=0, score=0, total_score=0, completed=0,
                game_over=FALSE, failed=FALSE,
                achievement_count=0, achievement_pts=0,
                updated_at=NOW()
        """)
        updated = cur.rowcount
        cur.execute("DELETE FROM player_chapter_access")
        conn.commit()
        return updated
    except Exception as e:
        logger.error(f"reset_all_game_results error: {e}")
        _safe_rollback(conn)
        return 0
    finally:
        release_connection(conn)


def ban_game_user(user_id):
    """Банит игрока — обнуляет очки и ставит флаг banned."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Добавим колонку banned если ещё нет
        cur.execute('''
            ALTER TABLE game_results
            ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE
        ''')
        cur.execute('''
            UPDATE game_results
            SET total_score = 0, score = 0, banned = TRUE, updated_at = NOW()
            WHERE user_id = %s
        ''', (user_id,))
        updated = cur.rowcount
        conn.commit()
        return updated > 0
    except Exception as e:
        logger.error(f"ban_game_user error {user_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def unban_game_user(user_id):
    """Снимает бан игрока."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE game_results SET banned = FALSE, updated_at = NOW()
            WHERE user_id = %s
        ''', (user_id,))
        conn.commit()
        return cur.rowcount > 0
    except Exception as e:
        logger.error(f"unban_game_user error {user_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def get_game_leaderboard_admin(limit=50):
    """Полный список для админа: user_id, user_name, total_score, completed, game_over, failed, banned, updated_at."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT user_id, user_name, total_score, completed, game_over,
                   COALESCE(failed, FALSE),
                   COALESCE(banned, FALSE),
                   updated_at
            FROM game_results
            ORDER BY total_score DESC, updated_at ASC
            LIMIT %s
        ''', (limit,))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_game_leaderboard_admin error: {e}")
        return []
    finally:
        release_connection(conn)


def get_game_result_detail(user_id):
    """Детальный результат игрока для админа."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT user_id, user_name, total_score, completed, game_over,
                   chapter, score, COALESCE(failed, FALSE),
                   COALESCE(banned, FALSE), updated_at
            FROM game_results
            WHERE user_id = %s
        ''', (user_id,))
        return cur.fetchone()
    except Exception as e:
        logger.error(f"get_game_result_detail error {user_id}: {e}")
        return None
    finally:
        release_connection(conn)



# ──────────────────────────────────────────────
#  УПРАВЛЕНИЕ ГЛАВАМИ ИГРЫ
# ──────────────────────────────────────────────

def get_chapters_status():
    """Возвращает статус всех глав: [(chapter_id, is_open, open_at), ...]"""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT chapter_id, is_open, open_at, updated_at
            FROM game_chapters ORDER BY chapter_id
        ''')
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_chapters_status error: {e}")
        return []
    finally:
        release_connection(conn)


def get_open_chapters():
    """Возвращает set открытых chapter_id (с учётом open_at)."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT chapter_id FROM game_chapters
            WHERE is_open = TRUE
               OR (open_at IS NOT NULL AND open_at <= NOW())
        ''')
        return {r[0] for r in cur.fetchall()}
    except Exception as e:
        logger.error(f"get_open_chapters error: {e}")
        return set()
    finally:
        release_connection(conn)


def open_chapter(chapter_id):
    """Немедленно открывает главу."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE game_chapters
            SET is_open = TRUE, open_at = NULL, updated_at = NOW()
            WHERE chapter_id = %s
        ''', (chapter_id,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"open_chapter error {chapter_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def close_chapter(chapter_id):
    """Закрывает главу."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE game_chapters
            SET is_open = FALSE, open_at = NULL, updated_at = NOW()
            WHERE chapter_id = %s
        ''', (chapter_id,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"close_chapter error {chapter_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def schedule_chapter(chapter_id, open_at_dt):
    """Устанавливает дату/время автоматического открытия главы."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE game_chapters
            SET is_open = FALSE, open_at = %s, updated_at = NOW()
            WHERE chapter_id = %s
        ''', (open_at_dt, chapter_id))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"schedule_chapter error {chapter_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def open_all_chapters():
    """Открывает все главы сразу."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("UPDATE game_chapters SET is_open = TRUE, open_at = NULL, updated_at = NOW()")
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"open_all_chapters error: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)



# ──────────────────────────────────────────────
#  РОЛИ ИГРОКОВ (admin / tester / player)
# ──────────────────────────────────────────────

def init_game_roles_table():
    """Создаёт таблицу game_roles если не существует."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS game_roles (
                user_id   BIGINT PRIMARY KEY,
                role      TEXT DEFAULT 'player',  -- admin / tester / player
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        conn.commit()
    except Exception as e:
        logger.error(f"init_game_roles_table error: {e}")
        _safe_rollback(conn)
    finally:
        release_connection(conn)


def set_game_role(user_id, role):
    """Устанавливает роль игрока: admin / tester / player."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO game_roles (user_id, role)
            VALUES (%s, %s)
            ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()
        ''', (user_id, role))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"set_game_role error: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def get_game_role(user_id):
    """Возвращает роль игрока или 'player' по умолчанию."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT role FROM game_roles WHERE user_id = %s', (user_id,))
        row = cur.fetchone()
        return row[0] if row else 'player'
    except Exception as e:
        logger.error(f"get_game_role error: {e}")
        return 'player'
    finally:
        release_connection(conn)


def get_game_leaderboard_with_roles(limit=20):
    """Таблица лидеров с ролями — сортировка: admin → tester → player, внутри по очкам."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT
                gr.user_id,
                gr.user_name,
                gr.total_score,
                gr.completed,
                gr.game_over,
                COALESCE(rol.role, 'player') AS role
            FROM game_results gr
            LEFT JOIN game_roles rol ON gr.user_id = rol.user_id
            WHERE NOT COALESCE(gr.banned, FALSE)
              AND (
                    COALESCE(rol.role, 'player') IN ('admin', 'tester')
                    OR gr.total_score > 0
                  )
            ORDER BY
                CASE COALESCE(rol.role, 'player')
                    WHEN 'admin'  THEN 1
                    WHEN 'tester' THEN 2
                    ELSE 3
                END,
                gr.total_score DESC,
                gr.updated_at ASC
            LIMIT %s
        ''', (limit,))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_game_leaderboard_with_roles error: {e}")
        return []
    finally:
        release_connection(conn)


# ──────────────────────────────────────────────
#  БЕТА-ТЕСТ: БЕЛЫЙ СПИСОК ИГРЫ
# ──────────────────────────────────────────────

def init_beta_table():
    """Создаёт таблицу game_beta если не существует."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS game_beta (
                user_id    BIGINT PRIMARY KEY,
                user_name  TEXT,
                added_at   TIMESTAMPTZ DEFAULT NOW(),
                note       TEXT
            )
        ''')
        conn.commit()
    except Exception as e:
        logger.error(f"init_beta_table error: {e}")
        _safe_rollback(conn)
    finally:
        release_connection(conn)


def get_game_access_mode() -> str:
    """Возвращает глобальный режим доступа: beta/open/closed."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS game_access_settings (
                id          INTEGER PRIMARY KEY CHECK (id = 1),
                access_mode TEXT NOT NULL DEFAULT 'beta',
                updated_at  TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        cur.execute('''
            INSERT INTO game_access_settings (id, access_mode)
            VALUES (1, 'beta')
            ON CONFLICT (id) DO NOTHING
        ''')
        cur.execute('SELECT access_mode FROM game_access_settings WHERE id = 1')
        row = cur.fetchone()
        conn.commit()
        mode = (row[0] if row and row[0] else 'beta').strip().lower()
        return mode if mode in ('beta', 'open', 'closed') else 'beta'
    except Exception as e:
        logger.error(f"get_game_access_mode error: {e}")
        return 'beta'
    finally:
        release_connection(conn)


def set_game_access_mode(mode: str) -> bool:
    """Устанавливает глобальный режим доступа: beta/open/closed."""
    mode = (mode or '').strip().lower()
    if mode not in ('beta', 'open', 'closed'):
        return False
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS game_access_settings (
                id          INTEGER PRIMARY KEY CHECK (id = 1),
                access_mode TEXT NOT NULL DEFAULT 'beta',
                updated_at  TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        cur.execute('''
            INSERT INTO game_access_settings (id, access_mode, updated_at)
            VALUES (1, %s, NOW())
            ON CONFLICT (id) DO UPDATE SET
                access_mode = EXCLUDED.access_mode,
                updated_at  = NOW()
        ''', (mode,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"set_game_access_mode error: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def is_beta_enabled():
    """Проверяет включён ли режим бета (есть ли хоть один тестер в списке)."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Сначала создаём таблицу если нет
        cur.execute('''
            CREATE TABLE IF NOT EXISTS game_beta (
                user_id   BIGINT PRIMARY KEY,
                user_name TEXT,
                added_at  TIMESTAMPTZ DEFAULT NOW(),
                note      TEXT
            )
        ''')
        cur.execute('SELECT COUNT(*) FROM game_beta')
        count = cur.fetchone()[0]
        conn.commit()
        return count > 0
    except Exception as e:
        logger.error(f"is_beta_enabled error: {e}")
        return False
    finally:
        release_connection(conn)


def is_beta_allowed(user_id):
    """True если пользователь в белом списке бета-теста."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT 1 FROM game_beta WHERE user_id = %s', (user_id,))
        return cur.fetchone() is not None
    except Exception as e:
        logger.error(f"is_beta_allowed error {user_id}: {e}")
        return False
    finally:
        release_connection(conn)


def add_beta_user(user_id, user_name=None, note=None):
    """Добавляет пользователя в белый список."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO game_beta (user_id, user_name, note)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE
            SET user_name = EXCLUDED.user_name,
                note      = COALESCE(EXCLUDED.note, game_beta.note)
        ''', (user_id, user_name, note))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"add_beta_user error {user_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def remove_beta_user(user_id):
    """Убирает пользователя из белого списка."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM game_beta WHERE user_id = %s', (user_id,))
        removed = cur.rowcount > 0
        conn.commit()
        return removed
    except Exception as e:
        logger.error(f"remove_beta_user error {user_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def get_beta_users():
    """Возвращает всех тестеров: [(user_id, user_name, added_at, note), ...]."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT user_id, user_name, added_at, note
            FROM game_beta
            ORDER BY added_at DESC
        ''')
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_beta_users error: {e}")
        return []
    finally:
        release_connection(conn)


def clear_beta_list():
    """Полностью очищает белый список (открывает игру всем)."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM game_beta')
        deleted = cur.rowcount
        conn.commit()
        return deleted
    except Exception as e:
        logger.error(f"clear_beta_list error: {e}")
        _safe_rollback(conn)
        return 0
    finally:
        release_connection(conn)


def count_admins() -> int:
    """Возвращает количество пользователей с ролью admin в game_roles."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM game_roles WHERE role = 'admin'")
        row = cur.fetchone()
        return row[0] if row else 0
    except Exception as e:
        logger.error(f"count_admins error: {e}")
        return 0
    finally:
        release_connection(conn)


# ══════════════════════════════════════════════════════════
#  БОТ-АДМИНИСТРАТОРЫ (отдельно от игровой роли)
#  Таблица bot_admins — кто видит "Админку" в боте
# ══════════════════════════════════════════════════════════

def migrate_bot_admins_table():
    """Создаёт таблицу bot_admins и player_chapter_access если не существуют."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS bot_admins (
                user_id    BIGINT PRIMARY KEY,
                granted_by BIGINT,
                granted_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        # Таблица индивидуального доступа к главам для игроков
        cur.execute("""
            CREATE TABLE IF NOT EXISTS player_chapter_access (
                user_id    BIGINT NOT NULL,
                chapter_id INTEGER NOT NULL,
                granted_at TIMESTAMPTZ DEFAULT NOW(),
                granted_by BIGINT,
                PRIMARY KEY (user_id, chapter_id)
            )
        """)
        conn.commit()
        logger.info("✅ Таблицы bot_admins и player_chapter_access созданы/проверены")
        return True
    except Exception as e:
        logger.error(f"migrate_bot_admins_table error: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def is_bot_admin_db(user_id: int) -> bool:
    """Проверяет есть ли пользователь в таблице bot_admins."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM bot_admins WHERE user_id = %s", (user_id,))
        return cur.fetchone() is not None
    except Exception as e:
        logger.error(f"is_bot_admin_db error: {e}")
        return False
    finally:
        release_connection(conn)


def add_bot_admin(user_id: int, granted_by: int = None) -> bool:
    """Добавляет пользователя в таблицу bot_admins."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO bot_admins(user_id, granted_by, granted_at)
            VALUES(%s, %s, NOW())
            ON CONFLICT(user_id) DO UPDATE SET granted_by=%s, granted_at=NOW()
        """, (user_id, granted_by, granted_by))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"add_bot_admin error: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def claim_first_bot_admin(user_id: int) -> bool:
    """Атомарно назначает первого админа бота. Возвращает True только если прав не было."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Глобальная транзакционная блокировка для bootstrap-сценария.
        cur.execute("SELECT pg_advisory_xact_lock(%s)", (99177351,))
        cur.execute("""
            WITH has_admin AS (
                SELECT 1 FROM bot_admins LIMIT 1
            )
            INSERT INTO bot_admins(user_id, granted_by, granted_at)
            SELECT %s, %s, NOW()
            WHERE NOT EXISTS (SELECT 1 FROM has_admin)
            ON CONFLICT (user_id) DO NOTHING
            RETURNING user_id
        """, (user_id, user_id))
        row = cur.fetchone()
        conn.commit()
        return bool(row)
    except Exception as e:
        logger.error(f"claim_first_bot_admin error: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def remove_bot_admin(user_id: int) -> bool:
    """Убирает пользователя из bot_admins."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM bot_admins WHERE user_id = %s", (user_id,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"remove_bot_admin error: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def count_bot_admins() -> int:
    """Возвращает количество бот-администраторов."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM bot_admins")
        row = cur.fetchone()
        return row[0] if row else 0
    except Exception as e:
        logger.error(f"count_bot_admins error: {e}")
        return 0
    finally:
        release_connection(conn)


def get_all_bot_admins() -> list:
    """Возвращает список всех бот-администраторов: [(user_id, granted_at), ...]."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT user_id, granted_at FROM bot_admins ORDER BY granted_at")
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_all_bot_admins error: {e}")
        return []
    finally:
        release_connection(conn)

# ══════════════════════════════════════════════════════════
#  ИНДИВИДУАЛЬНЫЙ ДОСТУП К ГЛАВАМ ДЛЯ ИГРОКОВ
# ══════════════════════════════════════════════════════════

def get_player_accessible_chapters(user_id: int) -> set:
    """Возвращает set chapter_id, доступных конкретному игроку.
    Для admin/tester не нужно — у них всегда все главы.
    Для player — индивидуально открытые + глобально открытые.
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Индивидуально открытые для этого игрока
        cur.execute('SELECT chapter_id FROM player_chapter_access WHERE user_id = %s', (user_id,))
        individual = {r[0] for r in cur.fetchall()}
        # Глобально открытые (is_open=TRUE или open_at уже прошло)
        cur.execute('''
            SELECT chapter_id FROM game_chapters
            WHERE is_open = TRUE OR (open_at IS NOT NULL AND open_at <= NOW())
        ''')
        global_open = {r[0] for r in cur.fetchall()}
        return individual | global_open
    except Exception as e:
        logger.error(f"get_player_accessible_chapters error {user_id}: {e}")
        return set()
    finally:
        release_connection(conn)


def grant_chapter_to_player(user_id: int, chapter_id: int, granted_by: int = None) -> bool:
    """Открывает конкретную главу конкретному игроку."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO player_chapter_access (user_id, chapter_id, granted_by)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, chapter_id) DO NOTHING
        ''', (user_id, chapter_id, granted_by))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"grant_chapter_to_player error {user_id} ch{chapter_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def revoke_chapter_from_player(user_id: int, chapter_id: int) -> bool:
    """Закрывает конкретную главу для конкретного игрока."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'DELETE FROM player_chapter_access WHERE user_id = %s AND chapter_id = %s',
            (user_id, chapter_id)
        )
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"revoke_chapter_from_player error: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def grant_all_chapters_to_player(user_id: int, granted_by: int = None) -> bool:
    """Открывает все 6 глав конкретному игроку."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        for ch_id in range(1, 7):
            cur.execute('''
                INSERT INTO player_chapter_access (user_id, chapter_id, granted_by)
                VALUES (%s, %s, %s)
                ON CONFLICT (user_id, chapter_id) DO NOTHING
            ''', (user_id, ch_id, granted_by))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"grant_all_chapters_to_player error {user_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def revoke_all_chapters_from_player(user_id: int) -> bool:
    """Закрывает все главы для игрока (используется при сбросе прогресса)."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM player_chapter_access WHERE user_id = %s', (user_id,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"revoke_all_chapters_from_player error {user_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def get_player_chapter_access_map(user_id: int) -> set:
    """Возвращает set chapter_id открытых индивидуально для игрока."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT chapter_id FROM player_chapter_access WHERE user_id = %s', (user_id,))
        return {r[0] for r in cur.fetchall()}
    except Exception as e:
        logger.error(f"get_player_chapter_access_map error {user_id}: {e}")
        return set()
    finally:
        release_connection(conn)


def reset_game_result_full(user_id: int) -> bool:
    """Полный сброс игрока: обнуляет прогресс, достижения И закрывает все индивидуальные главы."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE game_results
            SET chapter=0, score=0, total_score=0, completed=0,
                game_over=FALSE, failed=FALSE, restart_mode=NULL,
                achievement_count=0, achievement_pts=0,
                updated_at=NOW()
            WHERE user_id=%s
        """, (user_id,))
        cur.execute('DELETE FROM player_chapter_access WHERE user_id = %s', (user_id,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"reset_game_result_full error {user_id}: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def get_all_game_players_with_roles(limit: int = 100) -> list:
    """Все игроки с ролями: [(user_id, user_name, role, total_score, completed), ...]"""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT gr.user_id, gr.user_name,
                   COALESCE(rol.role, 'player') AS role,
                   gr.total_score, gr.completed
            FROM game_results gr
            LEFT JOIN game_roles rol ON gr.user_id = rol.user_id
            WHERE NOT COALESCE(gr.banned, FALSE)
            ORDER BY gr.updated_at DESC
            LIMIT %s
        ''', (limit,))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_all_game_players_with_roles error: {e}")
        return []
    finally:
        release_connection(conn)


def get_players_only(limit: int = 200) -> list:
    """Только обычные игроки (role='player') для выдачи доступа к главам.
    Включает всех пользователей бота с ролью player.
    [(user_id, first_name, username, total_score, completed), ...]
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT u.user_id,
                   COALESCE(u.first_name, '') AS first_name,
                   COALESCE(u.username, '') AS username,
                   COALESCE(gr.total_score, 0) AS total_score,
                   COALESCE(gr.completed, 0) AS completed
            FROM users u
            LEFT JOIN game_roles gro ON gro.user_id = u.user_id
            LEFT JOIN game_results gr ON gr.user_id = u.user_id
            WHERE COALESCE(gro.role, 'player') = 'player'
            ORDER BY u.last_active DESC
            LIMIT %s
        ''', (limit,))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_players_only error: {e}")
        return []
    finally:
        release_connection(conn)


def get_chapter_schedule_for_game() -> list:
    """Возвращает расписание глав для передачи в игру (таймеры).
    [(chapter_id, is_open, open_at_iso_string_or_null), ...]
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT chapter_id,
                   (is_open OR (open_at IS NOT NULL AND open_at <= NOW())) AS is_effectively_open,
                   open_at
            FROM game_chapters
            ORDER BY chapter_id
        ''')
        rows = cur.fetchall()
        result = []
        for ch_id, is_open, open_at in rows:
            oa = None
            if open_at and not is_open:
                # Передаём как ISO строку в UTC
                oa = open_at.astimezone(pytz.utc).isoformat()
            result.append({
                'id': ch_id,
                'open': bool(is_open),
                'open_at': oa,
            })
        return result
    except Exception as e:
        logger.error(f"get_chapter_schedule_for_game error: {e}")
        return []
    finally:
        release_connection(conn)
