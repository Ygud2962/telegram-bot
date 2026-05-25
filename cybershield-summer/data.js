// ============================================================
// ZERO_DAY: Школьный Протокол — GAME DATA
// ============================================================

const ZD = {
  state: {
    stars: 47,
    reputation: 12,
    trust: 78,
    episode: 3,
    act: 1,
    analyzed: new Set(),
    foundFlags: new Set(),
    termAttempts: 0,
    termSolved: false,
    inventory: ['school_pass'],
    visitedLocations: new Set(),
    completedMissionIds: new Set(),
    chatChoices: {},
    purchasedThemes: ['obsidian_glass'],
    activeTheme: 'obsidian_glass',
    purchaseHistory: [],
    adminMode: false,
    finaleShown: false,
    finaleInboxRead: false
  },

  episodes: Array.from({ length: 24 }, (_, index) => {
    const id = index + 1;
    return {
      id,
      title: `Эпизод ${String(id).padStart(2, '0')}`,
      theme: 'Кибербезопасность • Школьная сеть',
      done: id < 3,
      active: id === 3,
      locked: id > 4
    };
  }),

  missionCalendar: [
    { id: 'm01', month: 'Месяц 1', week: 'Неделя 1', title: 'Ложный файл в чате', reward: 5, type: 'chat' },
    { id: 'm02', month: 'Месяц 1', week: 'Неделя 2', title: 'EXIF-анализ улик', reward: 6, type: 'forensics' },
    { id: 'm03', month: 'Месяц 1', week: 'Неделя 3', title: 'Фишинг-страница банка', reward: 5, type: 'browser' },
    { id: 'm04', month: 'Месяц 1', week: 'Неделя 4', title: 'Дешифровка сообщения', reward: 8, type: 'terminal' },
    { id: 'm05', month: 'Месяц 2', week: 'Неделя 1', title: 'Рейд в Библиотеку', reward: 8, type: 'map' },
    { id: 'm06', month: 'Месяц 2', week: 'Неделя 2', title: 'Серверная: сбор логов', reward: 10, type: 'map' },
    { id: 'm07', month: 'Месяц 2', week: 'Неделя 3', title: 'Подмена QR-меток', reward: 9, type: 'osint' },
    { id: 'm08', month: 'Месяц 2', week: 'Неделя 4', title: 'Проверка MFA-кодов', reward: 9, type: 'identity' },
    { id: 'm09', month: 'Месяц 3', week: 'Неделя 1', title: 'Срыв утечки паролей', reward: 10, type: 'defense' },
    { id: 'm10', month: 'Месяц 3', week: 'Неделя 2', title: 'Разбор deepfake-видео', reward: 10, type: 'media' },
    { id: 'm11', month: 'Месяц 3', week: 'Неделя 3', title: 'Аудит школьного Wi‑Fi', reward: 11, type: 'network' },
    { id: 'm12', month: 'Месяц 3', week: 'Неделя 4', title: 'Перехват фальшивых доменов', reward: 11, type: 'dns' },
    { id: 'm13', month: 'Месяц 4', week: 'Неделя 1', title: 'Реверс вредоносного скрипта', reward: 12, type: 'reverse' },
    { id: 'm14', month: 'Месяц 4', week: 'Неделя 2', title: 'Сценарий реагирования IR', reward: 12, type: 'incident' },
    { id: 'm15', month: 'Месяц 4', week: 'Неделя 3', title: 'Проверка цепочки поставки', reward: 12, type: 'supply' },
    { id: 'm16', month: 'Месяц 4', week: 'Неделя 4', title: 'Red Team: социнженерия', reward: 13, type: 'redteam' },
    { id: 'm17', month: 'Месяц 5', week: 'Неделя 1', title: 'Blue Team: защита почты', reward: 13, type: 'blueteam' },
    { id: 'm18', month: 'Месяц 5', week: 'Неделя 2', title: 'Охота за C2-трафиком', reward: 13, type: 'hunt' },
    { id: 'm19', month: 'Месяц 5', week: 'Неделя 3', title: 'Фиксация IOC-артефактов', reward: 14, type: 'forensics' },
    { id: 'm20', month: 'Месяц 5', week: 'Неделя 4', title: 'Нейтрализация ботнета', reward: 14, type: 'network' },
    { id: 'm21', month: 'Месяц 6', week: 'Неделя 1', title: 'Сквер: финальная встреча', reward: 15, type: 'finale' },
    { id: 'm22', month: 'Месяц 6', week: 'Неделя 2', title: 'Операция "Зеркало"', reward: 15, type: 'finale' },
    { id: 'm23', month: 'Месяц 6', week: 'Неделя 3', title: 'Контратака 404', reward: 16, type: 'finale' },
    { id: 'm24', month: 'Месяц 6', week: 'Неделя 4', title: 'ZERO_DAY: Протокол закрыт', reward: 20, type: 'finale' }
  ],

  contacts: [
    {
      id: 'dasha',
      name: 'Даша Кова',
      role: 'Отряд 404',
      initials: 'ДК',
      color: '#5e5ce6',
      online: true,
      unread: 2,
      preview: 'Марина разослала подозрительный файл...',
      time: '19:48'
    },
    {
      id: 'unknown',
      name: 'Неизвестный',
      role: 'Анонимный контакт',
      initials: '??',
      color: '#ff375f',
      online: false,
      unread: 0,
      preview: 'Не открывай файл от Марины.',
      time: 'вчера'
    },
    {
      id: 'marina',
      name: 'Марина Сол.',
      role: 'Одноклассница',
      initials: 'МС',
      color: '#00c7be',
      online: false,
      unread: 0,
      preview: 'Привет, это точно я. Проверь подпись.',
      time: ''
    }
  ],

  messages: {
    dasha: [
      { from: 'in', text: 'Марина прислала файл всему классу. Пахнет подменой.', time: '19:47' },
      { from: 'out', text: 'Не запускай. Как называется файл?', time: '19:48' },
      { from: 'in', text: '«Новое_расписание.exe». Это точно не она.', time: '19:48' }
    ],
    unknown: [
      { from: 'system', text: 'Сообщение получено вчера в 21:00' },
      { from: 'in', text: 'Если видишь файл от Марины — сперва проверь источник и цифровую подпись.', time: '21:00' }
    ],
    marina: [
      { from: 'in', text: 'Мой аккаунт взломали, я ничего не рассылала. Не открывайте .exe!', time: '20:12' }
    ]
  },

  choices: {
    dasha: [
      { key: 'A', text: 'Предупреди весь класс: файл заражён.', good: true },
      { key: 'B', text: 'Открою на основном ноутбуке, проверю вручную.', good: false },
      { key: 'C', text: 'Проверим личность Марины через второй канал.', good: true }
    ]
  },

  choiceReplies: {
    A: { text: 'Сильное решение. Класс не попадётся на приманку.', stars: 5, trustDelta: 4, repDelta: 2 },
    B: { text: 'Рискованный шаг. Так заражают целые сети.', stars: 0, trustDelta: -4, repDelta: -2 },
    C: { text: 'Отлично. Верификация личности — стандарт SOC.', stars: 3, trustDelta: 3, repDelta: 2 }
  },

  gallery: [
    {
      id: 'g1',
      name: 'photo_marina_001.jpg',
      src: 'assets/gallery/marina-yard.svg',
      flagged: true,
      desc: 'Фотография профиля отправителя',
      exif: [
        { k: 'GPS-метка', v: '55.7522N, 37.6156E', cls: 'danger' },
        { k: 'Устройство', v: 'Samsung S22', cls: '' },
        { k: 'Редактор', v: 'PhotoEditor_crack_v2.1', cls: 'danger' },
        { k: 'Автор', v: 'unknown_sender', cls: 'danger' }
      ]
    },
    {
      id: 'g2',
      name: 'screenshot_class.png',
      src: 'assets/gallery/class-chat.svg',
      flagged: false,
      desc: 'Скриншот чата класса',
      exif: [
        { k: 'GPS-метка', v: 'Не указана', cls: 'ok' },
        { k: 'Устройство', v: 'iPhone 14', cls: '' },
        { k: 'Автор', v: 'marina.ivanova', cls: 'ok' },
        { k: 'Подпись', v: 'Проверена', cls: 'ok' }
      ]
    },
    {
      id: 'g3',
      name: 'raspisanie.exe',
      src: 'assets/gallery/malware-note.svg',
      flagged: true,
      desc: 'Вредоносный файл под видом расписания',
      exif: [
        { k: 'Тип', v: 'EXE (исполняемый)', cls: 'danger' },
        { k: 'Цифровая подпись', v: 'Отсутствует', cls: 'danger' },
        { k: 'Создан', v: '03:14 ночи', cls: 'danger' },
        { k: 'Энтропия', v: '7.94 (возможен упаковщик)', cls: 'danger' }
      ]
    },
    {
      id: 'g4',
      name: 'qr_code_mystery.jpg',
      src: 'assets/gallery/qr-board.svg',
      flagged: false,
      desc: 'QR-код на школьной доске объявлений',
      exif: [
        { k: 'GPS-метка', v: '55.7489N, 37.6220E', cls: '' },
        { k: 'QR-ссылка', v: 't.me/otryad404_secret', cls: 'danger' },
        { k: 'Скрытые данные', v: 'Найдены стего-биты', cls: 'danger' },
        { k: 'Устройство', v: 'Xiaomi 12', cls: '' }
      ]
    },
    {
      id: 'g5',
      name: 'network_map.png',
      src: 'assets/gallery/network-schema.svg',
      flagged: false,
      desc: 'Карта школьной сети',
      exif: [
        { k: 'Протокол', v: 'HTTP (незащищён)', cls: 'danger' },
        { k: 'Узлов', v: '14 устройств', cls: '' },
        { k: 'Подозрительных', v: '3 хоста', cls: 'danger' },
        { k: 'Источник', v: 'local_noc', cls: 'ok' }
      ]
    },
    {
      id: 'g6',
      name: 'selfie_group.jpg',
      src: 'assets/gallery/corridor-selfie.svg',
      flagged: false,
      desc: 'Фото из школьного коридора',
      exif: [
        { k: 'GPS-метка', v: '55.7501N, 37.6189E', cls: 'danger' },
        { k: 'Лиц', v: '4 распознано', cls: '' },
        { k: 'Отражение', v: 'На экране виден пароль', cls: 'danger' },
        { k: 'Устройство', v: 'iPhone 13', cls: '' }
      ]
    }
  ],

  locations: [
    {
      id: 'school',
      emoji: '🏫',
      label: 'Школа №17',
      color: '#30d158',
      pulse: true,
      x: '24%',
      y: '34%',
      desc: 'Отправная точка операции. Здесь ты собираешь базовые артефакты заражения.',
      action: 'Исследовать'
    },
    {
      id: 'cafe',
      emoji: '☕',
      label: 'Кафе «Байт»',
      color: '#64d2ff',
      pulse: false,
      x: '71%',
      y: '40%',
      desc: 'Контакт с информатором. Получишь подсказки по следующему эпизоду.',
      action: 'Встретиться'
    },
    {
      id: 'library',
      emoji: '📚',
      label: 'Библиотека',
      color: '#5e5ce6',
      pulse: false,
      x: '57%',
      y: '68%',
      desc: 'Зашифрованный архив. Нужен ключ дешифратора.',
      action: 'Открыть архив'
    },
    {
      id: 'server',
      emoji: '🖥️',
      label: 'Серверная',
      color: '#ff375f',
      pulse: false,
      x: '23%',
      y: '74%',
      desc: 'Критические логи атаки. Требуются пропуск и USB-Руббердак.',
      action: 'Запустить эксплойт'
    },
    {
      id: 'park',
      emoji: '🌳',
      label: 'Сквер',
      color: '#0a84ff',
      pulse: false,
      x: '79%',
      y: '22%',
      desc: 'Финальная локация. Открывается после завершения ключевых миссий.',
      action: 'Финальная миссия'
    }
  ],

  cipher: {
    encrypted: 'WIGVIX WXYHC PSGW',
    answerShift: 4,
    plain: 'SECRET STUDY LOGS',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  },

  themes: [
    {
      id: 'obsidian_glass',
      name: 'Obsidian Glass',
      desc: 'Базовая тёмная тема в стиле iOS.',
      price: 0
    },
    {
      id: 'neon_pulse',
      name: 'Neon Pulse',
      desc: 'Холодные неоновые акценты и усиленный glow.',
      price: 60
    },
    {
      id: 'sunset_terminal',
      name: 'Sunset Terminal',
      desc: 'Тёплая контрастная тема с янтарными акцентами.',
      price: 80
    },
    {
      id: 'arctic_frost',
      name: 'Arctic Frost',
      desc: 'Светлое стекло с голубыми акцентами.',
      price: 95
    }
  ],

  shopItems: [
    {
      cat: 'Инструменты',
      items: [
        {
          id: 'rubber_duck',
          ico: '🔌',
          name: 'USB-Руббердак',
          desc: 'Открывает миссию в серверной. Одноразовый тактический инструмент.',
          tags: [{ label: 'МИССИЯ: СЕРВЕРНАЯ', cls: 'stag-tool' }, { label: 'ИНСТРУМЕНТ', cls: 'stag-tool' }],
          price: 80
        },
        {
          id: 'wifi_antenna',
          ico: '📡',
          name: 'Wi‑Fi Антенна',
          desc: 'Повышает точность сетевого анализа в полевых миссиях.',
          tags: [{ label: 'СЕТЕВОЙ СКАН', cls: 'stag-tool' }],
          price: 30
        },
        {
          id: 'decryptor',
          ico: '🔓',
          name: 'Ключ дешифратора',
          desc: 'Открывает архив в Библиотеке без ожидания.',
          tags: [{ label: 'МИССИЯ: БИБЛИОТЕКА', cls: 'stag-tool' }, { label: 'РАЗБЛОКИРОВКА', cls: 'stag-tool' }],
          price: 50
        }
      ]
    },
    {
      cat: 'Доступы',
      items: [
        {
          id: 'school_pass',
          ico: '🗝️',
          name: 'Пропуск в серверную',
          desc: 'Постоянный доступ в техническую зону. Уже у тебя.',
          tags: [{ label: 'ПОСТОЯННЫЙ', cls: 'stag-access' }, { label: 'АКТИВЕН', cls: 'stag-access' }],
          price: 0,
          owned: true
        },
        {
          id: 'darknet_acc',
          ico: '🕶️',
          name: 'VIP-доступ к форуму',
          desc: 'Расширяет сюжет новыми диалогами и ветками расследования.',
          tags: [{ label: 'ЭКСКЛЮЗИВ', cls: 'stag-access' }],
          price: 120
        }
      ]
    },
    {
      cat: 'Бустеры',
      items: [
        {
          id: 'energy',
          ico: '⚡',
          name: 'Энергетик',
          desc: 'Добавляет устойчивость: +3 к доверию за следующую успешную миссию.',
          tags: [{ label: 'РАСХОДНИК', cls: 'stag-boost' }],
          price: 15
        },
        {
          id: 'antivirus',
          ico: '🛡️',
          name: 'Антивирусный патч',
          desc: 'Снимает репутационный штраф за один неверный выбор.',
          tags: [{ label: 'ЗАЩИТА', cls: 'stag-boost' }],
          price: 25
        },
        {
          id: 'hint',
          ico: '💡',
          name: 'Подсказка аналитика',
          desc: 'Отправляет оперативную подсказку по текущей цели.',
          tags: [{ label: 'ПОДСКАЗКА', cls: 'stag-boost' }],
          price: 10
        }
      ]
    },
    {
      cat: 'Косметика',
      items: [
        {
          id: 'cosmetic_badge',
          ico: '🎖️',
          name: 'Знак отряда 404',
          desc: 'Косметический предмет профиля. Никак не влияет на баланс миссий.',
          tags: [{ label: 'КОСМЕТИКА', cls: 'stag-cosm' }],
          price: 40
        }
      ]
    }
  ]
};
