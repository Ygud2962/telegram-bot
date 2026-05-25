const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor?.("#050607");
  tg.setBackgroundColor?.("#050607");
}

const haptic = {
  light() {
    tg?.HapticFeedback?.impactOccurred?.("light");
  },
  ok() {
    tg?.HapticFeedback?.notificationOccurred?.("success");
  },
  warn() {
    tg?.HapticFeedback?.notificationOccurred?.("warning");
  },
  error() {
    tg?.HapticFeedback?.notificationOccurred?.("error");
  },
};

const state = {
  activeTab: "map",
  credits: 12430,
  energy: 8,
  energyMax: 12,
  socLevel: 4,
  rank: 128,
  keys: 2,
  map: [
    { id: "school", name: "Школа", x: 82, y: 72, state: "protected", level: 4 },
    { id: "wifi", name: "Wi-Fi узел", x: 238, y: 72, state: "under_attack", level: 2 },
    { id: "library", name: "Библиотека", x: 145, y: 160, state: "protected", level: 3 },
    { id: "media", name: "Медиа-класс", x: 300, y: 176, state: "infected", level: 1 },
    { id: "soc", name: "SOC HQ", x: 224, y: 238, state: "protected", level: 5 },
  ],
  threats: [
    {
      id: "threat_wifi",
      title: "Пакетный шторм у Wi-Fi",
      objectId: "wifi",
      type: "DDoS noise",
      game: "Packet Rain",
      timer: "03:12:44",
      difficulty: 3,
    },
    {
      id: "threat_media",
      title: "Фишинговая Маска в медиа-классе",
      objectId: "media",
      type: "Phishing",
      game: "Phishing Stream",
      timer: "11:20:08",
      difficulty: 2,
    },
  ],
  cards: [
    { id: "card_001", name: "Фишинговая Маска", rarity: "common", level: 2 },
    { id: "card_002", name: "Пакетный Шум", rarity: "common", level: 1 },
    { id: "card_006", name: "QR-Мираж", rarity: "rare", level: 1 },
    { id: "card_010", name: "Wi-Fi Phantom", rarity: "legendary", level: 1 },
  ],
  tools: [
    { id: "scanner", name: "Pulse Scanner", className: "Scanner", level: 2, equipped: true },
    { id: "firewall", name: "Glass Firewall", className: "Firewall", level: 1, equipped: true },
    { id: "crypto", name: "Shift Dial", className: "Crypto", level: 1, equipped: false },
  ],
};

const tabs = [
  ["map", "🗺", "Карта"],
  ["tools", "🛠", "Инстр."],
  ["collection", "🃏", "Коллекц."],
  ["daemon", "🐉", "Демон"],
  ["squad", "🛡", "Отряд"],
  ["story", "🧩", "Сюжет"],
  ["shop", "◇", "Магазин"],
];

const app = document.querySelector("#app");

function html(strings, ...values) {
  return strings.reduce((acc, part, i) => acc + part + (values[i] ?? ""), "");
}

function render() {
  app.innerHTML = html`
    <main class="phone">
      <section class="screen">
        ${renderHud()}
        <section class="content" id="content">${renderTab()}</section>
        ${renderTabs()}
      </section>
    </main>
  `;
  bindEvents();
}

function renderHud() {
  return html`
    <header class="hud">
      <div class="hud-top">
        <div class="brand">
          <strong>ZERO_DAY</strong>
          <span>ЗАЩИТНИКИ СЕТИ</span>
        </div>
        <span class="pill">SOC Lv.${state.socLevel}</span>
      </div>
      <div class="hud-stats">
        <span class="pill">₵ ${state.credits.toLocaleString("ru-RU")}</span>
        <span class="pill energy">⚡ ${state.energy}/${state.energyMax}</span>
        <span class="pill">#${state.rank}</span>
        <span class="pill">◇ ${state.keys}</span>
      </div>
    </header>
  `;
}

