// ============================================================
// ZERO_DAY: Школьный Протокол — APP ENGINE
// ============================================================

(function () {
  'use strict';

  const frame = document.getElementById('appFrame');
  const bottomNav = document.getElementById('bottomNav');
  let currentScreen = 'home';
  let currentChat = null;

  // ---- CLOCK ----
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const el = document.getElementById('sbTime');
    if (el) el.textContent = h + ':' + m;
  }
  updateClock();
  setInterval(updateClock, 15000);

  // ---- TOAST ----
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    frame.appendChild(t);
    setTimeout(() => t.remove(), 1900);
  }

  function addStars(n) {
    if (n <= 0) return;
    ZD.state.stars += n;
    updateStarsDisplay();
    toast('+' + n + ' ⭐ Stars');
  }

  function updateStarsDisplay() {
    document.querySelectorAll('.stars-val').forEach(el => {
      el.textContent = ZD.state.stars;
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
      el.addEventListener('click', () => navigateTo(el.dataset.nav));
    });
  }

  function setActiveNav(id) {
    bottomNav.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === id);
    });
  }

  // ---- NAVIGATION ----
  function navigateTo(id) {
    currentScreen = id;
    setActiveNav(id);
    renderScreen(id);
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
      el.addEventListener('click', () => navigateTo(el.dataset.back));
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
        <div class="notif-strip">📨 Новое сообщение от <strong style="margin:0 3px">Даши Ковы</strong> — Отряд 404</div>
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
        const chat = el.dataset.chat;
        if (chat) { currentChat = chat; navigateTo('chat'); }
        else navigateTo(el.dataset.goto);
      });
    });
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
      ${header('home', 'Сообщения', null, `<span style="margin-left:auto;font-size:10px;color:var(--muted)">✏️</span>`)}
      <div class="scrollable">${rows}</div>
    `;
    bindBack(s);
    s.querySelectorAll('.chat-list-item').forEach(el => {
      el.addEventListener('click', () => {
        currentChat = el.dataset.chat;
        navigateTo('chat');
      });
    });
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

    const msgsHtml = msgs.map(m => {
      if (m.from === 'system') return `<div class="bubble bubble-system">${m.text}</div>`;
      if (m.from === 'in') return `<div class="bubble bubble-in">${m.text}<div class="bub-time">${m.time || ''}</div></div>`;
      if (m.from === 'out') return `<div class="bubble bubble-out">${m.text}<div class="bub-time">${m.time || ''}</div></div>`;
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
        <div class="chat-avatar" style="background:${contact.color};width:34px;height:34px;font-size:13px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0">${contact.initials}</div>
        <div>
          <div class="hdr-title">${contact.name}</div>
          <div class="hdr-sub" style="color:${contact.online ? 'var(--accent)' : 'var(--muted)'}">
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
    if (chatBg) chatBg.scrollTop = 9999;

    if (choices && !ZD.state.choiceMade) {
      s.querySelectorAll('.choice').forEach(btn => {
        btn.addEventListener('click', () => handleChoice(contactId, btn.dataset.key, s));
      });
    }
  }

  function handleChoice(contactId, key, s) {
    ZD.state.choiceMade = true;
    const reply = ZD.choiceReplies[key];

    // disable all choices
    s.querySelectorAll('.choice').forEach(b => {
      b.disabled = true;
      b.style.opacity = b.dataset.key === key ? '1' : '0.35';
      if (b.dataset.key === key) b.classList.add('selected');
    });

    const chatBg = s.querySelector('#chatBg');
    const typingBub = s.querySelector('#typingBub');
    const choicesWrap = s.querySelector('#choicesWrap');

    // add outgoing bubble
    const outChoice = ZD.choices[contactId].find(c => c.key === key);
    const outBub = document.createElement('div');
    outBub.className = 'bubble bubble-out';
    const outTexts = { A: 'Всем стоп! «Расписание_новое.exe» — это вирус. Не открывайте!', B: '...ладно, сам посмотрю что там.', C: 'Давай сначала напишем самой Марине — проверим, она ли это.' };
    outBub.innerHTML = outTexts[key] + `<div class="bub-time">19:49</div>`;
    chatBg.insertBefore(outBub, typingBub);

    typingBub.style.display = 'flex';
    chatBg.scrollTop = 9999;

    setTimeout(() => {
      typingBub.style.display = 'none';
      const inBub = document.createElement('div');
      inBub.className = 'bubble bubble-in';
      inBub.innerHTML = reply.text + `<div class="bub-time">19:50</div>`;
      chatBg.insertBefore(inBub, typingBub);
      chatBg.scrollTop = 9999;

      if (choicesWrap) {
        choicesWrap.innerHTML = `<div class="choices-lbl" style="color:var(--accent)">✓ ВЫБОР СДЕЛАН · ПОСЛЕДСТВИЯ В ЭП.5</div>`;
      }
      addStars(reply.stars);
    }, 2200);
  }

  // ==================================================
  // GALLERY
  // ==================================================
  function buildGallery() {
    const s = screenDiv('galleryScreen');
    const thumbs = ZD.gallery.map(item => {
      const cls = ZD.state.analyzed.has(item.id) ? 'analyzed' : (item.flagged ? 'flagged' : '');
      return `<div class="gal-thumb ${cls}" data-item="${item.id}">${item.emoji}</div>`;
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
          <span id="galDetailEmoji" style="font-size:80px"></span>
        </div>
        <button class="analyze-btn" id="analyzeBtn">▶ АНАЛИЗИРОВАТЬ МЕТАДАННЫЕ</button>
        <div class="exif-panel scrollable" id="exifPanel"></div>
      </div>
    `;
    bindBack(s);

    s.querySelector('#galDetailBack').addEventListener('click', () => {
      s.querySelector('#galDetailOverlay').classList.remove('open');
    });

    s.querySelectorAll('.gal-thumb').forEach(el => {
      el.addEventListener('click', () => openGalDetail(el.dataset.item, s));
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
    if (ZD.state.analyzed.has(itemId)) {
      renderExif(item, exifPanel);
      s.querySelector('#analyzeBtn').textContent = '✓ ПРОАНАЛИЗИРОВАНО';
      s.querySelector('#analyzeBtn').style.borderColor = 'var(--accent)';
    } else {
      exifPanel.innerHTML = `<div style="font-size:11px;color:var(--muted);padding:8px 0">Нажми «Анализировать» для извлечения метаданных</div>`;
      s.querySelector('#analyzeBtn').textContent = '▶ АНАЛИЗИРОВАТЬ МЕТАДАННЫЕ';
      s.querySelector('#analyzeBtn').style.borderColor = 'var(--accent)';
    }

    s.querySelector('#analyzeBtn').onclick = () => startAnalysis(itemId, item, s);
  }

  function renderExif(item, panel) {
    panel.innerHTML = item.exif.map(row => `
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
    btn.textContent = '⏳ СКАНИРОВАНИЕ...';
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';
    scanAnim.style.display = 'block';
    scanOverlay.style.display = 'block';

    setTimeout(() => {
      ZD.state.analyzed.add(itemId);
      scanAnim.style.display = 'none';
      scanOverlay.style.display = 'none';
      btn.textContent = '✓ ПРОАНАЛИЗИРОВАНО';
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'none';
      btn.style.borderColor = 'var(--accent)';
      renderExif(item, s.querySelector('#exifPanel'));
      if (item.flagged) addStars(3);
    }, 2000);
  }

  // ==================================================
  // BROWSER
  // ==================================================
  function buildBrowser() {
    const s = screenDiv('browserScreen');
    const flags = ZD.gallery; // reuse state

    s.innerHTML = `
      <div class="screen-header">
        <div class="back-btn" data-back="home">←</div>
        <div style="display:flex;gap:5px;font-size:11px;color:var(--muted)">
          <span style="cursor:pointer">←</span>
          <span style="cursor:pointer">→</span>
          <span style="cursor:pointer">↻</span>
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
      el.addEventListener('click', () => handleFlag(el.dataset.flag, s));
    });
  }

  function handleFlag(n, s) {
    if (ZD.state.foundFlags.has(n)) return;
    ZD.state.foundFlags.add(n);
    const row = s.querySelector(`[data-flag="${n}"]`);
    const chk = s.querySelector(`#fc${n}`);
    if (row) row.classList.add('found');
    if (chk) chk.textContent = '✓';
    if (n === '2') {
      const lock = s.querySelector('#urlLock');
      if (lock) { lock.textContent = '🔓'; }
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

    const pinsHtml = ZD.locations.map(loc => `
      <div class="loc-pin" data-loc="${loc.id}" style="left:${loc.x};top:${loc.y}">
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
      el.addEventListener('click', () => openMapPanel(el.dataset.loc, s));
    });
    s.querySelector('#mapGoBtn').addEventListener('click', () => {
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
    slider.addEventListener('input', () => handleCaesar(s));
    handleCaesar(s); // init display
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
    ZD.state.termAttempts++;
    if (attEl) attEl.textContent = ZD.state.termAttempts;

    const decrypted = caesarDecrypt(ZD.cipher.encrypted, shift);
    outEl.value = decrypted;

    if (shift === ZD.cipher.answerShift && !ZD.state.termSolved) {
      ZD.state.termSolved = true;
      outEl.style.color = 'var(--accent)';
      solvedEl.style.display = 'block';
      if (solvedAtt) solvedAtt.textContent = ZD.state.termAttempts;
      addStars(8);
    } else if (shift !== ZD.cipher.answerShift) {
      outEl.style.color = 'var(--accent)';
      solvedEl.style.display = 'none';
    }
  }

  // ==================================================
  // SHOP
  // ==================================================
  function buildShop() {
    const s = screenDiv('shopScreen');

    const rows = ZD.shopItems.map(cat => {
      const items = cat.items.map(item => {
        const isOwned = item.owned || ZD.state.inventory.includes(item.id);
        const btnHtml = isOwned
          ? `<button class="buy-btn owned">✓ ЕСТЬ</button>`
          : `<button class="buy-btn" data-price="${item.price}" data-id="${item.id}">⭐ ${item.price}</button>`;
        return `
          <div class="shop-row">
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
      btn.addEventListener('click', () => handleBuy(btn, parseInt(btn.dataset.price), btn.dataset.id));
    });
  }

  function handleBuy(btn, price, itemId) {
    if (ZD.state.stars < price) {
      btn.classList.add('no-stars');
      btn.textContent = '✗ МАЛО ⭐';
      setTimeout(() => {
        btn.classList.remove('no-stars');
        btn.textContent = '⭐ ' + price;
      }, 1300);
      return;
    }
    ZD.state.stars -= price;
    ZD.state.inventory.push(itemId);
    updateStarsDisplay();
    btn.textContent = '✓ КУПЛЕНО';
    btn.classList.add('owned');
    btn.onclick = null;
    toast('Куплено! ⭐ осталось: ' + ZD.state.stars);
  }

  // ==================================================
  // INIT
  // ==================================================
  buildNav();
  buildHome();

})();