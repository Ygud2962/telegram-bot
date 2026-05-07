(function () {
  "use strict";

  const STORAGE_KEY = "cs_progress_v2";
  const START_DATE = "2026-06-01";
  const END_DATE = "2026-08-31";

  const MODE_META = {
    clue: { label: "Поиск улик", icon: "🔍" },
    chat: { label: "Симулятор переписки", icon: "💬" },
    sort: { label: "Сортировка входящих", icon: "📥" },
    incident: { label: "Инцидент 30с", icon: "⚡" }
  };

  const WEEK_THEMES = [
    "Фишинг и подмена личности",
    "Пароли и двухфакторная защита",
    "Безопасные ссылки и домены",
    "Соцсети и приватность",
    "Мошенничество в мессенджерах",
    "Кибербуллинг и цифровая этика",
    "Фейк-новости и проверка фактов",
    "Игры, донаты и скам",
    "Публичный Wi-Fi и устройства",
    "Цифровой след",
    "Резервные копии и восстановление",
    "Безопасность семьи",
    "Итоговая тренировка",
    "Финальная операция"
  ];

  // Пн clue, Вт chat, Ср sort, Чт incident, Пт clue, Сб chat, Вс sort.
  const DAY_PATTERNS = {
    1: { type: "clue", reward: 10, title: "Разбор интерфейса" },
    2: { type: "chat", reward: 12, title: "Сложный диалог" },
    3: { type: "sort", reward: 11, title: "Фильтр входящих" },
    4: { type: "incident", reward: 14, title: "Срочный инцидент" },
    5: { type: "clue", reward: 13, title: "Точечная проверка" },
    6: { type: "chat", reward: 12, title: "Субботний стресс-тест" },
    0: { type: "sort", reward: 12, title: "Контрольный фильтр" }
  };

  function parseISO(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function formatISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatRu(date) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${d}.${m}.${date.getFullYear()}`;
  }

  function weekdayRu(day) {
    return ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"][day];
  }

  function daysDiff(a, b) {
    return Math.floor((b - a) / (24 * 60 * 60 * 1000));
  }

  function generateCalendar(startISO, endISO) {
    const start = parseISO(startISO);
    const end = parseISO(endISO);
    const list = [];
    let idx = 1;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const cur = new Date(d);
      const dateISO = formatISO(cur);
      const weekIndex = Math.floor(daysDiff(start, cur) / 7);
      const weekTheme = WEEK_THEMES[Math.min(weekIndex, WEEK_THEMES.length - 1)];
      const pattern = DAY_PATTERNS[cur.getDay()];
      const isFinal = dateISO === END_DATE;
      const mode = isFinal ? "incident" : pattern.type;

      list.push({
        id: `CS-${String(idx).padStart(3, "0")}`,
        date: dateISO,
        dateRu: formatRu(cur),
        dayName: weekdayRu(cur.getDay()),
        week: weekIndex + 1,
        theme: isFinal ? "Финальная операция" : weekTheme,
        type: mode,
        reward: isFinal ? 20 : pattern.reward,
        title: isFinal ? "Финальная операция «Киберщит»" : `${pattern.title}: ${weekTheme}`
      });
      idx += 1;
    }
    return list;
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { solved: {}, points: 0 };
      const parsed = JSON.parse(raw);
      return {
        solved: parsed.solved || {},
        points: Number(parsed.points || 0)
      };
    } catch (_e) {
      return { solved: {}, points: 0 };
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function missionIsSolved(progress, mission) {
    return !!progress.solved[mission.id];
  }

  function scenarioSeed(mission) {
    return Number((mission.id || "CS-000").replace(/[^\d]/g, "")) || 1;
  }

  function clueScenario(mission) {
    const seed = scenarioSeed(mission) % 4;
    const mailBodies = [
      "Подтверди аккаунт и пришли код из SMS в ответном сообщении.",
      "Вы выиграли приз. Заполните форму с паролем для мгновенной выплаты.",
      "Ваш профиль заблокирован. Войдите по ссылке для разблокировки.",
      "Модератор просит срочно перевести «проверочный платёж»."
    ];

    return {
      items: [
        { x: 5, y: 8, w: 64, h: 16, text: "От: support-security@ma1l-help.com" },
        { x: 5, y: 29, w: 86, h: 19, text: mailBodies[seed] },
        { x: 5, y: 53, w: 58, h: 14, text: "Ссылка: http://verify-account-fast.ru" },
        { x: 5, y: 71, w: 78, h: 14, text: "Срок ответа: 3 минуты, иначе удаление аккаунта!" }
      ],
      hotspots: [
        { x: 70, y: 14, why: "Подменный домен отправителя" },
        { x: 67, y: 59, why: "Небезопасный протокол http" },
        { x: 84, y: 76, why: "Давление срочностью" }
      ]
    };
  }

  function chatScenario(_mission) {
    return {
      log: [
        { role: "them", text: "Привет. Я из службы безопасности платформы." },
        { role: "them", text: "Нужен код из SMS и фото карты. Иначе удалим профиль." },
        { role: "them", text: "Отвечай срочно, времени почти нет." }
      ],
      requiredGroups: [
        ["не", "код"],
        ["провер", "официаль"],
        ["поддерж", "жалоб"],
        ["смен", "парол"]
      ],
      tip: "Нужны действия: не давать код, проверить официальный канал, обратиться в поддержку, сменить пароль."
    };
  }

  function sortScenario(mission) {
    const seed = scenarioSeed(mission) % 3;
    const packs = [
      [
        { text: "Официальное письмо школы с домена school.by", expected: "safe" },
        { text: "Ссылка на скидку с ошибкой в домене g00gle-check.ru", expected: "danger" },
        { text: "Новый контакт просит срочно дать код из SMS", expected: "danger" },
        { text: "Друг прислал архив game_patch.zip без объяснений", expected: "suspicious" }
      ],
      [
        { text: "Уведомление банка: войдите по короткой ссылке bit.ly/...", expected: "danger" },
        { text: "Письмо учителя с домашним заданием в дневнике", expected: "safe" },
        { text: "Сообщение «вы в розыгрыше», нужен номер карты", expected: "danger" },
        { text: "Незнакомец зовет в приватный чат и просит номер телефона", expected: "suspicious" }
      ],
      [
        { text: "Запрос на вход с нового устройства, кнопка «Проверить активность»", expected: "suspicious" },
        { text: "Одноклассник просит логин/пароль «только на 5 минут»", expected: "danger" },
        { text: "Новость из официального школьного канала", expected: "safe" },
        { text: "Промокод в игре от неизвестного бота", expected: "suspicious" }
      ]
    ];
    return { items: packs[seed] };
  }

  function incidentScenario(mission) {
    const seed = scenarioSeed(mission) % 3;
    const packs = [
      {
        target: "Тебе пришла ссылка для «срочного подтверждения аккаунта». Что делать?",
        sequence: ["Не переходить по ссылке", "Проверить домен и отправителя", "Сообщить в поддержку", "Сменить пароль и включить 2FA"]
      },
      {
        target: "Друг попросил код из SMS для «входа в турнир». Что делать?",
        sequence: ["Не передавать код", "Проверить, не взломан ли его аккаунт", "Связаться с другом другим способом", "Пожаловаться на подозрительный чат"]
      },
      {
        target: "Ты скачал подозрительный файл и открыл его. Что делать сразу?",
        sequence: ["Отключить интернет", "Запустить проверку антивирусом", "Сменить пароли с чистого устройства", "Сообщить взрослым/учителю"]
      }
    ];
    return packs[seed];
  }

  const calendar = generateCalendar(START_DATE, END_DATE);
  const todayISO = formatISO(new Date());
  const todayMission = calendar.find(m => m.date === todayISO) || calendar[0];

  const state = {
    progress: loadProgress(),
    mission: todayMission,
    activeMode: todayMission.type,
    foundHotspots: new Set(),
    sortChoices: {},
    incident: {
      running: false,
      leftSec: 30,
      picked: [],
      timerId: null
    }
  };

  const el = {
    todayDate: document.getElementById("today-date"),
    missionCounter: document.getElementById("mission-counter"),
    solvedToday: document.getElementById("solved-today"),
    missionTitle: document.getElementById("mission-title"),
    missionDescription: document.getElementById("mission-description"),
    missionType: document.getElementById("mission-type"),
    missionWeek: document.getElementById("mission-week"),
    missionReward: document.getElementById("mission-reward"),
    calendarPreview: document.getElementById("calendar-preview"),
    progressBar: document.getElementById("progress-bar"),
    progressText: document.getElementById("progress-text"),
    btnReset: document.getElementById("btn-reset"),

    btnClue: document.getElementById("btn-clue"),
    btnChat: document.getElementById("btn-chat"),
    btnSort: document.getElementById("btn-sort"),
    btnIncident: document.getElementById("btn-incident"),
    clueMode: document.getElementById("clue-mode"),
    chatMode: document.getElementById("chat-mode"),
    sortMode: document.getElementById("sort-mode"),
    incidentMode: document.getElementById("incident-mode"),

    clueBoard: document.getElementById("clue-board"),
    clueProgress: document.getElementById("clue-progress"),
    clueResult: document.getElementById("clue-result"),
    btnClueCheck: document.getElementById("btn-clue-check"),

    chatLog: document.getElementById("chat-log"),
    chatAnswer: document.getElementById("chat-answer"),
    chatResult: document.getElementById("chat-result"),
    btnChatCheck: document.getElementById("btn-chat-check"),

    sortList: document.getElementById("sort-list"),
    sortResult: document.getElementById("sort-result"),
    btnSortCheck: document.getElementById("btn-sort-check"),

    incidentTimer: document.getElementById("incident-timer"),
    btnIncidentStart: document.getElementById("btn-incident-start"),
    incidentTarget: document.getElementById("incident-target"),
    incidentActions: document.getElementById("incident-actions"),
    incidentSeq: document.getElementById("incident-seq"),
    incidentResult: document.getElementById("incident-result")
  };

  function clearIncidentTimer() {
    if (state.incident.timerId) {
      clearInterval(state.incident.timerId);
      state.incident.timerId = null;
    }
  }

  function pointsForMission(mission) {
    return Number(mission.reward || 0);
  }

  function markMissionCompleted(mode) {
    const key = state.mission.id;
    if (state.progress.solved[key]) {
      return { awarded: false, message: "Миссия уже засчитана ранее." };
    }
    state.progress.solved[key] = {
      mode,
      completed_at: new Date().toISOString()
    };
    const pts = pointsForMission(state.mission);
    state.progress.points += pts;
    saveProgress(state.progress);
    renderHeader();
    renderProgress();
    return { awarded: true, message: `Миссия зачтена: +${pts} очков.` };
  }

  function modeForTodayLabel() {
    const m = MODE_META[state.mission.type];
    return `${m.icon} ${m.label}`;
  }

  function renderHeader() {
    const idx = calendar.findIndex(m => m.id === state.mission.id) + 1;
    el.todayDate.textContent = `Сегодня: ${state.mission.dateRu} (${state.mission.dayName})`;
    el.missionCounter.textContent = `Миссия ${idx}/${calendar.length}`;
    el.missionTitle.textContent = state.mission.title;
    el.missionDescription.textContent = `Тема недели: ${state.mission.theme}`;
    el.missionType.textContent = `Режим дня: ${modeForTodayLabel()}`;
    el.missionWeek.textContent = `Неделя ${state.mission.week}`;
    el.missionReward.textContent = `Награда: +${state.mission.reward} очков`;
    el.solvedToday.textContent = missionIsSolved(state.progress, state.mission) ? "Статус: выполнено" : "Статус: не выполнено";
  }

  function renderProgress() {
    const solved = Object.keys(state.progress.solved).length;
    const total = calendar.length;
    const pct = Math.round((solved / total) * 100);
    el.progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    el.progressText.textContent = `Выполнено: ${solved}/${total} • Очки: ${state.progress.points} • Прогресс: ${pct}%`;
  }

  function renderCalendarPreview() {
    el.calendarPreview.innerHTML = "";
    calendar.slice(0, 21).forEach((m) => {
      const li = document.createElement("li");
      li.textContent = `${m.dateRu} (${m.dayName}) — ${MODE_META[m.type].label} • +${m.reward}`;
      el.calendarPreview.appendChild(li);
    });
  }

  function setMode(mode) {
    state.activeMode = mode;
    el.btnClue.classList.toggle("active", mode === "clue");
    el.btnChat.classList.toggle("active", mode === "chat");
    el.btnSort.classList.toggle("active", mode === "sort");
    el.btnIncident.classList.toggle("active", mode === "incident");
    el.clueMode.classList.toggle("hidden", mode !== "clue");
    el.chatMode.classList.toggle("hidden", mode !== "chat");
    el.sortMode.classList.toggle("hidden", mode !== "sort");
    el.incidentMode.classList.toggle("hidden", mode !== "incident");
  }

  function awardOrTraining(mode) {
    if (mode !== state.mission.type) {
      return {
        good: true,
        text: `Тренировка пройдена. Для зачёта дня нужен режим: ${MODE_META[state.mission.type].label}.`
      };
    }
    const result = markMissionCompleted(mode);
    return { good: true, text: result.message };
  }

  function setResult(node, good, text) {
    node.textContent = text;
    node.className = `result ${good ? "good" : "bad"}`;
  }

  function renderClueMode() {
    state.foundHotspots.clear();
    el.clueBoard.innerHTML = "";
    setResult(el.clueResult, true, "");
    el.clueResult.className = "result";
    const scenario = clueScenario(state.mission);

    scenario.items.forEach((it) => {
      const box = document.createElement("div");
      box.className = "clue-card";
      box.style.left = `${it.x}%`;
      box.style.top = `${it.y}%`;
      box.style.width = `${it.w}%`;
      box.style.height = `${it.h}%`;
      box.textContent = it.text;
      el.clueBoard.appendChild(box);
    });

    scenario.hotspots.forEach((spot, idx) => {
      const hs = document.createElement("button");
      hs.type = "button";
      hs.className = "hotspot";
      hs.style.left = `${spot.x}%`;
      hs.style.top = `${spot.y}%`;
      hs.title = "Подозрительный элемент";
      hs.addEventListener("click", () => {
        if (state.foundHotspots.has(idx)) return;
        state.foundHotspots.add(idx);
        hs.classList.add("found");
        el.clueProgress.textContent = `Улики: ${state.foundHotspots.size}/${scenario.hotspots.length}`;
      });
      el.clueBoard.appendChild(hs);
    });

    el.clueBoard.dataset.count = String(scenario.hotspots.length);
    el.clueProgress.textContent = `Улики: 0/${scenario.hotspots.length}`;
  }

  function checkClueMode() {
    const total = Number(el.clueBoard.dataset.count || "0");
    if (state.foundHotspots.size < total) {
      setResult(el.clueResult, false, "Не все улики найдены. Проверь отправителя, ссылку и язык давления.");
      return;
    }
    const out = awardOrTraining("clue");
    setResult(el.clueResult, out.good, out.text);
  }

  function renderChatMode() {
    el.chatLog.innerHTML = "";
    el.chatAnswer.value = "";
    el.chatResult.textContent = "";
    el.chatResult.className = "result";
    const scenario = chatScenario(state.mission);
    scenario.log.forEach((row) => {
      const node = document.createElement("div");
      node.className = `msg ${row.role}`;
      node.textContent = row.text;
      el.chatLog.appendChild(node);
    });
  }

  function checkChatMode() {
    const answer = (el.chatAnswer.value || "").toLowerCase().trim();
    const scenario = chatScenario(state.mission);
    if (answer.length < 20) {
      setResult(el.chatResult, false, "Слишком коротко. Нужен конкретный план действий.");
      return;
    }

    let groupsMatched = 0;
    scenario.requiredGroups.forEach((group) => {
      if (group.some((token) => answer.includes(token))) groupsMatched += 1;
    });

    if (groupsMatched < 3) {
      setResult(el.chatResult, false, `Пока слабо (${groupsMatched}/4). ${scenario.tip}`);
      return;
    }

    const out = awardOrTraining("chat");
    setResult(el.chatResult, out.good, out.text);
  }

  function renderSortMode() {
    state.sortChoices = {};
    el.sortList.innerHTML = "";
    el.sortResult.textContent = "";
    el.sortResult.className = "result";
    const scenario = sortScenario(state.mission);

    scenario.items.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "sort-item";
      const label = document.createElement("div");
      label.textContent = item.text;
      const pick = document.createElement("select");
      pick.innerHTML = [
        '<option value="">Выбери категорию</option>',
        '<option value="safe">Безопасно</option>',
        '<option value="suspicious">Подозрительно</option>',
        '<option value="danger">Опасно</option>'
      ].join("");
      pick.addEventListener("change", () => {
        state.sortChoices[idx] = pick.value;
      });

      row.appendChild(label);
      row.appendChild(pick);
      el.sortList.appendChild(row);
    });
  }

  function checkSortMode() {
    const scenario = sortScenario(state.mission);
    let correct = 0;
    for (let i = 0; i < scenario.items.length; i += 1) {
      if (!state.sortChoices[i]) {
        setResult(el.sortResult, false, "Распредели все карточки по категориям.");
        return;
      }
      if (state.sortChoices[i] === scenario.items[i].expected) correct += 1;
    }

    if (correct < scenario.items.length) {
      setResult(el.sortResult, false, `Есть ошибки: ${correct}/${scenario.items.length} верно. Попробуй ещё раз.`);
      return;
    }

    const out = awardOrTraining("sort");
    setResult(el.sortResult, out.good, out.text);
  }

  function renderIncidentMode() {
    clearIncidentTimer();
    state.incident.running = false;
    state.incident.leftSec = 30;
    state.incident.picked = [];
    el.incidentTimer.textContent = "30с";
    el.incidentSeq.textContent = "Последовательность: —";
    el.incidentResult.textContent = "";
    el.incidentResult.className = "result";

    const scenario = incidentScenario(state.mission);
    el.incidentTarget.textContent = scenario.target;
    el.incidentActions.innerHTML = "";

    const shuffled = scenario.sequence
      .map((action, i) => ({ action, i, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort);

    shuffled.forEach((item) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "incident-action";
      b.textContent = item.action;
      b.dataset.idx = String(item.i);
      b.disabled = true;
      b.addEventListener("click", () => handleIncidentClick(item.i, item.action));
      el.incidentActions.appendChild(b);
    });
  }

  function setIncidentButtonsEnabled(enabled) {
    Array.from(el.incidentActions.querySelectorAll("button")).forEach((b) => {
      b.disabled = !enabled;
    });
  }

  function startIncident() {
    renderIncidentMode();
    state.incident.running = true;
    state.incident.leftSec = 30;
    setIncidentButtonsEnabled(true);
    el.incidentTimer.textContent = "30с";
    el.incidentSeq.textContent = "Последовательность: старт";
    el.incidentResult.textContent = "";
    el.incidentResult.className = "result";

    state.incident.timerId = setInterval(() => {
      state.incident.leftSec -= 1;
      el.incidentTimer.textContent = `${state.incident.leftSec}с`;
      if (state.incident.leftSec <= 0) {
        clearIncidentTimer();
        state.incident.running = false;
        setIncidentButtonsEnabled(false);
        setResult(el.incidentResult, false, "Время вышло. Запусти раунд ещё раз.");
      }
    }, 1000);
  }

  function handleIncidentClick(orderIndex, actionText) {
    if (!state.incident.running) return;
    const scenario = incidentScenario(state.mission);
    const currentStep = state.incident.picked.length;
    const expectedAction = scenario.sequence[currentStep];

    if (scenario.sequence[orderIndex] !== expectedAction) {
      clearIncidentTimer();
      state.incident.running = false;
      setIncidentButtonsEnabled(false);
      setResult(el.incidentResult, false, `Неверный шаг: "${actionText}". Попробуй снова.`);
      return;
    }

    state.incident.picked.push(actionText);
    el.incidentSeq.textContent = `Последовательность: ${state.incident.picked.join(" → ")}`;

    if (state.incident.picked.length === scenario.sequence.length) {
      clearIncidentTimer();
      state.incident.running = false;
      setIncidentButtonsEnabled(false);
      const out = awardOrTraining("incident");
      setResult(el.incidentResult, out.good, out.text);
    }
  }

  function bindEvents() {
    el.btnClue.addEventListener("click", () => setMode("clue"));
    el.btnChat.addEventListener("click", () => setMode("chat"));
    el.btnSort.addEventListener("click", () => setMode("sort"));
    el.btnIncident.addEventListener("click", () => setMode("incident"));

    el.btnClueCheck.addEventListener("click", checkClueMode);
    el.btnChatCheck.addEventListener("click", checkChatMode);
    el.btnSortCheck.addEventListener("click", checkSortMode);
    el.btnIncidentStart.addEventListener("click", startIncident);

    el.btnReset.addEventListener("click", () => {
      const ok = window.confirm("Сбросить прогресс Киберщита? Это не затронет другие проекты.");
      if (!ok) return;
      localStorage.removeItem(STORAGE_KEY);
      state.progress = loadProgress();
      renderHeader();
      renderProgress();
      renderClueMode();
      renderChatMode();
      renderSortMode();
      renderIncidentMode();
    });
  }

  function init() {
    renderHeader();
    renderProgress();
    renderCalendarPreview();
    renderClueMode();
    renderChatMode();
    renderSortMode();
    renderIncidentMode();
    setMode(state.activeMode);
    bindEvents();
  }

  init();
})();
