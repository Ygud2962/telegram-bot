# Architecture

# ZERO_DAY: ЗАЩИТНИКИ СЕТИ

## 1. Архитектурная позиция

Проект должен быть отдельным контуром, не смешанным со старой игрой и учебным ботом. Telegram Bot может использоваться как входная точка и push-канал, но игровая логика должна жить в отдельном API и отдельной базе/схеме.

## 2. Компоненты

```
┌──────────────────────────┐
│ Telegram Bot             │
│ - start command           │
│ - push notifications      │
│ - payment updates         │
└─────────────┬────────────┘
              │
┌─────────────▼────────────┐
│ Telegram Mini App         │
│ - HTML/CSS/TS             │
│ - SVG map                 │
│ - Canvas mini-games       │
│ - Telegram WebApp SDK     │
└─────────────┬────────────┘
              │ HTTPS
┌─────────────▼────────────┐
│ Game API                  │
│ - Auth                    │
│ - Progress                │
│ - Economy                 │
│ - Gacha                   │
│ - Squad                   │
│ - Payments                │
└──────┬─────────────┬─────┘
       │             │
┌──────▼──────┐ ┌────▼─────┐
│ PostgreSQL  │ │ Redis    │
│ durable     │ │ timers   │
└─────────────┘ └──────────┘
```

## 3. Client state model

Клиент хранит:

- последний bootstrap snapshot;
- временное состояние текущей мини-игры;
- визуальные настройки;
- cached content catalog.

Клиент не хранит authoritative:

- кредиты;
- карточки;
- gacha results;
- рейтинг;
- платежи;
- прогресс угроз.

## 4. Server authority

Сервер является источником правды для:

- кошелька;
- энергии;
- попыток мини-игр;
- выдачи наград;
- pity;
- карточек;
- рейтингов;
- отрядов;
- платежей.

## 5. Мини-игровой lifecycle

```
Player taps threat
  -> POST /attempts/start
      server checks energy and creates attemptId
  -> client loads mini-game seed
  -> player plays
  -> POST /attempts/{id}/finish
      server validates summary
      server grants rewards
      server returns deltas
  -> client animates rewards and map state
```

## 6. Контентные версии

Все каталоги имеют `content_version`.

При bootstrap:

1. Клиент отправляет `clientContentVersion`.
2. Сервер отвечает `contentVersion`.
3. Если версии разные, клиент запрашивает `/api/content`.
4. Старые attempts с другой версией принимаются только в пределах TTL.

## 7. Fair score

В каждой наградной операции создаются две записи:

- `personal_reward`: фактический прогресс игрока;
- `fair_score_delta`: рейтинг без платных множителей.

Пример:

```
base score: 100
SOC ELITE credits multiplier: x1.5
personal credits: 150
fair score: 100
```

## 8. Payment flow

```
Client selects product
  -> POST /api/payments/invoice
      server creates invoice payload
  -> Telegram.WebApp.openInvoice(url)
  -> Telegram sends payment update to Bot/API webhook
  -> server validates payload
  -> server grants product once
  -> client polls /api/payments/history or receives next bootstrap delta
```

## 9. Push flow

```
Scheduler creates push_jobs
  -> Bot sends message
  -> Mini App deep link contains startParam
  -> Auth stores attribution
  -> Player sees targeted screen
```

## 10. База данных: схема проекта

Рекомендуется использовать отдельную PostgreSQL schema:

```sql
CREATE SCHEMA IF NOT EXISTS zdnet;
```

Плюсы:

- старый бот не пересекается с новой игрой;
- проще миграции;
- проще удалить/перенести игру;
- меньше риск случайно сломать существующие таблицы.

## 11. Caching

Redis:

- active threat timers;
- black market windows;
- session tokens;
- rate limit;
- leaderboards cache.

Client:

- content catalog;
- images/sprites;
- last bootstrap snapshot.

## 12. Anti-cheat boundaries

Клиент может рисовать и считать локальный score для UX. Сервер принимает только допустимый score:

- score cap by game type;
- duration range;
- action count range;
- impossible combo detection;
- repeated attempt rejection;
- content seed check.

## 13. Observability

Логи:

- auth failures без полного initData;
- attempt lifecycle;
- economy transactions;
- payment events;
- anti-cheat flags.

Метрики:

- API p95;
- finish rejection rate;
- economy inflation;
- gacha openings;
- payment conversion;
- retention.

## 14. Environments

| Environment | Назначение |
|---|---|
| local | разработка |
| staging | закрытое тестирование |
| production | релиз |

Для staging нужны отдельные:

- bot token;
- payment provider/test mode;
- database schema;
- content version.

