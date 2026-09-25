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

# PostgreSQL на client.cloudvps.by требует TLS.
# Значение можно переопределить через PGSSLMODE без изменения кода.
_DB_SSLMODE = os.environ.get('PGSSLMODE', 'require').strip().lower() or 'require'
if _DB_SSLMODE not in {'disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'}:
    raise ValueError("❌ PGSSLMODE содержит неподдерживаемое значение")

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
    {
        'id': 'sm_map_runner',
        'order': 11,
        'tier': 'advanced',
        'mode': None,
        'icon': '🧭',
        'name': 'Маршрут проводника',
        'desc': 'Верно выполнить 3 задания по карте.',
        'target': 3,
        'bonus_pct': 14,
        'min_bonus': 44,
    },
    {
        'id': 'sm_type_mix',
        'order': 12,
        'tier': 'advanced',
        'mode': None,
        'icon': '🧪',
        'name': 'Комбинированный канал',
        'desc': 'Решить задания 4 разных типов.',
        'target': 4,
        'bonus_pct': 15,
        'min_bonus': 46,
    },
    {
        'id': 'sm_clean_two_chapters',
        'order': 13,
        'tier': 'advanced',
        'mode': None,
        'icon': '📋',
        'name': 'Аккуратный штаб',
        'desc': 'Завершить 2 главы с максимум 1 ошибкой и 1 подсказкой.',
        'target': 2,
        'bonus_pct': 18,
        'min_bonus': 52,
    },
    {
        'id': 'sm_evening_watch',
        'order': 14,
        'tier': 'advanced',
        'mode': None,
        'icon': '🌆',
        'name': 'Вечерний дозор',
        'desc': 'Дать правильный ответ вечером (18:00-22:59) в 3 разные даты.',
        'target': 3,
        'bonus_pct': 13,
        'min_bonus': 40,
    },
    {
        'id': 'sm_chapter_score_700',
        'order': 15,
        'tier': 'advanced',
        'mode': None,
        'icon': '⚡',
        'name': 'Штурмовой темп',
        'desc': 'Завершить главу с результатом 700+ очков.',
        'target': 1,
        'bonus_pct': 22,
        'min_bonus': 65,
    },
]
_SECRET_MISSIONS_BY_ID = {m['id']: m for m in _SECRET_MISSIONS}


def init_pool():
    '''Инициализирует пул соединений с retry.'''
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
                dsn=DATABASE_URL, sslmode=_DB_SSLMODE,
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
    '''Создаёт новое прямое соединение с retry.'''
    last_err = None
    for attempt, delay in enumerate(_DB_RETRY_DELAYS[:3], 1):  # макс 3 попытки для одного запроса
        try:
            conn = psycopg2.connect(
                DATABASE_URL, sslmode=_DB_SSLMODE, connect_timeout=10
            )
            return conn
        except Exception as e:
            last_err = e
            if attempt < 3:
                logger.warning(f"⚠️  Переподключение к БД (попытка {attempt}/3), жду {delay}с")
                time.sleep(delay)
    raise last_err


