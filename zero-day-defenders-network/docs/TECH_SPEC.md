# Техническое задание

# ZERO_DAY: ЗАЩИТНИКИ СЕТИ

## 1. Цель разработки

Разработать Telegram Mini App игру на тему кибербезопасности для школьников 10-17 лет. Приложение должно работать внутри Telegram WebApp, использовать HTML5 Canvas/SVG для интерактивных мини-игр, хранить прогресс на сервере и поддерживать 180-дневный live content.

## 2. Платформы

- Telegram iOS.
- Telegram Android.
- Telegram Desktop.
- Мобильный браузер как fallback.

## 3. Рекомендуемый стек

### Frontend

- TypeScript.
- Vite.
- PixiJS или Phaser 3 для Canvas-мини-игр.
- SVG для карты города.
- CSS variables для темы.
- Telegram WebApp SDK.
- zod или valibot для runtime-валидации данных.

### Backend

- Python FastAPI или Node.js NestJS.
- PostgreSQL.
- Redis для таймеров, rate limit, transient state.
- Telegram Bot API для push-уведомлений.
- S3-compatible storage для арта и видео-фонов.

Рекомендация для текущего репозитория: Python FastAPI + python-telegram-bot, потому что проект уже использует Python и PostgreSQL.

## 4. Архитектура

```
Telegram Client
  └─ Mini App WebView
      ├─ Frontend SPA
      │   ├─ SVG City Map
      │   ├─ Canvas Mini Games
      │   ├─ Collection UI
      │   └─ Telegram WebApp API
      └─ Backend API
          ├─ Auth initData validation
          ├─ Progress sync
          ├─ Economy service
          ├─ Content service
          ├─ Gacha service
          ├─ Squad service
          ├─ Push scheduler
          └─ Admin panel
```

## 5. Клиентские модули

| Модуль | Назначение |
|---|---|
| `AppShell` | загрузка, роутинг, Telegram SDK, safe area |
| `HUD` | кредиты, энергия, SOC level, рейтинг, ключи |
| `CityMap` | SVG-карта, состояния объектов, демон |
| `ThreatFeed` | лента активных угроз с таймерами |
| `MiniGameEngine` | общий lifecycle мини-игр |
| `PacketRainGame` | свайпы пакетов |
| `LogSplitterGame` | drag-and-drop логов |
| `InfectionChainGame` | граф заражения |
| `PhishingStreamGame` | вертикальный свайпер |
| `MetadataMatryoshkaGame` | слои файла |
| `CryptoLockGame` | диски шифра |
| `VirusSandboxGame` | симуляция malware |
| `Collection` | карточки, дубли, редкости, holo |
| `Tools` | инструменты, merge, 3 активных слота |
| `Daemon` | питомец, голод, эволюция |
| `Squad` | отряд, бункер, обмен |
| `Story` | визуальная новелла |
| `Shop` | платежи Telegram invoices |
| `AdminDebug` | dev-only панель состояния |

## 6. Серверные сервисы

### Auth Service

- Проверяет Telegram `initData`.
- Проверяет `auth_date`, hash, user id.
- Создает или обновляет пользователя.
- Выдает короткоживущий session token для API.

### Progress Service

- Хранит полный прогресс игрока.
- Принимает мини-игровые результаты.
- Выполняет серверную проверку античита.
- Возвращает delta-состояние.

### Economy Service

- Кредиты.
- Энергия.
- Ключи Зеро.
- Pity counters.
- Battle Pass.
- Streak.

### Content Service

- Карточки.
- Угрозы.
- Сезоны.
- Эпизоды.
- Push-шаблоны.
- Black Market inventory.

### Gacha Service

- Открытие тайников.
- Pity.
- Drop table versioning.
- Audit log каждого открытия.

### Squad Service

- Отряды до 20 человек.
- Общий щит.
- Бункер.
- Рейды.
- Обмен карточками.

### Payment Service

- Telegram invoices.
- Валидация статуса платежа.
- Выдача покупки идемпотентно.
- Разделение paid rewards и fair score.

### Push Scheduler

- Daily threat в 8:00.
- Weekly boss.
- Legendary spawn.
- Black Market.
- Streak rescue.

## 7. API

Все endpoints требуют валидный session token, кроме `/auth/telegram`.

### Auth

`POST /api/auth/telegram`

Request:

```json
{
  "initData": "query_id=...",
  "startParam": "optional"
}
```

Response:

```json
{
  "sessionToken": "jwt-or-random-token",
  "player": {},
  "serverTime": "2026-05-25T09:00:00Z"
}
```

### Bootstrap

`GET /api/bootstrap`

Возвращает:

- профиль;
- прогресс;
- карту;
- активные угрозы;
- daily spinner state;
- active live events;
- shop catalog;
- content version.

