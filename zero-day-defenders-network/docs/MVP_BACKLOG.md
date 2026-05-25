# MVP Backlog

# ZERO_DAY: ЗАЩИТНИКИ СЕТИ

## 1. Цель MVP

За 6 недель собрать playable vertical slice: игрок открывает Telegram Mini App, видит город, получает daily threat, проходит 3 мини-игры, получает кредиты/карточки, открывает тайник, видит прогресс карты и сохраняет состояние на сервере.

MVP не должен имитировать полный 180-дневный сезон. Он должен доказать core loop, удержание и техническую надежность.

## 2. Definition of MVP

MVP готов, если:

- Telegram initData валидируется на сервере.
- Игрок видит HUD, карту, угрозы и таб-бар.
- Есть 5 объектов карты и минимум 3 состояния: protected, under_attack, infected.
- Есть 3 мини-игры: Packet Rain, Phishing Stream, Crypto Lock.
- Есть 30 карточек и базовая коллекция.
- Есть 10 инструментов и 3 активных слота.
- Есть Daily Zero Spinner.
- Есть Zero Cache с pity.
- Есть энергия 12/день.
- Есть fair score без влияния доната.
- Есть серверное сохранение прогресса.
- Есть история платежей и sandbox invoice flow.
- Есть базовая админка контента или seed-файлы.

## 3. Эпики

### EPIC-01. App Shell и Telegram

| ID | Задача | Приоритет | Критерий приемки |
|---|---|---:|---|
| APP-001 | Создать frontend shell | P0 | Открывается в Telegram WebView и обычном браузере |
| APP-002 | Подключить Telegram WebApp SDK | P0 | `ready`, `expand`, haptic fallback работают |
| APP-003 | Реализовать safe-area layout | P0 | Нет перекрытия HUD/таб-бара на iPhone |
| APP-004 | Добавить роутинг табов | P0 | Карта, Инструменты, Коллекция, Демон, Отряд, Сюжет, Магазин |
| APP-005 | Добавить offline skeleton | P1 | При ошибке API показывается cached shell |

### EPIC-02. Auth и Progress Sync

| ID | Задача | Приоритет | Критерий приемки |
|---|---|---:|---|
| AUTH-001 | Endpoint `/api/auth/telegram` | P0 | Проверяет hash, auth_date, user id |
| AUTH-002 | Session token | P0 | Все API кроме auth требуют token |
| SYNC-001 | Endpoint `/api/bootstrap` | P0 | Возвращает полный стартовый state |
| SYNC-002 | Delta save | P0 | После мини-игры сервер возвращает rewards + mapDelta |
| SYNC-003 | Idempotency | P0 | Повторный finish не выдает награду дважды |

### EPIC-03. Карта и угрозы

| ID | Задача | Приоритет | Критерий приемки |
|---|---|---:|---|
| MAP-001 | SVG-карта 5 объектов | P0 | Объекты имеют цвета состояния |
| MAP-002 | Threat feed | P0 | Угрозы отображают таймер |
| MAP-003 | Daily threat | P0 | Каждый день появляется 1 обязательная угроза |
| MAP-004 | Infection penalty | P1 | Истекшая угроза заражает объект |
| MAP-005 | Map visual delta | P0 | После победы объект меняет цвет и анимацию |

### EPIC-04. Энергия и экономика

| ID | Задача | Приоритет | Критерий приемки |
|---|---|---:|---|
| ECO-001 | Энергия 12/день | P0 | Start attempt списывает 1 energy |
| ECO-002 | Daily reset | P0 | Энергия сбрасывается в 04:00 |
| ECO-003 | Кредиты | P0 | Начисляются сервером по формуле |
| ECO-004 | Fair score | P0 | Рейтинг исключает платные множители |
| ECO-005 | Audit wallet | P1 | Каждая операция кошелька логируется |

### EPIC-05. Мини-игры

| ID | Задача | Приоритет | Критерий приемки |
|---|---|---:|---|
| GAME-001 | MiniGame lifecycle | P0 | start, pause, finish, fail, cleanup |
| GAME-002 | Packet Rain | P0 | Свайпы PASS/BLOCK/QUARANTINE, score, combo |
| GAME-003 | Phishing Stream | P0 | Вертикальный свайпер, feedback-признаки |
| GAME-004 | Crypto Lock | P0 | 3 диска, читаемый результат, timer |
| GAME-005 | Result validation | P0 | Сервер проверяет duration, score, accuracy |
| GAME-006 | Haptic events | P1 | Успех/ошибка дают haptic |

### EPIC-06. Коллекция и Gacha