def _pool_is_dead():
    '''Проверяет, сломан ли пул (закрыт или None).'''
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
    '''Возвращает живое соединение из пула. При обрыве — пересоздаёт с retry.'''
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
    '''Безопасный rollback — не падает если соединение уже закрыто.'''
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
        'map_answer_count': 0,
        'clean_chapter_count': 0,
        'unique_types': [],
        'active_days': [],
        'evening_days': [],
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
    data['map_answer_count'] = max(0, _secret_to_int(src.get('map_answer_count', 0), 0))
    data['clean_chapter_count'] = max(0, _secret_to_int(src.get('clean_chapter_count', 0), 0))
    unique_types = src.get('unique_types', [])
    if isinstance(unique_types, list):
        clean_types = []
        for item in unique_types:
            v = str(item or '').strip().lower()
            if not v or len(v) > 24 or v in clean_types:
                continue
            clean_types.append(v)
        data['unique_types'] = clean_types[:16]
    active_days = src.get('active_days', [])
    if isinstance(active_days, list):
        clean_days = []
        for day in active_days:
            d = str(day or '').strip()
            if not d or d in clean_days:
                continue
            clean_days.append(d)
        data['active_days'] = clean_days[-14:]
    evening_days = src.get('evening_days', [])
    if isinstance(evening_days, list):
        clean_evening = []
        for day in evening_days:
            d = str(day or '').strip()
            if not d or d in clean_evening:
                continue
            clean_evening.append(d)
        data['evening_days'] = clean_evening[-14:]
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
    '''Пытается взять глобальную advisory-блокировку для polling (один инстанс бота).'''
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
            DATABASE_URL, sslmode=_DB_SSLMODE, connect_timeout=10
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
    '''Ждёт освобождения polling lock до max_wait_sec.'''
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
    '''Освобождает advisory lock polling при остановке процесса.'''
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
        conn = psycopg2.connect(DATABASE_URL, sslmode=_DB_SSLMODE)
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
        cur.execute("ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS season_mode TEXT DEFAULT 'auto'")
        cur.execute("UPDATE bot_status SET season_mode = LOWER(COALESCE(season_mode, 'auto'))")
        cur.execute("UPDATE bot_status SET season_mode = 'auto' WHERE season_mode NOT IN ('auto', 'summer', 'school')")

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

        # Журнал изменений проекта для автогенерации новостей без git-коммитов.
        cur.execute('''
            CREATE TABLE IF NOT EXISTS project_change_log (
                id           SERIAL PRIMARY KEY,
                scope        TEXT NOT NULL DEFAULT 'bot',
                change_type  TEXT NOT NULL DEFAULT 'feature',
                title        TEXT NOT NULL,
                details      TEXT,
                source       TEXT NOT NULL DEFAULT 'bot',
                actor_id     BIGINT,
                dedupe_key   TEXT,
                used_in_news BOOLEAN DEFAULT FALSE,
                created_at   TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        cur.execute("ALTER TABLE project_change_log ADD COLUMN IF NOT EXISTS dedupe_key TEXT")
        cur.execute("ALTER TABLE project_change_log ADD COLUMN IF NOT EXISTS used_in_news BOOLEAN DEFAULT FALSE")
        cur.execute('''
            CREATE UNIQUE INDEX IF NOT EXISTS idx_project_change_log_dedupe
            ON project_change_log (dedupe_key)
        ''')
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_project_change_log_news
            ON project_change_log (used_in_news, created_at DESC)
        ''')

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
        # Старые схемы и таблицы удалены из проекта.
        cur.execute('''
            CREATE TABLE IF NOT EXISTS beta_access_requests (
                id           SERIAL PRIMARY KEY,
                game_key     TEXT NOT NULL,
                user_id      BIGINT NOT NULL,
                user_name    TEXT,
                status       TEXT NOT NULL DEFAULT 'pending',
                requested_at TIMESTAMPTZ DEFAULT NOW(),
                resolved_at  TIMESTAMPTZ,
                resolved_by  BIGINT
            )
        ''')
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_beta_access_requests_pending
            ON beta_access_requests (game_key, status, requested_at DESC)
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
                pct_referrer_bonus_paid INTEGER DEFAULT 0,
                total_referred_bonus INTEGER DEFAULT 0,
                invitee_bonus_percent INTEGER DEFAULT 1,
                max_referred_base_score INTEGER DEFAULT 0,
                created_at           TIMESTAMPTZ DEFAULT NOW(),
                updated_at           TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        cur.execute('ALTER TABLE game_referrals ADD COLUMN IF NOT EXISTS pct_referrer_bonus_paid INTEGER DEFAULT 0')
        cur.execute('ALTER TABLE game_referrals ADD COLUMN IF NOT EXISTS total_referred_bonus INTEGER DEFAULT 0')
        cur.execute('ALTER TABLE game_referrals ADD COLUMN IF NOT EXISTS invitee_bonus_percent INTEGER DEFAULT 1')
        cur.execute('ALTER TABLE game_referrals ADD COLUMN IF NOT EXISTS max_referred_base_score INTEGER DEFAULT 0')
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
    '''Возвращает информацию о пользователе: dict или None.'''
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
    '''Возвращает профиль пользователя или None.'''
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
    '''Сохраняет или обновляет профиль пользователя.'''
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
    '''Удаляет профиль пользователя (сброс регистрации).'''
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
    '''Возвращает статистику по ролям для аналитики.'''
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
    '''Возвращает список user_id подписанных на замены класса.'''
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
    '''Привязывает Telegram-ID к учителю по имени. Возвращает True при успехе.'''
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
    '''Возвращает {'full_name': ..., 'registered_at': ...} или None.'''
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
    '''Сбрасывает telegram_id и registered для учителя — освобождает имя.'''
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
    '''Возвращает set имён учителей которые уже зарегистрировались в боте.'''
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
    '''Заполняет таблицу teachers из списка имён (только если ещё нет записей).'''
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
    '''Универсальная функция получения новостей. Заменяет get_news_page_asc,
    get_latest_news, get_archive_news_page, get_recent_news.'''
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