### Mini-game start

`POST /api/threats/{threatId}/start`

Сервер резервирует энергию и создает `attemptId`.

### Mini-game finish

`POST /api/attempts/{attemptId}/finish`

Request:

```json
{
  "gameType": "packet_rain",
  "durationMs": 287000,
  "score": 8420,
  "accuracy": 0.94,
  "comboMax": 17,
  "clientEventsHash": "sha256",
  "inputSummary": {
    "swipes": 82,
    "mistakes": 5
  }
}
```

Response:

```json
{
  "accepted": true,
  "rewards": {
    "credits": 120,
    "socXp": 35,
    "cardDrops": ["card_phish_001"]
  },
  "mapDelta": {},
  "fairScoreDelta": 84
}
```

### Collection

- `GET /api/cards`
- `POST /api/cards/{cardId}/upgrade`
- `POST /api/cards/custom`
- `GET /api/cards/qr/{customCardId}`

### Tools

- `GET /api/tools`
- `POST /api/tools/merge`
- `POST /api/tools/equip`

### Gacha

- `POST /api/cache/open`
- `GET /api/cache/pity`

### Squad

- `POST /api/squads`
- `POST /api/squads/{id}/join`
- `POST /api/squads/{id}/donate`
- `POST /api/squads/{id}/trade`
- `GET /api/squads/{id}/raid`

### Payments

- `POST /api/payments/invoice`
- `POST /api/payments/webhook/telegram`
- `GET /api/payments/history`

## 8. База данных

### Основные таблицы

- `players`
- `player_progress`
- `player_wallet`
- `player_energy`
- `player_cards`
- `card_catalog`
- `player_tools`
- `tool_catalog`
- `threat_catalog`
- `active_threats`
- `mini_game_attempts`
- `city_objects`
- `player_map_state`
- `daemon_state`
- `squads`
- `squad_members`
- `squad_bunker`
- `raids`
- `raid_contributions`
- `gacha_openings`
- `payments`
- `push_jobs`
- `content_versions`
- `audit_log`

### players

| Поле | Тип | Описание |
|---|---|---|
| id | BIGSERIAL | внутренний id |
| telegram_id | BIGINT UNIQUE | Telegram user id |
| username | TEXT | ник |
| first_name | TEXT | имя |
| school_id | BIGINT NULL | школа |
| created_at | TIMESTAMPTZ | дата создания |
| last_seen_at | TIMESTAMPTZ | активность |

### player_wallet

| Поле | Тип |
|---|---|
| player_id | BIGINT PK |
| credits | BIGINT |
| zero_keys | INT |
| clean_fragments | INT |
| paid_credits_lifetime | BIGINT |
| free_credits_lifetime | BIGINT |

### mini_game_attempts

| Поле | Тип |
|---|---|
| id | UUID PK |
| player_id | BIGINT |
| threat_id | UUID |
| game_type | TEXT |
| started_at | TIMESTAMPTZ |
| finished_at | TIMESTAMPTZ NULL |
| duration_ms | INT |
| score | INT |
| accuracy | NUMERIC |
| combo_max | INT |
| accepted | BOOLEAN |
| anti_cheat_flags | JSONB |
| fair_score_delta | INT |

### payments

| Поле | Тип |
|---|---|
| id | UUID PK |
| player_id | BIGINT |
| provider | TEXT |
| invoice_payload | TEXT UNIQUE |
| product_id | TEXT |
| amount_minor | INT |
| currency | TEXT |
| status | TEXT |
| granted_at | TIMESTAMPTZ NULL |
| raw_payload | JSONB |

## 9. Античит

### На клиенте

- Нельзя доверять клиентским наградам.
- Клиент отправляет только summary попытки.
- Для debug можно сохранять compressed event trace.

### На сервере

Проверки:

- минимальная и максимальная длительность;
- невозможный score per second;
- невозможная accuracy;
- частота попыток;
- повторное использование `attemptId`;
- несовпадение content version;
- energy double spend.

При подозрении:

- награда не выдается;
- попытка пишется в audit;
- игрок получает мягкое сообщение "Сессия не засчитана, попробуй еще раз";
- при повторении включается shadow-review.

## 10. Экономика и fair score

В системе есть две параллельные величины:

- `personal_progress`: включает все легальные ускорения и донат.
- `fair_score`: исключает платные множители и нормализует попытки.

Рейтинги, школьная лига и PvE-рейды используют `fair_score`. Магазин, коллекция и личная прокачка используют `personal_progress`.

## 11. Telegram WebApp

Использовать:

- `Telegram.WebApp.ready()`;
- `Telegram.WebApp.expand()`;
- `Telegram.WebApp.HapticFeedback`;
- `Telegram.WebApp.CloudStorage` для легкого локального кэша;
- `Telegram.WebApp.openInvoice()` для платежей;
- `Telegram.WebApp.BackButton`;
- `Telegram.WebApp.MainButton` только для контекстных действий.

### Auth flow

1. Клиент получает `initData`.
2. Отправляет на `/api/auth/telegram`.
3. Сервер валидирует hash.
4. Сервер возвращает session token.
5. Клиент использует token для API.

## 12. Платежи

### Продукты

- `soc_elite_monthly`
- `zero_keys_10`
- `zero_keys_55`
- `zero_keys_120`
- `spinner_extra`
- `streak_rescue`
- `clean_fragments_5`
- `clean_fragments_30`
- `daemon_skin_*`
- `profile_skin_*`
- `auto_feed_day`
- `auto_feed_week`
- `challenge_token_weekly`

### Требования

- Каждая покупка имеет idempotency key.
- Повторный webhook не должен выдавать награду повторно.
- История покупок доступна игроку.
- Для несовершеннолетней аудитории интерфейс должен ясно показывать реальные деньги и подтверждение Telegram.

## 13. Push-уведомления

Сервис должен поддерживать:

- плановые уведомления;
- сегментацию;
- rate limit;
- silent hours;
- отключение конкретных типов пушей.

Обязательные типы:

- daily threat;
- legendary spawn;
- black market;
- streak rescue;
- squad raid;
- squad all-in reminder;
- daemon hungry.

## 14. Контентная админка

Функции:

- карточки угроз;
- drop tables;
- инструменты;
- daily threats;
- эпизоды сюжета;
- push-шаблоны;
- black market;
- live events;
- moderation custom cards;
- player support tools.

Нужно версионирование контента: `content_version`. Клиент должен уметь обновлять кэш при смене версии.

## 15. Производительность

### Цели

- First interactive: до 3 секунд на 4G.
- Bootstrap API: до 500 мс p95.
- Mini-game finish: до 700 мс p95.
- FPS мини-игр: 55-60 на среднем телефоне.
- Размер initial bundle: до 1.5 MB gzip.

### Оптимизации

- Lazy-load мини-игр.
- Spritesheets.
- SVG map chunking.
- Кэш карточек и текста.
- Server delta sync.

## 16. Offline и reconnection

- Главный экран может открыться из кэша.
- Мини-игры с наградами требуют онлайн-start.
- Если связь потерялась во время игры, клиент может один раз отправить finish при восстановлении.
- Сервер проверяет TTL attempt.

## 17. Безопасность

- Все WebApp запросы привязаны к Telegram user id.
- CORS только разрешенные origin.
- Rate limit на auth, gacha, payments, finish.
- SQL только через параметры.
- Никаких реальных паролей.
- Загрузка кастомного контента только через модерацию.
- Логи не должны содержать initData целиком.

## 18. Этика

- В игре нет инструкций по атаке реальных систем.
- Все мини-игры описываются как защита и анализ.
- "Челленджи реальности" не требуют отправлять пароли.
- Скриншоты приватности должны замазывать личные данные на клиенте или приниматься только как self-check без загрузки.

## 19. QA

### Unit tests

- economy math;
- gacha pity;
- fair score;
- auth validation;
- payment idempotency;
- energy reset;
- streak rescue.

### Integration tests

- auth -> bootstrap -> start -> finish -> reward;
- payment invoice -> webhook -> grant;
- squad raid contribution;
- black market schedule.

### Frontend tests

- Mini-game input mapping.
- Responsive Telegram safe area.
- Haptic fallback.
- Low FPS mode.

## 20. Roadmap

### Milestone 0: Pre-production, 2 недели

- финализация GDD;
- прототип визуального стиля;
- выбор PixiJS/Phaser;
- schema lock;
- first playable Packet Rain.

### Milestone 1: MVP, 6 недель

- Telegram auth;
- карта 5 объектов;
- HUD;
- Packet Rain;
- Phishing Stream;
- Crypto Lock;
- 30 карточек;
- basic gacha;
- progress sync.

### Milestone 2: Soft launch, 6 недель

- отряды;
- бункер;
- daily spinner;
- payments sandbox;
- Episode 1;
- admin content panel;
- push scheduler.

### Milestone 3: Season 1 release, 8 недель

- 7 мини-игр;
- 120 карточек;
- raids;
- black market;
- live event;
- full monetization;
- analytics.

## 21. Definition of Done

Фича считается готовой, если:

- есть UX-сценарий;
- есть server validation;
- есть telemetry event;
- есть fallback для Telegram Desktop;
- есть тесты критичной логики;
- есть admin-control для контента;
- нет влияния доната на fair score;
- есть текст безопасной образовательной подачи.

