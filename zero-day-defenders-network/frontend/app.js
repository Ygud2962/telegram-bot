const tg = window.Telegram?.WebApp;
const API_BASE = window.ZDNET_CONFIG?.apiBase || localStorage.getItem("ZDNET_API_BASE") || "http://localhost:8090";
let sessionToken = null;
let backendOnline = false;

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
  sync: "mock",
  credits: 12430,
  energy: 8,
  energyMax: 12,
  socLevel: 4,
  rank: 128,
  keys: 2,
  cleanFragments: 0,
  gacha: { rarePity: 0, epicPity: 0, legendaryPity: 0, openCount: 0 },
  shopProducts: [],
  payments: [],
  busyProducts: new Set(),
  busyTools: new Set(),
  content: {
    cardsById: {},
    toolsById: {},
    mapById: {},
  },
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
    { id: "tool_scanner", name: "Pulse Scanner", className: "Scanner", level: 2, equipped: true, slotIndex: 1 },
    { id: "tool_firewall", name: "Glass Firewall", className: "Firewall", level: 1, equipped: true, slotIndex: 2 },
    { id: "tool_crypto", name: "Shift Dial", className: "Crypto", level: 1, equipped: false, slotIndex: null },
  ],
};

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (options.auth !== false && sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }
  const response = await fetch(apiUrl(path), {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.detail ? `${data.error || `HTTP ${response.status}`}: ${data.detail}` : (data.error || `HTTP ${response.status}`);
    const error = new Error(message);
    error.code = data.error;
    error.payload = data.payload;
    throw error;
  }
  return data;
}

function apiUrl(path) {
  const base = API_BASE.replace(/\/$/, "");
  if (base.endsWith("/zdnet_api") && path.startsWith("/api/")) {
    return `${base}${path.slice(4)}`;
  }
  return `${base}${path}`;
}

async function connectBackend() {
  try {
    const auth = await apiRequest("/api/auth/telegram", {
      method: "POST",
      auth: false,
      body: {
        initData: tg?.initData || "",
        devTelegramId: 1001,
        devNickname: tg?.initDataUnsafe?.user?.username || "rookie",
      },
    });
    sessionToken = auth.sessionToken;
    backendOnline = true;
    state.sync = "api";
    await loadContent();
    const boot = await apiRequest("/api/bootstrap");
    applyBootstrap(boot);
    await refreshPaymentHistory();
    render();
    toast("Backend API подключен");
  } catch (error) {
    backendOnline = false;
    state.sync = "mock";
    render();
  }
}

async function loadContent() {
  if (!backendOnline) return;
  try {
    const content = await apiRequest("/api/content");
    applyContent(content);
  } catch (error) {
    console.warn("ZDNET content unavailable", error);
  }
}

function applyContent(content) {
  state.content.cardsById = Object.fromEntries((content.cards || []).map(card => [card.id, card]));
  state.content.toolsById = Object.fromEntries((content.tools || []).map(tool => [tool.id, tool]));
  state.content.mapById = Object.fromEntries((content.mapObjects || []).map(object => [object.id, object]));

  state.map = state.map.map(node => {
    const meta = state.content.mapById[node.id];
    return meta ? { ...node, name: meta.name, x: meta.x, y: meta.y } : node;
  });
  state.cards = state.cards.map(card => enrichCard(card));
  state.tools = state.tools.map(tool => enrichTool(tool));
}

function enrichCard(card) {
  const cardId = card.cardId || card.id;
  const meta = state.content.cardsById[cardId] || {};
  return {
    id: cardId,
    name: meta.name || card.name || cardId,
    rarity: meta.rarity || card.rarity || "common",
    level: card.level || 1,
    duplicates: Number(card.duplicates || 0),
    isHolo: Boolean(card.isHolo),
    firstObtainedAt: card.firstObtainedAt || null,
    fact: meta.fact || "",
    weakness: meta.weakness || "",
  };
}

function enrichTool(tool) {
  const id = tool.toolId || tool.id;
  const meta = state.content.toolsById[id] || {};
  return {
    id,
    name: meta.name || tool.name || id,
    className: meta.class || tool.className || "Tool",
    level: tool.level || 1,
    equipped: Boolean(tool.equipped),
    slotIndex: tool.slotIndex ?? null,
    description: meta.description || tool.description || "",
  };
}

function applyBootstrap(boot) {
  state.credits = boot.wallet?.credits ?? state.credits;
  state.energy = boot.energy?.current ?? state.energy;
  state.energyMax = boot.energy?.dailyMax ?? state.energyMax;
  state.socLevel = boot.progression?.socLevel ?? boot.player?.socLevel ?? state.socLevel;
  state.keys = boot.wallet?.zeroKeys ?? state.keys;
  state.cleanFragments = boot.wallet?.cleanFragments ?? state.cleanFragments;
  state.gacha = boot.gacha || state.gacha;
  state.shopProducts = boot.shopProducts || state.shopProducts;
  state.map = (boot.map || state.map).map(item => ({
    id: item.objectId || item.id,
    name: state.content.mapById[item.objectId || item.id]?.name || item.name || item.objectId || item.id,
    x: state.content.mapById[item.objectId || item.id]?.x || state.map.find(old => old.id === (item.objectId || item.id))?.x || 120,
    y: state.content.mapById[item.objectId || item.id]?.y || state.map.find(old => old.id === (item.objectId || item.id))?.y || 120,
    state: item.state,
    level: item.protectionLevel,
  }));
  state.threats = (boot.activeThreats || []).map(threat => ({
    id: threat.id,
    title: threat.title,
    objectId: threat.objectId,
    type: threat.type,
    gameType: threat.gameType,
    game: gameLabel(threat.gameType),
    expiresAt: threat.expiresAt,
    timer: timerLabel(threat.expiresAt),
    difficulty: threat.difficulty,
  }));
  if (Array.isArray(boot.cards) && boot.cards.length) {
    state.cards = boot.cards.map(card => enrichCard(card));
  }
  if (Array.isArray(boot.tools) && boot.tools.length) {
    state.tools = boot.tools.map(tool => enrichTool(tool));
  }
}

