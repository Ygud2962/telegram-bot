import psycopg2
from psycopg2 import pool
import os
import time
import json
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

_SECRET_MODES = {
    'none':    {'title': 'Обычный режим', 'bonus_pct': 0},
    'silent':  {'title': 'Тихий шифр', 'bonus_pct': 20},
    'speed':   {'title': 'Скоростной радист', 'bonus_pct': 12},
    'iron':    {'title': 'Железная воля', 'bonus_pct': 16},
    'recruit': {'title': 'Вербовщик', 'bonus_pct': 10},
    'night':   {'title': 'Ночной дозор', 'bonus_pct': 14},
}

_SECRET_MISSIONS = [
    {
        'id': 'sm_silent_no_hint',
        'order': 1,
        'tier': 'starter',
        'mode': 'silent',
        'icon': '🤫',
        'name': 'Тихий шифр',
        'desc': 'Пройти 1 задание без подсказки.',
        'target': 1,
        'bonus_pct': 20,
        'min_bonus': 35,
    },
    {
        'id': 'sm_speed_three',
        'order': 2,
        'tier': 'starter',
        'mode': 'speed',
        'icon': '📡',
        'name': 'Скоростной радист',
        'desc': '3 быстрых правильных ответа подряд (<= 14 сек).',
        'target': 3,
        'bonus_pct': 12,
        'min_bonus': 28,
    },
    {
        'id': 'sm_iron_one_life',
        'order': 3,
        'tier': 'starter',
        'mode': 'iron',
        'icon': '❤️‍🔥',
        'name': 'Железная воля',
        'desc': 'Решить задание, когда осталась 1 жизнь.',
        'target': 1,
        'bonus_pct': 16,
        'min_bonus': 34,
    },
    {
        'id': 'sm_recruit_one',
        'order': 4,
        'tier': 'starter',
        'mode': 'recruit',
        'icon': '🕵️',
        'name': 'Вербовщик',
        'desc': 'Пригласить 1 агента.',
        'target': 1,
        'bonus_pct': 10,
        'min_bonus': 25,
    },
    {
        'id': 'sm_night_watch',
        'order': 5,
        'tier': 'starter',
        'mode': 'night',
        'icon': '🌙',
        'name': 'Ночной дозор',
        'desc': 'Дать правильный ответ в редкое время (23:00-05:59).',
        'target': 1,
        'bonus_pct': 14,
        'min_bonus': 30,
    },
    {
        'id': 'sm_flawless_chapter',
        'order': 6,
        'tier': 'advanced',
        'mode': None,
        'icon': '🎯',
        'name': 'Операция без следов',
        'desc': 'Завершить главу без ошибок и без подсказок.',
        'target': 1,
        'bonus_pct': 18,
        'min_bonus': 48,
    },
    {
        'id': 'sm_morse_five_fast',
        'order': 7,
        'tier': 'advanced',
        'mode': None,
        'icon': '📻',
        'name': 'Радиоэфир',
        'desc': 'Решить 5 заданий Морзе быстрее 14 секунд.',
        'target': 5,
        'bonus_pct': 17,
        'min_bonus': 45,
    },
    {
        'id': 'sm_week_discipline',
        'order': 8,
        'tier': 'advanced',
        'mode': None,
        'icon': '📅',
        'name': 'Дисциплина штаба',
        'desc': 'Играть в 4 разные даты.',
        'target': 4,
        'bonus_pct': 13,
        'min_bonus': 40,
    },
    {
        'id': 'sm_network_three',
        'order': 9,
        'tier': 'advanced',
        'mode': None,
        'icon': '🧩',
        'name': 'Сеть информаторов',
        'desc': 'Иметь 3 активных агента.',
        'target': 3,
        'bonus_pct': 15,
        'min_bonus': 42,
    },
    {
        'id': 'sm_last_life_chapter',
        'order': 10,
        'tier': 'advanced',
        'mode': None,
        'icon': '⚔️',
        'name': 'Последний рубеж',
        'desc': 'Завершить главу с 1 жизнью.',
        'target': 1,
        'bonus_pct': 22,
        'min_bonus': 55,
    },
]
_SECRET_MISSIONS_BY_ID = {m['id']: m for m in _SECRET_MISSIONS}


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


def _secret_to_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _secret_to_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in {'1', 'true', 'yes', 'on'}
    return False


def _secret_now_minsk() -> datetime:
    try:
        tz = pytz.timezone('Europe/Minsk')
        return datetime.now(tz)
    except Exception:
        return datetime.utcnow()


def _sanitize_secret_mode(mode_value) -> str:
    mode = str(mode_value or 'none').strip().lower()
    if mode not in _SECRET_MODES:
        return 'none'
    return mode


def _secret_empty_missions_state() -> dict:
    missions = {}
    for mission in _SECRET_MISSIONS:
        missions[mission['id']] = {
            'progress': 0,
            'completed': False,
            'completed_at': None,
            'reward_points': 0,
        }
    return missions


def _secret_default_runtime() -> dict:
    return {
        'last_answer_token': 0,
        'last_break_token': 0,
        'speed_streak': 0,
        'morse_fast_count': 0,
        'active_days': [],
    }


def _secret_json_load(value, fallback):
    if value is None:
        return fallback
    if isinstance(value, dict):
        return value
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return fallback
        try:
            parsed = json.loads(value)
            return parsed if parsed is not None else fallback
        except Exception:
            return fallback
    return fallback


def _secret_normalize_missions(raw) -> dict:
    src = _secret_json_load(raw, {})
    if not isinstance(src, dict):
        src = {}
    normalized = _secret_empty_missions_state()
    for mission in _SECRET_MISSIONS:
        mission_id = mission['id']
        target = max(1, _secret_to_int(mission.get('target'), 1))
        row = src.get(mission_id, {})
        if not isinstance(row, dict):
            row = {}
        progress = _secret_to_int(row.get('progress', 0), 0)
        progress = max(0, min(target, progress))
        completed = _secret_to_bool(row.get('completed', False))
        reward_points = max(0, _secret_to_int(row.get('reward_points', 0), 0))
        completed_at = row.get('completed_at')
        if completed:
            progress = target
        normalized[mission_id] = {
            'progress': progress,
            'completed': completed,
            'completed_at': completed_at,
            'reward_points': reward_points,
        }
    return normalized


def _secret_normalize_runtime(raw) -> dict:
    src = _secret_json_load(raw, {})
    if not isinstance(src, dict):
        src = {}
    data = _secret_default_runtime()
    data['last_answer_token'] = max(0, _secret_to_int(src.get('last_answer_token', 0), 0))
    data['last_break_token'] = max(0, _secret_to_int(src.get('last_break_token', 0), 0))
    data['speed_streak'] = max(0, _secret_to_int(src.get('speed_streak', 0), 0))
    data['morse_fast_count'] = max(0, _secret_to_int(src.get('morse_fast_count', 0), 0))
    active_days = src.get('active_days', [])
    if isinstance(active_days, list):
        clean_days = []
        for day in active_days:
            d = str(day or '').strip()
            if not d or d in clean_days:
                continue
            clean_days.append(d)
        data['active_days'] = clean_days[-14:]
    return data


