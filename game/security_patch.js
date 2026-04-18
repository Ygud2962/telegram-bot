(function () {
  "use strict";

  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const MAX_NAME_LEN = 64;
  const RESET_TOKEN_MAX = 2147483647;
  let serverResetToken = 0;
  let accessOverlayShown = false;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeText(value, maxLen) {
    const raw = String(value ?? "");
    const withoutCtl = raw.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
    return escapeHtml(withoutCtl).slice(0, maxLen);
  }

  function sanitizeName(value) {
    const normalized = sanitizeText(value, MAX_NAME_LEN);
    if (!normalized) return "Player";
    return normalized;
  }

  function toSafeResetToken(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    const i = Math.trunc(n);
    if (i <= 0) return 0;
    if (i > RESET_TOKEN_MAX) return RESET_TOKEN_MAX;
    return i;
  }

  function setResetToken(value) {
    const safe = toSafeResetToken(value);
    if (safe > 0) {
      serverResetToken = safe;
      window.__gameResetToken = safe;
    }
  }

  function getInitDataRaw() {
    if (!tg || typeof tg.initData !== "string") return "";
    return tg.initData;
  }

  function safeJsonParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function decodeStartParam(raw) {
    if (!raw || typeof raw !== "string") return null;
    const decoded = safeJsonParse(raw);
    if (decoded && typeof decoded === "object") return decoded;
    try {
      const unescaped = decodeURIComponent(raw);
      const parsed = safeJsonParse(unescaped);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (_) {}
    return null;
  }

  function encodeStartParam(payload) {
    try {
      return encodeURIComponent(JSON.stringify(payload));
    } catch (_) {
      return "";
    }
  }

  function sanitizePayload(payload) {
    if (!payload || typeof payload !== "object") return payload;
    const clean = { ...payload };

    if (clean.me && typeof clean.me === "object") {
      clean.me = { ...clean.me };
      if (typeof clean.me.name === "string") {
        clean.me.name = sanitizeName(clean.me.name);
      }
      if (clean.me.reset_token !== undefined) {
        clean.me.reset_token = toSafeResetToken(clean.me.reset_token);
      }
      if (clean.me.reset_token > 0) {
        setResetToken(clean.me.reset_token);
      }
    }

    if (Array.isArray(clean.lb)) {
      clean.lb = clean.lb.map((row) => {
        if (!row || typeof row !== "object") return row;
        const next = { ...row };
        next.name = sanitizeName(next.name);
        return next;
      });
    }

    return clean;
  }

  function sanitizeTgUserObject() {
    if (!tg || !tg.initDataUnsafe || typeof tg.initDataUnsafe !== "object") return;
    const user = tg.initDataUnsafe.user;
    if (!user || typeof user !== "object") return;
    if (typeof user.first_name === "string") user.first_name = sanitizeName(user.first_name);
    if (typeof user.last_name === "string") user.last_name = sanitizeText(user.last_name, MAX_NAME_LEN);
    if (typeof user.username === "string") user.username = sanitizeText(user.username, MAX_NAME_LEN);
  }

  function sanitizeStartParams() {
    if (tg && tg.initDataUnsafe && typeof tg.initDataUnsafe.start_param === "string") {
      const parsed = decodeStartParam(tg.initDataUnsafe.start_param);
      if (parsed) {
        const clean = sanitizePayload(parsed);
        const encoded = encodeStartParam(clean);
        if (encoded) tg.initDataUnsafe.start_param = encoded;
      }
    }

    try {
      const url = new URL(window.location.href);
      const rawParam = url.searchParams.get("tgWebAppStartParam");
      if (!rawParam) return;
      const parsed = decodeStartParam(rawParam);
      if (!parsed) return;
      const clean = sanitizePayload(parsed);
      const encoded = encodeStartParam(clean);
      if (!encoded) return;
      if (encoded !== rawParam) {
        url.searchParams.set("tgWebAppStartParam", encoded);
        window.history.replaceState(null, "", url.toString());
      }
      if (tg && tg.initDataUnsafe && !tg.initDataUnsafe.start_param) {
        tg.initDataUnsafe.start_param = encoded;
      }
    } catch (_) {}
  }

  function sanitizeLocalLeaderboardCache() {
    try {
      const updates = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("cipher_v4_")) continue;
        const parsed = safeJsonParse(localStorage.getItem(key));
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.leaderboard)) continue;
        let changed = false;
        parsed.leaderboard = parsed.leaderboard.map((row) => {
          if (!row || typeof row !== "object") return row;
          const next = { ...row };
          const cleanName = sanitizeName(next.name);
          if (next.name !== cleanName) {
            changed = true;
            next.name = cleanName;
          }
          return next;
        });
        if (changed) updates.push([key, JSON.stringify(parsed)]);
      }
      updates.forEach(([key, value]) => localStorage.setItem(key, value));
    } catch (_) {}
  }

  function showAccessOverlay(title, message) {
    if (accessOverlayShown) return;
    accessOverlayShown = true;
    const root = document.createElement("div");
    root.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:99999",
      "display:flex",
      "flex-direction:column",
      "align-items:center",
      "justify-content:center",
      "text-align:center",
      "background:#0d0b08",
      "color:#fff",
      "padding:28px 24px",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    ].join(";");
    root.innerHTML =
      '<div style="font-size:64px;margin-bottom:16px">🚫</div>' +
      `<div style="font-size:22px;font-weight:700;color:#ffe033;margin-bottom:10px">${sanitizeText(title, 120)}</div>` +
      `<div style="font-size:15px;color:rgba(255,255,255,.75);max-width:340px;line-height:1.5">${sanitizeText(message, 300)}</div>`;
    document.body.appendChild(root);
  }

  function normalizeUrl(rawUrl) {
    try {
      return new URL(rawUrl, window.location.href);
    } catch (_) {
      return null;
    }
  }

  function patchGetUrl(rawUrl) {
    const url = normalizeUrl(rawUrl);
    if (!url) return rawUrl;
    const pathname = url.pathname || "";
    if (!pathname.endsWith("/game_state") && !pathname.endsWith("/game_leaderboard")) {
      return rawUrl;
    }
    if (!url.searchParams.get("init_data")) {
      const initDataRaw = getInitDataRaw();
      if (initDataRaw) url.searchParams.set("init_data", initDataRaw);
    }
    return url.toString();
  }

  function parseBodyToObject(body) {
    if (!body) return null;
    if (typeof body === "string") {
      return safeJsonParse(body);
    }
    if (typeof body === "object" && !(body instanceof Blob) && !(body instanceof FormData)) {
      return body;
    }
    return null;
  }

  function patchPostBody(rawUrl, init) {
    const url = normalizeUrl(rawUrl);
    if (!url) return init;
    const method = String(init.method || "GET").toUpperCase();
    if (method !== "POST") return init;
    const pathname = url.pathname || "";
    const isSync = pathname.endsWith("/game_sync");
    const isReset = pathname.endsWith("/game_reset");
    if (!isSync && !isReset) return init;

    const bodyObj = parseBodyToObject(init.body);
    if (!bodyObj) return init;

    const nextBody = { ...bodyObj };
    const initDataRaw = getInitDataRaw();
    if (initDataRaw && !nextBody.init_data) {
      nextBody.init_data = initDataRaw;
    }
    if (isSync) {
      const bodyToken = toSafeResetToken(nextBody.reset_token);
      if (bodyToken > 0) {
        setResetToken(bodyToken);
      } else if (serverResetToken > 0) {
        nextBody.reset_token = serverResetToken;
      }
    }

    const headers = new Headers(init.headers || {});
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return {
      ...init,
      headers,
      body: JSON.stringify(nextBody),
    };
  }

  function patchSendBeacon() {
    if (!navigator.sendBeacon) return;
    const nativeSendBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function patchedSendBeacon(url, data) {
      try {
        const parsedUrl = normalizeUrl(url);
        if (!parsedUrl || !parsedUrl.pathname.endsWith("/game_sync")) {
          return nativeSendBeacon(url, data);
        }
        const raw = typeof data === "string" ? data : "";
        const obj = safeJsonParse(raw);
        if (!obj || typeof obj !== "object") {
          return nativeSendBeacon(url, data);
        }
        const patched = { ...obj };
        const initDataRaw = getInitDataRaw();
        if (initDataRaw && !patched.init_data) patched.init_data = initDataRaw;
        if (toSafeResetToken(patched.reset_token) <= 0 && serverResetToken > 0) {
          patched.reset_token = serverResetToken;
        }
        const blob = new Blob([JSON.stringify(patched)], { type: "application/json" });
        return nativeSendBeacon(url, blob);
      } catch (_) {
        return nativeSendBeacon(url, data);
      }
    };
  }

  async function inspectGameResponse(response) {
    try {
      const contentType = String(response.headers.get("content-type") || "");
      if (!contentType.includes("application/json")) return;
      const payload = await response.clone().json();
      if (!payload || typeof payload !== "object") return;

      if (payload.db_reset_token !== undefined) setResetToken(payload.db_reset_token);
      if (payload.reset_token !== undefined) setResetToken(payload.reset_token);

      if (payload.allowed === false) {
        showAccessOverlay(
          "Access is restricted",
          "This account cannot access the game right now. Reopen the game from the bot menu after access is granted."
        );
        return;
      }

      if (!response.ok && (payload.error === "unauthorized" || payload.reason)) {
        showAccessOverlay(
          "Authorization required",
          "Please reopen the game from the Telegram bot button."
        );
      }
    } catch (_) {}
  }

  function patchFetch() {
    if (!window.fetch) return;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async function patchedFetch(input, init) {
      const isStringInput = typeof input === "string";
      if (!isStringInput) {
        const response = await nativeFetch(input, init);
        inspectGameResponse(response);
        return response;
      }

      const patchedUrl = patchGetUrl(input);
      const nextInit = patchPostBody(patchedUrl, init ? { ...init } : {});
      const response = await nativeFetch(patchedUrl, nextInit);
      inspectGameResponse(response);
      return response;
    };
  }

  sanitizeTgUserObject();
  sanitizeStartParams();
  sanitizeLocalLeaderboardCache();
  patchSendBeacon();
  patchFetch();
})();
