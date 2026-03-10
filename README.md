<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🏫 Школьный Telegram-бот</title>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Onest:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#09090f;--surface:#0f0f1a;--card:#13131f;--border:rgba(255,255,255,0.07);--accent:#4f8eff;--accent2:#a855f7;--accent3:#22d3ee;--gold:#f59e0b;--green:#10b981;--text:#e8e8f0;--muted:#6b6b8a;--glow:0 0 40px rgba(79,142,255,0.15)}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:'Onest',sans-serif;overflow-x:hidden;min-height:100vh}
body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(79,142,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(79,142,255,0.03) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;z-index:0}
.orb{position:fixed;border-radius:50%;filter:blur(100px);opacity:.12;pointer-events:none;z-index:0;animation:drift 12s ease-in-out infinite alternate}
.orb.b{width:600px;height:600px;background:#4f8eff;top:-200px;left:-100px}
.orb.p{width:500px;height:500px;background:#a855f7;bottom:-100px;right:-100px;animation-delay:-4s}
.orb.c{width:300px;height:300px;background:#22d3ee;top:40%;left:60%;animation-delay:-8s}
@keyframes drift{from{transform:translate(0,0) scale(1)}to{transform:translate(30px,20px) scale(1.05)}}
.wrap{position:relative;z-index:1;max-width:900px;margin:0 auto;padding:0 24px 80px}

/* HERO */
.hero{text-align:center;padding:80px 0 60px}
.badge-live{display:inline-flex;align-items:center;gap:8px;background:rgba(79,142,255,.1);border:1px solid rgba(79,142,255,.25);border-radius:100px;padding:6px 16px;font-size:12px;font-weight:500;color:var(--accent);letter-spacing:.1em;text-transform:uppercase;margin-bottom:32px;animation:fsd .6s ease both}
.badge-live::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:pulse 2s ease infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
h1.title{font-family:'Unbounded',sans-serif;font-size:clamp(36px,7vw,72px);font-weight:900;line-height:1.05;letter-spacing:-.03em;margin-bottom:8px;animation:fsd .7s ease .1s both}
h1.title .g{background:linear-gradient(135deg,var(--accent),var(--accent2),var(--accent3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{font-size:clamp(14px,2.5vw,18px);color:var(--muted);font-weight:300;margin-bottom:40px;animation:fsd .7s ease .2s both}
.cta{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,var(--accent),#3b6fd4);color:#fff;font-family:'Unbounded',sans-serif;font-size:13px;font-weight:700;letter-spacing:.05em;padding:14px 32px;border-radius:14px;text-decoration:none;transition:transform .2s,box-shadow .2s;box-shadow:0 8px 32px rgba(79,142,255,.35);animation:fsd .7s ease .3s both}
.cta:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(79,142,255,.5)}
.badges{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:32px;animation:fsd .7s ease .4s both}
.bdg{display:flex;align-items:center;gap:6px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:500;color:var(--muted)}
.dot{width:6px;height:6px;border-radius:50%}
.dot.g{background:var(--green);box-shadow:0 0 6px var(--green)}
.dot.b{background:var(--accent);box-shadow:0 0 6px var(--accent)}
.dot.p{background:var(--accent2);box-shadow:0 0 6px var(--accent2)}
.dot.o{background:var(--gold);box-shadow:0 0 6px var(--gold)}

/* TERMINAL */
.term{background:#080810;border:1px solid rgba(79,142,255,.2);border-radius:16px;margin:48px 0;overflow:hidden;box-shadow:var(--glow);animation:fsu .8s ease .5s both}
.term-bar{display:flex;align-items:center;gap:8px;padding:14px 18px;background:rgba(255,255,255,.03);border-bottom:1px solid var(--border)}
.td{width:12px;height:12px;border-radius:50%}
.td.r{background:#ff5f57}.td.y{background:#febc2e}.td.gn{background:#28c840}
.tlbl{margin-left:8px;font-size:12px;color:var(--muted)}
.term-body{padding:24px;font-size:13px;line-height:2}
.tl{display:flex;gap:12px;opacity:0;transform:translateX(-8px);transition:opacity .3s,transform .3s}
.tp{color:var(--accent);flex-shrink:0}
.tg{color:var(--green)}.tc{color:var(--accent3)}.to{color:var(--gold)}.tm{color:var(--muted)}
.cursor{display:inline-block;width:8px;height:14px;background:var(--accent);border-radius:2px;margin-left:4px;vertical-align:middle;animation:blink 1.1s step-end infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

/* STATS */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:0 0 16px}
.sc{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;text-align:center;transition:transform .2s}
.sc:hover{transform:translateY(-2px)}
.sn{font-family:'Unbounded',sans-serif;font-size:26px;font-weight:900;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px}
.sl{font-size:11px;color:var(--muted);font-weight:500;text-transform:uppercase;letter-spacing:.05em}

/* SECTION */
.sh{display:flex;align-items:center;gap:16px;margin:64px 0 28px}
.sh h2{font-family:'Unbounded',sans-serif;font-size:20px;font-weight:700;letter-spacing:-.02em}
.sline{flex:1;height:1px;background:linear-gradient(90deg,var(--border),transparent)}
.snum{font-family:'Unbounded',sans-serif;font-size:11px;color:var(--muted);border:1px solid var(--border);border-radius:6px;padding:3px 8px}

/* GRIDS */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:640px){.g2,.stats{grid-template-columns:1fr}}

/* CARDS */
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;position:relative;overflow:hidden;transition:border-color .3s,transform .3s,box-shadow .3s}
.card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(79,142,255,.04),transparent);opacity:0;transition:opacity .3s}
.card:hover{border-color:rgba(79,142,255,.3);transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
.card:hover::before{opacity:1}
.ci{font-size:28px;margin-bottom:14px;display:block}
.ct{font-family:'Unbounded',sans-serif;font-size:13px;font-weight:700;margin-bottom:8px;letter-spacing:-.01em}
.cd{font-size:13px;color:var(--muted);line-height:1.6}
.ab{border-color:rgba(79,142,255,.2)}.ap{border-color:rgba(168,85,247,.2)}.ac{border-color:rgba(34,211,238,.2)}.ao{border-color:rgba(245,158,11,.2)}.ag{border-color:rgba(16,185,129,.2)}

/* AUDIENCE */
.ac-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;transition:transform .3s,box-shadow .3s}
.ac-card:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,0,0,.4)}
.ar{font-family:'Unbounded',sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:10px}
.ar .em{font-size:20px}
.fl{list-style:none;display:flex;flex-direction:column;gap:8px}
.fl li{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--muted);line-height:1.5}
.fl li::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0;margin-top:1px}

