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
  const iosHomeBtn = document.getElementById('iosHomeBtn');
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

  // ---- DYNAMIC ISLAND (улучшенный) ----
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

  // ---- КОНФЕТТИ ----
  function showConfetti() {
    for (let i = 0; i < 60; i++) {
      const conf = document.createElement('div');
      conf.className = 'confetti';
      conf.style.left = Math.random() * window.innerWidth + 'px';
      conf.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
      conf.style.width = Math.random() * 6 + 4 + 'px';
      conf.style.height = conf.style.width;
      conf.style.animationDelay = Math.random() * 0.5 + 's';
      document.body.appendChild(conf);
      setTimeout(() => conf.remove(), 2000);
    }
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
    showConfetti(); // <-- добавлено конфетти
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
    if (bottomNav) bottomNav.innerHTML = '';
  }

  function getUnreadCount() {
    return ZD.contacts.filter(c => c.unread > 0 && c.episodes.includes(ZD.state.episode)).length;
  }

  function setActiveNav(id) {
    return id;
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

    const compactStatus = ['chat', 'terminal', 'gallery', 'browser'].includes(id);
    if (bottomNav) bottomNav.classList.toggle('hidden', compactStatus);
    if (statusBar) statusBar.classList.toggle('scrolled', compactStatus);
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

  if (iosHomeBtn) {
    iosHomeBtn.addEventListener('click', () => {
      haptic('medium');
      showIsland('HOME');
      navigateTo('home', { force: true, noHistory: true });
    });
  }

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
  // HOME (без изменений, но в ней вызываются обновлённые стили)
  // ==================================================
  function buildHome() {
    const s = screenDiv('homeScreen');
    const currentEp = ZD.episodes.find(e => e.id === ZD.state.episode);
    const nextEp = ZD.episodes.find(e => e.id === ZD.state.episode + 1);

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

    s.querySelectorAll('.ep-card[data-goto]').forEach(el => {
      el.addEventListener('click', () => {
        haptic('medium');
        const chat = el.dataset.chat;
        if (chat) { currentChat = chat; navigateTo('chat'); }
      });
    });

    s.querySelectorAll('[data-action="completeEpisode"]').forEach(el => {
      el.addEventListener('click', () => {
        haptic('heavy');
        completeEpisode(parseInt(el.dataset.ep));
      });
    });

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

    let completed = 0;
    if (required.includes('chat')) {
      const epChoices = ZD.state.choices['ep' + ep.id];
      if (epChoices && Object.keys(epChoices).length > 0) completed++;
    }
    if (required.includes('gallery')) {
      const epGallery = ZD.gallery.filter(g => g.episode === ep.id);
      const analyzed = epGallery.filter(g => ZD.state.analyzed.has(g.id)).length;
      if (analyzed >= epGallery.length && epGallery.length > 0) completed++;
    }
    if (required.includes('browser')) {
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
      completed++;
    }
    if (required.includes('shop')) {
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
  // CHAT (без изменений)
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

      const currentEp = ZD.episodes.find(e => e.id === ZD.state.episode);
      if (currentEp && checkEpisodeComplete(currentEp)) {
        setTimeout(() => {
          toast('Все задания эпизода выполнены!', 'success');
        }, 1000);
      }
    }, 2200);
  }

  // ==================================================
  // GALLERY, BROWSER, MAP, TERMINAL, SHOP, ACHIEVEMENTS
  // (остаются без изменений – они уже используют обновлённые стили)
  // ==================================================
  // ... (весь остальной код gallery, browser, map, terminal, shop, achievements остаётся как в вашем оригинале)
  // Для краткости я не дублирую их здесь, но они должны быть полностью скопированы из вашего старого app.js.
  // Убедитесь, что в вашем итоговом файле есть все функции: buildGallery, buildBrowser, buildMap, buildTerminal, buildShop, buildAchievements.

  // ==================================================
  // INIT
  // ==================================================
  buildNav();
  buildHome();

  if (ZD.state.tutorialSeen) startPlayTime();

  window.ZD_APP = { navigateTo, goBack, addStars, toast, showIsland, haptic, 
                     completeEpisode, checkEpisodeComplete, checkAchievements, showConfetti };

})();