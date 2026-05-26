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
  shopProducts: [],
  payments: [],
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
    { id: "scanner", name: "Pulse Scanner", className: "Scanner", level: 2, equipped: true },
    { id: "firewall", name: "Glass Firewall", className: "Firewall", level: 1, equipped: true },
    { id: "crypto", name: "Shift Dial", className: "Crypto", level: 1, equipped: false },
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
    throw new Error(data.error || `HTTP ${response.status}`);
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
            ${tool.description ? `<p>${tool.description}</p>` : ""}
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCollection() {
  return html`
    <section class="cache-card">
      <div>
        <span class="eyebrow">Zero Cache</span>
        <h2>Тайники Зеро</h2>
        <p>Открывай за ключи, собирай угрозы и прокачивай дубли. Pity защищает от бесконечной невезухи.</p>
      </div>
      <button class="primary-btn" data-open-cache ${state.keys <= 0 ? "disabled" : ""}>
        Открыть · ◇ ${state.keys}
      </button>
    </section>

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
            ${card.fact ? `<p>${card.fact}</p>` : ""}
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function normalizeRewardCard(drop) {
  if (!drop) return null;
  if (typeof drop === "string") {
    return enrichCard({ id: drop });
  }
  return enrichCard({
    id: drop.cardId || drop.id,
    name: drop.name,
    rarity: drop.rarity,
    level: drop.level || 1,
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
  return html`
    <section class="panel" style="padding:18px">
      <div class="section-title">
        <h2>Магазин</h2>
        <span>Telegram Stars · честно</span>
      </div>
      <div class="grid">
        ${products.map(product => `
          <div class="tool-tile">
            <strong>${product.title}</strong>
            <p>${product.description}</p>
            <button class="primary-btn" data-buy-product="${product.productId}">
              Купить за ${product.amount} ${product.currency === "XTR" ? "⭐" : product.currency}
            </button>
          </div>
        `).join("")}
      </div>
      <div class="section-title" style="margin-top:18px">
        <h2>История</h2>
        <span>${state.payments.length} платежей</span>
      </div>
      <div class="grid">
        ${lastPayments.length ? lastPayments.map(payment => `
          <div class="tool-tile">
            <strong>${payment.title || payment.productId}</strong>
            <p>${payment.status} · ${payment.amount || payment.amountMinor} ${payment.currency}</p>
          </div>
        `).join("") : `<div class="tool-tile"><strong>Пока пусто</strong><p>Покупки появятся здесь только после создания счета.</p></div>`}
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
      await openZeroCache();
    });
  });
}

async function openZeroCache() {
  if (state.keys <= 0) {
    toast("Нужен хотя бы один Ключ Зеро");
    haptic.warn();
    return;
  }

  if (backendOnline) {
    try {
      const result = await apiRequest("/api/cache/open", {
        method: "POST",
        body: { count: 1 },
      });
      await refreshBootstrap();
      render();
      showRewardSheet({
        title: "Тайник открыт",
        subtitle: `Осталось ключей: ${result.zeroKeysLeft}`,
        cards: result.results || [],
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
  const card = normalizeRewardCard(pool[Math.floor(Math.random() * pool.length)]);
  state.keys -= 1;
  grantMockCard(card);
  render();
  showRewardSheet({
    title: "Тайник открыт",
    subtitle: "Mock-режим: награда живет только до перезагрузки",
    cards: [card],
  });
  haptic.ok();
}

function grantMockCard(card) {
  if (!card) return;
  const owned = state.cards.find(item => item.id === card.id);
  if (owned) {
    owned.level = Math.min(4, (owned.level || 1) + 1);
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
  try {
    const invoice = await apiRequest("/api/payments/invoice", {
      method: "POST",
      body: { productId },
    });
    await refreshPaymentHistory();
    render();
    if (!invoice.invoiceUrl) {
      toast(invoice.demoMode ? "Счет создан в demo-режиме, награда не выдана" : "Не удалось получить ссылку счета");
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
    toast(`Счет не создан: ${error.message}`);
    haptic.error();
  }
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
              <span>Lv.${card.level}</span>
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
  let finishing = false;
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
            comboMax: combo,
            inputSummary: { swipes: score > 0 ? Math.floor(score / 100) : 0, mistakes },
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