/* STEPS */
.steps{display:flex;gap:0;margin:8px 0}
.step{flex:1;text-align:center;position:relative}
.step::after{content:'';position:absolute;top:20px;right:-50%;width:100%;height:1px;background:linear-gradient(90deg,var(--accent),var(--border));z-index:0}
.step:last-child::after{display:none}
.step-n{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#3b6fd4);display:flex;align-items:center;justify-content:center;font-family:'Unbounded',sans-serif;font-size:14px;font-weight:900;margin:0 auto 10px;position:relative;z-index:1;box-shadow:0 4px 16px rgba(79,142,255,.4)}
.step-l{font-size:12px;color:var(--muted);font-weight:500}

/* ADMIN LIST */
.al{display:flex;flex-direction:column;gap:12px}
.ar2{display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:12px;padding:14px 18px;transition:background .2s,border-color .2s}
.ar2:hover{background:rgba(79,142,255,.05);border-color:rgba(79,142,255,.2)}
.ai2{font-size:20px;flex-shrink:0}
.ain{flex:1}
.ain-n{font-size:14px;font-weight:600;margin-bottom:2px}
.ain-d{font-size:12px;color:var(--muted)}
.tag{font-size:10px;font-family:'Unbounded',sans-serif;font-weight:700;letter-spacing:.08em;padding:3px 8px;border-radius:6px;text-transform:uppercase}
.tn{background:rgba(16,185,129,.12);color:var(--green);border:1px solid rgba(16,185,129,.2)}
.th{background:rgba(245,158,11,.12);color:var(--gold);border:1px solid rgba(245,158,11,.2)}
.ta{background:rgba(168,85,247,.12);color:var(--accent2);border:1px solid rgba(168,85,247,.2)}

/* NOTIF */
.nr{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)}
.nr:last-child{border-bottom:none}
.ndot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.nt{font-size:14px}
.ns{font-size:12px;color:var(--muted);margin-top:2px}