def _secret_bonus_points(mission: dict, chapter_score: int) -> int:
    score = max(0, _secret_to_int(chapter_score, 0))
    pct = max(0, _secret_to_int(mission.get('bonus_pct', 0), 0))
    min_bonus = max(0, _secret_to_int(mission.get('min_bonus', 0), 0))
    pct_points = int(round(score * (pct / 100.0))) if pct > 0 else 0
    return max(min_bonus, pct_points)


def _secret_summary_from_missions(missions_map: dict) -> dict:
    completed = 0
    bonus_points = 0
    for mission in _SECRET_MISSIONS:
        row = missions_map.get(mission['id'], {})
        if not isinstance(row, dict):
            continue
        if _secret_to_bool(row.get('completed', False)):
            completed += 1
            bonus_points += max(0, _secret_to_int(row.get('reward_points', 0), 0))
    return {
        'completed': completed,
        'total': len(_SECRET_MISSIONS),
        'bonus_points': bonus_points,
    }


def _secret_export(mode: str, missions_map: dict) -> dict:
    summary = _secret_summary_from_missions(missions_map)
    missions = []
    for mission in sorted(_SECRET_MISSIONS, key=lambda m: m['order']):
        mission_id = mission['id']
        row = missions_map.get(mission_id, {})
        if not isinstance(row, dict):
            row = {}
        progress = max(0, _secret_to_int(row.get('progress', 0), 0))
        target = max(1, _secret_to_int(mission.get('target', 1), 1))
        if progress > target:
            progress = target
        completed = _secret_to_bool(row.get('completed', False))
        if completed:
            progress = target
        missions.append({
            'id': mission_id,
            'order': mission['order'],
            'tier': mission['tier'],
            'mode': mission['mode'],
            'icon': mission['icon'],
            'name': mission['name'],
            'desc': mission['desc'],
            'target': target,
            'progress': progress,
            'completed': completed,
            'completed_at': row.get('completed_at'),
            'bonus_pct': max(0, _secret_to_int(mission.get('bonus_pct', 0), 0)),
            'reward_points': max(0, _secret_to_int(row.get('reward_points', 0), 0)),
        })
    return {
        'mode': _sanitize_secret_mode(mode),
        'summary': summary,
        'missions': missions,
    }


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
        cur.execute("ALTER TABLE news ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'bot'")
        cur.execute("UPDATE news SET category='bot' WHERE category IS NULL OR category = ''")
        cur.execute("UPDATE news SET category='school' WHERE LOWER(category)='school'")
        cur.execute("UPDATE news SET category='bot' WHERE LOWER(category)<>'school'")
        cur.execute("ALTER TABLE news ALTER COLUMN category SET DEFAULT 'bot'")
        cur.execute("ALTER TABLE news ALTER COLUMN category SET NOT NULL")

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
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS reset_token BIGINT DEFAULT 0')
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS failed BOOLEAN DEFAULT FALSE')
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS retreat_count INTEGER DEFAULT 0')
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS pending_retreat_penalty INTEGER DEFAULT 0')
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS pending_retreat_chapter INTEGER DEFAULT 0')
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS sync_chapter INTEGER DEFAULT 0')
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS sync_max_chapter_score INTEGER DEFAULT 0')
        cur.execute('ALTER TABLE game_results ADD COLUMN IF NOT EXISTS sync_max_cipher_idx INTEGER DEFAULT -1')
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
        cur.execute('''
            CREATE TABLE IF NOT EXISTS game_referrals (
                referred_id          BIGINT PRIMARY KEY,
                referrer_id          BIGINT NOT NULL,
                start_bonus_awarded  BOOLEAN DEFAULT FALSE,
                rewarded_chapters    INTEGER DEFAULT 0,
                total_referrer_bonus INTEGER DEFAULT 0,
                created_at           TIMESTAMPTZ DEFAULT NOW(),
                updated_at           TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        cur.execute('CREATE INDEX IF NOT EXISTS idx_game_referrals_referrer ON game_referrals(referrer_id)')
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
            CREATE TABLE IF NOT EXISTS game_secret_state (
                user_id BIGINT PRIMARY KEY,
                selected_mode TEXT NOT NULL DEFAULT 'none',
                missions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                runtime_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                completed_count INTEGER DEFAULT 0,
                bonus_points INTEGER DEFAULT 0,
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        cur.execute("ALTER TABLE game_secret_state ADD COLUMN IF NOT EXISTS selected_mode TEXT NOT NULL DEFAULT 'none'")
        cur.execute("ALTER TABLE game_secret_state ADD COLUMN IF NOT EXISTS missions_json JSONB NOT NULL DEFAULT '{}'::jsonb")
        cur.execute("ALTER TABLE game_secret_state ADD COLUMN IF NOT EXISTS runtime_json JSONB NOT NULL DEFAULT '{}'::jsonb")
        cur.execute("ALTER TABLE game_secret_state ADD COLUMN IF NOT EXISTS completed_count INTEGER DEFAULT 0")
        cur.execute("ALTER TABLE game_secret_state ADD COLUMN IF NOT EXISTS bonus_points INTEGER DEFAULT 0")
        cur.execute("ALTER TABLE game_secret_state ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()")

        cur.execute('''
            INSERT INTO game_chapters (chapter_id, is_open)
            VALUES (1,TRUE),(2,FALSE),(3,FALSE),(4,FALSE),(5,FALSE),(6,FALSE)
            ON CONFLICT (chapter_id) DO NOTHING
        ''')

        # Миграция: если глава 1 ещё закрыта — открываем её (фикс для существующих деплоев)
        cur.execute('''
            UPDATE game_chapters SET is_open = TRUE
            WHERE chapter_id = 1 AND is_open = FALSE AND open_at IS NULL
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
            'CREATE INDEX IF NOT EXISTS idx_news_category_pub ON news(category, published_at)',
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
_NEWS_SCOPES = {'school', 'bot'}


def normalize_news_scope(scope, default='bot'):
    scope_str = str(scope or default).strip().lower()
    return scope_str if scope_str in _NEWS_SCOPES else default


def add_news(title, content, scope='bot'):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        news_scope = normalize_news_scope(scope)
        cur.execute(
            'INSERT INTO news (title, content, category) VALUES (%s,%s,%s) RETURNING id',
            (title, content, news_scope)
        )
        news_id = cur.fetchone()[0]
        conn.commit()
        return news_id
    except Exception as e:
        logger.error(f"add_news: {e}")
        raise
    finally:
        release_connection(conn)


def get_news(offset=0, limit=8, order='DESC', scope=None):
    """Универсальная функция получения новостей. Заменяет get_news_page_asc,
    get_latest_news, get_archive_news_page, get_recent_news."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        scope_norm = normalize_news_scope(scope) if scope is not None else None
        order_sql = 'ASC' if order == 'ASC' else 'DESC'
        if scope_norm is not None:
            cur.execute('''
                SELECT id, title, content, published_at, views_count
                FROM news
                WHERE category=%s
                ORDER BY published_at ''' + order_sql + '''
                OFFSET %s LIMIT %s
            ''', (scope_norm, offset, limit))
        else:
            cur.execute('''
                SELECT id, title, content, published_at, views_count
                FROM news ORDER BY published_at ''' + order_sql + '''
                OFFSET %s LIMIT %s
            ''', (offset, limit))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_news: {e}")
        return []
    finally:
        release_connection(conn)


# Алиасы для обратной совместимости
def get_archive_news_page(offset=0, limit=8, scope=None):
    return get_news(offset=offset, limit=limit, order='DESC', scope=scope)

def get_latest_news(limit=3, scope=None):
    return get_news(offset=0, limit=limit, order='DESC', scope=scope)

def get_recent_news(limit=15, scope=None):
    return get_news(offset=0, limit=limit, order='DESC', scope=scope)

def get_news_page_asc(offset=0, limit=5, scope=None):
    return get_news(offset=offset, limit=limit, order='ASC', scope=scope)



def get_total_news_count(scope=None):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        scope_norm = normalize_news_scope(scope) if scope is not None else None
        if scope_norm is None:
            cur.execute('SELECT COUNT(*) FROM news')
        else:
            cur.execute('SELECT COUNT(*) FROM news WHERE category=%s', (scope_norm,))
        return cur.fetchone()[0] or 0
    except Exception as e:
        logger.error(f"get_total_news_count: {e}")
        return 0
    finally:
        release_connection(conn)


def get_news_detail(news_id, scope=None):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        scope_norm = normalize_news_scope(scope) if scope is not None else None
        if scope_norm is None:
            cur.execute(
                'SELECT id, title, content, published_at, views_count, category FROM news WHERE id=%s',
                (news_id,)
            )
        else:
            cur.execute(
                'SELECT id, title, content, published_at, views_count, category FROM news WHERE id=%s AND category=%s',
                (news_id, scope_norm)
            )
        row = cur.fetchone()
        if not row:
            return None
        return {'id': row[0], 'title': row[1], 'content': row[2],
                'published_at': row[3], 'views_count': row[4], 'category': row[5]}
    except Exception as e:
        logger.error(f"get_news_detail: {e}")
        return None
    finally:
        release_connection(conn)


def get_news_by_id(news_id):
    """Возвращает кортеж (id, title, content, published_at, category) или None."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT id, title, content, published_at, category FROM news WHERE id=%s', (news_id,))
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


def update_news(news_id, title, content, scope=None):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        if scope is None:
            cur.execute('UPDATE news SET title=%s, content=%s WHERE id=%s', (title, content, news_id))
        else:
            scope_norm = normalize_news_scope(scope)
            cur.execute(
                'UPDATE news SET title=%s, content=%s, category=%s WHERE id=%s',
                (title, content, scope_norm, news_id)
            )
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


def update_news_scope(news_id, scope):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        scope_norm = normalize_news_scope(scope)
        cur.execute('UPDATE news SET category=%s WHERE id=%s', (scope_norm, news_id))
        conn.commit()
        return cur.rowcount > 0
    except Exception as e:
        logger.error(f"update_news_scope: {e}")
        if conn:
            _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def count_new_news_since(user_id, scope=None):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT last_news_check FROM users WHERE user_id=%s', (user_id,))
        row = cur.fetchone()
        last_check = row[0] if row and row[0] else datetime(2000, 1, 1, tzinfo=pytz.utc)
        scope_norm = normalize_news_scope(scope) if scope is not None else None
        if scope_norm is None:
            cur.execute('SELECT COUNT(*) FROM news WHERE published_at > %s', (last_check,))
        else:
            cur.execute(
                'SELECT COUNT(*) FROM news WHERE published_at > %s AND category=%s',
                (last_check, scope_norm)
            )
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

REFERRAL_START_BONUS = 50
REFERRAL_CHAPTER_BONUS = 30

def save_game_result(user_id, user_name, chapter, score, total_score,
                     completed, game_over=False, failed=False):
    """Save/update player game result with monotonic score/completed/chapter fields.
    Full resets must be done via dedicated reset_* methods.
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO game_results
                (user_id, user_name, chapter, score, total_score, completed, game_over, failed, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                user_name   = COALESCE(EXCLUDED.user_name, game_results.user_name),
                chapter     = GREATEST(COALESCE(game_results.chapter, 0), COALESCE(EXCLUDED.chapter, 0)),
                score       = CASE
                                WHEN COALESCE(EXCLUDED.total_score, 0) >= COALESCE(game_results.total_score, 0)
                                  OR COALESCE(EXCLUDED.completed, 0) >= COALESCE(game_results.completed, 0)
                                THEN EXCLUDED.score
                                ELSE game_results.score
                              END,
                total_score = GREATEST(COALESCE(game_results.total_score, 0), COALESCE(EXCLUDED.total_score, 0)),
                completed   = GREATEST(COALESCE(game_results.completed, 0), COALESCE(EXCLUDED.completed, 0)),
                game_over   = COALESCE(game_results.game_over, FALSE) OR COALESCE(EXCLUDED.game_over, FALSE),
                failed      = COALESCE(EXCLUDED.failed, FALSE),
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



def attach_game_referral(referrer_id: int, referred_id: int, referred_name: str | None = None) -> dict:
    """Attach referrer to a new player and grant one-time start bonus."""
    conn = None
    try:
        referrer_id = int(referrer_id or 0)
        referred_id = int(referred_id or 0)
        if referrer_id <= 0 or referred_id <= 0:
            return {'ok': False, 'status': 'invalid_ids'}
        if referrer_id == referred_id:
            return {'ok': False, 'status': 'self_referral'}

        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "INSERT INTO users (user_id, last_active) VALUES (%s, NOW()) "
            "ON CONFLICT (user_id) DO UPDATE SET last_active = NOW()",
            (referrer_id,),
        )
        cur.execute(
            "INSERT INTO users (user_id, first_name, last_active) VALUES (%s, %s, NOW()) "
            "ON CONFLICT (user_id) DO UPDATE SET first_name = COALESCE(EXCLUDED.first_name, users.first_name), last_active = NOW()",
            (referred_id, referred_name),
        )

        # Referral link is immutable per invited user.
        cur.execute(
            '''
            SELECT referrer_id
            FROM game_referrals
            WHERE referred_id = %s
            FOR UPDATE
            ''',
            (referred_id,),
        )
        row = cur.fetchone()
        if row:
            existing_referrer = int(row[0] or 0)
            conn.commit()
            if existing_referrer == referrer_id:
                return {'ok': True, 'status': 'already_linked_same'}
            return {'ok': False, 'status': 'already_linked_other', 'referrer_id': existing_referrer}

        # Link only before first actual game progress.
        cur.execute(
            '''
            INSERT INTO game_results (user_id, user_name, chapter, score, total_score, completed, game_over, failed, updated_at)
            VALUES (%s, %s, 0, 0, 0, 0, FALSE, FALSE, NOW())
            ON CONFLICT (user_id) DO NOTHING
            ''',
            (referred_id, referred_name or 'Игрок'),
        )
        cur.execute(
            '''
            SELECT COALESCE(total_score, 0), COALESCE(completed, 0), COALESCE(chapter, 0)
            FROM game_results
            WHERE user_id = %s
            FOR UPDATE
            ''',
            (referred_id,),
        )
        progress = cur.fetchone()
        cur_total = int(progress[0] or 0) if progress else 0
        cur_completed = int(progress[1] or 0) if progress else 0
        cur_chapter = int(progress[2] or 0) if progress else 0
        if cur_total > 0 or cur_completed > 0 or cur_chapter > 0:
            conn.commit()
            return {'ok': False, 'status': 'already_has_progress'}

        # Only regular players can participate.
        cur.execute("SELECT role FROM game_roles WHERE user_id = %s", (referred_id,))
        role_row = cur.fetchone()
        referred_role = (role_row[0] if role_row and role_row[0] else 'player')
        if referred_role in ('admin', 'tester'):
            conn.commit()
            return {'ok': False, 'status': 'role_not_allowed'}

        cur.execute(
            '''
            INSERT INTO game_referrals
                (referred_id, referrer_id, start_bonus_awarded, rewarded_chapters, total_referrer_bonus, created_at, updated_at)
            VALUES (%s, %s, TRUE, 0, 0, NOW(), NOW())
            ''',
            (referred_id, referrer_id),
        )
        cur.execute(
            '''
            UPDATE game_results
            SET total_score = COALESCE(total_score, 0) + %s,
                updated_at = NOW()
            WHERE user_id = %s
            ''',
            (REFERRAL_START_BONUS, referred_id),
        )

        conn.commit()
        return {
            'ok': True,
            'status': 'attached',
            'start_bonus': REFERRAL_START_BONUS,
            'referrer_id': referrer_id,
            'referred_id': referred_id,
        }
    except Exception as e:
        logger.error(f"attach_game_referral error ref={referrer_id} referred={referred_id}: {e}")
        _safe_rollback(conn)
        return {'ok': False, 'status': 'error'}
    finally:
        release_connection(conn)


def apply_referral_bonus_for_completed(referred_id: int, completed_after: int) -> dict:
    """Grant referrer bonus for newly completed chapters by referred player."""
    conn = None
    try:
        referred_id = int(referred_id or 0)
        completed_after = max(0, min(6, int(completed_after or 0)))
        if referred_id <= 0:
            return {'ok': False, 'status': 'invalid_user'}

        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            '''
            SELECT referrer_id,
                   COALESCE(rewarded_chapters, 0),
                   COALESCE(total_referrer_bonus, 0)
            FROM game_referrals
            WHERE referred_id = %s
            FOR UPDATE
            ''',
            (referred_id,),
        )
        row = cur.fetchone()
        if not row:
            conn.commit()
            return {'ok': True, 'status': 'no_referral', 'awarded_points': 0}

        referrer_id = int(row[0] or 0)
        rewarded_chapters = max(0, int(row[1] or 0))
        total_bonus_before = max(0, int(row[2] or 0))

        cur.execute("SELECT role FROM game_roles WHERE user_id = %s", (referred_id,))
        role_row = cur.fetchone()
        referred_role = (role_row[0] if role_row and role_row[0] else 'player')
        if referred_role in ('admin', 'tester'):
            conn.commit()
            return {'ok': True, 'status': 'role_not_allowed', 'awarded_points': 0}

        new_chapters = max(0, completed_after - rewarded_chapters)
        if new_chapters <= 0:
            conn.commit()
            return {'ok': True, 'status': 'nothing_to_award', 'awarded_points': 0}

        bonus_points = new_chapters * REFERRAL_CHAPTER_BONUS

        cur.execute(
            '''
            INSERT INTO game_results (user_id, user_name, chapter, score, total_score, completed, game_over, failed, updated_at)
            VALUES (%s, %s, 0, 0, 0, 0, FALSE, FALSE, NOW())
            ON CONFLICT (user_id) DO NOTHING
            ''',
            (referrer_id, 'Игрок'),
        )
        cur.execute(
            '''
            UPDATE game_results
            SET total_score = COALESCE(total_score, 0) + %s,
                updated_at = NOW()
            WHERE user_id = %s
            ''',
            (bonus_points, referrer_id),
        )
        cur.execute(
            '''
            UPDATE game_referrals
            SET rewarded_chapters = %s,
                total_referrer_bonus = %s,
                updated_at = NOW()
            WHERE referred_id = %s
            ''',
            (completed_after, total_bonus_before + bonus_points, referred_id),
        )

        conn.commit()
        return {
            'ok': True,
            'status': 'awarded',
            'referrer_id': referrer_id,
            'awarded_points': int(bonus_points),
            'awarded_chapters': int(new_chapters),
        }
    except Exception as e:
        logger.error(f"apply_referral_bonus_for_completed error referred={referred_id}: {e}")
        _safe_rollback(conn)
        return {'ok': False, 'status': 'error', 'awarded_points': 0}
    finally:
        release_connection(conn)


def get_referral_summary(referrer_id: int) -> dict:
    """Aggregate referral stats for inviter."""
    conn = None
    try:
        referrer_id = int(referrer_id or 0)
        if referrer_id <= 0:
            return {'invited_count': 0, 'active_count': 0, 'rewarded_chapters': 0, 'bonus_points': 0}
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            '''
            SELECT
                COUNT(*) AS invited_count,
                COALESCE(SUM(CASE WHEN COALESCE(rewarded_chapters, 0) > 0 THEN 1 ELSE 0 END), 0) AS active_count,
                COALESCE(SUM(COALESCE(rewarded_chapters, 0)), 0) AS rewarded_chapters,
                COALESCE(SUM(COALESCE(total_referrer_bonus, 0)), 0) AS bonus_points
            FROM game_referrals
            WHERE referrer_id = %s
            ''',
            (referrer_id,),
        )
        row = cur.fetchone() or (0, 0, 0, 0)
        return {
            'invited_count': int(row[0] or 0),
            'active_count': int(row[1] or 0),
            'rewarded_chapters': int(row[2] or 0),
            'bonus_points': int(row[3] or 0),
        }
    except Exception as e:
        logger.error(f"get_referral_summary error {referrer_id}: {e}")
        return {'invited_count': 0, 'active_count': 0, 'rewarded_chapters': 0, 'bonus_points': 0}
    finally:
        release_connection(conn)


def get_referral_agents(referrer_id: int, limit: int = 15) -> list:
    """Return referred players list for inviter."""
    conn = None
    try:
        referrer_id = int(referrer_id or 0)
        limit = max(1, min(50, int(limit or 15)))
        if referrer_id <= 0:
            return []
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            '''
            SELECT
                rf.referred_id,
                COALESCE(NULLIF(u.first_name, ''), NULLIF(gr.user_name, ''), 'Игрок') AS display_name,
                COALESCE(gr.completed, 0) AS completed,
                COALESCE(gr.total_score, 0) AS total_score,
                COALESCE(rf.rewarded_chapters, 0) AS rewarded_chapters,
                COALESCE(rf.total_referrer_bonus, 0) AS total_referrer_bonus,
                rf.created_at
            FROM game_referrals rf
            LEFT JOIN users u ON u.user_id = rf.referred_id
            LEFT JOIN game_results gr ON gr.user_id = rf.referred_id
            WHERE rf.referrer_id = %s
            ORDER BY rf.created_at DESC
            LIMIT %s
            ''',
            (referrer_id, limit),
        )
        rows = cur.fetchall() or []
        result = []
        for r in rows:
            result.append({
                'user_id': int(r[0]),
                'name': r[1] or 'Игрок',
                'completed': int(r[2] or 0),
                'total_score': int(r[3] or 0),
                'rewarded_chapters': int(r[4] or 0),
                'bonus_points': int(r[5] or 0),
                'created_at': r[6],
            })
        return result
    except Exception as e:
        logger.error(f"get_referral_agents error {referrer_id}: {e}")
        return []
    finally:
        release_connection(conn)

def get_secret_missions_state(user_id: int) -> dict:
    conn = None
    try:
        uid = _secret_to_int(user_id, 0)
        if uid <= 0:
            return {
                'ok': False,
                'mode': 'none',
                'summary': {'completed': 0, 'total': len(_SECRET_MISSIONS), 'bonus_points': 0},
                'missions': [],
            }
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            '''
            SELECT selected_mode, missions_json
            FROM game_secret_state
            WHERE user_id = %s
            ''',
            (uid,),
        )
        row = cur.fetchone()
        if not row:
            missions_map = _secret_empty_missions_state()
            exported = _secret_export('none', missions_map)
            return {
                'ok': True,
                'mode': exported['mode'],
                'summary': exported['summary'],
                'missions': exported['missions'],
            }
        mode = _sanitize_secret_mode(row[0])
        missions_map = _secret_normalize_missions(row[1])
        exported = _secret_export(mode, missions_map)
        return {
            'ok': True,
            'mode': exported['mode'],
            'summary': exported['summary'],
            'missions': exported['missions'],
        }
    except Exception as e:
        logger.error(f"get_secret_missions_state error {user_id}: {e}")
        return {
            'ok': False,
            'mode': 'none',
            'summary': {'completed': 0, 'total': len(_SECRET_MISSIONS), 'bonus_points': 0},
            'missions': [],
        }
    finally:
        release_connection(conn)


def apply_secret_missions_sync(user_id: int, payload: dict | None = None) -> dict:
    conn = None
    payload = payload or {}
    try:
        uid = _secret_to_int(user_id, 0)
        if uid <= 0:
            return {
                'ok': False,
                'mode': 'none',
                'summary': {'completed': 0, 'total': len(_SECRET_MISSIONS), 'bonus_points': 0},
                'missions': [],
                'awards': [],
                'awarded_points': 0,
            }

        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            '''
            SELECT selected_mode, missions_json, runtime_json
            FROM game_secret_state
            WHERE user_id = %s
            FOR UPDATE
            ''',
            (uid,),
        )
        row = cur.fetchone()
        if not row:
            mode = 'none'
            missions_map = _secret_empty_missions_state()
            runtime = _secret_default_runtime()
            cur.execute(
                '''
                INSERT INTO game_secret_state (
                    user_id, selected_mode, missions_json, runtime_json,
                    completed_count, bonus_points, updated_at
                )
                VALUES (%s, %s, %s::jsonb, %s::jsonb, %s, %s, NOW())
                ON CONFLICT (user_id) DO NOTHING
                ''',
                (
                    uid,
                    mode,
                    json.dumps(missions_map, ensure_ascii=False),
                    json.dumps(runtime, ensure_ascii=False),
                    0,
                    0,
                ),
            )
        else:
            mode = _sanitize_secret_mode(row[0])
            missions_map = _secret_normalize_missions(row[1])
            runtime = _secret_normalize_runtime(row[2])

        if 'secret_mode' in payload:
            mode = _sanitize_secret_mode(payload.get('secret_mode'))

        event_type = str(payload.get('event_type') or payload.get('type') or 'sync').strip().lower()
        chapter_score = max(0, _secret_to_int(payload.get('chapter_score', payload.get('score', 0)), 0))
        chapter_errors = max(0, _secret_to_int(payload.get('chapter_errors', 0), 0))
        chapter_hints = max(0, _secret_to_int(payload.get('chapter_hints', 0), 0))
        lives = max(-1, _secret_to_int(payload.get('lives', 0), 0))

        answer_token = max(0, _secret_to_int(payload.get('mission_answer_token', payload.get('answer_token', 0)), 0))
        break_token = max(0, _secret_to_int(payload.get('mission_break_token', payload.get('break_token', 0)), 0))
        answer_elapsed = max(0, min(9999, _secret_to_int(payload.get('mission_last_answer_elapsed', payload.get('answer_elapsed', 0)), 0)))
        answer_no_hint = _secret_to_bool(payload.get('mission_last_answer_no_hint', payload.get('answer_no_hint', False)))
        answer_one_life = _secret_to_bool(payload.get('mission_last_answer_one_life', payload.get('answer_one_life', False)))
        answer_type = str(payload.get('mission_last_answer_type', payload.get('answer_type', '')) or '').strip().lower()
        answer_streak = max(0, min(200, _secret_to_int(payload.get('mission_last_answer_streak', payload.get('answer_streak', 0)), 0)))

        if break_token > runtime.get('last_break_token', 0):
            runtime['last_break_token'] = break_token
            runtime['speed_streak'] = 0

        answer_event = answer_token > runtime.get('last_answer_token', 0)
        now_dt = _secret_now_minsk()
        now_iso = now_dt.isoformat()
        now_hour = int(now_dt.hour)
        if answer_event:
            runtime['last_answer_token'] = answer_token
            if answer_elapsed > 0 and answer_elapsed <= 14:
                runtime['speed_streak'] = max(0, _secret_to_int(runtime.get('speed_streak', 0), 0)) + 1
            else:
                runtime['speed_streak'] = 0
            if answer_type == 'morse' and answer_elapsed > 0 and answer_elapsed <= 14:
                runtime['morse_fast_count'] = max(0, _secret_to_int(runtime.get('morse_fast_count', 0), 0)) + 1
            active_days = runtime.get('active_days', [])
            if not isinstance(active_days, list):
                active_days = []
            day_key = now_dt.strftime('%Y-%m-%d')
            if day_key not in active_days:
                active_days.append(day_key)
            runtime['active_days'] = active_days[-14:]

        cur.execute(
            '''
            SELECT
                COUNT(*)::INT AS invited_count,
                COUNT(*) FILTER (WHERE COALESCE(gr.completed, 0) > 0)::INT AS active_count,
                COALESCE(SUM(rf.rewarded_chapters), 0)::INT AS rewarded_chapters
            FROM game_referrals rf
            LEFT JOIN game_results gr ON gr.user_id = rf.referred_id
            WHERE rf.referrer_id = %s
            ''',
            (uid,),
        )
        ref_row = cur.fetchone() or (0, 0, 0)
        invited_count = max(0, _secret_to_int(ref_row[0], 0))
        active_count = max(0, _secret_to_int(ref_row[1], 0))
        rewarded_chapters = max(0, _secret_to_int(ref_row[2], 0))

        awards = []
        awarded_points = 0

        def _apply_progress(mission_id: str, candidate_progress: int, base_score: int):
            nonlocal awarded_points
            mission = _SECRET_MISSIONS_BY_ID.get(mission_id)
            if not mission:
                return
            target = max(1, _secret_to_int(mission.get('target', 1), 1))
            row_state = missions_map.get(mission_id, {})
            if not isinstance(row_state, dict):
                row_state = {'progress': 0, 'completed': False, 'completed_at': None, 'reward_points': 0}
            progress_now = max(0, _secret_to_int(row_state.get('progress', 0), 0))
            completed_now = _secret_to_bool(row_state.get('completed', False))
            if completed_now:
                row_state['progress'] = target
                missions_map[mission_id] = row_state
                return
            progress_now = max(progress_now, max(0, min(target, _secret_to_int(candidate_progress, 0))))
            row_state['progress'] = progress_now
            if progress_now >= target:
                bonus_points = _secret_bonus_points(mission, base_score)
                row_state['progress'] = target
                row_state['completed'] = True
                row_state['completed_at'] = now_iso
                row_state['reward_points'] = bonus_points
                awarded_points += bonus_points
                awards.append({
                    'id': mission_id,
                    'name': mission['name'],
                    'icon': mission['icon'],
                    'bonus_pct': max(0, _secret_to_int(mission.get('bonus_pct', 0), 0)),
                    'points': bonus_points,
                })
            missions_map[mission_id] = row_state

        if mode == 'silent' and answer_event and answer_no_hint:
            _apply_progress('sm_silent_no_hint', 1, chapter_score)

        if mode == 'speed' and answer_event:
            if answer_elapsed > 0 and answer_elapsed <= 14 and answer_streak >= 1:
                _apply_progress('sm_speed_three', runtime.get('speed_streak', 0), chapter_score)
            else:
                runtime['speed_streak'] = 0

        if mode == 'iron' and answer_event and answer_one_life:
            _apply_progress('sm_iron_one_life', 1, chapter_score)

        if mode == 'recruit':
            _apply_progress('sm_recruit_one', min(1, invited_count), chapter_score)

        if mode == 'night' and answer_event and (now_hour >= 23 or now_hour <= 5):
            _apply_progress('sm_night_watch', 1, chapter_score)

        if event_type == 'chapter_complete' and chapter_hints <= 0 and chapter_errors <= 0:
            _apply_progress('sm_flawless_chapter', 1, chapter_score)

        _apply_progress('sm_morse_five_fast', runtime.get('morse_fast_count', 0), chapter_score)
        _apply_progress('sm_week_discipline', len(runtime.get('active_days', [])), chapter_score)
        _apply_progress('sm_network_three', active_count, chapter_score)

        if event_type == 'chapter_complete' and lives == 1:
            _apply_progress('sm_last_life_chapter', 1, chapter_score)

        if awarded_points > 0:
            cur.execute(
                '''
                UPDATE game_results
                SET total_score = GREATEST(0, COALESCE(total_score, 0) + %s),
                    updated_at = NOW()
                WHERE user_id = %s
                ''',
                (awarded_points, uid),
            )

        exported = _secret_export(mode, missions_map)
        summary = exported['summary']
        cur.execute(
            '''
            INSERT INTO game_secret_state (
                user_id, selected_mode, missions_json, runtime_json,
                completed_count, bonus_points, updated_at
            )
            VALUES (%s, %s, %s::jsonb, %s::jsonb, %s, %s, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                selected_mode = EXCLUDED.selected_mode,
                missions_json = EXCLUDED.missions_json,
                runtime_json = EXCLUDED.runtime_json,
                completed_count = EXCLUDED.completed_count,
                bonus_points = EXCLUDED.bonus_points,
                updated_at = NOW()
            ''',
            (
                uid,
                mode,
                json.dumps(missions_map, ensure_ascii=False),
                json.dumps(runtime, ensure_ascii=False),
                summary['completed'],
                summary['bonus_points'],
            ),
        )
        conn.commit()

        return {
            'ok': True,
            'mode': exported['mode'],
            'summary': exported['summary'],
            'missions': exported['missions'],
            'awards': awards,
            'awarded_points': awarded_points,
            'invited_count': invited_count,
            'active_count': active_count,
            'rewarded_chapters': rewarded_chapters,
        }
    except Exception as e:
        logger.error(f"apply_secret_missions_sync error {user_id}: {e}")
        _safe_rollback(conn)
        return {
            'ok': False,
            'mode': 'none',
            'summary': {'completed': 0, 'total': len(_SECRET_MISSIONS), 'bonus_points': 0},
            'missions': [],
            'awards': [],
            'awarded_points': 0,
        }
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


def _calc_retreat_penalty_points(score_value: int) -> int:
    base = max(0, int(score_value or 0))
    if base <= 0:
        return 0
    return max(1, int(round(base * 0.10)))


def save_game_sync_result(user_id, user_name, chapter, score, total_score,
                          completed, game_over=False, failed=False,
                          event_type='sync', chapter_idx=-1, cipher_idx=-1,
                          chapter_in_progress=False, restart_penalty_points=0):
    """Сохраняет sync из игры с серверной фиксацией штрафа "отхода/перегруппировки".

    Возвращает dict:
      {
        ok: bool,
        db_score: int,
        db_completed: int,
        server_penalty_applied: int,
        retreat_count: int
      }
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        chapter = max(0, int(chapter or 0))
        score = max(0, int(score or 0))
        total_score = max(0, int(total_score or 0))
        completed = max(0, int(completed or 0))
        game_over = bool(game_over)
        failed = bool(failed)
        chapter_idx = int(chapter_idx or 0)
        cipher_idx = int(cipher_idx if cipher_idx is not None else -1)
        chapter_in_progress = bool(chapter_in_progress)
        event_type = str(event_type or 'sync')
        restart_penalty_points = max(0, int(restart_penalty_points or 0))

        cur.execute('''
            SELECT user_id, user_name, chapter, score, total_score, completed, game_over, failed,
                   COALESCE(retreat_count, 0),
                   COALESCE(pending_retreat_penalty, 0),
                   COALESCE(pending_retreat_chapter, 0),
                   COALESCE(sync_chapter, 0),
                   COALESCE(sync_max_chapter_score, 0),
                   COALESCE(sync_max_cipher_idx, -1)
            FROM game_results
            WHERE user_id = %s
            FOR UPDATE
        ''', (user_id,))
        row = cur.fetchone()

        if not row:
            cur.execute('''
                INSERT INTO game_results
                    (user_id, user_name, chapter, score, total_score, completed, game_over, failed, updated_at)
                VALUES (%s, %s, 0, 0, 0, 0, FALSE, FALSE, NOW())
                ON CONFLICT (user_id) DO NOTHING
            ''', (user_id, user_name or 'Игрок'))
            cur.execute('''
                SELECT user_id, user_name, chapter, score, total_score, completed, game_over, failed,
                       COALESCE(retreat_count, 0),
                       COALESCE(pending_retreat_penalty, 0),
                       COALESCE(pending_retreat_chapter, 0),
                       COALESCE(sync_chapter, 0),
                       COALESCE(sync_max_chapter_score, 0),
                       COALESCE(sync_max_cipher_idx, -1)
                FROM game_results
                WHERE user_id = %s
                FOR UPDATE
            ''', (user_id,))
            row = cur.fetchone()

        (
            _uid, db_user_name, db_chapter, db_score, db_total, db_completed, db_game_over, _db_failed,
            retreat_count, pending_penalty, pending_chapter, sync_chapter, sync_max_score, sync_max_cipher
        ) = row

        retreat_count = int(retreat_count or 0)
        pending_penalty = max(0, int(pending_penalty or 0))
        pending_chapter = max(0, int(pending_chapter or 0))
        sync_chapter = max(0, int(sync_chapter or 0))
        sync_max_score = max(0, int(sync_max_score or 0))
        sync_max_cipher = int(sync_max_cipher if sync_max_cipher is not None else -1)

        # Явный старт повтора завершённой главы:
        # разрешаем понизить total_score/completed, чтобы обнуление главы
        # корректно отражалось в игре и в рейтинге.
        explicit_replay_start = event_type == 'chapter_replay_start'
        if explicit_replay_start:
            if restart_penalty_points > 0:
                pending_penalty = max(pending_penalty, restart_penalty_points)
                pending_chapter = chapter
            retreat_count += 1
            sync_chapter = chapter
            sync_max_score = 0
            sync_max_cipher = -1

            new_user_name = user_name or db_user_name or 'Игрок'
            new_chapter = max(int(db_chapter or 0), chapter)
            new_score = 0
            new_total_score = max(0, int(total_score or 0))
            new_completed = max(0, int(completed or 0))
            new_game_over = False

            cur.execute('''
                UPDATE game_results
                SET user_name = %s,
                    chapter = %s,
                    score = %s,
                    total_score = %s,
                    completed = %s,
                    game_over = %s,
                    failed = %s,
                    retreat_count = %s,
                    pending_retreat_penalty = %s,
                    pending_retreat_chapter = %s,
                    sync_chapter = %s,
                    sync_max_chapter_score = %s,
                    sync_max_cipher_idx = %s,
                    updated_at = NOW()
                WHERE user_id = %s
            ''', (
                new_user_name,
                new_chapter,
                new_score,
                new_total_score,
                new_completed,
                new_game_over,
                False,
                retreat_count,
                pending_penalty,
                pending_chapter,
                sync_chapter,
                sync_max_score,
                sync_max_cipher,
                user_id
            ))

            conn.commit()
            return {
                'ok': True,
                'db_score': int(new_total_score),
                'db_completed': int(new_completed),
                'server_penalty_applied': 0,
                'retreat_count': int(retreat_count),
            }

        # Явный ручной "отход" с клиента.
        explicit_manual_retreat = event_type == 'manual_restart'
        if explicit_manual_retreat:
            if restart_penalty_points <= 0:
                restart_penalty_points = _calc_retreat_penalty_points(score)
            pending_penalty = max(pending_penalty, restart_penalty_points)
            pending_chapter = chapter
            retreat_count += 1
            sync_chapter = chapter
            sync_max_score = max(0, score)
            sync_max_cipher = max(-1, cipher_idx)

        # Резервное авто-детектирование перезапуска (если клиентский event не пришёл).
        auto_retreat_detected = False
        if (
            not explicit_manual_retreat and
            chapter_in_progress and
            chapter > 0 and
            sync_chapter == chapter and
            pending_chapter != chapter
        ):
            score_drop = score + 5 < sync_max_score
            cipher_drop = (cipher_idx >= 0 and sync_max_cipher >= 0 and (cipher_idx + 1) < sync_max_cipher)
            if score_drop or cipher_drop:
                auto_retreat_detected = True
                penalty_base = max(sync_max_score, score)
                detected_penalty = _calc_retreat_penalty_points(penalty_base)
                pending_penalty = max(pending_penalty, detected_penalty)
                pending_chapter = chapter
                retreat_count += 1
                sync_max_score = max(0, score)
                sync_max_cipher = max(-1, cipher_idx)

        # Поддерживаем максимум прогресса внутри текущей главы.
        if chapter_in_progress and chapter > 0 and not explicit_manual_retreat and not auto_retreat_detected:
            if sync_chapter != chapter:
                sync_chapter = chapter
                sync_max_score = max(0, score)
                sync_max_cipher = max(-1, cipher_idx)
            else:
                sync_max_score = max(sync_max_score, max(0, score))
                if cipher_idx >= 0:
                    sync_max_cipher = max(sync_max_cipher, cipher_idx)

        # Серверное применение штрафа при завершении главы.
        server_penalty_applied = 0
        if event_type == 'chapter_complete' and pending_penalty > 0 and pending_chapter == chapter:
            client_penalty_applied = max(0, int(restart_penalty_points or 0))
            penalty_to_apply_server = max(0, pending_penalty - client_penalty_applied)
            server_penalty_applied = min(penalty_to_apply_server, score)
            score = max(0, score - server_penalty_applied)
            total_score = max(0, total_score - server_penalty_applied)
            pending_penalty = 0
            pending_chapter = 0
            sync_max_score = 0
            sync_max_cipher = -1
            sync_chapter = 0
        elif event_type == 'chapter_complete':
            # Глава завершена без ожидающего штрафа — закрываем runtime-трекер.
            sync_max_score = 0
            sync_max_cipher = -1
            sync_chapter = 0

        new_chapter = max(int(db_chapter or 0), chapter)
        if total_score >= int(db_total or 0) or completed >= int(db_completed or 0):
            new_score = score
        else:
            new_score = int(db_score or 0)
        new_total_score = max(int(db_total or 0), total_score)
        new_completed = max(int(db_completed or 0), completed)
        new_game_over = bool(db_game_over) or bool(game_over)
        new_user_name = user_name or db_user_name or 'Игрок'

        cur.execute('''
            UPDATE game_results
            SET user_name = %s,
                chapter = %s,
                score = %s,
                total_score = %s,
                completed = %s,
                game_over = %s,
                failed = %s,
                retreat_count = %s,
                pending_retreat_penalty = %s,
                pending_retreat_chapter = %s,
                sync_chapter = %s,
                sync_max_chapter_score = %s,
                sync_max_cipher_idx = %s,
                updated_at = NOW()
            WHERE user_id = %s
        ''', (
            new_user_name,
            new_chapter,
            new_score,
            new_total_score,
            new_completed,
            new_game_over,
            failed,
            retreat_count,
            pending_penalty,
            pending_chapter,
            sync_chapter,
            sync_max_score,
            sync_max_cipher,
            user_id
        ))

        conn.commit()
        return {
            'ok': True,
            'db_score': int(new_total_score),
            'db_completed': int(new_completed),
            'server_penalty_applied': int(server_penalty_applied),
            'retreat_count': int(retreat_count),
        }
    except Exception as e:
        logger.error(f"save_game_sync_result error {user_id}: {e}")
        _safe_rollback(conn)
        return {
            'ok': False,
            'db_score': 0,
            'db_completed': 0,
            'server_penalty_applied': 0,
            'retreat_count': 0,
        }
    finally:
        release_connection(conn)


def get_game_player_rank(user_id):
    """Возвращает позицию игрока в публичном рейтинге (role=player), либо (None, total_players)."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            WITH ranked AS (
                SELECT
                    gr.user_id,
                    ROW_NUMBER() OVER (ORDER BY gr.total_score DESC, gr.updated_at ASC) AS pos,
                    COUNT(*) OVER () AS total_players
                FROM game_results gr
                LEFT JOIN game_roles rol ON gr.user_id = rol.user_id
                WHERE NOT COALESCE(gr.banned, FALSE)
                  AND COALESCE(rol.role, 'player') = 'player'
                  AND gr.total_score > 0
            )
            SELECT pos, total_players
            FROM ranked
            WHERE user_id = %s
        ''', (user_id,))
        row = cur.fetchone()
        if row:
            return int(row[0]), int(row[1])

        cur.execute('''
            SELECT COUNT(*)
            FROM game_results gr
            LEFT JOIN game_roles rol ON gr.user_id = rol.user_id
            WHERE NOT COALESCE(gr.banned, FALSE)
              AND COALESCE(rol.role, 'player') = 'player'
              AND gr.total_score > 0
        ''')
        total = cur.fetchone()[0] or 0
        return None, int(total)
    except Exception as e:
        logger.error(f"get_game_player_rank error {user_id}: {e}")
        return None, 0
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
                   COALESCE(banned, FALSE) as banned,
                   COALESCE(achievement_count, 0) as achievement_count,
                   COALESCE(achievement_pts, 0) as achievement_pts,
                   COALESCE(chapter, 0) as chapter,
                   COALESCE(score, 0) as score,
                   COALESCE(reset_token, 0) as reset_token,
                   COALESCE(retreat_count, 0) as retreat_count,
                   COALESCE(pending_retreat_penalty, 0) as pending_retreat_penalty,
                   COALESCE(pending_retreat_chapter, 0) as pending_retreat_chapter
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
                retreat_count=0,
                pending_retreat_penalty=0, pending_retreat_chapter=0,
                sync_chapter=0, sync_max_chapter_score=0, sync_max_cipher_idx=-1,
                reset_token=(EXTRACT(EPOCH FROM clock_timestamp())::BIGINT),
                updated_at=NOW()
            WHERE user_id=%s
        """, (user_id,))
        updated = cur.rowcount
        cur.execute("DELETE FROM game_secret_state WHERE user_id=%s", (user_id,))
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
            SET game_over=FALSE, restart_mode=%s,
                pending_retreat_penalty=0, pending_retreat_chapter=0,
                sync_chapter=0, sync_max_chapter_score=0, sync_max_cipher_idx=-1,
                reset_token=(EXTRACT(EPOCH FROM clock_timestamp())::BIGINT),
                updated_at=NOW()
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