def get_news_page_with_count(offset=0, limit=8, scope=None, order='DESC'):
    '''Возвращает (rows, total) одним запросом через window count.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        scope_norm = normalize_news_scope(scope) if scope is not None else None
        order_sql = 'ASC' if order == 'ASC' else 'DESC'
        if scope_norm is not None:
            cur.execute('''
                SELECT id, title, content, published_at, views_count,
                       COUNT(*) OVER() AS total_count
                FROM news
                WHERE category=%s
                ORDER BY published_at ''' + order_sql + ''', id ''' + order_sql + '''
                OFFSET %s LIMIT %s
            ''', (scope_norm, int(offset or 0), int(limit or 8)))
        else:
            cur.execute('''
                SELECT id, title, content, published_at, views_count,
                       COUNT(*) OVER() AS total_count
                FROM news
                ORDER BY published_at ''' + order_sql + ''', id ''' + order_sql + '''
                OFFSET %s LIMIT %s
            ''', (int(offset or 0), int(limit or 8)))
        fetched = cur.fetchall()
        rows = [row[:5] for row in fetched]
        total = int(fetched[0][5] or 0) if fetched else 0
        return rows, total
    except Exception as e:
        logger.error(f"get_news_page_with_count: {e}")
        return [], 0
    finally:
        release_connection(conn)


_PROJECT_CHANGE_SCOPES = {'bot', 'school', 'cipher', 'games'}


def _normalize_project_change_scope(scope):
    raw = str(scope or 'bot').strip().lower()
    aliases = {
        'бот': 'bot',
        'шифровальщик': 'cipher',
        'игры': 'games',
    }
    raw = aliases.get(raw, raw)
    return raw if raw in _PROJECT_CHANGE_SCOPES else 'bot'


def _ensure_project_change_log_table(cur):
    cur.execute('''
        CREATE TABLE IF NOT EXISTS project_change_log (
            id           SERIAL PRIMARY KEY,
            scope        TEXT NOT NULL DEFAULT 'bot',
            change_type  TEXT NOT NULL DEFAULT 'feature',
            title        TEXT NOT NULL,
            details      TEXT,
            source       TEXT NOT NULL DEFAULT 'bot',
            actor_id     BIGINT,
            dedupe_key   TEXT,
            used_in_news BOOLEAN DEFAULT FALSE,
            created_at   TIMESTAMPTZ DEFAULT NOW()
        )
    ''')
    cur.execute("ALTER TABLE project_change_log ADD COLUMN IF NOT EXISTS dedupe_key TEXT")
    cur.execute("ALTER TABLE project_change_log ADD COLUMN IF NOT EXISTS used_in_news BOOLEAN DEFAULT FALSE")
    cur.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_project_change_log_dedupe
        ON project_change_log (dedupe_key)
    ''')
    cur.execute('''
        CREATE INDEX IF NOT EXISTS idx_project_change_log_news
        ON project_change_log (used_in_news, created_at DESC)
    ''')