/* CHANGELOG */
.cl{position:relative;padding-left:28px}
.cl::before{content:'';position:absolute;left:7px;top:8px;bottom:8px;width:2px;background:linear-gradient(180deg,var(--accent),var(--accent2),transparent)}
.cli{position:relative;margin-bottom:28px}
.cli::before{content:'';position:absolute;left:-25px;top:6px;width:10px;height:10px;border-radius:50%;background:var(--accent);border:2px solid var(--bg);box-shadow:0 0 8px var(--accent)}
.cli:nth-child(2)::before{background:var(--accent2);box-shadow:0 0 8px var(--accent2)}
.cli:nth-child(3)::before{background:var(--muted);box-shadow:none}
.clv{font-family:'Unbounded',sans-serif;font-size:12px;font-weight:700;color:var(--accent);letter-spacing:.05em;margin-bottom:6px}
.cli:nth-child(2) .clv{color:var(--accent2)}
.cli:nth-child(3) .clv{color:var(--muted)}
.clt{font-size:16px;font-weight:600;margin-bottom:10px}
.clf{list-style:none;display:flex;flex-direction:column;gap:5px}
.clf li{font-size:13px;color:var(--muted);display:flex;gap:8px}
.clf li .ck{color:var(--green);flex-shrink:0}

/* SUPPORT */
.supp{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:32px;display:flex;align-items:center;gap:24px;margin-top:16px}
.sav{width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0}
.si{flex:1}
.sn2{font-family:'Unbounded',sans-serif;font-size:16px;font-weight:700;margin-bottom:4px}
.sr{font-size:13px;color:var(--muted);margin-bottom:12px}
.slinks{display:flex;gap:10px;flex-wrap:wrap}
.slink{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:8px;padding:7px 14px;font-size:12px;color:var(--text);text-decoration:none;transition:background .2s,border-color .2s}
.slink:hover{background:rgba(79,142,255,.1);border-color:rgba(79,142,255,.3)}

/* FOOTER */
.footer{text-align:center;padding-top:64px;border-top:1px solid var(--border);margin-top:64px}
.flogo{font-family:'Unbounded',sans-serif;font-size:24px;font-weight:900;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px}
.fsub{font-size:13px;color:var(--muted);margin-bottom:24px}