def reset_all_game_results(drop_referrals: bool = False):
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
                retreat_count=0,
                pending_retreat_penalty=0, pending_retreat_chapter=0,
                sync_chapter=0, sync_max_chapter_score=0, sync_max_cipher_idx=-1,
                reset_token=(EXTRACT(EPOCH FROM clock_timestamp())::BIGINT),
                updated_at=NOW()
        """)
        updated = cur.rowcount
        cur.execute("DELETE FROM player_chapter_access")
        cur.execute("DELETE FROM game_secret_state")
        if drop_referrals:
            cur.execute("DELETE FROM game_referrals")
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
            SET total_score = 0, score = 0, banned = TRUE,
                pending_retreat_penalty = 0, pending_retreat_chapter = 0,
                sync_chapter = 0, sync_max_chapter_score = 0, sync_max_cipher_idx = -1,
                updated_at = NOW()
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
    """Полный список для админа: user_id, user_name, total_score, completed, game_over, failed, banned, updated_at, retreat_count."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT user_id, user_name, total_score, completed, game_over,
                   COALESCE(failed, FALSE),
                   COALESCE(banned, FALSE),
                   updated_at,
                   COALESCE(retreat_count, 0) as retreat_count
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
                   COALESCE(banned, FALSE), updated_at,
                   COALESCE(retreat_count, 0) as retreat_count,
                   COALESCE(pending_retreat_penalty, 0) as pending_retreat_penalty,
                   COALESCE(pending_retreat_chapter, 0) as pending_retreat_chapter
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