function renderTabs() {
  return html`
    <nav class="tabbar">
      ${tabs.map(([id, icon, label]) => `
        <button class="tab ${state.activeTab === id ? "active" : ""}" data-tab="${id}">
          <span class="ico">${icon}</span>
          <span>${label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function renderTab() {
  switch (state.activeTab) {
    case "tools":
      return renderTools();
    case "collection":
      return renderCollection();
    case "daemon":
      return renderDaemon();
    case "squad":
      return renderSquad();
    case "story":
      return renderStory();
    case "shop":
      return renderShop();
    default:
      return renderMap();
  }
}

function nodeColor(nodeState) {
  return {
    protected: "var(--safe)",
    under_attack: "var(--attack)",
    infected: "var(--infected)",
    locked: "#6b7280",
    boss: "var(--gold)",
  }[nodeState] || "var(--muted)";
}

function renderMap() {
  return html`
    <article class="map-card">
      <div class="section-title">
        <h2>Новый Сектор</h2>
        <span>5 объектов MVP</span>
      </div>
      <svg class="city-map" viewBox="0 0 380 300" role="img" aria-label="Карта города">
        <path d="M82 72 L238 72 L300 176 L224 238 L145 160 L82 72" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="3" stroke-dasharray="8 10"/>
        <path d="M238 72 L145 160 L224 238" fill="none" stroke="rgba(0,212,255,.22)" stroke-width="2"/>
        ${state.map.map(node => `
          <g class="map-node" data-object="${node.id}">
            <circle cx="${node.x}" cy="${node.y}" r="25" fill="rgba(255,255,255,.06)" stroke="${nodeColor(node.state)}" stroke-width="3"/>
            <circle cx="${node.x}" cy="${node.y}" r="7" fill="${nodeColor(node.state)}"/>
            <text x="${node.x}" y="${node.y + 42}" fill="#f4f7fb" font-size="12" text-anchor="middle">${node.name}</text>
            <text x="${node.x}" y="${node.y - 34}" fill="#9ca9b8" font-size="10" text-anchor="middle">DEF ${node.level}</text>
          </g>
        `).join("")}
        <g class="daemon">
          <circle cx="224" cy="202" r="18" fill="rgba(0,212,255,.22)" stroke="var(--accent)"/>
          <text x="224" y="208" text-anchor="middle" font-size="22">🐉</text>
        </g>
      </svg>
    </article>

    <section class="threat-feed">
      <div class="section-title">
        <h2>Активные угрозы</h2>
        <span>таймер идет</span>
      </div>
      ${state.threats.map(threat => `
        <button class="threat" data-threat="${threat.id}">
          <strong>${threat.title}</strong>
          <span>${threat.game} · сложность ${threat.difficulty} · осталось ${threat.timer}</span>
        </button>
      `).join("")}
    </section>
  `;
}

function renderTools() {
  return html`
    <section class="panel" style="padding:14px">
      <div class="section-title">
        <h2>Инструменты</h2>
        <span>3 активных слота</span>
      </div>
      <div class="grid">
        ${state.tools.map(tool => `
          <div class="tool-tile">
            <strong>${tool.name}</strong>
            <p>${tool.className} · Lv.${tool.level} ${tool.equipped ? "· экипирован" : ""}</p>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCollection() {
  return html`
    <section class="panel" style="padding:14px">
      <div class="section-title">
        <h2>Коллекция</h2>
        <span>${state.cards.length}/120</span>
      </div>
      <div class="grid cards-grid">
        ${state.cards.map(card => `
          <div class="card-tile">
            <small class="rarity-${card.rarity}">${card.rarity.toUpperCase()}</small>
            <h3>${card.name}</h3>
            <p>Уровень ${card.level}</p>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderDaemon() {
  return html`
    <section class="panel" style="padding:18px">
      <div class="section-title">
        <h2>Демон</h2>
        <span>форма 3/10</span>
      </div>
      <div style="font-size:76px;text-align:center;margin:20px 0">🐉</div>
      <p>IDS-волчонок уже нюхает подозрительные пакеты. Накорми его мини-игрой, и он принесет скрытые кредиты.</p>
      <button class="primary-btn" data-tab="map">К угрозам</button>
    </section>
  `;
}

function renderSquad() {
  return html`
    <section class="panel" style="padding:18px">
      <div class="section-title">
        <h2>Отряд SOC</h2>
        <span>щит 72%</span>
      </div>
      <p>В MVP здесь будет создание отряда, общий щит и вклад в бункер.</p>
      <div class="tool-tile"><strong>Бункер: Палатка</strong><p>Следующий уровень: Контейнер</p></div>
    </section>
  `;
}

function renderStory() {
  return html`
    <section class="panel" style="padding:18px">
      <div class="section-title">
        <h2>Эпизод 1</h2>
        <span>День 1/30</span>
      </div>
      <p><strong>Первый алерт.</strong> Ника открывает карту и говорит: "Если Wi-Fi мигает красным, кто-то уже дергает дверь".</p>
      <button class="primary-btn" data-tab="map">Открыть карту</button>
    </section>
  `;
}

function renderShop() {
  return html`
    <section class="panel" style="padding:18px">
      <div class="section-title">
        <h2>Магазин</h2>
        <span>честный донат</span>
      </div>
      <div class="grid">
        <div class="tool-tile"><strong>10 Ключей Зеро</strong><p>99 руб · не влияет на рейтинг</p></div>
        <div class="tool-tile"><strong>SOC ELITE</strong><p>299 руб/мес · прогресс быстрее, fair score честный</p></div>
      </div>
    </section>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      haptic.light();
      render();
    });
  });

  document.querySelectorAll("[data-threat]").forEach(button => {
    button.addEventListener("click", () => {
      const threat = state.threats.find(item => item.id === button.dataset.threat);
      if (threat?.game === "Packet Rain") {
        startPacketRain(threat);
      } else {
        toast("Эта мини-игра будет во втором прототипе");
        haptic.warn();
      }
    });
  });

  document.querySelectorAll("[data-object]").forEach(node => {
    node.addEventListener("click", () => {
      const item = state.map.find(obj => obj.id === node.dataset.object);
      toast(`${item.name}: ${item.state}, защита ${item.level}/10`);
      haptic.light();
    });
  });
}

function toast(message) {
  document.querySelector(".toast")?.remove();
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  document.querySelector(".phone").appendChild(element);
  setTimeout(() => element.remove(), 1800);
}

function startPacketRain(threat) {
  if (state.energy <= 0) {
    toast("Энергия аналитика закончилась");
    haptic.error();
    return;
  }

  const phone = document.querySelector(".phone");
  const overlay = document.createElement("div");
  overlay.className = "game-overlay";
  overlay.innerHTML = `
    <header class="game-header">
      <strong>Packet Rain</strong>
      <button class="close-btn" id="closeGame">Закрыть</button>
    </header>
    <canvas id="gameCanvas"></canvas>
    <footer class="game-footer">
      <span>← BLOCK · → PASS · ↑ QUARANTINE</span>
      <span id="gameScore">0</span>
    </footer>
  `;
  phone.appendChild(overlay);

  const canvas = overlay.querySelector("#gameCanvas");
  const scoreEl = overlay.querySelector("#gameScore");
  const ctx = canvas.getContext("2d");
  const packets = [];
  const types = ["pass", "block", "quarantine"];
  let score = 0;
  let combo = 0;
  let mistakes = 0;
  let running = true;
  let lastSpawn = 0;
  let startedAt = performance.now();
  let pointerStart = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * devicePixelRatio);
    canvas.height = Math.floor(rect.height * devicePixelRatio);
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function spawn(now) {
    if (now - lastSpawn < 720) return;
    lastSpawn = now;
    packets.push({
      x: 38 + Math.random() * (canvas.clientWidth - 76),
      y: -20,
      type: types[Math.floor(Math.random() * types.length)],
      speed: 1.2 + Math.random() * 1.9,
      size: 20 + Math.random() * 8,
    });
  }

  function color(type) {
    return { pass: "#00ff41", block: "#ff003c", quarantine: "#ffee00" }[type];
  }

  function label(type) {
    return { pass: "PASS", block: "BAD", quarantine: "SUS" }[type];
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = "rgba(255,255,255,.04)";
    for (let x = 0; x < canvas.clientWidth; x += 28) {
      ctx.fillRect(x, 0, 1, canvas.clientHeight);
    }
    for (const packet of packets) {
      ctx.beginPath();
      ctx.arc(packet.x, packet.y, packet.size, 0, Math.PI * 2);
      ctx.fillStyle = `${color(packet.type)}33`;
      ctx.fill();
      ctx.strokeStyle = color(packet.type);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(label(packet.type), packet.x, packet.y + 4);
    }
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "13px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`combo ${combo} · mistakes ${mistakes}`, 14, 24);
  }

  function loop(now) {
    if (!running) return;
    spawn(now);
    packets.forEach(packet => {
      packet.y += packet.speed;
    });
    for (let i = packets.length - 1; i >= 0; i -= 1) {
      if (packets[i].y > canvas.clientHeight + 40) {
        packets.splice(i, 1);
        mistakes += 1;
        combo = 0;
        haptic.warn();
      }
    }
    draw();
    scoreEl.textContent = `${score} pts`;
    if (performance.now() - startedAt > 45000 || mistakes >= 6) {
      finish();
      return;
    }
    requestAnimationFrame(loop);
  }

  function classify(direction) {
    if (!packets.length) return;
    const packet = packets.reduce((best, item) => item.y > best.y ? item : best, packets[0]);
    const expected = packet.type;
    const ok = direction === expected;
    packets.splice(packets.indexOf(packet), 1);
    if (ok) {
      combo += 1;
      score += 100 + combo * 12;
      haptic.light();
      if (combo === 10) {
        toast("Fury Analyst: время будто замедлилось");
        haptic.ok();
      }
    } else {
      combo = 0;
      mistakes += 1;
      haptic.error();
    }
  }

  function finish() {
    running = false;
    state.energy -= 1;
    const credits = Math.max(60, Math.floor(score / 16));
    state.credits += credits;
    const wifi = state.map.find(item => item.id === threat.objectId);
    if (wifi) {
      wifi.state = mistakes >= 6 ? "infected" : "protected";
      wifi.level = Math.min(10, wifi.level + (mistakes >= 6 ? 0 : 1));
    }
    state.threats = state.threats.filter(item => item.id !== threat.id);
    overlay.remove();
    render();
    toast(mistakes >= 6 ? "Угроза сорвалась. Объект заражен." : `Нейтрализация: +${credits} кредитов`);
    mistakes >= 6 ? haptic.error() : haptic.ok();
  }

  canvas.addEventListener("pointerdown", event => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });

  canvas.addEventListener("pointerup", event => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    if (Math.abs(dy) > Math.abs(dx) && dy < 0) classify("quarantine");
    else if (dx > 0) classify("pass");
    else classify("block");
  });

  window.addEventListener("keydown", keyHandler);
  function keyHandler(event) {
    if (!running) return;
    if (event.key === "ArrowLeft") classify("block");
    if (event.key === "ArrowRight") classify("pass");
    if (event.key === "ArrowUp") classify("quarantine");
  }

  overlay.querySelector("#closeGame").addEventListener("click", () => {
    running = false;
    window.removeEventListener("keydown", keyHandler);
    overlay.remove();
  });

  resize();
  window.addEventListener("resize", resize, { once: true });
  requestAnimationFrame(loop);
}

render();

