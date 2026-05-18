(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  const params = new URLSearchParams(window.location.search);
  const decodeMaybe = (value) => {
    if (!value) return "";
    let out = String(value);
    try { out = decodeURIComponent(out); } catch {}
    try {
      const second = decodeURIComponent(out);
      if (second.includes("http") || second.includes("/")) out = second;
    } catch {}
    return out;
  };

  const cfg = {
    userId: Number(params.get("user_id") || tg?.initDataUnsafe?.user?.id || 0),
    initData: tg?.initData || decodeMaybe(params.get("init_data") || ""),
    stateUrl: decodeMaybe(params.get("state_url") || "/cyber_state"),
    syncUrl: decodeMaybe(params.get("sync_url") || "/cyber_sync"),
    leaderboardUrl: decodeMaybe(params.get("leaderboard_url") || "/cyber_leaderboard"),
    resetUrl: decodeMaybe(params.get("reset_url") || "/cyber_reset"),
    version: decodeMaybe(params.get("version") || "1.0.0"),
  };

  const EPISODES = Array.from({ length: 24 }, (_, i) => {
    const no = i + 1;
    const act = Math.ceil(no / 6);
    const names = [
      "Не открывай файл", "Сломанный аккаунт", "Чужой голос", "Кто внутри чата", "Подмена личности", "Первый след",
      "Зеркальные профили", "Давление толпы", "Ложный герой", "Тихий предатель", "Падение доверия", "Ночной протокол",
      "Слепые метаданные", "Сетка контактов", "Глубокий канал", "След в геометке", "Сторонний наблюдатель", "Лабиринт фактов",
      "Критический доступ", "Школьный шлюз", "План эвакуации", "Голосование школ", "Последняя связка", "ZERO_DAY",
    ];
    return { id: no, title: names[i], act, week: no };
  });

  const SHOP_ITEMS = [
    { id: "usb", title: "USB-руббердак", cost: 120, desc: "+10 XP при провале Terminal (1 раз)" },
    { id: "proxy", title: "VPN-прокси", cost: 160, desc: "+1 попытка в Browser-проверке" },
    { id: "badge", title: "Нашивка Отряда 404", cost: 90, desc: "Косметика профиля" },
    { id: "drone", title: "Дрон-камера", cost: 220, desc: "+15 XP за Gallery-задачу" },
  ];

  const TASKS = ["messenger", "gallery", "browser", "map", "terminal"];
  const state = {
    role: "player",
    totalXp: 0,
    solvedCount: 0,
    streak: 0,
    episode: 1,
    unlocked: 1,
    completed: {},
    inventory: {},
    resetToken: 0,
    syncTimer: null,
  };

  const el = {
    tabs: document.getElementById("tabs"),
    playerName: document.getElementById("playerName"),
    playerRole: document.getElementById("playerRole"),
    xpValue: document.getElementById("xpValue"),
    solvedValue: document.getElementById("solvedValue"),
    episodeProgress: document.getElementById("episodeProgress"),
    streakInfo: document.getElementById("streakInfo"),
    weekInfo: document.getElementById("weekInfo"),
    episodesGrid: document.getElementById("episodesGrid"),
    chatLog: document.getElementById("chatLog"),
    chatChoices: document.getElementById("chatChoices"),
    galleryBoard: document.getElementById("galleryBoard"),
    galleryCounter: document.getElementById("galleryCounter"),
    newsCards: document.getElementById("newsCards"),
    mapChoices: document.getElementById("mapChoices"),
    terminalInput: document.getElementById("terminalInput"),
    terminalHint: document.getElementById("terminalHint"),
    shopGrid: document.getElementById("shopGrid"),
    ratingList: document.getElementById("ratingList"),
    profileFacts: document.getElementById("profileFacts"),
    toast: document.getElementById("toast"),
  };

  const tabs = [
    ["episodes", "Эпизоды"],
    ["messenger", "Messenger"],
    ["gallery", "Gallery"],
    ["browser", "Browser"],
    ["map", "Map"],
    ["terminal", "Terminal"],
    ["shop", "Магазин"],
    ["rating", "Рейтинг"],
    ["profile", "Профиль"],
  ];

  const galleryHotspots = [
    { x: 76, y: 132, key: "sender" },
    { x: 436, y: 168, key: "link" },
    { x: 88, y: 208, key: "urgency" },
    { x: 410, y: 245, key: "sms" },
    { x: 122, y: 80, key: "domain" },
    { x: 280, y: 126, key: "decoy1", decoy: true },
    { x: 330, y: 220, key: "decoy2", decoy: true },
  ];
  const selectedHotspots = new Set();
  const browserCases = [
    { id: "n1", title: "\"Срочно! Школа просит пароль от дневника\"", legit: false },
    { id: "n2", title: "Новость с официального сайта школы и подписью директора", legit: true },
    { id: "n3", title: "Пост без источников: \"всем отключат аккаунты сегодня\"", legit: false },
  ];
  const browserAnswered = new Set();
  let mapSolved = false;
  let messengerSolved = false;
  let terminalSolved = false;

  function taskKey(task) { return `ep${state.episode}:${task}`; }
  function isTaskDone(task) { return Boolean(state.completed[taskKey(task)]); }

  function toast(text, mode = "ok") {
    el.toast.textContent = text;
    el.toast.className = `toast show ${mode}`;
    setTimeout(() => { el.toast.className = "toast"; }, 2200);
  }

  function renderTabs(active = "episodes") {
    el.tabs.innerHTML = "";
    tabs.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `tab-btn${id === active ? " active" : ""}`;
      b.textContent = label;
      b.addEventListener("click", () => openPanel(id));
      el.tabs.appendChild(b);
    });
  }

  function openPanel(id) {
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    document.getElementById(`panel-${id}`)?.classList.add("active");
    renderTabs(id);
    if (id === "rating") refreshRating();
  }

  function renderStats() {
    el.xpValue.textContent = `${state.totalXp} XP`;
    el.solvedValue.textContent = `заданий: ${state.solvedCount}`;
    el.streakInfo.textContent = `серия: ${state.streak}`;
    el.episodeProgress.textContent = `${Math.min(state.unlocked - 1, 24)} / 24`;
    el.weekInfo.textContent = `Неделя ${state.episode}`;
  }

  function markTaskDone(task, bonus, message) {
    const key = taskKey(task);
    if (state.completed[key]) return;
    state.completed[key] = true;
    state.totalXp += bonus;
    state.solvedCount += 1;
    toast(`+${bonus} XP · ${message}`, "ok");
    checkEpisodeComplete();
    renderStats();
    renderProfile();
    scheduleSync();
  }

  function checkEpisodeComplete() {
    const done = TASKS.every(isTaskDone);
    if (!done) return;
    const nextUnlocked = Math.max(state.unlocked, state.episode + 1);
    if (nextUnlocked !== state.unlocked) {
      state.unlocked = nextUnlocked;
      state.streak += 1;
      state.totalXp += 80;
      toast("Эпизод закрыт: +80 XP и открыт следующий", "ok");
      renderEpisodes();
    }
  }

  function renderEpisodes() {
    el.episodesGrid.innerHTML = "";
    EPISODES.forEach((ep) => {
      const card = document.createElement("article");
      const locked = ep.id > state.unlocked && state.role !== "admin";
      card.className = `episode-card${locked ? " locked" : ""}`;
      card.innerHTML = `<h3>Эпизод ${ep.id}: ${ep.title}</h3><p>Акт ${ep.act} · неделя ${ep.week}</p>`;
      const btn = document.createElement("button");
      btn.className = locked ? "ghost-btn" : "primary-btn";
      btn.textContent = locked ? "Закрыто" : (state.episode === ep.id ? "Активен" : "Запустить");
      btn.disabled = locked;
      btn.addEventListener("click", () => {
        state.episode = ep.id;
        messengerSolved = isTaskDone("messenger");
        terminalSolved = isTaskDone("terminal");
        mapSolved = isTaskDone("map");
        renderEpisodes();
        renderMessenger();
        renderBrowser();
        renderMap();
        toast(`Эпизод ${ep.id} активирован`, "ok");
      });
      card.appendChild(btn);
      el.episodesGrid.appendChild(card);
    });
  }

  function renderMessenger() {
    el.chatLog.innerHTML = "";
    el.chatChoices.innerHTML = "";
    [
      { who: "npc", text: "Марина: «Срочно открой файл invoice_final.zip и скинь код из SMS»" },
      { who: "npc", text: "Номер отправителя скрыт. Аватар и стиль сообщений отличаются от привычных." },
    ].forEach((msg) => {
      const row = document.createElement("div");
      row.className = `chat-msg ${msg.who}`;
      row.textContent = msg.text;
      el.chatLog.appendChild(row);
    });

    if (messengerSolved) {
      const done = document.createElement("div");
      done.className = "chat-msg you";
      done.textContent = "Операция уже закрыта в этом эпизоде.";
      el.chatLog.appendChild(done);
      return;
    }

    const choices = [
      { text: "Открыть файл и отправить код", good: false, xp: 0, msg: "Рискованный путь: это фишинг." },
      { text: "Попросить перезвонить и проверить личность", good: true, xp: 60, msg: "Верно: проверка личности спасла аккаунт." },
      { text: "Переслать в общий чат без проверки", good: false, xp: 0, msg: "Ошибка: усилил атаку среди одноклассников." },
    ];
    choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.className = choice.good ? "primary-btn" : "ghost-btn";
      btn.textContent = choice.text;
      btn.addEventListener("click", () => {
        messengerSolved = true;
        if (choice.good) markTaskDone("messenger", choice.xp, choice.msg);
        else toast(choice.msg, "err");
        renderMessenger();
      });
      el.chatChoices.appendChild(btn);
    });
  }

  function renderGallery() {
    el.galleryBoard.innerHTML = [
      "<p><b>От:</b> support-school@safe-mail.org</p>",
      "<p><b>Тема:</b> Срочное подтверждение аккаунта</p>",
      "<p>Здравствуйте! Для восстановления доступа к электронному дневнику срочно подтвердите данные.</p>",
      "<p>Перейдите по ссылке: <b>http://school-safe-verify.ru/login</b></p>",
      "<p>Если вы не подтвердите вход в течение 3 минут, аккаунт будет удалён.</p>",
      "<p>Также отправьте код из SMS в ответном письме для ускоренной проверки.</p>",
    ].join("");
    selectedHotspots.clear();
    galleryHotspots.forEach((spot) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hotspot";
      b.style.left = `${spot.x}px`;
      b.style.top = `${spot.y}px`;
      b.addEventListener("click", () => {
        if (selectedHotspots.has(spot.key)) {
          selectedHotspots.delete(spot.key);
          b.classList.remove("active");
        } else {
          selectedHotspots.add(spot.key);
          b.classList.add("active");
        }
        const hits = [...selectedHotspots].filter((x) => !x.startsWith("decoy")).length;
        el.galleryCounter.textContent = `${hits} / 5`;
      });
      el.galleryBoard.appendChild(b);
    });
  }

  function checkGallery() {
    if (isTaskDone("gallery")) { toast("Gallery уже выполнен в этом эпизоде", "ok"); return; }
    const good = ["sender", "link", "urgency", "sms", "domain"];
    const ok = good.every((k) => selectedHotspots.has(k)) && !selectedHotspots.has("decoy1") && !selectedHotspots.has("decoy2");
    if (ok) markTaskDone("gallery", 70, "Все улики найдены точно");
    else toast("Есть ошибки: проверь домен, срочность и запрос SMS-кода", "err");
  }

  function renderBrowser() {
    el.newsCards.innerHTML = "";
    browserCases.forEach((item) => {
      const card = document.createElement("article");
      card.className = "news-card";
      card.innerHTML = `<h4>${item.title}</h4><p class=\"muted\">${browserAnswered.has(item.id) ? "Ответ принят" : "Выбери оценку источника"}</p>`;
      const row = document.createElement("div");
      row.className = "panel-actions";
      const fake = document.createElement("button");
      fake.className = "ghost-btn";
      fake.textContent = "Фейк";
      const legit = document.createElement("button");
      legit.className = "primary-btn";
      legit.textContent = "Надежно";
      const answer = (value) => {
        if (browserAnswered.has(item.id)) return;
        browserAnswered.add(item.id);
        if (value === item.legit) {
          if (browserAnswered.size === browserCases.length) markTaskDone("browser", 65, "Фактчекинг выполнен без ошибок");
          else toast("Верно, продолжаем анализ", "ok");
        } else {
          toast("Ошибка классификации: проверь источник и формулировки", "err");
        }
        renderBrowser();
      };
      fake.addEventListener("click", () => answer(false));
      legit.addEventListener("click", () => answer(true));
      row.appendChild(fake);
      row.appendChild(legit);
      card.appendChild(row);
      el.newsCards.appendChild(card);
    });
  }

  function renderMap() {
    el.mapChoices.innerHTML = "";
    const places = [
      { title: "Школьный коридор", safe: false, risk: "Камеры и случайные свидетели." },
      { title: "Библиотека (тихая зона)", safe: true, risk: "Нейтральная локация, меньше цифрового следа." },
      { title: "ТЦ Wi-Fi фудкорт", safe: false, risk: "Открытая сеть, высокий риск перехвата." },
    ];
    places.forEach((place) => {
      const card = document.createElement("article");
      card.className = "map-item";
      card.innerHTML = `<h4>${place.title}</h4><p class=\"muted\">${place.risk}</p>`;
      const btn = document.createElement("button");
      btn.className = place.safe ? "primary-btn" : "ghost-btn";
      btn.textContent = mapSolved ? "Ответ зафиксирован" : "Выбрать";
      btn.disabled = mapSolved;
      btn.addEventListener("click", () => {
        mapSolved = true;
        if (place.safe) markTaskDone("map", 55, "Маршрут выбран с учетом приватности");
        else toast("Маршрут рискованный: высокий шанс утечки", "err");
        renderMap();
      });
      card.appendChild(btn);
      el.mapChoices.appendChild(card);
    });
  }

  function checkTerminal() {
    if (terminalSolved || isTaskDone("terminal")) { toast("Terminal уже выполнен в этом эпизоде", "ok"); return; }
    const answer = (el.terminalInput.value || "").trim().toUpperCase();
    if (!answer) return;
    if (answer === "ПРОРЫВ") {
      terminalSolved = true;
      markTaskDone("terminal", 75, "Шифр расшифрован: ПРОРЫВ");
      el.terminalInput.value = "";
    } else {
      toast("Неверно. Проверь сдвиг и раскладку", "err");
    }
  }

  function renderShop() {
    el.shopGrid.innerHTML = "";
    SHOP_ITEMS.forEach((item) => {
      const owned = Number(state.inventory[item.id] || 0);
      const card = document.createElement("article");
      card.className = "shop-item";
      card.innerHTML = `<h4>${item.title}</h4><p class=\"muted\">${item.desc}</p><p class=\"muted\">Цена: ${item.cost} XP</p><p class=\"muted\">В инвентаре: ${owned}</p>`;
      const btn = document.createElement("button");
      btn.className = "primary-btn";
      btn.textContent = "Купить";
      btn.addEventListener("click", () => {
        if (state.totalXp < item.cost) { toast("Недостаточно XP", "err"); return; }
        state.totalXp -= item.cost;
        state.inventory[item.id] = owned + 1;
        renderShop();
        renderStats();
        renderProfile();
        toast(`Покупка: ${item.title}`, "ok");
        scheduleSync();
      });
      card.appendChild(btn);
      el.shopGrid.appendChild(card);
    });
  }

  function renderProfile() {
    const done = TASKS.filter(isTaskDone).length;
    const facts = [
      `Версия клиента: ${cfg.version}`,
      `Текущий эпизод: ${state.episode}`,
      `Открыто эпизодов: ${state.unlocked}`,
      `Задач в эпизоде: ${done} / ${TASKS.length}`,
      `Роль: ${state.role}`,
      `Инвентарь: ${Object.keys(state.inventory).length ? JSON.stringify(state.inventory) : "пусто"}`,
    ];
    el.profileFacts.innerHTML = "";
    facts.forEach((fact) => {
      const row = document.createElement("div");
      row.className = "fact";
      row.textContent = fact;
      el.profileFacts.appendChild(row);
    });
  }

  async function syncState(manual = false) {
    if (!cfg.syncUrl || !cfg.userId) return;
    const payload = {
      type: "sync",
      user_id: String(cfg.userId),
      init_data: cfg.initData,
      total_xp: state.totalXp,
      solved_count: state.solvedCount,
      streak: state.streak,
      progress_json: {
        episode: state.episode,
        unlocked: state.unlocked,
        completed: state.completed,
        inventory: state.inventory,
      },
      reset_token: state.resetToken,
    };
    try {
      const response = await fetch(cfg.syncUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data?.reset_token) state.resetToken = Number(data.reset_token || 0);
      if (manual) toast("Сохранено", "ok");
    } catch {
      if (manual) toast("Ошибка сохранения", "err");
    }
  }

  function scheduleSync() {
    if (state.syncTimer) clearTimeout(state.syncTimer);
    state.syncTimer = setTimeout(() => syncState(false), 700);
  }

  async function loadRemoteState() {
    if (!cfg.stateUrl || !cfg.userId) return;
    const url = new URL(cfg.stateUrl, window.location.origin);
    url.searchParams.set("user_id", String(cfg.userId));
    if (cfg.initData) url.searchParams.set("init_data", cfg.initData);
    try {
      const response = await fetch(url.toString(), { method: "GET" });
      const data = await response.json();
      if (!data?.ok) return;
      state.role = data.role || "player";
      state.resetToken = Number(data.reset_token || 0);
      if (data.me) {
        state.totalXp = Number(data.me.xp || 0);
        state.solvedCount = Number(data.me.solved_count || 0);
        state.streak = Number(data.me.streak || 0);
        const progress = data.me.progress_json || {};
        state.episode = Number(progress.episode || 1);
        state.unlocked = Math.max(1, Number(progress.unlocked || 1));
        state.completed = progress.completed || {};
        state.inventory = progress.inventory || {};
      }
      renderAll();
    } catch {
      toast("Не удалось загрузить состояние", "err");
    }
  }

  async function refreshRating() {
    if (!cfg.leaderboardUrl || !cfg.userId) return;
    const url = new URL(cfg.leaderboardUrl, window.location.origin);
    url.searchParams.set("user_id", String(cfg.userId));
    if (cfg.initData) url.searchParams.set("init_data", cfg.initData);
    el.ratingList.innerHTML = "<div class=\"fact\">Загрузка рейтинга...</div>";
    try {
      const response = await fetch(url.toString(), { method: "GET" });
      const data = await response.json();
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      if (!rows.length) { el.ratingList.innerHTML = "<div class=\"fact\">Пока нет данных рейтинга.</div>"; return; }
      el.ratingList.innerHTML = "";
      rows.slice(0, 30).forEach((row, idx) => {
        const div = document.createElement("div");
        div.className = "rating-row";
        const name = row.user_name || `Игрок ${row.user_id}`;
        const xp = Number(row.total_xp || 0);
        div.textContent = `${idx + 1}. ${name} — ${xp} XP`;
        el.ratingList.appendChild(div);
      });
    } catch {
      el.ratingList.innerHTML = "<div class=\"fact\">Ошибка загрузки рейтинга.</div>";
    }
  }

  async function resetProgress() {
    if (!cfg.resetUrl) return;
    if (!window.confirm("Сбросить прогресс ZERO_DAY? Это действие необратимо.")) return;
    try {
      const response = await fetch(cfg.resetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: String(cfg.userId), init_data: cfg.initData }),
      });
      const data = await response.json();
      if (!data?.ok) { toast(data?.error || "Сброс недоступен", "err"); return; }
      state.totalXp = 0;
      state.solvedCount = 0;
      state.streak = 0;
      state.episode = 1;
      state.unlocked = 1;
      state.completed = {};
      state.inventory = {};
      state.resetToken = Number(data.reset_token || 0);
      browserAnswered.clear();
      renderAll();
      toast("Прогресс сброшен", "ok");
    } catch {
      toast("Ошибка сброса", "err");
    }
  }

  function renderAll() {
    const fullName = tg?.initDataUnsafe?.user?.first_name || `Игрок ${cfg.userId || ""}`;
    el.playerName.textContent = fullName;
    el.playerRole.textContent = `роль: ${state.role}`;
    renderStats();
    renderEpisodes();
    renderMessenger();
    renderGallery();
    renderBrowser();
    renderMap();
    renderShop();
    renderProfile();
    openPanel("episodes");
  }

  document.getElementById("syncBtn").addEventListener("click", () => syncState(true));
  document.getElementById("checkGalleryBtn").addEventListener("click", checkGallery);
  document.getElementById("resetGalleryBtn").addEventListener("click", () => {
    selectedHotspots.clear();
    renderGallery();
    el.galleryCounter.textContent = "0 / 5";
  });
  document.getElementById("terminalCheckBtn").addEventListener("click", checkTerminal);
  el.terminalInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") checkTerminal();
  });
  document.getElementById("refreshRatingBtn").addEventListener("click", refreshRating);
  document.getElementById("resetProgressBtn").addEventListener("click", resetProgress);

  window.addEventListener("beforeunload", () => {
    try {
      navigator.sendBeacon(cfg.syncUrl, JSON.stringify({
        type: "sync",
        user_id: String(cfg.userId),
        init_data: cfg.initData,
        total_xp: state.totalXp,
        solved_count: state.solvedCount,
        streak: state.streak,
        progress_json: {
          episode: state.episode,
          unlocked: state.unlocked,
          completed: state.completed,
          inventory: state.inventory,
        },
        reset_token: state.resetToken,
      }));
    } catch {}
  });

  renderTabs("episodes");
  renderAll();
  loadRemoteState();
})();