def add_project_change(scope, title, details=None, change_type='feature',
                       actor_id=None, source='bot', dedupe_key=None):
    '''Добавляет запись в журнал изменений проекта. dedupe_key защищает от дублей.'''
    title = str(title or '').strip()
    if not title:
        return None
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        _ensure_project_change_log_table(cur)
        scope_norm = _normalize_project_change_scope(scope)
        change_type = str(change_type or 'feature').strip().lower()[:40] or 'feature'
        source = str(source or 'bot').strip().lower()[:40] or 'bot'
        if dedupe_key:
            cur.execute('''
                INSERT INTO project_change_log
                    (scope, change_type, title, details, source, actor_id, dedupe_key)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (dedupe_key) DO UPDATE
                SET title = EXCLUDED.title,
                    details = EXCLUDED.details,
                    scope = EXCLUDED.scope,
                    change_type = EXCLUDED.change_type
                RETURNING id
            ''', (scope_norm, change_type, title[:180], details, source, actor_id, dedupe_key))
        else:
            cur.execute('''
                INSERT INTO project_change_log
                    (scope, change_type, title, details, source, actor_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (scope_norm, change_type, title[:180], details, source, actor_id))
        row = cur.fetchone()
        conn.commit()
        return row[0] if row else None
    except Exception as e:
        logger.error(f"add_project_change error: {e}")
        _safe_rollback(conn)
        return None
    finally:
        release_connection(conn)


def get_project_changes(limit=30, unused_only=True):
    '''Возвращает изменения для автоновости: id, scope, type, title, details, source, created_at.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        _ensure_project_change_log_table(cur)
        if unused_only:
            cur.execute('''
                SELECT id, scope, change_type, title, details, source, created_at
                FROM project_change_log
                WHERE used_in_news = FALSE
                ORDER BY created_at ASC, id ASC
                LIMIT %s
            ''', (int(limit or 30),))
        else:
            cur.execute('''
                SELECT id, scope, change_type, title, details, source, created_at
                FROM project_change_log
                ORDER BY created_at DESC, id DESC
                LIMIT %s
            ''', (int(limit or 30),))
        rows = cur.fetchall()
        conn.commit()
        return rows
    except Exception as e:
        logger.error(f"get_project_changes error: {e}")
        return []
    finally:
        release_connection(conn)


def mark_project_changes_used(change_ids):
    '''Помечает изменения использованными в опубликованной новости.'''
    ids = [int(x) for x in (change_ids or []) if str(x).isdigit()]
    if not ids:
        return 0
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        _ensure_project_change_log_table(cur)
        cur.execute('''
            UPDATE project_change_log
            SET used_in_news = TRUE
            WHERE id = ANY(%s)
        ''', (ids,))
        updated = cur.rowcount
        conn.commit()
        return updated
    except Exception as e:
        logger.error(f"mark_project_changes_used error: {e}")
        _safe_rollback(conn)
        return 0
    finally:
        release_connection(conn)


def mark_stale_project_changes_used_by_source(source, active_dedupe_keys=None):
    '''Помечает устаревшие неиспользованные изменения источника как использованные.'''
    source = str(source or '').strip().lower()[:40]
    if not source:
        return 0
    active_keys = [
        str(key).strip()
        for key in (active_dedupe_keys or [])
        if str(key or '').strip()
    ]
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        _ensure_project_change_log_table(cur)
        if active_keys:
            cur.execute('''
                UPDATE project_change_log
                SET used_in_news = TRUE
                WHERE source = %s
                  AND used_in_news = FALSE
                  AND (dedupe_key IS NULL OR NOT (dedupe_key = ANY(%s)))
            ''', (source, active_keys))
        else:
            cur.execute('''
                UPDATE project_change_log
                SET used_in_news = TRUE
                WHERE source = %s
                  AND used_in_news = FALSE
            ''', (source,))
        updated = cur.rowcount
        conn.commit()
        return updated
    except Exception as e:
        logger.error(f"mark_stale_project_changes_used_by_source error: {e}")
        _safe_rollback(conn)
        return 0
    finally:
        release_connection(conn)


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
    '''Возвращает кортеж (id, title, content, published_at, category) или None.'''
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


def get_news_detail_and_increment(news_id, user_id, scope=None):
    '''Возвращает новость и best-effort увеличивает просмотр в одной транзакции.'''
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

        views_count = row[4] or 0
        try:
            cur.execute(
                '''
                INSERT INTO news_views (news_id, user_id)
                VALUES (%s, %s)
                ON CONFLICT (news_id, user_id) DO NOTHING
                ''',
                (news_id, user_id),
            )
            if cur.rowcount:
                cur.execute('UPDATE news SET views_count=views_count+1 WHERE id=%s', (news_id,))
                views_count += 1
        except Exception as e:
            logger.warning(f"get_news_detail_and_increment view update skipped: {e}")
            _safe_rollback(conn)
            return {
                'id': row[0],
                'title': row[1],
                'content': row[2],
                'published_at': row[3],
                'views_count': views_count,
                'category': row[5],
            }

        conn.commit()
        return {
            'id': row[0],
            'title': row[1],
            'content': row[2],
            'published_at': row[3],
            'views_count': views_count,
            'category': row[5],
        }
    except Exception as e:
        logger.error(f"get_news_detail_and_increment: {e}")
        _safe_rollback(conn)
        return None
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
def _normalize_season_mode(mode: str | None) -> str:
    value = (mode or 'auto').strip().lower()
    return value if value in ('auto', 'summer', 'school') else 'auto'


def get_season_mode() -> str:
    '''Возвращает режим сезона: auto / summer / school.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS season_mode TEXT DEFAULT 'auto'")
        cur.execute("INSERT INTO bot_status (id, maintenance_mode) VALUES (1, 0) ON CONFLICT DO NOTHING")
        cur.execute("SELECT season_mode FROM bot_status WHERE id=1")
        row = cur.fetchone()
        conn.commit()
        return _normalize_season_mode(row[0] if row else 'auto')
    except Exception as e:
        logger.error(f"get_season_mode: {e}")
        _safe_rollback(conn)
        return 'auto'
    finally:
        release_connection(conn)


def set_season_mode(mode: str) -> bool:
    '''Устанавливает режим сезона: auto / summer / school.'''
    mode_norm = _normalize_season_mode(mode)
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS season_mode TEXT DEFAULT 'auto'")
        cur.execute(
            "INSERT INTO bot_status (id, maintenance_mode, season_mode) VALUES (1, 0, %s) ON CONFLICT (id) DO NOTHING",
            (mode_norm,)
        )
        cur.execute("UPDATE bot_status SET season_mode=%s WHERE id=1", (mode_norm,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"set_season_mode: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


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

REFERRAL_INVITER_PCT_PER_AGENT = 1
REFERRAL_INVITER_PCT_MAX = 100
REFERRAL_INVITEE_PCT = 1


def _referral_inviter_percent(invited_count: int) -> int:
    count = max(0, int(invited_count or 0))
    if count <= 0:
        return 0
    pct = count * int(REFERRAL_INVITER_PCT_PER_AGENT)
    return max(1, min(int(REFERRAL_INVITER_PCT_MAX), pct))


def _referral_total_bonus_for_base(base_score: int, percent: int) -> int:
    base = max(0, int(base_score or 0))
    pct = max(0, int(percent or 0))
    if base <= 0 or pct <= 0:
        return 0
    # Round up so rewards appear immediately once progress starts.
    return max(1, (base * pct + 99) // 100)

def save_game_result(user_id, user_name, chapter, score, total_score,
                     completed, game_over=False, failed=False):
    '''Save/update player game result with monotonic score/completed/chapter fields.
    Full resets must be done via dedicated reset_* methods.
    '''
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
    '''Регистрирует игрока при первом открытии — НИКОГДА не трогает очки/прогресс.'''
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
    '''Attach referrer to a new player and initialize referral % program.'''
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
                (
                    referred_id, referrer_id,
                    start_bonus_awarded, rewarded_chapters,
                    total_referrer_bonus, pct_referrer_bonus_paid, total_referred_bonus,
                    invitee_bonus_percent, max_referred_base_score,
                    created_at, updated_at
                )
            VALUES (%s, %s, FALSE, 0, 0, 0, 0, %s, 0, NOW(), NOW())
            ''',
            (referred_id, referrer_id, REFERRAL_INVITEE_PCT),
        )

        cur.execute(
            "SELECT COUNT(*) FROM game_referrals WHERE referrer_id = %s",
            (referrer_id,),
        )
        invited_count = int((cur.fetchone() or [0])[0] or 0)
        inviter_percent = _referral_inviter_percent(invited_count)
        conn.commit()
        return {
            'ok': True,
            'status': 'attached',
            'invitee_percent': int(REFERRAL_INVITEE_PCT),
            'inviter_percent': int(inviter_percent),
            'invited_count': int(invited_count),
            'referrer_id': referrer_id,
            'referred_id': referred_id,
        }
    except Exception as e:
        logger.error(f"attach_game_referral error ref={referrer_id} referred={referred_id}: {e}")
        _safe_rollback(conn)
        return {'ok': False, 'status': 'error'}
    finally:
        release_connection(conn)


