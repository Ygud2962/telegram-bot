const runtime = window.ZDNETRuntime || {};
const tg = runtime.tg || window.Telegram?.WebApp;
const API_BASE = runtime.apiBase || window.ZDNET_CONFIG?.apiBase || localStorage.getItem("ZDNET_API_BASE") || "http://localhost:8090";
let sessionToken = null;
let backendOnline = false;

runtime.setupTelegram?.();

const haptic = runtime.createHaptics?.() || {
  light() {},
  ok() {},
  warn() {},
  error() {},
};

if (!window.ZDNETMockState?.createInitialState) {
  throw new Error("ZDNETMockState is not loaded");
}
const state = window.ZDNETMockState.createInitialState();
const ONBOARDING_KEY = "ZDNET_ONBOARDING_SEEN";
let onboardingShownThisSession = false;

function hasSeenOnboarding() {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch (error) {
    return false;
  }
}

function forceOnboarding() {
  try {
    return new URLSearchParams(window.location.search).get("tutorial") === "1";
  } catch (error) {
    return false;
  }
}

function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_KEY, "1");
  } catch (error) {
    // Mini App can still work if browser storage is unavailable.
  }
}
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
      document.querySelectorAll(`[data-threat-timer="${threat.id}"]`).forEach(element => {
        element.textContent = threat.timer;
      });
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
  requestAnimationFrame(maybeShowOnboarding);
}

