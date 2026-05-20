// ============================================================
// ZERO_DAY: Школьный Протокол — APP ENGINE v2.0
// Full game engine with episodes, progression, achievements
// ============================================================

(function () {
  'use strict';

  // ---- TELEGRAM WEBAPP ----
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation?.();
    if (tg.setHeaderColor) tg.setHeaderColor('#0a0a0f');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#0a0a0f');
  }

  function haptic(type) {
    if (tg?.HapticFeedback) {
      const map = { light: 'light', medium: 'medium', heavy: 'heavy', 
                    success: 'success', error: 'error', warning: 'warning' };
      if (type === 'light' || type === 'medium' || type === 'heavy') {
        tg.HapticFeedback.impactOccurred(map[type] || 'light');
      } else {
        tg.HapticFeedback.notificationOccurred(map[type] || 'success');
      }
    }
  }

  // ---- DOM REFS ----
  const frame = document.getElementById('appFrame');
  const bottomNav = document.getElementById('bottomNav');
  const statusBar = document.getElementById('statusBar');
  const sbTime = document.getElementById('sbTime');
  const sbBattFill = document.getElementById('sbBattFill');
  const preloader = document.getElementById('preloader');
  const preloaderText = document.getElementById('preloaderText');
  const preloaderProgress = document.getElementById('preloaderProgress');
  const dynamicIsland = document.getElementById('dynamicIsland');

  // ---- STATE ----
  let currentScreen = 'home';
  let currentChat = null;
  let navHistory = [];
  let isTransitioning = false;
  let islandTimeout = null;
  let playTimeInterval = null;
  let tutorialStep = 0;

  // ---- CLOCK & BATTERY ----
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    if (sbTime) sbTime.textContent = h + ':' + m;
  }
  updateClock();
  setInterval(updateClock, 15000);

  function updateBattery() {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(bat => {
        const level = Math.round(bat.level * 100);
        if (sbBattFill) {
          sbBattFill.style.width = level + '%';
          sbBattFill.classList.toggle('low', level <= 20);
          sbBattFill.classList.toggle('charging', bat.charging);
        }
      });
    }
  }
  updateBattery();

  // ---- PLAY TIME ----
  function startPlayTime() {
    playTimeInterval = setInterval(() => {
      ZD.state.playTime++;
      if (ZD.state.playTime % 60 === 0) ZD.saveState();
    }, 1000);
  }

  // ---- PRELOADER ----
  const preloaderTexts = [
    'Инициализация протоколов...',
    'Загрузка данных...',
    'Проверка безопасности...',
    'Подключение к серверу...',
    'Готово!'
  ];

  function runPreloader() {
    if (!preloader || !preloaderProgress) return;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (preloaderText) preloaderText.textContent = preloaderTexts[Math.min(step, preloaderTexts.length - 1)];
      if (step >= 4) {
        clearInterval(interval);
        preloader.classList.add('done');
        setTimeout(() => {
          preloader.remove();
          if (!ZD.state.tutorialSeen) showTutorial();
        }, 600);
      }
    }, 400);
  }
  setTimeout(runPreloader, 100);

  // ---- TOAST ----
  function toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    frame.appendChild(t);
    haptic(type === 'danger' ? 'error' : type === 'warn' ? 'warning' : 'success');
    setTimeout(() => t.remove(), 2200);
  }

  // ---- DYNAMIC ISLAND ----
  function showIsland(text, duration = 2000) {
    if (!dynamicIsland) return;
    dynamicIsland.textContent = text;
    dynamicIsland.classList.add('active');
    clearTimeout(islandTimeout);
    islandTimeout = setTimeout(() => {
      dynamicIsland.classList.remove('active');
      dynamicIsland.textContent = '';
    }, duration);
  }

  // ---- STARS & STATS ----
  function addStars(n) {
    if (n <= 0) return;
    ZD.state.stars += n;
    updateStarsDisplay();
    toast('+' + n + ' ⭐ Stars', 'success');
    checkAchievements();
    ZD.saveState();
  }

  function updateStarsDisplay() {
    document.querySelectorAll('.stars-val').forEach(el => {
      el.textContent = ZD.state.stars;
    });
  }

  function updateReputation(delta) {
    ZD.state.reputation = Math.max(0, Math.min(100, ZD.state.reputation + delta));
    ZD.saveState();
  }

  function updateTrust(delta) {
    ZD.state.trust = Math.max(0, Math.min(100, ZD.state.trust + delta));
    ZD.saveState();
  }

  // ---- ACHIEVEMENTS ----
  function checkAchievements() {
    const s = ZD.state;
    const checks = [
      { id: 'first_steps', check: () => s.episode > 1 },
      { id: 'team_player', check: () => s.episode > 2 },
      { id: 'detective', check: () => s.analyzed.size >= 6 },
      { id: 'hacker', check: () => s.termSolved },
      { id: 'paranoid', check: () => s.foundFlags.size >= 8 },
      { id: 'shopaholic', check: () => s.inventory.length >= 6 },
      { id: 'rich', check: () => s.stars >= 100 },
      { id: 'legend', check: () => s.episode > 5 },
    ];

    checks.forEach(({ id, check }) => {
      if (!s.achievements.has(id) && check()) {
        s.achievements.add(id);
        const ach = ZD.achievements.find(a => a.id === id);
        if (ach) {
          showAchievement(ach);
          addStars(ach.stars);
        }
        ZD.saveState();
      }
    });
  }

  function showAchievement(ach) {
    const overlay = document.createElement('div');
    overlay.className = 'ach-overlay open';
    overlay.innerHTML = `
      <div class="ach-card">
        <div class="ach-close" onclick="this.closest('.ach-overlay').remove()">×</div>
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-title">${ach.title}</div>
        <div class="ach-desc">${ach.desc}</div>
        <div class="ach-stars">+${ach.stars} ⭐</div>
      </div>
    `;
    frame.appendChild(overlay);
    haptic('success');
    setTimeout(() => overlay.remove(), 4000);
  }

  // ---- EPISODE PROGRESSION ----
  function completeEpisode(epId) {
    const ep = ZD.episodes.find(e => e.id === epId);
    if (!ep || ep.done) return;

    ep.done = true;
    ep.active = false;
    ZD.state.episodeProgress[epId] = true;

    // Unlock next episode
    const nextEp = ZD.episodes.find(e => e.id === epId + 1);
    if (nextEp) {
      nextEp.locked = false;
      nextEp.active = true;
    }

    // Advance player episode
    ZD.state.episode = Math.max(ZD.state.episode, epId + 1);
    if (epId >= 3) ZD.state.act = 2;

    addStars(ep.starsReward);
    ZD.saveState();

    showEpisodeComplete(ep);
  }

  function showEpisodeComplete(ep) {
    const overlay = document.createElement('div');
    overlay.className = 'ep-complete open';
    overlay.innerHTML = `
      <div class="ep-complete-icon">🎉</div>
      <div class="ep-complete-title">Эпизод ${ep.id} пройден!</div>
      <div class="ep-complete-sub">«${ep.title}»<br>${ep.subtitle}</div>
      <div class="ep-complete-stats">
        <div class="ep-complete-stat">
          <div class="ep-complete-stat-val">+${ep.starsReward}</div>
          <div class="ep-complete-stat-lbl">Stars</div>
        </div>
        <div class="ep-complete-stat">
          <div class="ep-complete-stat-val">${ZD.state.reputation}</div>
          <div class="ep-complete-stat-lbl">Репутация</div>
        </div>
        <div class="ep-complete-stat">
          <div class="ep-complete-stat-val">${ZD.state.trust}%</div>
          <div class="ep-complete-stat-lbl">Доверие</div>
        </div>
      </div>
      <button class="ep-complete-btn" onclick="this.closest('.ep-complete').remove();ZD_APP.navigateTo('home')">
        Продолжить
      </button>
    `;
    frame.appendChild(overlay);
    haptic('success');
  }

  // ---- TUTORIAL ----
  function showTutorial() {
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay open';
    overlay.id = 'tutorialOverlay';
    renderTutorialStep(overlay);
    frame.appendChild(overlay);
  }

  function renderTutorialStep(overlay) {
    const step = ZD.tutorial[tutorialStep];
    const isLast = tutorialStep >= ZD.tutorial.length - 1;

    overlay.innerHTML = `
      <div class="tutorial-skip" onclick="skipTutorial()">Пропустить</div>
      <div class="tutorial-card">
        <div class="tutorial-icon">${step.icon}</div>
        <div class="tutorial-title">${step.title}</div>
        <div class="tutorial-text">${step.text}</div>
        <div class="tutorial-dots">
          ${ZD.tutorial.map((_, i) => `<div class="tutorial-dot ${i === tutorialStep ? 'active' : ''}"></div>`).join('')}
        </div>
        <button class="tutorial-btn" onclick="nextTutorialStep()">
          ${isLast ? 'Начать игру!' : 'Далее'}
        </button>
      </div>
    `;
  }

  window.nextTutorialStep = function() {
    tutorialStep++;
    const overlay = document.getElementById('tutorialOverlay');
    if (tutorialStep >= ZD.tutorial.length) {
      ZD.state.tutorialSeen = true;
      ZD.saveState();
      overlay?.remove();
      startPlayTime();
      return;
    }
    renderTutorialStep(overlay);
    haptic('light');
  };

  window.skipTutorial = function() {
    ZD.state.tutorialSeen = true;
    ZD.saveState();
    document.getElementById('tutorialOverlay')?.remove();
    startPlayTime();
  };

  // ---- RIPPLE ----
  function createRipple(e, el) {
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,255,255,0.15);transform:scale(0);animation:ripple 0.6s ease-out;pointer-events:none;width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px;`;
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  function bindRipple(selector, container) {
    (container || document).querySelectorAll(selector).forEach(el => {
      el.addEventListener('click', e => createRipple(e, el));
    });
  }

  // ---- BOTTOM NAV ----
  function buildNav() {
    const items = [
      { id: 'home',      ico: '🏠', label: 'ГЛАВНАЯ' },
      { id: 'messenger', ico: '💬', label: 'ЧАТЫ',    badge: getUnreadCount() },
      { id: 'map',       ico: '🗺️', label: 'КАРТА' },
      { id: 'shop',      ico: '🛒', label: 'МАГАЗИН' },
    ];
    bottomNav.innerHTML = items.map(it => `
      <div class="nav-item ${it.id === 'home' ? 'active' : ''}" data-nav="${it.id}">
        ${it.badge ? `<div class="nav-dot"></div>` : ''}
        <span class="nav-ico">${it.ico}</span>
        <span class="nav-lbl">${it.label}</span>
      </div>
    `).join('');
    bottomNav.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        haptic('light');
        navigateTo(el.dataset.nav);
      });
    });
  }

  function getUnreadCount() {
    return ZD.contacts.filter(c => c.unread > 0 && c.episodes.includes(ZD.state.episode)).length;
  }

  function setActiveNav(id) {
    bottomNav.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === id);
    });
  }

  // ---- NAVIGATION ----
  function navigateTo(id, options = {}) {
    if (isTransitioning && !options.force) return;
    if (id === currentScreen && !options.force) return;

    isTransitioning = true;
    haptic('light');

    if (!options.noHistory && currentScreen !== id) {
      navHistory.push(currentScreen);
    }

    const oldScreen = frame.querySelector('.screen.active');
    if (oldScreen && !options.noAnimate) {
      oldScreen.classList.add('exiting');
      setTimeout(() => {
        renderScreen(id);
        isTransitioning = false;
      }, 250);
    } else {
      renderScreen(id);
      isTransitioning = false;
    }

    currentScreen = id;
    setActiveNav(id);

    const hideNav = ['chat', 'terminal', 'gallery', 'browser'].includes(id);
    bottomNav.classList.toggle('hidden', hideNav);
    statusBar.classList.toggle('scrolled', hideNav);
  }

  function goBack() {
    if (navHistory.length > 0) {
      const prev = navHistory.pop();
      navigateTo(prev, { noHistory: true });
    } else {
      navigateTo('home');
    }
  }

  if (tg) {
    tg.BackButton.onClick(() => {
      haptic('medium');
      goBack();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Backspace' || e.key === 'Escape') {
      e.preventDefault();
      goBack();
    }
  });

  function renderScreen(id) {
    frame.innerHTML = '';
    switch (id) {
      case 'home':      buildHome(); break;
      case 'messenger': buildMessengerList(); break;
      case 'chat':      buildChat(currentChat); break;
      case 'gallery':   buildGallery(); break;
      case 'browser':   buildBrowser(); break;
      case 'map':       buildMap(); break;
      case 'terminal':  buildTerminal(); break;
      case 'shop':      buildShop(); break;
      case 'achievements': buildAchievements(); break;
      default:          buildHome();
    }
  }

  function screenDiv(id) {
    const s = document.createElement('div');
    s.className = 'screen active';
    s.id = id;
    frame.appendChild(s);
    return s;
  }

  function header(backTo, title, sub, extra) {
    return `
      <div class="screen-header">
        <div class="back-btn" data-back="${backTo}">←</div>
        <div>
          <div class="hdr-title">${title}</div>
          ${sub ? `<div class="hdr-sub">${sub}</div>` : ''}
        </div>
        ${extra || ''}
      </div>
    `;
  }

  function bindBack(s) {
    s.querySelectorAll('[data-back]').forEach(el => {
      el.addEventListener('click', () => {
        haptic('medium');
        goBack();
      });
    });
  }

  // ==================================================
  // HOME
  // ==================================================
  function buildHome() {
    const s = screenDiv('homeScreen');
    const currentEp = ZD.episodes.find(e => e.id === ZD.state.episode);
    const nextEp = ZD.episodes.find(e => e.id === ZD.state.episode + 1);

    // Check if current episode missions are complete
    const epComplete = currentEp && checkEpisodeComplete(currentEp);

    s.innerHTML = `
      <div class="scrollable">
        <div class="home-hero">
          <div class="hero-act">АКТ ${ZD.state.act} · ЭПИЗОД ${ZD.state.episode}</div>
          <div class="hero-title">ZERO_<em>DAY</em></div>
          <div class="hero-subtitle">ШКОЛЬНЫЙ ПРОТОКОЛ · ОТРЯД 404</div>
          ${currentEp ? `
          <div class="ep-card ${currentEp.locked ? 'ep-locked' : ''}" data-goto="${currentEp.locked ? '' : 'chat'}" data-chat="${getEpisodeContact(currentEp.id)}">
            <div>
              <div class="ep-num">EP.${String(currentEp.id).padStart(2,'0')} · ${currentEp.active ? 'АКТИВЕН' : currentEp.done ? 'ПРОЙДЕН' : 'ЗАБЛОКИРОВАН'}</div>
              <div class="ep-name">«${currentEp.title}»</div>
              <div class="ep-meta">${currentEp.theme}</div>
            </div>
            <div class="ep-play">${currentEp.locked ? '🔒' : '▶'}</div>
          </div>
          ` : ''}
          ${epComplete ? `
          <div class="ep-card" style="margin-top:10px;border-color:var(--warn);border-left-color:var(--warn)" data-action="completeEpisode" data-ep="${currentEp.id}">
            <div>
              <div class="ep-num" style="color:var(--warn)">✓ ЗАДАНИЯ ВЫПОЛНЕНЫ</div>
              <div class="ep-name">Завершить эпизод</div>
              <div class="ep-meta">Нажми, чтобы получить награду</div>
            </div>
            <div class="ep-play" style="background:var(--warn)">🏆</div>
          </div>
          ` : ''}
        </div>
        ${getUnreadCount() > 0 ? `
        <div class="notif-strip" data-goto="messenger">
          📨 ${getUnreadCount()} новых сообщени${getUnreadCount() === 1 ? 'е' : 'я'}
        </div>
        ` : ''}
        <div class="home-apps">
          <div class="section-lbl">ПРИЛОЖЕНИЯ</div>
          <div class="apps-grid">
            <div class="app-tile ${getUnreadCount() > 0 ? 'has-badge' : ''}" data-goto="messenger">
              <div class="app-tile-ico">💬</div>
              <div class="app-tile-lbl">МЕССЕНДЖЕР</div>
            </div>
            <div class="app-tile" data-goto="gallery">
              <div class="app-tile-ico">🖼️</div>
              <div class="app-tile-lbl">ГАЛЕРЕЯ</div>
            </div>
            <div class="app-tile" data-goto="browser">
              <div class="app-tile-ico">🌐</div>
              <div class="app-tile-lbl">БРАУЗЕР</div>
            </div>
            <div class="app-tile" data-goto="map">
              <div class="app-tile-ico">🗺️</div>
              <div class="app-tile-lbl">КАРТА</div>
            </div>
            <div class="app-tile" data-goto="terminal">
              <div class="app-tile-ico">💻</div>
              <div class="app-tile-lbl">ТЕРМИНАЛ</div>
            </div>
            <div class="app-tile" data-goto="shop">
              <div class="app-tile-ico">🛒</div>
              <div class="app-tile-lbl">МАГАЗИН</div>
            </div>
          </div>
        </div>
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-val stars-val">${ZD.state.stars}</div>
            <div class="stat-lbl">⭐ STARS</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${ZD.state.trust}%</div>
            <div class="stat-lbl">ДОВЕРИЕ</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${ZD.state.reputation}</div>
            <div class="stat-lbl">РЕПУТАЦИЯ</div>
          </div>
        </div>
        <div class="home-apps">
          <div class="section-lbl" style="display:flex;justify-content:space-between;align-items:center">
            <span>ЭПИЗОДЫ</span>
            <span style="font-size:10px;color:var(--muted)">${ZD.episodes.filter(e => e.done).length}/${ZD.episodes.length}</span>
          </div>
          <div class="episodes-list">
            ${ZD.episodes.map(ep => `
              <div class="ep-item ${ep.locked ? 'ep-locked' : ''}" data-ep="${ep.id}" data-locked="${ep.locked}">
                <div class="ep-status ${ep.done ? 'done' : ep.active ? 'active' : 'locked'}"></div>
                <div class="ep-info">
                  <div class="ep-info-title">EP.${ep.id} · ${ep.title}</div>
                  <div class="ep-info-sub">${ep.subtitle}</div>
                  <div class="ep-info-theme">${ep.theme}</div>
                </div>
                <div class="ep-stars">${ep.done ? '✓' : ep.locked ? '🔒' : '⭐ ' + ep.starsReward}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Episode card click
    s.querySelectorAll('.ep-card[data-goto]').forEach(el => {
      el.addEventListener('click', () => {
        haptic('medium');
        const chat = el.dataset.chat;
        if (chat) { currentChat = chat; navigateTo('chat'); }
      });
    });

    // Complete episode button
    s.querySelectorAll('[data-action="completeEpisode"]').forEach(el => {
      el.addEventListener('click', () => {
        haptic('heavy');
        completeEpisode(parseInt(el.dataset.ep));
      });
    });

    // Episode list clicks
    s.querySelectorAll('.ep-item').forEach(el => {
      el.addEventListener('click', () => {
        haptic('light');
        if (el.dataset.locked === 'true') {
          toast('Эпизод заблокирован. Пройди предыдущие!', 'warn');
          return;
        }
        const epId = parseInt(el.dataset.ep);
        const ep = ZD.episodes.find(e => e.id === epId);
        if (ep && !ep.done) {
          // Set as active episode
          ZD.episodes.forEach(e => e.active = false);
          ep.active = true;
          ZD.state.episode = epId;
          ZD.saveState();
          buildHome();
          toast('Эпизод ' + epId + ' активирован', 'success');
        }
      });
    });

    s.querySelectorAll('[data-goto]').forEach(el => {
      if (!el.dataset.goto) return;
      el.addEventListener('click', () => {
        haptic('medium');
        navigateTo(el.dataset.goto);
      });
    });

    bindRipple('.app-tile, .ep-card, .notif-strip, .stat-card, .ep-item', s);
  }

  function getEpisodeContact(epId) {
    const contacts = { 1: 'unknown', 2: 'dasha', 3: 'dasha', 4: 'dasha', 5: 'dasha' };
    return contacts[epId] || 'dasha';
  }

  function checkEpisodeComplete(ep) {
    const progress = ZD.state.episodeProgress[ep.id] || {};
    const required = ep.missions || [];

    // Check each mission type
    let completed = 0;
    if (required.includes('chat')) {
      // Check if choices were made for this episode
      const epChoices = ZD.state.choices['ep' + ep.id];
      if (epChoices && Object.keys(epChoices).length > 0) completed++;
    }
    if (required.includes('gallery')) {
      const epGallery = ZD.gallery.filter(g => g.episode === ep.id);
      const analyzed = epGallery.filter(g => ZD.state.analyzed.has(g.id)).length;
      if (analyzed >= epGallery.length && epGallery.length > 0) completed++;
    }
    if (required.includes('browser')) {
      // Check if flags found for this episode's phishing site
      const site = ZD.phishingSites.find(p => p.episode === ep.id);
      if (site) {
        const found = site.flags.filter(f => ZD.state.foundFlags.has(site.id + '_' + f.id)).length;
        if (found >= site.flags.length) completed++;
      }
    }
    if (required.includes('terminal')) {
      if (ZD.state.termSolved) completed++;
    }
    if (required.includes('map')) {
      // Map exploration is automatic
      completed++;
    }
    if (required.includes('shop')) {
      // Shop visit is automatic
      completed++;
    }

    return completed >= required.length && required.length > 0;
  }

  // ==================================================
  // MESSENGER
  // ==================================================
  function buildMessengerList() {
    const s = screenDiv('messengerScreen');
    const episodeContacts = ZD.contacts.filter(c => 
      c.episodes.includes(ZD.state.episode) || ZD.state.episodeProgress[c.episodes[0]]
    );

    let rows = episodeContacts.map((c, i) => `
      <div class="chat-list-item" data-chat="${c.id}" style="animation-delay:${i*0.1}s">
        <div class="chat-avatar ${c.online ? 'avatar-online' : ''}" style="background:${c.color}">${c.initials}</div>
        <div class="chat-info">
          <div class="chat-name">${c.name}</div>
          <div class="chat-preview">${c.preview}</div>
        </div>
        <div class="chat-meta">
          <div class="chat-time">${c.time}</div>
          ${c.unread ? `<span class="chat-unread">${c.unread}</span>` : ''}
        </div>
      </div>
    `).join('');

    s.innerHTML = `
      ${header('home', 'Сообщения', null, `<span style="margin-left:auto;font-size:11px;color:var(--muted)">✏️</span>`)}
      <div class="scrollable">${rows}</div>
    `;
    bindBack(s);

    s.querySelectorAll('.chat-list-item').forEach(el => {
      el.addEventListener('click', () => {
        haptic('medium');
        currentChat = el.dataset.chat;
        navigateTo('chat');
      });
    });
    bindRipple('.chat-list-item', s);
  }

  // ==================================================
  // CHAT
  // ==================================================
  function buildChat(contactId) {
    const contact = ZD.contacts.find(c => c.id === contactId);
    if (!contact) return buildMessengerList();

    const epKey = 'ep' + ZD.state.episode;
    const msgs = ZD.messages[epKey]?.[contactId] || ZD.messages[contactId] || [];
    const choices = ZD.choices[epKey]?.[contactId] || ZD.choices[contactId];
    const choiceKey = epKey + '_' + contactId;
    const choiceMade = ZD.state.choices[choiceKey];

    const s = screenDiv('chatScreen');

    const msgsHtml = msgs.map((m, i) => {
      const delay = i * 0.05;
      if (m.from === 'system') return `<div class="bubble bubble-system" style="animation-delay:${delay}s">${m.text}</div>`;
      if (m.from === 'in') return `<div class="bubble bubble-in" style="animation-delay:${delay}s">${m.text}<div class="bub-time">${m.time || ''}</div></div>`;
      if (m.from === 'out') return `<div class="bubble bubble-out" style="animation-delay:${delay}s">${m.text}<div class="bub-time">${m.time || ''}</div></div>`;
      return '';
    }).join('');

    const choicesHtml = choices && !choiceMade ? `
      <div class="choices-wrap" id="choicesWrap">
        <div class="choices-lbl">ТВОЙ ВЫБОР</div>
        ${choices.map(c => `
          <button class="choice ${c.good ? '' : 'bad'}" data-key="${c.key}">
            <span class="choice-key">[${c.key}]</span>${c.text}
          </button>
        `).join('')}
      </div>
    ` : choices && choiceMade ? `
      <div class="choices-wrap">
        <div class="choices-lbl" style="color:var(--accent)">✓ ВЫБОР СДЕЛАН</div>
      </div>
    ` : '';

    s.innerHTML = `
      <div class="screen-header">
        <div class="back-btn" data-back="messenger">←</div>
        <div class="chat-avatar" style="background:${contact.color};width:36px;height:36px;font-size:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;box-shadow:0 2px 8px ${contact.color}40">${contact.initials}</div>
        <div>
          <div class="hdr-title">${contact.name}</div>
          <div class="hdr-sub" style="color:${contact.online ? 'var(--accent)' : 'var(--muted)'};font-size:11px">
            ${contact.online ? '● онлайн' : '● был(а) недавно'}
          </div>
        </div>
      </div>
      <div class="chat-bg" id="chatBg">
        <div class="bubble bubble-system">Сегодня · ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,'0')}</div>
        ${msgsHtml}
        <div class="typing-bub" id="typingBub">
          <div class="td"></div><div class="td"></div><div class="td"></div>
        </div>
      </div>
      ${choicesHtml}
    `;
    bindBack(s);

    const chatBg = s.querySelector('#chatBg');
    if (chatBg) {
      requestAnimationFrame(() => { chatBg.scrollTop = chatBg.scrollHeight; });
    }

    if (choices && !choiceMade) {
      s.querySelectorAll('.choice').forEach(btn => {
        btn.addEventListener('click', () => {
          haptic('medium');
          handleChoice(contactId, btn.dataset.key, s, choiceKey);
        });
      });
    }
    bindRipple('.choice', s);
  }

  function handleChoice(contactId, key, s, choiceKey) {
    if (ZD.state.choices[choiceKey]) return;

    ZD.state.choices[choiceKey] = key;
    ZD.saveState();

    const epKey = 'ep' + ZD.state.episode;
    const reply = ZD.choiceReplies[epKey]?.[key] || ZD.choiceReplies[key];
    if (!reply) return;

    s.querySelectorAll('.choice').forEach(b => {
      b.disabled = true;
      b.style.opacity = b.dataset.key === key ? '1' : '0.35';
      if (b.dataset.key === key) b.classList.add('selected');
    });

    const chatBg = s.querySelector('#chatBg');
    const typingBub = s.querySelector('#typingBub');
    const choicesWrap = s.querySelector('#choicesWrap');

    const outTexts = ZD.choiceReplies[epKey] ? {
      A: 'Действую по плану А!',
      B: 'Попробую вариант Б...',
      C: 'Выбираю вариант В!'
    } : {
      A: 'Всем стоп! «Расписание_новое.exe» — это вирус. Не открывайте!',
      B: '...ладно, сам посмотрю что там.',
      C: 'Давай сначала напишем самой Марине — проверим, она ли это.'
    };

    const outBub = document.createElement('div');
    outBub.className = 'bubble bubble-out';
    outBub.style.animationDelay = '0s';
    outBub.innerHTML = (outTexts[key] || 'Выбрал вариант ' + key) + `<div class="bub-time">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,'0')}</div>`;
    chatBg.insertBefore(outBub, typingBub);
    chatBg.scrollTop = chatBg.scrollHeight;

    typingBub.style.display = 'flex';
    chatBg.scrollTop = chatBg.scrollHeight;

    setTimeout(() => {
      typingBub.style.display = 'none';
      const inBub = document.createElement('div');
      inBub.className = 'bubble bubble-in';
      inBub.style.animationDelay = '0s';
      inBub.innerHTML = reply.text + `<div class="bub-time">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,'0')}</div>`;
      chatBg.insertBefore(inBub, typingBub);
      chatBg.scrollTop = chatBg.scrollHeight;

      if (choicesWrap) {
        choicesWrap.innerHTML = `<div class="choices-lbl" style="color:var(--accent)">✓ ВЫБОР СДЕЛАН</div>`;
      }

      if (reply.stars > 0) addStars(reply.stars);
      if (reply.reputation) updateReputation(reply.reputation);
      if (reply.trust) updateTrust(reply.trust);

      showIsland('Выбор сохранён');

      // Check episode completion
      const currentEp = ZD.episodes.find(e => e.id === ZD.state.episode);
      if (currentEp && checkEpisodeComplete(currentEp)) {
        setTimeout(() => {
          toast('Все задания эпизода выполнены!', 'success');
        }, 1000);
      }
    }, 2200);
  }

  // ==================================================
  // GALLERY
  // ==================================================
  function buildGallery() {
    const s = screenDiv('galleryScreen');
    const episodeItems = ZD.gallery.filter(g => g.episode <= ZD.state.episode);

    const thumbs = episodeItems.map((item, i) => {
      const cls = ZD.state.analyzed.has(item.id) ? 'analyzed' : (item.flagged ? 'flagged' : '');
      return `<div class="gal-thumb ${cls}" data-item="${item.id}" style="animation-delay:${i*0.05}s">${item.emoji}<div class="gal-ep-label">EP.${item.episode}</div></div>`;
    }).join('');

    s.innerHTML = `
      ${header('home', 'Галерея · Улики', `${episodeItems.length} файлов`)}
      <div class="gal-grid">${thumbs}</div>
      <div id="galDetailOverlay">
        <div class="screen-header">
          <div class="back-btn" id="galDetailBack">←</div>
          <div>
            <div class="hdr-title" id="galDetailName">—</div>
            <div class="hdr-sub" id="galDetailDesc">—</div>
          </div>
        </div>
        <div class="gal-detail-img" id="galDetailImg">
          <div class="gal-scan-overlay" id="galScanOverlay"></div>
          <div class="scan-anim" id="scanAnim"></div>
          <span id="galDetailEmoji" style="font-size:90px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));transition:transform 0.3s ease"></span>
        </div>
        <button class="analyze-btn" id="analyzeBtn">▶ АНАЛИЗИРОВАТЬ МЕТАДАННЫЕ</button>
        <div class="exif-panel scrollable" id="exifPanel"></div>
      </div>
    `;
    bindBack(s);

    s.querySelector('#galDetailBack').addEventListener('click', () => {
      haptic('light');
      s.querySelector('#galDetailOverlay').classList.remove('open');
    });

    s.querySelectorAll('.gal-thumb').forEach(el => {
      el.addEventListener('click', () => {
        haptic('medium');
        openGalDetail(el.dataset.item, s);
      });
    });
  }

  function openGalDetail(itemId, s) {
    const item = ZD.gallery.find(g => g.id === itemId);
    if (!item) return;
    const overlay = s.querySelector('#galDetailOverlay');
    overlay.classList.add('open');
    s.querySelector('#galDetailName').textContent = item.name;
    s.querySelector('#galDetailDesc').textContent = item.desc;
    s.querySelector('#galDetailEmoji').textContent = item.emoji;

    const exifPanel = s.querySelector('#exifPanel');
    const btn = s.querySelector('#analyzeBtn');

    if (ZD.state.analyzed.has(itemId)) {
      renderExif(item, exifPanel);
      btn.textContent = '✓ ПРОАНАЛИЗИРОВАНО';
      btn.style.borderColor = 'var(--accent)';
      btn.disabled = true;
    } else {
      exifPanel.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:10px 0;text-align:center">Нажми «Анализировать» для извлечения метаданных</div>`;
      btn.textContent = '▶ АНАЛИЗИРОВАТЬ МЕТАДАННЫЕ';
      btn.style.borderColor = 'var(--accent)';
      btn.disabled = false;
    }

    btn.onclick = () => {
      haptic('medium');
      startAnalysis(itemId, item, s);
    };
  }

  function renderExif(item, panel) {
    panel.innerHTML = item.exif.map((row, i) => `
      <div class="exif-row" style="animation:slideRight 0.3s ease ${i*0.05}s both">
        <span class="exif-k">${row.k}</span>
        <span class="exif-v ${row.cls || ''}">${row.v}</span>
      </div>
    `).join('');
  }

  function startAnalysis(itemId, item, s) {
    if (ZD.state.analyzed.has(itemId)) return;
    const btn = s.querySelector('#analyzeBtn');
    const scanAnim = s.querySelector('#scanAnim');
    const scanOverlay = s.querySelector('#galScanOverlay');
    const emoji = s.querySelector('#galDetailEmoji');

    btn.textContent = '⏳ СКАНИРОВАНИЕ...';
    btn.style.opacity = '0.6';
    btn.disabled = true;
    scanAnim.style.display = 'block';
    scanOverlay.style.display = 'block';
    emoji.style.transform = 'scale(1.1)';
    haptic('heavy');

    setTimeout(() => {
      ZD.state.analyzed.add(itemId);
      ZD.saveState();
      scanAnim.style.display = 'none';
      scanOverlay.style.display = 'none';
      emoji.style.transform = 'scale(1)';
      btn.textContent = '✓ ПРОАНАЛИЗИРОВАНО';
      btn.style.opacity = '1';
      btn.style.borderColor = 'var(--accent)';
      renderExif(item, s.querySelector('#exifPanel'));

      if (item.flagged) {
        addStars(3);
        showIsland('⚠️ Угроза обнаружена!');
      } else {
        toast('Анализ завершён', 'success');
        showIsland('Метаданные извлечены');
      }

      // Check episode completion
      const currentEp = ZD.episodes.find(e => e.id === ZD.state.episode);
      if (currentEp && checkEpisodeComplete(currentEp)) {
        setTimeout(() => toast('Все задания эпизода выполнены!', 'success'), 500);
      }
    }, 2000);
  }

  // ==================================================
  // BROWSER
  // ==================================================
  function buildBrowser() {
    const s = screenDiv('browserScreen');
    const site = ZD.phishingSites.find(p => p.episode === ZD.state.episode) || ZD.phishingSites[0];
    const sitePrefix = site.id + '_';

    s.innerHTML = `
      <div class="screen-header">
        <div class="back-btn" data-back="home">←</div>
        <div style="display:flex;gap:6px;font-size:12px;color:var(--muted)">
          <span style="cursor:pointer;padding:4px;border-radius:4px;transition:background 0.15s" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">←</span>
          <span style="cursor:pointer;padding:4px;border-radius:4px;transition:background 0.15s" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">→</span>
          <span style="cursor:pointer;padding:4px;border-radius:4px;transition:background 0.15s" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">↻</span>
        </div>
      </div>
      <div class="url-bar-wrap">
        <div class="url-bar">
          <span class="url-lock http" id="urlLock">🔓</span>
          <span class="url-txt" id="urlTxt">${site.url}</span>
        </div>
      </div>
      <div class="site-content scrollable">
        <div class="site-topbar">
          <div class="site-logo">${site.title}</div>
          <div class="site-tagline">Ваш надёжный партнёр · 24/7</div>
          <div class="site-nav-row">
            <span class="site-nav-item">Вход</span>
            <span class="site-nav-item">Кабинет</span>
            <span class="site-nav-item">Поддержка</span>
            <span class="site-nav-item">О нас</span>
          </div>
        </div>
        <div class="site-body">
          <div class="phish-warning">
            <div class="phish-w-title">${site.warning}</div>
            <div class="phish-w-txt">${site.warningText}</div>
          </div>
          <div class="site-headline">${site.headline}</div>
          <div class="site-meta">Обновлено сегодня · Служба безопасности</div>
          <div class="site-para">Уважаемый клиент! В целях безопасности нам необходимо подтвердить вашу личность. Нажмите кнопку ниже и введите полные реквизиты.</div>
          <div class="flags-box">
            <div class="flags-title">🔍 НАЙДИ ПРИЗНАКИ ФИШИНГА (${site.flags.length})</div>
            ${site.flags.map(f => `
              <div class="flag-row" data-flag="${sitePrefix}${f.id}"><div class="flag-chk" id="fc${sitePrefix}${f.id}"></div><span>${f.text}</span></div>
            `).join('')}
            <div class="flags-success" id="flagsSuccess">
              ✓ Отлично! Все ${site.flags.length} признака фишинга найдены.<br>Ты защитил бы себя от кражи данных. +5 ⭐
            </div>
          </div>
        </div>
      </div>
    `;
    bindBack(s);

    s.querySelectorAll('.flag-row').forEach(el => {
      el.addEventListener('click', () => {
        haptic('light');
        handleFlag(el.dataset.flag, s, site);
      });
    });
    bindRipple('.flag-row', s);
  }

  function handleFlag(flagId, s, site) {
    if (ZD.state.foundFlags.has(flagId)) return;
    ZD.state.foundFlags.add(flagId);
    ZD.saveState();

    const row = s.querySelector(`[data-flag="${flagId}"]`);
    const chkId = 'fc' + flagId.replace(/[^a-zA-Z0-9]/g, '');
    const chk = s.querySelector('#' + chkId);

    if (row) {
      row.classList.add('found');
      row.style.animation = 'successPop 0.4s ease';
    }
    if (chk) {
      chk.textContent = '✓';
      chk.style.animation = 'scaleIn 0.3s ease';
    }

    if (flagId.includes('2')) {
      const lock = s.querySelector('#urlLock');
      if (lock) { lock.textContent = '🔓'; lock.style.animation = 'shake 0.5s ease'; }
    }

    haptic('success');

    const siteFlags = site.flags.map(f => site.id + '_' + f.id);
    const foundCount = siteFlags.filter(f => ZD.state.foundFlags.has(f)).length;

    if (foundCount >= site.flags.length) {
      const succ = s.querySelector('#flagsSuccess');
      if (succ) {
        succ.style.display = 'block';
        succ.style.animation = 'successPop 0.5s cubic-bezier(0.34,1.56,0.64,1)';
      }
      addStars(5);
      showIsland('🛡️ Фишинг распознан!');

      // Check episode completion
      const currentEp = ZD.episodes.find(e => e.id === ZD.state.episode);
      if (currentEp && checkEpisodeComplete(currentEp)) {
        setTimeout(() => toast('Все задания эпизода выполнены!', 'success'), 500);
      }
    } else {
      toast('Признак найден! ' + foundCount + '/' + site.flags.length, 'success');
    }
  }

  // ==================================================
  // MAP
  // ==================================================
  function buildMap() {
    const s = screenDiv('mapScreen');
    const episodeLocs = ZD.locations.filter(l => l.episode <= ZD.state.episode || !l.locked);

    const pinsHtml = episodeLocs.map((loc, i) => `
      <div class="loc-pin" data-loc="${loc.id}" style="left:${loc.x};top:${loc.y};animation-delay:${i*0.1}s">
        <div class="pin-circle ${loc.pulse ? 'pin-pulse' : ''}" style="color:${loc.color};border-color:${loc.color}"></div>
        <div class="pin-lbl">${loc.emoji} ${loc.label}</div>
        <div class="pin-status" style="color:${loc.statusColor}">${loc.status}</div>
      </div>
    `).join('');

    s.innerHTML = `
      ${header('home', 'Карта · Локации', 'АКТ ' + ZD.state.act + ' · Выбери точку')}
      <div class="map-canvas">
        <div class="map-grid-lines"></div>
        <div class="map-glow"></div>
        ${pinsHtml}
        <div class="map-panel" id="mapPanel">
          <div class="map-panel-name" id="mapPanelName">—</div>
          <div class="map-panel-desc" id="mapPanelDesc">—</div>
          <button class="map-go-btn" id="mapGoBtn">▶ ИССЛЕДОВАТЬ</button>
        </div>
      </div>
    `;
    bindBack(s);

    s.querySelectorAll('.loc-pin').forEach(el => {
      el.addEventListener('click', () => {
        haptic('medium');
        openMapPanel(el.dataset.loc, s);
      });
    });
    s.querySelector('#mapGoBtn').addEventListener('click', () => {
      haptic('heavy');
      s.querySelector('#mapPanel').classList.remove('open');
    });
  }

  function openMapPanel(locId, s) {
    const loc = ZD.locations.find(l => l.id === locId);
    if (!loc) return;
    const panel = s.querySelector('#mapPanel');
    const nameEl = s.querySelector('#mapPanelName');
    const descEl = s.querySelector('#mapPanelDesc');
    const btn = s.querySelector('#mapGoBtn');

    nameEl.textContent = loc.emoji + ' ' + loc.label;
    descEl.textContent = loc.desc;
    btn.textContent = loc.action;

    // Check requirements
    let canAccess = true;
    if (loc.type === 'locked') {
      if (loc.unlockEpisode && ZD.state.episode < loc.unlockEpisode) canAccess = false;
      if (loc.reqReputation && ZD.state.reputation < loc.reqReputation) canAccess = false;
    }
    if (loc.type === 'req') {
      if (loc.reqItem && !ZD.state.inventory.includes(loc.reqItem)) canAccess = false;
    }

    btn.className = 'map-go-btn ' + (loc.type === 'locked' || !canAccess ? 'locked' : loc.type === 'req' && !canAccess ? 'req' : '');
    panel.classList.add('open');

    if (loc.type === 'locked' || !canAccess) {
      haptic('error');
      toast('Локация недоступна', 'warn');
    } else if (loc.type === 'req' && !canAccess) {
      haptic('warning');
    } else {
      haptic('success');
    }
  }

  // ==================================================
  // TERMINAL
  // ==================================================
  function buildTerminal() {
    const s = screenDiv('terminalScreen');
    const epKey = 'ep' + ZD.state.episode;
    const c = ZD.ciphers[epKey] || ZD.ciphers.ep3;
    const solvedKey = 'termSolved_' + ZD.state.episode;
    const isSolved = ZD.state.episodeProgress[solvedKey] || false;

    s.innerHTML = `
      <div class="term-topbar">
        <div class="back-btn" data-back="home">←</div>
        <div class="term-dots">
          <div class="tdot tdot-r"></div>
          <div class="tdot tdot-y"></div>
          <div class="tdot tdot-g"></div>
        </div>
        <div class="term-title-txt">TERMINAL · MISSION_${String(ZD.state.episode).padStart(2,'0')}</div>
      </div>
      <div class="term-body scrollable" id="termBody">
        <div class="t-g">Отряд404@school:~$ ./decrypt_mission_${String(ZD.state.episode).padStart(2,'0')}.sh</div>
        <div class="t-d">Инициализация протоколов...</div>
        <div class="t-d">Загрузка ключей безопасности...</div>
        <div class="t-c">► Перехвачено зашифрованное сообщение</div>
        <div class="t-d">Метод шифрования: <span class="t-y">Шифр Цезаря (ROT-N)</span></div>
        <div class="t-w">Сдвиг ключа: <span class="t-r">неизвестен</span>. Диапазон: 1–25.</div>
        <div class="term-br"></div>
        <div class="t-a">ЗАДАЧА: Расшифруй перехваченное сообщение</div>
        <div class="t-d">Hint: ${c.hint}</div>
        <div class="term-br"></div>
        <div class="cipher-block">
          <div class="cipher-enc" id="cipherEnc">${c.encrypted}</div>
          <div class="slider-row">
            <span class="slider-lbl">СДВИГ ROT:</span>
            <input type="range" id="caesarSlider" min="1" max="25" value="3" step="1" ${isSolved ? 'disabled' : ''}>
            <span class="slider-val" id="caesarVal">3</span>
          </div>
          <input class="cipher-out" id="cipherOut" readonly value="">
          <div class="cipher-hint">Двигай слайдер — находи читаемое слово</div>
          <div class="cipher-solved" id="cipherSolved" style="display:${isSolved ? 'block' : 'none'}">
            ✓ РАСШИФРОВАНО! ${isSolved ? 'Попыток: ' + ZD.state.termAttempts : ''} · +8 ⭐
          </div>
        </div>
        <div class="term-br"></div>
        <div class="t-d">Попыток использовано: <span class="t-y" id="attemptsCount">${ZD.state.termAttempts}</span></div>
        <div class="term-prompt">
          <span class="t-g">agent@404:~$</span>
          <span class="cursor"></span>
        </div>
      </div>
    `;
    bindBack(s);

    const slider = s.querySelector('#caesarSlider');
    const outEl = s.querySelector('#cipherOut');

    if (isSolved) {
      slider.value = c.answerShift;
      s.querySelector('#caesarVal').textContent = c.answerShift;
      outEl.value = c.plain;
      outEl.style.color = 'var(--accent)';
      outEl.style.textShadow = '0 0 20px var(--accent-glow)';
    } else {
      slider.addEventListener('input', () => {
        haptic('light');
        handleCaesar(s, c, solvedKey);
      });
      handleCaesar(s, c, solvedKey);
    }
  }

  function caesarDecrypt(text, shift, alphabet) {
    return text.split('').map(ch => {
      const i = alphabet.indexOf(ch);
      if (i === -1) return ch;
      return alphabet[((i - shift) % 33 + 33) % 33];
    }).join('');
  }

  function handleCaesar(s, c, solvedKey) {
    const slider = s.querySelector('#caesarSlider');
    const valEl = s.querySelector('#caesarVal');
    const outEl = s.querySelector('#cipherOut');
    const attEl = s.querySelector('#attemptsCount');
    const solvedEl = s.querySelector('#cipherSolved');

    const shift = parseInt(slider.value);
    valEl.textContent = shift;

    if (!ZD.state.episodeProgress[solvedKey]) {
      ZD.state.termAttempts++;
      ZD.saveState();
    }

    if (attEl) attEl.textContent = ZD.state.termAttempts;

    const decrypted = caesarDecrypt(c.encrypted, shift, c.ruAlphabet);
    outEl.value = decrypted;

    if (shift === c.answerShift && !ZD.state.episodeProgress[solvedKey]) {
      ZD.state.episodeProgress[solvedKey] = true;
      ZD.saveState();
      outEl.style.color = 'var(--accent)';
      outEl.style.textShadow = '0 0 20px var(--accent-glow)';
      outEl.style.animation = 'pulseGlow 1s ease 3';
      solvedEl.style.display = 'block';
      slider.disabled = true;
      addStars(8);
      haptic('success');
      showIsland('🔓 Шифр взломан!');

      // Check episode completion
      const currentEp = ZD.episodes.find(e => e.id === ZD.state.episode);
      if (currentEp && checkEpisodeComplete(currentEp)) {
        setTimeout(() => toast('Все задания эпизода выполнены!', 'success'), 500);
      }
    } else if (shift !== c.answerShift) {
      outEl.style.color = 'var(--accent)';
      outEl.style.textShadow = 'none';
      outEl.style.animation = 'none';
    }
  }

  // ==================================================
  // SHOP
  // ==================================================
  function buildShop() {
    const s = screenDiv('shopScreen');

    const rows = ZD.shopItems.map(cat => {
      const items = cat.items.map((item, idx) => {
        const isOwned = item.owned || ZD.state.inventory.includes(item.id);
        const btnHtml = isOwned
          ? `<button class="buy-btn owned" disabled>✓ ЕСТЬ</button>`
          : `<button class="buy-btn" data-price="${item.price}" data-id="${item.id}">⭐ ${item.price}</button>`;
        return `
          <div class="shop-row" style="animation-delay:${idx*0.05}s">
            <div class="shop-ico">${item.ico}</div>
            <div class="shop-info">
              <div class="shop-name">${item.name}</div>
              <div class="shop-desc">${item.desc}</div>
              <div class="shop-tags">${item.tags.map(t => `<span class="stag ${t.cls}">${t.label}</span>`).join('')}</div>
            </div>
            ${btnHtml}
          </div>
        `;
      }).join('');
      return `<div class="shop-cat">${cat.cat}</div>${items}`;
    }).join('');

    s.innerHTML = `
      ${header('home', 'Магазин Реквизита', null)}
      <div class="shop-balance-bar">
        <span>⭐</span><span class="stars-val">${ZD.state.stars}</span>
      </div>
      <div class="shop-body scrollable">${rows}</div>
    `;
    bindBack(s);

    s.querySelectorAll('.buy-btn[data-price]').forEach(btn => {
      btn.addEventListener('click', () => {
        haptic('medium');
        handleBuy(btn, parseInt(btn.dataset.price), btn.dataset.id);
      });
    });
    bindRipple('.buy-btn', s);
  }

  function handleBuy(btn, price, itemId) {
    if (ZD.state.stars < price) {
      haptic('error');
      btn.classList.add('no-stars');
      btn.textContent = '✗ МАЛО ⭐';
      toast('Недостаточно Stars!', 'danger');
      setTimeout(() => {
        btn.classList.remove('no-stars');
        btn.textContent = '⭐ ' + price;
      }, 1500);
      return;
    }

    ZD.state.stars -= price;
    ZD.state.inventory.push(itemId);
    ZD.saveState();
    updateStarsDisplay();

    btn.textContent = '✓ КУПЛЕНО';
    btn.classList.add('owned');
    btn.disabled = true;
    btn.onclick = null;

    haptic('success');
    toast('Куплено! ⭐ осталось: ' + ZD.state.stars, 'success');
    showIsland('Предмет приобретён');
    checkAchievements();
  }

  // ==================================================
  // ACHIEVEMENTS SCREEN
  // ==================================================
  function buildAchievements() {
    const s = screenDiv('achievementsScreen');

    const achHtml = ZD.achievements.map((ach, i) => {
      const unlocked = ZD.state.achievements.has(ach.id);
      return `
        <div class="shop-row" style="animation-delay:${i*0.05}s;opacity:${unlocked ? 1 : 0.5}">
          <div class="shop-ico">${ach.icon}</div>
          <div class="shop-info">
            <div class="shop-name">${ach.title} ${unlocked ? '✓' : '🔒'}</div>
            <div class="shop-desc">${ach.desc}</div>
            <div class="shop-tags"><span class="stag stag-boost">+${ach.stars} ⭐</span></div>
          </div>
        </div>
      `;
    }).join('');

    s.innerHTML = `
      ${header('home', 'Достижения', `${ZD.state.achievements.size}/${ZD.achievements.length}`)}
      <div class="shop-body scrollable" style="padding-top:16px">${achHtml}</div>
    `;
    bindBack(s);
  }

  // ==================================================
  // INIT
  // ==================================================
  buildNav();
  buildHome();

  // Start playtime if tutorial already seen
  if (ZD.state.tutorialSeen) startPlayTime();

  // Expose for debugging
  window.ZD_APP = { navigateTo, goBack, addStars, toast, showIsland, haptic, 
                     completeEpisode, checkEpisodeComplete, checkAchievements };

})();