-- ZERO_DAY: ЗАЩИТНИКИ СЕТИ
-- Initial PostgreSQL schema draft.
-- Recommended: keep the game isolated in the zdnet schema.

CREATE SCHEMA IF NOT EXISTS zdnet;

CREATE TABLE IF NOT EXISTS zdnet.players (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    username TEXT,
    first_name TEXT,
    nickname TEXT NOT NULL,
    school_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zdnet.player_wallet (
    player_id BIGINT PRIMARY KEY REFERENCES zdnet.players(id) ON DELETE CASCADE,
    credits BIGINT NOT NULL DEFAULT 0 CHECK (credits >= 0),
    zero_keys INTEGER NOT NULL DEFAULT 0 CHECK (zero_keys >= 0),
    clean_fragments INTEGER NOT NULL DEFAULT 0 CHECK (clean_fragments >= 0),
    paid_credits_lifetime BIGINT NOT NULL DEFAULT 0,
    free_credits_lifetime BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zdnet.player_energy (
    player_id BIGINT PRIMARY KEY REFERENCES zdnet.players(id) ON DELETE CASCADE,
    current_energy INTEGER NOT NULL DEFAULT 12 CHECK (current_energy >= 0),
    daily_max INTEGER NOT NULL DEFAULT 12 CHECK (daily_max > 0),
    last_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    elite_unlimited_until TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS zdnet.player_progress (
    player_id BIGINT PRIMARY KEY REFERENCES zdnet.players(id) ON DELETE CASCADE,
    soc_level INTEGER NOT NULL DEFAULT 1 CHECK (soc_level > 0),
    soc_xp BIGINT NOT NULL DEFAULT 0 CHECK (soc_xp >= 0),
    season_day INTEGER NOT NULL DEFAULT 1 CHECK (season_day BETWEEN 1 AND 180),
    episode INTEGER NOT NULL DEFAULT 1 CHECK (episode BETWEEN 1 AND 6),
    story_mission INTEGER NOT NULL DEFAULT 0,
    battle_pass_level INTEGER NOT NULL DEFAULT 0,
    battle_pass_xp INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Durable MVP snapshot.
-- Normalized tables above/below remain the target structure for analytics and production queries.
-- The first backend adapter stores authoritative player state here to avoid losing progress
-- while the domain model is still changing quickly during MVP.
CREATE TABLE IF NOT EXISTS zdnet.player_snapshots (
    player_id BIGINT PRIMARY KEY REFERENCES zdnet.players(id) ON DELETE CASCADE,
    state_json JSONB NOT NULL,
    schema_version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zdnet.card_catalog (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    attack_type TEXT NOT NULL,
    weakness TEXT NOT NULL,
    prototype TEXT,
    real_world_fact TEXT NOT NULL,
    art_url TEXT,
    season INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS zdnet.player_cards (
    player_id BIGINT NOT NULL REFERENCES zdnet.players(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL REFERENCES zdnet.card_catalog(id),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 4),
    duplicates INTEGER NOT NULL DEFAULT 0 CHECK (duplicates >= 0),
    is_holo BOOLEAN NOT NULL DEFAULT FALSE,
    first_obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, card_id)
);

CREATE TABLE IF NOT EXISTS zdnet.tool_catalog (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class TEXT NOT NULL CHECK (class IN ('scanner', 'firewall', 'analyzer', 'crypto', 'deceptor')),
    description TEXT NOT NULL,
    effect_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS zdnet.player_tools (
    player_id BIGINT NOT NULL REFERENCES zdnet.players(id) ON DELETE CASCADE,
    tool_id TEXT NOT NULL REFERENCES zdnet.tool_catalog(id),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level > 0),
    count INTEGER NOT NULL DEFAULT 1 CHECK (count > 0),
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    slot_index INTEGER CHECK (slot_index BETWEEN 1 AND 3),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, tool_id, level)
);

CREATE TABLE IF NOT EXISTS zdnet.city_objects (
    id TEXT PRIMARY KEY,
    district_id TEXT NOT NULL,
    name TEXT NOT NULL,
    unlock_day INTEGER NOT NULL DEFAULT 1,
    x NUMERIC NOT NULL,
    y NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS zdnet.player_map_state (
    player_id BIGINT NOT NULL REFERENCES zdnet.players(id) ON DELETE CASCADE,
    object_id TEXT NOT NULL REFERENCES zdnet.city_objects(id),
    state TEXT NOT NULL CHECK (state IN ('locked', 'protected', 'under_attack', 'infected', 'boss')),
    protection_level INTEGER NOT NULL DEFAULT 1 CHECK (protection_level BETWEEN 1 AND 10),
    firewall_level INTEGER NOT NULL DEFAULT 0,
    ids_level INTEGER NOT NULL DEFAULT 0,
    honeypot_level INTEGER NOT NULL DEFAULT 0,
    last_threat_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, object_id)
);

CREATE TABLE IF NOT EXISTS zdnet.threat_catalog (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    attack_type TEXT NOT NULL,
    game_type TEXT NOT NULL,
    base_reward INTEGER NOT NULL CHECK (base_reward > 0),
    difficulty_min INTEGER NOT NULL DEFAULT 1,
    difficulty_max INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS zdnet.active_threats (
    id UUID PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES zdnet.players(id) ON DELETE CASCADE,
    object_id TEXT NOT NULL REFERENCES zdnet.city_objects(id),
    threat_catalog_id TEXT NOT NULL REFERENCES zdnet.threat_catalog(id),
    game_type TEXT NOT NULL,
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
    status TEXT NOT NULL CHECK (status IN ('spawned', 'active', 'neutralized', 'escaped', 'infected')),
    spawned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS zdnet.mini_game_attempts (
    id UUID PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES zdnet.players(id) ON DELETE CASCADE,
    threat_id UUID REFERENCES zdnet.active_threats(id),
    game_type TEXT NOT NULL,
    seed TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    score INTEGER,
    accuracy NUMERIC,
    combo_max INTEGER,
    accepted BOOLEAN,
    anti_cheat_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    fair_score_delta INTEGER NOT NULL DEFAULT 0,
    rewards_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS zdnet.daemon_state (
    player_id BIGINT PRIMARY KEY REFERENCES zdnet.players(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 10),
    xp INTEGER NOT NULL DEFAULT 0,
    skin_id TEXT NOT NULL DEFAULT 'default',
    hunger_state TEXT NOT NULL DEFAULT 'fed' CHECK (hunger_state IN ('fed', 'hungry', 'tired')),
    last_fed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    auto_feed_until TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS zdnet.gacha_state (
    player_id BIGINT PRIMARY KEY REFERENCES zdnet.players(id) ON DELETE CASCADE,
    rare_pity INTEGER NOT NULL DEFAULT 0,
    epic_pity INTEGER NOT NULL DEFAULT 0,
    legendary_pity INTEGER NOT NULL DEFAULT 0,
    open_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS zdnet.gacha_openings (
    id UUID PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES zdnet.players(id) ON DELETE CASCADE,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cost_keys INTEGER NOT NULL,
    result_json JSONB NOT NULL,
    pity_before JSONB NOT NULL,
    pity_after JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS zdnet.daily_state (
    player_id BIGINT PRIMARY KEY REFERENCES zdnet.players(id) ON DELETE CASCADE,
    streak INTEGER NOT NULL DEFAULT 0,
    last_login_date DATE,
    daily_threat_done BOOLEAN NOT NULL DEFAULT FALSE,
    combo_progress INTEGER NOT NULL DEFAULT 0 CHECK (combo_progress BETWEEN 0 AND 3),
    spinner_claimed_date DATE,
    streak_rescue_deadline TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS zdnet.squads (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    leader_player_id BIGINT NOT NULL REFERENCES zdnet.players(id),
    shield INTEGER NOT NULL DEFAULT 100,
    bunker_level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zdnet.squad_members (
    squad_id BIGINT NOT NULL REFERENCES zdnet.squads(id) ON DELETE CASCADE,
    player_id BIGINT NOT NULL REFERENCES zdnet.players(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'officer', 'leader')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    daily_contribution INTEGER NOT NULL DEFAULT 0,
    trades_used_today INTEGER NOT NULL DEFAULT 0 CHECK (trades_used_today BETWEEN 0 AND 3),
    PRIMARY KEY (squad_id, player_id)
);

CREATE TABLE IF NOT EXISTS zdnet.payments (
    id UUID PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES zdnet.players(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'telegram',
    invoice_payload TEXT NOT NULL UNIQUE,
    product_id TEXT NOT NULL,
    amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
    currency TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('created', 'paid', 'cancelled', 'failed', 'refunded')),
    granted_at TIMESTAMPTZ,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zdnet.economy_transactions (
    id UUID PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES zdnet.players(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('credits', 'zero_keys', 'clean_fragments', 'energy')),
    amount BIGINT NOT NULL,
    paid_related BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zdnet.audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_player_id BIGINT REFERENCES zdnet.players(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zdnet_players_telegram ON zdnet.players(telegram_id);
CREATE INDEX IF NOT EXISTS idx_zdnet_threats_player_status ON zdnet.active_threats(player_id, status);
CREATE INDEX IF NOT EXISTS idx_zdnet_attempts_player_started ON zdnet.mini_game_attempts(player_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_zdnet_cards_player ON zdnet.player_cards(player_id);
CREATE INDEX IF NOT EXISTS idx_zdnet_payments_player ON zdnet.payments(player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zdnet_economy_player ON zdnet.economy_transactions(player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zdnet_snapshots_updated ON zdnet.player_snapshots(updated_at DESC);