def _delete_game_referrals_for_user(cur, user_id: int) -> int:
    """Delete referral links where user is inviter or invited."""
    cur.execute(
        '''
        DELETE FROM game_referrals
        WHERE referrer_id = %s OR referred_id = %s
        ''',
        (user_id, user_id),
    )
    return int(cur.rowcount or 0)


def reset_game_result_full(user_id: int, drop_referrals: bool = False) -> bool:
    """Полный сброс игрока: обнуляет прогресс, достижения И закрывает все индивидуальные главы."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        token_now = int(datetime.utcnow().timestamp())
        cur.execute("""
            UPDATE game_results
            SET chapter=0, score=0, total_score=0, completed=0,
                game_over=FALSE, failed=FALSE, restart_mode=NULL,
                achievement_count=0, achievement_pts=0,
                retreat_count=0,
                pending_retreat_penalty=0, pending_retreat_chapter=0,
                sync_chapter=0, sync_max_chapter_score=0, sync_max_cipher_idx=-1,
                reset_token=%s,
                updated_at=NOW()
            WHERE user_id=%s
        """, (token_now, user_id))
        updated = cur.rowcount
        if updated == 0:
            # Страховка: создаём запись, если её не было, затем повторяем сброс.
            cur.execute("""
                INSERT INTO game_results
                    (user_id, user_name, chapter, score, total_score, completed, game_over, failed, updated_at)
                VALUES (%s, %s, 0, 0, 0, 0, FALSE, FALSE, NOW())
                ON CONFLICT (user_id) DO NOTHING
            """, (user_id, 'Игрок'))
            cur.execute("""
                UPDATE game_results
                SET chapter=0, score=0, total_score=0, completed=0,
                    game_over=FALSE, failed=FALSE, restart_mode=NULL,
                    achievement_count=0, achievement_pts=0,
                    retreat_count=0,
                    pending_retreat_penalty=0, pending_retreat_chapter=0,
                    sync_chapter=0, sync_max_chapter_score=0, sync_max_cipher_idx=-1,
                    reset_token=%s,
                    updated_at=NOW()
                WHERE user_id=%s
            """, (token_now, user_id))
            updated = cur.rowcount
        cur.execute('DELETE FROM player_chapter_access WHERE user_id = %s', (user_id,))
        if drop_referrals:
            _delete_game_referrals_for_user(cur, user_id)
        conn.commit()
        return updated > 0
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