async function refreshBootstrap() {
  if (!backendOnline) return;
  const boot = await apiRequest("/api/bootstrap");
  applyBootstrap(boot);
  await refreshPaymentHistory();
}

async function refreshPaymentHistory() {
  if (!backendOnline) return;
  try {
    const history = await apiRequest("/api/payments/history");
    state.payments = history.payments || [];
  } catch (error) {
    state.payments = [];
  }
}

function gameLabel(gameType) {
  return {
    packet_rain: "Packet Rain",
    phishing_stream: "Phishing Stream",
    crypto_lock: "Crypto Lock",
  }[gameType] || gameType;
}

function timerLabel(expiresAt) {
  const end = Date.parse(expiresAt || "");
  if (!Number.isFinite(end)) return "24:00:00";
  const diff = Math.max(0, end - Date.now());
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function refreshThreatTimers() {
  let changed = false;
  state.threats = state.threats.map(threat => {
    if (!threat.expiresAt) return threat;
    const nextTimer = timerLabel(threat.expiresAt);
    if (nextTimer === threat.timer) return threat;
    changed = true;
    return { ...threat, timer: nextTimer };
  });
  if (changed && state.activeTab === "map") {
    state.threats.forEach(threat => {
      const element = document.querySelector(`[data-threat-timer="${threat.id}"]`);
      if (element) element.textContent = threat.timer;
    });
  }
}

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
        <div class="ambient ambient-a"></div>
        <div class="ambient ambient-b"></div>
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
          <span class="eyebrow">SOC Новый Сектор · ${state.sync.toUpperCase()}</span>
          <strong>ZERO_DAY</strong>
        </div>
        <span class="status-chip">Lv.${state.socLevel}</span>
      </div>
      <div class="hud-stats">
        <span class="metric"><b>₵</b>${state.credits.toLocaleString("ru-RU")}</span>
        <span class="metric energy"><b>⚡</b>${state.energy}/${state.energyMax}</span>
        <span class="metric"><b>#</b>${state.rank}</span>
        <span class="metric"><b>◇</b>${state.keys}</span>
        <span class="metric"><b>✦</b>${state.cleanFragments}</span>
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
  const activeCount = state.threats.length;
  const protectedCount = state.map.filter(node => node.state === "protected").length;
  const cityIntegrity = Math.round((protectedCount / Math.max(1, state.map.length)) * 100);
  return html`
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">дежурство активно</span>
        <h1>Город держится на твоем SOC</h1>
        <p>${activeCount ? `На карте ${activeCount} активные угрозы. Закрой Packet Rain до таймера.` : "Сектор чистый. Поддерживай стрик и готовься к легендарному спавну."}</p>
      </div>
      <div class="daemon-orb" aria-label="Кибер-демон">
        <span>🐉</span>
      </div>
    </section>

    <article class="map-card">
      <div class="section-title">
        <div>
          <span class="eyebrow">SVG city map</span>
          <h2>Новый Сектор</h2>
        </div>
        <span>${cityIntegrity}% защищено</span>
      </div>
      <svg class="city-map" viewBox="0 0 380 300" role="img" aria-label="Карта города">
        <defs>
          <filter id="nodeGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path d="M54 104 C94 36 186 34 238 72 C304 78 336 125 322 184 C310 248 250 270 190 250 C128 254 74 224 66 166 C42 146 39 126 54 104Z" fill="rgba(255,255,255,.035)" stroke="rgba(255,255,255,.12)" stroke-width="1.5"/>
        <path d="M82 72 L238 72 L300 176 L224 238 L145 160 L82 72" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="3" stroke-dasharray="8 10"/>
        <path d="M238 72 L145 160 L224 238" fill="none" stroke="rgba(0,212,255,.22)" stroke-width="2"/>
        ${state.map.map(node => `
          <g class="map-node" data-object="${node.id}">
            <circle cx="${node.x}" cy="${node.y}" r="31" fill="${nodeColor(node.state)}" opacity=".08"/>
            <circle cx="${node.x}" cy="${node.y}" r="24" fill="rgba(6,10,18,.78)" stroke="${nodeColor(node.state)}" stroke-width="2.5" filter="url(#nodeGlow)"/>
            <circle cx="${node.x}" cy="${node.y}" r="7" fill="${nodeColor(node.state)}"/>
            <text x="${node.x}" y="${node.y + 42}" fill="#f4f7fb" font-size="12" text-anchor="middle">${node.name}</text>
            <text x="${node.x}" y="${node.y - 36}" fill="#9ca9b8" font-size="10" text-anchor="middle">${nodeStatusLabel(node.state)} · DEF ${node.level}</text>
          </g>
        `).join("")}
        <g class="daemon">
          <circle cx="224" cy="202" r="18" fill="rgba(0,212,255,.22)" stroke="var(--accent)" filter="url(#nodeGlow)"/>
          <text x="224" y="208" text-anchor="middle" font-size="22">🐉</text>
        </g>
      </svg>
    </article>

    <section class="threat-feed">
      <div class="section-title">
        <div>
          <span class="eyebrow">FOMO feed</span>
          <h2>Активные угрозы</h2>
        </div>
        <span>${activeCount ? "таймер идет" : "нет атак"}</span>
      </div>
      ${state.threats.length ? state.threats.map(threat => `
        <button class="threat" data-threat="${threat.id}">
          <span class="threat-severity">D${threat.difficulty}</span>
          <span class="threat-body">
            <strong>${threat.title}</strong>
            <span>${threat.game} · ${threat.type} · осталось <b data-threat-timer="${threat.id}">${threat.timer}</b></span>
          </span>
          <span class="threat-cta">Открыть</span>
        </button>
      `).join("") : `<div class="empty-card"><strong>Сектор чистый</strong><p>Нет активных угроз. Можно открыть тайник или проверить коллекцию.</p></div>`}
    </section>
  `;
}