/* ANIM */
@keyframes fsd{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fsu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
</style>
</head>
<body>
<div class="orb b"></div><div class="orb p"></div><div class="orb c"></div>
<div class="wrap">

<!-- HERO -->
<div class="hero">
  <div class="badge-live">🟢 Работает · Версия 5.0 · Март 2026</div>
  <h1 class="title">Школьный<br><span class="g">Telegram-бот</span></h1>
  <p class="hero-sub">Расписание · Замены · Новости · ИИ-помощник<br>Всё в одном месте, мгновенно</p>
  <a href="https://t.me/school_hoiniki_sch3_bot" class="cta">✈️ &nbsp;ОТКРЫТЬ БОТА</a>
  <div class="badges">
    <div class="bdg"><span class="dot g"></span>Статус: онлайн</div>
    <div class="bdg"><span class="dot b"></span>Python 3.11</div>
    <div class="bdg"><span class="dot p"></span>ИИ: llama-3.3-70b</div>
    <div class="bdg"><span class="dot o"></span>Railway · PostgreSQL</div>
  </div>
</div>

<!-- TERMINAL -->
<div class="term reveal">
  <div class="term-bar">
    <div class="td r"></div><div class="td y"></div><div class="td gn"></div>
    <span class="tlbl">school-bot — python bot.py</span>
  </div>
  <div class="term-body">
    <div class="tl"><span class="tp">$</span><span>python bot.py</span></div>
    <div class="tl"><span class="tp" style="opacity:0">$</span><span class="tg">🤖 Бот запущен!</span></div>
    <div class="tl"><span class="tp" style="opacity:0">$</span><span class="tc">👨‍🏫 Учителей: <span class="to">37</span> &nbsp;│&nbsp; 📚 Классов: <span class="to">16</span> &nbsp;│&nbsp; ⏰ Уроков/день: <span class="to">7</span></span></div>
    <div class="tl"><span class="tp" style="opacity:0">$</span><span class="tc">🤖 ИИ: <span class="tg">✅ Groq llama-3.3-70b-versatile</span></span></div>
    <div class="tl"><span class="tp" style="opacity:0">$</span><span class="tg">✅ База данных: подключена (pool=5)</span></div>
    <div class="tl"><span class="tp" style="opacity:0">$</span><span class="tg">✅ Polling started</span><span class="cursor"></span></div>
  </div>
</div>

<!-- STATS -->
<div class="stats reveal">
  <div class="sc"><div class="sn">16</div><div class="sl">Классов</div></div>
  <div class="sc"><div class="sn">37</div><div class="sl">Учителей</div></div>
  <div class="sc"><div class="sn">5.0</div><div class="sl">Версия</div></div>
  <div class="sc"><div class="sn">24/7</div><div class="sl">Работает</div></div>
</div>

<!-- FEATURES -->
<div class="sh reveal"><h2>⚡ Возможности</h2><div class="sline"></div><div class="snum">08</div></div>
<div class="g2 reveal">
  <div class="card ab"><span class="ci">📚</span><div class="ct">Расписание уроков</div><div class="cd">Классы 5а–11, пн–пт. На день, неделю или прямо сейчас — с заменами в реальном времени</div></div>
  <div class="card ap"><span class="ci">👨‍🏫</span><div class="ct">Расписание учителей</div><div class="cd">Поиск по фамилии, авторегистрация через /teacher — уведомления при заменах автоматически</div></div>
  <div class="card ao"><span class="ci">🔄</span><div class="ct">Замены уроков</div><div class="cd">Вчера, сегодня, завтра — актуально. Добавление вручную или через фото с ИИ-распознаванием</div></div>
  <div class="card ac"><span class="ci">📣</span><div class="ct">Школьные новости</div><div class="cd">3 последних на главном экране, архив с пагинацией, рассылка всем в один клик</div></div>
  <div class="card ag"><span class="ci">🌟</span><div class="ct">Избранное «МОЁ»</div><div class="cd">Добавь свой класс и учителей — всё важное доступно с первого экрана мгновенно</div></div>
  <div class="card ap"><span class="ci">🤖</span><div class="ct">ИИ-помощник</div><div class="cd">Groq llama-3.3-70b, память диалога, два режима: педагог и ученик. Любые вопросы</div></div>
  <div class="card ab"><span class="ci">⏰</span><div class="ct">Сейчас / Звонки</div><div class="cd">Текущий урок, время до звонка, следующий предмет — живое обновление</div></div>
  <div class="card ao"><span class="ci">🔍</span><div class="ct">Поиск учителя</div><div class="cd">По фамилии или части имени, мгновенные результаты, быстрый переход к расписанию</div></div>
</div>

<!-- WHO -->
<div class="sh reveal"><h2>🎯 Для кого</h2><div class="sline"></div><div class="snum">04</div></div>
<div class="g2 reveal">
  <div class="ac-card"><div class="ar"><span class="em">👨‍🎓</span><span style="color:var(--accent)">УЧЕНИКИ</span></div><ul class="fl"><li>Расписание класса за 2 клика</li><li>Уведомления о заменах</li><li>Новости школы в ленте</li><li>«МОЁ» — всё важное на экране</li></ul></div>
  <div class="ac-card"><div class="ar"><span class="em">👨‍🏫</span><span style="color:var(--accent2)">УЧИТЕЛЯ</span></div><ul class="fl"><li>Личное расписание со всеми классами</li><li>Мгновенные уведомления о заменах</li><li>Регистрация через /teacher</li><li>Упоминания в чатах</li></ul></div>
  <div class="ac-card"><div class="ar"><span class="em">👨‍👩‍👧</span><span style="color:var(--accent3)">РОДИТЕЛИ</span></div><ul class="fl"><li>Контроль расписания ребёнка</li><li>Важные объявления в одном месте</li><li>Прозрачность школьной жизни</li><li>Спокойствие за учебный процесс</li></ul></div>
  <div class="ac-card"><div class="ar"><span class="em">👑</span><span style="color:var(--gold)">АДМИНИСТРАТОРЫ</span></div><ul class="fl"><li>Публикация новостей с рассылкой</li><li>Замены из фото (ИИ-распознавание)</li><li>Аналитика и статистика</li><li>Гибкий техрежим в один клик</li></ul></div>
</div>

<!-- START -->
<div class="sh reveal"><h2>🚀 Как начать</h2><div class="sline"></div><div class="snum">04</div></div>
<div class="card reveal" style="padding:32px 40px">
  <div class="steps">
    <div class="step"><div class="step-n">1</div><div class="step-l">Найти бота</div></div>
    <div class="step"><div class="step-n">2</div><div class="step-l">Нажать /start</div></div>
    <div class="step"><div class="step-n">3</div><div class="step-l">Выбрать раздел</div></div>
    <div class="step"><div class="step-n">4</div><div class="step-l">Готово ✨</div></div>
  </div>
  <p style="text-align:center;font-size:13px;color:var(--muted);margin-top:24px">💡 Добавьте класс в <b style="color:var(--text)">«🌟 МОЁ»</b> — расписание всегда на первом экране</p>
</div>

<!-- ADMIN -->
<div class="sh reveal"><h2>👑 Админ-панель</h2><div class="sline"></div><div class="snum">06</div></div>
<div class="al reveal">
  <div class="ar2"><div class="ai2">📸</div><div class="ain"><div class="ain-n">Замены из фото</div><div class="ain-d">Фото листа замен → ИИ распознаёт → предпросмотр → сохранение одной кнопкой</div></div><div class="tag tn">NEW</div></div>
  <div class="ar2"><div class="ai2">📣</div><div class="ain"><div class="ain-n">Публикация новостей</div><div class="ain-d">С предпросмотром и мгновенной рассылкой всем пользователям</div></div><div class="tag th">HOT</div></div>
  <div class="ar2"><div class="ai2">➕</div><div class="ain"><div class="ain-n">Добавление замен вручную</div><div class="ain-d">4 шага: дата → класс → урок → учитель. Авто-уведомление педагогу</div></div><span></span></div>
  <div class="ar2"><div class="ai2">🤖</div><div class="ain"><div class="ain-n">ИИ Vision</div><div class="ain-d">Groq Vision читает фото замен, llama-3.3-70b обрабатывает тексты</div></div><div class="tag ta">AI</div></div>
  <div class="ar2"><div class="ai2">📊</div><div class="ain"><div class="ain-n">Аналитика</div><div class="ain-d">Активные пользователи, популярные классы, пиковые часы использования</div></div><span></span></div>
  <div class="ar2"><div class="ai2">🔧</div><div class="ain"><div class="ain-n">Техрежим</div><div class="ain-d">1ч / 3ч / 5ч / До завтра / Бессрочно — одним нажатием</div></div><span></span></div>
</div>

<!-- NOTIF -->
<div class="sh reveal"><h2>🔔 Уведомления</h2><div class="sline"></div><div class="snum">04</div></div>
<div class="card reveal">
  <div class="nr"><div class="ndot" style="background:var(--accent);box-shadow:0 0 8px var(--accent)"></div><div><div class="nt">Уведомление учителю при замене</div><div class="ns">Мгновенно в Telegram после добавления замены администратором</div></div></div>
  <div class="nr"><div class="ndot" style="background:var(--accent2);box-shadow:0 0 8px var(--accent2)"></div><div><div class="nt">Рассылка важных новостей</div><div class="ns">Всем пользователям при публикации, с паузами (лимиты Telegram соблюдены)</div></div></div>
  <div class="nr"><div class="ndot" style="background:var(--gold);box-shadow:0 0 8px var(--gold)"></div><div><div class="nt">Упоминания учителей</div><div class="ns">Написали фамилию — зарегистрированный учитель получает пуш</div></div></div>
  <div class="nr"><div class="ndot" style="background:var(--muted)"></div><div><div class="nt">Предупреждение о техработах</div><div class="ns">Все запросы во время техрежима перехватываются с понятным сообщением</div></div></div>
</div>

<!-- CHANGELOG -->
<div class="sh reveal"><h2>🔄 История версий</h2><div class="sline"></div><div class="snum">03</div></div>
<div class="cl reveal">
  <div class="cli"><div class="clv">v5.0 — ТЕКУЩАЯ · Март 2026</div><div class="clt">Большой рефакторинг + ИИ-фичи</div><ul class="clf"><li><span class="ck">✓</span>Замены из фото — Groq Vision распознаёт листы замен</li><li><span class="ck">✓</span>ИИ llama-3.3-70b, память диалога, роли педагог/ученик</li><li><span class="ck">✓</span>Авторегистрация учителей через /teacher</li><li><span class="ck">✓</span>Новости: 3 последних + архив с пагинацией</li><li><span class="ck">✓</span>Рассылка с паузами, роутер кнопок, пагинация учителей</li></ul></div>
  <div class="cli"><div class="clv">v3.0 · Февраль 2026</div><div class="clt">UX и избранное</div><ul class="clf"><li><span class="ck">✓</span>Кнопка «🌟 МОЁ» с избранным</li><li><span class="ck">✓</span>Умная рассылка новостей с меню</li><li><span class="ck">✓</span>Аналитика и гибкий техрежим</li></ul></div>
  <div class="cli"><div class="clv">v1.0–2.0 · 2025</div><div class="clt">Старт проекта</div><ul class="clf"><li><span class="ck">✓</span>Базовое расписание, замены, админ-панель</li><li><span class="ck">✓</span>Асинхронная БД, уведомления, часовой пояс Минска</li></ul></div>
</div>

<!-- SUPPORT -->
<div class="sh reveal"><h2>📞 Поддержка</h2><div class="sline"></div></div>
<div class="supp reveal">
  <div class="sav">👨‍💻</div>
  <div class="si">
    <div class="sn2">Гуд Юрий Петрович</div>
    <div class="sr">Разработчик · Пн–Пт, 9:00–18:00</div>
    <div class="slinks">
      <a href="https://t.me/Yury_hud" class="slink">✈️ Telegram</a>
      <a href="mailto:uragud.2020@gmail.com" class="slink">📧 Email</a>
    </div>
  </div>
</div>
<p style="font-size:12px;color:var(--muted);margin-top:16px;padding-left:4px">При обращении укажите: имя и класс, время проблемы, скриншот (если есть)</p>

<!-- FOOTER -->
<div class="footer reveal">
  <div class="flogo">ШКОЛЬНЫЙ БОТ</div>
  <div class="fsub">Хойники · Школа №3 · 2026</div>
  <a href="https://t.me/school_hoiniki_sch3_bot" class="cta" style="font-size:12px;padding:12px 24px">✈️ &nbsp;ОТКРЫТЬ В TELEGRAM</a>
</div>

</div>
<script>
const obs = new IntersectionObserver(entries=>{
  entries.forEach((e,i)=>{
    if(e.isIntersecting){setTimeout(()=>e.target.classList.add('visible'),i*60);obs.unobserve(e.target)}
  })
},{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

document.querySelectorAll('.tl').forEach((l,i)=>{
  setTimeout(()=>{l.style.opacity='1';l.style.transform='translateX(0)'},900+i*180);
});
</script>
</body>
</html>