function renderHud() {
  return html`
    <header class="hud">
      <div class="hud-top">
        <div class="brand">
          <span class="eyebrow"><i></i> SOC Новый Сектор · ${state.sync.toUpperCase()}</span>
          <strong>ZERO_DAY</strong>
        </div>
        <span class="status-chip">SOC Lv.${state.socLevel}</span>
      </div>
      <div class="hud-stats" aria-label="Ресурсы игрока">
        <span class="metric credits"><b>₵</b><span>${state.credits.toLocaleString("ru-RU")}</span><small>кредиты</small></span>
        <span class="metric energy"><b>⚡</b><span>${state.energy}/${state.energyMax}</span><small>энергия</small></span>
        <span class="metric rank"><b>#</b><span>${state.rank}</span><small>рейтинг</small></span>
        <span class="metric keys"><b>◇</b><span>${state.keys}</span><small>ключи</small></span>
        <span class="metric fragments"><b>✦</b><span>${state.cleanFragments}</span><small>фрагм.</small></span>
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

function clampMapCoord(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || min));
}

function mapObjectName(objectId) {
  return state.content.mapById[objectId]?.name || state.map.find(node => node.id === objectId)?.name || objectId;
}

function threatForObject(objectId) {
  return state.threats.find(threat => threat.objectId === objectId);
}

function getMapLayoutNodes() {
  const nodes = state.map.map((node, index) => ({
    ...node,
    x: clampMapCoord(node.x, 50, 330),
    y: clampMapCoord(node.y, 54, 246),
    index,
  }));

  for (let pass = 0; pass < 34; pass += 1) {
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const left = nodes[i];
        const right = nodes[j];
        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const minDistance = 78;
        if (distance >= minDistance) continue;
        const push = (minDistance - distance) / 2;
        const ux = dx / distance;
        const uy = dy / distance;
        left.x = clampMapCoord(left.x - ux * push, 50, 330);
        left.y = clampMapCoord(left.y - uy * push, 54, 246);
        right.x = clampMapCoord(right.x + ux * push, 50, 330);
        right.y = clampMapCoord(right.y + uy * push, 54, 246);
      }
    }
  }

  return nodes.map(node => ({
    ...node,
    x: Math.round(node.x),
    y: Math.round(node.y),
    threat: threatForObject(node.id),
  }));
}

function mapRoutePath(nodes) {
  if (!nodes.length) return "";
  return nodes.map((node, index) => `${index === 0 ? "M" : "L"}${node.x} ${node.y}`).join(" ");
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

function nodeStatusText(status) {
  return {
    protected: "Защищено",
    under_attack: "Под атакой",
    infected: "Заражено",
    locked: "Закрыто",
    boss: "Босс-угроза",
  }[status] || "Сканирование";
}

function getPrimaryThreat() {
  return state.threats.find(threat => threat.gameType === "packet_rain" || threat.game === "Packet Rain") || state.threats[0] || null;
}

function renderMissionCoach(activeCount) {
  const threat = getPrimaryThreat();
  const objectName = threat ? mapObjectName(threat.objectId) : "город";
  if (!activeCount || !threat) {
    return html`
      <section class="mission-coach calm">
        <div class="coach-copy">
          <span class="eyebrow">что делать сейчас</span>
          <h2>Сектор чистый. Усиливай команду.</h2>
          <p>Открой тайник, посмотри коллекцию или прокачай инструменты. Новая ежедневная угроза появится позже.</p>
        </div>
        <div class="coach-actions">
          <button class="primary-btn" data-tab="collection">Открыть коллекцию</button>
          <button class="secondary-btn" data-tab="tools">Инструменты</button>
        </div>
      </section>
    `;
  }
  const canLaunch = threat.gameType === "packet_rain" || threat.game === "Packet Rain";
  return html`
    <section class="mission-coach">
      <div class="coach-copy">
        <span class="eyebrow">что делать сейчас</span>
        <h2>1. Нажми объект «${objectName}»</h2>
        <p>Красная точка означает атаку. Открой объект, нажми нейтрализацию, пройди мини-игру и забери награду.</p>
      </div>
      <div class="coach-steps" aria-label="Игровой цикл">
        <span><b>1</b> объект</span>
        <span><b>2</b> мини-игра</span>
        <span><b>3</b> награда</span>
        <span><b>4</b> прокачка</span>
      </div>
      <div class="coach-actions">
        <button class="primary-btn" data-coach-object="${threat.objectId}">Показать объект</button>
        <button class="secondary-btn" data-coach-threat="${threat.id}" ${canLaunch ? "" : "disabled"}>${canLaunch ? "Начать сразу" : "Скоро"}</button>
      </div>
    </section>
  `;
}

function maybeShowOnboarding() {
  if (state.activeTab !== "map" || onboardingShownThisSession) return;
  if (!forceOnboarding() && hasSeenOnboarding()) return;
  if (!document.querySelector(".phone")) return;
  onboardingShownThisSession = true;
  showOnboarding();
}

function showOnboarding() {
  document.querySelector(".onboarding-layer")?.remove();
  const phone = document.querySelector(".phone");
  if (!phone) return;
  const threat = getPrimaryThreat();
  const objectName = threat ? mapObjectName(threat.objectId) : "первый объект";
  const layer = document.createElement("div");
  layer.className = "onboarding-layer";
  layer.innerHTML = `
    <section class="onboarding-sheet" role="dialog" aria-modal="true" aria-label="Как играть">
      <button class="close-btn onboarding-close" data-onboarding-later type="button" aria-label="Закрыть обучение">×</button>
      <span class="eyebrow">быстрый старт</span>
      <h2>Твоя задача — защитить город</h2>
      <p>Не ищи тесты и правильные ответы. Здесь всё через действия: нажать объект, пройти мини-игру, получить ресурсы и усилить SOC.</p>
      <div class="onboarding-steps">
        <article><b>1</b><strong>Смотри карту</strong><span>Красный объект = атака, фиолетовый = заражение.</span></article>
        <article><b>2</b><strong>Открой угрозу</strong><span>Нажми «${objectName}» или карточку угрозы.</span></article>
        <article><b>3</b><strong>Играй мини-игру</strong><span>В Packet Rain свайпай пакеты: BLOCK, PASS, QUAR.</span></article>
        <article><b>4</b><strong>Забери прогресс</strong><span>Кредиты, карточки и улучшения делают город сильнее.</span></article>
      </div>
      <div class="onboarding-actions">
        <button class="primary-btn" data-onboarding-start>Показать первую угрозу</button>
        <button class="secondary-btn" data-onboarding-done>Больше не показывать</button>
      </div>
    </section>
  `;
  phone.appendChild(layer);

  function close(markSeen = false) {
    if (markSeen) markOnboardingSeen();
    layer.remove();
  }

  layer.querySelector("[data-onboarding-start]")?.addEventListener("click", () => {
    close(true);
    if (threat) showLocationSheet(threat.objectId);
  });
  layer.querySelector("[data-onboarding-done]")?.addEventListener("click", () => close(true));
  layer.querySelector("[data-onboarding-later]")?.addEventListener("click", () => close(false));
  layer.addEventListener("click", event => {
    if (event.target === layer) close(false);
  });
}
function renderMap() {
  const activeCount = state.threats.length;
  const protectedCount = state.map.filter(node => node.state === "protected").length;
  const infectedCount = state.map.filter(node => node.state === "infected").length;
  const attackCount = state.map.filter(node => node.state === "under_attack").length;
  const cityIntegrity = Math.round((protectedCount / Math.max(1, state.map.length)) * 100);
  const energyPct = Math.round((state.energy / Math.max(1, state.energyMax)) * 100);
  const mapNodes = getMapLayoutNodes();
  const routePath = mapRoutePath(mapNodes);
  return html`
    <section class="hero-card command-hero">
      <div class="hero-copy">
        <span class="eyebrow">дежурство активно</span>
        <h1>Город держится на твоём SOC</h1>
        <p>${activeCount ? `На карте ${activeCount} активные угрозы. Выбери объект на карте или открой очередь угроз.` : "Сектор чистый. Поддерживай стрик и готовься к легендарному спавну."}</p>
        <div class="hero-actions" aria-label="Краткая сводка">
          <span>🛡 ${protectedCount}/${state.map.length} объектов защищено</span>
          <span>⚡ ${energyPct}% энергии</span>
          <span>🔥 ${activeCount || "нет"} угроз</span>
        </div>
      </div>
      <div class="command-orbit" aria-label="Индекс защиты города">
        <div class="integrity-ring" style="--value:${cityIntegrity}">
          <strong>${cityIntegrity}%</strong>
          <span>щит города</span>
        </div>
        <div class="daemon-orb" aria-label="Кибер-демон">
          <span>🐉</span>
        </div>
      </div>
    </section>

    ${renderMissionCoach(activeCount)}

    <section class="city-overview" aria-label="Состояние города">
      <article class="overview-tile safe"><span>защищено</span><strong>${protectedCount}</strong></article>
      <article class="overview-tile attack"><span>атака</span><strong>${attackCount}</strong></article>
      <article class="overview-tile infected"><span>заражено</span><strong>${infectedCount}</strong></article>
    </section>

    <article class="map-card command-map">
      <div class="section-title">
        <div>
          <span class="eyebrow">live city grid</span>
          <h2>Новый Сектор</h2>
        </div>
        <span class="map-status-pill">${cityIntegrity}% защищено</span>
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
          <linearGradient id="routeGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="rgba(56,216,255,.18)"/>
            <stop offset="55%" stop-color="rgba(0,255,132,.34)"/>
            <stop offset="100%" stop-color="rgba(255,211,106,.18)"/>
          </linearGradient>
        </defs>
        <path d="M54 104 C94 36 186 34 238 72 C304 78 336 125 322 184 C310 248 250 270 190 250 C128 254 74 224 66 166 C42 146 39 126 54 104Z" fill="rgba(255,255,255,.035)" stroke="rgba(255,255,255,.12)" stroke-width="1.5"/>
        <path class="city-route primary" d="${routePath}" fill="none" stroke="url(#routeGradient)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="city-route secondary" d="${routePath}" fill="none" stroke="rgba(56,216,255,.24)" stroke-width="2" stroke-linecap="round" stroke-dasharray="5 10"/>
        ${mapNodes.map(node => `
          <g class="map-node map-node-${node.state} ${node.threat ? "has-threat" : ""}" data-object="${node.id}" tabindex="0" role="button" aria-label="${node.name}: ${nodeStatusText(node.state)}">
            <circle class="node-pulse" cx="${node.x}" cy="${node.y}" r="34" fill="${nodeColor(node.state)}" opacity=".08"/>
            <circle class="node-pin" cx="${node.x}" cy="${node.y}" r="24" fill="rgba(6,10,18,.86)" stroke="${nodeColor(node.state)}" stroke-width="2.5" filter="url(#nodeGlow)"/>
            <circle cx="${node.x}" cy="${node.y}" r="7" fill="${nodeColor(node.state)}"/>
            <text class="map-node-index" x="${node.x}" y="${node.y + 4}" fill="#fff" font-size="10" text-anchor="middle">${node.index + 1}</text>
            ${node.threat ? `<text class="map-node-alert" x="${node.x + 18}" y="${node.y - 18}" fill="#ff453a" font-size="16" text-anchor="middle">!</text>` : ""}
          </g>
        `).join("")}
        <g class="daemon">
          <circle cx="224" cy="202" r="18" fill="rgba(0,212,255,.22)" stroke="var(--accent)" filter="url(#nodeGlow)"/>
          <text x="224" y="208" text-anchor="middle" font-size="22">🐉</text>
        </g>
      </svg>
      <div class="map-object-strip" aria-label="Объекты города">
        ${mapNodes.map(node => `
          <button class="map-object-chip map-node-${node.state} ${node.threat ? "has-threat" : ""}" data-object="${node.id}">
            <b>${node.index + 1}</b>
            <span>${node.name}</span>
            <small>${node.threat ? "угроза" : nodeStatusText(node.state)}</small>
          </button>
        `).join("")}
      </div>
      <div class="map-legend">
        <span><i class="safe"></i> защита</span>
        <span><i class="attack"></i> атака</span>
        <span><i class="infected"></i> заражение</span>
      </div>
    </article>

    <section class="threat-feed">
      <div class="section-title">
        <div>
          <span class="eyebrow">daily threat queue</span>
          <h2>Активные угрозы</h2>
        </div>
        <span>${activeCount ? "таймер идёт" : "нет атак"}</span>
      </div>
      ${state.threats.length ? state.threats.map(threat => `
        <button class="threat" data-threat="${threat.id}">
          <span class="threat-severity">D${threat.difficulty}</span>
          <span class="threat-body">
            <strong>${threat.title}</strong>
            <span>${threat.game} · ${threat.type}</span>
            <small>${mapObjectName(threat.objectId)}</small>
          </span>
          <span class="threat-meta">
            <b data-threat-timer="${threat.id}">${threat.timer}</b>
            <i>Нейтрализовать</i>
          </span>
        </button>
      `).join("") : `<div class="empty-card"><strong>Сектор чистый</strong><p>Нет активных угроз. Можно открыть тайник или проверить коллекцию.</p></div>`}
    </section>
  `;
}

function showLocationSheet(objectId) {
  document.querySelector(".location-layer")?.remove();
  const phone = document.querySelector(".phone");
  const node = state.map.find(item => item.id === objectId);
  if (!phone || !node) return;
  const threat = threatForObject(objectId);
  const canLaunch = threat && (threat.gameType === "packet_rain" || threat.game === "Packet Rain");
  const layer = document.createElement("div");
  layer.className = "location-layer";
  layer.innerHTML = `
    <section class="location-sheet map-node-${node.state}" role="dialog" aria-modal="true" aria-label="${node.name}">
      <button class="close-btn location-close" data-close-location type="button" aria-label="Закрыть">×</button>
      <div class="location-handle"></div>
      <div class="location-head">
        <span class="location-status">${nodeStatusText(node.state)}</span>
        <h2>${node.name}</h2>
        <p>${threat ? `Активная угроза: ${threat.title}. Таймер уже идёт.` : "Объект под наблюдением. Проверь инструменты или дождись новой угрозы."}</p>
      </div>
      <div class="location-metrics">
        <div><span>Защита</span><strong>${node.level}/10</strong></div>
        <div><span>Статус</span><strong>${nodeStatusLabel(node.state)}</strong></div>
        <div><span>Угроза</span><strong>${threat ? `D${threat.difficulty}` : "нет"}</strong></div>
      </div>
      ${threat ? `
        <article class="location-threat-card">
          <span>${threat.game} · ${threat.type}</span>
          <strong>${threat.title}</strong>
          <small data-threat-timer="${threat.id}">${threat.timer}</small>
        </article>
      ` : ""}
      <div class="location-actions">
        ${threat ? `<button class="primary-btn" data-location-threat="${threat.id}" ${canLaunch ? "" : "disabled"}>${canLaunch ? "Начать нейтрализацию" : "Мини-игра скоро"}</button>` : `<button class="primary-btn" data-location-tab="tools">Усилить защиту</button>`}
        <button class="secondary-btn" data-location-tab="collection">Коллекция</button>
      </div>
    </section>
  `;
  phone.appendChild(layer);

  function close() {
    layer.remove();
  }

  layer.querySelector("[data-close-location]")?.addEventListener("click", close);
  layer.querySelectorAll("[data-location-tab]").forEach(button => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.locationTab;
      close();
      render();
    });
  });
  layer.querySelector("[data-location-threat]")?.addEventListener("click", async buttonEvent => {
    const selectedThreat = state.threats.find(item => item.id === buttonEvent.currentTarget.dataset.locationThreat);
    close();
    await launchThreat(selectedThreat);
  });
  layer.addEventListener("click", event => {
    if (event.target === layer) close();
  });
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

async function launchThreat(threat) {
  if (!threat) return;
  if (threat.gameType === "packet_rain" || threat.game === "Packet Rain") {
    await startPacketRain(threat);
    return;
  }
  toast("Эта мини-игра будет во втором прототипе");
  haptic.warn();
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
      await launchThreat(threat);
    });
  });
  document.querySelectorAll("[data-object]").forEach(node => {
    const open = () => {
      showLocationSheet(node.dataset.object);
      haptic.light();
    };
    node.addEventListener("click", open);
    node.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      open();
    });
  });
  document.querySelectorAll("[data-coach-object]").forEach(button => {
    button.addEventListener("click", () => {
      showLocationSheet(button.dataset.coachObject);
      haptic.light();
    });
  });

  document.querySelectorAll("[data-coach-threat]").forEach(button => {
    button.addEventListener("click", async () => {
      const threat = state.threats.find(item => item.id === button.dataset.coachThreat);
      await launchThreat(threat);
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

function rewardAccuracy(mistakes) {
  return Math.max(0, Math.round((1 - Math.min(10, Number(mistakes || 0)) / 10) * 100));
}

function antiCheatMessage(flags = []) {
  const readable = {
    duration_too_short: "слишком короткая сессия",
    duration_too_long: "сессия превысила лимит времени",
    score_rate_too_high: "очки набраны быстрее допустимого лимита",
    game_type_mismatch: "тип игры не совпал с попыткой",
    unknown_game_type: "неизвестный тип мини-игры",
    negative_score: "некорректные очки",
    bad_accuracy: "некорректная точность",
    bad_combo: "некорректное комбо",
    input_summary_too_large: "слишком большой отчёт ввода",
  };
  const list = flags.map(flag => readable[flag] || flag).filter(Boolean);
  return list.length ? list.join(" · ") : "Сессия не прошла проверку честности.";
}

function showRewardSheet({ title, subtitle = "", credits = 0, cards = [], stats = [], actions = [], tone = "success" }) {
  document.querySelector(".reward-layer")?.remove();
  const phone = document.querySelector(".phone");
  if (!phone) return;

  const normalizedCards = cards.map(normalizeRewardCard).filter(Boolean);
  const safeStats = stats.filter(item => item && item.label && item.value !== undefined && item.value !== null);
  const safeActions = actions.length ? actions : [{ label: "Закрыть", close: true, primary: true }];
  const eyebrow = tone === "error" ? "проверка не пройдена" : "миссия завершена";
  const layer = document.createElement("div");
  layer.className = `reward-layer reward-layer-${tone}`;
  layer.innerHTML = `
    <div class="reward-sheet reward-${tone}" role="dialog" aria-modal="true" aria-label="Итог миссии">
      <div class="reward-burst"></div>
      <button class="close-btn reward-close" data-close-reward type="button" aria-label="Закрыть результат">×</button>
      <span class="eyebrow">${eyebrow}</span>
      <h2>${title}</h2>
      ${subtitle ? `<p>${subtitle}</p>` : ""}
      ${safeStats.length ? `
        <div class="reward-summary" aria-label="Статистика попытки">
          ${safeStats.map(item => `
            <div class="reward-stat">
              <span>${item.label}</span>
              <strong>${item.value}</strong>
            </div>
          `).join("")}
        </div>
      ` : ""}
      ${credits ? `<div class="reward-currency"><span>₵</span><strong>+${credits.toLocaleString("ru-RU")}</strong><small>кредиты SOC</small></div>` : ""}
      ${normalizedCards.length ? `
        <section class="reward-cards-wrap" aria-label="Полученные карточки">
          <div class="reward-section-title">
            <span>Card drop</span>
            <strong>${normalizedCards.length}</strong>
          </div>
          <div class="reward-cards">
            ${normalizedCards.map((card, index) => `
              <article class="reward-card rarity-${card.rarity} ${card.isHolo ? "holo" : ""}" style="--card-index:${index}">
                <div class="reward-card-art"><span>${cardArtGlyph(card)}</span></div>
                <small>${card.rarity.toUpperCase()}</small>
                <strong>${card.name}</strong>
                <span>Lv.${card.level}${card.isHolo ? " · HOLO" : ""} · ${duplicateLabel(card)}</span>
              </article>
            `).join("")}
          </div>
        </section>
      ` : ""}
      <div class="reward-actions">
        ${safeActions.map(action => {
          const attrs = [action.screen ? `data-reward-screen="${action.screen}"` : "", action.close ? "data-close-reward" : ""].filter(Boolean).join(" ");
          return `<button class="${action.primary ? "primary-btn" : "secondary-btn"}" type="button" ${attrs}>${action.label}</button>`;
        }).join("")}
      </div>
    </div>
  `;
  phone.appendChild(layer);

  function close() {
    layer.remove();
  }

  layer.querySelectorAll("[data-close-reward]").forEach(button => {
    button.addEventListener("click", close);
  });
  layer.querySelectorAll("[data-reward-screen]").forEach(button => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.rewardScreen || state.activeTab;
      close();
      render();
    });
  });
  layer.addEventListener("click", event => {
    if (event.target === layer) close();
  });
}

async function startPacketRain(threat) {
  if (state.energy <= 0) {
    toast("Энергия аналитика закончилась");
    haptic.error();
    return;
  }

  const phone = document.querySelector(".phone");
  if (!phone) return;

  const toolEffects = getPacketRainToolEffects();
  const activeToolLabel = toolEffects.labels.length ? toolEffects.labels.join(" · ") : "basic mode";
  const overlay = document.createElement("div");
  overlay.className = "game-overlay packet-rain-overlay";
  overlay.innerHTML = `
    <header class="game-header packet-game-header">
      <button class="game-back-btn" id="closeGame" type="button" aria-label="Закрыть игру">‹</button>
      <div class="game-title">
        <strong>Packet Rain</strong>
        <small>${activeToolLabel}</small>
      </div>
      <div class="game-status-dot" aria-label="SOC online"></div>
    </header>
    <section class="game-hud" aria-label="Статистика игры">
      <div class="game-stat">
        <span>Очки</span>
        <strong id="gameScore">0</strong>
      </div>
      <div class="game-stat">
        <span>Комбо</span>
        <strong id="gameCombo">0</strong>
      </div>
      <div class="game-stat">
        <span>Время</span>
        <strong id="gameTime">45с</strong>
      </div>
    </section>
    <div class="game-canvas-wrap">
      <canvas id="gameCanvas"></canvas>
      <section class="game-intro" id="gameIntro">
        <div class="game-intro-card">
          <span class="game-kicker">SOC TRAINING</span>
          <h2>Разбери поток пакетов</h2>
          <p>Свайпай ближайший пакет: вредный блокируй, нормальный пропускай, подозрительный отправляй в карантин.</p>
          <div class="packet-controls">
            <div class="control-card control-block"><b>←</b><span>BLOCK</span><small>вредный</small></div>
            <div class="control-card control-pass"><b>→</b><span>PASS</span><small>чистый</small></div>
            <div class="control-card control-quar"><b>↑</b><span>QUAR</span><small>подозрительный</small></div>
          </div>
          <div class="game-loadout">
            <span>Инструменты</span>
            <strong>${activeToolLabel}</strong>
          </div>
          <button class="primary-btn game-start-btn" id="startGame" type="button">Начать нейтрализацию</button>
        </div>
      </section>
      <div class="game-fury" id="gameFury">Fury Analyst</div>
    </div>
    <footer class="game-footer packet-game-footer">
      <span id="gameHint">Нажми старт, затем свайпай пакеты</span>
      <span id="gameShield">Ошибки 0/6</span>
    </footer>
  `;
  phone.appendChild(overlay);

  const canvas = overlay.querySelector("#gameCanvas");
  const scoreEl = overlay.querySelector("#gameScore");
  const comboEl = overlay.querySelector("#gameCombo");
  const timeEl = overlay.querySelector("#gameTime");
  const hintEl = overlay.querySelector("#gameHint");
  const shieldEl = overlay.querySelector("#gameShield");
  const furyEl = overlay.querySelector("#gameFury");
  const introEl = overlay.querySelector("#gameIntro");
  const startBtn = overlay.querySelector("#startGame");
  const ctx = canvas.getContext("2d");
  const packets = [];
  const popups = [];
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
  let gameStarted = false;
  let backendStarting = false;
  let finishing = false;
  let lastSpawn = 0;
  let startedAt = 0;
  let backendAttempt = null;
  let pointerStart = null;
  let animationFrame = null;
  const durationLimitMs = 45000 + toolEffects.timeBonusMs;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawIdle();
  }

  function packetColor(type) {
    return { pass: "#34c759", block: "#ff375f", quarantine: "#ffd60a" }[type] || "#ffffff";
  }

  function packetLabel(type) {
    return { pass: "PASS", block: "MAL", quarantine: "SUS" }[type] || "PKT";
  }

  function packetCaption(type) {
    return { pass: "trusted", block: "block", quarantine: "quarantine" }[type] || "packet";
  }

  function getPriorityPacket() {
    if (!packets.length) return null;
    return packets.reduce((best, item) => item.y > best.y ? item : best, packets[0]);
  }

  function timeLeft(now = performance.now()) {
    if (!gameStarted || !startedAt) return durationLimitMs;
    return Math.max(0, durationLimitMs - (now - startedAt));
  }

  function updateHud(now = performance.now()) {
    scoreEl.textContent = `${score}`;
    comboEl.textContent = `${combo}×`;
    timeEl.textContent = `${Math.ceil(timeLeft(now) / 1000)}с`;
    const priorityPacket = toolEffects.scannerLevel ? getPriorityPacket() : null;
    hintEl.textContent = priorityPacket ? `Scanner: ${packetActionLabel(priorityPacket.type)}` : "← BLOCK · → PASS · ↑ QUARANTINE";
    shieldEl.textContent = firewallCharges > 0 ? `Firewall ${firewallCharges}` : `Ошибки ${mistakes}/6`;
    overlay.classList.toggle("is-fury", now < furyUntil);
    furyEl.classList.toggle("is-visible", now < furyUntil);
  }

  function drawBackground(now = performance.now()) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const offset = (now / 32) % 36;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(5, 14, 28, 1)");
    gradient.addColorStop(0.48, "rgba(1, 7, 13, 1)");
    gradient.addColorStop(1, "rgba(10, 5, 22, 1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "rgba(100, 210, 255, .34)";
    ctx.lineWidth = 1;
    for (let x = -36; x < width + 36; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x - offset * 0.25, height);
      ctx.stroke();
    }
    for (let y = -36; y < height + 36; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y + offset);
      ctx.lineTo(width, y + offset);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = now < furyUntil ? 0.42 : 0.18;
    ctx.fillStyle = now < furyUntil ? "rgba(255, 214, 10, .18)" : "rgba(0, 122, 255, .16)";
    ctx.beginPath();
    ctx.ellipse(width * 0.52, height * 0.18, width * 0.42, height * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawIdle() {
    if (!ctx || gameStarted) return;
    drawBackground();
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.font = "800 22px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("PACKET RAIN", width / 2, Math.max(72, height * 0.22));
    ctx.fillStyle = "rgba(255,255,255,.48)";
    ctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("waiting for analyst input", width / 2, Math.max(96, height * 0.22 + 24));
    ctx.restore();
  }

  function spawn(now) {
    const spawnDelay = now < furyUntil ? 560 : 700;
    if (now - lastSpawn < spawnDelay) return;
    lastSpawn = now;
    const width = canvas.clientWidth;
    packets.push({
      x: 42 + Math.random() * Math.max(1, width - 84),
      y: -28,
      type: types[Math.floor(Math.random() * types.length)],
      speed: 1.28 + Math.random() * 1.86 + Math.min(0.7, score / 9000),
      size: 22 + Math.random() * 8,
      spin: Math.random() * Math.PI,
    });
  }

  function roundRectPath(context, x, y, width, height, radius) {
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawPacket(packet, isPriority) {
    const radius = packet.size;
    const color = packetColor(packet.type);
    ctx.save();
    ctx.translate(packet.x, packet.y);
    ctx.rotate(Math.sin(packet.spin) * 0.08);
    ctx.shadowBlur = isPriority ? 24 : 16;
    ctx.shadowColor = isPriority ? "#64d2ff" : color;
    ctx.fillStyle = "rgba(8, 12, 18, .88)";
    ctx.strokeStyle = color;
    ctx.lineWidth = isPriority ? 3 : 2;
    roundRectPath(ctx, -radius * 1.15, -radius * 0.86, radius * 2.3, radius * 1.72, 13);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = `${color}24`;
    roundRectPath(ctx, -radius * 0.82, -radius * 0.56, radius * 1.64, radius * 1.12, 10);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(packetLabel(packet.type), 0, 4);
    ctx.fillStyle = "rgba(255,255,255,.52)";
    ctx.font = "700 8px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(packetCaption(packet.type), 0, 16);
    ctx.restore();

    if (isPriority) {
      ctx.save();
      ctx.strokeStyle = "rgba(100, 210, 255, .75)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(packet.x, packet.y, radius + 12 + toolEffects.scannerLevel, 0, Math.PI * 2);
      ctx.stroke();
      if (toolEffects.scannerLevel >= 2) {
        ctx.setLineDash([]);
        ctx.fillStyle = "#64d2ff";
        ctx.font = "800 10px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText(packetActionLabel(packet.type), packet.x, packet.y - radius - 18);
      }
      ctx.restore();
    }
  }

  function drawPopups(now) {
    for (let i = popups.length - 1; i >= 0; i -= 1) {
      const popup = popups[i];
      const age = now - popup.createdAt;
      if (age > 620) {
        popups.splice(i, 1);
        continue;
      }
      const progress = age / 620;
      ctx.save();
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = popup.color;
      ctx.font = "900 16px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(popup.text, popup.x, popup.y - progress * 34);
      ctx.restore();
    }
  }

  function draw(now = performance.now()) {
    drawBackground(now);
    const priorityPacket = toolEffects.scannerLevel ? getPriorityPacket() : null;
    for (const packet of packets) {
      drawPacket(packet, packet === priorityPacket);
    }
    drawPopups(now);
  }

  function registerMistake(source) {
    combo = 0;
    if (firewallCharges > 0) {
      firewallCharges -= 1;
      firewallAbsorbed += 1;
      toast(source === "miss" ? "Glass Firewall поймал пропущенный пакет" : "Glass Firewall поглотил ошибку");
      haptic.warn();
      updateHud();
      return;
    }
    mistakes += 1;
    haptic.error();
    updateHud();
  }

  function loop(now) {
    if (!running || !gameStarted) return;
    spawn(now);
    packets.forEach(packet => {
      const furyMultiplier = now < furyUntil ? 0.56 : 1;
      packet.y += packet.speed * furyMultiplier;
      packet.spin += 0.015;
    });
    for (let i = packets.length - 1; i >= 0; i -= 1) {
      if (packets[i].y > canvas.clientHeight + 46) {
        popups.push({
          x: packets[i].x,
          y: Math.max(42, canvas.clientHeight - 24),
          text: "MISS",
          color: "#ff453a",
          createdAt: now,
        });
        packets.splice(i, 1);
        registerMistake("miss");
      }
    }
    draw(now);
    updateHud(now);
    if (timeLeft(now) <= 0 || mistakes >= 6) {
      finish();
      return;
    }
    animationFrame = requestAnimationFrame(loop);
  }

  function classify(direction) {
    if (!running || !gameStarted || !packets.length) return;
    swipes += 1;
    const packet = getPriorityPacket();
    const expected = packet.type;
    const ok = direction === expected;
    packets.splice(packets.indexOf(packet), 1);
    if (ok) {
      combo += 1;
      comboMax = Math.max(comboMax, combo);
      score += 100 + combo * 12;
      popups.push({ x: packet.x, y: packet.y, text: `+${100 + combo * 12}`, color: packetColor(expected), createdAt: performance.now() });
      haptic.light();
      if (combo > 0 && combo % 10 === 0) {
        furyUntil = performance.now() + 6000;
        toast("Fury Analyst: время замедлено");
        haptic.ok();
      }
    } else {
      popups.push({ x: packet.x, y: packet.y, text: "WRONG", color: "#ff453a", createdAt: performance.now() });
      registerMistake("wrong");
    }
    updateHud();
  }

  function removeOverlay() {
    running = false;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    window.removeEventListener("keydown", keyHandler);
    window.removeEventListener("resize", resize);
    overlay.remove();
  }

  async function finish() {
    if (finishing) return;
    finishing = true;
    running = false;
    const durationMs = Math.max(0, Math.floor(performance.now() - startedAt));
    const credits = Math.max(60, Math.floor(score / 16));
    const resultStats = [
      { label: "Очки", value: score.toLocaleString("ru-RU") },
      { label: "Точность", value: `${rewardAccuracy(mistakes)}%` },
      { label: "Комбо", value: `${comboMax}×` },
      { label: "Свайпы", value: swipes.toLocaleString("ru-RU") },
    ];
    const resultActions = [
      { label: "На карту", screen: "map", primary: true },
      { label: "В коллекцию", screen: "collection" },
    ];
    if (backendOnline && backendAttempt) {
      try {
        const response = await apiRequest(`/api/attempts/${backendAttempt.attemptId}/finish`, {
          method: "POST",
          body: {
            gameType: "packet_rain",
            durationMs,
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
        removeOverlay();
        render();
        if (response.accepted) {
          toast(`API: +${response.rewards.credits} кредитов`);
          showRewardSheet({
            title: "Угроза нейтрализована",
            subtitle: `Fair score +${response.fairScoreDelta}. Объект защищён.`,
            credits: response.rewards.credits,
            cards: response.rewards.cardDrops || [],
            stats: [
              ...resultStats,
              { label: "Fair", value: `+${response.fairScoreDelta}` },
            ],
            actions: resultActions,
          });
          haptic.ok();
        } else {
          showRewardSheet({
            title: "Сессия не засчитана",
            subtitle: antiCheatMessage(response.antiCheatFlags || []),
            stats: resultStats,
            tone: "error",
            actions: [
              { label: "На карту", screen: "map", primary: true },
              { label: "Закрыть", close: true },
            ],
          });
          haptic.error();
        }
        return;
      } catch (error) {
        removeOverlay();
        render();
        showRewardSheet({
          title: "Ошибка синхронизации",
          subtitle: `Backend не принял результат: ${error.message}`,
          stats: resultStats,
          tone: "error",
          actions: [
            { label: "На карту", screen: "map", primary: true },
            { label: "Закрыть", close: true },
          ],
        });
        haptic.error();
        return;
      }
    }

    const success = mistakes < 6;
    const mockDrop = success && rewardAccuracy(mistakes) >= 75 && state.cards.length
      ? normalizeRewardCard(state.cards[(score + comboMax) % state.cards.length])
      : null;
    state.energy -= 1;
    if (success) {
      state.credits += credits;
      if (mockDrop) grantMockCard(mockDrop);
    }
    const target = state.map.find(item => item.id === threat.objectId);
    if (target) {
      target.state = success ? "protected" : "infected";
      target.level = Math.min(10, target.level + (success ? 1 : 0));
    }
    state.threats = state.threats.filter(item => item.id !== threat.id);
    removeOverlay();
    render();
    if (!success) {
      toast("Угроза сорвалась. Объект заражён.");
      showRewardSheet({
        title: "Угроза сорвалась",
        subtitle: "Слишком много ошибок. Объект заражён, восстановление будет дороже.",
        stats: resultStats,
        tone: "error",
        actions: [
          { label: "На карту", screen: "map", primary: true },
          { label: "Закрыть", close: true },
        ],
      });
      haptic.error();
    } else {
      toast(`Нейтрализация: +${credits} кредитов`);
      showRewardSheet({
        title: "Угроза нейтрализована",
        subtitle: "Mock-режим: прогресс не сохранится после перезагрузки",
        credits,
        cards: mockDrop ? [mockDrop] : [],
        stats: resultStats,
        actions: resultActions,
      });
      haptic.ok();
    }
  }

  async function beginGame() {
    if (backendStarting || gameStarted || finishing) return;
    backendStarting = true;
    startBtn.disabled = true;
    startBtn.textContent = backendOnline ? "Создаю сессию..." : "Запуск...";
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
        removeOverlay();
        return;
      }
    }
    backendStarting = false;
    gameStarted = true;
    startedAt = performance.now();
    lastSpawn = startedAt - 520;
    overlay.classList.add("is-running");
    introEl.remove();
    resize();
    updateHud(startedAt);
    haptic.ok();
    animationFrame = requestAnimationFrame(loop);
  }

  canvas.addEventListener("pointerdown", event => {
    if (!gameStarted) return;
    pointerStart = { x: event.clientX, y: event.clientY };
  });

  canvas.addEventListener("pointerup", event => {
    if (!gameStarted || !pointerStart) return;
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
    if (!running || !gameStarted) return;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowLeft") classify("block");
    if (event.key === "ArrowRight") classify("pass");
    if (event.key === "ArrowUp") classify("quarantine");
  }

  overlay.querySelector("#closeGame").addEventListener("click", removeOverlay);
  startBtn.addEventListener("click", beginGame);

  resize();
  updateHud();
  window.addEventListener("resize", resize);
}

render();
connectBackend();
setInterval(refreshThreatTimers, 1000);