| ID | Задача | Приоритет | Критерий приемки |
|---|---|---:|---|
| CARD-001 | Catalog 30 cards | P0 | У карточек есть редкость, тип, факт |
| CARD-002 | Collection UI | P0 | Видны owned/missing, редкости |
| CARD-003 | Duplicates upgrade | P1 | Дубли повышают уровень |
| GACHA-001 | Zero Cache open | P0 | Открытие за ключ |
| GACHA-002 | Pity counters | P0 | 10 Rare, 50 Epic, 100 Legendary |
| GACHA-003 | Opening animation | P1 | Есть редкостные эффекты |

### EPIC-07. Инструменты

| ID | Задача | Приоритет | Критерий приемки |
|---|---|---:|---|
| TOOL-001 | Catalog 10 tools | P0 | 5 классов инструментов |
| TOOL-002 | Equip 3 slots | P0 | Нельзя экипировать больше 3 |
| TOOL-003 | Merge | P1 | 3 одинаковых -> следующий уровень |
| TOOL-004 | Effects v1 | P1 | Scanner подсвечивает, Firewall прощает ошибку |

### EPIC-08. Демон

| ID | Задача | Приоритет | Критерий приемки |
|---|---|---:|---|
| DAE-001 | Демон на карте | P0 | Анимированный агент ходит по объектам |
| DAE-002 | Hunger timer | P1 | Каждые 4 часа меняется состояние |
| DAE-003 | Hidden credits | P1 | Может найти бонус без влияния на рейтинг |
| DAE-004 | 3 evolution levels | P1 | В MVP доступны первые 3 формы |

### EPIC-09. Отряд

| ID | Задача | Приоритет | Критерий приемки |
|---|---|---:|---|
| SQUAD-001 | Создать/вступить | P1 | До 20 игроков |
| SQUAD-002 | Общий щит | P1 | Вклад daily threat виден отряду |
| SQUAD-003 | Бункер v1 | P2 | Можно донатить кредиты |
| SQUAD-004 | Обмен карточками | P2 | 3 обмена/день |

### EPIC-10. Магазин и платежи

| ID | Задача | Приоритет | Критерий приемки |
|---|---|---:|---|
| PAY-001 | Shop catalog | P0 | Видны реальные цены и состав покупки |
| PAY-002 | Create invoice | P0 | Сервер создает invoice payload |
| PAY-003 | Telegram openInvoice | P0 | Клиент открывает счет |
| PAY-004 | Payment webhook | P0 | Успешная оплата выдает награду |
| PAY-005 | History | P1 | Игрок видит покупки |
| PAY-006 | Fair score protection | P0 | Покупки не влияют на рейтинг |

### EPIC-11. Админка и контент

| ID | Задача | Приоритет | Критерий приемки |
|---|---|---:|---|
| ADM-001 | Seed content | P0 | Карточки/угрозы/инструменты грузятся из JSON |
| ADM-002 | Content version | P0 | Клиент обновляет кэш при смене версии |
| ADM-003 | Basic admin API | P1 | Можно включить daily threat вручную |
| ADM-004 | Audit log | P1 | Админ-действия логируются |

### EPIC-12. Аналитика

| ID | Задача | Приоритет | Критерий приемки |
|---|---|---:|---|
| ANA-001 | Event tracking | P0 | app_open, game_start, game_finish, reward |
| ANA-002 | Retention cohorts | P1 | D1/D7/D30 считаются |
| ANA-003 | Economy dashboard | P1 | Видны источники/траты кредитов |

## 4. Релизный порядок

### Неделя 1

- App shell.
- Auth.
- Bootstrap.
- Static map.
- Packet Rain prototype.

### Неделя 2

- Energy.
- Finish attempt.
- Rewards.
- Collection v1.
- 10 стартовых карточек.

### Неделя 3

- Phishing Stream.
- Crypto Lock.
- Tools v1.
- Server anti-cheat rules.

### Неделя 4

- Daily threat.
- Spinner.
- Zero Cache.
- Pity.
- Демон v1.

### Неделя 5

- Squad v1.
- Shop sandbox.
- Payment history.
- Push scheduler.

### Неделя 6

- Episode 1 days 1-5.
- Polish.
- QA.
- Load test.
- Closed beta.

## 5. Риски

| Риск | Вероятность | Влияние | Решение |
|---|---:|---:|---|
| Telegram payments требуют backend-ready invoice | Средняя | Высокое | Сначала sandbox products + webhook audit |
| Мини-игры будут лагать на слабых телефонах | Средняя | Высокое | Low FPS mode, object pooling, PixiJS profiling |
| FOMO будет слишком агрессивным | Средняя | Среднее | Silent hours, настройки пушей, rescue tokens |
| Донат воспримут как pay-to-win | Высокая | Высокое | Fair score отдельно и явно в UI |
| Контента на 180 дней слишком много | Высокая | Высокое | Генератор threat templates + season rotations |

