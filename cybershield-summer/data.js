// ============================================================
// ZERO_DAY: Школьный Протокол — GAME DATA ENGINE v2.0
// ============================================================

const ZD = {
  VERSION: '2.0.0',
  STORAGE_KEY: 'zd_save_v2',

  // ---- SAVE / LOAD ----
  saveState() {
    const data = {
      version: this.VERSION,
      stars: this.state.stars,
      reputation: this.state.reputation,
      trust: this.state.trust,
      episode: this.state.episode,
      act: this.state.act,
      choices: this.state.choices,
      analyzed: Array.from(this.state.analyzed),
      foundFlags: Array.from(this.state.foundFlags),
      termAttempts: this.state.termAttempts,
      termSolved: this.state.termSolved,
      inventory: this.state.inventory,
      achievements: Array.from(this.state.achievements),
      notifications: this.state.notifications,
      tutorialSeen: this.state.tutorialSeen,
      lastSave: Date.now(),
      playTime: this.state.playTime,
      missionsCompleted: this.state.missionsCompleted,
      episodeProgress: this.state.episodeProgress,
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      // Telegram CloudStorage
      if (window.Telegram?.WebApp?.CloudStorage) {
        Telegram.WebApp.CloudStorage.setItem('zd_save', JSON.stringify(data));
      }
    } catch(e) {}
  },

  loadState() {
    let data = null;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch(e) {}

    if (!data) return false;

    // Migrate old saves
    if (data.version !== this.VERSION) {
      this.migrateState(data);
    }

    const s = this.state;
    if (data.stars !== undefined) s.stars = data.stars;
    if (data.reputation !== undefined) s.reputation = data.reputation;
    if (data.trust !== undefined) s.trust = data.trust;
    if (data.episode !== undefined) s.episode = data.episode;
    if (data.act !== undefined) s.act = data.act;
    if (data.choices) s.choices = data.choices;
    if (data.analyzed) s.analyzed = new Set(data.analyzed);
    if (data.foundFlags) s.foundFlags = new Set(data.foundFlags);
    if (data.termAttempts !== undefined) s.termAttempts = data.termAttempts;
    if (data.termSolved !== undefined) s.termSolved = data.termSolved;
    if (data.inventory) s.inventory = data.inventory;
    if (data.achievements) s.achievements = new Set(data.achievements);
    if (data.notifications) s.notifications = data.notifications;
    if (data.tutorialSeen) s.tutorialSeen = data.tutorialSeen;
    if (data.playTime) s.playTime = data.playTime;
    if (data.missionsCompleted) s.missionsCompleted = data.missionsCompleted;
    if (data.episodeProgress) s.episodeProgress = data.episodeProgress;

    return true;
  },

  migrateState(oldData) {
    // Migration logic for future versions
    console.log('Migrating save from version', oldData.version || '1.0');
  },

  resetState() {
    this.state = this.getDefaultState();
    this.saveState();
  },

  getDefaultState() {
    return {
      stars: 50,
      reputation: 10,
      trust: 75,
      episode: 1,
      act: 1,
      choices: {},
      analyzed: new Set(),
      foundFlags: new Set(),
      termAttempts: 0,
      termSolved: false,
      inventory: ['school_pass'],
      achievements: new Set(),
      notifications: [],
      tutorialSeen: false,
      playTime: 0,
      missionsCompleted: { gallery: false, browser: false, terminal: false },
      episodeProgress: {},
    };
  },

  state: null,

  // ---- EPISODES ----
  episodes: [
    {
      id: 1,
      title: 'Первое сообщение',
      subtitle: 'Цифровой след',
      theme: 'Пароли · Приватность',
      desc: 'Ты получил странное сообщение от неизвестного номера. Кто-то знает слишком много о тебе.',
      done: false,
      active: true,
      locked: false,
      starsReward: 10,
      missions: ['chat', 'gallery'],
      color: '#00e5a0',
    },
    {
      id: 2,
      title: 'Отряд 404',
      subtitle: 'Фишинг · MFA',
      theme: 'Фишинг · MFA',
      desc: 'В школе появилась подозрительная Wi-Fi сеть. Отряд 404 набирает новых членов.',
      done: false,
      active: false,
      locked: true,
      starsReward: 15,
      missions: ['browser', 'chat'],
      color: '#7b5fff',
    },
    {
      id: 3,
      title: 'Файл от Марины',
      subtitle: 'Социальная инженерия',
      theme: 'Социальная инженерия',
      desc: 'Марина прислала подозрительный файл всему классу. Но это точно она?',
      done: false,
      active: false,
      locked: true,
      starsReward: 20,
      missions: ['chat', 'gallery', 'terminal'],
      color: '#ff4a6a',
    },
    {
      id: 4,
      title: 'Зеркало',
      subtitle: 'Дипфейки',
      theme: 'Дипфейки · Дезинформация',
      desc: 'В сети появилось видео с директором. Но что-то в нём не так...',
      done: false,
      active: false,
      locked: true,
      starsReward: 25,
      missions: ['gallery', 'browser', 'map'],
      color: '#00cfff',
    },
    {
      id: 5,
      title: 'Серверная',
      subtitle: 'Взлом · Защита',
      theme: 'Сети · Логи',
      desc: 'Пора проникнуть в серверную школы и найти источник атаки.',
      done: false,
      active: false,
      locked: true,
      starsReward: 30,
      missions: ['terminal', 'map', 'shop'],
      color: '#f5a623',
    },
  ],

  // ---- ACHIEVEMENTS ----
  achievements: [
    { id: 'first_steps', title: 'Первые шаги', desc: 'Заверши Эпизод 1', icon: '🎯', stars: 5 },
    { id: 'team_player', title: 'Командный игрок', desc: 'Присоединись к Отряду 404', icon: '🤝', stars: 5 },
    { id: 'detective', title: 'Детектив', desc: 'Найди все улики в галерее', icon: '🔍', stars: 10 },
    { id: 'hacker', title: 'Хакер', desc: 'Взломай шифр в терминале', icon: '💻', stars: 10 },
    { id: 'paranoid', title: 'Параноик', desc: 'Найди все признаки фишинга', icon: '🛡️', stars: 10 },
    { id: 'shopaholic', title: 'Шопоголик', desc: 'Купи 5 предметов в магазине', icon: '🛒', stars: 5 },
    { id: 'rich', title: 'Богач', desc: 'Накопи 100 Stars', icon: '💰', stars: 10 },
    { id: 'legend', title: 'Легенда', desc: 'Заверши все эпизоды', icon: '👑', stars: 25 },
  ],

  // ---- CHAT CONTACTS ----
  contacts: [
    {
      id: 'dasha',
      name: 'Даша Кова',
      role: 'Отряд 404 — Лидер',
      initials: 'ДК',
      color: '#7b5fff',
      online: true,
      unread: 0,
      preview: 'Привет! Ты готов к миссии?',
      time: 'сейчас',
      episodes: [1, 2, 3, 4, 5],
    },
    {
      id: 'unknown',
      name: 'Неизвестный',
      role: 'Аноним',
      initials: '??',
      color: '#ff4a6a',
      online: false,
      unread: 1,
      preview: 'Я знаю, что ты делал прошлым летом...',
      time: 'вчера',
      episodes: [1],
    },
    {
      id: 'marina',
      name: 'Марина Сол.',
      role: 'Одноклассница',
      initials: 'МС',
      color: '#00cfff',
      online: false,
      unread: 0,
      preview: 'Привет! Как дела?',
      time: '2ч назад',
      episodes: [3],
    },
    {
      id: 'sasha',
      name: 'Саша Петров',
      role: 'Отряд 404 — Технарь',
      initials: 'СП',
      color: '#00e5a0',
      online: true,
      unread: 0,
      preview: 'Новые данные с сервера.',
      time: '10мин',
      episodes: [2, 4, 5],
    },
    {
      id: 'director',
      name: 'Директор',
      role: 'Школа №17',
      initials: 'ДИ',
      color: '#f5a623',
      online: false,
      unread: 0,
      preview: 'Срочное собрание завтра.',
      time: 'вчера',
      episodes: [4],
    },
  ],

  // ---- CHAT MESSAGES BY EPISODE ----
  messages: {
    // Episode 1: First Message
    ep1: {
      unknown: [
        { from: 'system', text: 'Сообщение получено вчера в 23:47' },
        { from: 'in', text: 'Привет. Я знаю, что ты делал прошлым летом.', time: '23:47' },
        { from: 'in', text: 'У меня есть фото. Если не хочешь, чтобы все увидели — ответь.', time: '23:48' },
      ],
      dasha: [
        { from: 'system', text: 'Сегодня · 08:15' },
        { from: 'in', text: 'Привет! Я Даша из Отряда 404. Нас слышал?', time: '08:15' },
        { from: 'out', text: 'Отряд 404? Что это?', time: '08:16' },
        { from: 'in', text: 'Мы — группа школьников, которые борются с киберпреступниками в нашей школе.', time: '08:16' },
        { from: 'in', text: 'Видел странное сообщение от неизвестного? Это не случайность.', time: '08:17' },
        { from: 'in', text: 'Проверь свои настройки приватности. И никому не отправляй свои пароли!', time: '08:18' },
      ],
    },
    // Episode 2: Team 404
    ep2: {
      dasha: [
        { from: 'system', text: 'Сегодня · 14:30' },
        { from: 'in', text: 'Срочно! В школе появилась подозрительная Wi-Fi: "School_Free_5G"', time: '14:30' },
        { from: 'in', text: 'Это фишинговая точка! Не подключайся!', time: '14:31' },
        { from: 'out', text: 'Как проверить?', time: '14:32' },
        { from: 'in', text: 'Открой браузер и посмотри на адресную строку. Настоящий сайт школы — https://', time: '14:33' },
      ],
      sasha: [
        { from: 'system', text: 'Сегодня · 15:00' },
        { from: 'in', text: 'Привет, я Саша. Даша сказала, ты с нами?', time: '15:00' },
        { from: 'in', text: 'У меня есть сканер сети. Могу показать, как находить подозрительные устройства.', time: '15:01' },
      ],
    },
    // Episode 3: Marina's File
    ep3: {
      dasha: [
        { from: 'system', text: 'Сегодня · 19:45' },
        { from: 'in', text: 'Слушай, Марина прислала файл всему классу. Я не открывала.', time: '19:45' },
        { from: 'out', text: 'Правильно. Что за файл?', time: '19:46' },
        { from: 'in', text: '«Расписание_новое.exe» 😨 Это явно не Марина писала.', time: '19:46' },
        { from: 'in', text: 'У неё Mac, а файл .exe — только для Windows!', time: '19:47' },
      ],
      unknown: [
        { from: 'system', text: 'Сообщение получено вчера в 21:00' },
        { from: 'in', text: 'Не открывай файл, который тебе скинет Марина завтра. Это не она.', time: '21:00' },
      ],
      marina: [
        { from: 'system', text: 'Контакт временно недоступен' },
      ],
    },
    // Episode 4: Mirror (Deepfakes)
    ep4: {
      dasha: [
        { from: 'system', text: 'Сегодня · 09:00' },
        { from: 'in', text: 'Видел видео с директором в TikTok?', time: '09:00' },
        { from: 'in', text: 'Он якобы оскорбляет учеников. Но это дипфейк!', time: '09:01' },
        { from: 'out', text: 'Как отличить?', time: '09:02' },
        { from: 'in', text: 'Проверь глаза, мигание и границы лица. И метаданные файла!', time: '09:03' },
      ],
      director: [
        { from: 'system', text: 'Сегодня · 08:00' },
        { from: 'in', text: 'Срочное собрание всех старост в 16:00. Присутствие обязательно.', time: '08:00' },
      ],
    },
    // Episode 5: Server Room
    ep5: {
      dasha: [
        { from: 'system', text: 'Сегодня · 20:00' },
        { from: 'in', text: 'Пора действовать. Нужно попасть в серверную.', time: '20:00' },
        { from: 'in', text: 'У тебя есть пропуск. Но нужен руббердак для замка.', time: '20:01' },
        { from: 'out', text: 'Где взять?', time: '20:02' },
        { from: 'in', text: 'В магазине Отряда. Заработай Stars и купи.', time: '20:03' },
      ],
      sasha: [
        { from: 'system', text: 'Сегодня · 20:30' },
        { from: 'in', text: 'Я перехватил зашифрованное сообщение хакера.', time: '20:30' },
        { from: 'in', text: 'Нужно расшифровать. Попробуй шифр Цезаря.', time: '20:31' },
      ],
    },
  },

  // ---- CHOICES BY EPISODE ----
  choices: {
    ep1: {
      unknown: [
        { key: 'A', text: 'Игнорировать сообщение и заблокировать номер', good: true },
        { key: 'B', text: 'Ответить: "Что ты хочешь?"', good: false },
        { key: 'C', text: 'Сообщить родителям и в школу', good: true },
      ],
    },
    ep2: {
      dasha: [
        { key: 'A', text: 'Предупредить всех в классе о фейковой Wi-Fi', good: true },
        { key: 'B', text: 'Подключиться к Wi-Fi, чтобы проверить', good: false },
        { key: 'C', text: 'Проверить настройки своего телефона', good: true },
      ],
    },
    ep3: {
      dasha: [
        { key: 'A', text: 'Скажи всем в классовом чате — это вирус!', good: true },
        { key: 'B', text: 'Открою сам — проверю что внутри', good: false },
        { key: 'C', text: 'Попробуем связаться с настоящей Мариной', good: true },
      ],
    },
    ep4: {
      dasha: [
        { key: 'A', text: 'Проанализировать видео на артефакты дипфейка', good: true },
        { key: 'B', text: 'Распространить видео, чтобы все увидели правду', good: false },
        { key: 'C', text: 'Сообщить директору лично', good: true },
      ],
    },
    ep5: {
      dasha: [
        { key: 'A', text: 'Купить руббердак и проникнуть в серверную', good: true },
        { key: 'B', text: 'Взломать дверь грубой силой', good: false },
        { key: 'C', text: 'Попросить помощи у системного администратора', good: true },
      ],
    },
  },

  choiceReplies: {
    ep1: {
      A: { text: '✅ Мудро. Никогда не взаимодействуй с шантажистами. +5⭐', stars: 5, trust: 5 },
      B: { text: '⚠️ Осторожно! Шантажист получил подтверждение, что ты на крючке. -5 Доверие', stars: 0, trust: -5 },
      C: { text: '✅ Отлично! Взрослые должны знать о кибербуллинге. +8⭐', stars: 8, trust: 10 },
    },
    ep2: {
      A: { text: '✅ Ты защитил одноклассников! Репутация +5. +5⭐', stars: 5, reputation: 5 },
      B: { text: '🚨 Твои данные могли быть украдены! Срочно смени пароли! +0⭐', stars: 0, trust: -10 },
      C: { text: '✅ Правильно! Проверка настроек — базовая гигиена. +3⭐', stars: 3, trust: 3 },
    },
    ep3: {
      A: { text: '⚡ Правильно! Ты защитил класс. Репутация +5. +5⭐', stars: 5, reputation: 5 },
      B: { text: '🚨 СТОП! Не открывай! Если уже открыл — немедленно отключи интернет! +0⭐', stars: 0, trust: -10 },
      C: { text: '🧠 Умно. Проверка личности — правило №1. +3⭐', stars: 3, trust: 5 },
    },
    ep4: {
      A: { text: '🔍 Ты нашёл артефакты! Это действительно дипфейк. +10⭐', stars: 10, reputation: 10 },
      B: { text: '⚠️ Распространение фейков — тоже преступление! -5 Репутация', stars: 0, reputation: -5 },
      C: { text: '✅ Директор благодарит. Совместная работа — ключ к успеху. +5⭐', stars: 5, trust: 5 },
    },
    ep5: {
      A: { text: '🔓 Серверная открыта! Ты нашёл логи атаки. +10⭐', stars: 10, reputation: 10 },
      B: { text: '🚨 Аларм сработал! Ты пойман. -10 Репутация', stars: 0, reputation: -10 },
      C: { text: '✅ Сисадмин помог! Совместно вы нашли источник. +8⭐', stars: 8, trust: 5 },
    },
  },

  // ---- GALLERY (Evidence) ----
  gallery: [
    {
      id: 'g1', emoji: '📸', name: 'photo_marina_001.jpg', flagged: true,
      desc: 'Фото из профиля отправителя',
      episode: 3,
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
      episode: 1,
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
      episode: 3,
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
      episode: 2,
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
      episode: 2,
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
      episode: 1,
      exif: [
        { k: 'GPS-метка', v: '55.7501°N 37.6189°E', cls: 'danger' },
        { k: 'Устройство', v: 'iPhone 13', cls: '' },
        { k: 'Лиц', v: '4 распознано', cls: '' },
        { k: 'Отражение', v: 'Экран с паролем!', cls: 'danger' },
        { k: 'Метаданные', v: 'Не удалены', cls: 'danger' },
      ],
    },
    {
      id: 'g7', emoji: '🎬', name: 'director_video.mp4', flagged: true,
      desc: 'Видео с директором (подозрительное)',
      episode: 4,
      exif: [
        { k: 'Тип', v: 'Видео · MP4', cls: '' },
        { k: 'Длительность', v: '0:47', cls: '' },
        { k: 'FPS', v: '30 (есть дрожание)', cls: 'danger' },
        { k: 'Глаза', v: 'Нет мигания 15 сек', cls: 'danger' },
        { k: 'Граница лица', v: 'Артефакты сжатия', cls: 'danger' },
        { k: 'Метаданные', v: 'Редактор: DeepFaceLab', cls: 'danger' },
      ],
    },
    {
      id: 'g8', emoji: '📡', name: 'wifi_scan.json', flagged: false,
      desc: 'Скан Wi-Fi сетей',
      episode: 2,
      exif: [
        { k: 'Сети найдено', v: '23', cls: '' },
        { k: 'Подозрительные', v: '2 (School_Free, Admin_WiFi)', cls: 'danger' },
        { k: 'Защита', v: 'WPA2 / Открытые', cls: 'warn' },
        { k: 'MAC-адреса', v: 'Подменены', cls: 'danger' },
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
      desc: 'Эпицентр атаки. В компьютерном классе найди следы заражения.',
      action: '▶ ИССЛЕДОВАТЬ',
      type: 'open',
      episode: 1,
    },
    {
      id: 'cafe', emoji: '☕', label: 'Кафе «Байт»',
      color: '#00cfff', pulse: false,
      status: 'NPC ЗДЕСЬ', statusColor: '#00cfff',
      x: '63%', y: '55%',
      desc: 'Здесь прячется Саша из Отряда 404. Он знает, кто подбросил вирус.',
      action: '▶ ВСТРЕТИТЬСЯ С САШЕЙ',
      type: 'open',
      episode: 2,
    },
    {
      id: 'library', emoji: '📚', label: 'Библиотека',
      color: '#7b5fff', pulse: false,
      status: 'ЗАШИФРОВАНО', statusColor: '#7b5fff',
      x: '47%', y: '73%',
      desc: 'Зашифрованный архив из библиотечной сети. Требуется дешифратор (50⭐).',
      action: '🔐 НУЖЕН ДЕШИФРАТОР (50⭐)',
      type: 'req',
      reqItem: 'decryptor',
      episode: 3,
    },
    {
      id: 'server', emoji: '🖥️', label: 'Серверная',
      color: '#ff4a6a', pulse: false,
      status: 'РЕКВИЗИТ', statusColor: '#ff4a6a',
      x: '18%', y: '68%',
      desc: 'Серверная школы. Хранит логи атаки. Требуется USB-руббердак (80⭐).',
      action: '🔌 НУЖЕН РУББЕРДАК (80⭐)',
      type: 'req',
      reqItem: 'rubber_duck',
      episode: 5,
    },
    {
      id: 'park', emoji: '🌳', label: 'Сквер',
      color: '#555570', pulse: false,
      status: 'ЭП.4', statusColor: '#555570',
      x: '78%', y: '26%',
      desc: 'Локация заблокирована. Разблокируется в Эпизоде 4.',
      action: '🔒 ЗАБЛОКИРОВАНО',
      type: 'locked',
      unlockEpisode: 4,
      episode: 4,
    },
    {
      id: 'roof', emoji: '🏗️', label: 'Крыша',
      color: '#f5a623', pulse: false,
      status: 'ЭП.5', statusColor: '#f5a623',
      x: '35%', y: '22%',
      desc: 'Тайная встреча Отряда 404. Только для проверенных.',
      action: '🔒 НУЖНА РЕПУТАЦИЯ 20',
      type: 'locked',
      reqReputation: 20,
      episode: 5,
    },
  ],

  // ---- CIPHER PUZZLES ----
  ciphers: {
    ep1: {
      encrypted: 'ЦЙГУЁ ЁНБЁГ',
      answerShift: 5,
      plain: 'ХВЕСТЁ ЁИВЁБ',
      hint: 'Пароль из 6 букв',
      ruAlphabet: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
    },
    ep3: {
      encrypted: 'ВМТАЩ ЗОБЩВ',
      answerShift: 4,
      plain: 'РОВИЛ ДОРОГ',
      hint: 'Слово из 5 букв + слово из 5 букв',
      ruAlphabet: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
    },
    ep5: {
      encrypted: 'ЪЩМРЁ ЙЁМЁГ',
      answerShift: 7,
      plain: 'ЩЛВИЁ ДЁВЁБ',
      hint: 'Кодовое слово миссии',
      ruAlphabet: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
    },
  },

  // ---- BROWSER PHISHING SITES ----
  phishingSites: [
    {
      id: 'bank',
      url: 'sekur-bank-online.ru',
      secure: false,
      title: '🏦 СекурБанк Online',
      headline: 'Подтвердите личность — введите данные карты',
      warning: '⚠️ СРОЧНО: Ваш аккаунт заблокирован',
      warningText: 'Для восстановления доступа введите данные карты в течение 24 часов.',
      flags: [
        { id: '1', text: 'Подозрительный домен — не официальный сайт банка' },
        { id: '2', text: 'Нет защищённого соединения (HTTP вместо HTTPS)' },
        { id: '3', text: 'Создание искусственной срочности («24 часа»)' },
        { id: '4', text: 'Запрос данных карты — настоящий банк так не делает' },
      ],
      episode: 2,
    },
    {
      id: 'social',
      url: 'vkontakte-login.ru',
      secure: false,
      title: '🔵 ВКонтакте',
      headline: 'Ваш аккаунт взломан! Срочно смените пароль',
      warning: '⚠️ ОБНАРУЖЕНА ПОДОЗРИТЕЛЬНАЯ АКТИВНОСТЬ',
      warningText: 'Кто-то вошёл в ваш аккаунт из Турции. Подтвердите личность.',
      flags: [
        { id: '1', text: 'Поддельный домен — настоящий vk.com' },
        { id: '2', text: 'Нет HTTPS — соединение незащищено' },
        { id: '3', text: 'Паника и срочность — классический приём' },
        { id: '4', text: 'Запрос старого пароля — соцсети так не делают' },
      ],
      episode: 1,
    },
    {
      id: 'prize',
      url: 'prize-winner-2024.com',
      secure: false,
      title: '🎁 Розыгрыш iPhone 15',
      headline: 'Поздравляем! Вы выиграли iPhone 15 Pro!',
      warning: '🎉 ВЫ ПОБЕДИТЕЛЬ!',
      warningText: 'Для получения приза оплатите доставку 499₽. Акция ограничена!',
      flags: [
        { id: '1', text: 'Слишком хорошо, чтобы быть правдой' },
        { id: '2', text: 'Требуют оплату за "бесплатный" приз' },
        { id: '3', text: 'Ограниченное время — давление' },
        { id: '4', text: 'Нет контактов компании-организатора' },
      ],
      episode: 4,
    },
  ],

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
          desc: 'Перехват незащищённого трафика в радиусе 50м.',
          tags: [{ label: 'ОДНОРАЗОВЫЙ', cls: 'stag-tool' }, { label: 'МИС: КАМЕРЫ', cls: 'stag-tool' }],
          price: 30,
        },
        {
          id: 'decryptor', ico: '🔓', name: 'Ключ дешифратора',
          desc: 'Расшифровывает архив из библиотечной сети.',
          tags: [{ label: 'ОДНОРАЗОВЫЙ', cls: 'stag-tool' }, { label: 'МИС: БИБЛИОТЕКА', cls: 'stag-tool' }],
          price: 50,
        },
        {
          id: 'usb_logger', ico: '🔑', name: 'USB-Кейлоггер',
          desc: 'Записывает нажатия клавиш на заражённом ПК.',
          tags: [{ label: 'ОДНОРАЗОВЫЙ', cls: 'stag-tool' }, { label: 'МИС: ШКОЛА', cls: 'stag-tool' }],
          price: 45,
        },
      ],
    },
    {
      cat: '🎟️ Доступы',
      items: [
        {
          id: 'school_pass', ico: '🗝️', name: 'Пропуск в серверную',
          desc: 'Открывает локацию «Серверная школы». Постоянный.',
          tags: [{ label: 'ПОСТОЯННЫЙ', cls: 'stag-access' }, { label: 'ЕСТЬ', cls: 'stag-access' }],
          price: 0, owned: true,
        },
        {
          id: 'darknet_acc', ico: '🕶️', name: 'VIP-аккаунт на форуме',
          desc: 'Доступ к закрытым разделам даркнет-форума.',
          tags: [{ label: 'ПОСТОЯННЫЙ', cls: 'stag-access' }, { label: 'НОВЫЕ ДИАЛОГИ', cls: 'stag-access' }],
          price: 120,
        },
        {
          id: 'admin_key', ico: '🔐', name: 'Ключ администратора',
          desc: 'Доступ к системе управления школой.',
          tags: [{ label: 'ПОСТОЯННЫЙ', cls: 'stag-access' }, { label: 'МИС: СЕРВЕРНАЯ', cls: 'stag-access' }],
          price: 100,
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
          desc: 'Мгновенно убирает таймер ожидания.',
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
          desc: 'Розово-неоновый акцентный цвет интерфейса.',
          tags: [{ label: 'ПОСТОЯННАЯ', cls: 'stag-cosm' }],
          price: 50,
        },
        {
          id: 'theme_retro', ico: '🕹️', name: 'Тема «РЕТРО»',
          desc: 'Зелёный монохром в стиле терминалов 80-х.',
          tags: [{ label: 'ПОСТОЯННАЯ', cls: 'stag-cosm' }],
          price: 50,
        },
        {
          id: 'avatar_hacker', ico: '🎭', name: 'Аватар «Хакер»',
          desc: 'Уникальный аватар для профиля.',
          tags: [{ label: 'ПОСТОЯННАЯ', cls: 'stag-cosm' }],
          price: 35,
        },
      ],
    },
  ],

  // ---- TUTORIAL ----
  tutorial: [
    {
      title: 'Добро пожаловать в ZERO_DAY',
      text: 'Ты — новый агент Отряда 404. Твоя задача — расследовать киберпреступления в школе.',
      icon: '🎯',
    },
    {
      title: 'Навигация',
      text: 'Используй нижнее меню для перехода между приложениями. Каждое приложение — это инструмент расследования.',
      icon: '📱',
    },
    {
      title: 'Stars ⭐',
      text: 'Зарабатывай Stars за выполнение миссий. Покупай реквизит в магазине для новых локаций.',
      icon: '⭐',
    },
    {
      title: 'Эпизоды',
      text: 'Проходи эпизоды по порядку. Каждый эпизод — новая история и новые механики.',
      icon: '📺',
    },
    {
      title: 'Выборы имеют значение',
      text: 'Твои решения влияют на репутацию и доверие. Думай, прежде чем отвечать!',
      icon: '⚡',
    },
  ],

  // ---- NOTIFICATIONS ----
  notifications: [
    { id: 'welcome', title: 'ZERO_DAY', text: 'Добро пожаловать, агент!', time: 'сейчас', read: false },
  ],
};

// Initialize state
ZD.state = ZD.getDefaultState();
ZD.loadState();