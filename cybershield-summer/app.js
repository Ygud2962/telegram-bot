// ============================================================
// ZERO_DAY: Школьный Протокол — GAME DATA ENGINE
// ============================================================

const ZD = {
  // ---- STORAGE ----
  STORAGE_KEY: 'zd_state_v1',

  saveState() {
    const data = {
      stars: this.state.stars,
      reputation: this.state.reputation,
      trust: this.state.trust,
      episode: this.state.episode,
      act: this.state.act,
      choiceMade: this.state.choiceMade,
      analyzed: Array.from(this.state.analyzed),
      foundFlags: Array.from(this.state.foundFlags),
      termAttempts: this.state.termAttempts,
      termSolved: this.state.termSolved,
      inventory: this.state.inventory,
      lastSave: Date.now(),
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch(e) {}
  },

  loadState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.stars !== undefined) this.state.stars = data.stars;
      if (data.reputation !== undefined) this.state.reputation = data.reputation;
      if (data.trust !== undefined) this.state.trust = data.trust;
      if (data.episode !== undefined) this.state.episode = data.episode;
      if (data.act !== undefined) this.state.act = data.act;
      if (data.choiceMade !== undefined) this.state.choiceMade = data.choiceMade;
      if (data.analyzed) this.state.analyzed = new Set(data.analyzed);
      if (data.foundFlags) this.state.foundFlags = new Set(data.foundFlags);
      if (data.termAttempts !== undefined) this.state.termAttempts = data.termAttempts;
      if (data.termSolved !== undefined) this.state.termSolved = data.termSolved;
      if (data.inventory) this.state.inventory = data.inventory;
      return true;
    } catch(e) { return false; }
  },

  resetState() {
    this.state = {
      stars: 47,
      reputation: 12,
      trust: 78,
      episode: 3,
      act: 1,
      choiceMade: false,
      analyzed: new Set(),
      foundFlags: new Set(),
      termAttempts: 0,
      termSolved: false,
      inventory: ['school_pass'],
    };
    this.saveState();
  },

  // ---- PLAYER STATE ----
  state: {
    stars: 47,
    reputation: 12,
    trust: 78,
    episode: 3,
    act: 1,
    choiceMade: false,
    analyzed: new Set(),
    foundFlags: new Set(),
    termAttempts: 0,
    termSolved: false,
    inventory: ['school_pass'],
  },

  // ---- EPISODES ----
  episodes: [
    { id: 1, title: 'Первое сообщение', theme: 'Цифровой след · Пароли', done: true },
    { id: 2, title: 'Отряд 404', theme: 'Фишинг · MFA', done: true },
    { id: 3, title: 'Файл от Марины', theme: 'Социальная инженерия', done: false, active: true },
    { id: 4, title: 'Зеркало', theme: 'Дипфейки', done: false, locked: true },
  ],

  // ---- CHAT CONTACTS ----
  contacts: [
    {
      id: 'dasha',
      name: 'Даша Кова',
      role: 'Отряд 404',
      initials: 'ДК',
      color: '#7b5fff',
      online: true,
      unread: 2,
      preview: 'Слушай, Марина прислала файл...',
      time: '19:48',
    },
    {
      id: 'unknown',
      name: 'Неизвестный',
      role: 'Анонимный контакт',
      initials: '??',
      color: '#ff4a6a',
      online: false,
      unread: 0,
      preview: 'Не открывай файл от Марины.',
      time: 'вчера',
    },
    {
      id: 'marina',
      name: 'Марина Сол.',
      role: 'Одноклассница',
      initials: 'МС',
      color: '#00cfff',
      online: false,
      unread: 0,
      preview: '(недоступна)',
      time: '',
    },
  ],

  // ---- CHAT MESSAGES ----
  messages: {
    dasha: [
      { from: 'in', text: 'Слушай, Марина прислала файл всему классу. Я не открывала.', time: '19:47' },
      { from: 'out', text: 'Правильно. Что за файл?', time: '19:48' },
      { from: 'in', text: '«Расписание_новое.exe» 😨 Это явно не Марина писала.', time: '19:48' },
    ],
    unknown: [
      { from: 'system', text: 'Сообщение получено вчера в 21:00' },
      { from: 'in', text: 'Не открывай файл, который тебе скинет Марина завтра. Это не она.', time: '21:00' },
    ],
    marina: [
      { from: 'system', text: 'Контакт временно недоступен' },
    ],
  },

  // ---- CHOICES ----
  choices: {
    dasha: [
      { key: 'A', text: 'Скажи всем в классовом чате — это вирус!', good: true },
      { key: 'B', text: 'Открою сам — проверю что внутри', good: false },
      { key: 'C', text: 'Попробуем связаться с настоящей Мариной', good: true },
    ],
  },
  choiceReplies: {
    A: { text: '⚡ Правильно! Ты защитил класс. Репутация +5. Но хакер теперь знает, что мы его заметили...', stars: 5 },
    B: { text: '🚨 СТОП! Не открывай! Если уже открыл — немедленно отключи интернет. Это вирус-шантажист!', stars: 0 },
    C: { text: '🧠 Умно. Проверка личности — правило №1 цифровой гигиены. Займёт время, но безопасно. +3⭐', stars: 3 },
  },

  // ---- GALLERY ----
  gallery: [
    {
      id: 'g1', emoji: '📸', name: 'photo_marina_001.jpg', flagged: true,
      desc: 'Фото из профиля отправителя',
      exif: [
        { k: 'GPS-метка', v: '55.7522°N 37.6156°E', cls: 'danger' },
        { k: 'Устройство', v: 'Samsung S22', cls: '' },
        { k: 'Время', v: '19:32:14', cls: '' },
        { k: 'Автор', v: 'unknown_sender', cls: 'danger' },
        { k: 'Редактор', v: 'PhotoEditor_crack_v2.1', cls: 'danger' },
        { k: 'Оригинал', v: 'Подменён', cls: 'danger' },
      ],
    },
    {
      id: 'g2', emoji: '🖥️', name: 'screenshot_class.png', flagged: false,
      desc: 'Скрин из классового чата',
      exif: [
        { k: 'GPS-метка', v: 'Не указан', cls: 'ok' },
        { k: 'Устройство', v: 'iPhone 14', cls: '' },
        { k: 'Время', v: '17:15:00', cls: '' },
        { k: 'Автор', v: 'marina.ivanova', cls: 'ok' },
        { k: 'Подпись', v: 'Проверена', cls: 'ok' },
      ],
    },
    {
      id: 'g3', emoji: '📄', name: 'raspisanie.exe', flagged: true,
      desc: 'Подозрительный файл от "Марины"',
      exif: [
        { k: 'Тип', v: '.EXE (исполняемый!)', cls: 'danger' },
        { k: 'Размер', v: '4.2 MB — слишком большой', cls: 'danger' },
        { k: 'Подпись', v: 'НЕТ цифровой подписи', cls: 'danger' },
        { k: 'Создан', v: 'вчера 03:00 (ночью)', cls: 'danger' },
        { k: 'Энтропия', v: '7.94 (упакован/шифр)', cls: 'danger' },
      ],
    },
    {
      id: 'g4', emoji: '🔲', name: 'qr_code_mystery.jpg', flagged: false,
      desc: 'QR-код на доске объявлений',
      exif: [
        { k: 'GPS-метка', v: '55.7489°N 37.6220°E', cls: '' },
        { k: 'Устройство', v: 'Xiaomi 12', cls: '' },
        { k: 'QR-ссылка', v: 't.me/otryad404_secret', cls: 'danger' },
        { k: 'Стего-данные', v: 'Обнаружены скрытые биты', cls: 'danger' },
      ],
    },
    {
      id: 'g5', emoji: '🌐', name: 'network_map.png', flagged: false,
      desc: 'Карта школьной сети',
      exif: [
        { k: 'GPS-метка', v: 'Не указан', cls: 'ok' },
        { k: 'Узлы', v: '14 устройств', cls: '' },
        { k: 'Заражено', v: '3 хоста', cls: 'danger' },
        { k: 'Протокол', v: 'HTTP (незащищён)', cls: 'danger' },
      ],
    },
    {
      id: 'g6', emoji: '🤳', name: 'selfie_group.jpg', flagged: false,
      desc: 'Селфи класса на перемене',
      exif: [
        { k: 'GPS-метка', v: '55.7501°N 37.6189°E', cls: 'danger' },
        { k: 'Устройство', v: 'iPhone 13', cls: '' },
        { k: 'Лиц', v: '4 распознано', cls: '' },
        { k: 'Отражение', v: 'Экран с паролем!', cls: 'danger' },
        { k: 'Метаданные', v: 'Не удалены', cls: 'danger' },
      ],
    },
  ],

  // ---- MAP LOCATIONS ----
  locations: [
    {
      id: 'school', emoji: '🏫', label: 'Школа №17',
      color: '#00e5a0', pulse: true,
      status: 'ГОРЯЧАЯ ТОЧКА', statusColor: '#00e5a0',
      x: '28%', y: '38%',
      desc: 'Эпицентр атаки. В компьютерном классе найди следы заражения на машинах. Базовый инвентарь.',
      action: '▶ ИССЛЕДОВАТЬ',
      type: 'open',
    },
    {
      id: 'cafe', emoji: '☕', label: 'Кафе «Байт»',
      color: '#00cfff', pulse: false,
      status: 'NPC ЗДЕСЬ', statusColor: '#00cfff',
      x: '63%', y: '55%',
      desc: 'Здесь прячется Саша из Отряда 404. Он знает, кто подбросил вирус и где взял оборудование.',
      action: '▶ ВСТРЕТИТЬСЯ С САШЕЙ',
      type: 'open',
    },
    {
      id: 'library', emoji: '📚', label: 'Библиотека',
      color: '#7b5fff', pulse: false,
      status: 'ЗАШИФРОВАНО', statusColor: '#7b5fff',
      x: '47%', y: '73%',
      desc: 'Зашифрованный архив из библиотечной сети. Требуется дешифратор (50⭐) или 48 часов ожидания.',
      action: '🔐 НУЖЕН ДЕШИФРАТОР (50⭐)',
      type: 'req',
    },
    {
      id: 'server', emoji: '🖥️', label: 'Серверная',
      color: '#ff4a6a', pulse: false,
      status: 'РЕКВИЗИТ', statusColor: '#ff4a6a',
      x: '18%', y: '68%',
      desc: 'Серверная школы. Хранит логи атаки. Требуется USB-руббердак (80⭐) + пропуск (уже есть).',
      action: '🔌 НУЖЕН РУББЕРДАК (80⭐)',
      type: 'req',
    },
    {
      id: 'park', emoji: '🌳', label: 'Сквер',
      color: '#555570', pulse: false,
      status: 'ЭП.4', statusColor: '#555570',
      x: '78%', y: '26%',
      desc: 'Локация заблокирована. Разблокируется в Эпизоде 4 после события «Живой дроп».',
      action: '🔒 ЗАБЛОКИРОВАНО',
      type: 'locked',
    },
  ],

  // ---- CIPHER PUZZLE ----
  cipher: {
    encrypted: 'ВМТАЩ ЗОБЩВ',
    answerShift: 4,
    plain: 'РОВИЛ ДОРОГ',
    ruAlphabet: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
  },

  // ---- SHOP ITEMS ----
  shopItems: [
    {
      cat: '🔧 Инструменты',
      items: [
        {
          id: 'rubber_duck', ico: '🔌', name: 'USB-Руббердак',
          desc: 'Физический обход замков. Нужен для миссии «Серверная школы».',
          tags: [{ label: 'ОДНОРАЗОВЫЙ', cls: 'stag-tool' }, { label: 'МИС: СЕРВЕРНАЯ', cls: 'stag-tool' }],
          price: 80,
        },
        {
          id: 'wifi_antenna', ico: '📡', name: 'Wi-Fi Антенна',
          desc: 'Перехват незащищённого трафика в радиусе 50м. Миссия «Взлом камер».',
          tags: [{ label: 'ОДНОРАЗОВЫЙ', cls: 'stag-tool' }, { label: 'МИС: КАМЕРЫ', cls: 'stag-tool' }],
          price: 30,
        },
        {
          id: 'decryptor', ico: '🔓', name: 'Ключ дешифратора',
          desc: 'Расшифровывает архив из библиотечной сети без ожидания 48 часов.',
          tags: [{ label: 'ОДНОРАЗОВЫЙ', cls: 'stag-tool' }, { label: 'МИС: БИБЛИОТЕКА', cls: 'stag-tool' }],
          price: 50,
        },
      ],
    },
    {
      cat: '🎟️ Доступы',
      items: [
        {
          id: 'school_pass', ico: '🗝️', name: 'Пропуск в серверную',
          desc: 'Открывает локацию «Серверная школы». Постоянный. Уже у тебя.',
          tags: [{ label: 'ПОСТОЯННЫЙ', cls: 'stag-access' }, { label: 'ЕСТЬ', cls: 'stag-access' }],
          price: 0, owned: true,
        },
        {
          id: 'darknet_acc', ico: '🕶️', name: 'VIP-аккаунт на форуме',
          desc: 'Доступ к закрытым разделам даркнет-форума. Эксклюзивные диалоги.',
          tags: [{ label: 'ПОСТОЯННЫЙ', cls: 'stag-access' }, { label: 'НОВЫЕ ДИАЛОГИ', cls: 'stag-access' }],
          price: 120,
        },
      ],
    },
    {
      cat: '💊 Бустеры',
      items: [
        {
          id: 'energy', ico: '⚡', name: 'Энергетик',
          desc: '+2 дополнительные попытки в любой миссии.',
          tags: [{ label: 'РАСХОДНИК', cls: 'stag-boost' }],
          price: 15,
        },
        {
          id: 'antivirus', ico: '🛡️', name: 'Антивирус',
          desc: 'Отменяет штраф репутации за провал миссии.',
          tags: [{ label: 'РАСХОДНИК', cls: 'stag-boost' }],
          price: 25,
        },
        {
          id: 'hint', ico: '💡', name: 'Подсказка NPC',
          desc: 'Персонаж раскрывает прямую подсказку к текущей задаче.',
          tags: [{ label: 'РАСХОДНИК', cls: 'stag-boost' }],
          price: 10,
        },
        {
          id: 'skip_timer', ico: '⏩', name: 'Пропуск таймера',
          desc: 'Мгновенно убирает таймер ожидания в любой миссии.',
          tags: [{ label: 'РАСХОДНИК', cls: 'stag-boost' }],
          price: 20,
        },
      ],
    },
    {
      cat: '🎨 Косметика',
      items: [
        {
          id: 'theme_neon', ico: '🌈', name: 'Тема «НЕОН»',
          desc: 'Переключает акцентный цвет интерфейса на розово-неоновый.',
          tags: [{ label: 'ПОСТОЯННАЯ', cls: 'stag-cosm' }],
          price: 50,
        },
        {
          id: 'theme_retro', ico: '🕹️', name: 'Тема «РЕТРО»',
          desc: 'Зелёный монохром в стиле старых терминалов 80-х.',
          tags: [{ label: 'ПОСТОЯННАЯ', cls: 'stag-cosm' }],
          price: 50,
        },
        {
          id: 'early_access', ico: '📺', name: 'Ранний доступ +24ч',
          desc: 'Следующий эпизод откроется на 24 часа раньше всех.',
          tags: [{ label: 'РАЗОВОЕ', cls: 'stag-cosm' }],
          price: 30,
        },
      ],
    },
  ],
};

// Auto-load on init
ZD.loadState();