def apply_referral_bonus_for_completed(
    referred_id: int,
    completed_after: int,
    total_score_after: int = 0,
) -> dict:
    '''Apply referral bonuses by % from invited player's earned score.'''
    conn = None
    try:
        referred_id = int(referred_id or 0)
        completed_after = max(0, min(6, int(completed_after or 0)))
        total_score_after = max(0, int(total_score_after or 0))
        if referred_id <= 0:
            return {'ok': False, 'status': 'invalid_user'}

        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            '''
            SELECT referrer_id,
                   COALESCE(rewarded_chapters, 0),
                   COALESCE(total_referrer_bonus, 0),
                   COALESCE(pct_referrer_bonus_paid, 0),
                   COALESCE(total_referred_bonus, 0),
                   COALESCE(invitee_bonus_percent, %s)
            FROM game_referrals
            WHERE referred_id = %s
            FOR UPDATE
            ''',
            (REFERRAL_INVITEE_PCT, referred_id),
        )
        row = cur.fetchone()
        if not row:
            conn.commit()
            return {'ok': False, 'status': 'no_referral_link'}

        referrer_id = int(row[0] or 0)
        rewarded_chapters = int(row[1] or 0)
        total_referrer_bonus = int(row[2] or 0)
        pct_referrer_bonus_paid = int(row[3] or 0)
        total_referred_bonus = int(row[4] or 0)
        invitee_bonus_percent = int(row[5] or REFERRAL_INVITEE_PCT)

        if referrer_id <= 0:
            conn.commit()
            return {'ok': False, 'status': 'invalid_referrer'}

        if completed_after <= rewarded_chapters:
            conn.commit()
            return {'ok': True, 'status': 'no_new_chapters', 'rewarded_chapters': rewarded_chapters}

        new_chapters = completed_after - rewarded_chapters
        
        cur.execute(
            '''
            SELECT COALESCE(total_score, 0)
            FROM game_results
            WHERE user_id = %s
            FOR UPDATE
            ''',
            (referred_id,),
        )
        progress = cur.fetchone()
        current_total_score = int(progress[0] or 0) if progress else 0

        if current_total_score <= total_score_after:
            base_score_for_bonus = total_score_after - current_total_score
        else:
            base_score_for_bonus = 0

        if base_score_for_bonus <= 0:
            conn.commit()
            return {'ok': True, 'status': 'no_new_score', 'rewarded_chapters': completed_after}

        inviter_percent = _referral_inviter_percent(int((cur.execute("SELECT COUNT(*) FROM game_referrals WHERE referrer_id = %s", (referrer_id,)) or 0)))
        
        new_referrer_bonus = _referral_total_bonus_for_base(base_score_for_bonus, inviter_percent)
        new_referred_bonus = _referral_total_bonus_for_base(base_score_for_bonus, invitee_bonus_percent)

        cur.execute(
            '''
            UPDATE game_referrals
            SET rewarded_chapters = %s,
                total_referrer_bonus = total_referrer_bonus + %s,
                total_referred_bonus = total_referred_bonus + %s,
                updated_at = NOW()
            WHERE referred_id = %s
            ''',
            (completed_after, new_referrer_bonus, new_referred_bonus, referred_id),
        )
        conn.commit()
        return {
            'ok': True,
            'status': 'bonus_applied',
            'new_chapters': new_chapters,
            'new_referrer_bonus': new_referrer_bonus,
            'new_referred_bonus': new_referred_bonus,
            'rewarded_chapters': completed_after,
        }
    except Exception as e:
        logger.error(f"apply_referral_bonus_for_completed error: {e}")
        _safe_rollback(conn)
        return {'ok': False, 'status': 'error'}
    finally:
        release_connection(conn)


