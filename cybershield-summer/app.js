// ============================================================
// ZERO_DAY: Школьный Протокол — APP ENGINE v2.0
// Production-ready with animations, haptics, state persistence
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
      if (type === 'light') tg.HapticFeedback.impactOccurred('light');
      if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
      if (type === 'heavy') tg.HapticFeedback.impactOccurred('heavy');
      if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
      if (type === 'error') tg.HapticFeedback.notificationOccurred('error');
      if (type === 'warning') tg.HapticFeedback.notificationOccurred('warning');
    }
  }

  // ---- DOM REFS ----
  const frame = document.getElementById('appFrame');
  const bottomNav = document.getElementById('bottomNav');
  const statusBar = document.getElementById('statusBar');
  const sbTime = document.getElementById('sbTime');
  const sbBattFill = document.getElementById('sbBattFill');
  const preloader = document.getElementById('preloader');
  const preloaderProgress = document.getElementById('preloaderProgress');
  const dynamicIsland = document.getElementById('dynamicIsland');

  // ---- STATE ----
  let currentScreen = 'home';
  let currentChat = null;
  let navHistory = [];
  let isTransitioning = false;
  let islandTimeout = null;

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
          if (level <= 20) sbBattFill.classList.add('low');
          else sbBattFill.classList.remove('low');
          if (bat.charging) sbBattFill.classList.add('charging');
          else sbBattFill.classList.remove('charging');
        }
      });
    }
  }
  updateBattery();

  // ---- PRELOADER ----
  function runPreloader() {
    if (!preloader || !preloaderProgress) return;
    preloaderProgress.style.animation = 'preloaderProgress 1.8s ease forwards';
    setTimeout(() => {
      preloader.classList.add('done');
      setTimeout(() => preloader.remove(), 600);
    }, 2000);
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

  // ---- STARS ----
  function addStars(n) {
    if (n <= 0) return;
    ZD.state.stars += n;
    updateStarsDisplay();
    toast('+' + n + ' ⭐ Stars', 'success');
    ZD.saveState();
  }

  function updateStarsDisplay() {
    document.querySelectorAll('.stars-val').forEach(el => {
      el.textContent = ZD.state.stars;
    });
  }

  // ---- RIPPLE EFFECT ----
  function createRipple(e, el) {
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
    ripple.className = 'ripple';
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  function bindRipple(selector, container) {
    (container || document).querySelectorAll(selector).forEach(el => {
      el.style.position = 'relative';
      el.style.overflow = 'hidden';
      el.addEventListener('click', e => createRipple(e, el));
    });
  }

  // ---- BOTTOM NAV ----
  function buildNav() {
    const items = [
      { id: 'home',      ico: '🏠', label: 'ГЛАВНАЯ' },
      { id: 'messenger', ico: '💬', label: 'ЧАТЫ',    badge: 2 },
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

    // Show/hide bottom nav
    const hideNav = ['chat', 'terminal', 'gallery', 'browser'].includes(id);
    bottomNav.classList.toggle('hidden', hideNav);

    // Update status bar
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

  // Handle hardware back button / swipe
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
    s.innerHTML = `
      <div class="scrollable">
        <div class="home-hero">
          <div class="hero-act">АКТ ${ZD.state.act} · ЭПИЗОД ${ZD.state.episode}</div>
          <div class="hero-title">ZERO_<em>DAY</em></div>
          <div class="hero-subtitle">ШКОЛЬНЫЙ ПРОТОКОЛ · ОТРЯД 404</div>
          <div class="ep-card" data-goto="chat" data-chat="dasha">
            <div>
              <div class="ep-num">EP.03 · АКТИВЕН</div>
              <div class="ep-name">«Файл от Марины»</div>
              <div class="ep-meta">Фишинг · Социальная инженерия</div>
            </div>
            <div class="ep-play">▶</div>
          </div>
        </div>
        <div class="notif-strip" data-goto="messenger">
          📨 Новое сообщение от <strong style="margin:0 4px;color:var(--accent)">Даши Ковы</strong> — Отряд 404
        </div>
        <div class="home-apps">
          <div class="section-lbl">ПРИЛОЖЕНИЯ</div>
          <div class="apps-grid">
            <div class="app-tile has-badge" data-goto="messenger">
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
      </div>
    `;
    s.querySelectorAll('[data-goto]').forEach(el => {
      el.addEventListener('click', () => {
        haptic('medium');
        const chat = el.dataset.chat;
        if (chat) { currentChat = chat; navigateTo('chat'); }
        else navigateTo(el.dataset.goto);
      });
    });
    bindRipple('.app-tile, .ep-card, .notif-strip, .stat-card', s);
  }

  // ==================================================
  // MESSENGER LIST
  // ==================================================
  function buildMessengerList() {
    const s = screenDiv('messengerScreen');
    let rows = ZD.contacts.map(c => `
      <div class="chat-list-item" data-chat="${c.id}">
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
  // CHAT DETAIL
  // ==================================================
  function buildChat(contactId) {
    const contact = ZD.contacts.find(c => c.id === contactId);
    if (!contact) return buildMessengerList();
    const msgs = ZD.messages[contactId] || [];
    const choices = ZD.choices[contactId];

    const s = screenDiv('chatScreen');

    const msgsHtml = msgs.map((m, i) => {
      const delay = i * 0.05;
      if (m.from === 'system') return `<div class="bubble bubble-system" style="animation-delay:${delay}s">${m.text}</div>`;
      if (m.from === 'in') return `<div class="bubble bubble-in" style="animation-delay:${delay}s">${m.text}<div class="bub-time">${m.time || ''}</div></div>`;
      if (m.from === 'out') return `<div class="bubble bubble-out" style="animation-delay:${delay}s">${m.text}<div class="bub-time">${m.time || ''}</div></div>`;
      return '';
    }).join('');

    const choicesHtml = choices && !ZD.state.choiceMade ? `
      <div class="choices-wrap" id="choicesWrap">
        <div class="choices-lbl">ТВОЙ ВЫБОР</div>
        ${choices.map(c => `
          <button class="choice ${c.good ? '' : 'bad'}" data-key="${c.key}">
            <span class="choice-key">[${c.key}]</span>${c.text}
          </button>
        `).join('')}
      </div>
    ` : choices && ZD.state.choiceMade ? `
      <div class="choices-wrap">
        <div class="choices-lbl" style="color:var(--accent)">✓ ВЫБОР СДЕЛАН · ПОСЛЕДСТВИЯ В ЭП.5</div>
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
        <div class="bubble bubble-system">Сегодня · 19:47</div>
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
      requestAnimationFrame(() => {
        chatBg.scrollTop = chatBg.scrollHeight;
      });
    }

    if (choices && !ZD.state.choiceMade) {
      s.querySelectorAll('.choice').forEach(btn => {
        btn.addEventListener('click', () => {
          haptic('medium');
          handleChoice(contactId, btn.dataset.key, s);
        });
      });
    }
    bindRipple('.choice', s);
  }

  function handleChoice(contactId, key, s) {
    if (ZD.state.choiceMade) return;
    ZD.state.choiceMade = true;
    ZD.saveState();
    const reply = ZD.choiceReplies[key];

    s.querySelectorAll('.choice').forEach(b => {
      b.disabled = true;
      b.style.opacity = b.dataset.key === key ? '1' : '0.35';
      if (b.dataset.key === key) b.classList.add('selected');
    });

    const chatBg = s.querySelector('#chatBg');
    const typingBub = s.querySelector('#typingBub');
    const choicesWrap = s.querySelector('#choicesWrap');

    const outTexts = {
      A: 'Всем стоп! «Расписание_новое.exe» — это вирус. Не открывайте!',
      B: '...ладно, сам посмотрю что там.',
      C: 'Давай сначала напишем самой Марине — проверим, она ли это.'
    };

    const outBub = document.createElement('div');
    outBub.className = 'bubble bubble-out';
    outBub.style.animationDelay = '0s';
    outBub.innerHTML = outTexts[key] + `<div class="bub-time">19:49</div>`;
    chatBg.insertBefore(outBub, typingBub);
    chatBg.scrollTop = chatBg.scrollHeight;

    typingBub.style.display = 'flex';
    chatBg.scrollTop = chatBg.scrollHeight;

    setTimeout(() => {
      typingBub.style.display = 'none';
      const inBub = document.createElement('div');
      inBub.className = 'bubble bubble-in';
      inBub.style.animationDelay = '0s';
      inBub.innerHTML = reply.text + `<div class="bub-time">19:50</div>`;
      chatBg.insertBefore(inBub, typingBub);
      chatBg.scrollTop = chatBg.scrollHeight;

      if (choicesWrap) {
        choicesWrap.innerHTML = `<div class="choices-lbl" style="color:var(--accent)">✓ ВЫБОР СДЕЛАН · ПОСЛЕДСТВИЯ В ЭП.5</div>`;
      }

      if (reply.stars > 0) {
        addStars(reply.stars);
      } else {
        toast(reply.text, 'warn');
      }

      showIsland('Выбор сохранён');
    }, 2200);
  }

  // ==================================================
  // GALLERY
  // ==================================================
  function buildGallery() {
    const s = screenDiv('galleryScreen');
    const thumbs = ZD.gallery.map((item, i) => {
      const cls = ZD.state.analyzed.has(item.id) ? 'analyzed' : (item.flagged ? 'flagged' : '');
      return `<div class="gal-thumb ${cls}" data-item="${item.id}" style="animation-delay:${i*0.05}s">${item.emoji}</div>`;
    }).join('');

    s.innerHTML = `
      ${header('home', 'Галерея · Улики', `${ZD.gallery.length} файлов`)}
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
        showIsland('Угроза обнаружена!');
      } else {
        toast('Анализ завершён', 'success');
        showIsland('Метаданные извлечены');
      }
    }, 2000);
  }

  // ==================================================
  // BROWSER
  // ==================================================
  function buildBrowser() {
    const s = screenDiv('browserScreen');

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
          <span class="url-txt" id="urlTxt">sekur-bank-online.ru</span>
        </div>
      </div>
      <div class="site-content scrollable">
        <div class="site-topbar">
          <div class="site-logo">🏦 СекурБанк Online</div>
          <div class="site-tagline">Ваш надёжный партнёр · 24/7</div>
          <div class="site-nav-row">
            <span class="site-nav-item">Вход</span>
            <span class="site-nav-item">Кабинет</span>
            <span class="site-nav-item">Поддержка</span>
            <span class="site-nav-item">О банке</span>
          </div>
        </div>
        <div class="site-body">
          <div class="phish-warning">
            <div class="phish-w-title">⚠️ СРОЧНО: Ваш аккаунт заблокирован</div>
            <div class="phish-w-txt">Для восстановления доступа введите данные карты в течение 24 часов.</div>
          </div>
          <div class="site-headline">Подтвердите личность — введите данные карты</div>
          <div class="site-meta">Обновлено сегодня в 18:30 · Служба безопасности</div>
          <div class="site-para">Уважаемый клиент! В целях безопасности нам необходимо подтвердить вашу личность. Нажмите кнопку ниже и введите полные реквизиты карты.</div>
          <div class="flags-box">
            <div class="flags-title">🔍 НАЙДИ ПРИЗНАКИ ФИШИНГА</div>
            <div class="flag-row" data-flag="1"><div class="flag-chk" id="fc1"></div><span>Подозрительный домен — не официальный сайт банка</span></div>
            <div class="flag-row" data-flag="2"><div class="flag-chk" id="fc2"></div><span>Нет защищённого соединения (HTTP вместо HTTPS)</span></div>
            <div class="flag-row" data-flag="3"><div class="flag-chk" id="fc3"></div><span>Создание искусственной срочности («24 часа»)</span></div>
            <div class="flag-row" data-flag="4"><div class="flag-chk" id="fc4"></div><span>Запрос данных карты — настоящий банк так не делает</span></div>
            <div class="flags-success" id="flagsSuccess">
              ✓ Отлично! Все 4 признака фишинга найдены.<br>Ты защитил бы себя от кражи данных. +5 ⭐
            </div>
          </div>
        </div>
      </div>
    `;
    bindBack(s);

    s.querySelectorAll('.flag-row').forEach(el => {
      el.addEventListener('click', () => {
        haptic('light');
        handleFlag(el.dataset.flag, s);
      });
    });
    bindRipple('.flag-row', s);
  }

  function handleFlag(n, s) {
    if (ZD.state.foundFlags.has(n)) return;
    ZD.state.foundFlags.add(n);
    ZD.saveState();

    const row = s.querySelector(`[data-flag="${n}"]`);
    const chk = s.querySelector(`#fc${n}`);
    if (row) {
      row.classList.add('found');
      row.style.animation = 'successPop 0.4s ease';
    }
    if (chk) {
      chk.textContent = '✓';
      chk.style.animation = 'scaleIn 0.3s ease';
    }

    if (n === '2') {
      const lock = s.querySelector('#urlLock');
      if (lock) { lock.textContent = '🔓'; lock.style.animation = 'shake 0.5s ease'; }
    }

    haptic('success');

    if (ZD.state.foundFlags.size >= 4) {
      const succ = s.querySelector('#flagsSuccess');
      if (succ) {
        succ.style.display = 'block';
        succ.style.animation = 'successPop 0.5s cubic-bezier(0.34,1.56,0.64,1)';
      }
      addStars(5);
      showIsland('🛡️ Фишинг распознан!');
    } else {
      toast('Признак найден! ' + ZD.state.foundFlags.size + '/4', 'success');
    }
  }

  // ==================================================
  // MAP
  // ==================================================
  function buildMap() {
    const s = screenDiv('mapScreen');

    const pinsHtml = ZD.locations.map((loc, i) => `
      <div class="loc-pin" data-loc="${loc.id}" style="left:${loc.x};top:${loc.y};animation-delay:${i*0.1}s">
        <div class="pin-circle ${loc.pulse ? 'pin-pulse' : ''}" style="color:${loc.color};border-color:${loc.color}"></div>
        <div class="pin-lbl">${loc.emoji} ${loc.label}</div>
        <div class="pin-status" style="color:${loc.statusColor}">${loc.status}</div>
      </div>
    `).join('');

    s.innerHTML = `
      ${header('home', 'Карта · Локации', 'АКТ I · Выбери точку')}
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
    btn.className = 'map-go-btn ' + (loc.type === 'locked' ? 'locked' : loc.type === 'req' ? 'req' : '');
    panel.classList.add('open');

    if (loc.type === 'locked') {
      haptic('error');
      toast('Локация заблокирована', 'warn');
    } else if (loc.type === 'req') {
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
    const c = ZD.cipher;

    s.innerHTML = `
      <div class="term-topbar">
        <div class="back-btn" data-back="home">←</div>
        <div class="term-dots">
          <div class="tdot tdot-r"></div>
          <div class="tdot tdot-y"></div>
          <div class="tdot tdot-g"></div>
        </div>
        <div class="term-title-txt">TERMINAL · MISSION_03</div>
      </div>
      <div class="term-body scrollable" id="termBody">
        <div class="t-g">Отряд404@school:~$ ./decrypt_mission_03.sh</div>
        <div class="t-d">Инициализация протоколов...</div>
        <div class="t-d">Загрузка ключей безопасности...</div>
        <div class="t-c">► Перехвачено зашифрованное сообщение</div>
        <div class="t-d">Метод шифрования: <span class="t-y">Шифр Цезаря (ROT-N)</span></div>
        <div class="t-w">Сдвиг ключа: <span class="t-r">неизвестен</span>. Диапазон: 1–25.</div>
        <div class="term-br"></div>
        <div class="t-a">ЗАДАЧА: Расшифруй перехваченное сообщение</div>
        <div class="t-d">Hint: Слово из 5 букв + слово из 5 букв</div>
        <div class="term-br"></div>
        <div class="cipher-block">
          <div class="cipher-enc" id="cipherEnc">${c.encrypted}</div>
          <div class="slider-row">
            <span class="slider-lbl">СДВИГ ROT:</span>
            <input type="range" id="caesarSlider" min="1" max="25" value="3" step="1">
            <span class="slider-val" id="caesarVal">3</span>
          </div>
          <input class="cipher-out" id="cipherOut" readonly value="">
          <div class="cipher-hint">Двигай слайдер — находи читаемое слово</div>
          <div class="cipher-solved" id="cipherSolved">
            ✓ РАСШИФРОВАНО! Попыток: <span id="solvedAttempts">0</span> · +8 ⭐
          </div>
        </div>
        <div class="term-br"></div>
        <div class="t-d">Попыток использовано: <span class="t-y" id="attemptsCount">0</span></div>
        <div class="term-prompt">
          <span class="t-g">agent@404:~$</span>
          <span class="cursor"></span>
        </div>
      </div>
    `;
    bindBack(s);

    const slider = s.querySelector('#caesarSlider');
    const outEl = s.querySelector('#cipherOut');

    // Reset if already solved for display
    if (ZD.state.termSolved) {
      slider.value = c.answerShift;
      s.querySelector('#caesarVal').textContent = c.answerShift;
      s.querySelector('#solvedAttempts').textContent = ZD.state.termAttempts;
      s.querySelector('#attemptsCount').textContent = ZD.state.termAttempts;
      outEl.value = c.plain;
      outEl.style.color = 'var(--accent)';
      s.querySelector('#cipherSolved').style.display = 'block';
      slider.disabled = true;
    } else {
      slider.addEventListener('input', () => {
        haptic('light');
        handleCaesar(s);
      });
      handleCaesar(s);
    }
  }

  function caesarDecrypt(text, shift) {
    const ru = ZD.cipher.ruAlphabet;
    return text.split('').map(ch => {
      const i = ru.indexOf(ch);
      if (i === -1) return ch;
      return ru[((i - shift) % 33 + 33) % 33];
    }).join('');
  }

  function handleCaesar(s) {
    const slider = s.querySelector('#caesarSlider');
    const valEl = s.querySelector('#caesarVal');
    const outEl = s.querySelector('#cipherOut');
    const attEl = s.querySelector('#attemptsCount');
    const solvedEl = s.querySelector('#cipherSolved');
    const solvedAtt = s.querySelector('#solvedAttempts');

    const shift = parseInt(slider.value);
    valEl.textContent = shift;

    if (!ZD.state.termSolved) {
      ZD.state.termAttempts++;
      ZD.saveState();
    }

    if (attEl) attEl.textContent = ZD.state.termAttempts;

    const decrypted = caesarDecrypt(ZD.cipher.encrypted, shift);
    outEl.value = decrypted;

    if (shift === ZD.cipher.answerShift && !ZD.state.termSolved) {
      ZD.state.termSolved = true;
      ZD.saveState();
      outEl.style.color = 'var(--accent)';
      outEl.style.textShadow = '0 0 20px var(--accent-glow)';
      solvedEl.style.display = 'block';
      if (solvedAtt) solvedAtt.textContent = ZD.state.termAttempts;
      slider.disabled = true;
      addStars(8);
      haptic('success');
      showIsland('🔓 Шифр взломан!');

      // Confetti-like effect via CSS
      outEl.style.animation = 'pulseGlow 1s ease 3';
    } else if (shift !== ZD.cipher.answerShift) {
      outEl.style.color = 'var(--accent)';
      outEl.style.textShadow = 'none';
      solvedEl.style.display = 'none';
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
  }

  // ==================================================
  // INIT
  // ==================================================
  buildNav();
  buildHome();

  // Expose for debugging
  window.ZD_APP = { navigateTo, goBack, addStars, toast, showIsland, haptic };

})();