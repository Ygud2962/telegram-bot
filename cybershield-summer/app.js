// ============================================================
// ZERO_DAY: Школьный Протокол — APP ENGINE
// ============================================================

(function () {
  'use strict';

  const frame = document.getElementById('appFrame');
  const bottomNav = document.getElementById('bottomNav');
  const iosHomeBtn = document.getElementById('iosHomeBtn');
  const telegramApp = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  const TOPUP_OFFERS = [
    {
      id: 'stars_50',
      stars: 50,
      priceLabel: '49₽',
      tgLabel: '50 Telegram Stars',
      invoiceUrl: 'https://t.me/your_bot?start=invoice_stars_50'
    },
    {
      id: 'stars_120',
      stars: 120,
      priceLabel: '99₽',
      tgLabel: '120 Telegram Stars',
      invoiceUrl: 'https://t.me/your_bot?start=invoice_stars_120'
    },
    {
      id: 'stars_250',
      stars: 250,
      priceLabel: '189₽',
      tgLabel: '250 Telegram Stars',
      invoiceUrl: 'https://t.me/your_bot?start=invoice_stars_250'
    },
    {
      id: 'stars_600',
      stars: 600,
      priceLabel: '399₽',
      tgLabel: '600 Telegram Stars',
      invoiceUrl: 'https://t.me/your_bot?start=invoice_stars_600'
    }
  ];

  const REAL_MONEY_OFFERS = {
    decryptor: {
      label: '109₽',
      invoiceUrl: 'https://t.me/your_bot?start=invoice_item_decryptor'
    },
    darknet_acc: {
      label: '249₽',
      invoiceUrl: 'https://t.me/your_bot?start=invoice_item_darknet'
    },
    early_access: {
      label: '89₽',
      invoiceUrl: 'https://t.me/your_bot?start=invoice_item_early_access'
    }
  };

  const paymentSessions = new Map();
  const DEMO_MODE = !telegramApp || typeof telegramApp.openInvoice !== 'function';

  let currentScreen = 'home';
  let currentChat = null;
  let transitionDirection = 'forward';
  let navHistory = ['home'];

  // ---- CLOCK ----
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const el = document.getElementById('sbTime');
    if (el) el.textContent = h + ':' + m;
  }

  function updateBatteryVisual() {
    const fill = document.getElementById('sbBattFill');
    if (!fill) return;

    const pseudoLevel = 72 + Math.floor(Math.abs(Math.sin(Date.now() / 600000)) * 23);
    fill.style.width = pseudoLevel + '%';

    if (pseudoLevel <= 20) {
      fill.style.background = 'var(--red)';
    } else if (pseudoLevel <= 40) {
      fill.style.background = 'var(--orange)';
    } else {
      fill.style.background = 'var(--green)';
    }
  }

  // ---- TELEGRAM WEBAPP ----
  function initTelegram() {
    if (!telegramApp) return;

    try {
      telegramApp.ready();
      telegramApp.expand();
      if (typeof telegramApp.setBackgroundColor === 'function') telegramApp.setBackgroundColor('#000000');
      if (typeof telegramApp.setHeaderColor === 'function') telegramApp.setHeaderColor('#000000');
    } catch (err) {
      console.warn('[ZERO_DAY] Telegram init failed:', err);
    }

    try {
      telegramApp.onEvent('invoiceClosed', onInvoiceClosed);
    } catch (err) {
      console.warn('[ZERO_DAY] invoiceClosed hook failed:', err);
    }
  }

  function extractSessionKey(url) {
    if (!url) return '';

    try {
      const parsed = new URL(url);
      const start = parsed.searchParams.get('start');
      if (start) return start;
      const slug = parsed.searchParams.get('slug');
      if (slug) return slug;
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || parsed.href;
    } catch (err) {
      return String(url);
    }
  }

  function startInvoicePayment(meta) {
    if (!meta || !meta.invoiceUrl) {
      toast('Счёт недоступен');
      return;
    }

    const sessionKey = extractSessionKey(meta.invoiceUrl) || ('invoice_' + Date.now());
    const payload = {
      ...meta,
      sessionKey,
      processed: false
    };

    paymentSessions.set(sessionKey, payload);

    if (DEMO_MODE) {
      setTimeout(() => {
        finalizeInvoice(payload, 'paid'); // DEMO_MODE
      }, 480);
      return;
    }

    try {
      telegramApp.openInvoice(payload.invoiceUrl, (status) => {
        finalizeInvoice(payload, status || 'cancelled');
      });
    } catch (err) {
      console.warn('[ZERO_DAY] openInvoice failed:', err);
      toast('Ошибка при открытии счёта');
    }
  }

  function onInvoiceClosed(eventPayload) {
    const status = typeof eventPayload === 'string'
      ? eventPayload
      : ((eventPayload && eventPayload.status) || 'cancelled');

    const slug = eventPayload && (eventPayload.slug || eventPayload.invoiceSlug || eventPayload.id);

    let payload = null;

    if (slug && paymentSessions.has(slug)) {
      payload = paymentSessions.get(slug);
    } else {
      for (const session of paymentSessions.values()) {
        if (!session.processed) {
          payload = session;
          break;
        }
      }
    }

    if (payload) finalizeInvoice(payload, status);
  }

  function finalizeInvoice(payload, status) {
    if (!payload || payload.processed) return;
    payload.processed = true;
    paymentSessions.delete(payload.sessionKey);

    if (status === 'paid') {
      if (payload.type === 'topup') {
        ZD.state.stars += payload.stars;
        updateStarsDisplay();
        toast('+' + payload.stars + ' Stars спасибо за поддержку!');
      }

      if (payload.type === 'item') {
        if (!ZD.state.inventory.includes(payload.itemId)) {
          ZD.state.inventory.push(payload.itemId);
        }
        toast('Покупка подтверждена');
      }

      if (currentScreen === 'shop') buildShop();
      return;
    }

    if (status === 'cancelled' || status === 'failed') {
      toast('Платёж отменён');
    }
  }

  function buyStarsPack(packId) {
    const offer = TOPUP_OFFERS.find((p) => p.id === packId);
    if (!offer) {
      toast('Пакет не найден');
      return;
    }

    startInvoicePayment({
      type: 'topup',
      stars: offer.stars,
      invoiceUrl: offer.invoiceUrl
    });
  }

  function buyItemForMoney(itemId) {
    const offer = REAL_MONEY_OFFERS[itemId];
    if (!offer) {
      toast('Оплата недоступна');
      return;
    }

    if (ZD.state.inventory.includes(itemId)) {
      toast('Уже куплено');
      return;
    }

    startInvoicePayment({
      type: 'item',
      itemId,
      invoiceUrl: offer.invoiceUrl
    });
  }

  // ---- TOAST ----
  function toast(msg) {
    const existing = frame.querySelector('.toast');
    if (existing) existing.remove();

    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    frame.appendChild(t);
    setTimeout(() => t.remove(), 1600);
  }

  function addStars(n) {
    if (n <= 0) return;
    ZD.state.stars += n;
    updateStarsDisplay();
    toast('+' + n + ' ⭐ Stars');
  }

  function updateStarsDisplay() {
    document.querySelectorAll('.stars-val').forEach((el) => {
      el.textContent = ZD.state.stars;
    });
  }

  // ---- NAV ICONS ----
  function navIcon(name) {
    const icons = {
      home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 10.2V21h6.6v-5.4h4.8V21H21V10.2L12 3z"></path></svg>',
      messenger: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v14l4.8-3.6H20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"></path></svg>',
      map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 2.5 8.5 5 2 2.5v18l6.5 2.5 7-2.5L22 23V5l-6.5-2.5zm-7 17.3-4-1.5V5.4l4 1.5v12.9zm6-1.3-4 1.4V6.4l4-1.4v13.5zm5.5-.3-4 1.5V5.8l4-1.5v13.9z"></path></svg>',
      shop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10l1.2 4H5.8L7 4zm12 5H5l1.2 11h11.6L19 9zM9 12h6v2H9v-2z"></path></svg>'
    };

    return icons[name] || icons.home;
  }

  function rootNav(id) {
    if (id === 'messenger' || id === 'chat') return 'messenger';
    if (id === 'map') return 'map';
    if (id === 'shop') return 'shop';
    return 'home';
  }

  // ---- BOTTOM NAV ----
  function buildNav() {
    const items = [
      { id: 'home', label: 'Главная' },
      { id: 'messenger', label: 'Чаты', badge: 2 },
      { id: 'map', label: 'Карта' },
      { id: 'shop', label: 'Магазин' }
    ];

    bottomNav.innerHTML = items.map((it) => `
      <button class="nav-item ${it.id === 'home' ? 'active' : ''}" data-nav="${it.id}" type="button">
        ${it.badge ? '<span class="nav-dot"></span>' : ''}
        <span class="nav-ico">${navIcon(it.id)}</span>
        <span class="nav-lbl">${it.label}</span>
      </button>
    `).join('');

    bottomNav.querySelectorAll('.nav-item').forEach((el) => {
      el.addEventListener('click', () => {
        const target = el.dataset.nav;
        if (!target) return;
        navigateTo(target, { historyMode: 'reset', direction: 'forward' });
      });
    });
  }

  function setActiveNav(id) {
    bottomNav.querySelectorAll('.nav-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.nav === id);
    });
  }

  // ---- NAVIGATION ----
  function navigateTo(id, options) {
    const opts = options || {};
    const previousChat = currentChat;

    if (opts.chatId) currentChat = opts.chatId;

    if (opts.historyMode === 'reset') {
      navHistory = [id];
    } else if (opts.historyMode === 'push') {
      navHistory.push(id);
    } else if (opts.historyMode !== 'keep' && opts.direction !== 'back') {
      const last = navHistory[navHistory.length - 1];
      const sameChat = id === 'chat' && opts.chatId && opts.chatId === previousChat;
      if (last !== id || !sameChat) navHistory.push(id);
    }

    currentScreen = id;
    transitionDirection = opts.direction || 'forward';
    setActiveNav(rootNav(id));
    renderScreen(id);
  }

  function navigateBack(fallback) {
    if (navHistory.length > 1) {
      navHistory.pop();
      const prev = navHistory[navHistory.length - 1] || 'home';
      currentScreen = prev;
      transitionDirection = 'back';
      setActiveNav(rootNav(prev));
      renderScreen(prev);
      return;
    }

    const fallbackScreen = fallback || 'home';
    navigateTo(fallbackScreen, { direction: 'back', historyMode: 'reset' });
  }

  function renderScreen(id) {
    frame.innerHTML = '';

    switch (id) {
      case 'home':
        buildHome();
        break;
      case 'messenger':
        buildMessengerList();
        break;
      case 'chat':
        buildChat(currentChat);
        break;
      case 'gallery':
        buildGallery();
        break;
      case 'browser':
        buildBrowser();
        break;
      case 'map':
        buildMap();
        break;
      case 'terminal':
        buildTerminal();
        break;
      case 'shop':
        buildShop();
        break;
      default:
        buildHome();
    }
  }

  function screenDiv(id) {
    const s = document.createElement('div');
    s.className = 'screen ' + (transitionDirection === 'back' ? 'slide-back' : 'slide-forward');
    s.id = id;
    frame.appendChild(s);
    return s;
  }

  function header(backTo, title, sub, extra) {
    return `
      <div class="screen-header">
        <button class="back-btn" data-back="${backTo}" type="button">
          <span class="chevron">‹</span>
          <span>Назад</span>
        </button>
        <div>
          <div class="hdr-title">${title}</div>
          ${sub ? `<div class="hdr-sub">${sub}</div>` : ''}
        </div>
        <div style="margin-left:auto">${extra || ''}</div>
      </div>
    `;
  }

  function bindBack(s) {
    s.querySelectorAll('[data-back]').forEach((el) => {
      el.addEventListener('click', () => navigateBack(el.dataset.back));
    });
  }

  // ==================================================
  // HOME
  // ==================================================
  function buildHome() {
    const s = screenDiv('homeScreen');

    s.innerHTML = `
      <div class="scrollable home-scroll">
        <section class="home-top">
          <div class="home-greeting">
            <div class="greeting-meta">
              <div class="greeting-title">ZERO_DAY</div>
              <div class="greeting-sub">Школьный Протокол • Отряд 404</div>
            </div>
            <div class="avatar-wrap">
              <div class="avatar-badge">ZD</div>
              <div class="star-pill">⭐ <span class="stars-val">${ZD.state.stars}</span></div>
            </div>
          </div>

          <div class="act-chip">АКТ ${ZD.state.act} · ЭПИЗОД ${ZD.state.episode}</div>

          <article class="episode-card" data-goto="chat" data-chat="dasha">
            <div>
              <div class="episode-kicker">Текущий эпизод</div>
              <div class="episode-title">«Файл от Марины»</div>
              <div class="episode-meta">Фишинг • Социальная инженерия</div>
            </div>
            <div class="episode-arrow">›</div>
          </article>
        </section>

        <div class="home-note">Новое сообщение от Даши Ковы — открой мессенджер</div>

        <div class="home-section-title">Приложения</div>
        <div class="apps-grid">
          <button class="app-tile has-badge" data-goto="messenger" type="button">
            <span class="app-tile-ico">💬</span>
            <span class="app-tile-lbl">Мессенджер</span>
          </button>
          <button class="app-tile" data-goto="gallery" type="button">
            <span class="app-tile-ico">🖼️</span>
            <span class="app-tile-lbl">Галерея</span>
          </button>
          <button class="app-tile" data-goto="browser" type="button">
            <span class="app-tile-ico">🌐</span>
            <span class="app-tile-lbl">Браузер</span>
          </button>
          <button class="app-tile" data-goto="map" type="button">
            <span class="app-tile-ico">🗺️</span>
            <span class="app-tile-lbl">Карта</span>
          </button>
          <button class="app-tile" data-goto="terminal" type="button">
            <span class="app-tile-ico">💻</span>
            <span class="app-tile-lbl">Терминал</span>
          </button>
          <button class="app-tile" data-goto="shop" type="button">
            <span class="app-tile-ico">🛒</span>
            <span class="app-tile-lbl">Магазин</span>
          </button>
        </div>

        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-val stars-val">${ZD.state.stars}</div>
            <div class="stat-lbl">Stars</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${ZD.state.trust}%</div>
            <div class="stat-lbl">Доверие</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${ZD.state.reputation}</div>
            <div class="stat-lbl">Репутация</div>
          </div>
        </div>
      </div>
    `;

    s.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => {
        const goto = el.dataset.goto;
        const chat = el.dataset.chat;

        if (chat) {
          navigateTo('chat', { chatId: chat, historyMode: 'push', direction: 'forward' });
          return;
        }

        if (!goto) return;
        navigateTo(goto, { historyMode: 'push', direction: 'forward' });
      });
    });
  }

  // ==================================================
  // MESSENGER LIST
  // ==================================================
  function buildMessengerList() {
    const s = screenDiv('messengerScreen');

    const rows = ZD.contacts.map((c) => `
      <div class="chat-list-item" data-chat="${c.id}">
        <div class="chat-avatar ${c.online ? 'avatar-online' : ''}" style="background:${c.color}">${c.initials}</div>
        <div class="chat-info">
          <div class="chat-name">${c.name}</div>
          <div class="chat-preview">${c.preview}</div>
        </div>
        <div class="chat-meta">
          <div class="chat-time">${c.time || ''}</div>
          ${c.unread ? `<span class="chat-unread">${c.unread}</span>` : ''}
        </div>
      </div>
    `).join('');

    s.innerHTML = `
      ${header('home', 'Сообщения', null, '<span style="font-size:19px;color:var(--blue)">✎</span>')}
      <div class="scrollable">${rows}</div>
    `;

    bindBack(s);

    s.querySelectorAll('.chat-list-item').forEach((el) => {
      el.addEventListener('click', () => {
        navigateTo('chat', {
          chatId: el.dataset.chat,
          historyMode: 'push',
          direction: 'forward'
        });
      });
    });
  }

  // ==================================================
  // CHAT DETAIL
  // ==================================================
  function buildChat(contactId) {
    const contact = ZD.contacts.find((c) => c.id === contactId);
    if (!contact) {
      buildMessengerList();
      return;
    }

    const msgs = ZD.messages[contactId] || [];
    const choices = ZD.choices[contactId];

    const s = screenDiv('chatScreen');

    const msgsHtml = msgs.map((m) => {
      if (m.from === 'system') return `<div class="bubble bubble-system">${m.text}</div>`;
      if (m.from === 'in') return `<div class="bubble bubble-in">${m.text}<div class="bub-time">${m.time || ''}</div></div>`;
      if (m.from === 'out') return `<div class="bubble bubble-out">${m.text}<div class="bub-time">${m.time || ''}</div></div>`;
      return '';
    }).join('');

    const choicesHtml = choices && !ZD.state.choiceMade ? `
      <div class="choices-wrap" id="choicesWrap">
        <div class="choices-lbl">Твой выбор</div>
        ${choices.map((c) => `
          <button class="choice ${c.good ? '' : 'bad'}" data-key="${c.key}" type="button">
            <span class="choice-key">[${c.key}]</span>${c.text}
          </button>
        `).join('')}
      </div>
    ` : choices && ZD.state.choiceMade ? `
      <div class="choices-wrap">
        <div class="choices-lbl" style="color:#9ef4be">✓ Выбор сделан · последствия в Эпизоде 5</div>
      </div>
    ` : '';

    s.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" data-back="messenger" type="button">
          <span class="chevron">‹</span>
          <span>Чаты</span>
        </button>
        <div class="chat-avatar" style="background:${contact.color};width:32px;height:32px;font-size:12px">${contact.initials}</div>
        <div>
          <div class="hdr-title">${contact.name}</div>
          <div class="hdr-sub" style="color:${contact.online ? '#93f7b7' : 'var(--muted)'}">${contact.online ? '● онлайн' : '● был(а) недавно'}</div>
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
    if (chatBg) chatBg.scrollTop = 9999;

    if (choices && !ZD.state.choiceMade) {
      s.querySelectorAll('.choice').forEach((btn) => {
        btn.addEventListener('click', () => handleChoice(contactId, btn.dataset.key, s));
      });
    }
  }

  function handleChoice(contactId, key, s) {
    ZD.state.choiceMade = true;
    const reply = ZD.choiceReplies[key];

    s.querySelectorAll('.choice').forEach((b) => {
      b.disabled = true;
      b.style.opacity = b.dataset.key === key ? '1' : '0.35';
      if (b.dataset.key === key) b.classList.add('selected');
    });

    const chatBg = s.querySelector('#chatBg');
    const typingBub = s.querySelector('#typingBub');
    const choicesWrap = s.querySelector('#choicesWrap');

    const outChoice = (ZD.choices[contactId] || []).find((c) => c.key === key);
    if (outChoice) {
      const outBub = document.createElement('div');
      outBub.className = 'bubble bubble-out';
      outBub.innerHTML = outChoice.text + '<div class="bub-time">19:49</div>';
      chatBg.insertBefore(outBub, typingBub);
    }

    if (typingBub) typingBub.style.display = 'flex';
    chatBg.scrollTop = 9999;

    setTimeout(() => {
      if (typingBub) typingBub.style.display = 'none';

      if (reply) {
        const inBub = document.createElement('div');
        inBub.className = 'bubble bubble-in';
        inBub.innerHTML = reply.text + '<div class="bub-time">19:50</div>';
        chatBg.insertBefore(inBub, typingBub);
        chatBg.scrollTop = 9999;

        if (choicesWrap) {
          choicesWrap.innerHTML = '<div class="choices-lbl" style="color:#9ef4be">✓ Выбор сделан · последствия в Эпизоде 5</div>';
        }

        addStars(reply.stars);
      }
    }, 1200);
  }

  // ==================================================
  // GALLERY
  // ==================================================
  function buildGallery() {
    const s = screenDiv('galleryScreen');

    const thumbs = ZD.gallery.map((item) => {
      const cls = ZD.state.analyzed.has(item.id) ? 'analyzed' : (item.flagged ? 'flagged' : '');
      return `<button class="gal-thumb ${cls}" data-item="${item.id}" type="button">${item.emoji}</button>`;
    }).join('');

    s.innerHTML = `
      ${header('home', 'Галерея · Улики', `${ZD.gallery.length} файлов`)}
      <div class="gal-grid">${thumbs}</div>

      <div id="galDetailOverlay">
        <div class="screen-header">
          <button class="back-btn" id="galDetailBack" type="button">
            <span class="chevron">‹</span>
            <span>Назад</span>
          </button>
          <div>
            <div class="hdr-title" id="galDetailName">—</div>
            <div class="hdr-sub" id="galDetailDesc">—</div>
          </div>
        </div>

        <div class="gal-detail-img" id="galDetailImg">
          <div class="gal-scan-overlay" id="galScanOverlay"></div>
          <div class="scan-anim" id="scanAnim"></div>
          <span id="galDetailEmoji" style="font-size:80px"></span>
        </div>

        <button class="analyze-btn" id="analyzeBtn" type="button">▶ Анализировать метаданные</button>
        <div class="exif-panel scrollable" id="exifPanel"></div>
      </div>
    `;

    bindBack(s);

    s.querySelector('#galDetailBack').addEventListener('click', () => {
      s.querySelector('#galDetailOverlay').classList.remove('open');
    });

    s.querySelectorAll('.gal-thumb').forEach((el) => {
      el.addEventListener('click', () => openGalDetail(el.dataset.item, s));
    });
  }

  function openGalDetail(itemId, s) {
    const item = ZD.gallery.find((g) => g.id === itemId);
    if (!item) return;

    const overlay = s.querySelector('#galDetailOverlay');
    const analyzeBtn = s.querySelector('#analyzeBtn');
    const exifPanel = s.querySelector('#exifPanel');

    overlay.classList.add('open');
    s.querySelector('#galDetailName').textContent = item.name;
    s.querySelector('#galDetailDesc').textContent = item.desc;
    s.querySelector('#galDetailEmoji').textContent = item.emoji;

    if (ZD.state.analyzed.has(itemId)) {
      renderExif(item, exifPanel);
      analyzeBtn.textContent = '✓ Проанализировано';
      analyzeBtn.style.opacity = '0.85';
      analyzeBtn.style.pointerEvents = 'none';
    } else {
      exifPanel.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:7px 0">Нажми «Анализировать», чтобы извлечь EXIF-данные</div>';
      analyzeBtn.textContent = '▶ Анализировать метаданные';
      analyzeBtn.style.opacity = '1';
      analyzeBtn.style.pointerEvents = 'auto';
      analyzeBtn.onclick = () => startAnalysis(itemId, item, s);
    }
  }

  function renderExif(item, panel) {
    panel.innerHTML = item.exif.map((row) => `
      <div class="exif-row">
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

    btn.textContent = 'Сканирование...';
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';

    scanAnim.style.display = 'block';
    scanOverlay.style.display = 'block';

    setTimeout(() => {
      ZD.state.analyzed.add(itemId);
      scanAnim.style.display = 'none';
      scanOverlay.style.display = 'none';

      btn.textContent = '✓ Проанализировано';
      btn.style.opacity = '0.85';
      renderExif(item, s.querySelector('#exifPanel'));

      const thumb = s.querySelector(`.gal-thumb[data-item="${itemId}"]`);
      if (thumb) {
        thumb.classList.remove('flagged');
        thumb.classList.add('analyzed');
      }

      if (item.flagged) addStars(3);
    }, 1600);
  }

  // ==================================================
  // BROWSER
  // ==================================================
  function buildBrowser() {
    const s = screenDiv('browserScreen');

    s.innerHTML = `
      <div class="browser-toolbar">
        ${header('home', 'Safari', null, '<span style="font-size:12px;color:var(--muted)">🔒 Небезопасно</span>')}
        <div class="url-bar-wrap">
          <div class="url-bar">
            <span class="url-lock http" id="urlLock">🔓</span>
            <span class="url-txt" id="urlTxt">sekur-bank-online.ru</span>
          </div>
        </div>
      </div>

      <div class="site-content scrollable">
        <div class="site-topbar">
          <div class="site-logo">🏦 SekurBank Online</div>
          <div class="site-tagline">Ваш надёжный партнёр 24/7</div>
          <div class="site-nav-row">
            <span class="site-nav-item">Вход</span>
            <span class="site-nav-item">Кабинет</span>
            <span class="site-nav-item">Поддержка</span>
          </div>
        </div>

        <div class="site-body">
          <div class="phish-warning">
            <div class="phish-w-title">⚠ Срочно: аккаунт заблокирован</div>
            <div class="phish-w-txt">Введите данные карты в течение 24 часов для «разблокировки».</div>
          </div>

          <div class="site-headline">Подтвердите личность</div>
          <div class="site-meta">Домен: sekur-bank-online.ru • HTTP</div>
          <div class="site-para">Это симулятор. Отметь все признаки фишинга, чтобы защитить данные и получить награду.</div>

          <div class="flags-box">
            <div class="flags-title">Найди 4 признака фишинга</div>
            <div class="flag-row" data-flag="1"><div class="flag-chk" id="fc1"></div><span>Подозрительный домен, не официальный сайт банка</span></div>
            <div class="flag-row" data-flag="2"><div class="flag-chk" id="fc2"></div><span>Нет защищённого HTTPS-соединения</span></div>
            <div class="flag-row" data-flag="3"><div class="flag-chk" id="fc3"></div><span>Давление срочностью: «24 часа»</span></div>
            <div class="flag-row" data-flag="4"><div class="flag-chk" id="fc4"></div><span>Запрос полных данных карты и CVV</span></div>
            <div class="flags-success" id="flagsSuccess">✓ Все признаки фишинга найдены. Ты бы не попался. +5 ⭐</div>
          </div>
        </div>
      </div>
    `;

    bindBack(s);

    s.querySelectorAll('.flag-row').forEach((el) => {
      el.addEventListener('click', () => handleFlag(el.dataset.flag, s));
    });

    // Restore found flags on re-open
    ZD.state.foundFlags.forEach((flag) => {
      const row = s.querySelector(`[data-flag="${flag}"]`);
      const chk = s.querySelector(`#fc${flag}`);
      if (row) row.classList.add('found');
      if (chk) chk.textContent = '✓';
    });

    if (ZD.state.foundFlags.size >= 4) {
      const succ = s.querySelector('#flagsSuccess');
      if (succ) succ.style.display = 'block';
    }
  }

  function handleFlag(n, s) {
    if (!n || ZD.state.foundFlags.has(n)) return;

    ZD.state.foundFlags.add(n);
    const row = s.querySelector(`[data-flag="${n}"]`);
    const chk = s.querySelector(`#fc${n}`);

    if (row) row.classList.add('found');
    if (chk) chk.textContent = '✓';

    if (n === '2') {
      const lock = s.querySelector('#urlLock');
      if (lock) lock.textContent = '🔓';
    }

    if (ZD.state.foundFlags.size >= 4) {
      const succ = s.querySelector('#flagsSuccess');
      if (succ) succ.style.display = 'block';
      addStars(5);
    }
  }

  // ==================================================
  // MAP
  // ==================================================
  function buildMap() {
    const s = screenDiv('mapScreen');

    const pinsHtml = ZD.locations.map((loc) => `
      <button class="loc-pin" data-loc="${loc.id}" style="left:${loc.x};top:${loc.y}" type="button">
        <div class="pin-circle ${loc.pulse ? 'pin-pulse' : ''}" style="color:${loc.color};border-color:${loc.color}"></div>
        <div class="pin-lbl">${loc.emoji} ${loc.label}</div>
        <div class="pin-status" style="color:${loc.statusColor}">${loc.status}</div>
      </button>
    `).join('');

    s.innerHTML = `
      ${header('home', 'Карта', 'АКТ I · Выбери точку')}
      <div class="map-canvas" id="mapCanvas">
        <div class="map-grid-lines"></div>
        <div class="map-glow"></div>
        ${pinsHtml}

        <div class="map-panel" id="mapPanel">
          <div class="map-panel-name" id="mapPanelName">—</div>
          <div class="map-panel-desc" id="mapPanelDesc">—</div>
          <button class="map-go-btn" id="mapGoBtn" type="button">Исследовать</button>
        </div>
      </div>
    `;

    bindBack(s);

    s.querySelectorAll('.loc-pin').forEach((el) => {
      el.addEventListener('click', () => openMapPanel(el.dataset.loc, s));
    });

    s.querySelector('#mapGoBtn').addEventListener('click', () => {
      s.querySelector('#mapPanel').classList.remove('open');
    });

    s.querySelector('#mapCanvas').addEventListener('click', (event) => {
      if (event.target.id === 'mapCanvas' || event.target.classList.contains('map-grid-lines')) {
        s.querySelector('#mapPanel').classList.remove('open');
      }
    });
  }

  function openMapPanel(locId, s) {
    const loc = ZD.locations.find((l) => l.id === locId);
    if (!loc) return;

    const panel = s.querySelector('#mapPanel');
    const nameEl = s.querySelector('#mapPanelName');
    const descEl = s.querySelector('#mapPanelDesc');
    const btn = s.querySelector('#mapGoBtn');

    nameEl.textContent = loc.emoji + ' ' + loc.label;
    descEl.textContent = loc.desc;
    btn.textContent = loc.type === 'locked' ? 'Заблокировано' : loc.action;
    btn.disabled = loc.type === 'locked' || loc.type === 'req';
    btn.className = 'map-go-btn ' + (loc.type === 'locked' ? 'locked' : loc.type === 'req' ? 'req' : '');

    panel.classList.add('open');
  }

  // ==================================================
  // TERMINAL
  // ==================================================
  function buildTerminal() {
    const s = screenDiv('terminalScreen');
    const c = ZD.cipher;

    s.innerHTML = `
      <div class="term-topbar">
        <button class="back-btn" data-back="home" type="button">
          <span class="chevron">‹</span>
          <span>Назад</span>
        </button>
        <div class="term-dots">
          <div class="tdot tdot-r"></div>
          <div class="tdot tdot-y"></div>
          <div class="tdot tdot-g"></div>
        </div>
        <div class="term-title-txt">TERMINAL · MISSION_03</div>
      </div>

      <div class="term-body scrollable" id="termBody">
        <div class="t-g">otryad404@school:~$ ./decrypt_mission_03.sh</div>
        <div class="t-d">Инициализация протоколов...</div>
        <div class="t-d">Загрузка ключей безопасности...</div>
        <div class="t-c">► Перехвачено зашифрованное сообщение</div>
        <div class="t-d">Метод шифрования: <span class="t-y">Шифр Цезаря (ROT-N)</span></div>
        <div class="t-w">Сдвиг ключа: <span class="t-r">неизвестен</span>. Диапазон: 1–25.</div>
        <div class="term-br"></div>
        <div class="t-a">ЗАДАЧА: расшифруй сообщение</div>
        <div class="term-br"></div>

        <div class="cipher-block">
          <div class="cipher-enc" id="cipherEnc">${c.encrypted}</div>
          <div class="slider-row">
            <span class="slider-lbl">Сдвиг ROT:</span>
            <input type="range" id="caesarSlider" min="1" max="25" value="3" step="1">
            <span class="slider-val" id="caesarVal">3</span>
          </div>
          <input class="cipher-out" id="cipherOut" readonly value="">
          <div class="cipher-hint">Двигай слайдер — находи читаемый текст</div>
          <div class="cipher-solved" id="cipherSolved">✓ Расшифровано! Попыток: <span id="solvedAttempts">0</span> · +8 ⭐</div>
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
    slider.addEventListener('input', () => handleCaesar(s));
    handleCaesar(s);
  }

  function caesarDecrypt(text, shift) {
    const ru = ZD.cipher.ruAlphabet;
    return text.split('').map((ch) => {
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

    const shift = parseInt(slider.value, 10);
    valEl.textContent = shift;

    ZD.state.termAttempts += 1;
    if (attEl) attEl.textContent = ZD.state.termAttempts;

    const decrypted = caesarDecrypt(ZD.cipher.encrypted, shift);
    outEl.value = decrypted;

    if (shift === ZD.cipher.answerShift && !ZD.state.termSolved) {
      ZD.state.termSolved = true;
      outEl.style.color = '#b6ffca';
      solvedEl.style.display = 'block';
      if (solvedAtt) solvedAtt.textContent = ZD.state.termAttempts;
      addStars(8);
    } else if (shift !== ZD.cipher.answerShift && !ZD.state.termSolved) {
      outEl.style.color = '#8ff1af';
      solvedEl.style.display = 'none';
    }
  }

  // ==================================================
  // SHOP
  // ==================================================
  function buildShop() {
    const s = screenDiv('shopScreen');

    const topupHtml = TOPUP_OFFERS.map((offer) => `
      <button class="topup-btn" data-topup="${offer.id}" type="button">
        <span class="topup-stars">⭐ ${offer.stars} Stars</span>
        <span class="topup-price">${offer.priceLabel} · ${offer.tgLabel}</span>
      </button>
    `).join('');

    const rows = ZD.shopItems.map((cat) => {
      const items = cat.items.map((item) => {
        const isOwned = item.owned || ZD.state.inventory.includes(item.id);
        const realOffer = REAL_MONEY_OFFERS[item.id];

        const starsBtn = isOwned
          ? '<button class="buy-btn owned" type="button">✓ Куплено</button>'
          : `<button class="buy-btn" data-price="${item.price}" data-id="${item.id}" type="button">Купить за ⭐ ${item.price}</button>`;

        const realBtn = !isOwned && realOffer
          ? `<button class="buy-btn buy-btn-real" data-real-id="${item.id}" type="button">Купить за 💎 ${realOffer.label}</button>`
          : '';

        return `
          <div class="shop-row">
            <div class="shop-ico">${item.ico}</div>
            <div class="shop-info">
              <div class="shop-name">${item.name}</div>
              <div class="shop-desc">${item.desc}</div>
              <div class="shop-tags">${item.tags.map((t) => `<span class="stag ${t.cls}">${t.label}</span>`).join('')}</div>
            </div>
            <div class="shop-actions">
              ${starsBtn}
              ${realBtn}
            </div>
          </div>
        `;
      }).join('');

      return `<div class="shop-cat">${cat.cat}</div>${items}`;
    }).join('');

    s.innerHTML = `
      ${header('home', 'Магазин', DEMO_MODE ? 'Платежи работают в DEMO_MODE' : 'Оплата через Telegram Invoices')}

      <div class="shop-balance-bar">
        <span>⭐</span><span class="stars-val">${ZD.state.stars}</span>
      </div>

      <div class="shop-body scrollable">
        <section class="topup-box">
          <div class="topup-title">Пополнить Stars</div>
          <div class="topup-sub">Через Telegram Invoice. После оплаты баланс обновится автоматически.</div>
          <div class="topup-grid">${topupHtml}</div>
        </section>

        ${rows}
      </div>
    `;

    bindBack(s);

    s.querySelectorAll('.topup-btn[data-topup]').forEach((btn) => {
      btn.addEventListener('click', () => {
        buyStarsPack(btn.dataset.topup);
      });
    });

    s.querySelectorAll('.buy-btn[data-price]').forEach((btn) => {
      btn.addEventListener('click', () => {
        handleBuy(btn, parseInt(btn.dataset.price, 10), btn.dataset.id);
      });
    });

    s.querySelectorAll('.buy-btn[data-real-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        buyItemForMoney(btn.dataset.realId);
      });
    });
  }

  function handleBuy(btn, price, itemId) {
    if (ZD.state.stars < price) {
      btn.classList.add('no-stars');
      btn.textContent = 'Недостаточно ⭐';
      setTimeout(() => {
        btn.classList.remove('no-stars');
        btn.textContent = 'Купить за ⭐ ' + price;
      }, 1200);
      return;
    }

    ZD.state.stars -= price;
    if (!ZD.state.inventory.includes(itemId)) {
      ZD.state.inventory.push(itemId);
    }

    updateStarsDisplay();

    if (currentScreen === 'shop') buildShop();
    toast('Куплено! ⭐ осталось: ' + ZD.state.stars);
  }

  // ---- EDGE SWIPE BACK (bonus) ----
  function bindEdgeSwipeBack() {
    if (!frame) return;

    let tracking = false;
    let startX = 0;
    let startY = 0;

    frame.addEventListener('touchstart', (event) => {
      if (!event.touches || !event.touches[0]) return;
      if (navHistory.length <= 1) return;

      const touch = event.touches[0];
      if (touch.clientX > 26) return;

      tracking = true;
      startX = touch.clientX;
      startY = touch.clientY;
    }, { passive: true });

    frame.addEventListener('touchmove', (event) => {
      if (!tracking || !event.touches || !event.touches[0]) return;

      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);

      if (dx > 88 && dy < 42) {
        tracking = false;
        navigateBack();
      }
    }, { passive: true });

    frame.addEventListener('touchend', () => {
      tracking = false;
    }, { passive: true });

    frame.addEventListener('touchcancel', () => {
      tracking = false;
    }, { passive: true });
  }

  // ==================================================
  // INIT
  // ==================================================
  if (iosHomeBtn) {
    iosHomeBtn.addEventListener('click', () => {
      navigateTo('home', { historyMode: 'reset', direction: 'back' });
    });
  }

  initTelegram();

  updateClock();
  updateBatteryVisual();
  setInterval(updateClock, 15000);
  setInterval(updateBatteryVisual, 60000);

  buildNav();
  bindEdgeSwipeBack();

  navigateTo('home', { historyMode: 'reset', direction: 'forward' });
})();