def get_game_result(user_id):
    '''Возвращает кортеж результатов игры или None.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT user_id, user_name, chapter, score, total_score, completed,
                   game_over, failed, banned, achievement_count, achievement_pts,
                   reset_token, retreat_count, pending_retreat_penalty, pending_retreat_chapter,
                   sync_chapter, sync_max_chapter_score, sync_max_cipher_idx
            FROM game_results WHERE user_id=%s
        ''', (user_id,))
        return cur.fetchone()
    except Exception as e:
        logger.error(f"get_game_result: {e}")
        return None
    finally:
        release_connection(conn)


def get_leaderboard(limit=20):
    '''Возвращает топ игроков по total_score.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT user_id, user_name, total_score, completed
            FROM game_results
            WHERE banned = FALSE
            ORDER BY total_score DESC, completed DESC
            LIMIT %s
        ''', (limit,))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_leaderboard: {e}")
        return []
    finally:
        release_connection(conn)


def get_game_access_mode() -> str:
    '''Возвращает глобальный режим доступа к игре: beta, open, closed.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT access_mode FROM game_access_settings WHERE id=1")
        row = cur.fetchone()
        mode = (row[0] if row else 'beta').strip().lower()
        return mode if mode in ('beta', 'open', 'closed') else 'beta'
    except Exception as e:
        logger.error(f"get_game_access_mode: {e}")
        return 'beta'
    finally:
        release_connection(conn)


def set_game_access_mode(mode: str) -> bool:
    '''Устанавливает глобальный режим доступа к игре.'''
    mode_norm = mode.strip().lower()
    if mode_norm not in ('beta', 'open', 'closed'):
        return False
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("UPDATE game_access_settings SET access_mode=%s, updated_at=NOW() WHERE id=1", (mode_norm,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"set_game_access_mode: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def is_beta_user(user_id: int) -> bool:
    '''Проверяет, есть ли пользователь в белом списке beta-доступа.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM game_roles WHERE user_id=%s AND role IN ('admin', 'tester')", (user_id,))
        return cur.fetchone() is not None
    except Exception as e:
        logger.error(f"is_beta_user: {e}")
        return False
    finally:
        release_connection(conn)


def add_beta_user(user_id: int, user_name: str, note: str = '') -> bool:
    '''Добавляет пользователя в белый список beta-доступа.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO game_roles (user_id, role, updated_at)
            VALUES (%s, 'tester', NOW())
            ON CONFLICT (user_id) DO UPDATE SET role='tester', updated_at=NOW()
        ''', (user_id,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"add_beta_user: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def remove_beta_user(user_id: int) -> bool:
    '''Удаляет пользователя из белого списка beta-доступа (возвращает роль 'player').'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE game_roles SET role='player', updated_at=NOW()
            WHERE user_id=%s AND role='tester'
        ''', (user_id,))
        conn.commit()
        return cur.rowcount > 0
    except Exception as e:
        logger.error(f"remove_beta_user: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def request_beta_access(user_id: int, user_name: str, game_key: str) -> bool:
    '''Создаёт заявку на beta-доступ.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO beta_access_requests (game_key, user_id, user_name, status, requested_at)
            VALUES (%s, %s, %s, 'pending', NOW())
        ''', (game_key, user_id, user_name))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"request_beta_access: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def get_pending_beta_requests(limit=50) -> list:
    '''Возвращает список нерассмотренных заявок на beta-доступ.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, game_key, user_id, user_name, requested_at
            FROM beta_access_requests
            WHERE status = 'pending'
            ORDER BY requested_at ASC
            LIMIT %s
        ''', (limit,))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_pending_beta_requests: {e}")
        return []
    finally:
        release_connection(conn)


