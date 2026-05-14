(() => {
  "use strict";

  const STORAGE_KEY = "cybershield_demo_v1";
  const SUMMER_START = new Date(2026, 5, 1);
  const SUMMER_END = new Date(2026, 7, 31);

  const MODE_INFO = {
    chat: { label: "Симулятор переписки", emoji: "💬", reward: 14 },
    clues: { label: "Поиск улик", emoji: "🔎", reward: 12 },
    operations: { label: "Операция штаба", emoji: "🎯", reward: 10 }
  };

  const RANKS = [
    { min: 0, name: "Курсант" },
    { min: 120, name: "Оператор" },
    { min: 280, name: "Аналитик" },
    { min: 520, name: "Инструктор" },
    { min: 900, name: "Кибер-страж" }
  ];

  const CHAT_STEPS = [
    {
      incoming: "Привет. Я модератор платформы. Срочно пришли код из SMS, иначе аккаунт удалим.",
      options: [
        { text: "Хорошо, сейчас отправлю код.", ok: false, feedback: "Нельзя передавать коды подтверждения." },
        { text: "Не передаю код. Проверю информацию через официальный канал поддержки.", ok: true, feedback: "Верно: сначала верификация канала." },
        { text: "Игнорирую всё и молча выхожу.", ok: false, feedback: "Лучше зафиксировать и пожаловаться." }
      ]
    },
    {
      incoming: "Тогда перейди по ссылке http://safe-help-login.ru и подтверди вход.",
      options: [
        { text: "Открою ссылку, если страница похожа на настоящую.", ok: false, feedback: "Внешний вид не гарантирует безопасность." },
        { text: "Проверю домен и не открою ссылку из чата, зайду через официальный сайт вручную.", ok: true, feedback: "Отлично: ручной вход через официальный домен." },
        { text: "Попрошу друга проверить ссылку вместо меня.", ok: false, feedback: "Риск передаётся другому, это не решение." }
      ]
    },
    {
      incoming: "Мы можем ускорить проверку, пришли фото карты и CVV.",
      options: [
        { text: "Это мошенничество: никакие карты и CVV не отправляю.", ok: true, feedback: "Верно: финансовые данные нельзя передавать." },
        { text: "Закрою глаза и отправлю только номер карты.", ok: false, feedback: "Любые данные карты опасны." },
        { text: "Отправлю часть данных, без CVV.", ok: false, feedback: "Частичная передача тоже опасна." }
      ]
    },
    {
      incoming: "Последний шанс: у тебя 60 секунд, иначе бан.",
      options: [
        { text: "Сообщаю о переписке в поддержку и ставлю двухфакторную защиту.", ok: true, feedback: "Отличный финал: фиксация инцидента и защита." },
        { text: "В панике отправлю всё, что просят.", ok: false, feedback: "Паника — главный союзник мошенника." },
        { text: "Промолчу и ничего не буду делать.", ok: false, feedback: "Нужно ещё и сообщить о мошенничестве." }
      ]
    }
  ];

  const CLUES = [
    { id: "from", anchorId: "clue-anchor-from", tip: "Подмена домена отправителя" },
    { id: "http", anchorId: "clue-anchor-http", tip: "Небезопасная ссылка (http)" },
    { id: "urgent", anchorId: "clue-anchor-urgent", tip: "Давление срочностью" },
    { id: "sms", anchorId: "clue-anchor-sms", tip: "Запрос кода из SMS" },
    { id: "delete", anchorId: "clue-anchor-delete", tip: "Угроза удаления аккаунта" }
  ];

  const OPS_CARDS = [
    { title: "Инцидент дня", text: "Короткая миссия на реальную ситуацию из сети." },
    { title: "Тренировка реакции", text: "Быстрые решения под давлением времени и фейковых угроз." },
    { title: "Командный зачёт", text: "В будущем: рейтинг класса и общая защита школы." }
  ];

  const OPS_SEQUENCE = [
    "Отключить сессию и не вводить данные повторно",
    "Проверить активные входы и сменить пароль",
    "Включить 2FA и сообщить в поддержку"
  ];

  const runtime = {
    tg: null,
    userId: 0,
    initData: "",
    syncUrl: "",
    stateUrl: "",
    leaderboardUrl: "",
    resetUrl: "",
    role: "player",
    adminMode: false,
    testerMode: false,
    inRating: true,
    allowed: true,
    serverToken: 0,
    connected: false
  };

  const el = {
    todayChip: document.getElementById("todayChip"),
    missionTitle: document.getElementById("missionTitle"),
    missionDescription: document.getElementById("missionDescription"),
    missionModeTag: document.getElementById("missionModeTag"),
    missionRewardTag: document.getElementById("missionRewardTag"),
    missionWeekTag: document.getElementById("missionWeekTag"),
    rankValue: document.getElementById("rankValue"),
    xpValue: document.getElementById("xpValue"),
    streakValue: document.getElementById("streakValue"),
    startMissionBtn: document.getElementById("startMissionBtn"),
    shareBtn: document.getElementById("shareBtn"),

    tabs: Array.from(document.querySelectorAll(".tab")),
    panels: {
      operations: document.getElementById("tab-operations"),
      chat: document.getElementById("tab-chat"),
      clues: document.getElementById("tab-clues")
    },
    opsPaneButtons: Array.from(document.querySelectorAll(".ops-pane-btn")),
    opsPanes: {
      mission: document.getElementById("ops-pane-mission"),
      progress: document.getElementById("ops-pane-progress"),
      leaderboard: document.getElementById("ops-pane-leaderboard")
    },

    opsGrid: document.getElementById("opsGrid"),
    progressText: document.getElementById("progressText"),
    progressFill: document.getElementById("progressFill"),
    progressHint: document.getElementById("progressHint"),
    opsActionButtons: document.getElementById("opsActionButtons"),
    opsSequenceState: document.getElementById("opsSequenceState"),
    opsCheckBtn: document.getElementById("opsCheckBtn"),
    opsResetBtn: document.getElementById("opsResetBtn"),
    opsCompleteBtn: document.getElementById("opsCompleteBtn"),
    opsResult: document.getElementById("opsResult"),

    chatLog: document.getElementById("chatLog"),
    chatChoices: document.getElementById("chatChoices"),
    riskValue: document.getElementById("riskValue"),
    chatResult: document.getElementById("chatResult"),
    chatResetBtn: document.getElementById("chatResetBtn"),
    chatCompleteBtn: document.getElementById("chatCompleteBtn"),

    clueBoard: document.getElementById("clueBoard"),
    clueCounter: document.getElementById("clueCounter"),
    clueCheckBtn: document.getElementById("clueCheckBtn"),
    clueResetBtn: document.getElementById("clueResetBtn"),
    clueResult: document.getElementById("clueResult"),

    serverRoleTag: document.getElementById("serverRoleTag"),
    serverStatusValue: document.getElementById("serverStatusValue"),
    serverRatingValue: document.getElementById("serverRatingValue"),
    serverSolvedValue: document.getElementById("serverSolvedValue"),
    serverStreakValue: document.getElementById("serverStreakValue"),
    serverRefreshBtn: document.getElementById("serverRefreshBtn"),
    serverResetBtn: document.getElementById("serverResetBtn"),
    serverResult: document.getElementById("serverResult"),

    leaderboardMeta: document.getElementById("leaderboardMeta"),
    leaderboardBody: document.getElementById("leaderboardBody"),
    leaderboardRefreshBtn: document.getElementById("leaderboardRefreshBtn")
  };

  const state = {
    mission: null,
    tab: "operations",
    opsPane: "mission",
    progress: loadProgress(),
    ops: { picked: [], passed: false, order: [] },
    chat: { step: 0, risk: 0, completed: false },
    clues: { found: new Set(), completed: false },
    leaderboard: []
  };

  let syncTimer = null;
  let syncInFlight = false;

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function fmtDate(date) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${d}.${m}.${date.getFullYear()}`;
  }

  function safeDecode(value) {
    if (!value || typeof value !== "string") return "";
    try {
      return decodeURIComponent(value);
    } catch (_err) {
      return value;
    }
  }

  function parseStartPayload() {
    let raw = "";
    try {
      if (runtime.tg && runtime.tg.initDataUnsafe && runtime.tg.initDataUnsafe.start_param) {
        raw = String(runtime.tg.initDataUnsafe.start_param || "");
      }
    } catch (_err) {
      raw = "";
    }
    if (!raw) {
      const qs = new URLSearchParams(window.location.search);
      raw = qs.get("tgWebAppStartParam") || qs.get("startapp") || qs.get("startApp") || "";
    }
    if (!raw) return {};
    const candidates = [raw, safeDecode(raw)];
    for (const item of candidates) {
      if (!item) continue;
      try {
        const parsed = JSON.parse(item);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (_err) {
        /* noop */
      }
    }
    return {};
  }

  function initRuntime() {
    runtime.tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
    if (runtime.tg) {
      try { runtime.tg.ready(); } catch (_err) { /* noop */ }
      try { runtime.tg.expand(); } catch (_err) { /* noop */ }
      runtime.initData = runtime.tg.initData || "";
      runtime.userId = Number(runtime.tg.initDataUnsafe?.user?.id || 0);
    }
    const payload = parseStartPayload();
    applyStartPayload(payload);
    if (!runtime.userId && payload && payload.me && payload.me.uid) {
      runtime.userId = Number(payload.me.uid || 0);
    }
  }

  function applyStartPayload(payload) {
    if (!payload || typeof payload !== "object") return;

    runtime.syncUrl = String(payload.sync_url || runtime.syncUrl || "");
    runtime.stateUrl = String(payload.state_url || runtime.stateUrl || "");
    runtime.leaderboardUrl = String(payload.leaderboard_url || runtime.leaderboardUrl || "");
    runtime.resetUrl = String(payload.reset_url || runtime.resetUrl || "");

    if (!runtime.stateUrl && runtime.syncUrl.includes("/cyber_sync")) {
      runtime.stateUrl = runtime.syncUrl.replace("/cyber_sync", "/cyber_state");
    }
    if (!runtime.leaderboardUrl && runtime.syncUrl.includes("/cyber_sync")) {
      runtime.leaderboardUrl = runtime.syncUrl.replace("/cyber_sync", "/cyber_leaderboard");
    }
    if (!runtime.resetUrl && runtime.syncUrl.includes("/cyber_sync")) {
      runtime.resetUrl = runtime.syncUrl.replace("/cyber_sync", "/cyber_reset");
    }

    if (payload.role) runtime.role = String(payload.role);
    runtime.adminMode = payload.admin_mode === true || runtime.role === "admin";
    runtime.testerMode = payload.tester_mode === true || runtime.role === "tester";
    runtime.inRating = payload.in_rating !== false && runtime.role === "player";
    runtime.allowed = payload.allowed !== false;

    if (payload.me && typeof payload.me === "object") {
      applyServerMe(payload.me, true);
      if (Number(payload.me.reset_token || 0) > 0) {
        runtime.serverToken = Number(payload.me.reset_token || 0);
      }
      if (payload.me.role) runtime.role = String(payload.me.role);
    } else if (Number(payload.reset_token || 0) > 0) {
      runtime.serverToken = Number(payload.reset_token || 0);
    }

    if (Array.isArray(payload.lb)) {
      state.leaderboard = payload.lb.map((row) => ({
        uid: String(row.uid || row.user_id || ""),
        name: String(row.name || "Игрок"),
        xp: Number(row.xp || row.total_xp || 0),
        solved: Number(row.solved || row.solved_count || 0),
        streak: Number(row.streak || 0),
        role: String(row.role || "player")
      }));
    }
  }

  function getSummerDayIndex(date) {
    const start = new Date(SUMMER_START.getFullYear(), SUMMER_START.getMonth(), SUMMER_START.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = Math.floor((target - start) / 86400000);
    return clamp(diff + 1, 1, 92);
  }

  function buildMission(date = new Date()) {
    const dayIndex = getSummerDayIndex(date);
    const week = Math.floor((dayIndex - 1) / 7) + 1;
    const cycle = dayIndex % 3;
    const mode = cycle === 1 ? "chat" : cycle === 2 ? "clues" : "operations";
    const reward = MODE_INFO[mode].reward + Math.floor(week / 2);

    return {
      id: `CS-${String(dayIndex).padStart(3, "0")}`,
      dayIndex,
      week,
      mode,
      reward,
      title: `Операция #${dayIndex}: ${MODE_INFO[mode].label}`,
      description: `Летний кибертренинг, неделя ${week}. Режим: ${MODE_INFO[mode].label}.`
    };
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { xp: 0, streak: 0, solved: {} };
      const parsed = JSON.parse(raw);
      return {
        xp: Number(parsed.xp || 0),
        streak: Number(parsed.streak || 0),
        solved: parsed.solved && typeof parsed.solved === "object" ? parsed.solved : {}
      };
    } catch (_err) {
      return { xp: 0, streak: 0, solved: {} };
    }
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  }

  function solvedCount() {
    return Object.keys(state.progress.solved || {}).length;
  }

  function getRank(xp) {
    let rank = RANKS[0].name;
    for (const r of RANKS) {
      if (xp >= r.min) rank = r.name;
    }
    return rank;
  }

  function isMissionSolved() {
    return Boolean(state.progress.solved[state.mission.id]);
  }

  function applyServerMe(me, force = false) {
    if (!me || typeof me !== "object") return;

    const serverXp = Math.max(0, Number(me.xp || me.total_xp || 0));
    const serverStreak = Math.max(0, Number(me.streak || 0));
    const progressJson = me.progress_json && typeof me.progress_json === "object" ? me.progress_json : {};
    const solvedMap = progressJson.solved && typeof progressJson.solved === "object" ? progressJson.solved : {};
    const serverSolvedCount = Math.max(0, Number(me.solved_count || me.solved || 0));

    if (force || serverXp >= state.progress.xp) {
      state.progress.xp = serverXp;
    }
    if (force || serverStreak >= state.progress.streak) {
      state.progress.streak = serverStreak;
    }
    if (force && serverSolvedCount === 0) {
      state.progress.solved = {};
    }
    if (Object.keys(solvedMap).length > 0 && (force || serverSolvedCount >= solvedCount())) {
      state.progress.solved = solvedMap;
    }

    if (me.role) runtime.role = String(me.role);
    runtime.adminMode = me.admin_mode === true || runtime.role === "admin";
    runtime.testerMode = me.tester_mode === true || runtime.role === "tester";
    runtime.inRating = me.in_rating !== false && runtime.role === "player";
    if (Number(me.reset_token || 0) > 0) {
      runtime.serverToken = Number(me.reset_token || 0);
    }
    saveProgress();
  }

  function markServerResult(text, tone = "") {
    if (!el.serverResult) return;
    el.serverResult.textContent = text;
    el.serverResult.className = "result" + (tone ? ` ${tone}` : "");
  }

  function renderHero() {
    const today = new Date();
    const inSummer = today >= SUMMER_START && today <= SUMMER_END;
    el.todayChip.textContent = inSummer
      ? `Сегодня: ${fmtDate(today)} · Летний режим`
      : `Демо-день: ${fmtDate(today)}`;

    el.missionTitle.textContent = state.mission.title;
    el.missionDescription.textContent = state.mission.description;
    el.missionModeTag.textContent = `${MODE_INFO[state.mission.mode].emoji} ${MODE_INFO[state.mission.mode].label}`;
    el.missionRewardTag.textContent = `Награда: +${state.mission.reward} XP`;
    el.missionWeekTag.textContent = `Неделя ${state.mission.week}`;

    el.rankValue.textContent = getRank(state.progress.xp);
    el.xpValue.textContent = String(state.progress.xp);
    el.streakValue.textContent = String(state.progress.streak);

    el.startMissionBtn.textContent = isMissionSolved() ? "Операция уже выполнена" : "Начать операцию";
    el.startMissionBtn.disabled = !runtime.allowed || isMissionSolved();
  }

  function renderProgress() {
    const solved = solvedCount();
    const total = 92;
    const pct = clamp(Math.round((solved / total) * 100), 0, 100);

    el.progressText.textContent = `${solved}/${total} операций · ${pct}%`;
    el.progressFill.style.width = `${pct}%`;

    if (solved === 0) {
      el.progressHint.textContent = "Пройди первую операцию и получи стартовый ранг.";
    } else {
      el.progressHint.textContent = `Текущая серия: ${state.progress.streak}. До следующего ранга осталось ${Math.max(0, 120 - (state.progress.xp % 120))} XP.`;
    }
  }

  function renderServerProgress() {
    const roleText = runtime.role === "admin" ? "👑 admin" : runtime.role === "tester" ? "🧪 tester" : "🎮 player";
    el.serverRoleTag.textContent = roleText;
    el.serverStatusValue.textContent = runtime.allowed ? (runtime.connected ? "online" : "local") : "закрыто";
    el.serverRatingValue.textContent = runtime.inRating ? "да" : "нет";
    el.serverSolvedValue.textContent = String(solvedCount());
    el.serverStreakValue.textContent = String(state.progress.streak);
    el.serverResetBtn.style.display = runtime.role === "admin" ? "inline-flex" : "none";
  }

  function renderLeaderboard() {
    const rows = Array.isArray(state.leaderboard) ? state.leaderboard : [];
    el.leaderboardMeta.textContent = `${rows.length} участников`;
    if (!rows.length) {
      el.leaderboardBody.innerHTML = `<tr><td colspan="5" class="muted">Пока нет игроков с очками.</td></tr>`;
      return;
    }
    const myUid = runtime.userId > 0 ? String(runtime.userId) : "";
    el.leaderboardBody.innerHTML = rows.map((row, idx) => {
      const isMe = myUid && String(row.uid) === myUid;
      const roleMark = row.role === "admin" ? "👑" : row.role === "tester" ? "🧪" : "";
      return `
        <tr class="${isMe ? "leaderboard-me" : ""}">
          <td>${idx + 1}</td>
          <td>${row.name}${isMe ? " 👈" : ""} ${roleMark ? `<span class="leaderboard-role">${roleMark}</span>` : ""}</td>
          <td>${row.xp}</td>
          <td>${row.solved}</td>
          <td>${row.streak}</td>
        </tr>
      `;
    }).join("");
  }

  function renderOperations() {
    el.opsGrid.innerHTML = OPS_CARDS.map((card) => (
      `<article class="op-card"><h4>${card.title}</h4><p>${card.text}</p></article>`
    )).join("");
    renderOpsDrill();
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function updateOpsSequenceText() {
    if (!state.ops.picked.length) {
      el.opsSequenceState.textContent = "Последовательность: пока пусто";
      return;
    }
    el.opsSequenceState.textContent = `Последовательность: ${state.ops.picked.join(" → ")}`;
  }

  function renderOpsDrill() {
    state.ops.order = shuffle(OPS_SEQUENCE);
    state.ops.picked = [];
    state.ops.passed = false;
    el.opsCompleteBtn.disabled = true;
    el.opsResult.textContent = "Собери последовательность, затем нажми «Проверить порядок».";
    el.opsResult.className = "result";
    el.opsActionButtons.innerHTML = "";
    updateOpsSequenceText();

    state.ops.order.forEach((step) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ops-action";
      btn.textContent = step;
      btn.addEventListener("click", () => {
        if (state.ops.picked.includes(step)) return;
        state.ops.picked.push(step);
        btn.disabled = true;
        updateOpsSequenceText();
      });
      el.opsActionButtons.appendChild(btn);
    });
  }

  function resetOpsDrill() {
    renderOpsDrill();
  }

  function checkOpsDrill() {
    if (state.ops.picked.length !== OPS_SEQUENCE.length) {
      el.opsResult.textContent = "Нужно выбрать все шаги, чтобы проверить порядок.";
      el.opsResult.className = "result warn";
      return;
    }

    const ok = OPS_SEQUENCE.every((step, idx) => step === state.ops.picked[idx]);
    if (ok) {
      state.ops.passed = true;
      el.opsCompleteBtn.disabled = false;
      el.opsResult.textContent = "Верно! Порядок действий правильный. Можно зачесть операцию.";
      el.opsResult.className = "result good";
      return;
    }

    state.ops.passed = false;
    el.opsCompleteBtn.disabled = true;
    el.opsResult.textContent = "Есть ошибка в порядке. Сбрось выбор и попробуй ещё раз.";
    el.opsResult.className = "result bad";
  }

  function pushMsg(text, role = "them", extraClass = "") {
    const bubble = document.createElement("div");
    bubble.className = `msg ${role}${extraClass ? ` ${extraClass}` : ""}`;
    bubble.textContent = text;
    el.chatLog.appendChild(bubble);
    el.chatLog.scrollTop = el.chatLog.scrollHeight;
  }

  function pushTurnSeparator(turn) {
    const sep = document.createElement("div");
    sep.className = "chat-turn-sep";
    sep.textContent = `Шаг ${turn} из ${CHAT_STEPS.length}`;
    el.chatLog.appendChild(sep);
    el.chatLog.scrollTop = el.chatLog.scrollHeight;
  }

  function resetChat() {
    state.chat.step = 0;
    state.chat.risk = 0;
    state.chat.completed = false;
    el.chatLog.innerHTML = "";
    el.chatChoices.innerHTML = "";
    el.chatResult.textContent = "Пройди диалог до конца, чтобы получить оценку.";
    el.chatResult.className = "result";
    el.chatCompleteBtn.disabled = true;
    updateRisk();
    pushMsg("Тренировка началась. Смотри на признаки мошенничества и выбирай безопасные действия.", "coach");
    renderChatStep();
  }

  function updateRisk() {
    el.riskValue.textContent = `${state.chat.risk}%`;
  }

  function renderChatStep() {
    const step = CHAT_STEPS[state.chat.step];
    if (!step) {
      state.chat.completed = true;
      const quality = state.chat.risk <= 20 ? 1.4 : state.chat.risk <= 50 ? 1.1 : 0.85;
      const msg = state.chat.risk <= 20
        ? "Отлично: риск минимален, решения профессиональные."
        : state.chat.risk <= 50
        ? "Хорошо: инцидент сдержан, но есть зоны риска."
        : "Инцидент закрыт с потерями. Перепройди для лучшего результата.";
      el.chatResult.textContent = `${msg} Нажми «Зачесть операцию».`;
      el.chatResult.className = state.chat.risk <= 20 ? "result good" : state.chat.risk <= 50 ? "result warn" : "result bad";
      el.chatChoices.innerHTML = "";
      el.chatCompleteBtn.disabled = false;
      el.chatCompleteBtn.dataset.quality = String(quality);
      return;
    }

    pushTurnSeparator(state.chat.step + 1);
    pushMsg(step.incoming, "them");
    el.chatChoices.innerHTML = "";

    step.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = opt.text;
      btn.addEventListener("click", () => {
        Array.from(el.chatChoices.querySelectorAll("button")).forEach((b) => { b.disabled = true; });
        pushMsg(opt.text, "you");
        if (!opt.ok) {
          state.chat.risk = clamp(state.chat.risk + 26, 0, 100);
        } else {
          state.chat.risk = clamp(state.chat.risk - 5, 0, 100);
        }
        updateRisk();
        pushMsg(
          opt.ok ? `✅ ${opt.feedback}` : `⚠️ ${opt.feedback}`,
          "coach",
          opt.ok ? "ok" : "bad"
        );
        state.chat.step += 1;
        setTimeout(() => {
          renderChatStep();
        }, 260);
      });
      el.chatChoices.appendChild(btn);
    });
  }

  function placeHotspots() {
    el.clueBoard.querySelectorAll(".hotspot").forEach((n) => n.remove());
    const boardRect = el.clueBoard.getBoundingClientRect();

    CLUES.forEach((clue) => {
      const anchor = document.getElementById(clue.anchorId);
      if (!anchor) return;

      const anchorRect = anchor.getBoundingClientRect();
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "hotspot";
      dot.title = `Отметить улику: ${clue.tip}`;
      dot.dataset.id = clue.id;

      const dotSize = 20;
      let left = (anchorRect.right - boardRect.left) + 6;
      let top = (anchorRect.top - boardRect.top) + (anchorRect.height / 2) - (dotSize / 2);

      if (left > boardRect.width - dotSize - 6) {
        left = (anchorRect.left - boardRect.left) - dotSize - 6;
      }
      left = clamp(left, 4, boardRect.width - dotSize - 4);
      top = clamp(top, 4, boardRect.height - dotSize - 4);

      dot.style.left = `${left}px`;
      dot.style.top = `${top}px`;
      dot.addEventListener("click", () => {
        if (state.clues.found.has(clue.id)) {
          state.clues.found.delete(clue.id);
          dot.classList.remove("marked");
        } else {
          state.clues.found.add(clue.id);
          dot.classList.add("marked");
        }
        updateClueCounter();
      });
      el.clueBoard.appendChild(dot);
    });
  }

  function syncHotspotMarks() {
    el.clueBoard.querySelectorAll(".hotspot").forEach((dot) => {
      dot.classList.toggle("marked", state.clues.found.has(dot.dataset.id));
    });
  }

  function updateClueCounter() {
    el.clueCounter.textContent = `Найдено: ${state.clues.found.size}/${CLUES.length}`;
  }

  function resetClues() {
    state.clues.found.clear();
    state.clues.completed = false;
    el.clueBoard.querySelectorAll(".hotspot").forEach((d) => d.classList.remove("marked"));
    updateClueCounter();
    el.clueResult.textContent = "Отметь улики, затем нажми «Проверить улики».";
    el.clueResult.className = "result";
  }

  function checkClues() {
    const found = state.clues.found.size;
    const all = CLUES.length;

    if (found === all) {
      state.clues.completed = true;
      el.clueResult.textContent = "Точно! Все улики обнаружены. Можно зачесть операцию.";
      el.clueResult.className = "result good";
    } else if (found >= 3) {
      el.clueResult.textContent = `Почти: найдено ${found}/${all}. Проверь домен, ссылку и признаки давления.`;
      el.clueResult.className = "result warn";
    } else {
      el.clueResult.textContent = "Слишком мало улик. Ищи подмену домена, небезопасную ссылку и запрос SMS-кода.";
      el.clueResult.className = "result bad";
    }
  }

  function addMissionReward(source, quality = 1) {
    if (!runtime.allowed) {
      return { ok: false, msg: "Доступ к игре сейчас закрыт по режиму администратора." };
    }
    if (isMissionSolved()) {
      return { ok: false, msg: "Эта операция уже зачтена сегодня." };
    }

    const base = state.mission.reward;
    const bonus = Math.round(base * quality);
    state.progress.solved[state.mission.id] = { source, date: new Date().toISOString(), xp: bonus };
    state.progress.xp += bonus;
    state.progress.streak += 1;
    saveProgress();
    renderHero();
    renderProgress();
    renderServerProgress();
    queueSync(`reward:${source}`);
    return { ok: true, msg: `Операция зачтена: +${bonus} XP.` };
  }

  function setTab(tab) {
    state.tab = tab;
    for (const [name, panel] of Object.entries(el.panels)) {
      panel.classList.toggle("active", name === tab);
    }
    el.tabs.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));

    if (tab === "clues") {
      requestAnimationFrame(() => {
        placeHotspots();
        syncHotspotMarks();
      });
    }
  }

  function setOpsPane(pane) {
    const nextPane = Object.prototype.hasOwnProperty.call(el.opsPanes, pane) ? pane : "mission";
    state.opsPane = nextPane;
    for (const [name, panel] of Object.entries(el.opsPanes)) {
      if (!panel) continue;
      panel.classList.toggle("active", name === nextPane);
    }
    el.opsPaneButtons.forEach((btn) => {
      const active = btn.dataset.opsPane === nextPane;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function buildGetUrl(baseUrl) {
    const url = new URL(baseUrl, window.location.origin);
    if (runtime.userId > 0) url.searchParams.set("user_id", String(runtime.userId));
    if (runtime.initData) url.searchParams.set("init_data", runtime.initData);
    return url.toString();
  }

  async function refreshServerState(force = false) {
    if (!runtime.stateUrl || runtime.userId <= 0) {
      runtime.connected = false;
      renderServerProgress();
      return;
    }
    try {
      const resp = await fetch(buildGetUrl(runtime.stateUrl), { method: "GET", cache: "no-store" });
      if (!resp.ok) {
        markServerResult(`Не удалось получить состояние (${resp.status}).`, "warn");
        runtime.connected = false;
        renderServerProgress();
        return;
      }
      const data = await resp.json();
      if (!data || data.ok !== true) {
        markServerResult("Сервер вернул некорректный ответ состояния.", "warn");
        runtime.connected = false;
        renderServerProgress();
        return;
      }
      runtime.connected = true;
      runtime.allowed = data.allowed !== false;
      runtime.role = String(data.role || runtime.role || "player");
      runtime.adminMode = data.admin_mode === true || runtime.role === "admin";
      runtime.testerMode = data.tester_mode === true || runtime.role === "tester";
      runtime.inRating = data.in_rating !== false && runtime.role === "player";
      runtime.serverToken = Number(data.reset_token || runtime.serverToken || 0);
      if (data.me && typeof data.me === "object") {
        applyServerMe(data.me, force);
      }
      if (Array.isArray(data.leaderboard)) {
        state.leaderboard = data.leaderboard.map((row) => ({
          uid: String(row.uid || row.user_id || ""),
          name: String(row.name || "Игрок"),
          xp: Number(row.xp || row.total_xp || 0),
          solved: Number(row.solved || row.solved_count || 0),
          streak: Number(row.streak || 0),
          role: String(row.role || "player")
        }));
      }
      renderHero();
      renderProgress();
      renderServerProgress();
      renderLeaderboard();
      markServerResult(
        runtime.allowed
          ? "Серверный прогресс синхронизирован."
          : "Игра закрыта администратором. Просмотр доступен, зачёт операций временно отключён.",
        runtime.allowed ? "good" : "warn"
      );
    } catch (_err) {
      runtime.connected = false;
      renderServerProgress();
      markServerResult("Сервер недоступен. Используется локальный режим.", "warn");
    }
  }

  async function refreshLeaderboard() {
    if (!runtime.leaderboardUrl || runtime.userId <= 0) {
      renderLeaderboard();
      return;
    }
    try {
      const resp = await fetch(buildGetUrl(runtime.leaderboardUrl), { method: "GET", cache: "no-store" });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data || data.ok !== true || !Array.isArray(data.leaderboard)) return;
      state.leaderboard = data.leaderboard.map((row) => ({
        uid: String(row.uid || row.user_id || ""),
        name: String(row.name || "Игрок"),
        xp: Number(row.xp || row.total_xp || 0),
        solved: Number(row.solved || row.solved_count || 0),
        streak: Number(row.streak || 0),
        role: String(row.role || "player")
      }));
      runtime.connected = true;
      renderServerProgress();
      renderLeaderboard();
    } catch (_err) {
      /* noop */
    }
  }

  async function syncToServer(reason = "sync") {
    if (!runtime.syncUrl || runtime.userId <= 0) return;
    if (syncInFlight) return;
    syncInFlight = true;
    try {
      const payload = {
        type: "sync",
        reason,
        user_id: String(runtime.userId),
        user_name: runtime.tg?.initDataUnsafe?.user?.first_name || "Игрок",
        init_data: runtime.initData || "",
        total_xp: Math.max(0, Number(state.progress.xp || 0)),
        solved_count: solvedCount(),
        streak: Math.max(0, Number(state.progress.streak || 0)),
        progress_json: { solved: state.progress.solved || {} },
        reset_token: Number(runtime.serverToken || 0)
      };
      const resp = await fetch(runtime.syncUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data || data.ok !== true) {
        if (data && (data.stale === true || data.reset_required === true)) {
          if (Number(data.db_reset_token || 0) > 0) runtime.serverToken = Number(data.db_reset_token || 0);
          await refreshServerState(true);
          markServerResult("Сервер запросил обновление состояния (после сброса).", "warn");
          return;
        }
        markServerResult("Синхронизация не принята сервером.", "warn");
        return;
      }
      runtime.connected = true;
      if (Number(data.db_reset_token || 0) > 0) runtime.serverToken = Number(data.db_reset_token || 0);
      if (data.saved) {
        state.progress.xp = Math.max(state.progress.xp, Number(data.saved.xp || 0));
        state.progress.streak = Math.max(state.progress.streak, Number(data.saved.streak || 0));
        saveProgress();
      }
      renderHero();
      renderProgress();
      renderServerProgress();
      markServerResult("Прогресс сохранён на сервере.", "good");
    } catch (_err) {
      markServerResult("Ошибка синхронизации. Прогресс остаётся локально.", "warn");
    } finally {
      syncInFlight = false;
    }
  }

  function queueSync(reason = "sync") {
    if (syncTimer) {
      clearTimeout(syncTimer);
    }
    syncTimer = setTimeout(() => {
      syncToServer(reason);
    }, 300);
  }

  async function resetProgressOnServer() {
    if (!runtime.resetUrl || runtime.userId <= 0) {
      markServerResult("Серверный сброс недоступен в этом режиме.", "warn");
      return;
    }
    if (runtime.role !== "admin") {
      markServerResult("Сброс разрешён только роли admin Киберщита.", "warn");
      return;
    }
    if (!window.confirm("Сбросить прогресс Киберщита? Это действие необратимо.")) return;
    try {
      const resp = await fetch(runtime.resetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: String(runtime.userId),
          init_data: runtime.initData || "",
          reset_token: Number(runtime.serverToken || 0)
        })
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data || data.ok !== true) {
        markServerResult("Сервер отклонил сброс прогресса.", "warn");
        return;
      }
      state.progress = { xp: 0, streak: 0, solved: {} };
      saveProgress();
      await refreshServerState(true);
      renderHero();
      renderProgress();
      renderServerProgress();
      renderLeaderboard();
      markServerResult("Прогресс сброшен и синхронизирован.", "good");
    } catch (_err) {
      markServerResult("Не удалось выполнить сброс прогресса.", "warn");
    }
  }

  function hookEvents() {
    el.tabs.forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.dataset.tab));
    });

    el.opsPaneButtons.forEach((btn) => {
      btn.addEventListener("click", () => setOpsPane(btn.dataset.opsPane));
    });

    el.startMissionBtn.addEventListener("click", () => {
      if (state.mission.mode === "chat") {
        setTab("chat");
        return;
      }
      if (state.mission.mode === "clues") {
        setTab("clues");
        return;
      }
      setTab("operations");
      setOpsPane("mission");
    });

    el.shareBtn.addEventListener("click", async () => {
      const text = `Киберщит: ${state.mission.title} | XP: ${state.progress.xp} | Ранг: ${getRank(state.progress.xp)}`;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          alert("Карточка результата скопирована в буфер обмена.");
        } else {
          alert(text);
        }
      } catch (_err) {
        alert(text);
      }
    });

    el.chatResetBtn.addEventListener("click", resetChat);
    el.chatCompleteBtn.addEventListener("click", () => {
      if (!state.chat.completed) return;
      const quality = Number(el.chatCompleteBtn.dataset.quality || 1);
      const result = addMissionReward("chat", quality);
      el.chatResult.textContent = result.msg;
      el.chatResult.className = result.ok ? "result good" : "result warn";
      if (result.ok) {
        el.chatCompleteBtn.disabled = true;
      }
    });

    el.clueCheckBtn.addEventListener("click", checkClues);
    el.clueResetBtn.addEventListener("click", resetClues);

    el.opsCheckBtn.addEventListener("click", checkOpsDrill);
    el.opsResetBtn.addEventListener("click", resetOpsDrill);
    el.opsCompleteBtn.addEventListener("click", () => {
      if (!state.ops.passed) {
        el.opsResult.textContent = "Сначала пройди проверку порядка действий.";
        el.opsResult.className = "result warn";
        return;
      }
      const result = addMissionReward("operations", 1.15);
      el.opsResult.textContent = result.msg;
      el.opsResult.className = result.ok ? "result good" : "result warn";
      if (result.ok) {
        el.opsCompleteBtn.disabled = true;
        setOpsPane("progress");
      }
    });

    el.clueCheckBtn.insertAdjacentElement("afterend", (() => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary";
      btn.textContent = "Зачесть операцию";
      btn.addEventListener("click", () => {
        if (!state.clues.completed) {
          el.clueResult.textContent = "Сначала найди все улики и проверь результат.";
          el.clueResult.className = "result warn";
          return;
        }
        const result = addMissionReward("clues", 1.2);
        el.clueResult.textContent = result.msg;
        el.clueResult.className = result.ok ? "result good" : "result warn";
      });
      return btn;
    })());

    el.serverRefreshBtn.addEventListener("click", () => refreshServerState(true));
    el.serverResetBtn.addEventListener("click", resetProgressOnServer);
    el.leaderboardRefreshBtn.addEventListener("click", refreshLeaderboard);
  }

  function init() {
    initRuntime();
    state.mission = buildMission(new Date());
    renderHero();
    renderOperations();
    renderProgress();
    renderServerProgress();
    renderLeaderboard();
    resetChat();
    placeHotspots();
    updateClueCounter();
    hookEvents();
    setOpsPane("mission");

    window.addEventListener("resize", () => {
      placeHotspots();
      syncHotspotMarks();
    });

    refreshServerState(true);
    refreshLeaderboard();
  }

  init();
})();
