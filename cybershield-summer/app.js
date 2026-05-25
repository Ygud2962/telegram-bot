// ============================================================
// ZERO_DAY: Школьный Протокол — APP ENGINE
// ============================================================

(function () {
  'use strict';

  const STORAGE_VERSION = 4;
  const STORAGE_KEY = 'zero_day_school_protocol_state_v4';
  const LEGACY_STORAGE_KEYS = ['zero_day_school_protocol_state_v3'];

  const frame = document.getElementById('appFrame');
  const bottomNav = document.getElementById('bottomNav');
  const iosHomeBtn = document.getElementById('iosHomeBtn');
  const telegramApp = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  const TOPUP_OFFERS = [
    { id: 'stars_50', stars: 50, priceLabel: '49₽', tgLabel: '50 Telegram Stars', invoiceUrl: 'https://t.me/your_bot?start=invoice_stars_50' },
    { id: 'stars_120', stars: 120, priceLabel: '99₽', tgLabel: '120 Telegram Stars', invoiceUrl: 'https://t.me/your_bot?start=invoice_stars_120' },
    { id: 'stars_250', stars: 250, priceLabel: '189₽', tgLabel: '250 Telegram Stars', invoiceUrl: 'https://t.me/your_bot?start=invoice_stars_250' },
    { id: 'stars_600', stars: 600, priceLabel: '399₽', tgLabel: '600 Telegram Stars', invoiceUrl: 'https://t.me/your_bot?start=invoice_stars_600' }
  ];

  const REAL_MONEY_ITEM_OFFERS = {
    decryptor: { label: '109₽', invoiceUrl: 'https://t.me/your_bot?start=invoice_item_decryptor' },
    darknet_acc: { label: '249₽', invoiceUrl: 'https://t.me/your_bot?start=invoice_item_darknet' },
    rubber_duck: { label: '199₽', invoiceUrl: 'https://t.me/your_bot?start=invoice_item_rubber_duck' }
  };

  const LOCATION_REQUIREMENTS = {
    library: ['decryptor'],
    server: ['school_pass', 'rubber_duck'],
    park: ['mission:m20']
  };

  const LOCATION_REWARDS = {
    school: { stars: 2, trust: 1, reputation: 1, missionId: null },
    cafe: { stars: 2, trust: 1, reputation: 1, missionId: null },
    library: { stars: 4, trust: 2, reputation: 2, missionId: 'm05' },
    server: { stars: 6, trust: 2, reputation: 3, missionId: 'm06' },
    park: { stars: 8, trust: 4, reputation: 5, missionId: 'm21' }
  };

  const CORE_MISSION_IDS = ['m01', 'm02', 'm03', 'm04', 'm05', 'm06'];
  const FINAL_MISSION_ID = 'm24';
  const ADVANCED_MISSION_IDS = ['m07', 'm08', 'm09', 'm10', 'm11', 'm12', 'm13', 'm14', 'm15', 'm16', 'm17', 'm18', 'm19'];

  const CHOICE_OUT_TEXT = {
    A: 'Предупреждаю класс: файл заражён, не открывайте.',
    B: 'Открою и сам проверю, это быстрее.',
    C: 'Проверяем личность Марины через второй канал.'
  };

  const paymentSessions = new Map();
  const DEMO_MODE = !telegramApp || typeof telegramApp.openInvoice !== 'function';
  const DEMO_INVOICE_DELAY_MS = 500;

  let currentScreen = 'home';
  let currentChat = null;
  let transitionDirection = 'forward';
  let navHistory = ['home'];

  const DEFAULT_STATE = normalizeState(ZD.state);
  ZD.state = loadState(DEFAULT_STATE);

  // ------------------------------------------------------------
  // State helpers
  // ------------------------------------------------------------
  function asNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function asSet(value) {
    if (value instanceof Set) return new Set(value);
    if (Array.isArray(value)) return new Set(value);
    return new Set();
  }

  function uniqueArray(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter(Boolean))];
  }

  function normalizeState(raw) {
    const state = raw || {};

    const normalized = {
      stateVersion: Math.max(1, Math.floor(asNumber(state.stateVersion, STORAGE_VERSION))),
      stars: Math.max(0, Math.floor(asNumber(state.stars, 47))),
      reputation: Math.max(0, Math.floor(asNumber(state.reputation, 12))),
      trust: Math.min(100, Math.max(0, Math.floor(asNumber(state.trust, 78)))),
      episode: Math.max(1, Math.floor(asNumber(state.episode, 3))),
      act: Math.max(1, Math.floor(asNumber(state.act, 1))),
      analyzed: asSet(state.analyzed),
      foundFlags: asSet(state.foundFlags),
      termAttempts: Math.max(0, Math.floor(asNumber(state.termAttempts, 0))),
      termSolved: !!state.termSolved,
      inventory: uniqueArray(state.inventory || []),
      visitedLocations: asSet(state.visitedLocations),
      completedMissionIds: asSet(state.completedMissionIds),
      claimedQuestRewards: asSet(state.claimedQuestRewards),
      missionLog: state.missionLog && typeof state.missionLog === 'object' ? { ...state.missionLog } : {},
      chatChoices: state.chatChoices && typeof state.chatChoices === 'object' ? { ...state.chatChoices } : {},
      purchasedThemes: uniqueArray(state.purchasedThemes || ['obsidian_glass']),
      activeTheme: typeof state.activeTheme === 'string' ? state.activeTheme : 'obsidian_glass',
      purchaseHistory: Array.isArray(state.purchaseHistory) ? state.purchaseHistory.slice(0, 50) : [],
      adminMode: !!state.adminMode,
      finaleShown: !!state.finaleShown,
      finaleInboxRead: !!state.finaleInboxRead,
      campaignFinished: !!state.campaignFinished
    };

    normalized.stateVersion = STORAGE_VERSION;

    if (normalized.purchasedThemes.length === 0) normalized.purchasedThemes = ['obsidian_glass'];
    if (!normalized.purchasedThemes.includes('obsidian_glass')) normalized.purchasedThemes.push('obsidian_glass');
    if (!normalized.purchasedThemes.includes(normalized.activeTheme)) normalized.activeTheme = 'obsidian_glass';
    if (!normalized.inventory.includes('school_pass')) normalized.inventory.push('school_pass');

    // Legacy migration from old "choiceMade"
    if (state.choiceMade && !normalized.chatChoices.dasha) {
      normalized.chatChoices.dasha = 'A';
    }

    return normalized;
  }

  function stateToPlain(state) {
    return {
      stateVersion: STORAGE_VERSION,
      stars: state.stars,
      reputation: state.reputation,
      trust: state.trust,
      episode: state.episode,
      act: state.act,
      analyzed: [...state.analyzed],
      foundFlags: [...state.foundFlags],
      termAttempts: state.termAttempts,
      termSolved: state.termSolved,
      inventory: [...state.inventory],
      visitedLocations: [...state.visitedLocations],
      completedMissionIds: [...state.completedMissionIds],
      claimedQuestRewards: [...state.claimedQuestRewards],
      missionLog: { ...state.missionLog },
      chatChoices: { ...state.chatChoices },
      purchasedThemes: [...state.purchasedThemes],
      activeTheme: state.activeTheme,
      purchaseHistory: [...state.purchaseHistory],
      adminMode: state.adminMode,
      finaleShown: state.finaleShown,
      finaleInboxRead: state.finaleInboxRead,
      campaignFinished: state.campaignFinished
    };
  }

  function loadState(defaultState) {
    const base = normalizeState(defaultState);
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const legacyKey = LEGACY_STORAGE_KEYS.find((key) => localStorage.getItem(key));
        if (legacyKey) raw = localStorage.getItem(legacyKey);
      }
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      const merged = {
        ...stateToPlain(base),
        ...parsed,
        chatChoices: { ...stateToPlain(base).chatChoices, ...(parsed.chatChoices || {}) },
        missionLog: { ...stateToPlain(base).missionLog, ...(parsed.missionLog || {}) }
      };
      return normalizeState(merged);
    } catch (err) {
      console.warn('[ZERO_DAY] loadState failed', err);
      return base;
    }
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPlain(ZD.state)));
    } catch (err) {
      console.warn('[ZERO_DAY] persistState failed', err);
    }
  }

  function resetState() {
    ZD.state = normalizeState(DEFAULT_STATE);
    persistState();
    applyTheme(ZD.state.activeTheme);
    updateProgress('silent');
    refreshStatusWidgets();
    renderCurrentScreen();
    toast('Прогресс сброшен', 'info');
  }

  // ------------------------------------------------------------
  // UI system helpers
  // ------------------------------------------------------------
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

    const pseudoLevel = 74 + Math.floor(Math.abs(Math.sin(Date.now() / 480000)) * 21);
    fill.style.width = pseudoLevel + '%';
    if (pseudoLevel <= 20) fill.style.background = 'var(--red)';
    else if (pseudoLevel <= 40) fill.style.background = 'var(--orange)';
    else fill.style.background = 'var(--green)';
  }

  function refreshStatusWidgets() {
    const stars = ZD.state.stars;
    const trust = ZD.state.trust;
    const reputation = ZD.state.reputation;

    document.querySelectorAll('.stars-val').forEach((el) => { el.textContent = stars; });
    document.querySelectorAll('.trust-val').forEach((el) => { el.textContent = trust; });
    document.querySelectorAll('.rep-val').forEach((el) => { el.textContent = reputation; });

    const topStars = document.getElementById('topStars');
    const topTrust = document.getElementById('topTrust');
    const topRep = document.getElementById('topRep');
    if (topStars) topStars.textContent = stars;
    if (topTrust) topTrust.textContent = trust;
    if (topRep) topRep.textContent = reputation;
  }

  function toast(message, type) {
    if (!frame) return;
    const existing = frame.querySelector('.toast');
    if (existing) existing.remove();

    const t = document.createElement('div');
    t.className = 'toast' + (type ? ' toast-' + type : '');
    t.textContent = message;
    frame.appendChild(t);
    setTimeout(() => t.remove(), 1850);
  }

  function addStars(amount, reason) {
    if (amount <= 0) return;
    ZD.state.stars += amount;
    persistState();
    refreshStatusWidgets();
    toast('+' + amount + ' ⭐ ' + (reason || ''));
  }

  function bumpTrust(delta) {
    if (!delta) return;
    ZD.state.trust = Math.min(100, Math.max(0, ZD.state.trust + delta));
  }

  function bumpReputation(delta) {
    if (!delta) return;
    ZD.state.reputation = Math.max(0, ZD.state.reputation + delta);
  }

  function recordPurchase(entry) {
    const now = new Date();
    const stamp = now.toLocaleString('ru-RU', { hour12: false });
    ZD.state.purchaseHistory.unshift({
      id: 'h_' + now.getTime(),
      time: stamp,
      ...entry
    });
    if (ZD.state.purchaseHistory.length > 30) {
      ZD.state.purchaseHistory = ZD.state.purchaseHistory.slice(0, 30);
    }
    persistState();
  }

  function getUnreadCount() {
    return ZD.contacts.reduce((sum, c) => sum + (Number(c.unread) || 0), 0);
  }

  function syncContactsFromState() {
    const dasha = ZD.contacts.find((c) => c.id === 'dasha');
    const unknown = ZD.contacts.find((c) => c.id === 'unknown');
    const marina = ZD.contacts.find((c) => c.id === 'marina');

    if (dasha && ZD.state.chatChoices.dasha) {
      const key = ZD.state.chatChoices.dasha;
      const reply = ZD.choiceReplies[key];
      dasha.unread = 0;
      if (reply && reply.text) dasha.preview = reply.text;
      dasha.time = '19:50';
    }

    if (unknown && ZD.state.finaleShown) {
      unknown.unread = ZD.state.finaleInboxRead ? 0 : Math.max(unknown.unread || 0, 1);
      unknown.preview = 'Фаза 1 закрыта. Сквер разблокирован.';
      unknown.time = ZD.state.finaleInboxRead ? 'прочитано' : 'сейчас';
    }

    if (marina && ZD.state.chatChoices.dasha) {
      marina.unread = 0;
    }
  }

  function getThemeById(themeId) {
    return ZD.themes.find((theme) => theme.id === themeId) || ZD.themes[0];
  }

  function applyTheme(themeId) {
    const theme = getThemeById(themeId);
    ZD.state.activeTheme = theme.id;
    document.documentElement.setAttribute('data-theme', theme.id);
    persistState();
  }

  // ------------------------------------------------------------
  // Story progress and missions
  // ------------------------------------------------------------
  function allFlaggedAnalyzed() {
    const flagged = ZD.gallery.filter((item) => item.flagged);
    return flagged.length > 0 && flagged.every((item) => ZD.state.analyzed.has(item.id));
  }

  function getQuestRule(missionId) {
    return (ZD.questRules && ZD.questRules[missionId]) || { requires: [], screen: 'home', objective: 'Продолжай расследование.' };
  }

  function getMission(missionId) {
    return ZD.missionCalendar.find((mission) => mission.id === missionId) || null;
  }

  function coreMissionsDone() {
    return CORE_MISSION_IDS.every((id) => ZD.state.completedMissionIds.has(id));
  }

  function paidPurchaseCount() {
    return ZD.state.purchaseHistory.filter((entry) => entry && entry.status === 'paid').length;
  }

  function questUnlocked(missionId) {
    if (ZD.state.adminMode) return true;
    const rule = getQuestRule(missionId);
    return (rule.requires || []).every((id) => ZD.state.completedMissionIds.has(id));
  }

  function questConditionMet(missionId) {
    switch (missionId) {
      case 'm01':
        return !!ZD.state.chatChoices.dasha;
      case 'm02':
        return allFlaggedAnalyzed();
      case 'm03':
        return ZD.state.foundFlags.size >= 4;
      case 'm04':
        return ZD.state.termSolved;
      case 'm05':
        return ZD.state.visitedLocations.has('library');
      case 'm06':
        return ZD.state.visitedLocations.has('server');
      case 'm07':
        return ZD.state.analyzed.size >= 4;
      case 'm08':
        return ZD.state.stars >= 70 || ZD.state.inventory.includes('wifi_antenna');
      case 'm09':
        return ZD.state.trust >= 82;
      case 'm10':
        return ZD.state.reputation >= 14;
      case 'm11':
        return ZD.state.visitedLocations.has('school') && ZD.state.visitedLocations.has('cafe');
      case 'm12':
        return ZD.state.termAttempts >= 8;
      case 'm13':
        return paidPurchaseCount() >= 1;
      case 'm14':
        return ZD.state.inventory.includes('darknet_acc') || ZD.state.stars >= 120;
      case 'm15':
        return ZD.state.stars >= 95;
      case 'm16':
        return ZD.state.trust >= 86;
      case 'm17':
        return ZD.state.reputation >= 20;
      case 'm18':
        return ZD.state.visitedLocations.size >= 4;
      case 'm19':
        return ZD.state.stars >= 140;
      case 'm20':
        return ADVANCED_MISSION_IDS.every((id) => ZD.state.completedMissionIds.has(id));
      case 'm21':
        return ZD.state.visitedLocations.has('park');
      case 'm22':
        return !!ZD.state.finaleInboxRead;
      case 'm23':
        return ZD.state.trust >= 90 && ZD.state.reputation >= 24;
      case 'm24':
        return ZD.missionCalendar
          .filter((mission) => mission.id !== FINAL_MISSION_ID)
          .every((mission) => ZD.state.completedMissionIds.has(mission.id));
      default:
        return false;
    }
  }

  function questStatus(missionId) {
    if (ZD.state.completedMissionIds.has(missionId)) return 'done';
    return questUnlocked(missionId) ? 'active' : 'locked';
  }

  function questRewardAmount(missionId) {
    if (missionId === 'm01') {
      const key = ZD.state.chatChoices.dasha;
      return Math.max(0, Number((ZD.choiceReplies[key] || {}).stars) || 0);
    }
    const mission = getMission(missionId);
    return Math.max(0, Number((mission || {}).reward) || 0);
  }

  function completeQuest(missionId, options) {
    if (!missionId || ZD.state.completedMissionIds.has(missionId)) return false;

    const opts = options || {};
    const mission = getMission(missionId);
    ZD.state.completedMissionIds.add(missionId);
    ZD.state.missionLog[missionId] = {
      title: mission ? mission.title : missionId,
      source: opts.source || 'progress',
      completedAt: new Date().toISOString()
    };

    if (opts.claimReward !== false && !ZD.state.claimedQuestRewards.has(missionId)) {
      const reward = questRewardAmount(missionId);
      ZD.state.claimedQuestRewards.add(missionId);
      if (reward > 0) {
        ZD.state.stars += reward;
        if (!opts.silent) toast(`Миссия ${missionId.toUpperCase()} закрыта: +${reward} ⭐`, 'success');
      }
    }

    return true;
  }

  function markMissionDone(missionId, source) {
    return completeQuest(missionId, { source: source || 'manual', silent: true });
  }

  function recomputeProgress(source) {
    const silent = source === 'silent';
    let changed = false;
    let pass = 0;

    if (ZD.state.adminMode) {
      ZD.missionCalendar.forEach((mission) => {
        changed = completeQuest(mission.id, { source: 'admin', claimReward: false, silent: true }) || changed;
      });
      return changed;
    }

    let keepScanning = true;
    while (keepScanning && pass < 8) {
      pass += 1;
      keepScanning = false;

      ZD.missionCalendar.forEach((mission) => {
        if (ZD.state.completedMissionIds.has(mission.id)) return;
        if (!questUnlocked(mission.id)) return;
        if (!questConditionMet(mission.id)) return;

        const completed = completeQuest(mission.id, {
          source: source || 'progress',
          claimReward: !silent,
          silent
        });
        changed = completed || changed;
        keepScanning = completed || keepScanning;
      });
    }

    return changed;
  }

  function getCurrentObjectives(limit) {
    const max = Number(limit) > 0 ? Number(limit) : 3;
    return ZD.missionCalendar
      .filter((mission) => questStatus(mission.id) === 'active')
      .slice(0, max)
      .map((mission) => ({
        ...mission,
        objective: getQuestRule(mission.id).objective,
        screen: getQuestRule(mission.id).screen
      }));
  }

  function checkStoryMilestones(source) {
    const silent = source === 'silent';
    if (ZD.state.completedMissionIds.has('m20') && !ZD.state.finaleShown) {
      ZD.state.finaleShown = true;
      ZD.state.finaleInboxRead = false;
      const unknown = ZD.contacts.find((c) => c.id === 'unknown');
      if (unknown) {
        unknown.unread = Math.max(1, Number(unknown.unread) || 0);
        unknown.preview = 'Финальная ветка открыта. Проверь Сквер.';
        unknown.time = 'сейчас';
      }
      if (!silent) toast('Основной цикл закрыт. Сквер открыт для финала.', 'success');
    }

    if (ZD.state.completedMissionIds.has(FINAL_MISSION_ID) && !ZD.state.campaignFinished) {
      ZD.state.campaignFinished = true;
      if (!silent) toast('Кампания завершена. Протокол закрыт.', 'success');
    }
  }

  function updateEpisodeStates() {
    const missionDoneCount = ZD.state.completedMissionIds.size;
    const nextEpisode = Math.min(24, Math.max(3, 3 + Math.floor(missionDoneCount / 2)));
    ZD.state.episode = nextEpisode;
    ZD.state.act = missionDoneCount >= 12 ? 2 : 1;

    ZD.episodes.forEach((ep) => {
      ep.done = ep.id < ZD.state.episode;
      ep.active = ep.id === ZD.state.episode;
      ep.locked = ep.id > ZD.state.episode + 1;
    });
  }

  function updateProgress(source) {
    const src = source || 'progress';
    syncContactsFromState();
    recomputeProgress(src);
    checkStoryMilestones(src);
    syncContactsFromState();

    updateEpisodeStates();
    persistState();
    refreshStatusWidgets();
    buildNav();
    setActiveNav(rootNav(currentScreen));

    if (src !== 'silent' && currentScreen === 'home') {
      renderScreen('home');
    }
  }

  // ------------------------------------------------------------
  // Telegram and billing
  // ------------------------------------------------------------
  function initTelegram() {
    if (!telegramApp) return;
    try {
      telegramApp.ready();
      telegramApp.expand();
      if (typeof telegramApp.setBackgroundColor === 'function') telegramApp.setBackgroundColor('#000000');
      if (typeof telegramApp.setHeaderColor === 'function') telegramApp.setHeaderColor('#000000');
      telegramApp.onEvent('invoiceClosed', onInvoiceClosed);
    } catch (err) {
      console.warn('[ZERO_DAY] Telegram init error', err);
    }
  }

  function extractInvoiceKey(url) {
    try {
      const parsed = new URL(url);
      const start = parsed.searchParams.get('start');
      if (start) return start;
      const slug = parsed.searchParams.get('slug');
      if (slug) return slug;
      return parsed.pathname.split('/').filter(Boolean).pop() || url;
    } catch (err) {
      return url;
    }
  }

  function isDemoInvoiceUrl(url) {
    if (!url || typeof url !== 'string') return true;
    return url.includes('/your_bot') || url.includes('start=invoice_');
  }

  function shouldUseDemoInvoice(meta) {
    return DEMO_MODE || isDemoInvoiceUrl(meta.invoiceUrl) || meta.demo === true;
  }

  function paymentsAreDemo() {
    return DEMO_MODE
      || TOPUP_OFFERS.some((offer) => isDemoInvoiceUrl(offer.invoiceUrl))
      || Object.values(REAL_MONEY_ITEM_OFFERS).some((offer) => isDemoInvoiceUrl(offer.invoiceUrl));
  }

  function closePaymentSheet() {
    const sheet = frame.querySelector('.payment-sheet-overlay');
    if (sheet) sheet.remove();
  }

  function paymentTitle(meta) {
    if (meta.type === 'topup') return `${meta.stars} Stars`;
    return meta.itemName || meta.itemId || 'Покупка';
  }

  function openPaymentSheet(meta) {
    if (!meta) return;
    closePaymentSheet();

    const demo = shouldUseDemoInvoice(meta);
    const overlay = document.createElement('div');
    overlay.className = 'payment-sheet-overlay';
    overlay.innerHTML = `
      <div class="payment-dim" data-payment-close></div>
      <div class="payment-sheet">
        <div class="payment-handle"></div>
        <div class="payment-provider">${demo ? 'Telegram Invoice · DEMO' : 'Telegram Invoice'}</div>
        <div class="payment-title">${paymentTitle(meta)}</div>
        <div class="payment-price">${meta.priceLabel || '—'}</div>
        <div class="payment-note">
          ${demo
            ? 'Это демонстрационный счёт. Деньги не списываются; Stars будут начислены только после подтверждения.'
            : 'После подтверждения откроется платёжное окно Telegram.'}
        </div>
        <div class="payment-status" id="paymentStatus">Ожидает подтверждения</div>
        <div class="payment-actions">
          <button class="payment-btn secondary" data-payment-close type="button">Отмена</button>
          <button class="payment-btn primary" id="paymentConfirmBtn" type="button">${demo ? 'Подтвердить DEMO' : 'Открыть счёт'}</button>
        </div>
      </div>
    `;

    frame.appendChild(overlay);
    overlay.querySelectorAll('[data-payment-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!overlay.classList.contains('processing')) closePaymentSheet();
      });
    });

    overlay.querySelector('#paymentConfirmBtn').addEventListener('click', (event) => {
      const btn = event.currentTarget;
      overlay.classList.add('processing');
      btn.disabled = true;
      overlay.querySelectorAll('[data-payment-close]').forEach((cancel) => { cancel.disabled = true; });
      const status = overlay.querySelector('#paymentStatus');
      if (status) status.textContent = demo ? 'Проверяем демо-счёт...' : 'Открываем Telegram...';
      startInvoice({ ...meta, demo });
    });
  }

  function renderPaymentResult(session, status) {
    const overlay = frame.querySelector('.payment-sheet-overlay');
    if (!overlay) return false;

    const paid = status === 'paid';
    overlay.querySelector('.payment-sheet').innerHTML = `
      <div class="payment-handle"></div>
      <div class="payment-result ${paid ? 'ok' : 'bad'}">${paid ? 'Оплата подтверждена' : 'Оплата не прошла'}</div>
      <div class="payment-title">${paymentTitle(session)}</div>
      <div class="payment-note">${paid ? 'Баланс и история покупок обновлены.' : 'Баланс не изменился. Попробуй позже или проверь счёт у бота.'}</div>
      <button class="payment-btn primary wide" id="paymentDoneBtn" type="button">Готово</button>
    `;
    overlay.querySelector('#paymentDoneBtn').addEventListener('click', () => {
      closePaymentSheet();
      if (currentScreen === 'shop') renderScreen('shop');
      if (currentScreen === 'settings') renderScreen('settings');
    });
    return true;
  }

  function refreshAfterPayment(hasSheet) {
    if (!hasSheet) {
      if (currentScreen === 'shop') renderScreen('shop');
      if (currentScreen === 'settings') renderScreen('settings');
    }
  }

  function startInvoice(meta) {
    if (!meta || !meta.invoiceUrl) {
      toast('Счёт недоступен', 'error');
      return;
    }

    const key = extractInvoiceKey(meta.invoiceUrl) || ('invoice_' + Date.now());
    const session = { ...meta, key, processed: false };
    paymentSessions.set(key, session);

    if (shouldUseDemoInvoice(session)) {
      setTimeout(() => finalizeInvoice(session, 'paid'), DEMO_INVOICE_DELAY_MS);
      return;
    }

    try {
      telegramApp.openInvoice(meta.invoiceUrl, (status) => {
        finalizeInvoice(session, status || 'cancelled');
      });
    } catch (err) {
      console.warn('[ZERO_DAY] openInvoice error', err);
      finalizeInvoice(session, 'failed');
    }
  }

  function onInvoiceClosed(payload) {
    const status = typeof payload === 'string' ? payload : ((payload && payload.status) || 'cancelled');
    const slug = payload && (payload.slug || payload.invoiceSlug || payload.id);

    let session = null;
    if (slug && paymentSessions.has(slug)) {
      session = paymentSessions.get(slug);
    } else {
      for (const candidate of paymentSessions.values()) {
        if (!candidate.processed) {
          session = candidate;
          break;
        }
      }
    }

    if (session) finalizeInvoice(session, status);
  }

  function finalizeInvoice(session, status) {
    if (!session || session.processed) return;
    session.processed = true;
    paymentSessions.delete(session.key);

    if (status === 'paid') {
      if (session.type === 'topup') {
        ZD.state.stars += session.stars;
        recordPurchase({
          kind: 'topup',
          title: `Пополнение ${session.stars} Stars`,
          amount: session.priceLabel || '',
          status: 'paid'
        });
        persistState();
        refreshStatusWidgets();
        toast('+' + session.stars + ' Stars. Спасибо за поддержку!', 'success');
      }

      if (session.type === 'item') {
        if (!ZD.state.inventory.includes(session.itemId)) {
          ZD.state.inventory.push(session.itemId);
        }
        recordPurchase({
          kind: 'item',
          title: `Покупка: ${session.itemName || session.itemId}`,
          amount: session.priceLabel || '',
          status: 'paid'
        });
        persistState();
        refreshStatusWidgets();
        toast('Покупка подтверждена', 'success');
      }

      updateProgress('payment');
      refreshAfterPayment(renderPaymentResult(session, status));
      return;
    }

    recordPurchase({
      kind: session.type || 'invoice',
      title: session.itemName ? `Платёж: ${session.itemName}` : 'Платёж',
      amount: session.priceLabel || '',
      status: status
    });
    const hadSheet = renderPaymentResult(session, status);
    toast('Платёж отменён', 'error');
    refreshAfterPayment(hadSheet);
  }

  function buyStarsPack(packId) {
    const offer = TOPUP_OFFERS.find((x) => x.id === packId);
    if (!offer) {
      toast('Пакет не найден', 'error');
      return;
    }
    openPaymentSheet({
      type: 'topup',
      stars: offer.stars,
      priceLabel: offer.priceLabel,
      invoiceUrl: offer.invoiceUrl
    });
  }

  function buyItemForMoney(itemId, itemName) {
    const offer = REAL_MONEY_ITEM_OFFERS[itemId];
    if (!offer) {
      toast('Оплата для этого товара не настроена', 'error');
      return;
    }
    if (ZD.state.inventory.includes(itemId)) {
      toast('Товар уже куплен', 'info');
      return;
    }
    openPaymentSheet({
      type: 'item',
      itemId,
      itemName,
      priceLabel: offer.label,
      invoiceUrl: offer.invoiceUrl
    });
  }

  // ------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------
  function navIcon(name) {
    const icons = {
      home: '🏠',
      messenger: '💬',
      map: '🗺️',
      shop: '🛒',
      settings: '⚙️'
    };
    return icons[name] || '•';
  }

  function rootNav(id) {
    if (id === 'chat') return 'messenger';
    if (['home', 'messenger', 'map', 'shop', 'settings'].includes(id)) return id;
    return 'home';
  }

  function buildNav() {
    const unread = getUnreadCount();
    const items = [
      { id: 'home', label: 'Главная' },
      { id: 'messenger', label: 'Чаты', badge: unread },
      { id: 'map', label: 'Карта' },
      { id: 'shop', label: 'Магазин' },
      { id: 'settings', label: 'Настройки' }
    ];

    bottomNav.innerHTML = items.map((it) => `
      <button class="nav-item ${it.id === rootNav(currentScreen) ? 'active' : ''}" data-nav="${it.id}" type="button">
        ${it.badge ? `<span class="nav-dot">${it.badge > 9 ? '9+' : it.badge}</span>` : ''}
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

  function navigateTo(id, options) {
    const opts = options || {};
    if (opts.chatId) currentChat = opts.chatId;

    if (opts.historyMode === 'reset') {
      navHistory = [id];
    } else if (opts.historyMode === 'push') {
      navHistory.push(id);
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
    navigateTo(fallback || 'home', { direction: 'back', historyMode: 'reset' });
  }

  function renderCurrentScreen() {
    renderScreen(currentScreen);
  }

  function screenDiv(id) {
    const s = document.createElement('div');
    s.className = 'screen ' + (transitionDirection === 'back' ? 'slide-back' : 'slide-forward');
    s.id = id;
    frame.appendChild(s);
    return s;
  }

  function header(backTo, title, sub, extraRight) {
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
        <div class="hdr-extra">${extraRight || ''}</div>
      </div>
    `;
  }

  function bindBack(screen) {
    screen.querySelectorAll('[data-back]').forEach((btn) => {
      btn.addEventListener('click', () => navigateBack(btn.dataset.back));
    });
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
        buildChat(currentChat || 'dasha');
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
      case 'settings':
        buildSettings();
        break;
      default:
        buildHome();
    }
    refreshStatusWidgets();
  }

  // ------------------------------------------------------------
  // Home
  // ------------------------------------------------------------
  function buildHome() {
    const s = screenDiv('homeScreen');
    const coreDone = CORE_MISSION_IDS.filter((id) => ZD.state.completedMissionIds.has(id)).length;
    const unread = getUnreadCount();
    const objectives = getCurrentObjectives(3);
    const primaryObjective = objectives[0] || null;

    const objectiveRows = objectives.length ? objectives.map((mission) => `
      <button class="objective-row" data-objective-screen="${mission.screen}" type="button">
        <span class="objective-id">${mission.id.toUpperCase()}</span>
        <span class="objective-copy">
          <span class="objective-title">${mission.title}</span>
          <span class="objective-text">${mission.objective}</span>
        </span>
        <span class="objective-arrow">›</span>
      </button>
    `).join('') : '<div class="objective-empty">Активные цели закрыты. Проверь финальную ветку или журнал миссий.</div>';

    const coachHtml = primaryObjective ? `
      <section class="quest-coach">
        <div class="quest-coach-kicker">Что делать сейчас</div>
        <div class="quest-coach-title">${primaryObjective.title}</div>
        <div class="quest-coach-text">${primaryObjective.objective}</div>
        <button class="quest-coach-btn" data-objective-screen="${primaryObjective.screen}" type="button">Открыть</button>
      </section>
    ` : `
      <section class="quest-coach done">
        <div class="quest-coach-kicker">Кампания</div>
        <div class="quest-coach-title">${ZD.state.campaignFinished ? 'Протокол закрыт' : 'Нет активных целей'}</div>
        <div class="quest-coach-text">${ZD.state.campaignFinished ? 'Все основные миссии завершены.' : 'Проверь карту, чат или настройки администратора.'}</div>
      </section>
    `;

    const missionRows = ZD.missionCalendar.map((mission) => {
      const status = questStatus(mission.id);
      const statusText = status === 'done' ? 'Готово' : (status === 'active' ? 'Активна' : 'Заблокирована');
      return `
        <div class="mission-row ${status}">
          <div class="mission-meta">${mission.id.toUpperCase()} · ${mission.month} · ${mission.week}</div>
          <div class="mission-title">${mission.title}</div>
          <div class="mission-extra">
            <span class="mission-state mission-${status}">${statusText}</span>
            <span class="mission-reward">⭐ ${mission.reward}</span>
          </div>
          <div class="mission-objective">${getQuestRule(mission.id).objective}</div>
        </div>
      `;
    }).join('');

    s.innerHTML = `
      <div class="scrollable home-scroll">
        <section class="home-top">
          <div class="home-greeting">
            <div class="greeting-meta">
              <div class="greeting-title">ZERO_DAY</div>
              <div class="greeting-sub">Школьный Протокол • Кампания 6 месяцев</div>
            </div>
            <div class="avatar-wrap">
              <div class="avatar-badge">ZD</div>
              <div class="star-pill">⭐ <span class="stars-val">${ZD.state.stars}</span></div>
            </div>
          </div>
          <div class="act-chip">АКТ ${ZD.state.act} · ЭПИЗОД ${ZD.state.episode}</div>
          <article class="episode-card" data-goto="chat" data-chat="dasha">
            <div>
              <div class="episode-kicker">Ключевые миссии: ${coreDone}/${CORE_MISSION_IDS.length}</div>
              <div class="episode-title">${coreMissionsDone() ? 'Фаза 1 закрыта' : 'Расследование продолжается'}</div>
              <div class="episode-meta">${coreMissionsDone() ? 'Сквер доступен для финала' : 'Выполни чат, галерею, браузер, терминал, карту'}</div>
            </div>
            <div class="episode-arrow">›</div>
          </article>
        </section>

        <div class="home-note">${unread > 0 ? `Непрочитанные сообщения: ${unread}` : 'Все уведомления обработаны. Продолжай кампанию.'}</div>

        ${coachHtml}

        <div class="home-section-title">Текущие цели</div>
        <div class="objective-list">${objectiveRows}</div>

        <div class="home-section-title">Приложения</div>
        <div class="apps-grid">
          <button class="app-tile ${unread > 0 ? 'has-badge' : ''}" data-goto="messenger" type="button"><span class="app-tile-ico">💬</span><span class="app-tile-lbl">Мессенджер</span></button>
          <button class="app-tile" data-goto="gallery" type="button"><span class="app-tile-ico">🖼️</span><span class="app-tile-lbl">Галерея</span></button>
          <button class="app-tile" data-goto="browser" type="button"><span class="app-tile-ico">🌐</span><span class="app-tile-lbl">Браузер</span></button>
          <button class="app-tile" data-goto="map" type="button"><span class="app-tile-ico">🗺️</span><span class="app-tile-lbl">Карта</span></button>
          <button class="app-tile" data-goto="terminal" type="button"><span class="app-tile-ico">💻</span><span class="app-tile-lbl">Терминал</span></button>
          <button class="app-tile" data-goto="shop" type="button"><span class="app-tile-ico">🛒</span><span class="app-tile-lbl">Магазин</span></button>
        </div>

        <div class="stats-row">
          <div class="stat-card"><div class="stat-val stars-val">${ZD.state.stars}</div><div class="stat-lbl">Stars</div></div>
          <div class="stat-card"><div class="stat-val trust-val">${ZD.state.trust}</div><div class="stat-lbl">Доверие</div></div>
          <div class="stat-card"><div class="stat-val rep-val">${ZD.state.reputation}</div><div class="stat-lbl">Репутация</div></div>
        </div>

        <div class="home-section-title">План миссий (6 месяцев)</div>
        <div class="mission-list">${missionRows}</div>
      </div>
    `;

    s.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => {
        const goto = el.dataset.goto;
        const chatId = el.dataset.chat;
        if (chatId) {
          navigateTo('chat', { chatId, historyMode: 'push', direction: 'forward' });
          return;
        }
        navigateTo(goto, { historyMode: 'push', direction: 'forward' });
      });
    });

    s.querySelectorAll('[data-objective-screen]').forEach((el) => {
      el.addEventListener('click', () => {
        navigateTo(el.dataset.objectiveScreen, { historyMode: 'push', direction: 'forward' });
      });
    });
  }

  // ------------------------------------------------------------
  // Messenger list
  // ------------------------------------------------------------
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
      ${header('home', 'Сообщения', null, '<span class="hdr-pencil">✎</span>')}
      <div class="scrollable">${rows}</div>
    `;

    bindBack(s);

    s.querySelectorAll('.chat-list-item').forEach((el) => {
      el.addEventListener('click', () => {
        navigateTo('chat', { chatId: el.dataset.chat, historyMode: 'push', direction: 'forward' });
      });
    });
  }

  // ------------------------------------------------------------
  // Chat
  // ------------------------------------------------------------
  function buildChat(contactId) {
    const contact = ZD.contacts.find((x) => x.id === contactId);
    if (!contact) {
      buildMessengerList();
      return;
    }

    if (contact.unread > 0) {
      contact.unread = 0;
      persistState();
      buildNav();
    }

    if (contact.id === 'unknown' && ZD.state.finaleShown && !ZD.state.finaleInboxRead) {
      ZD.state.finaleInboxRead = true;
      updateProgress('chat');
    }

    const s = screenDiv('chatScreen');
    const messages = ZD.messages[contactId] || [];
    const choiceKey = ZD.state.chatChoices[contactId] || null;

    let messageHtml = messages.map((m) => {
      if (m.from === 'system') return `<div class="bubble bubble-system">${m.text}</div>`;
      if (m.from === 'in') return `<div class="bubble bubble-in">${m.text}<div class="bub-time">${m.time || ''}</div></div>`;
      return `<div class="bubble bubble-out">${m.text}<div class="bub-time">${m.time || ''}</div></div>`;
    }).join('');

    if (contactId === 'unknown' && ZD.state.finaleShown) {
      messageHtml += '<div class="bubble bubble-system">Финальная ветка · протокол 404</div>';
      messageHtml += '<div class="bubble bubble-in">Основной цикл закрыт. Сквер открыт. Финальная встреча покажет, кто запустил ZERO_DAY.</div>';
    }

    if (choiceKey && ZD.choiceReplies[choiceKey]) {
      messageHtml += `<div class="bubble bubble-out">${CHOICE_OUT_TEXT[choiceKey]}<div class="bub-time">19:49</div></div>`;
      messageHtml += `<div class="bubble bubble-in">${ZD.choiceReplies[choiceKey].text}<div class="bub-time">19:50</div></div>`;
    }

    const canChoose = ZD.choices[contactId] && !choiceKey;
    const choices = ZD.choices[contactId] || [];

    const choicesHtml = canChoose ? `
      <div class="choices-wrap" id="choicesWrap">
        <div class="choices-lbl">Твой выбор</div>
        ${choices.map((choice) => `
          <button class="choice ${choice.good ? '' : 'bad'}" data-key="${choice.key}" type="button">
            <span class="choice-key">[${choice.key}]</span>
            ${choice.text}
          </button>
        `).join('')}
      </div>
    ` : choiceKey ? `
      <div class="choices-wrap"><div class="choices-lbl done">✓ Решение принято</div></div>
    ` : '';

    s.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" data-back="messenger" type="button"><span class="chevron">‹</span><span>Чаты</span></button>
        <div class="chat-avatar mini" style="background:${contact.color}">${contact.initials}</div>
        <div>
          <div class="hdr-title">${contact.name}</div>
          <div class="hdr-sub">${contact.online ? '● онлайн' : '● офлайн'}</div>
        </div>
      </div>
      <div class="chat-bg" id="chatBg">
        <div class="bubble bubble-system">Сегодня · 19:47</div>
        ${messageHtml}
        <div class="typing-bub" id="typingBub"><div class="td"></div><div class="td"></div><div class="td"></div></div>
      </div>
      ${choicesHtml}
    `;

    bindBack(s);

    const chatBg = s.querySelector('#chatBg');
    if (chatBg) chatBg.scrollTop = 9999;

    if (canChoose) {
      s.querySelectorAll('.choice').forEach((btn) => {
        btn.addEventListener('click', () => handleChoice(contactId, btn.dataset.key, s));
      });
    }
  }

  function handleChoice(contactId, key, screen) {
    const reply = ZD.choiceReplies[key];
    if (!reply) return;

    ZD.state.chatChoices[contactId] = key;
    bumpTrust(reply.trustDelta || 0);
    bumpReputation(reply.repDelta || 0);

    const contact = ZD.contacts.find((x) => x.id === contactId);
    if (contact) {
      contact.unread = 0;
      contact.preview = reply.text;
      contact.time = '19:50';
    }

    updateProgress('chat');
    renderScreen('chat');
  }

  // ------------------------------------------------------------
  // Gallery
  // ------------------------------------------------------------
  function buildGallery() {
    const s = screenDiv('galleryScreen');

    const thumbs = ZD.gallery.map((item) => {
      const analyzed = ZD.state.analyzed.has(item.id);
      const cls = analyzed ? 'analyzed' : (item.flagged ? 'flagged' : '');
      return `
        <button class="gal-thumb ${cls}" data-item="${item.id}" type="button">
          <img src="${item.src}" alt="${item.name}" loading="lazy">
          <span class="gal-thumb-label">${item.name}</span>
        </button>
      `;
    }).join('');

    s.innerHTML = `
      ${header('home', 'Галерея · Улики', `${ZD.gallery.length} файлов`)}
      <div class="gal-grid">${thumbs}</div>

      <div id="galDetailOverlay">
        <div class="screen-header">
          <button class="back-btn" id="galDetailBack" type="button"><span class="chevron">‹</span><span>Назад</span></button>
          <div>
            <div class="hdr-title" id="galDetailName">—</div>
            <div class="hdr-sub" id="galDetailDesc">—</div>
          </div>
        </div>
        <div class="gal-detail-img">
          <img id="galDetailImage" alt="gallery item">
          <div class="gal-scan-overlay" id="galScanOverlay"></div>
          <div class="scan-anim" id="scanAnim"></div>
        </div>
        <button class="analyze-btn" id="analyzeBtn" type="button">Анализировать EXIF</button>
        <div class="exif-panel scrollable" id="exifPanel"></div>
      </div>
    `;

    bindBack(s);

    s.querySelector('#galDetailBack').addEventListener('click', () => {
      s.querySelector('#galDetailOverlay').classList.remove('open');
    });

    s.querySelectorAll('.gal-thumb').forEach((thumb) => {
      thumb.addEventListener('click', () => openGalleryDetail(thumb.dataset.item, s));
    });
  }

  function openGalleryDetail(itemId, screen) {
    const item = ZD.gallery.find((x) => x.id === itemId);
    if (!item) return;

    const overlay = screen.querySelector('#galDetailOverlay');
    const analyzeBtn = screen.querySelector('#analyzeBtn');
    const exifPanel = screen.querySelector('#exifPanel');

    overlay.classList.add('open');
    screen.querySelector('#galDetailName').textContent = item.name;
    screen.querySelector('#galDetailDesc').textContent = item.desc;
    screen.querySelector('#galDetailImage').src = item.src;

    if (ZD.state.analyzed.has(item.id)) {
      renderExif(item, exifPanel);
      analyzeBtn.textContent = '✓ Уже проанализировано';
      analyzeBtn.disabled = true;
      analyzeBtn.classList.add('done');
    } else {
      exifPanel.innerHTML = '<div class="exif-placeholder">Запусти анализ, чтобы получить EXIF-метаданные</div>';
      analyzeBtn.textContent = 'Анализировать EXIF';
      analyzeBtn.disabled = false;
      analyzeBtn.classList.remove('done');
      analyzeBtn.onclick = () => runGalleryAnalysis(item, screen);
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

  function runGalleryAnalysis(item, screen) {
    if (ZD.state.analyzed.has(item.id)) return;

    const scanLine = screen.querySelector('#scanAnim');
    const scanOverlay = screen.querySelector('#galScanOverlay');
    const btn = screen.querySelector('#analyzeBtn');

    btn.textContent = 'Сканирование...';
    btn.disabled = true;
    scanLine.style.display = 'block';
    scanOverlay.style.display = 'block';

    setTimeout(() => {
      ZD.state.analyzed.add(item.id);
      scanLine.style.display = 'none';
      scanOverlay.style.display = 'none';
      renderExif(item, screen.querySelector('#exifPanel'));
      btn.textContent = '✓ Проанализировано';
      btn.classList.add('done');

      updateProgress('gallery');
      renderScreen('gallery');
    }, 1500);
  }

  // ------------------------------------------------------------
  // Browser (phishing simulation)
  // ------------------------------------------------------------
  function buildBrowser() {
    const s = screenDiv('browserScreen');

    s.innerHTML = `
      <div class="browser-toolbar">
        ${header('home', 'Safari', null, '<span class="hdr-danger">Небезопасно</span>')}
        <div class="url-bar-wrap">
          <div class="url-bar">
            <span class="url-lock http">🔓</span>
            <span class="url-txt">sekur-bank-online.ru</span>
          </div>
        </div>
      </div>
      <div class="site-content scrollable">
        <div class="site-topbar">
          <div class="site-logo">SekurBank Online</div>
          <div class="site-tagline">Проверка безопасности аккаунта</div>
        </div>
        <div class="site-body">
          <div class="phish-warning">
            <div class="phish-w-title">⚠ Срочно: аккаунт заблокирован</div>
            <div class="phish-w-txt">Чтобы разблокировать доступ, введите данные карты в течение 24 часов.</div>
          </div>
          <div class="flags-box">
            <div class="flags-title">Найди все 4 признака фишинга</div>
            <div class="flag-row" data-flag="1"><div class="flag-chk" id="fc1"></div><span>Подозрительный домен</span></div>
            <div class="flag-row" data-flag="2"><div class="flag-chk" id="fc2"></div><span>HTTP вместо HTTPS</span></div>
            <div class="flag-row" data-flag="3"><div class="flag-chk" id="fc3"></div><span>Давление срочностью</span></div>
            <div class="flag-row" data-flag="4"><div class="flag-chk" id="fc4"></div><span>Запрос реквизитов карты</span></div>
            <div class="flags-success" id="flagsSuccess">✓ Отлично! Все признаки найдены.</div>
          </div>
        </div>
      </div>
    `;

    bindBack(s);

    s.querySelectorAll('.flag-row').forEach((row) => {
      row.addEventListener('click', () => {
        const flag = row.dataset.flag;
        if (!flag || ZD.state.foundFlags.has(flag)) return;
        ZD.state.foundFlags.add(flag);
        row.classList.add('found');
        const chk = s.querySelector('#fc' + flag);
        if (chk) chk.textContent = '✓';

        if (ZD.state.foundFlags.size >= 4) {
          const success = s.querySelector('#flagsSuccess');
          if (success) success.style.display = 'block';
          updateProgress('browser');
        } else {
          persistState();
        }
      });
    });

    ZD.state.foundFlags.forEach((flag) => {
      const row = s.querySelector(`[data-flag="${flag}"]`);
      const chk = s.querySelector('#fc' + flag);
      if (row) row.classList.add('found');
      if (chk) chk.textContent = '✓';
    });

    if (ZD.state.foundFlags.size >= 4) {
      const success = s.querySelector('#flagsSuccess');
      if (success) success.style.display = 'block';
    }
  }

  // ------------------------------------------------------------
  // Map
  // ------------------------------------------------------------
  function hasRequirements(locationId) {
    if (ZD.state.adminMode) return true;
    const req = LOCATION_REQUIREMENTS[locationId] || [];
    return req.every((token) => {
      if (token === 'core_missions') return coreMissionsDone();
      if (token.startsWith('mission:')) return ZD.state.completedMissionIds.has(token.slice('mission:'.length));
      return ZD.state.inventory.includes(token);
    });
  }

  function locationAccess(location) {
    const available = hasRequirements(location.id);
    let reason = '';
    if (!available) {
      if (location.id === 'library') reason = 'Нужен Ключ дешифратора';
      else if (location.id === 'server') reason = 'Нужен Пропуск + USB-Руббердак';
      else if (location.id === 'park') reason = 'Закрой этап m20 перед финалом';
      else reason = 'Локация заблокирована';
    }
    return { available, reason };
  }

  function buildMap() {
    const s = screenDiv('mapScreen');

    const pins = ZD.locations.map((loc) => {
      const access = locationAccess(loc);
      return `
        <button class="loc-pin ${access.available ? 'is-open' : 'is-locked'}" data-loc="${loc.id}" style="left:${loc.x};top:${loc.y}" type="button" aria-label="${loc.label}">
          <div class="pin-circle ${loc.pulse && access.available ? 'pin-pulse' : ''}" style="color:${loc.color};border-color:${loc.color}"></div>
          <div class="pin-emoji">${loc.emoji}</div>
        </button>
      `;
    }).join('');

    s.innerHTML = `
      ${header('home', 'Карта', 'Выбери локацию операции')}
      <div class="map-canvas" id="mapCanvas">
        <div class="map-grid-lines"></div>
        <div class="map-glow"></div>
        ${pins}
        <div class="map-panel" id="mapPanel">
          <div class="map-panel-name" id="mapPanelName">—</div>
          <div class="map-panel-desc" id="mapPanelDesc">—</div>
          <button class="map-go-btn" id="mapGoBtn" type="button">Исследовать</button>
        </div>
      </div>
    `;

    bindBack(s);

    s.querySelectorAll('.loc-pin').forEach((pin) => {
      pin.addEventListener('click', () => openLocationPanel(pin.dataset.loc, s));
    });

    s.querySelector('#mapGoBtn').addEventListener('click', () => {
      const locId = s.querySelector('#mapGoBtn').dataset.loc;
      if (!locId) return;
      handleLocationAction(locId);
    });

    s.querySelector('#mapCanvas').addEventListener('click', (event) => {
      if (event.target.id === 'mapCanvas' || event.target.classList.contains('map-grid-lines')) {
        s.querySelector('#mapPanel').classList.remove('open');
      }
    });
  }

  function openLocationPanel(locId, screen) {
    const loc = ZD.locations.find((x) => x.id === locId);
    if (!loc) return;

    const panel = screen.querySelector('#mapPanel');
    const nameEl = screen.querySelector('#mapPanelName');
    const descEl = screen.querySelector('#mapPanelDesc');
    const btn = screen.querySelector('#mapGoBtn');

    const access = locationAccess(loc);
    const visited = ZD.state.visitedLocations.has(loc.id);

    nameEl.textContent = loc.emoji + ' ' + loc.label;
    descEl.textContent = loc.desc + (visited ? ' Локация уже исследована.' : '');
    btn.dataset.loc = loc.id;

    if (!access.available) {
      btn.textContent = access.reason;
      btn.disabled = true;
      btn.className = 'map-go-btn req';
    } else {
      btn.textContent = visited ? 'Повторно осмотреть' : 'Исследовать';
      btn.disabled = false;
      btn.className = 'map-go-btn';
    }

    panel.classList.add('open');
  }

  function handleLocationAction(locId) {
    const loc = ZD.locations.find((x) => x.id === locId);
    if (!loc) return;

    const access = locationAccess(loc);
    if (!access.available) {
      toast(access.reason, 'error');
      return;
    }

    const alreadyVisited = ZD.state.visitedLocations.has(locId);
    if (!alreadyVisited) {
      ZD.state.visitedLocations.add(locId);
      const reward = LOCATION_REWARDS[locId];
      if (reward) {
        if (!reward.missionId && reward.stars) addStars(reward.stars, 'за локацию');
        bumpTrust(reward.trust || 0);
        bumpReputation(reward.reputation || 0);
      }
      persistState();
      refreshStatusWidgets();
      if (locId === 'park') toast('Финальная миссия активирована.', 'success');
      else toast('Локация исследована: ' + loc.label, 'success');
    } else {
      toast('Локация уже была исследована', 'info');
    }

    updateProgress('map');
    renderScreen('map');
  }

  // ------------------------------------------------------------
  // Terminal
  // ------------------------------------------------------------
  function decryptCaesar(text, shift) {
    const alphabet = ZD.cipher.alphabet;
    return text.split('').map((char) => {
      const upper = char.toUpperCase();
      const index = alphabet.indexOf(upper);
      if (index === -1) return char;
      const decoded = alphabet[(index - shift + alphabet.length) % alphabet.length];
      return char === upper ? decoded : decoded.toLowerCase();
    }).join('');
  }

  function buildTerminal() {
    const s = screenDiv('terminalScreen');
    s.innerHTML = `
      <div class="term-topbar">
        <button class="back-btn" data-back="home" type="button"><span class="chevron">‹</span><span>Назад</span></button>
        <div class="term-dots"><div class="tdot tdot-r"></div><div class="tdot tdot-y"></div><div class="tdot tdot-g"></div></div>
        <div class="term-title-txt">TERMINAL · DECRYPT</div>
      </div>
      <div class="term-body scrollable">
        <div class="t-g">analyst@zero_day:~$ decrypt --caesar</div>
        <div class="t-d">Получен зашифрованный текст разведки.</div>
        <div class="t-d">Сдвиг неизвестен, диапазон: 0–25.</div>
        <div class="term-br"></div>
        <div class="cipher-block">
          <div class="cipher-enc">${ZD.cipher.encrypted}</div>
          <div class="slider-row">
            <span class="slider-lbl">ROT shift:</span>
            <input type="range" id="caesarSlider" min="0" max="25" value="2" step="1">
            <span class="slider-val" id="caesarVal">2</span>
          </div>
          <input class="cipher-out" id="cipherOut" readonly value="">
          <div class="cipher-hint">Найди читаемое сообщение для отчёта.</div>
          <div class="cipher-solved" id="cipherSolved">✓ Сообщение расшифровано. +8 ⭐</div>
        </div>
        <div class="term-br"></div>
        <div class="t-d">Попыток: <span class="t-y" id="attemptsCount">${ZD.state.termAttempts}</span></div>
      </div>
    `;

    bindBack(s);

    const slider = s.querySelector('#caesarSlider');
    const val = s.querySelector('#caesarVal');
    const out = s.querySelector('#cipherOut');
    const attempts = s.querySelector('#attemptsCount');
    const solved = s.querySelector('#cipherSolved');

    const redraw = () => {
      const shift = Number(slider.value);
      val.textContent = shift;
      out.value = decryptCaesar(ZD.cipher.encrypted, shift);
    };

    slider.addEventListener('input', () => {
      ZD.state.termAttempts += 1;
      attempts.textContent = ZD.state.termAttempts;
      redraw();

      const shift = Number(slider.value);
      if (shift === ZD.cipher.answerShift && !ZD.state.termSolved) {
        ZD.state.termSolved = true;
        solved.style.display = 'block';
        updateProgress('terminal');
      }
    });

    redraw();
    if (ZD.state.termSolved) {
      solved.style.display = 'block';
      slider.value = String(ZD.cipher.answerShift);
      redraw();
    }
  }

  // ------------------------------------------------------------
  // Shop
  // ------------------------------------------------------------
  function buildShop() {
    const s = screenDiv('shopScreen');

    const topupRows = TOPUP_OFFERS.map((offer) => `
      <button class="topup-btn" data-topup="${offer.id}" type="button">
        <span class="topup-stars">⭐ ${offer.stars} Stars</span>
        <span class="topup-price">${offer.priceLabel} · ${offer.tgLabel}</span>
      </button>
    `).join('');

    const shopRows = ZD.shopItems.map((cat) => {
      const rows = cat.items.map((item) => {
        const owned = item.owned || ZD.state.inventory.includes(item.id);
        const real = REAL_MONEY_ITEM_OFFERS[item.id];
        return `
          <div class="shop-row">
            <div class="shop-ico">${item.ico}</div>
            <div class="shop-info">
              <div class="shop-name">${item.name}</div>
              <div class="shop-desc">${item.desc}</div>
              <div class="shop-tags">${item.tags.map((tag) => `<span class="stag ${tag.cls}">${tag.label}</span>`).join('')}</div>
            </div>
            <div class="shop-actions">
              ${owned
                ? '<button class="buy-btn owned" type="button">✓ Куплено</button>'
                : `<button class="buy-btn" data-id="${item.id}" data-price="${item.price}" type="button">Купить за ⭐ ${item.price}</button>`
              }
              ${(!owned && real) ? `<button class="buy-btn buy-btn-real" data-real-id="${item.id}" data-real-name="${item.name}" type="button">Купить за 💎 ${real.label}</button>` : ''}
            </div>
          </div>
        `;
      }).join('');
      return `<div class="shop-cat">${cat.cat}</div>${rows}`;
    }).join('');

    const historyRows = ZD.state.purchaseHistory.slice(0, 8).map((entry) => `
      <div class="history-row">
        <div>
          <div class="history-title">${entry.title || 'Покупка'}</div>
          <div class="history-time">${entry.time}</div>
        </div>
        <div class="history-status ${entry.status === 'paid' ? 'ok' : 'bad'}">${entry.status}</div>
      </div>
    `).join('');

    s.innerHTML = `
      ${header('home', 'Магазин', paymentsAreDemo() ? 'DEMO_MODE: подтверждение без списания денег' : 'Telegram Invoice')}
      <div class="shop-balance-bar">
        <span>⭐</span><span class="stars-val">${ZD.state.stars}</span>
      </div>
      <div class="shop-body scrollable">
        <section class="topup-box">
          <div class="topup-title">Пополнить Stars</div>
          <div class="topup-sub">Сначала откроется платёжный лист. В демо-режиме деньги не списываются.</div>
          <div class="topup-grid">${topupRows}</div>
        </section>

        ${shopRows}

        <div class="shop-cat">История покупок</div>
        <div class="history-box">
          ${historyRows || '<div class="history-empty">История пока пустая</div>'}
        </div>
      </div>
    `;

    bindBack(s);

    s.querySelectorAll('.topup-btn[data-topup]').forEach((btn) => {
      btn.addEventListener('click', () => buyStarsPack(btn.dataset.topup));
    });

    s.querySelectorAll('.buy-btn[data-id]').forEach((btn) => {
      btn.addEventListener('click', () => handleStarsPurchase(btn.dataset.id, Number(btn.dataset.price)));
    });

    s.querySelectorAll('.buy-btn[data-real-id]').forEach((btn) => {
      btn.addEventListener('click', () => buyItemForMoney(btn.dataset.realId, btn.dataset.realName));
    });
  }

  function handleStarsPurchase(itemId, price) {
    const item = ZD.shopItems.flatMap((c) => c.items).find((x) => x.id === itemId);
    if (!item) {
      toast('Товар не найден', 'error');
      return;
    }
    if (ZD.state.inventory.includes(itemId) || item.owned) {
      toast('Товар уже куплен', 'info');
      return;
    }
    if (ZD.state.stars < price) {
      const missing = price - ZD.state.stars;
      toast(`Недостаточно Stars. Не хватает: ${missing}`, 'error');
      recordPurchase({ kind: 'item', title: `Неуспешно: ${item.name}`, amount: `⭐ ${price}`, status: 'denied' });
      return;
    }

    ZD.state.stars -= price;
    ZD.state.inventory.push(itemId);
    if (itemId === 'energy') bumpTrust(3);
    if (itemId === 'antivirus') bumpReputation(2);

    recordPurchase({ kind: 'item', title: `Куплено: ${item.name}`, amount: `⭐ ${price}`, status: 'paid' });
    persistState();
    refreshStatusWidgets();
    updateProgress('shop');

    if (itemId === 'decryptor') toast('Ключ дешифратора куплен. Библиотека открыта.', 'success');
    else if (itemId === 'rubber_duck') toast('USB-Руббердак куплен. Доступ к серверной обновлён.', 'success');
    else toast('Покупка успешна', 'success');

    renderScreen('shop');
  }

  // ------------------------------------------------------------
  // Settings + themes + admin
  // ------------------------------------------------------------
  function buildSettings() {
    const s = screenDiv('settingsScreen');

    const themeRows = ZD.themes.map((theme) => {
      const owned = ZD.state.purchasedThemes.includes(theme.id);
      const active = ZD.state.activeTheme === theme.id;

      return `
        <div class="theme-row">
          <div class="theme-info">
            <div class="theme-name">${theme.name}</div>
            <div class="theme-desc">${theme.desc}</div>
          </div>
          <div class="theme-actions">
            ${active ? '<button class="theme-btn active" type="button">Активна</button>' : ''}
            ${!active && owned ? `<button class="theme-btn" data-apply-theme="${theme.id}" type="button">Применить</button>` : ''}
            ${!owned ? `<button class="theme-btn buy" data-buy-theme="${theme.id}" data-price="${theme.price}" type="button">Купить за ⭐ ${theme.price}</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    const campaignPreview = ZD.missionCalendar.slice(0, 24).map((mission) => {
      const status = questStatus(mission.id);
      const statusText = status === 'done' ? 'ГОТОВО' : (status === 'active' ? 'АКТИВНА' : 'LOCKED');
      return `
        <div class="settings-mission ${status}">
          <span>${mission.id.toUpperCase()} · ${mission.title}</span>
          <strong>${statusText}</strong>
        </div>
      `;
    }).join('');

    s.innerHTML = `
      ${header('home', 'Настройки', ZD.state.adminMode ? 'Админ-режим включён' : 'Пользовательский режим')}
      <div class="scrollable settings-body">
        <div class="settings-card">
          <div class="settings-title">Темы интерфейса</div>
          ${themeRows}
        </div>

        <div class="settings-card">
          <div class="settings-title">Управление прогрессом</div>
          <button class="settings-btn" id="toggleAdminBtn" type="button">${ZD.state.adminMode ? 'Выключить админ-режим' : 'Включить админ-режим'}</button>
          <button class="settings-btn" id="unlockAllBtn" type="button">Открыть все миссии и квесты</button>
          <button class="settings-btn danger" id="resetProgressBtn" type="button">Сбросить прогресс</button>
        </div>

        <div class="settings-card">
          <div class="settings-title">Кампания на 6 месяцев</div>
          <div class="settings-mission-list">${campaignPreview}</div>
        </div>
      </div>
    `;

    bindBack(s);

    s.querySelectorAll('[data-apply-theme]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.applyTheme;
        applyTheme(id);
        toast('Тема применена', 'success');
        renderScreen('settings');
      });
    });

    s.querySelectorAll('[data-buy-theme]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.buyTheme;
        const price = Number(btn.dataset.price || 0);
        buyTheme(id, price);
      });
    });

    s.querySelector('#toggleAdminBtn').addEventListener('click', () => {
      ZD.state.adminMode = !ZD.state.adminMode;
      persistState();
      updateProgress('settings');
      renderScreen('settings');
    });

    s.querySelector('#unlockAllBtn').addEventListener('click', () => {
      unlockAllMissionsAndQuests();
      renderScreen('settings');
    });

    s.querySelector('#resetProgressBtn').addEventListener('click', () => {
      resetState();
    });
  }

  function buyTheme(themeId, price) {
    const theme = getThemeById(themeId);
    if (!theme) return;
    if (ZD.state.purchasedThemes.includes(themeId)) {
      applyTheme(themeId);
      renderScreen('settings');
      return;
    }
    if (ZD.state.stars < price) {
      toast('Недостаточно Stars для покупки темы', 'error');
      return;
    }

    ZD.state.stars -= price;
    ZD.state.purchasedThemes.push(themeId);
    ZD.state.purchasedThemes = uniqueArray(ZD.state.purchasedThemes);
    applyTheme(themeId);
    recordPurchase({ kind: 'theme', title: `Тема: ${theme.name}`, amount: `⭐ ${price}`, status: 'paid' });
    persistState();
    refreshStatusWidgets();
    toast(`Тема ${theme.name} куплена и применена`, 'success');
    renderScreen('settings');
  }

  function unlockAllMissionsAndQuests() {
    ZD.missionCalendar.forEach((mission) => {
      completeQuest(mission.id, { source: 'admin', claimReward: false, silent: true });
    });
    ZD.locations.forEach((loc) => ZD.state.visitedLocations.add(loc.id));
    ZD.gallery.forEach((item) => {
      ZD.state.analyzed.add(item.id);
    });
    ZD.state.foundFlags = new Set(['1', '2', '3', '4']);
    ZD.state.termSolved = true;
    ZD.state.termAttempts = Math.max(ZD.state.termAttempts, 8);
    ZD.state.chatChoices.dasha = ZD.state.chatChoices.dasha || 'A';
    ['decryptor', 'rubber_duck', 'wifi_antenna', 'darknet_acc', 'energy', 'antivirus', 'hint'].forEach((item) => {
      if (!ZD.state.inventory.includes(item)) ZD.state.inventory.push(item);
    });
    ZD.state.finaleShown = true;
    ZD.state.finaleInboxRead = true;
    ZD.state.campaignFinished = true;
    ZD.state.adminMode = true;
    persistState();
    updateProgress('settings');
    toast('Все миссии и квесты открыты.', 'success');
  }

  // ------------------------------------------------------------
  // Gestures
  // ------------------------------------------------------------
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

    frame.addEventListener('touchend', () => { tracking = false; }, { passive: true });
    frame.addEventListener('touchcancel', () => { tracking = false; }, { passive: true });
  }

  // ------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------
  if (iosHomeBtn) {
    iosHomeBtn.addEventListener('click', () => {
      navigateTo('home', { historyMode: 'reset', direction: 'back' });
    });
  }

  applyTheme(ZD.state.activeTheme);
  initTelegram();
  updateClock();
  updateBatteryVisual();
  setInterval(updateClock, 15000);
  setInterval(updateBatteryVisual, 60000);

  buildNav();
  updateProgress('silent');
  refreshStatusWidgets();
  bindEdgeSwipeBack();
  navigateTo('home', { historyMode: 'reset', direction: 'forward' });
})();