def resolve_beta_access_request(request_id: int, status: str, resolver_id: int) -> tuple:
    '''Обрабатывает заявку на beta-доступ (approved/rejected). Возвращает данные заявки или None.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE beta_access_requests
            SET status=%s, resolved_at=NOW(), resolved_by=%s
            WHERE id=%s AND status='pending'
            RETURNING id, game_key, user_id, user_name, status, requested_at
        ''', (status, resolver_id, request_id))
        row = cur.fetchone()
        conn.commit()
        return row
    except Exception as e:
        logger.error(f"resolve_beta_access_request: {e}")
        _safe_rollback(conn)
        return None
    finally:
        release_connection(conn)


def get_game_role(user_id: int) -> str:
    '''Возвращает игровую роль пользователя: admin, tester, player.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT role FROM game_roles WHERE user_id=%s", (user_id,))
        row = cur.fetchone()
        return (row[0] if row else 'player').strip().lower()
    except Exception as e:
        logger.error(f"get_game_role: {e}")
        return 'player'
    finally:
        release_connection(conn)


def set_game_role(user_id: int, role: str, by_admin_id: int = None) -> bool:
    '''Устанавливает игровую роль пользователя.'''
    role_norm = role.strip().lower()
    if role_norm not in ('admin', 'tester', 'player'):
        return False
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO game_roles (user_id, role, updated_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (user_id) DO UPDATE SET role=%s, updated_at=NOW()
        ''', (user_id, role_norm, role_norm))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"set_game_role: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def get_all_game_roles() -> list:
    '''Возвращает список всех пользователей с их игровыми ролями.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT u.user_id, u.first_name, u.last_name, u.username, COALESCE(g.role, 'player')
            FROM users u
            LEFT JOIN game_roles g ON u.user_id = g.user_id
            ORDER BY g.role DESC, u.user_id
        ''')
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_all_game_roles: {e}")
        return []
    finally:
        release_connection(conn)


def get_chapter_access(user_id: int, chapter_id: int) -> bool:
    '''Проверяет, открыта ли глава для конкретного пользователя.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Сначала проверяем глобальный доступ
        cur.execute("SELECT is_open FROM game_chapters WHERE chapter_id=%s", (chapter_id,))
        row = cur.fetchone()
        if row and row[0]:
            return True
        
        # Если глобально закрыта, проверяем персональный доступ
        cur.execute('''
            SELECT 1 FROM player_chapter_access
            WHERE user_id=%s AND chapter_id=%s
        ''', (user_id, chapter_id))
        return cur.fetchone() is not None
    except Exception as e:
        logger.error(f"get_chapter_access: {e}")
        return False
    finally:
        release_connection(conn)


def grant_chapter_access(user_id: int, chapter_id: int, granted_by: int) -> bool:
    '''Открывает главу для конкретного пользователя.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO player_chapter_access (user_id, chapter_id, granted_by, granted_at)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (user_id, chapter_id) DO NOTHING
        ''', (user_id, chapter_id, granted_by))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"grant_chapter_access: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def revoke_chapter_access(user_id: int, chapter_id: int) -> bool:
    '''Закрывает главу для конкретного пользователя.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            DELETE FROM player_chapter_access
            WHERE user_id=%s AND chapter_id=%s
        ''', (user_id, chapter_id))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"revoke_chapter_access: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def get_user_chapter_access(user_id: int) -> list:
    '''Возвращает список глав, открытых для пользователя персонально.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT chapter_id, granted_at, granted_by
            FROM player_chapter_access
            WHERE user_id=%s
            ORDER BY chapter_id
        ''', (user_id,))
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_user_chapter_access: {e}")
        return []
    finally:
        release_connection(conn)


def set_chapter_open(chapter_id: int, is_open: bool, open_at=None) -> bool:
    '''Устанавливает глобальный статус открытия главы.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        if is_open:
            cur.execute('''
                UPDATE game_chapters SET is_open=TRUE, open_at=NULL, updated_at=NOW()
                WHERE chapter_id=%s
            ''', (chapter_id,))
        else:
            cur.execute('''
                UPDATE game_chapters SET is_open=FALSE, open_at=%s, updated_at=NOW()
                WHERE chapter_id=%s
            ''', (open_at, chapter_id))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"set_chapter_open: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def get_all_chapters() -> list:
    '''Возвращает список всех глав с их статусом.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT chapter_id, is_open, open_at, updated_at
            FROM game_chapters
            ORDER BY chapter_id
        ''')
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_all_chapters: {e}")
        return []
    finally:
        release_connection(conn)


def get_secret_state(user_id: int) -> dict:
    '''Возвращает состояние секретных миссий пользователя.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT selected_mode, missions_json, runtime_json, completed_count, bonus_points
            FROM game_secret_state WHERE user_id=%s
        ''', (user_id,))
        row = cur.fetchone()
        if row:
            return {
                'mode': row[0],
                'missions': _secret_normalize_missions(row[1]),
                'runtime': _secret_normalize_runtime(row[2]),
                'completed_count': row[3] or 0,
                'bonus_points': row[4] or 0,
            }
        return {
            'mode': 'none',
            'missions': _secret_empty_missions_state(),
            'runtime': _secret_default_runtime(),
            'completed_count': 0,
            'bonus_points': 0,
        }
    except Exception as e:
        logger.error(f"get_secret_state: {e}")
        return {
            'mode': 'none',
            'missions': _secret_empty_missions_state(),
            'runtime': _secret_default_runtime(),
            'completed_count': 0,
            'bonus_points': 0,
        }
    finally:
        release_connection(conn)


