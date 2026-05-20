/* ===== RESET ===== */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;background:#0a0a0f;font-family:'Courier New',monospace}

/* ===== SCENE / PHONE FRAME ===== */
.scene{
  display:flex;align-items:center;justify-content:center;
  min-height:100vh;width:100%;
  background:radial-gradient(ellipse at 50% 40%, #12122a 0%, #060608 70%);
  padding:24px 12px;
}

.phone{
  position:relative;
  width:360px;
  background:linear-gradient(160deg,#1c1c20 0%,#111114 40%,#0e0e11 100%);
  border-radius:50px;
  box-shadow:
    0 0 0 1px #2a2a35,
    0 0 0 2px #111116,
    0 0 0 3px #333340,
    inset 0 0 0 1px rgba(255,255,255,0.05),
    0 40px 120px rgba(0,0,0,0.9),
    0 0 60px rgba(0,229,160,0.04);
  flex-shrink:0;
}

/* PHYSICAL BUTTONS */
.btn-power{
  position:absolute;right:-3px;top:130px;
  width:3px;height:64px;
  background:linear-gradient(180deg,#2a2a30,#1a1a20,#2a2a30);
  border-radius:0 2px 2px 0;
  box-shadow:1px 0 3px rgba(0,0,0,0.5);
}
.btn-vol-up{
  position:absolute;left:-3px;top:110px;
  width:3px;height:44px;
  background:linear-gradient(180deg,#2a2a30,#1a1a20,#2a2a30);
  border-radius:2px 0 0 2px;
}
.btn-vol-down{
  position:absolute;left:-3px;top:164px;
  width:3px;height:44px;
  background:linear-gradient(180deg,#2a2a30,#1a1a20,#2a2a30);
  border-radius:2px 0 0 2px;
}

/* NOTCH */
.notch{
  position:absolute;top:14px;left:50%;transform:translateX(-50%);
  width:126px;height:34px;
  background:#0a0a0d;
  border-radius:0 0 20px 20px;
  z-index:10;
  display:flex;align-items:center;justify-content:center;gap:8px;
}
.notch-speaker{
  width:52px;height:5px;
  background:#1a1a1e;
  border-radius:3px;
  box-shadow:inset 0 1px 2px rgba(0,0,0,0.8);
}
.notch-camera{
  width:11px;height:11px;border-radius:50%;
  background:radial-gradient(circle at 35% 35%,#2a2a3a,#0d0d12);
  border:1px solid #1e1e26;
  box-shadow:inset 0 0 4px rgba(0,0,0,0.8);
}

/* SCREEN WRAP */
.screen-wrap{
  margin:0 10px;
  padding-top:48px;
  padding-bottom:0;
  background:#0a0a0f;
  border-radius:38px;
  overflow:hidden;
  position:relative;
  display:flex;flex-direction:column;
  height:780px;
}
.screen-glass{
  position:absolute;inset:0;
  border-radius:38px;
  background:linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 50%,rgba(255,255,255,0.01) 100%);
  pointer-events:none;z-index:100;
}

/* STATUS BAR */
.status-bar{
  position:absolute;top:0;left:0;right:0;
  height:48px;
  display:flex;align-items:flex-end;justify-content:space-between;
  padding:0 22px 8px;
  z-index:50;
  background:transparent;
}
.sb-left .sb-time{
  font-size:14px;font-weight:700;letter-spacing:0.3px;
  color:#e8e8f0;
}
.sb-right{
  display:flex;align-items:center;gap:6px;
}
.sb-signal{
  display:flex;align-items:flex-end;gap:2px;height:12px;
}
.sb-signal span{
  width:3px;background:#e8e8f0;border-radius:1px;
}
.sb-signal span:nth-child(1){height:4px}
.sb-signal span:nth-child(2){height:6px}
.sb-signal span:nth-child(3){height:9px}
.sb-signal span:nth-child(4){height:12px}
.sb-wifi{display:flex;align-items:center;color:#e8e8f0}
.sb-battery{
  display:flex;align-items:center;gap:1px;
  border:1.5px solid rgba(255,255,255,0.5);
  border-radius:3px;
  width:22px;height:11px;
  position:relative;padding:2px;
}
.sb-battery::after{
  content:'';position:absolute;right:-4px;top:50%;transform:translateY(-50%);
  width:2px;height:5px;background:rgba(255,255,255,0.5);border-radius:0 1px 1px 0;
}
.sb-batt-fill{
  height:100%;width:72%;
  background:#4cde80;border-radius:1px;
}

/* APP FRAME */
.app-frame{
  flex:1;overflow:hidden;position:relative;
}
.screen{
  position:absolute;inset:0;
  display:none;flex-direction:column;
  background:#0a0a0f;
  overflow:hidden;
  animation:screenIn 0.22s ease-out;
}
.screen.active{display:flex}
@keyframes screenIn{from{opacity:0;transform:scale(0.98)}to{opacity:1;transform:scale(1)}}

/* BOTTOM NAV */
.bottom-nav{
  display:flex;
  background:rgba(14,14,18,0.96);
  border-top:1px solid rgba(255,255,255,0.07);
  backdrop-filter:blur(20px);
  padding:8px 0 4px;
  flex-shrink:0;
}
.nav-item{
  flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
  cursor:pointer;padding:4px 0;
  transition:opacity 0.15s;
  position:relative;
}
.nav-item:active{opacity:0.6}
.nav-ico{font-size:22px;line-height:1;transition:transform 0.15s}
.nav-lbl{font-size:9px;color:#555570;letter-spacing:0.5px;font-family:'Courier New',monospace}
.nav-item.active .nav-ico{transform:scale(1.12)}
.nav-item.active .nav-lbl{color:#00e5a0}
.nav-dot{
  position:absolute;top:3px;right:20%;
  width:7px;height:7px;border-radius:50%;
  background:#ff4a6a;
  border:1.5px solid #0a0a0f;
}

/* HOME INDICATOR */
.home-indicator{
  height:26px;display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
}
.home-indicator::before{
  content:'';display:block;
  width:120px;height:4px;
  background:rgba(255,255,255,0.25);
  border-radius:2px;
}

/* PHONE CHIN */
.phone-chin{
  height:18px;display:flex;align-items:center;justify-content:center;
}
.chin-port{
  width:44px;height:6px;border-radius:3px;
  background:#1a1a20;
  box-shadow:inset 0 1px 3px rgba(0,0,0,0.8);
}

/* ===== DESIGN TOKENS ===== */
:root{
  --bg:#0a0a0f;
  --surface:#111118;
  --card:#16161f;
  --border:rgba(255,255,255,0.08);
  --border2:rgba(255,255,255,0.14);
  --accent:#00e5a0;
  --accent2:#7b5fff;
  --danger:#ff4a6a;
  --warn:#f5a623;
  --cyan:#00cfff;
  --text:#e8e8f0;
  --muted:#6b6b80;
  --r:12px;
}

/* ===== SHARED COMPONENTS ===== */
.screen-header{
  display:flex;align-items:center;gap:10px;
  padding:12px 16px 10px;
  background:var(--surface);
  border-bottom:1px solid var(--border);
  flex-shrink:0;
  z-index:5;
}
.back-btn{
  width:30px;height:30px;border-radius:50%;
  background:rgba(255,255,255,0.06);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:16px;color:var(--accent);
  flex-shrink:0;transition:background 0.15s;
}
.back-btn:active{background:rgba(255,255,255,0.12)}
.hdr-title{font-size:14px;font-weight:700;color:var(--text)}
.hdr-sub{font-size:10px;color:var(--muted);margin-top:1px}
.scrollable{overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch}
.scrollable::-webkit-scrollbar{display:none}

/* ===== HOME SCREEN ===== */
#homeScreen{background:var(--bg)}
.home-hero{
  padding:20px 16px 16px;
  background:linear-gradient(160deg,#0d0d1a 0%,#0a1622 60%,#0d0d1a 100%);
  border-bottom:1px solid var(--border);
  position:relative;overflow:hidden;flex-shrink:0;
}
.home-hero::before{
  content:'';position:absolute;top:-60px;right:-60px;
  width:200px;height:200px;border-radius:50%;
  background:radial-gradient(circle,rgba(0,229,160,0.07) 0%,transparent 70%);
  pointer-events:none;
}
.home-hero::after{
  content:'';position:absolute;bottom:-40px;left:-40px;
  width:160px;height:160px;border-radius:50%;
  background:radial-gradient(circle,rgba(123,95,255,0.06) 0%,transparent 70%);
  pointer-events:none;
}
.hero-act{
  font-size:10px;letter-spacing:2.5px;color:var(--accent);
  text-transform:uppercase;margin-bottom:6px;
  display:flex;align-items:center;gap:6px;
}
.hero-act::before{content:'';display:block;width:20px;height:1px;background:var(--accent)}
.hero-title{font-size:28px;font-weight:900;letter-spacing:-1px;color:var(--text);line-height:1.1}
.hero-title em{color:var(--accent);font-style:normal}
.hero-subtitle{font-size:11px;color:var(--muted);margin:4px 0 14px;letter-spacing:1px}
.ep-card{
  background:rgba(255,255,255,0.04);
  border:1px solid rgba(0,229,160,0.25);
  border-left:3px solid var(--accent);
  border-radius:10px;padding:10px 12px;
  display:flex;align-items:center;gap:10px;
  cursor:pointer;transition:all 0.15s;
}
.ep-card:active{transform:scale(0.98);background:rgba(0,229,160,0.08)}
.ep-num{font-size:9px;letter-spacing:1.5px;color:var(--accent);margin-bottom:3px}
.ep-name{font-size:13px;font-weight:700;color:var(--text)}
.ep-meta{font-size:9px;color:var(--muted);margin-top:2px}
.ep-play{
  margin-left:auto;width:32px;height:32px;border-radius:50%;
  background:var(--accent);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  color:#000;font-size:12px;
}
.notif-strip{
  margin:10px 16px 0;
  background:rgba(0,229,160,0.07);
  border:1px solid rgba(0,229,160,0.2);
  border-radius:10px;padding:9px 12px;
  display:flex;align-items:center;gap:8px;
  font-size:11px;color:var(--accent);flex-shrink:0;
}
.home-apps{padding:14px 16px 0;flex-shrink:0}
.section-lbl{font-size:9px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:10px}
.apps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
.app-tile{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:18px;padding:14px 8px 10px;
  display:flex;flex-direction:column;align-items:center;gap:5px;
  cursor:pointer;transition:all 0.15s;
  position:relative;
}
.app-tile:active{transform:scale(0.93);background:rgba(255,255,255,0.05)}
.app-tile.has-badge::after{
  content:'';position:absolute;top:8px;right:10px;
  width:8px;height:8px;border-radius:50%;
  background:var(--danger);border:1.5px solid var(--bg);
}
.app-tile-ico{font-size:26px;line-height:1}
.app-tile-lbl{font-size:9px;color:var(--muted);letter-spacing:0.5px;text-align:center}
.stats-row{display:flex;gap:8px;padding:8px 16px 14px;flex-shrink:0}
.stat-card{
  flex:1;background:var(--card);border:1px solid var(--border);
  border-radius:10px;padding:10px 8px;text-align:center;
}
.stat-val{font-size:20px;font-weight:700;color:var(--accent)}
.stat-lbl{font-size:8px;color:var(--muted);letter-spacing:1px;margin-top:2px}

/* ===== MESSENGER ===== */
#messengerScreen{background:var(--bg)}
.chat-list-item{
  display:flex;align-items:center;gap:12px;
  padding:12px 16px;border-bottom:1px solid var(--border);
  cursor:pointer;transition:background 0.15s;
}
.chat-list-item:active{background:rgba(255,255,255,0.04)}
.chat-avatar{
  width:46px;height:46px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:15px;font-weight:700;color:#fff;flex-shrink:0;
  position:relative;
}
.avatar-online::after{
  content:'';position:absolute;bottom:1px;right:1px;
  width:11px;height:11px;border-radius:50%;
  background:var(--accent);border:2px solid var(--bg);
}
.chat-info{flex:1;min-width:0}
.chat-name{font-size:13px;font-weight:700;color:var(--text)}
.chat-preview{font-size:11px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chat-meta{text-align:right;flex-shrink:0}
.chat-time{font-size:9px;color:var(--muted);margin-bottom:4px}
.chat-unread{
  background:var(--accent);color:#000;
  font-size:9px;font-weight:700;
  border-radius:10px;padding:2px 6px;
  display:inline-block;
}

/* CHAT DETAIL */
#chatScreen{background:var(--bg)}
.chat-bg{
  flex:1;overflow-y:auto;padding:12px 14px;
  display:flex;flex-direction:column;gap:8px;
  background:linear-gradient(180deg,rgba(0,229,160,0.02) 0%,var(--bg) 100%);
}
.chat-bg::-webkit-scrollbar{display:none}
.bubble{
  max-width:80%;padding:9px 13px;
  font-size:12px;line-height:1.55;
  word-break:break-word;
}
.bubble-in{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:14px 14px 14px 3px;
  align-self:flex-start;color:var(--text);
}
.bubble-out{
  background:var(--accent2);
  border-radius:14px 14px 3px 14px;
  align-self:flex-end;color:#fff;
}
.bubble-system{
  align-self:center;font-size:9px;color:var(--muted);
  background:rgba(255,255,255,0.04);
  border-radius:20px;padding:4px 12px;
  letter-spacing:0.5px;
}
.bub-time{font-size:9px;opacity:0.5;margin-top:3px;text-align:right}
.typing-bub{
  display:flex;gap:4px;align-items:center;padding:9px 13px;
  background:var(--card);border:1px solid var(--border);
  border-radius:14px 14px 14px 3px;align-self:flex-start;
  display:none;
}
.td{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:td 1.2s infinite}
.td:nth-child(2){animation-delay:.2s}.td:nth-child(3){animation-delay:.4s}
@keyframes td{0%,60%,100%{opacity:.3;transform:scale(1)}30%{opacity:1;transform:scale(1.4)}}
.choices-wrap{
  padding:10px 14px 12px;
  border-top:1px solid var(--border);
  background:var(--surface);flex-shrink:0;
}
.choices-lbl{font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-bottom:7px;text-transform:uppercase}
.choice{
  background:var(--card);border:1px solid var(--border);
  border-radius:10px;padding:10px 13px;
  color:var(--text);font-family:'Courier New',monospace;font-size:11px;
  cursor:pointer;width:100%;text-align:left;
  margin-bottom:6px;transition:all 0.15s;display:flex;gap:8px;align-items:flex-start;
}
.choice:last-child{margin-bottom:0}
.choice:active{transform:scale(0.98)}
.choice:hover{border-color:var(--accent);color:var(--accent)}
.choice.bad:hover{border-color:var(--danger);color:var(--danger)}
.choice.selected{border-color:var(--accent);background:rgba(0,229,160,0.08);color:var(--accent)}
.choice-key{font-size:10px;opacity:0.5;flex-shrink:0;margin-top:1px}

/* ===== GALLERY ===== */
#galleryScreen{background:var(--bg)}
.gal-grid{
  display:grid;grid-template-columns:repeat(3,1fr);gap:2px;
  padding:2px;flex:1;overflow-y:auto;
}
.gal-grid::-webkit-scrollbar{display:none}
.gal-thumb{
  aspect-ratio:1;background:var(--card);
  display:flex;align-items:center;justify-content:center;
  font-size:34px;cursor:pointer;position:relative;
  transition:opacity 0.15s;overflow:hidden;
}
.gal-thumb:active{opacity:0.7}
.gal-thumb.flagged::after{
  content:'!';position:absolute;top:5px;right:5px;
  width:16px;height:16px;border-radius:50%;
  background:var(--danger);color:#fff;
  font-size:10px;font-weight:700;
  display:flex;align-items:center;justify-content:center;
}
.gal-thumb.analyzed::after{
  content:'✓';position:absolute;top:5px;right:5px;
  width:16px;height:16px;border-radius:50%;
  background:var(--accent);color:#000;
  font-size:9px;font-weight:700;
  display:flex;align-items:center;justify-content:center;
}
/* Detail overlay */
#galDetailOverlay{
  position:absolute;inset:0;z-index:20;
  background:var(--bg);display:none;flex-direction:column;
}
#galDetailOverlay.open{display:flex}
.gal-detail-img{
  flex:1;background:#060608;
  display:flex;align-items:center;justify-content:center;
  font-size:80px;position:relative;overflow:hidden;
}
.scan-anim{
  position:absolute;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,var(--accent),transparent);
  animation:scanY 2s linear infinite;display:none;
}
@keyframes scanY{0%{top:0%}100%{top:100%}}
.gal-scan-overlay{
  position:absolute;inset:0;pointer-events:none;display:none;
  background:repeating-linear-gradient(0deg,rgba(0,229,160,0.02) 0px,transparent 2px,transparent 4px);
}
.exif-panel{
  background:var(--surface);border-top:1px solid var(--border);
  padding:12px 16px;flex-shrink:0;max-height:180px;overflow-y:auto;
}
.exif-panel::-webkit-scrollbar{display:none}
.exif-row{
  display:flex;justify-content:space-between;align-items:baseline;
  padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);
  font-size:11px;
}
.exif-row:last-child{border-bottom:none}
.exif-k{color:var(--muted)}
.exif-v{color:var(--cyan);text-align:right;max-width:60%;word-break:break-all}
.exif-v.danger{color:var(--danger)}
.exif-v.ok{color:var(--accent)}
.analyze-btn{
  margin:10px 16px;padding:11px;
  background:transparent;border:1px solid var(--accent);
  border-radius:10px;color:var(--accent);
  font-family:'Courier New',monospace;font-size:12px;font-weight:700;
  cursor:pointer;letter-spacing:1px;width:calc(100% - 32px);
  transition:all 0.15s;flex-shrink:0;
}
.analyze-btn:active{background:rgba(0,229,160,0.12)}

/* ===== BROWSER ===== */
#browserScreen{background:var(--bg)}
.url-bar-wrap{
  display:flex;align-items:center;gap:8px;
  padding:8px 14px 10px;
  background:var(--surface);border-bottom:1px solid var(--border);
  flex-shrink:0;
}
.url-bar{
  flex:1;background:var(--card);border:1px solid var(--border);
  border-radius:8px;padding:7px 10px;
  display:flex;align-items:center;gap:6px;
  font-size:11px;
}
.url-lock{font-size:11px}
.url-lock.http{color:var(--warn)}
.url-lock.https{color:var(--accent)}
.url-txt{color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.site-content{flex:1;overflow-y:auto}
.site-content::-webkit-scrollbar{display:none}
.site-topbar{
  background:linear-gradient(180deg,#0e1928,#0c1520);
  padding:14px 16px 10px;
  border-bottom:2px solid #1e4a8a;
}
.site-logo{font-size:17px;font-weight:700;color:#4a9eff;margin-bottom:2px}
.site-tagline{font-size:10px;color:#5a7a99}
.site-nav-row{display:flex;gap:14px;margin-top:8px}
.site-nav-item{font-size:10px;color:#4a9eff;text-decoration:underline;cursor:pointer}
.site-body{padding:14px 16px}
.phish-warning{
  background:rgba(245,166,35,0.08);border:1px solid rgba(245,166,35,0.3);
  border-radius:10px;padding:11px 13px;margin-bottom:12px;
}
.phish-w-title{color:var(--warn);font-size:12px;font-weight:700;margin-bottom:4px}
.phish-w-txt{color:#c8a860;font-size:11px;line-height:1.5}
.site-headline{font-size:15px;font-weight:700;color:var(--text);margin-bottom:5px;line-height:1.3}
.site-meta{font-size:10px;color:var(--muted);margin-bottom:10px}
.site-para{font-size:11px;color:#9898a8;line-height:1.6;margin-bottom:12px}
.flags-box{
  background:rgba(255,74,106,0.06);border:1px solid rgba(255,74,106,0.2);
  border-radius:10px;padding:13px;
}
.flags-title{color:var(--danger);font-size:11px;font-weight:700;letter-spacing:1px;margin-bottom:9px}
.flag-row{
  display:flex;align-items:flex-start;gap:9px;
  padding:5px 0;cursor:pointer;transition:color 0.15s;
  font-size:11px;color:#bb7070;
}
.flag-row:hover{color:var(--danger)}
.flag-row.found{color:var(--accent)}
.flag-chk{
  width:15px;height:15px;border-radius:3px;
  border:1.5px solid currentColor;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:9px;margin-top:1px;
}
.flags-success{
  display:none;margin-top:10px;padding:9px;
  background:rgba(0,229,160,0.08);border-radius:8px;
  font-size:11px;color:var(--accent);line-height:1.5;
}

/* ===== MAP ===== */
#mapScreen{background:var(--bg)}
.map-canvas{
  flex:1;position:relative;background:#08080e;overflow:hidden;
}
.map-grid-lines{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(0,229,160,0.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(0,229,160,0.04) 1px,transparent 1px);
  background-size:30px 30px;
}
.map-glow{
  position:absolute;top:40%;left:30%;
  width:120px;height:120px;border-radius:50%;
  background:radial-gradient(circle,rgba(0,229,160,0.06) 0%,transparent 70%);
  pointer-events:none;
}
.loc-pin{
  position:absolute;transform:translate(-50%,-50%);
  display:flex;flex-direction:column;align-items:center;
  cursor:pointer;user-select:none;
}
.pin-circle{
  width:16px;height:16px;border-radius:50%;
  border:2.5px solid;position:relative;
  transition:transform 0.15s;
}
.pin-circle::after{
  content:'';position:absolute;inset:3px;
  border-radius:50%;background:currentColor;opacity:0.6;
}
.loc-pin:active .pin-circle{transform:scale(1.3)}
.pin-pulse{animation:pinPulse 2s infinite}
@keyframes pinPulse{
  0%,100%{box-shadow:0 0 0 0 rgba(0,229,160,0.5)}
  50%{box-shadow:0 0 0 10px rgba(0,229,160,0)}
}
.pin-lbl{
  font-size:9px;color:var(--text);background:rgba(0,0,0,0.85);
  border:1px solid var(--border);border-radius:5px;
  padding:2px 7px;margin-top:4px;white-space:nowrap;
}
.pin-status{font-size:8px;margin-top:2px;letter-spacing:0.5px}
.map-panel{
  position:absolute;bottom:0;left:0;right:0;
  background:rgba(17,17,24,0.97);
  border-top:1px solid var(--border);
  backdrop-filter:blur(16px);
  padding:16px 16px 12px;
  transform:translateY(100%);transition:transform 0.25s ease;
}
.map-panel.open{transform:translateY(0)}
.map-panel-name{font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px}
.map-panel-desc{font-size:11px;color:var(--muted);line-height:1.5;margin-bottom:12px}
.map-go-btn{
  background:var(--accent);color:#000;
  border:none;border-radius:10px;
  padding:12px;width:100%;
  font-family:'Courier New',monospace;font-size:12px;font-weight:700;
  cursor:pointer;letter-spacing:0.5px;transition:opacity 0.15s;
}
.map-go-btn:active{opacity:0.8}
.map-go-btn.locked{background:var(--muted);cursor:not-allowed}
.map-go-btn.req{background:var(--danger)}

/* ===== TERMINAL ===== */
#terminalScreen{background:#050508}
.term-topbar{
  display:flex;align-items:center;gap:8px;
  padding:10px 14px;background:#0d0d12;
  border-bottom:1px solid var(--border);flex-shrink:0;
}
.term-dots{display:flex;gap:6px}
.tdot{width:11px;height:11px;border-radius:50%}
.tdot-r{background:#ff5f57}.tdot-y{background:#ffbd2e}.tdot-g{background:#28c840}
.term-title-txt{flex:1;text-align:center;font-size:11px;color:var(--muted)}
.term-body{
  flex:1;overflow-y:auto;padding:14px 15px;
  font-size:12px;line-height:1.7;
}
.term-body::-webkit-scrollbar{display:none}
.t-g{color:#28c840}.t-c{color:var(--cyan)}.t-r{color:var(--danger)}
.t-y{color:var(--warn)}.t-d{color:var(--muted)}.t-w{color:var(--text)}.t-a{color:var(--accent)}
.term-br{height:6px}
.cipher-block{
  background:rgba(0,229,160,0.04);border:1px solid rgba(0,229,160,0.18);
  border-radius:10px;padding:14px;margin-top:6px;
}
.cipher-enc{
  font-size:18px;letter-spacing:5px;color:var(--warn);
  text-align:center;margin-bottom:12px;font-weight:700;
}
.slider-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.slider-lbl{font-size:10px;color:var(--muted);white-space:nowrap}
.slider-val{font-size:13px;font-weight:700;color:var(--warn);min-width:22px;text-align:right}
input[type=range]{
  flex:1;height:4px;
  -webkit-appearance:none;
  background:var(--border2);border-radius:2px;
  accent-color:var(--accent);
}
input[type=range]::-webkit-slider-thumb{
  -webkit-appearance:none;
  width:18px;height:18px;border-radius:50%;
  background:var(--accent);cursor:pointer;
}
.cipher-out{
  width:100%;background:var(--bg);border:1px solid var(--border);
  border-radius:8px;padding:9px 11px;
  color:var(--accent);font-family:'Courier New',monospace;
  font-size:15px;letter-spacing:4px;text-align:center;
  font-weight:700;text-transform:uppercase;border:none;outline:none;
}
.cipher-hint{font-size:10px;color:var(--muted);text-align:center;margin-top:7px}
.cipher-solved{
  display:none;margin-top:9px;padding:9px 11px;
  background:rgba(0,229,160,0.08);border-radius:8px;
  font-size:11px;color:var(--accent);text-align:center;
}
.term-prompt{display:flex;align-items:center;gap:6px;margin-top:10px}
.cursor{
  display:inline-block;width:8px;height:14px;
  background:var(--accent);animation:cursorBlink 1s infinite;
  vertical-align:middle;
}
@keyframes cursorBlink{0%,50%{opacity:1}51%,100%{opacity:0}}

/* ===== SHOP ===== */
#shopScreen{background:var(--bg)}
.shop-balance-bar{
  display:flex;align-items:center;justify-content:flex-end;gap:6px;
  padding:0 16px 10px;font-size:13px;color:var(--warn);font-weight:700;
  flex-shrink:0;
}
.shop-body{flex:1;overflow-y:auto;padding:0 16px 16px}
.shop-body::-webkit-scrollbar{display:none}
.shop-cat{
  font-size:9px;letter-spacing:2px;color:var(--muted);
  text-transform:uppercase;padding:12px 0 8px;
}
.shop-row{
  background:var(--card);border:1px solid var(--border);
  border-radius:12px;padding:12px;
  display:flex;gap:11px;align-items:center;
  margin-bottom:8px;transition:border-color 0.15s;
}
.shop-row:hover{border-color:rgba(123,95,255,0.3)}
.shop-ico{font-size:26px;flex-shrink:0}
.shop-info{flex:1;min-width:0}
.shop-name{font-size:13px;font-weight:700;color:var(--text)}
.shop-desc{font-size:10px;color:var(--muted);margin-top:2px;line-height:1.4}
.shop-tags{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}
.stag{font-size:9px;padding:2px 7px;border-radius:4px;letter-spacing:0.4px}
.stag-tool{background:rgba(0,229,160,.1);color:var(--accent);border:1px solid rgba(0,229,160,.2)}
.stag-access{background:rgba(123,95,255,.1);color:var(--accent2);border:1px solid rgba(123,95,255,.2)}
.stag-boost{background:rgba(0,207,255,.1);color:var(--cyan);border:1px solid rgba(0,207,255,.2)}
.stag-cosm{background:rgba(255,74,106,.1);color:var(--danger);border:1px solid rgba(255,74,106,.2)}
.buy-btn{
  background:transparent;border:1px solid var(--accent2);
  border-radius:8px;padding:7px 11px;
  color:var(--accent2);font-family:'Courier New',monospace;
  font-size:11px;cursor:pointer;white-space:nowrap;flex-shrink:0;
  transition:all 0.15s;display:flex;align-items:center;gap:4px;
}
.buy-btn:active{background:rgba(123,95,255,.2)}
.buy-btn.owned{border-color:var(--accent);color:var(--accent);cursor:default}
.buy-btn.no-stars{border-color:var(--danger);color:var(--danger)}

/* ===== TOAST ===== */
.toast{
  position:absolute;top:14px;left:50%;transform:translateX(-50%);
  background:var(--accent);color:#000;
  border-radius:20px;padding:7px 16px;
  font-size:12px;font-weight:700;
  white-space:nowrap;z-index:200;
  animation:toastAnim 1.8s ease forwards;
  pointer-events:none;
}
@keyframes toastAnim{
  0%{opacity:0;transform:translateX(-50%) translateY(-10px)}
  15%{opacity:1;transform:translateX(-50%) translateY(0)}
  70%{opacity:1;transform:translateX(-50%) translateY(0)}
  100%{opacity:0;transform:translateX(-50%) translateY(-10px)}
}