function nodeStatusLabel(status) {
  return {
    protected: "OK",
    under_attack: "ALERT",
    infected: "VIRUS",
    locked: "LOCK",
    boss: "BOSS",
  }[status] || "SCAN";
}

function renderTools() {
  const inventory = getToolInventory();
  const slots = [1, 2, 3].map(slot => inventory.find(tool => tool.equipped && Number(tool.slotIndex) === slot));
  return html`
    <section class="tools-hero">
      <span class="eyebrow">loadout</span>
      <h2>Инструменты SOC</h2>
      <p>Три активных слота влияют на прохождение мини-игр. Улучшения покупаются за кредиты и не меняют fairScore.</p>
      <div class="tool-slots">
        ${slots.map((tool, index) => `
          <div class="tool-slot ${tool ? "filled" : ""}">
            <span>Слот ${index + 1}</span>
            <strong>${tool ? tool.name : "пусто"}</strong>
            <small>${tool ? `Lv.${tool.level} · ${toolEffect(tool)}` : "выбери инструмент"}</small>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="panel tools-panel">
      <div class="section-title">
        <div>
          <span class="eyebrow">inventory</span>
          <h2>Арсенал</h2>
        </div>
        <span>${inventory.filter(tool => tool.owned).length}/${inventory.length} открыто</span>
      </div>
      <div class="tool-list">
        ${inventory.map(tool => renderToolCard(tool)).join("")}
      </div>
    </section>
  `;
}

function getToolInventory() {
  const ownedById = Object.fromEntries(state.tools.map(tool => [tool.id, tool]));
  const contentTools = Object.values(state.content.toolsById);
  const base = contentTools.length
    ? contentTools.map(meta => enrichTool({ ...(ownedById[meta.id] || {}), id: meta.id, owned: Boolean(ownedById[meta.id]) }))
    : state.tools.map(tool => ({ ...tool, owned: true }));
  return base.map(tool => ({ ...tool, owned: tool.owned ?? Boolean(ownedById[tool.id] || !contentTools.length) }));
}

function renderToolCard(tool) {
  const busy = state.busyTools.has(tool.id);
  const upgradeCost = toolUpgradeCost(tool.level);
  const maxed = tool.level >= 10;
  return `
    <article class="tool-card ${tool.owned ? "" : "locked"} ${tool.equipped ? "equipped" : ""}">
      <div class="tool-card-icon">${toolIcon(tool)}</div>
      <div class="tool-card-main">
        <div class="product-topline">
          <strong>${tool.name}</strong>
          <span class="price-chip">${tool.owned ? `Lv.${tool.level}` : "LOCK"}</span>
        </div>
        <p>${tool.description || toolEffect(tool)}</p>
        <div class="product-meta">
          <span>${tool.className}</span>
          <span>${toolEffect(tool)}</span>
          ${tool.equipped ? `<span>слот ${tool.slotIndex}</span>` : ""}
        </div>
        ${tool.owned ? `
          <div class="tool-actions">
            <button class="secondary-btn" data-upgrade-tool="${tool.id}" ${busy || maxed || state.credits < upgradeCost ? "disabled" : ""}>
              ${busy ? "..." : maxed ? "MAX" : `Улучшить · ₵ ${upgradeCost}`}
            </button>
            ${[1, 2, 3].map(slot => `
              <button class="slot-btn ${Number(tool.slotIndex) === slot ? "active" : ""}" data-equip-tool="${tool.id}" data-slot="${slot}" ${busy ? "disabled" : ""}>${slot}</button>
            `).join("")}
          </div>
        ` : `<div class="tool-actions"><button class="secondary-btn" disabled>Откроется в миссиях</button></div>`}
      </div>
    </article>
  `;
}

function toolUpgradeCost(level) {
  return 120 * Number(level || 1) * Number(level || 1);
}

function toolEffect(tool) {
  const level = Number(tool.level || 1);
  const cls = String(tool.className || "").toLowerCase();
  if (cls.includes("scanner")) return `подсветка +${level}`;
  if (cls.includes("firewall")) return `ошибка forgiven ${Math.min(3, level)}`;
  if (cls.includes("analyzer")) return `время +${level * 2}с`;
  if (cls.includes("crypto")) return `сдвиг hint ${level}`;
  if (cls.includes("deceptor")) return `drop +${level}%`;
  return `эффект +${level}`;
}

function toolIcon(tool) {
  const cls = String(tool.className || "").toLowerCase();
  if (cls.includes("scanner")) return "⌖";
  if (cls.includes("firewall")) return "▣";
  if (cls.includes("analyzer")) return "⌬";
  if (cls.includes("crypto")) return "⟳";
  if (cls.includes("deceptor")) return "◆";
  return "⚙";
}

function equippedToolByClass(className) {
  return state.tools.find(tool => tool.equipped && String(tool.className || "").toLowerCase().includes(className));
}

function getPacketRainToolEffects() {
  const scanner = equippedToolByClass("scanner");
  const firewall = equippedToolByClass("firewall");
  const analyzer = equippedToolByClass("analyzer");
  return {
    scannerLevel: scanner ? Number(scanner.level || 1) : 0,
    firewallCharges: firewall ? Math.min(3, Number(firewall.level || 1)) : 0,
    timeBonusMs: analyzer ? Number(analyzer.level || 1) * 2000 : 0,
    labels: [
      scanner ? `Scanner L${scanner.level}` : "",
      firewall ? `Firewall ${Math.min(3, Number(firewall.level || 1))}x` : "",
      analyzer ? `Analyzer +${Number(analyzer.level || 1) * 2}s` : "",
    ].filter(Boolean),
  };
}

function packetActionLabel(type) {
  return { pass: "PASS →", block: "BLOCK ←", quarantine: "QUAR ↑" }[type] || type;
}

function renderCollection() {
  const cards = getCollectionCards();
  const holoCount = cards.filter(card => card.isHolo).length;
  return html`
    <section class="cache-card">
      <div>
        <span class="eyebrow">Zero Cache</span>
        <h2>Тайники Зеро</h2>
        <p>Открывай за ключи, собирай угрозы и прокачивай дубли. Pity защищает от бесконечной невезухи.</p>
        <div class="cache-pity">
          <span>Rare pity ${state.gacha.rarePity || 0}/10</span>
          <span>Epic ${state.gacha.epicPity || 0}/50</span>
          <span>Legendary ${state.gacha.legendaryPity || 0}/100</span>
        </div>
      </div>
      <div class="cache-actions">
        <button class="primary-btn" data-open-cache="1" ${state.keys <= 0 ? "disabled" : ""}>
          Открыть · ◇ 1
        </button>
        <button class="secondary-btn" data-open-cache="10" ${state.keys < 10 ? "disabled" : ""}>
          x10 · ◇ 10
        </button>
        <small>Ключей: ${state.keys}</small>
      </div>
    </section>

    <section class="panel collection-panel">
      <div class="section-title">
        <div>
          <span class="eyebrow">threat deck</span>
          <h2>Коллекция</h2>
        </div>
        <span>${cards.length}/120 · Holo ${holoCount}</span>
      </div>
      <div class="cards-grid">
        ${cards.map(card => `
          <article class="card-tile rarity-${card.rarity} ${card.isHolo ? "holo" : ""}">
            <div class="card-art">${cardArtGlyph(card)}</div>
            <div class="card-info">
              <div class="product-topline">
                <small>${card.rarity.toUpperCase()}</small>
                <span class="price-chip">Lv.${card.level}${card.isHolo ? " · HOLO" : ""}</span>
              </div>
              <h3>${card.name}</h3>
              <p>${card.fact || "Факт появится после синхронизации контента."}</p>
              <div class="card-progress">
                <span style="width:${duplicateProgress(card)}%"></span>
              </div>
              <div class="product-meta">
                <span>${card.weakness || "unknown"} weakness</span>
                <span>${duplicateLabel(card)}</span>
              </div>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function getCollectionCards() {
  return [...state.cards].sort((left, right) => {
    const rarityDelta = rarityRank(right.rarity) - rarityRank(left.rarity);
    if (rarityDelta) return rarityDelta;
    return String(left.name).localeCompare(String(right.name), "ru");
  });
}

function rarityRank(rarity) {
  return { common: 1, rare: 2, epic: 3, legendary: 4 }[rarity] || 0;
}

function duplicateTarget(level) {
  return { 1: 1, 2: 3, 3: 7 }[Number(level || 1)] || 0;
}

function duplicateProgress(card) {
  const target = duplicateTarget(card.level);
  if (!target) return 100;
  return Math.min(100, Math.round((Number(card.duplicates || 0) / target) * 100));
}

function duplicateLabel(card) {
  const target = duplicateTarget(card.level);
  if (!target) return "MAX · holographic";
  return `дубли ${card.duplicates || 0}/${target}`;
}

function cardArtGlyph(card) {
  const type = String(card.weakness || card.rarity || "").toLowerCase();
  if (type.includes("firewall")) return "▣";
  if (type.includes("scanner")) return "⌖";
  if (type.includes("crypto")) return "⟳";
  if (type.includes("analyzer")) return "⌬";
  if (type.includes("deceptor")) return "◆";
  return "◇";
}

function normalizeRewardCard(drop) {
  if (!drop) return null;
  if (typeof drop === "string") {
    const owned = state.cards.find(card => card.id === drop);
    return enrichCard({ id: drop, ...(owned || {}) });
  }
  return enrichCard({
    id: drop.cardId || drop.id,
    name: drop.name,
    rarity: drop.rarity,
    level: drop.level || 1,
    duplicates: drop.duplicates || 0,
    isHolo: drop.isHolo || false,
    firstObtainedAt: drop.firstObtainedAt || null,
  });
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
  const products = state.shopProducts.length ? state.shopProducts : [
    {
      productId: "zero_keys_10",
      title: "10 Ключей Зеро",
      description: "Открытия тайников. Не влияет на рейтинг.",
      currency: "XTR",
      amount: 99,
    },
    {
      productId: "soc_elite_monthly",
      title: "SOC ELITE на 30 дней",
      description: "Удобство и косметика. Fair score честный.",
      currency: "XTR",
      amount: 299,
    },
  ];
  const lastPayments = state.payments.slice(-4).reverse();
  const paidCount = state.payments.filter(payment => payment.status === "paid").length;
  const pendingCount = state.payments.filter(payment => payment.status === "created").length;
  return html`
    <section class="shop-hero">
      <span class="eyebrow">Telegram Stars · fair monetization</span>
      <h2>Магазин без pay-to-win</h2>
      <p>Покупки ускоряют коллекционирование и удобство, но не добавляют очки рейтинга. fairScoreImpact всегда равен 0.</p>
      <div class="shop-ledger">
        <span><b>${paidCount}</b> оплачено</span>
        <span><b>${pendingCount}</b> ожидает</span>
        <span><b>${state.payments.length}</b> всего</span>
      </div>
    </section>

    <section class="panel shop-panel">
      <div class="section-title">
        <div>
          <span class="eyebrow">products</span>
          <h2>Пополнения и бустеры</h2>
        </div>
        <span>${backendOnline ? "API online" : "mock mode"}</span>
      </div>
      <div class="shop-products">
        ${products.map(product => renderProduct(product)).join("")}
      </div>
      <div class="section-title" style="margin-top:18px">
        <div>
          <span class="eyebrow">receipts</span>
          <h2>История покупок</h2>
        </div>
        <span>${state.payments.length} платежей</span>
      </div>
      <div class="receipt-list">
        ${lastPayments.length ? lastPayments.map(payment => renderPayment(payment)).join("") : `<div class="empty-card"><strong>Пока пусто</strong><p>Покупки появятся здесь только после создания счета.</p></div>`}
      </div>
    </section>
  `;
}

function renderProduct(product) {
  const productId = product.productId;
  const busy = state.busyProducts.has(productId);
  const status = productPaymentSummary(productId);
  const disabled = busy || !backendOnline;
  const grant = formatProductGrant(product.grant);
  return `
    <article class="shop-product">
      <div class="product-icon">${productIcon(product)}</div>
      <div class="product-copy">
        <div class="product-topline">
          <strong>${product.title}</strong>
          <span class="price-chip">${formatAmount(product)}</span>
        </div>
        <p>${product.description}</p>
        <div class="product-meta">
          <span>${grant}</span>
          <span>fairScore +0</span>
          ${status ? `<span>${status}</span>` : ""}
        </div>
      </div>
      <button class="primary-btn shop-buy" data-buy-product="${productId}" ${disabled ? "disabled" : ""}>
        ${busy ? "Создаем..." : backendOnline ? "Купить" : "Только API"}
      </button>
    </article>
  `;
}

function renderPayment(payment) {
  const status = paymentStatusMeta(payment.status);
  const createdAt = payment.createdAt ? new Date(payment.createdAt) : null;
  const createdLabel = createdAt && Number.isFinite(createdAt.getTime())
    ? createdAt.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "только что";
  return `
    <article class="receipt-row status-${payment.status || "unknown"}">
      <span class="receipt-status">${status.icon}</span>
      <div>
        <strong>${payment.title || payment.productId}</strong>
        <p>${status.label} · ${formatAmount(payment)} · ${createdLabel}</p>
        ${payment.failReason ? `<small>${payment.failReason}</small>` : ""}
      </div>
    </article>
  `;
}

function paymentStatusMeta(status) {
  return {
    created: { icon: "…", label: "счет создан, ждет оплаты" },
    paid: { icon: "✓", label: "оплачено, награда выдана" },
    failed: { icon: "!", label: "ошибка счета" },
    cancelled: { icon: "×", label: "отменено" },
    refunded: { icon: "↩", label: "возврат" },
  }[status] || { icon: "?", label: status || "неизвестно" };
}

function productPaymentSummary(productId) {
  const related = state.payments.filter(payment => payment.productId === productId);
  if (!related.length) return "";
  const paid = related.filter(payment => payment.status === "paid").length;
  const pending = related.filter(payment => payment.status === "created").length;
  if (paid && pending) return `${paid} оплачено · ${pending} ожидает`;
  if (paid) return `${paid} оплачено`;
  if (pending) return `${pending} ожидает`;
  return `${related.length} попыток`;
}

function formatAmount(item) {
  const amount = item.amount ?? item.amountMinor ?? 0;
  const currency = item.currency === "XTR" ? "⭐" : item.currency;
  return `${amount} ${currency}`;
}

function formatProductGrant(grant = {}) {
  const parts = [];
  if (grant.zeroKeys) parts.push(`+${grant.zeroKeys} ключей`);
  if (grant.cleanFragments) parts.push(`+${grant.cleanFragments} фрагментов`);
  if (grant.extraSpins) parts.push(`+${grant.extraSpins} спин`);
  if (grant.socEliteDays) parts.push(`ELITE ${grant.socEliteDays}д`);
  return parts.join(" · ") || "косметика";
}

function productIcon(product) {
  const grant = product.grant || {};
  if (grant.zeroKeys) return "◇";
  if (grant.cleanFragments) return "✦";
  if (grant.extraSpins) return "↻";
  if (grant.socEliteDays) return "E";
  return "⭐";
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
    button.addEventListener("click", async () => {
      const threat = state.threats.find(item => item.id === button.dataset.threat);
      if (threat?.gameType === "packet_rain" || threat?.game === "Packet Rain") {
        await startPacketRain(threat);
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

  document.querySelectorAll("[data-buy-product]").forEach(button => {
    button.addEventListener("click", async () => {
      await buyProduct(button.dataset.buyProduct);
    });
  });

  document.querySelectorAll("[data-open-cache]").forEach(button => {
    button.addEventListener("click", async () => {
      await openZeroCache(Number(button.dataset.openCache || 1));
    });
  });

  document.querySelectorAll("[data-upgrade-tool]").forEach(button => {
    button.addEventListener("click", async () => {
      await upgradeTool(button.dataset.upgradeTool);
    });
  });

  document.querySelectorAll("[data-equip-tool]").forEach(button => {
    button.addEventListener("click", async () => {
      await equipTool(button.dataset.equipTool, Number(button.dataset.slot));
    });
  });
}

async function upgradeTool(toolId) {
  if (state.busyTools.has(toolId)) return;
  const tool = state.tools.find(item => item.id === toolId);
  if (!tool) {
    toast("Инструмент еще не открыт");
    haptic.warn();
    return;
  }
  const cost = toolUpgradeCost(tool.level);
  if (state.credits < cost) {
    toast(`Не хватает кредитов: нужно ₵ ${cost}`);
    haptic.warn();
    return;
  }

  state.busyTools.add(toolId);
  render();
  try {
    if (backendOnline) {
      const result = await apiRequest(`/api/tools/${toolId}/upgrade`, { method: "POST", body: {} });
      state.credits = result.wallet?.credits ?? state.credits;
      state.tools = state.tools.map(item => item.id === toolId ? enrichTool(result.tool) : item);
      await refreshBootstrap();
    } else {
      tool.level = Math.min(10, Number(tool.level || 1) + 1);
      state.credits -= cost;
    }
    render();
    toast(`${tool.name} улучшен`);
    haptic.ok();
  } catch (error) {
    toast(toolErrorMessage(error));
    haptic.error();
  } finally {
    if (state.busyTools.has(toolId)) {
      state.busyTools.delete(toolId);
      render();
    }
  }
}

async function equipTool(toolId, slotIndex) {
  if (state.busyTools.has(toolId)) return;
  const tool = state.tools.find(item => item.id === toolId);
  if (!tool) {
    toast("Инструмент еще не открыт");
    haptic.warn();
    return;
  }

  state.busyTools.add(toolId);
  render();
  try {
    if (backendOnline) {
      const result = await apiRequest(`/api/tools/${toolId}/equip`, {
        method: "POST",
        body: { slotIndex },
      });
      state.tools = (result.tools || state.tools).map(item => enrichTool(item));
      await refreshBootstrap();
    } else {
      state.tools.forEach(item => {
        if (Number(item.slotIndex) === slotIndex || item.id === toolId) {
          item.equipped = false;
          item.slotIndex = null;
        }
      });
      tool.equipped = true;
      tool.slotIndex = slotIndex;
    }
    render();
    toast(`${tool.name} установлен в слот ${slotIndex}`);
    haptic.ok();
  } catch (error) {
    toast(toolErrorMessage(error));
    haptic.error();
  } finally {
    if (state.busyTools.has(toolId)) {
      state.busyTools.delete(toolId);
      render();
    }
  }
}

function toolErrorMessage(error) {
  if (error.code === "not_enough_credits") return "Не хватает кредитов для улучшения.";
  if (error.code === "tool_max_level") return "Инструмент уже на максимальном уровне.";
  if (error.code === "tool_not_owned") return "Инструмент еще не открыт.";
  if (error.code === "bad_tool_slot") return "Некорректный слот инструмента.";
  return `Ошибка инструмента: ${error.message}`;
}

async function openZeroCache(count = 1) {
  const safeCount = Math.max(1, Math.min(10, Number(count || 1)));
  if (state.keys < safeCount) {
    toast(safeCount === 1 ? "Нужен хотя бы один Ключ Зеро" : "Для x10 нужно 10 Ключей Зеро");
    haptic.warn();
    return;
  }

  if (backendOnline) {
    try {
      const result = await apiRequest("/api/cache/open", {
        method: "POST",
        body: { count: safeCount },
      });
      await refreshBootstrap();
      const rewardCards = (result.results || []).map(drop => {
        const owned = state.cards.find(card => card.id === drop.cardId);
        return normalizeRewardCard({ ...drop, ...(owned || {}) });
      });
      render();
      showRewardSheet({
        title: safeCount > 1 ? "Тайники открыты" : "Тайник открыт",
        subtitle: `Осталось ключей: ${result.zeroKeysLeft}`,
        cards: rewardCards,
      });
      haptic.ok();
    } catch (error) {
      toast(`Тайник не открылся: ${error.message}`);
      haptic.error();
    }
    return;
  }

  const pool = state.cards.length ? state.cards : [
    { id: "card_001", name: "Фишинговая Маска", rarity: "common", level: 1 },
  ];
  const cards = Array.from({ length: safeCount }, () => normalizeRewardCard(pool[Math.floor(Math.random() * pool.length)]));
  state.keys -= safeCount;
  cards.forEach(card => grantMockCard(card));
  state.gacha.openCount = Number(state.gacha.openCount || 0) + safeCount;
  state.gacha.rarePity = Number(state.gacha.rarePity || 0) + safeCount;
  state.gacha.epicPity = Number(state.gacha.epicPity || 0) + safeCount;
  state.gacha.legendaryPity = Number(state.gacha.legendaryPity || 0) + safeCount;
  render();
  showRewardSheet({
    title: safeCount > 1 ? "Тайники открыты" : "Тайник открыт",
    subtitle: "Mock-режим: награда живет только до перезагрузки",
    cards,
  });
  haptic.ok();
}

function grantMockCard(card) {
  if (!card) return;
  const owned = state.cards.find(item => item.id === card.id);
  if (owned) {
    owned.duplicates = Number(owned.duplicates || 0) + 1;
    const target = duplicateTarget(owned.level);
    if (target && owned.duplicates >= target) {
      owned.level = Math.min(4, Number(owned.level || 1) + 1);
      owned.duplicates = 0;
      owned.isHolo = owned.level >= 4;
    }
    return;
  }
  state.cards.unshift(card);
}

async function buyProduct(productId) {
  if (!backendOnline) {
    toast("Покупки доступны только в API-режиме");
    haptic.warn();
    return;
  }
  if (state.busyProducts.has(productId)) return;
  state.busyProducts.add(productId);
  render();
  try {
    const invoice = await apiRequest("/api/payments/invoice", {
      method: "POST",
      body: { productId },
    });
    await refreshPaymentHistory();
    state.busyProducts.delete(productId);
    render();
    if (!invoice.invoiceUrl) {
      toast(invoice.demoMode ? "Счет создан в demo-режиме. Награда не выдана без оплаты." : "Счет создан, но Telegram-ссылка недоступна. Награда не выдана.");
      haptic.warn();
      return;
    }
    if (!tg?.openInvoice) {
      toast("Откройте игру в Telegram, чтобы оплатить счет");
      window.open(invoice.invoiceUrl, "_blank", "noopener");
      return;
    }
    tg.openInvoice(invoice.invoiceUrl, async status => {
      if (status === "paid") {
        toast("Платеж подтверждается Telegram...");
        setTimeout(async () => {
          await refreshBootstrap();
          render();
        }, 1500);
        haptic.ok();
      } else {
        toast(status === "cancelled" ? "Платеж отменен" : `Статус платежа: ${status}`);
        haptic.warn();
      }
    });
  } catch (error) {
    await refreshPaymentHistory().catch(() => {});
    toast(paymentErrorMessage(error));
    haptic.error();
  } finally {
    if (state.busyProducts.has(productId)) {
      state.busyProducts.delete(productId);
      render();
    }
  }
}

function paymentErrorMessage(error) {
  if (error.code === "invoice_link_failed") {
    return "Telegram не открыл счет. Проверь BOT_TOKEN, Stars payments и Mini App запуск из Telegram.";
  }
  if (error.code === "unknown_product") {
    return "Товар не найден в платежном каталоге.";
  }
  if (error.code === "unauthorized" || error.code === "missing_bearer_token") {
    return "Сессия устарела. Перезапусти Mini App.";
  }
  return `Счет не создан: ${error.message}`;
}

function toast(message) {
  document.querySelector(".toast")?.remove();
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  document.querySelector(".phone").appendChild(element);
  setTimeout(() => element.remove(), 1800);
}

function showRewardSheet({ title, subtitle = "", credits = 0, cards = [] }) {
  document.querySelector(".reward-layer")?.remove();
  const phone = document.querySelector(".phone");
  if (!phone) return;

  const normalizedCards = cards.map(normalizeRewardCard).filter(Boolean);
  const layer = document.createElement("div");
  layer.className = "reward-layer";
  layer.innerHTML = `
    <div class="reward-sheet">
      <div class="reward-burst"></div>
      <button class="close-btn reward-close" data-close-reward>Закрыть</button>
      <span class="eyebrow">награда получена</span>
      <h2>${title}</h2>
      ${subtitle ? `<p>${subtitle}</p>` : ""}
      ${credits ? `<div class="reward-currency"><span>₵</span><strong>+${credits.toLocaleString("ru-RU")}</strong><small>кредиты SOC</small></div>` : ""}
      ${normalizedCards.length ? `
        <div class="reward-cards">
          ${normalizedCards.map(card => `
            <article class="reward-card rarity-${card.rarity}">
              <small>${card.rarity.toUpperCase()}</small>
              <strong>${card.name}</strong>
              <span>Lv.${card.level}${card.isHolo ? " · HOLO" : ""} · ${duplicateLabel(card)}</span>
            </article>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
  phone.appendChild(layer);
  layer.querySelector("[data-close-reward]").addEventListener("click", () => layer.remove());
  layer.addEventListener("click", event => {
    if (event.target === layer) layer.remove();
  });
}

async function startPacketRain(threat) {
  if (state.energy <= 0) {
    toast("Энергия аналитика закончилась");
    haptic.error();
    return;
  }

  let backendAttempt = null;
  if (backendOnline) {
    try {
      backendAttempt = await apiRequest(`/api/threats/${threat.id}/start`, {
        method: "POST",
        body: {},
      });
      state.energy = backendAttempt.energyLeft;
    } catch (error) {
      toast(`Не удалось начать: ${error.message}`);
      haptic.error();
      return;
    }
  }

  const phone = document.querySelector(".phone");
  const toolEffects = getPacketRainToolEffects();
  const activeToolLabel = toolEffects.labels.length ? toolEffects.labels.join(" · ") : "basic mode";
  const overlay = document.createElement("div");
  overlay.className = "game-overlay";
  overlay.innerHTML = `
    <header class="game-header">
      <div class="game-title">
        <strong>Packet Rain</strong>
        <small>${activeToolLabel}</small>
      </div>
      <button class="close-btn" id="closeGame">Закрыть</button>
    </header>
    <canvas id="gameCanvas"></canvas>
    <footer class="game-footer">
      <span id="gameHint">← BLOCK · → PASS · ↑ QUARANTINE</span>
      <span id="gameShield"></span>
      <span id="gameScore">0 pts</span>
    </footer>
  `;
  phone.appendChild(overlay);

  const canvas = overlay.querySelector("#gameCanvas");
  const scoreEl = overlay.querySelector("#gameScore");
  const hintEl = overlay.querySelector("#gameHint");
  const shieldEl = overlay.querySelector("#gameShield");
  const ctx = canvas.getContext("2d");
  const packets = [];
  const types = ["pass", "block", "quarantine"];
  let score = 0;
  let combo = 0;
  let comboMax = 0;
  let mistakes = 0;
  let swipes = 0;
  let firewallCharges = toolEffects.firewallCharges;
  let firewallAbsorbed = 0;
  let furyUntil = 0;
  let running = true;
  let finishing = false;
  let lastSpawn = 0;
  let startedAt = performance.now();
  const durationLimitMs = 45000 + toolEffects.timeBonusMs;
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

  function getPriorityPacket() {
    if (!packets.length) return null;
    return packets.reduce((best, item) => item.y > best.y ? item : best, packets[0]);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = "rgba(255,255,255,.04)";
    for (let x = 0; x < canvas.clientWidth; x += 28) {
      ctx.fillRect(x, 0, 1, canvas.clientHeight);
    }
    const priorityPacket = toolEffects.scannerLevel ? getPriorityPacket() : null;
    for (const packet of packets) {
      const isPriority = packet === priorityPacket;
      if (isPriority) {
        ctx.beginPath();
        ctx.arc(packet.x, packet.y, packet.size + 8 + toolEffects.scannerLevel, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(56,216,255,.72)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
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
      if (isPriority && toolEffects.scannerLevel >= 2) {
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillStyle = "#38d8ff";
        ctx.fillText(packetActionLabel(packet.type), packet.x, packet.y - packet.size - 10);
      }
    }
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "13px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`combo ${combo} · max ${comboMax} · mistakes ${mistakes}`, 14, 24);
  }

  function registerMistake(source) {
    combo = 0;
    if (firewallCharges > 0) {
      firewallCharges -= 1;
      firewallAbsorbed += 1;
      toast(source === "miss" ? "Glass Firewall поймал пропущенный пакет" : "Glass Firewall поглотил ошибку");
      haptic.warn();
      return;
    }
    mistakes += 1;
    haptic.error();
  }

  function loop(now) {
    if (!running) return;
    spawn(now);
    packets.forEach(packet => {
      const furyMultiplier = now < furyUntil ? 0.58 : 1;
      packet.y += packet.speed * furyMultiplier;
    });
    for (let i = packets.length - 1; i >= 0; i -= 1) {
      if (packets[i].y > canvas.clientHeight + 40) {
        packets.splice(i, 1);
        registerMistake("miss");
      }
    }
    draw();
    scoreEl.textContent = `${score} pts`;
    const priorityPacket = toolEffects.scannerLevel ? getPriorityPacket() : null;
    hintEl.textContent = priorityPacket ? `Scanner: ${packetActionLabel(priorityPacket.type)}` : "← BLOCK · → PASS · ↑ QUARANTINE";
    shieldEl.textContent = firewallCharges > 0 ? `Firewall ${firewallCharges}` : `Ошибки ${mistakes}/6`;
    if (performance.now() - startedAt > durationLimitMs || mistakes >= 6) {
      finish();
      return;
    }
    requestAnimationFrame(loop);
  }

  function classify(direction) {
    if (!packets.length) return;
    swipes += 1;
    const packet = packets.reduce((best, item) => item.y > best.y ? item : best, packets[0]);
    const expected = packet.type;
    const ok = direction === expected;
    packets.splice(packets.indexOf(packet), 1);
    if (ok) {
      combo += 1;
      comboMax = Math.max(comboMax, combo);
      score += 100 + combo * 12;
      haptic.light();
      if (combo > 0 && combo % 10 === 0) {
        furyUntil = performance.now() + 6000;
        toast("Fury Analyst: время будто замедлилось");
        haptic.ok();
      }
    } else {
      registerMistake("wrong");
    }
  }

  async function finish() {
    if (finishing) return;
    finishing = true;
    running = false;
    const credits = Math.max(60, Math.floor(score / 16));
    if (backendOnline && backendAttempt) {
      try {
        const response = await apiRequest(`/api/attempts/${backendAttempt.attemptId}/finish`, {
          method: "POST",
          body: {
            gameType: "packet_rain",
            durationMs: Math.floor(performance.now() - startedAt),
            score,
            accuracy: Math.max(0, 1 - mistakes / 10),
            comboMax,
            inputSummary: {
              swipes,
              mistakes,
              firewallAbsorbed,
              tools: toolEffects.labels,
            },
          },
        });
        await refreshBootstrap();
        overlay.remove();
        render();
        if (response.accepted) {
          toast(`API: +${response.rewards.credits} кредитов`);
          showRewardSheet({
            title: "Угроза нейтрализована",
            subtitle: `Fair score +${response.fairScoreDelta}. Объект защищен.`,
            credits: response.rewards.credits,
            cards: response.rewards.cardDrops || [],
          });
          haptic.ok();
        } else {
          toast(`Сессия не засчитана: ${response.antiCheatFlags.join(", ")}`);
          haptic.error();
        }
        return;
      } catch (error) {
        overlay.remove();
        render();
        toast(`Ошибка finish: ${error.message}`);
        haptic.error();
        return;
      }
    }

    state.energy -= 1;
    state.credits += credits;
    const target = state.map.find(item => item.id === threat.objectId);
    if (target) {
      target.state = mistakes >= 6 ? "infected" : "protected";
      target.level = Math.min(10, target.level + (mistakes >= 6 ? 0 : 1));
    }
    state.threats = state.threats.filter(item => item.id !== threat.id);
    overlay.remove();
    render();
    if (mistakes >= 6) {
      toast("Угроза сорвалась. Объект заражен.");
      haptic.error();
    } else {
      toast(`Нейтрализация: +${credits} кредитов`);
      showRewardSheet({
        title: "Угроза нейтрализована",
        subtitle: "Mock-режим: прогресс не сохранится после перезагрузки",
        credits,
      });
      haptic.ok();
    }
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
connectBackend();
setInterval(refreshThreatTimers, 1000);