def update_secret_state(user_id: int, mode: str, missions: dict, runtime: dict,
                        completed_count: int, bonus_points: int) -> bool:
    '''Обновляет состояние секретных миссий пользователя.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        mode_norm = _sanitize_secret_mode(mode)
        cur.execute('''
            INSERT INTO game_secret_state
                (user_id, selected_mode, missions_json, runtime_json, completed_count, bonus_points, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                selected_mode = EXCLUDED.selected_mode,
                missions_json = EXCLUDED.missions_json,
                runtime_json = EXCLUDED.runtime_json,
                completed_count = EXCLUDED.completed_count,
                bonus_points = EXCLUDED.bonus_points,
                updated_at = NOW()
        ''', (user_id, mode_norm, json.dumps(missions), json.dumps(runtime), completed_count, bonus_points))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"update_secret_state: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def reset_game_player_full(user_id: int, reset_token: int) -> bool:
    '''Полный сброс прогресса игрока (только если reset_token совпадает).'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE game_results
            SET chapter = 0, score = 0, total_score = 0, completed = 0,
                game_over = FALSE, failed = FALSE, restart_mode = NULL,
                retreat_count = 0, pending_retreat_penalty = 0, pending_retreat_chapter = 0,
                sync_chapter = 0, sync_max_chapter_score = 0, sync_max_cipher_idx = -1,
                reset_token = %s, updated_at = NOW()
            WHERE user_id = %s AND (reset_token = %s OR reset_token = 0)
        ''', (reset_token, user_id, reset_token))
        updated = cur.rowcount
        
        if updated > 0:
            cur.execute('''
                UPDATE game_secret_state
                SET selected_mode = 'none',
                    missions_json = '{}'::jsonb,
                    runtime_json = '{}'::jsonb,
                    completed_count = 0,
                    bonus_points = 0,
                    updated_at = NOW()
                WHERE user_id = %s
            ''', (user_id,))
            
            cur.execute('''
                DELETE FROM player_chapter_access WHERE user_id = %s
            ''', (user_id,))
            
            cur.execute('''
                DELETE FROM game_referrals WHERE referred_id = %s OR referrer_id = %s
            ''', (user_id, user_id))
            
        conn.commit()
        return updated > 0
    except Exception as e:
        logger.error(f"reset_game_player_full: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def reset_game_player_points_only(user_id: int) -> bool:
    '''Сброс только очков и глав, сохраняя агентов и достижения.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE game_results
            SET chapter = 0, score = 0, total_score = 0, completed = 0,
                game_over = FALSE, failed = FALSE, restart_mode = 'nopts',
                sync_chapter = 0, sync_max_chapter_score = 0, sync_max_cipher_idx = -1,
                updated_at = NOW()
            WHERE user_id = %s
        ''', (user_id,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"reset_game_player_points_only: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def reset_game_player_agents_only(user_id: int) -> bool:
    '''Сброс только реферальной системы (агентов), сохраняя прогресс.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            DELETE FROM game_referrals WHERE referred_id = %s OR referrer_id = %s
        ''', (user_id, user_id))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"reset_game_player_agents_only: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def ban_game_player(user_id: int) -> bool:
    '''Заблокировать игрока в игре.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE game_results SET banned = TRUE, updated_at = NOW() WHERE user_id = %s
        ''', (user_id,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"ban_game_player: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def unban_game_player(user_id: int) -> bool:
    '''Разблокировать игрока в игре.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            UPDATE game_results SET banned = FALSE, updated_at = NOW() WHERE user_id = %s
        ''', (user_id,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"unban_game_player: {e}")
        _safe_rollback(conn)
        return False
    finally:
        release_connection(conn)


def get_banned_players() -> list:
    '''Возвращает список заблокированных игроков.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT user_id, user_name, total_score, completed
            FROM game_results
            WHERE banned = TRUE
            ORDER BY user_id
        ''')
        return cur.fetchall()
    except Exception as e:
        logger.error(f"get_banned_players: {e}")
        return []
    finally:
        release_connection(conn)


def get_players_only(limit=100) -> list:
    '''Возвращает список обычных игроков (не admin/tester) для админки.'''
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT u.user_id, u.first_name, u.last_name, u.username,
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
    '''Возвращает расписание глав для передачи в игру (таймеры).
    [(chapter_id, is_open, open_at_iso_string_or_null), ...]
    '''
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
