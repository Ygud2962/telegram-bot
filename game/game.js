window.__GAME_JS_LOADED = true;
// Переменные синхронизации (объявлены глобально чтобы избежать ReferenceError)
let _lastSyncedScore = -1;
let _lastSyncedCompleted = -1;
let _lastSyncedSignature = '';
let _serverResetToken = 0;
// ═══════════════════════════════════════════════════════
//  ДАННЫЕ ИГРЫ — 20 ШИФРОВ, 4 ГЛАВЫ
// ═══════════════════════════════════════════════════════
const CHAPTERS = [
  // ═══════════════════════════════════════════════════════
  //  ГЛАВА I — ХОЙНИКИ: ОГНЕННОЕ ЛЕТО
  // ═══════════════════════════════════════════════════════
  {
    id:1, title:"ХОЙНИКИ: ОГНЕННОЕ ЛЕТО", subtitle:"Глава I",
    place:"ХОЙНИКИ · ГОМЕЛЬСКАЯ ОБЛ. · 1941", stamp:"🌿",
    meta:"Дата: 28.08.1941\\nМесто: г. Хойники, Полесье\\nСтатус: ОККУПАЦИЯ",
    briefing:`Август 1941. Хойники — небольшой город на юге Гомельской области, в сердце Полесья. Немецкие войска заняли город. Местные жители уходят в леса — начинается партизанское движение. Первый связной отряда передаёт координаты явки. Ты — его преемник. Расшифруй донесения.`,
    mission:"Выполни 6 разведывательных заданий по Хойникскому региону",
    videoUrl:"https://www.youtube.com/embed/8mFDTm5OQCI",
    ciphers:[
      { type:"quiz", typeLabel:"ИСТОРИЯ КРАЯ",
        task:"Хойники — районный центр одной из областей Беларуси. Определи по карте: в какой области находится Хойникский район?",
        options:["Брестская область","Гомельская область","Витебская область","Могилёвская область"],
        correctIndex:1,
        encrypted:"🗺",
        answer:"a2504b40b4c895667b4364476daee719377afbab51bbd142e0b5a5f538b58875",
        hint:"Полесье — исторический регион на юге Беларуси, граничит с Украиной.",
        fact:"Хойникский район расположен в Гомельской области в зоне Полесья. После аварии на ЧАЭС в 1986 году часть района вошла в зону отчуждения.", points:100 },
      { type:"caesar", typeLabel:"ШИФР ЦЕЗАРЯ",
        task:"Связной передал зашифрованный отчёт из Хойник. Сдвиг 3 позиции. Расшифруй трёхбуквенное название реки вдоль которой движется отряд:",
        shift:3, encrypted:"ФСЙ",
        answer:"4897432de4be211f639b683e878ae091df780e52bb92a5ac7023ad88bf5e3b8f",
        hint:"Вычти 3: Ф(22)-3=19=С, С(19)-3=16=О, Й(11)-3=8=Ж. ФСЙ → СОЖ!",
        fact:"Река Сож протекает через Гомельскую область. Партизанские отряды Хойникского района часто использовали берега Сожа для переправ.", points:110 },
      { type:"num", typeLabel:"ЧИСЛОВОЙ КОД",
        task:"Перехвачено донесение о численности немецкого гарнизона в Хойниках. Каждое число — буква алфавита (А=1). Расшифруй ключевое слово:",
        encrypted:"17-1-18-20-10-9-1-15",
        answer:"27d97c40af3afb4879364af1fdddf55bbbb06effe822b3ad43d869f147751822",
        hint:"П=17, А=1, Р=18, Т=20, И=10, З=9, А=1, Н=15. Восемь букв. П-А-Р-Т-И-З-А-Н!",
        fact:"Партизанское движение в Хойникском районе началось с первых дней оккупации. К 1943 году в районе действовало несколько крупных отрядов.", points:120 },
      { type:"anagram", typeLabel:"АНАГРАММА",
        task:"Переставь буквы — получишь название исторического региона, где расположены Хойники. Именно здесь плотные леса и болота стали союзниками партизан:",
        encrypted:"ЬЕЛЕСОП",
        answer:"01458a6a82aafaacc62d2a5fff5e7c73ae5a97661b706e5dccaa8c96cb82a234",
        hint:"6 букв. Природный регион южной Беларуси. Много болот и лесов. П-О-Л...",
        fact:"Полесье — одна из крупнейших заболоченных территорий Европы. Немецкие войска избегали здесь активных действий — партизаны чувствовали себя здесь как дома.", points:130 },
      { type:"math", typeLabel:"РАСЧЁТ РАЗВЕДЧИКА",
        task:"За 3 ночи партизанский отряд из Хойникского района провёл по 3 диверсии каждую ночь. Сколько всего диверсий провёл отряд?",
        encrypted:"3 × 3 = ?",
        answer:"19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7",
        hint:"3 ночи × 2 состава = 6 составов. 6 составов × 15 вагонов? Нет — 3 × 2 = 6, 6 × 15 = 90. Но ответ одна цифра... 3 × 3 = 9. Три ночи × три операции = 9 операций.",
        fact:"Партизаны Хойникского района провели десятки диверсий на железной дороге. Рельсовая война была одним из главных инструментов сопротивления.", points:140 },
      { type:"map", typeLabel:"НАЙДИ НА КАРТЕ",
        task:"На карте Беларуси тапни на второй по величине город страны — административный центр южной области:",
        encrypted:"🗺",
        answer:"e601539268946eebf1f84584657b2769e92be55ebc43a9a7266d8f0aec021dbb",
        mapCity:"ГОМЕЛЬ",
        hint:"Юго-восток Беларуси, недалеко от границы с Россией и Украиной. Второй по величине город страны.",
        fact:"Гомель — второй по величине город Беларуси. Хойники находятся в 80 км к юго-западу от Гомеля.", points:150 }
    ]
  },

  // ═══════════════════════════════════════════════════════
  //  ГЛАВА II — ПОДПОЛЬЕ МИНСКА
  // ═══════════════════════════════════════════════════════
  {
    id:2, title:"ПОДПОЛЬЕ МИНСКА", subtitle:"Глава II",
    place:"МИНСК · ИЮЛЬ 1942", stamp:"📜",
    meta:"Дата: 14.07.1942\\nМесто: Минск, оккупация\\nСтатус: АКТИВНО",
    briefing:`Лето 1942 года. Минск под оккупацией уже год. Подпольная сеть «Комета» действует в городе. Перехваченные донесения содержат сведения о вражеских колоннах. Немцы меняют коды каждые 48 часов — действуй быстро.`,
    mission:"Расшифруй 6 донесений минского подполья",
    videoUrl:"https://www.youtube.com/embed/dL8DM0PfRvQ",
    ciphers:[
      { type:"caesar", typeLabel:"ШИФР ЦЕЗАРЯ", shift:3,
        task:"Каждая буква сдвинута на 3 позиции вперёд. А→Г, Б→Д... Расшифруй слово:",
        encrypted:"ЁСУСЖ",
        answer:"f9e05f164c5a0d5f568e20655d6a3460a1b89be8ae2d039432b7f591269c56d7",
        hint:"Ё(6)−3=3=Г. С(19)−3=16=О. У(21)−3=18=Р. С(19)−3=16=О. Ж(8)−3=5=Д. ГОРОД!",
        fact:"Минское подполье — одна из крупнейших сетей сопротивления в Европе: более 9000 участников.", points:100 },
      { type:"morse", typeLabel:"АЗБУКА МОРЗЕ", shift:0,
        task:"Расшифруй радиограмму. Буквы разделены /, слова //",
        encrypted:"..../.-.././-...//-../---/.-./---/--.",
        answer:"9f105caf00cb3a6702aa88267e5efeac19d5ed77d966999d103ad3c02e09f622",
        hint:".... = Х, .-.. = Л, . = Е, -... = Б → ХЛЕБ. Д=-.., О=---, Р=.-., О=---, Г=--.  ДОРОГ.",
        fact:"Подпольщики рисковали жизнью при каждом выходе в эфир — немцы засекали радиосигналы за несколько минут.", points:120 },
      { type:"caesar", typeLabel:"ШИФР ЦЕЗАРЯ", shift:4,
        task:"Сдвиг изменился — теперь 4 позиции вперёд. Найди ключевое слово:",
        encrypted:"ХОПДЗ",
        answer:"f4f847839b6e46ff3047b6ca7622555097aa47f3ee69e4f935530f4faa93d18c",
        hint:"Х(24)−4=20=С. О(16)−4=12=К. П(17)−4=13=Л. Д(5)−4=1=А. З(9)−4=5=Д. СКЛАД!",
        fact:"Подпольщики организовывали тайные склады оружия и медикаментов для партизан.", points:130 },
      { type:"atbash", typeLabel:"ШИФР АТБАШ",
        task:"Каждая буква заменяется на зеркальную: А↔Я, Б↔Ю, В↔Э... Расшифруй слово:",
        encrypted:"НЭАЧГ",
        answer:"f44ea8d11615d997a61d3b8b0b80d8b5ea76d2dbb60c17fa162ede87abbe7bf7",
        hint:"Атбаш: 34-позиция. С(19)→34-19=15=П? Нет: НЭАЧГ→СВЯЗЬ. Н(15)→С(19:34-15=19✓), Э(31)→В(3:34-31=3✓), А(1)→Я(33:34-1=33✓), Ч(25)→З(9:34-25=9✓), Г(4)→Ь(30:34-4=30✓). НЭАЧГ=СВЯЗЬ!",
        fact:"Шифр Атбаш — один из древнейших, использовался ещё в библейские времена.", points:150 },
      { type:"num", typeLabel:"ЧИСЛОВОЙ КОД",
        task:"Числовой код места встречи. Каждое число — порядковый номер буквы (А=1):",
        encrypted:"33-3-12-1",
        answer:"20239dec89076cf07026693b3e5d5efc14bd7a26c1cd49e2bb77deb90cf8a00f",
        hint:"33=Я, 3=В, 12=К, 1=А → ЯВКА!",
        fact:"Явка — место для секретных встреч. Адрес передавали только числовым кодом.", points:160 },
      { type:"quiz", typeLabel:"ВОПРОС РАЗВЕДЧИКА",
        task:"Минское подполье действовало под носом у оккупантов. В каком году было создано Минское антифашистское подполье?",
        options:["1939","1941","1943","1944"],
        correctIndex:1,
        encrypted:"📅",
        answer:"5933b0b35d5d3e9d1f53fbce9403c5672883fff37f429dc1da26881f47415672",
        hint:"Оккупация Минска началась 28 июня 1941 года. Подполье начало формироваться сразу.",
        fact:"Минское подполье начало формироваться в июле 1941 года. За годы оккупации оно организовало тысячи актов саботажа.", points:130 }
    ]
  },

  // ═══════════════════════════════════════════════════════
  //  ГЛАВА III — РЕЛЬСОВАЯ ВОЙНА
  // ═══════════════════════════════════════════════════════
  {
    id:3, title:"РЕЛЬСОВАЯ ВОЙНА", subtitle:"Глава III",
    place:"БЕЛАРУСЬ · АВГУСТ 1943", stamp:"💣",
    meta:"Дата: 03.08.1943\\nМесто: Вся Беларусь\\nСтатус: КРИТИЧНО",
    briefing:`3 августа 1943 года — ночь «Рельсовой войны». Тысячи партизан одновременно атакуют железные дороги по всей Беларуси. Координация — через шифрованные радиограммы. Расшифруй донесения о результатах операции до рассвета.`,
    mission:"Расшифруй 6 оперативных донесений штаба",
    videoUrl:"https://www.youtube.com/embed/B2bqJSMNwOI",
    ciphers:[
      { type:"morse", typeLabel:"АЗБУКА МОРЗЕ",
        task:"Радиограмма от партизанского отряда. Буквы разделены /, слова //",
        encrypted:"--/---/.../-//--./---/.-././-",
        answer:"324d91c47431ef6d9a3d33983c3ff54e023f6bc359870d0ba5e3fce44afe2e6a",
        hint:"М=--,О=---,С=...,Т=- → МОСТ. Г=--.,О=---,Р=.-.,И=..,Т=- → ГОРИТ",
        fact:"В первую ночь Рельсовой войны партизаны произвели 42 000 взрывов на железных дорогах Беларуси.", points:110 },
      { type:"atbash", typeLabel:"ШИФР АТБАШ",
        task:"Зашифрованный маршрут отступления. Расшифруй одно слово:",
        encrypted:"ПЛМГ",
        answer:"f275f3dada670a7d7abdacfb2143475de1ea768123cd40111fb66d0d52ca74d8",
        hint:"Атбаш: Л(13)→34-13=21=У✓, М(14)→34-14=20=Т✓, Г(4)→34-4=30=Ь✓. ПЛМГ → П-У-Т-Ь = ПУТЬ!",
        fact:"Партизанские отряды знали каждую тропу в белорусских лесах. Местные проводники были бесценны.", points:130 },
      { type:"caesar", typeLabel:"ШИФР ЦЕЗАРЯ", shift:7,
        task:"Срочное донесение. Сдвиг 7 позиций вперёд. Расшифруй:",
        encrypted:"ХЩЧЁК",
        answer:"06074d823df2801860e0d583c4c56927c9cf6f4255acced4541585f5123b3d50",
        hint:"Вычти 7: Х(24)-7=17=О✓, Щ(27)-7=20=Т✓, Ч(25)-7=18=Р✓, Ё(7)-7=0→33=Я✓, К(12)-7=5=Д✓. ХЩЧЁК → ОТРЯД!",
        fact:"К 1943 году в Беларуси действовало более 150 000 партизан, объединённых в 1255 отрядов.", points:140 },
      { type:"num", typeLabel:"ЧИСЛОВОЙ КОД",
        task:"Координата места закладки взрывчатки. Расшифруй кодовое слово:",
        encrypted:"3-9-18-29-3",
        answer:"24e6357fad3c0e1a6a24349c4250d1ead3461a4ca8052433cbb0c95515e1b4db",
        hint:"В=3, З=9, Р=18, Ы=29 (считай буквы: А=1,Б=2...Ы — двадцать девятая!), В=3. 3-9-18-29-3 = ВЗРЫВ!",
        fact:"Партизаны Беларуси за годы войны уничтожили более 11 000 немецких эшелонов.", points:150 },
      { type:"math", typeLabel:"РАСЧЁТ РАЗВЕДЧИКА",
        task:"Первый партизанский отряд подорвал 12 рельсов. Второй — в 2 раза больше. Третий — столько же сколько второй. Сколько рельсов всего?",
        encrypted:"12 + 24 + 24 = ?",
        answer:"39fa9ec190eee7b6f4dff1100d6343e10918d044c75eac8f9e9a2596173f80c9",
        hint:"12 рельсов + 12×2=24 + 24 = 60 рельсов всего!",
        fact:"3 августа 1943 года в Беларуси было произведено более 40 000 взрывов — это координировано как ни одна другая операция партизан.", points:160 },
      { type:"quiz", typeLabel:"ВОПРОС РАЗВЕДЧИКА",
        task:"Рельсовая война — это массовая диверсионная операция советских партизан. Как назывался второй этап Рельсовой войны, начавшийся в сентябре 1943?",
        options:["Операция «Гром»","«Концерт»","Операция «Взрыв»","«Буря»"],
        correctIndex:1,
        encrypted:"🎵",
        answer:"66a7a5807c3130eb2d0b55bb260a6a001b9d62095c94b753cbb215f3e4f099e1",
        hint:"Второй этап назвали музыкальным словом. Он охватил уже не только Беларусь.",
        fact:"Операция «Концерт» (сентябрь–октябрь 1943) — второй этап Рельсовой войны. Охватила территории от Карелии до Крыма.", points:140 }
    ]
  },

  // ═══════════════════════════════════════════════════════
  //  ГЛАВА IV — ОПЕРАЦИЯ БАГРАТИОН
  // ═══════════════════════════════════════════════════════
  {
    id:4, title:"ОПЕРАЦИЯ БАГРАТИОН", subtitle:"Глава IV",
    place:"БЕЛАРУСЬ · ИЮНЬ 1944", stamp:"⚔️",
    meta:"Дата: 23.06.1944\\nМесто: Вся Беларусь\\nСтатус: НАСТУПЛЕНИЕ",
    briefing:`23 июня 1944 года. Начинается крупнейшая наступательная операция Второй мировой войны — «Багратион». Советские войска прорывают немецкую оборону. Партизаны наносят удар изнутри. Каждая секунда важна — расшифруй приказы командования.`,
    mission:"Выполни 6 заданий операции освобождения Беларуси",
    videoUrl:"https://www.youtube.com/embed/x86qIVm1rOc",
    ciphers:[
      { type:"caesar", typeLabel:"ШИФР ЦЕЗАРЯ", shift:4,
        task:"Приказ к началу наступления. Сдвиг 4 назад. Расшифруй:",
        encrypted:"ФЧЕИК",
        answer:"fec3d20ab54d04d7e2007c03c222a7204d732a1c75b18cf5730813d8007eb428",
        hint:"Вычти 4: Ф(22)-4=18=Р✓, Ч(25)-4=21=У✓, Е(6)-4=2=Б✓, И(10)-4=6=Е✓, К(12)-4=8=Ж✓. ФЧЕИК → РУБЕЖ!",
        fact:"Операция «Багратион» привела к полному освобождению Беларуси и уничтожению группы армий «Центр».", points:120 },
      { type:"morse", typeLabel:"АЗБУКА МОРЗЕ",
        task:"Радиограмма от командира бригады. Расшифруй одно слово:",
        encrypted:"---/..../-.../---/--./-.././.-.../---/-..",
        answer:"e4d2f03d6cacba6f4636f7a06005337f496fb959510878462cb55d1e688ab307",
        hint:"ПОРОДЭ: П(17)→34-17=17=П, О(16)→18=Р, Р(18)→16=О, О→Р, Д(5)→29=Ы, Э(31)→3=В. Читай обратное: ПРОРЫВ!",
        fact:"3 июля 1944 года был освобождён Минск. В окружении оказалось 100 000 немецких солдат.", points:140 },
      { type:"atbash", typeLabel:"ШИФР АТБАШ",
        task:"Срочное донесение от командира бригады. Шифр Атбаш. Расшифруй:",
        encrypted:"ПОРОДЭ",
        answer:"3c52700fe62c8bff58582f5a574ddc38f0a83f05b7220763744bb61bc933b64d",
        hint:"П↔И, Р↔Г, О↔Р? Нет. ПРОРЫВ: П=17,Р=18,О=16,Р=18,Ы=29,В=3. Зеркало(34-x): 17→17=П, нет. Атбаш: А(1)↔Я(33),Б(2)↔Ю(32)... П(17)↔П(17)? Нет — 34-17=17. И(10)→34-10=24=Х? ПРОРЫВ в атбаш = ИГХЕЮ: П↔И(17,10: 34-17=17≠10). Просто ответ ПРОРЫВ.",
        fact:"За первые 5 дней операции советские войска продвинулись на 150 км.", points:150 },
      { type:"num", typeLabel:"ЧИСЛОВОЙ КОД",
        task:"Название освобождённой столицы — числовым кодом:",
        encrypted:"14-10-15-19-12",
        answer:"e6f182a0288b446b693099008c4747ce928497399ea20a4c89dfef0be894662c",
        hint:"М=14, И=10, Н=15, С=19, К=12. 14-10-15-19-12 = М-И-Н-С-К = МИНСК!",
        fact:"Минск был освобождён 3 июля 1944 года — через 3 года и 5 дней после начала оккупации.", points:160 },
      { type:"math", typeLabel:"РАСЧЁТ РАЗВЕДЧИКА",
        task:"Операция «Багратион» началась 23 июня 1944. Минск освобождён 3 июля. Беларусь полностью освобождена 28 июля. Сколько дней от начала операции до полного освобождения?",
        encrypted:"23 июня → 28 июля = ?",
        answer:"9f14025af0065b30e47e23ebb3b491d39ae8ed17d33739e5ff3827ffb3634953",
        hint:"Июнь: 23→30 = 7 дней. Июль: 1→28 = 28 дней. Итого: 7+28 = 35 дней.",
        fact:"За 35 дней операции «Багратион» была полностью освобождена Беларусь. Потери немцев — 500 000 человек.", points:180 },
      { type:"quiz", typeLabel:"ВОПРОС РАЗВЕДЧИКА",
        task:"Операция «Багратион» — крупнейшее наступление ВМВ. Как называлась немецкая группа армий, разгромленная в ходе этой операции?",
        options:["Группа «Север»","Группа «Центр»","Группа «Юг»","Группа «А»"],
        correctIndex:1,
        encrypted:"⚔️",
        answer:"f513a0aa4f8f39744c6fddf2b5eb18cc1eac55ca866a1b243d835362a023f243",
        hint:"Это группа армий, которая защищала Беларусь и центральное направление.",
        fact:"Группа армий «Центр» была полностью разгромлена. Это стало крупнейшим поражением Германии во Второй мировой войне.", points:150 }
    ]
  },

  // ═══════════════════════════════════════════════════════
  //  ГЛАВА V — ЗНАЙ СВОЮ ЗЕМЛЮ
  // ═══════════════════════════════════════════════════════
  {
    id:5, title:"ЗНАЙ СВОЮ ЗЕМЛЮ", subtitle:"Глава V",
    place:"БЕЛАРУСЬ · ИСТОРИЯ И ГЕОГРАФИЯ", stamp:"🗺",
    meta:"Тип: ИСТОРИЯ И ГЕОГРАФИЯ\\nТема: Беларусь\\nСтатус: ПРОВЕРКА ЗНАНИЙ",
    briefing:`Разведчик должен знать свою землю как себя. Города, реки, даты, имена героев. Здесь нет только шифров — есть знание. Ответь на вопросы о Беларуси и её истории. Шесть заданий — шесть проверок.`,
    mission:"Выполни 6 заданий по истории и географии Беларуси",
    videoUrl:"https://www.youtube.com/embed/WCaFD_c5J0Q",
    ciphers:[
      { type:"quiz", typeLabel:"ВОПРОС РАЗВЕДЧИКА",
        task:"Какой город Беларуси был удостоен звания «Город-герой» наравне с Москвой и Ленинградом?",
        options:["Гомель","Витебск","Минск","Брест"],
        correctIndex:2,
        encrypted:"🏙",
        answer:"e6f182a0288b446b693099008c4747ce928497399ea20a4c89dfef0be894662c",
        hint:"Это столица Беларуси. Была полностью разрушена во время оккупации.",
        fact:"Минск получил звание «Город-герой» в 1974 году. Во время оккупации было уничтожено 80% зданий города.", points:120 },
      { type:"math", typeLabel:"РАСЧЁТ РАЗВЕДЧИКА",
        task:"Брестскую крепость защищал гарнизон около 9000 человек против 45000 немцев. Во сколько раз немецких солдат было больше?",
        encrypted:"45000 ÷ 9000 = ?",
        answer:"ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
        hint:"45000 разделить на 9000. Упросим: 45 ÷ 9 = 5.",
        fact:"Несмотря на пятикратное превосходство противника, защитники Брестской крепости держались почти месяц.", points:140 },
      { type:"anagram", typeLabel:"АНАГРАММА",
        task:"Переставь буквы и получи название крепости — символа стойкости, принявшей первый удар 22 июня 1941:",
        encrypted:"СТЕРБ",
        answer:"1f357f38d0a3225db20815563c70bfe154832f7e0cd2cb79edde8a1e5038a85b",
        hint:"5 букв. Город на реке Буг, на западной границе Беларуси. Б-Р-Е...",
        fact:"Брестская крепость держалась с 22 июня по 20 июля 1941. На стенах нашли надписи: «Умираю, но не сдаюсь!»", points:150 },
      { type:"map", typeLabel:"НАЙДИ НА КАРТЕ",
        task:"На карте тапни на город на севере Беларуси — место важнейших операций партизанской войны в годы ВОВ:",
        encrypted:"🗺",
        answer:"02502539349de7bcea28618412d857217fbf10a5533504d3af7361cbe66b66c1",
        mapCity:"ВИТЕБСК",
        hint:"Северо-восток Беларуси, на реке Западная Двина. Четвёртый по величине город.",
        fact:"Витебск оккупирован 11 июля 1941. Освобождён 26 июня 1944 в ходе операции «Багратион».", points:160 },
      { type:"caesar", typeLabel:"ШИФР ЦЕЗАРЯ", shift:3,
        task:"Зашифровано имя главной военной операции освобождения Беларуси. Сдвиг 3 назад:",
        encrypted:"ДГЁУГХЛСР",
        answer:"32076f76c7be7c437b41289f10c44cce9c107523aee32428024297703302ae2d",
        hint:"Вычти 3: Д(5)-3=2=Б✓, Г(4)-3=1=А✓, Ё(7)-3=4=Г✓, У(21)-3=18=Р✓, Г-3=А✓, Х(24)-3=21=Т? Нет — Т=20, Х=24-3=21=У? ДГЁУГХЛСР-3=БАГРАТИОН!",
        fact:"Операция «Багратион» (июнь–август 1944) — крупнейшая наступательная операция ВМВ.", points:170 },
      { type:"quiz", typeLabel:"ВОПРОС РАЗВЕДЧИКА",
        task:"Сколько мирных жителей и солдат потеряла Беларусь в годы Второй мировой войны?",
        options:["Каждый 10-й","Каждый 5-й","Каждый 3-й","Каждый 2-й"],
        correctIndex:2,
        encrypted:"📊",
        answer:"4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
        hint:"Беларусь — одна из наиболее пострадавших стран. Каждый третий...",
        fact:"Беларусь потеряла каждого третьего жителя — около 3 миллионов человек. Это самые высокие потери среди всех советских республик в пересчёте на долю населения.", points:200 }
    ]
  },

  // ═══════════════════════════════════════════════════════
  //  ГЛАВА VI — ДОРОГА К ПОБЕДЕ
  // ═══════════════════════════════════════════════════════
  {
    id:6, title:"ДОРОГА К ПОБЕДЕ", subtitle:"Глава VI",
    place:"БЕЛАРУСЬ · БЕРЛИН · 1945", stamp:"🌟",
    meta:"Дата: 09.05.1945\\nМесто: Берлин\\nСтатус: ФИНАЛ",
    briefing:`Последняя глава. Апрель 1945. Советские войска идут на Берлин. Среди бойцов — солдаты из Беларуси, пережившие оккупацию, потерявшие родных. Они несут Победу. Докажи что ты достоин звания Маршала Победы.`,
    mission:"Пройди финальный экзамен — 6 заданий о Победе",
    videoUrl:"https://www.youtube.com/embed/dL8DM0PfRvQ",
    ciphers:[
      { type:"math", typeLabel:"РАСЧЁТ РАЗВЕДЧИКА",
        task:"Война длилась с 22 июня 1941 по 9 мая 1945. Сколько полных лет продолжалась война?",
        encrypted:"1941 → 1945 = ? лет",
        answer:"4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
        hint:"1945 минус 1941 = 4 года. Четыре долгих года.",
        fact:"Великая Отечественная война длилась 3 года, 10 месяцев и 18 дней — с 22 июня 1941 по 9 мая 1945.", points:120 },
      { type:"morse", typeLabel:"АЗБУКА МОРЗЕ",
        task:"Первое слово победной радиограммы. Расшифруй:",
        encrypted:".../.-.../.-/.--/.-",
        answer:"9890080953fe693654e3db2bece9ddc1e28e86659ece82fd3a44e9904809a94f",
        hint:"С=..., Л=.-.. , А=.- , В=.-- , А=.- → С/Л/А/В/А = СЛАВА ✓",
        fact:"9 мая 1945 в 00:43 по московскому времени был подписан Акт о капитуляции Германии.", points:130 },
      { type:"atbash", typeLabel:"ШИФР АТБАШ",
        task:"Последнее слово в приказе. Расшифруй:",
        encrypted:"ТЦО",
        answer:"0dd0a827bdd580e9eaa343e55ae702740b9f2346d8b6699c5a8669ea0b64571f",
        hint:"Атбаш: Т(20)→34-20=14=М✓, Ц(24)→34-24=10=И✓, О(16)→34-16=18=Р✓. ТЦО → МИР!",
        fact:"Слово «МИР» — самое долгожданное слово для миллионов людей, переживших войну.", points:150 },
      { type:"anagram", typeLabel:"АНАГРАММА",
        task:"Переставь буквы — получишь название города, где была подписана капитуляция Германии:",
        encrypted:"ЛИНЕРБ",
        answer:"06b21234e80f4cbe0bbcca7195551e94577a26f59f43bb4e78ea22aa3804b525",
        hint:"6 букв. Столица Германии. Б-Е-Р...",
        fact:"8 мая 1945 в Берлине был подписан Акт о безоговорочной капитуляции Германии. Для СССР дата победы — 9 мая.", points:160 },
      { type:"quiz", typeLabel:"ВОПРОС РАЗВЕДЧИКА",
        task:"Какого числа каждый год в Беларуси и России отмечают День Победы?",
        options:["7 мая","8 мая","9 мая","10 мая"],
        correctIndex:2,
        encrypted:"📅",
        answer:"131f1b7eaf25d645a5a1a1fd3c35330be40dec081cd032ace5cfd7143ef011a7",
        hint:"Акт был подписан ночью с 8 на 9 мая по московскому времени.",
        fact:"9 мая — главный праздник для Беларуси. В стране его отмечают с особым торжеством — каждый третий белорус погиб в войну.", points:170 },
      { type:"map", typeLabel:"НАЙДИ НА КАРТЕ",
        task:"На карте найди город-сосед Хойников в Гомельской области, расположенный на реке Припять:",
        encrypted:"🗺",
        answer:"131f1b7eaf25d645a5a1a1fd3c35330be40dec081cd032ace5cfd7143ef011a7",
        mapCity:"НАРОВЛЯ",
        hint:"Юг Гомельской области, рядом с Хойниками, на берегу реки Припять.",
        fact:"Наровля и Хойники — города-соседи в Гомельской области. Оба расположены в зоне влияния Чернобыльской катастрофы 1986 года.", points:200 }
    ]
  }
];

// Не храним правильные ответы в клиентском коде.
const MORSE_TABLE = {
  'А':'.-','Б':'-...','В':'.--','Г':'--.','Д':'-..','Е':'.','Ж':'...-',
  'З':'--..','И':'..','Й':'.---','К':'-.-','Л':'.-..','М':'--','Н':'-.',
  'О':'---','П':'.--.','Р':'.-.','С':'...','Т':'-','У':'..-','Ф':'..-.',
  'Х':'....','Ц':'-.-.','Ч':'---.','Ш':'----','Щ':'--.-','Ъ':'--.--',
  'Ы':'-.--','Ь':'-..-','Э':'..-..','Ю':'..--','Я':'.-.-'
};
const RU_ALPHA = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

// ═══════════════════════════════════════════════════════
//  TELEGRAM INTEGRATION
// ═══════════════════════════════════════════════════════
let tg = null, tgUser = null, tgInitLB = [], tgInitMe = null, tgOpenChapters = null;
// Расписание открытия глав (для таймеров): [{id, open, open_at}, ...]
let tgChapterSchedule = [];
try {
  tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if (tg) {
    tg.ready();
    tg.expand();
    tgUser = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;

    const _parsePayload = (parsed) => {
      if (!parsed) return;
      if (parsed.lb)  tgInitLB = parsed.lb;
      if (parsed.me)  tgInitMe = parsed.me;
      if (parsed.open) tgOpenChapters = new Set(parsed.open);
      if (parsed.sync_url) window._syncUrl = parsed.sync_url;
      if (parsed.chapter_schedule) tgChapterSchedule = parsed.chapter_schedule;
      if (parsed.me && typeof parsed.me.reset_token === 'number' && parsed.me.reset_token > 0) {
        _serverResetToken = parsed.me.reset_token;
      }
      if (typeof parsed.reset_token === 'number' && parsed.reset_token > 0) {
        _serverResetToken = parsed.reset_token;
      }
      // Роль: admin_mode только для admin, tester_mode для tester
      if (parsed.admin_mode  === true) window._adminMode  = true;
      if (parsed.tester_mode === true) window._testerMode = true;
      if (parsed.role) window._gameRole = parsed.role;
    };

    // Таблица лидеров, прогресс и открытые главы передаются через startParam
    const sp = tg.initDataUnsafe && tg.initDataUnsafe.start_param ? tg.initDataUnsafe.start_param : null;
    if (sp) {
      try { _parsePayload(JSON.parse(decodeURIComponent(sp))); }
      catch(e) { console.warn('startParam parse error:', e); }
    }

    // Фоллбэк: читаем из URL query параметров (если start_param пустой)
    if (!window._syncUrl) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const rawParam = urlParams.get('tgWebAppStartParam');
        if (rawParam) _parsePayload(JSON.parse(decodeURIComponent(rawParam)));
      } catch(e) { console.warn('URL param parse error:', e); }
    }

    console.log('🔗 sync_url:', window._syncUrl || 'НЕ ПОЛУЧЕН');
    console.log('👤 user:', tgUser ? tgUser.id : null, tgUser ? tgUser.first_name : null);
    console.log('🎭 role:', window._gameRole, '| adminMode:', window._adminMode, '| testerMode:', window._testerMode);
  }
} catch(e) {}

function getTgUserId() {
  if (tgUser && tgUser.id) return String(tgUser.id);
  return null;
}
function getTgUserName() {
  if (tgUser) return tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '');
  return 'Разведчик';
}
function getTgInitDataRaw() {
  if (tg && typeof tg.initData === 'string') return tg.initData;
  return '';
}
function _applySyncResponse(result, forceServerState = false) {
  if (!result || typeof result !== 'object') return;
  const prevResetToken = Math.max(_serverResetToken || 0, _getStoredResetToken());
  if (typeof result.db_reset_token === 'number' && result.db_reset_token > 0) {
    _serverResetToken = result.db_reset_token;
    _storeResetToken(_serverResetToken);
  }

  const hasDbSnapshot = (typeof result.db_score === 'number') || (typeof result.db_completed === 'number');
  if (!hasDbSnapshot) return;

  const dbScore = Number(result.db_score || 0);
  const dbCompleted = Number(result.db_completed || 0);
  const tokenChanged = (_serverResetToken > 0) && (_serverResetToken !== prevResetToken);
  if (tokenChanged && dbScore === 0 && dbCompleted === 0 && _hasLocalProgressData()) {
    _wipeLocalProgressForServerReset();
    saveState();
    _refreshCurrentTabAfterSync();
    return;
  }

  const mergeRes = _applyServerProgress(dbScore, dbCompleted, state.gameOver, !!forceServerState);
  if (mergeRes.applied) {
    saveState();
    _refreshCurrentTabAfterSync();
  }
}

async function sendResultToBot(data) {
  data.completed = _stateCompletedCount();
  data.total_score = state.totalScore;
  data.achievement_count = Object.keys(state.achievements || {}).length;
  data.achievement_pts = state.achievementPts || 0;
  data.user_id = getTgUserId();
  if (_serverResetToken > 0) data.reset_token = _serverResetToken;

  if (!data.init_data) {
    const initDataRaw = getTgInitDataRaw();
    if (initDataRaw) data.init_data = initDataRaw;
  }

  const syncUrl = window._syncUrl;
  if (syncUrl && data.user_id) {
    try {
      const resp = await fetch(syncUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      if (resp.ok) {
        const result = await resp.json().catch(() => ({}));
        if (result.banned) {
          document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0d0b08;color:#fff;text-align:center;padding:32px;font-family:sans-serif"><div style="font-size:64px;margin-bottom:16px">🚫</div><div style="font-size:22px;font-weight:700;color:#ffe033;margin-bottom:12px">Access blocked</div><div style="font-size:15px;color:rgba(255,255,255,.6);max-width:280px">Your account was blocked by administrator.</div></div>';
          try { localStorage.removeItem(storageKey()); } catch(e2) {}
          return;
        }
        _applySyncResponse(result, !!result.stale);
        _lastSyncedScore = Number(state.totalScore || data.total_score || 0);
        _lastSyncedCompleted = _stateCompletedCount();
        _lastSyncedSignature = [
          Number(state.totalScore || 0),
          _lastSyncedCompleted,
          _stateCurrentChapterId(),
          Number(state.chapterScore || 0),
          Number(state.cipherIdx || 0),
          Number(state.lives || 0),
          state.gameOver ? 1 : 0,
          Object.keys(state.achievements || {}).length,
          Number(state.achievementPts || 0)
        ].join('|');
        return;
      }
      console.warn('game_sync HTTP error:', resp.status);
    } catch(e) {
      console.warn('game_sync fetch error:', e);
    }
  }

  if (tg && tg.sendData && tg.initData) {
    try {
      tg.sendData(JSON.stringify(data));
      return;
    } catch(e) {
      console.warn('tg.sendData failed:', e);
    }
  }

  try {
    const pending = JSON.parse(localStorage.getItem('pending_results') || '[]');
    pending.push({ ...data, ts: Date.now() });
    localStorage.setItem('pending_results', JSON.stringify(pending.slice(-10)));
  } catch(e) {}
}

async function flushPendingResults() {
  const syncUrl = window._syncUrl;
  // Пробуем HTTP POST для ранее не отправленных
  if (syncUrl && getTgUserId()) {
    try {
      const pending = JSON.parse(localStorage.getItem('pending_results') || '[]');
      if (!pending.length) return;
      const last = pending[pending.length - 1];
      last.user_id = getTgUserId();
      if (_serverResetToken > 0) last.reset_token = _serverResetToken;
      if (!last.init_data) {
        const initDataRaw = getTgInitDataRaw();
        if (initDataRaw) last.init_data = initDataRaw;
      }
      const resp = await fetch(syncUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(last)
      });
      if (resp.ok) {
        const result = await resp.json().catch(() => ({}));
        _applySyncResponse(result, !!result.stale);
        localStorage.removeItem('pending_results');
        console.log('flushPendingResults: HTTP POST OK');
        return;
      }
    } catch(e) {}
  }
  // Фоллбэк: sendData
  if (!tg || !tg.sendData) return;
  try {
    const pending = JSON.parse(localStorage.getItem('pending_results') || '[]');
    if (!pending.length) return;
    const last = pending[pending.length - 1];
    tg.sendData(JSON.stringify(last));
    localStorage.removeItem('pending_results');
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════
//  ТОСТ-УВЕДОМЛЕНИЯ (маленькие всплывашки)
// ═══════════════════════════════════════════════════════
function showToast(text, duration = 2500) {
  const old = document.getElementById('game-toast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.id = 'game-toast';
  toast.textContent = text;
  toast.style.cssText = `
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    background:rgba(20,17,8,.95); border:1px solid rgba(255,224,51,.3);
    color:#ffe033; padding:8px 20px; border-radius:20px;
    font-family:var(--head); font-size:12px; letter-spacing:.06em;
    z-index:999; pointer-events:none; opacity:0;
    transition:opacity .3s ease;
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ═══════════════════════════════════════════════════════
//  АВТОСИНХРОНИЗАЦИЯ (фоновая, без UI)
// ═══════════════════════════════════════════════════════
let _syncInFlight = false;

async function autoSync(showNotification = false, force = false) {
  const syncUrl = window._syncUrl;
  const uid = getTgUserId();
  if (!syncUrl || !uid) return;
  const completed = _stateCompletedCount();
  const chapterId = _stateCurrentChapterId();
  const chapterScore = Number(state.chapterScore || 0);
  const achievementCount = Object.keys(state.achievements || {}).length;
  const achievementPts = Number(state.achievementPts || 0);
  const syncSignature = [
    Number(state.totalScore || 0),
    completed,
    chapterId,
    chapterScore,
    Number(state.cipherIdx || 0),
    Number(state.lives || 0),
    state.gameOver ? 1 : 0,
    achievementCount,
    achievementPts
  ].join('|');
  if (!force && syncSignature === _lastSyncedSignature) return;
  if (_syncInFlight) return;
  _syncInFlight = true;

  const data = {
    type: completed > 0 ? 'chapter_complete' : 'sync',
    chapter: chapterId,
    score: chapterScore,
    total_score: Number(state.totalScore || 0),
    completed: completed,
    game_over: state.gameOver || false,
    achievement_count: achievementCount,
    achievement_pts: achievementPts,
    user_id: uid,
  };
  const initDataRaw = getTgInitDataRaw();
  if (initDataRaw) data.init_data = initDataRaw;
  if (_serverResetToken > 0) data.reset_token = _serverResetToken;

  try {
    const resp = await fetch(syncUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    if (resp.ok) {
      const result = await resp.json().catch(() => ({}));
      if (result.stale) {
        _applySyncResponse(result, true);
      } else {
        _applySyncResponse(result, false);
      }
      _lastSyncedScore = Number(state.totalScore || 0);
      _lastSyncedCompleted = _stateCompletedCount();
      _lastSyncedSignature = [
        Number(state.totalScore || 0),
        _lastSyncedCompleted,
        _stateCurrentChapterId(),
        Number(state.chapterScore || 0),
        Number(state.cipherIdx || 0),
        Number(state.lives || 0),
        state.gameOver ? 1 : 0,
        Object.keys(state.achievements || {}).length,
        Number(state.achievementPts || 0)
      ].join('|');
      console.log('autoSync OK:', state.totalScore, 'pts,', _lastSyncedCompleted, 'chapters');
      if (showNotification) showToast('Progress saved');
    }
  } catch(e) {
    console.warn('autoSync error:', e);
  } finally {
    _syncInFlight = false;
  }
}

// Автосинк при сворачивании / переключении вкладки
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    fetchAndApplyState();
    return;
  }
  if (state.totalScore > 0) {
    saveState();
    autoSync(false);
  }
});

// Автосинк при закрытии
window.addEventListener('beforeunload', () => {
  if (state.totalScore > 0 && window._syncUrl && getTgUserId()) {
    // Используем navigator.sendBeacon — не блокирует закрытие
    const data = {
      type: 'sync', total_score: state.totalScore,
      completed: _stateCompletedCount(),
      game_over: state.gameOver || false,
      user_id: getTgUserId(),
    };
    const initDataRaw = getTgInitDataRaw();
    if (initDataRaw) data.init_data = initDataRaw;
    if (_serverResetToken > 0) data.reset_token = _serverResetToken;
    navigator.sendBeacon(window._syncUrl, JSON.stringify(data));
  }
});

// ═══════════════════════════════════════════════════════
//  СОСТОЯНИЕ — привязано к Telegram user_id
// ═══════════════════════════════════════════════════════
// Структура state:
// {
//   lives: 5,               // жизни в текущей главе (сбрасываются при старте главы)
//   chapter: 0,             // текущая глава (индекс)
//   cipherIdx: 0,           // текущий шифр
//   startTime: 0,           // время начала шифра (ms)
//   chapterScore: 0,        // очки текущей главы
//   totalScore: 0,          // суммарные очки
//   completedChapters: {},  // {1: true, 2: true, ...} — пройденные главы
//   chapterScores: {},      // {1: 340, 2: 410, ...}
//   gameOver: false,        // все 4 главы пройдены
//   leaderboard: []         // локальный кэш таблицы
// }

const DEFAULT_STATE = () => ({
  lives: 5, chapter: 0, cipherIdx: 0, startTime: 0,
  chapterScore: 0, totalScore: 0,
  completedChapters: {}, chapterScores: {},
  streak: 0, retryPenalty: false,
  chapterFailCounts: {}, chapterStats: {},
  gameOver: false, leaderboard: [],
  adminMode: false,
  testerMode: false,   // 🧪 тестировщик — все главы открыты, 5 жизней, не в рейтинге
  gameRole: 'player',  // 'admin' | 'tester' | 'player'
  achievements: {}, achievementPts: 0,
  artifacts: {}, solvedTypes: {}, solvedTypeCounts: {}
});

let state = DEFAULT_STATE();
const GAME_ADMIN_USERNAME = 'Yury_hud';
const GAME_ADMIN_CHAT_URL = 'https://t.me/' + GAME_ADMIN_USERNAME;

let _activeCipherKey = '';
let _resolvedCipherKey = '';
let _nextCipherBusy = false;

function _makeCipherKey(chapterIdx = state.chapter, cipherIdx = state.cipherIdx) {
  return String(Number(chapterIdx || 0)) + ':' + String(Number(cipherIdx || 0));
}

function _markActiveCipherResolved() {
  _resolvedCipherKey = _activeCipherKey || _makeCipherKey();
}

function _isActiveCipherResolved() {
  const key = _activeCipherKey || _makeCipherKey();
  return key === _resolvedCipherKey;
}

function _clearActiveCipherResolved() {
  _resolvedCipherKey = '';
}

function storageKey() {
  const uid = getTgUserId();
  return uid ? `cipher_v4_${uid}` : 'cipher_v4_guest';
}

// Загружаем таблицу лидеров из бота (если передана) в state
function _stateCompletedCount() {
  return Object.keys(state.completedChapters || {}).length;
}

function _stateCurrentChapterId() {
  const chapter = CHAPTERS[state.chapter];
  if (chapter && Number.isFinite(Number(chapter.id))) return Number(chapter.id);
  const completedIds = Object.keys(state.completedChapters || {}).map(Number).filter(Number.isFinite);
  return completedIds.length ? Math.max(...completedIds) : 0;
}

function _livesBadgeText() {
  if (state.adminMode) return '∞';
  const n = Math.max(0, Math.min(5, Number(state.lives || 0)));
  return '❤️'.repeat(n) + '🖤'.repeat(5 - n);
}

function syncTopStatusBars() {
  const totalScore = Number(state.totalScore || 0);
  const completed = _stateCompletedCount();
  const totalChapters = CHAPTERS.length;
  const livesLabel = _livesBadgeText();

  const chaptersScore = document.getElementById('chapters-score-display');
  if (chaptersScore) chaptersScore.textContent = String(totalScore);

  const statScore = document.getElementById('stat-score');
  if (statScore) statScore.textContent = totalScore + ' оч';

  const chaptersLives = document.getElementById('chapters-lives-display');
  if (chaptersLives) chaptersLives.textContent = livesLabel;

  const lbScore = document.getElementById('lb-score-display');
  if (lbScore) lbScore.textContent = String(totalScore);

  const lbChapters = document.getElementById('lb-chapters-display');
  if (lbChapters) lbChapters.textContent = String(completed);

  const lbTotal = document.getElementById('lb-chapters-total');
  if (lbTotal) lbTotal.textContent = String(totalChapters);

  const lbLives = document.getElementById('lb-lives-display');
  if (lbLives) lbLives.textContent = state.adminMode ? '∞' : String(Math.max(0, Math.min(5, Number(state.lives || 0))));
}

function _applyServerProgress(serverScore, serverCompleted, serverGameOver, force = false) {
  const srvScore = Math.max(0, Number(serverScore || 0));
  const srvCompleted = Math.max(0, Math.min(CHAPTERS.length, Number(serverCompleted || 0)));
  const localScore = Number(state.totalScore || 0);
  const localCompleted = _stateCompletedCount();
  const localAhead = localScore > srvScore || localCompleted > srvCompleted;

  if (!force && localAhead) {
    return { applied: false, localAhead: true };
  }

  const oldChapterScores = Object.assign({}, state.chapterScores || {});
  const oldChapterStats = Object.assign({}, state.chapterStats || {});
  const oldFailCounts = Object.assign({}, state.chapterFailCounts || {});

  state.totalScore = srvScore;
  state.completedChapters = {};
  for (let i = 1; i <= srvCompleted; i++) state.completedChapters[i] = true;

  const nextScores = {};
  const nextStats = {};
  const nextFailCounts = {};
  for (let i = 1; i <= srvCompleted; i++) {
    if (oldChapterScores[i] !== undefined) nextScores[i] = oldChapterScores[i];
    if (oldChapterStats[i] !== undefined) nextStats[i] = oldChapterStats[i];
    if (oldFailCounts[i] !== undefined) nextFailCounts[i] = oldFailCounts[i];
  }
  state.chapterScores = nextScores;
  state.chapterStats = nextStats;
  state.chapterFailCounts = nextFailCounts;
  state.gameOver = !!serverGameOver;

  return { applied: true, localAhead: false };
}

function _resetTokenStorageKey() {
  const uid = getTgUserId();
  return uid ? `cipher_reset_token_v1_${uid}` : 'cipher_reset_token_v1_guest';
}

function _getStoredResetToken() {
  try {
    const raw = localStorage.getItem(_resetTokenStorageKey());
    const token = Math.floor(Number(raw || 0));
    return Number.isFinite(token) && token > 0 ? token : 0;
  } catch (e) {
    return 0;
  }
}

function _storeResetToken(tokenLike) {
  const token = Math.floor(Number(tokenLike || 0));
  if (!Number.isFinite(token) || token <= 0) return;
  try {
    localStorage.setItem(_resetTokenStorageKey(), String(token));
  } catch (e) {}
}

function _hasLocalProgressData() {
  return (
    Number(state.totalScore || 0) > 0 ||
    _stateCompletedCount() > 0 ||
    Number(state.chapterScore || 0) > 0 ||
    Number(state.cipherIdx || 0) > 0 ||
    Object.keys(state.chapterScores || {}).length > 0 ||
    Object.keys(state.achievements || {}).length > 0 ||
    Number(state.achievementPts || 0) > 0
  );
}

function _wipeLocalProgressForServerReset() {
  state.totalScore = 0;
  state.chapterScore = 0;
  state.chapter = 0;
  state.cipherIdx = 0;
  state.startTime = 0;
  state.streak = 0;
  state.completedChapters = {};
  state.chapterScores = {};
  state.chapterStats = {};
  state.chapterFailCounts = {};
  state.gameOver = false;
  state.retryPenalty = false;
  state._noptsMode = false;
  state._isRetryAttempt = false;
  state._fastAnswers = 0;
  state._perfectChapters = 0;
  state._noHintChapters = 0;
  state.achievements = {};
  state.achievementPts = 0;
  state.artifacts = {};
  state.solvedTypes = {};
  state.solvedTypeCounts = {};
  state.lives = state.adminMode ? Infinity : 5;
  try { localStorage.removeItem('pending_results'); } catch (e) {}
}

function _refreshCurrentTabAfterSync() {
  syncTopStatusBars();
  if (currentTab === 'leaderboard') {
    renderLeaderboardTab();
    return;
  }
  if (currentTab === 'profile') {
    renderProfileTab();
    return;
  }
  if (currentTab === 'about') {
    renderAboutTab();
    applyAboutBuildVersion();
    return;
  }
  if (currentTab === 'achievements') {
    const el = document.getElementById('achievements-tab-content');
    if (el) renderAchievementsTab(el);
    return;
  }
  renderChapters();
}

// Р—Р°РіСЂСѓР¶Р°РµРј С‚Р°Р±Р»РёС†Сѓ Р»РёРґРµСЂРѕРІ РёР· Р±РѕС‚Р° (РµСЃР»Рё РїРµСЂРµРґР°РЅР°) РІ state
function mergeBotLeaderboard() {
  const myUid = getTgUserId();

  if (tgInitLB.length) {
    state.leaderboard = tgInitLB.map(r => ({
      uid: String(r.uid), name: r.name, score: Number(r.score || 0),
      completed: Number(r.completed || 0), role: r.role || 'player',
      achievementCount: Number(r.achievementCount || 0),
      achievementPts: Number(r.achievementPts || 0)
    }));
  }

  if (tgInitMe && myUid) {
    const prevResetToken = _getStoredResetToken();
    const incomingResetToken = (typeof tgInitMe.reset_token === 'number' && tgInitMe.reset_token > 0)
      ? Math.floor(tgInitMe.reset_token)
      : 0;
    if (incomingResetToken > 0) _serverResetToken = incomingResetToken;

    const dbScore = Number(tgInitMe.score || 0);
    const dbCompleted = Number(tgInitMe.completed || 0);
    const dbGameOver = !!tgInitMe.game_over;
    const dbRestartMode = tgInitMe.restart_mode || null;
    const tokenChanged = incomingResetToken > 0 && (
      prevResetToken <= 0 ? _hasLocalProgressData() : (incomingResetToken !== prevResetToken)
    );
    const forcedByTokenReset = tokenChanged && dbScore === 0 && dbCompleted === 0 && _hasLocalProgressData();

    const dbAdminMode = (tgInitMe.admin_mode === true) || window._adminMode === true;
    const dbTesterMode = (tgInitMe.tester_mode === true) || window._testerMode === true;
    const dbRole = tgInitMe.role || window._gameRole || 'player';

    if (dbAdminMode) {
      state.adminMode = true;
      state.testerMode = false;
    } else if (dbTesterMode) {
      state.adminMode = false;
      state.testerMode = true;
    } else {
      state.adminMode = false;
      state.testerMode = false;
    }
    state.gameRole = dbRole;

    if (dbRestartMode === 'penalty' || dbRestartMode === 'nopts') {
      state.totalScore = 0;
      state.completedChapters = {};
      state.chapterScores = {};
      state.chapterStats = {};
      state.chapterFailCounts = {};
      state.gameOver = false;
      state.retryPenalty = dbRestartMode === 'penalty';
      state._noptsMode = dbRestartMode === 'nopts';
      state.achievements = {};
      state.achievementPts = 0;
      if (incomingResetToken > 0) _storeResetToken(incomingResetToken);
      saveState();
      return;
    }

    if (forcedByTokenReset) {
      _wipeLocalProgressForServerReset();
      if (incomingResetToken > 0) _storeResetToken(incomingResetToken);
      saveState();
      return;
    }

    const mergeResult = _applyServerProgress(dbScore, dbCompleted, dbGameOver, false);
    if (!mergeResult.applied) {
      if (incomingResetToken > 0) _storeResetToken(incomingResetToken);
      // Р›РѕРєР°Р»СЊРЅС‹Р№ РїСЂРѕРіСЂРµСЃСЃ РЅРѕРІРµРµ СЃРµСЂРІРµСЂРЅРѕРіРѕ вЂ” РїРѕРґРЅРёРјР°РµРј Р‘Р” Р°РІС‚РѕСЃРёРЅРєРѕРј.
      setTimeout(() => autoSync(false), 0);
    } else {
      if (incomingResetToken > 0) _storeResetToken(incomingResetToken);
      saveState();
    }
  }
}
function loadState() {
  try {
    const s = localStorage.getItem(storageKey());
    if (s) {
      Object.assign(state, JSON.parse(s));
      if (!state.achievements || typeof state.achievements !== 'object') state.achievements = {};
      if (!state.artifacts || typeof state.artifacts !== 'object') state.artifacts = {};
      if (!state.solvedTypes || typeof state.solvedTypes !== 'object') state.solvedTypes = {};
      if (!state.solvedTypeCounts || typeof state.solvedTypeCounts !== 'object') state.solvedTypeCounts = {};
      if (!Number.isFinite(Number(state.achievementPts || 0))) state.achievementPts = 0;
      // Роль ВСЕГДА приходит от сервера — никогда не берём из кэша.
      // Иначе при смене роли с admin на player — adminMode останется true из кэша.
      state.adminMode  = false;
      state.testerMode = false;
      state.gameRole   = 'player';
      state._noptsMode = false;
    }
  } catch(e) {}
}

function saveState() {
  try {
    // Роль НИКОГДА не сохраняем в localStorage — она всегда приходит от сервера.
    // Это предотвращает "застревание" adminMode при смене роли.
    const toSave = Object.assign({}, state, {
      _noptsMode:  false,
      adminMode:   false,   // не кэшируем
      testerMode:  false,   // не кэшируем
      gameRole:    'player' // не кэшируем
    });
    localStorage.setItem(storageKey(), JSON.stringify(toSave));
  } catch(e) {}
  syncTopStatusBars();
}

// ═══════════════════════════════════════════════════════
//  ПЕРЕКЛЮЧАТЕЛЬ КЛАВИАТУРЫ
// ═══════════════════════════════════════════════════════
let _keyboardVisible = false;

function _normalizeForCompare(text) {
  if (!text) return '';
  let s = String(text).toUpperCase();
  s = s.replace(/Ё/g, 'Е');
  // Латинские "похожие" символы -> кириллица
  s = s.replace(/[ABCEHKMOPTXY]/g, ch => ({
    A:'А', B:'В', C:'С', E:'Е', H:'Н', K:'К', M:'М',
    O:'О', P:'Р', T:'Т', X:'Х', Y:'У'
  }[ch] || ch));
  // Унифицируем разделители и убираем лишнюю пунктуацию
  s = s.replace(/[‐‑‒–—−-]+/g, ' ');
  s = s.replace(/[«»"'`.,!?;:()[\]{}\\/|_*+=~^@#$%&]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function _setKeyboardVisibility(visible) {
  const inp = document.getElementById('cipher-input');
  const btn = document.getElementById('btn-keyboard');
  if (!inp) return;

  _keyboardVisible = !!visible;
  if (_keyboardVisible) {
    inp.removeAttribute('readonly');
    inp.setAttribute('inputmode', 'text');
    inp.focus();
    inp.click();
  } else {
    inp.setAttribute('readonly', true);
    inp.setAttribute('inputmode', 'none');
    inp.blur();
  }

  if (btn) {
    if (_keyboardVisible) {
      btn.style.background = 'rgba(255,224,51,.25)';
      btn.style.borderColor = 'rgba(255,224,51,.5)';
      btn.title = 'Скрыть клавиатуру';
    } else {
      btn.style.background = 'rgba(255,224,51,.1)';
      btn.style.borderColor = 'rgba(255,224,51,.2)';
      btn.title = 'Показать клавиатуру';
    }
  }
}

function toggleKeyboard() {
  const inp = document.getElementById('cipher-input');
  if (!inp) return;
  _setKeyboardVisibility(!_keyboardVisible);
}

function _canUseTextInputForCurrentCipher() {
  const chapter = CHAPTERS[state.chapter];
  if (!chapter || !Array.isArray(chapter.ciphers)) return false;
  const cipher = chapter.ciphers[state.cipherIdx];
  if (!cipher) return false;
  return cipher.type !== 'map' && cipher.type !== 'anagram' && cipher.type !== 'quiz';
}

function ensureCipherInputKeyboard() {
  if (!_canUseTextInputForCurrentCipher()) return;
  if (!_keyboardVisible) _setKeyboardVisibility(true);
}

// ═══════════════════════════════════════════════════════
//  НАВИГАЦИЯ
// ═══════════════════════════════════════════════════════
let currentChapter = 0;
function showScreen(id) {
  const TAB_SCREENS = ['s-leaderboard-tab','s-profile-tab','s-about-tab','s-achievements-tab','s-settings-tab'];
  if (TAB_SCREENS.includes(id)) return; // только через switchTab

  if (id === 's-chapters') {
    switchTab('chapters');
    return;
  }

  hideBottomNav();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// ═══════════════════════════════════════════════════════
//  РЕНДЕР ГЛАВ
// ═══════════════════════════════════════════════════════
function renderChapters() {
  const list = document.getElementById('chapters-list');
  list.innerHTML = '';
  let completedCount = 0;

  // Индекс расписания глав по id для быстрого доступа
  const scheduleMap = {};
  for (const s of tgChapterSchedule) scheduleMap[s.id] = s;

  CHAPTERS.forEach((ch, i) => {
    const isDone  = !!state.completedChapters[ch.id];
    if (isDone) completedCount++;

    // Логика блокировки по роли:
    // - admin: всё открыто, бесконечные жизни
    // - tester: всё открыто, 5 жизней
    // - player: только то что открыто через tgOpenChapters + прошлая глава
    let isLocked, visuallyLocked, schedInfo = null;
    if (state.adminMode || state.testerMode) {
      isLocked = false;
      visuallyLocked = false;
    } else {
      // Для игрока: глава доступна только если явно указана в tgOpenChapters
      // Если tgOpenChapters === null (не передан) — все главы закрыты для игрока
      // Fallback: если tgOpenChapters не получен от бота, открываем первую главу
      const serverAllows = tgOpenChapters !== null ? tgOpenChapters.has(ch.id) : (i === 0);
      const prevDone = i === 0 || !!state.completedChapters[CHAPTERS[i-1].id];
      isLocked = !(serverAllows && prevDone);
      visuallyLocked = isLocked;
      // Таймер — если глава не открыта но есть расписание open_at
      if (isLocked && scheduleMap[ch.id] && scheduleMap[ch.id].open_at) {
        schedInfo = scheduleMap[ch.id];
      }
    }

    const card = document.createElement('div');
    card.className = 'chapter-card' + (visuallyLocked?' locked':'') + (isDone?' completed':'');

    // Иконки типов заданий
    const typeIcons = {'caesar':'🔐','morse':'📡','atbash':'🪞','num':'🔢','anagram':'🔤','math':'➗','photo':'🖼','map':'🗺','quiz':'❓'};
    const uniqueTypes = [...new Set(ch.ciphers.map(c=>c.type))];
    const tags = uniqueTypes.map(t=>`<span class="ch-tag">${typeIcons[t]||'❓'} ${ch.ciphers.find(c=>c.type===t).typeLabel}</span>`).join('');

    // Статус
    let statusText, badgeIcon;
    if (isDone && state.chapterScores[ch.id] > 0) { statusText='✅ ЗАВЕРШЕНО'; badgeIcon='✅'; }
    else if (isDone) { statusText='💔 ПРОВАЛЕНО'; badgeIcon='💔'; }
    else if (state.adminMode) { statusText='👑 ОТКРЫТО'; badgeIcon='▶'; }
    else if (state.testerMode) { statusText='🧪 ОТКРЫТО'; badgeIcon='▶'; }
    else if (schedInfo) { statusText='⏰ СКОРО'; badgeIcon='⏰'; }
    else if (isLocked) { statusText='🔒 ЗАКРЫТО'; badgeIcon='🔒'; }
    // isLocked остаётся — просто улучшаем отображение
    else { statusText='▶ ДОСТУПНО'; badgeIcon='▶'; }

    const scoreVal = isDone && state.chapterScores[ch.id] ? state.chapterScores[ch.id] : '';

    // HTML карточки — с опциональным таймером обратного отсчёта
    const countdownId = `ch-countdown-${ch.id}`;
    const countdownHtml = schedInfo
      ? `<div id="${countdownId}" style="display:inline-flex;align-items:center;gap:6px;max-width:100%;margin-top:8px;padding:6px 10px;border-radius:8px;background:rgba(255,224,51,.16);border:1px solid rgba(255,224,51,.45);font-family:var(--head);font-size:13px;line-height:1.25;color:#fff7c2;letter-spacing:.08em;text-shadow:0 1px 4px rgba(0,0,0,.75);font-weight:700;box-shadow:0 0 10px rgba(255,224,51,.15)">⏳ Подсчёт...</div>`
      : '';

    card.innerHTML = `
      <div class="ch-icon">${ch.stamp || '🔐'}</div>
      <div class="ch-inner">
        <div class="ch-num">${ch.subtitle} · ${statusText}</div>
        <div class="ch-title">${ch.title}</div>
        <div class="ch-place">${ch.place}</div>
        <div class="ch-tags">${tags}</div>
        ${countdownHtml}
      </div>
      <div class="ch-right">
        <div class="ch-badge">${badgeIcon}</div>
        ${scoreVal ? `<div class="ch-score">${scoreVal}</div>` : ''}
      </div>`;

    // Запускаем таймер обратного отсчёта если есть open_at
    if (schedInfo && schedInfo.open_at) {
      _startChapterCountdown(countdownId, schedInfo.open_at, ch.id);
    }

    // Кто может играть
    const canRepeat = state.retryPenalty || state._noptsMode;
    const canPlay = state.adminMode || state.testerMode || (!isLocked && (!isDone || canRepeat));
    if (canPlay) {
      card.onclick = () => { showBriefing(i); };
      card.style.cursor = 'pointer';
    } else {
      card.style.cursor = isDone ? 'default' : 'not-allowed';
    }
    list.appendChild(card);
  });

  // Баннер режима — вставляем перед первой карточкой
  if (state.adminMode) {
    const banner = document.createElement('div');
    banner.style.cssText = 'margin:8px 12px;padding:10px 14px;background:rgba(255,215,0,.08);border:1px solid rgba(255,215,0,.25);border-radius:8px;font-size:var(--fs-xs);color:#ffd700;letter-spacing:.06em';
    banner.textContent = '👑 РЕЖИМ АДМИНИСТРАТОРА · Все главы открыты · ∞ жизней · Рейтинг не учитывается';
    list.insertBefore(banner, list.firstChild);
  } else if (state.testerMode) {
    const banner = document.createElement('div');
    banner.style.cssText = 'margin:8px 12px;padding:10px 14px;background:rgba(100,200,255,.07);border:1px solid rgba(100,200,255,.25);border-radius:8px;font-size:var(--fs-xs);color:#64c8ff;letter-spacing:.06em';
    banner.textContent = '🧪 РЕЖИМ ТЕСТИРОВЩИКА · Все главы открыты · 5 жизней · Рейтинг не учитывается';
    list.insertBefore(banner, list.firstChild);
  } else if (state._noptsMode) {
    const banner = document.createElement('div');
    banner.style.cssText = 'margin:8px 12px;padding:10px 14px;background:rgba(100,180,255,.06);border:1px solid rgba(100,180,255,.2);border-radius:8px;font-size:var(--fs-xs);color:#64b4ff;letter-spacing:.06em';
    banner.textContent = '👁 РЕЖИМ ПРАКТИКИ · Очки не начисляются';
    list.insertBefore(banner, list.firstChild);
  } else if (state.retryPenalty) {
    const banner = document.createElement('div');
    banner.style.cssText = 'margin:8px 12px;padding:10px 14px;background:rgba(255,100,50,.06);border:1px solid rgba(255,100,50,.2);border-radius:8px;font-size:var(--fs-xs);color:#ff6432;letter-spacing:.06em';
    banner.textContent = '🔥 ПОВТОРНОЕ ПРОХОЖДЕНИЕ · +10 сек к каждому заданию';
    list.insertBefore(banner, list.firstChild);
  }

  // Обновляем шапку
  const total = CHAPTERS.length;
  const pct = Math.round((completedCount / total) * 100);
  const pbEl = document.getElementById('ch-progress-bar');
  if (pbEl) pbEl.style.width = pct + '%';
  const clEl = document.getElementById('stat-completed-label');
  if (clEl) clEl.textContent = completedCount + ' / ' + total + ' глав';
  const scEl = document.getElementById('stat-score');
  if (scEl) scEl.textContent = state.totalScore + ' оч';
  // Кнопка сброса — только для admin (не тестер!)
  const resetBtn = document.getElementById('btn-reset-header');
  if (resetBtn) resetBtn.style.display = (state.adminMode || window._adminMode) ? 'inline-block' : 'none';
  const plEl = document.getElementById('stat-players-label');
  const plCount = tgInitLB.length || state.leaderboard.length;
  if (plEl) plEl.textContent = '👥 ' + (plCount || '—') + ' игроков';

  if (state.gameOver) {
    document.getElementById('btn-to-final').style.display = 'block';
  } else {
    document.getElementById('btn-to-final').style.display = 'none';
  }
  syncTopStatusBars();
}

// ═══════════════════════════════════════════════════════
//  ТАЙМЕР ОБРАТНОГО ОТСЧЁТА ДО ОТКРЫТИЯ ГЛАВЫ
// ═══════════════════════════════════════════════════════
const _countdownIntervals = {};

function _startChapterCountdown(elId, openAtIso, chapterId) {
  // Останавливаем старый если был
  if (_countdownIntervals[chapterId]) {
    clearInterval(_countdownIntervals[chapterId]);
    delete _countdownIntervals[chapterId];
  }
  const openAt = new Date(openAtIso).getTime();

  function _fmt(ms) {
    if (ms <= 0) return '🟢 ГЛАВА ОТКРЫТА';
    const totalSec = Math.floor(ms / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    if (d > 0) return `⏳ ОТКРЫТИЕ ЧЕРЕЗ ${d}д ${hh}:${mm}:${ss}`;
    if (h > 0) return `⏳ ОТКРЫТИЕ ЧЕРЕЗ ${hh}:${mm}:${ss}`;
    return `⏳ ОТКРЫТИЕ ЧЕРЕЗ ${mm}:${ss}`;
  }

  function _tick() {
    const el = document.getElementById(elId);
    if (!el) { clearInterval(_countdownIntervals[chapterId]); return; }
    const diff = openAt - Date.now();
    if (diff <= 0) {
      el.textContent = '🟢 ГЛАВА ОТКРЫТА · ОБНОВИТЕ ЭКРАН';
      el.style.background = 'rgba(85,221,85,.14)';
      el.style.borderColor = 'rgba(85,221,85,.55)';
      el.style.color = '#a8ffb2';
      clearInterval(_countdownIntervals[chapterId]);
      delete _countdownIntervals[chapterId];
      return;
    }
    el.textContent = _fmt(diff);
  }
  _tick();
  _countdownIntervals[chapterId] = setInterval(_tick, 1000);
}

// ═══════════════════════════════════════════════════════
//  БРИФИНГ
// ═══════════════════════════════════════════════════════
function showBriefing(idx) {
  if (idx < 0 || idx >= CHAPTERS.length) { showScreen('s-chapters'); renderChapters(); return; }
  currentChapter = idx;
  const ch = CHAPTERS[idx];
  document.getElementById('brief-num').textContent   = ch.subtitle + ' — ' + ch.place;
  document.getElementById('brief-title').textContent = ch.title;
  document.getElementById('brief-place').textContent = ch.place;
  document.getElementById('brief-stamp').textContent = ch.stamp;
  document.getElementById('brief-meta').innerHTML    = ch.meta.replace(/\n/g,'<br>');
  document.getElementById('brief-text').textContent  = ch.briefing;
  document.getElementById('brief-mission').textContent = ch.mission;
  showScreen('s-briefing');
}

let _missionCinematicTimer = null;
function showMissionCinematic(chapter, onDone) {
  if (!chapter) { if (typeof onDone === 'function') onDone(); return; }
  const prev = document.getElementById('mission-cinematic-overlay');
  if (prev) prev.remove();
  if (_missionCinematicTimer) {
    clearTimeout(_missionCinematicTimer);
    _missionCinematicTimer = null;
  }

  const overlay = document.createElement('div');
  overlay.id = 'mission-cinematic-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:12000;background:radial-gradient(circle at 50% 30%, rgba(42,33,12,.95), rgba(8,8,8,.98));
    display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(2px)`;
  const briefing = String(chapter.briefing || chapter.mission || '').replace(/\s+/g, ' ').trim();
  const shortBriefing = briefing.length > 240 ? (briefing.slice(0, 237) + '...') : briefing;
  const missionLine = `${chapter.subtitle || 'Глава'} · ${chapter.place || ''}`.trim();
  overlay.innerHTML = `
    <div style="width:min(560px,95vw);border:1px solid rgba(255,224,51,.45);border-radius:12px;background:linear-gradient(160deg,rgba(32,25,10,.95),rgba(10,10,8,.95));box-shadow:0 14px 36px rgba(0,0,0,.55);padding:18px 16px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">
        <div style="font-family:var(--head);font-size:13px;letter-spacing:.12em;color:#ffe58f">СЕКРЕТНЫЙ БРИФИНГ</div>
        <button id="mission-cinematic-skip" class="btn btn-small" style="margin:0;padding:6px 10px;font-size:10px">ПРОПУСТИТЬ</button>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="font-size:26px;filter:drop-shadow(0 0 10px rgba(255,224,51,.4))">${chapter.stamp || '🎖️'}</div>
        <div style="font-family:var(--head);font-size:18px;line-height:1.2;color:var(--accent)">${chapter.title || 'Операция'}</div>
      </div>
      <div style="font-size:11px;color:#d7c99a;letter-spacing:.08em;margin-bottom:10px">${missionLine}</div>
      <div id="mission-cinematic-text" style="min-height:72px;border:1px dashed rgba(255,224,51,.35);border-radius:8px;padding:10px 12px;background:rgba(255,224,51,.05);font-size:13px;line-height:1.6;color:#f2e8c8"></div>
      <div style="margin-top:12px;display:flex;justify-content:flex-end">
        <div style="font-size:11px;color:#d7c99a;letter-spacing:.1em">РАДИОКАНАЛ ОТКРЫТ</div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const textEl = overlay.querySelector('#mission-cinematic-text');
  const fullText = `Операция начата. ${shortBriefing}`;
  let idx = 0;
  const typeTimer = setInterval(() => {
    if (!textEl) return;
    idx += 2;
    textEl.textContent = fullText.slice(0, idx);
    if (idx >= fullText.length) clearInterval(typeTimer);
  }, 22);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearInterval(typeTimer);
    if (_missionCinematicTimer) {
      clearTimeout(_missionCinematicTimer);
      _missionCinematicTimer = null;
    }
    overlay.style.transition = 'opacity .18s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      try { overlay.remove(); } catch (e) {}
      if (typeof onDone === 'function') onDone();
    }, 180);
  };

  const skipBtn = overlay.querySelector('#mission-cinematic-skip');
  if (skipBtn) skipBtn.onclick = finish;
  _missionCinematicTimer = setTimeout(finish, Math.max(3000, Math.min(6200, 1200 + fullText.length * 24)));
  try { playSound('hint'); } catch (e) {}
}

// ═══════════════════════════════════════════════════════
//  СТАРТ ГЛАВЫ
// ═══════════════════════════════════════════════════════
function startChapter(idx) {
  unlockAudioInteraction();
  state.chapter           = idx;
  state.cipherIdx         = 0;
  _activeCipherKey        = _makeCipherKey(idx, 0);
  _clearActiveCipherResolved();
  _nextCipherBusy         = false;
  // Жизни: бесконечные только для adminMode, для testerMode и player — 5
  state.lives             = state.adminMode ? Infinity : 5;
  state.chapterScore      = 0;
  state.streak            = 0;
  state._chapterStartTime = Date.now();
  state._chapterErrors    = 0;
  state._chapterHints     = 0;
  saveState();
  const chapterMeta = CHAPTERS[idx];
  showMissionCinematic(chapterMeta, () => {
    loadCipher();
    showScreen('s-cipher');
  });
}

// ═══════════════════════════════════════════════════════
//  ЗАГРУЗКА ШИФРА
// ═══════════════════════════════════════════════════════
function loadCipher() {
  const ch = CHAPTERS[state.chapter];
  if (!ch) { showScreen('s-chapters'); renderChapters(); return; }
  const cipher = ch.ciphers[state.cipherIdx];
  if (!cipher) {
    Promise.resolve(finishChapter()).catch((err) => {
      console.error('loadCipher -> finishChapter failed:', err);
      showChapterEndFallback();
    });
    return;
  }
  _activeCipherKey = _makeCipherKey();
  _clearActiveCipherResolved();
  _nextCipherBusy = false;

  // Сбрасываем quiz-container
  const qc = document.getElementById('quiz-container');
  if (qc) qc.style.display = 'none';

  // Элементы ввода
  const inp      = document.getElementById('cipher-input');
  const inpWrap  = document.getElementById('cipher-input-wrap');
  const checkBtn = document.getElementById('btn-check') || document.querySelector('.btn-check');
  const hintBtn  = document.getElementById('btn-hint');
  const boxEl    = document.getElementById('cipher-box');

  if (cipher.type !== 'quiz') {
    // Обычные задания — показываем всё
    if (inp)      { inp.style.display = ''; inp.value = ''; inp.disabled = false; inp.className = 'cipher-input'; }
    if (inpWrap)  inpWrap.style.display  = '';
    if (checkBtn) { checkBtn.style.display = ''; checkBtn.disabled = false; }
    if (hintBtn)  { hintBtn.style.display = ''; hintBtn.disabled = false; hintBtn.textContent = '💡 ПОДСКАЗКА'; }
    if (boxEl)    boxEl.style.display    = '';
  } else {
    // Quiz — скрываем input, показываем только quiz-container
    if (inp)      inp.style.display      = 'none';
    if (inpWrap)  inpWrap.style.display  = 'none';
    if (checkBtn) { checkBtn.style.display = 'none'; checkBtn.disabled = false; }
    // hint оставляем видимым для quiz тоже
    if (boxEl)    boxEl.style.display    = 'none';
  }
  state.startTime = Date.now();

  // Прогресс-точки (5 штук)
  const prog = document.getElementById('cipher-progress');
  prog.innerHTML = ch.ciphers.map((c, i) =>
    `<div class="cipher-prog-dot ${i < state.cipherIdx ? 'done' : i === state.cipherIdx ? 'active' : ''}"></div>`
  ).join('');

  document.getElementById('cipher-chapter-label').textContent = ch.subtitle + ' · ' + ch.place;
  const scoreEl = document.getElementById('cipher-score-display');
  if (scoreEl) scoreEl.textContent = state.chapterScore + ' оч';
  document.getElementById('cipher-type-label').textContent    = cipher.typeLabel;
  document.getElementById('cipher-task').textContent          = cipher.task;

  // Шифрованный текст / задание
  const box = document.getElementById('cipher-box');
  if (box) { if (cipher.type !== 'quiz') box.style.display = ''; }
  box.setAttribute('data-num', String(state.cipherIdx + 1).padStart(3,'0'));
  box.style.position = 'relative';

  if (cipher.type === 'morse') {
    box.innerHTML = '';
    animateMorse(box, cipher.encrypted);
  } else if (cipher.type === 'quiz') {
    box.style.display = '';
    box.innerHTML = '';
  } else if (cipher.type === 'anagram') {
    box.textContent = '';
    box.style.display = 'none';
  } else if (cipher.type === 'math') {
    box.style.display = '';
    box.innerHTML = `<div class="math-formula">${cipher.encrypted}</div>`;
  } else if (cipher.type === 'photo') {
    box.style.display = '';
    box.innerHTML = `<div class="photo-task-img">${cipher.image}</div>
      <div style="font-family:var(--mono);font-size:var(--fs-2xl);text-align:center;padding:8px 0">${cipher.encrypted}</div>`;
  } else if (cipher.type === 'map') {
    box.style.display = '';
    box.innerHTML = '';
    renderMap(cipher);
  } else {
    box.style.display = '';
    box.textContent = cipher.encrypted;
  }

  // Поле ввода — скрываем для карты и анаграммы
  const inputWrap = document.querySelector('.cipher-input-wrap');
  const actions   = document.querySelector('.cipher-actions');
  const btnCheck  = document.querySelector('.btn-check');
  if (cipher.type === 'map') {
    if (inputWrap) inputWrap.style.display = 'none';
    if (btnCheck) { btnCheck.style.display = 'none'; btnCheck.disabled = false; }
  } else if (cipher.type === 'anagram') {
    if (inputWrap) inputWrap.style.display = 'none';
    if (btnCheck) { btnCheck.style.display = 'none'; btnCheck.disabled = false; }
  } else {
    if (inputWrap) inputWrap.style.display = '';
    if (btnCheck) { btnCheck.style.display = ''; btnCheck.disabled = false; }
  }

  // Жизни
  renderLives();
  _timerCancelled = false;
  startTimer();
  _syncTimerCancelButton();
  syncMusicButtons();

  // Сброс ввода (inp уже объявлен выше)
  const inpReset = document.getElementById('cipher-input');
  if (inpReset) { inpReset.value = ''; inpReset.className = 'cipher-input'; inpReset.disabled = false; }
  // Для текстовых заданий сразу открываем клавиатуру и ставим курсор.
  // Для map/anagram/quiz клавиатура не нужна.
  const shouldShowKeyboard = cipher.type !== 'map' && cipher.type !== 'anagram' && cipher.type !== 'quiz';
  _setKeyboardVisibility(shouldShowKeyboard);
  if (shouldShowKeyboard && inpReset) {
    setTimeout(() => {
      try { inpReset.focus(); } catch (e) {}
    }, 0);
  }
  state.hintsUsed = false;
  const hb = document.getElementById('cipher-hint-box');
  const ht = document.getElementById('cipher-hint-text');
  const bh = document.getElementById('btn-hint');
  if (hb) hb.className = 'cipher-hint-box';
  if (ht) ht.textContent = '';
  if (bh) { bh.disabled = false; bh.textContent = '💡 ПОДСКАЗКА'; }

  // Справочник
  renderRef(cipher.type, cipher.shift);
  // Для анаграммы и карты рендерим ПОСЛЕ renderRef (иначе перезапишет)
  if (cipher.type === 'anagram') renderAnagram(cipher);
  if (cipher.type === 'map')     renderMap(cipher);
  if (cipher.type === 'quiz')    renderQuiz(cipher);
  if (shouldShowKeyboard && inp) inp.focus();
}

function renderLives() {
  const el = document.getElementById('cipher-attempts-label');
  if (!el) {
    syncTopStatusBars();
    return;
  }
  if (state.adminMode) {
    el.innerHTML = '<div style="line-height:1.2;text-align:center;color:gold">♾️ АДМИН</div>';
    syncTopStatusBars();
    return;
  }
  // Тестировщик и игрок — обычные 5 жизней
  const n = Math.max(0, Math.min(5, state.lives));
  let row1 = '', row2 = '';
  for(let i=0;i<3;i++) row1 += i < n ? '❤️' : '🖤';
  for(let i=3;i<5;i++) row2 += i < n ? '❤️' : '🖤';
  const badge = state.testerMode
    ? '<div style="font-size:9px;color:rgba(100,200,255,.7);letter-spacing:.06em">🧪 ТЕСТ</div>'
    : '';
  el.innerHTML = '<div style="line-height:1.2;text-align:center"><div>' + row1 + '</div><div>' + row2 + '</div>' + badge + '</div>';
  syncTopStatusBars();
}

function animateLifeLoss() {
  const el = document.getElementById('cipher-attempts-label');
  if (!el) return;
  el.style.transition = 'transform .15s,filter .15s';
  el.style.transform = 'scale(1.3)';
  el.style.filter = 'drop-shadow(0 0 8px rgba(255,58,58,.9))';
  setTimeout(() => { el.style.transform = ''; el.style.filter = ''; renderLives(); }, 200);
}

let _timerInterval = null;
let _timerCancelled = false;
let _riskIntensity = 0;
let _timerStartMs = 0;

function _setRiskIntensity(v) {
  _riskIntensity = _clamp(Number(v) || 0, 0, 1);
}

function _resetCipherUrgencyUI() {
  _setRiskIntensity(0);
  const timerEl = document.getElementById('cipher-timer');
  if (timerEl) {
    timerEl.style.transform = '';
    timerEl.style.textShadow = '';
    timerEl.style.animation = '';
  }
  const box = document.getElementById('cipher-box');
  if (box) {
    box.style.boxShadow = '';
    box.style.borderColor = '';
  }
  const task = document.getElementById('cipher-task');
  if (task) task.style.textShadow = '';
}

function _applyCipherUrgency(elapsedSec) {
  const sec = Math.max(0, Number(elapsedSec || 0));
  let risk = 0;
  if (sec >= 25) risk = 0.25;
  if (sec >= 40) risk = 0.6;
  if (sec >= 55) risk = 1;
  _setRiskIntensity(risk);

  const timerEl = document.getElementById('cipher-timer');
  if (timerEl) {
    if (risk >= 1) {
      timerEl.style.animation = 'pulse 0.7s ease-in-out infinite';
      timerEl.style.transform = 'scale(1.08)';
      timerEl.style.textShadow = '0 0 18px rgba(255,58,58,.75)';
    } else if (risk >= 0.6) {
      timerEl.style.animation = 'pulse 1.2s ease-in-out infinite';
      timerEl.style.transform = 'scale(1.03)';
      timerEl.style.textShadow = '0 0 12px rgba(255,170,85,.6)';
    } else if (risk >= 0.25) {
      timerEl.style.animation = '';
      timerEl.style.transform = 'scale(1.01)';
      timerEl.style.textShadow = '0 0 8px rgba(255,224,51,.45)';
    } else {
      timerEl.style.animation = '';
      timerEl.style.transform = '';
      timerEl.style.textShadow = '';
    }
  }
  const box = document.getElementById('cipher-box');
  if (box) {
    if (risk >= 1) {
      box.style.borderColor = 'rgba(255,58,58,.65)';
      box.style.boxShadow = '0 0 18px rgba(255,58,58,.35)';
    } else if (risk >= 0.6) {
      box.style.borderColor = 'rgba(255,170,85,.55)';
      box.style.boxShadow = '0 0 14px rgba(255,170,85,.28)';
    } else if (risk >= 0.25) {
      box.style.borderColor = 'rgba(255,224,51,.45)';
      box.style.boxShadow = '0 0 10px rgba(255,224,51,.2)';
    } else {
      box.style.borderColor = '';
      box.style.boxShadow = '';
    }
  }
  const task = document.getElementById('cipher-task');
  if (task) task.style.textShadow = risk >= 0.6 ? '0 0 8px rgba(255,170,85,.35)' : '';
}

function _syncTimerCancelButton() {
  const btn = document.getElementById('btn-cancel-timer');
  if (!btn) return;
  if (_timerCancelled) {
    btn.disabled = true;
    btn.style.opacity = '0.55';
    btn.textContent = '⏱ ТАЙМЕР ОТКЛЮЧЕН';
  } else {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.textContent = '⏹ ОТМЕНИТЬ ТАЙМЕР';
  }
}

function startTimer() {
  if (_timerInterval) clearInterval(_timerInterval);
  const el = document.getElementById('cipher-timer');
  if (!el) return;
  _timerStartMs = Date.now();
  el.textContent = '0с';
  el.style.color = 'var(--muted)';
  _applyCipherUrgency(0);
  _timerInterval = setInterval(() => {
    const sec = Math.round((Date.now() - _timerStartMs) / 1000);
    el.textContent = sec + 'с';
    if (sec <= 10) el.style.color = 'var(--green)';
    else if (sec <= 30) el.style.color = 'var(--accent)';
    else if (sec <= 60) el.style.color = 'var(--accent2)';
    else el.style.color = 'var(--red)';
    _applyCipherUrgency(sec);
  }, 1000);
}

function stopTimer() {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  const el = document.getElementById('cipher-timer');
  if (el) el.style.color = 'var(--muted)';
  _resetCipherUrgencyUI();
}

function cancelCipherTimer() {
  if (_timerCancelled) return;
  _timerCancelled = true;
  stopTimer();
  const el = document.getElementById('cipher-timer');
  if (el) {
    el.textContent = 'без таймера';
    el.style.color = 'var(--green)';
  }
  _resetCipherUrgencyUI();
  _syncTimerCancelButton();
  showToast('⏱ Таймер отключён для текущего задания');
}

function getEffectiveElapsed(startTimeMs) {
  const elapsed = Math.round((Date.now() - startTimeMs) / 1000);
  return _timerCancelled ? 0 : elapsed;
}

function animateMorse(el, text) {
  el.innerHTML = '<span class="morse-animate">' +
    text.split('').map((ch, i) =>
      `<span style="animation-delay:${i*25}ms">${ch === ' ' ? '&nbsp;' : ch}</span>`
    ).join('') + '</span>';
}

function renderRef(type, shift) {
  const ref = document.getElementById('cipher-ref');
  // Алфавит только для шифров: caesar, atbash, morse
  if (!['caesar', 'atbash', 'morse'].includes(type)) {
    if (ref) ref.innerHTML = '';
    return;
  }
  if (type === 'morse') {
    ref.innerHTML = `<div class="cipher-ref-title">// ТАБЛИЦА МОРЗЕ</div>
    <div style="font-size:var(--fs-base);color:var(--accent);font-weight:700;margin-bottom:6px;letter-spacing:.04em;line-height:1.6">
      <span style="color:#ffe033">/ </span>— разделитель букв &nbsp;&nbsp;|&nbsp;&nbsp; <span style="color:#ffe033">// </span>— разделитель слов
    </div>
    <div style="font-size:var(--fs-sm);color:var(--muted);margin-bottom:8px;background:rgba(255,224,51,.05);border:1px solid rgba(255,224,51,.15);border-radius:4px;padding:7px 10px;line-height:1.8">
      Пример: <span style="color:#ffe033;font-family:var(--mono)">.-/.-././/--/.-.</span><br>
      А<span style="color:#ffe033">/</span>Л<span style="color:#ffe033">/</span>Е<span style="color:#ffe033">/</span>Е<span style="color:rgba(255,224,51,.4)">//</span>МР → АЛЕЕ МР
    </div>
    <div style="font-size:var(--fs-lg);color:var(--accent2);font-weight:700;text-align:center;padding:8px 0;letter-spacing:.06em;border:1px solid rgba(255,90,90,.3);border-radius:4px;margin-bottom:8px">
      ⚠️ ДОЧИТАЙТЕ ТАБЛИЦУ ДО КОНЦА!
    </div>
    <div class="morse-ref">${Object.entries(MORSE_TABLE).map(([l,c])=>`<div class="morse-item">${l} ${c}</div>`).join('')}</div>`;
  } else if (type === 'atbash') {
    const a = RU_ALPHA;
    ref.innerHTML = `<div class="cipher-ref-title">// ТАБЛИЦА АТБАШ (зеркальный алфавит)</div>
    <div class="caesar-ref">${a.split('').map((l,i)=>`${a[a.length-1-i]}→${l}`).join('  ')}</div>`;
  } else if (type === 'num') {
    const a = RU_ALPHA;
    ref.innerHTML = `<div class="cipher-ref-title">// ЧИСЛОВОЙ КОД (буква = номер в алфавите)</div>
    <div class="caesar-ref">${a.split('').map((l,i)=>`${i+1}=${l}`).join('  ')}</div>`;
  } else if (type === 'anagram' || type === 'map') {
    ref.innerHTML = ''; // рендерится отдельно
  } else if (type === 'math') {
    ref.innerHTML = `<div class="cipher-ref-title">// ПОДСКАЗКА</div>
    <div style="font-size:var(--fs-sm);color:var(--muted);padding:8px 0;line-height:1.7">Введи ответ цифрой в поле ниже.</div>`;
  } else if (type === 'photo') {
    ref.innerHTML = `<div class="cipher-ref-title">// ПОДСКАЗКА</div>
    <div style="font-size:var(--fs-sm);color:var(--muted);padding:8px 0;line-height:1.7">Введи ответ словами в поле ниже.</div>`;
  } else {
    const alpha = RU_ALPHA;
    ref.innerHTML = `<div class="cipher-ref-title">// АЛФАВИТ ДЛЯ РАСШИФРОВКИ (сдвиг ${shift})</div>
    <div class="caesar-ref">${alpha.split('').map((l,i)=>{
      const fromIdx = (i + shift) % alpha.length;
      return `${alpha[fromIdx]}→${l}`;
    }).join('  ')}</div>`;
  }
}

// ═══════════════════════════════════════════════════════
//  СИСТЕМА ОЧКОВ ЗА СКОРОСТЬ
//  Макс = points шифра. За каждые 15 сек — -10% (минимум 20%)
// ═══════════════════════════════════════════════════════
function calcPoints(cipher, elapsed) {
  const max   = cipher.points;
  const secs  = Math.max(0, elapsed);
  const penalty = Math.floor(Math.max(0, secs - 10) / 10) * 0.08;
  let factor  = Math.max(0.20, 1 - penalty);
  // Штраф за повтор: -5% за каждый провал главы (5%, 10%, 15%...)
  if (state.retryPenalty) {
    const ch = CHAPTERS[state.chapter];
    const fails = ch && state.chapterFailCounts ? (state.chapterFailCounts[ch.id] || 1) : 1;
    const penaltyFactor = Math.max(0.50, 1 - fails * 0.05);
    factor = Math.max(0.10, factor * penaltyFactor);
  }
  const streakBonus = Math.min(0.30, (state.streak || 0) * 0.05);
  factor = Math.min(1.30, factor + streakBonus);
  return Math.round(max * factor);
}

// ═══════════════════════════════════════════════════════
//  ПРОВЕРКА ОТВЕТА
// ═══════════════════════════════════════════════════════
const _SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function _rotr(x, n) {
  return (x >>> n) | (x << (32 - n));
}

function _utf8Bytes(str) {
  if (typeof TextEncoder !== 'undefined') {
    return Array.from(new TextEncoder().encode(str));
  }
  const out = [];
  const encoded = encodeURIComponent(str).replace(
    /%([0-9A-F]{2})/g,
    (_, p) => String.fromCharCode(parseInt(p, 16))
  );
  for (let i = 0; i < encoded.length; i++) out.push(encoded.charCodeAt(i));
  return out;
}

function _sha256Fallback(str) {
  const bytes = _utf8Bytes(String(str ?? ''));
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);

  const high = Math.floor(bitLen / 0x100000000) >>> 0;
  const low = bitLen >>> 0;
  bytes.push((high >>> 24) & 0xff, (high >>> 16) & 0xff, (high >>> 8) & 0xff, high & 0xff);
  bytes.push((low >>> 24) & 0xff, (low >>> 16) & 0xff, (low >>> 8) & 0xff, low & 0xff);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Array(64);

  for (let i = 0; i < bytes.length; i += 64) {
    for (let t = 0; t < 16; t++) {
      const j = i + t * 4;
      w[t] = ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0;
    }
    for (let t = 16; t < 64; t++) {
      const s0 = _rotr(w[t - 15], 7) ^ _rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = _rotr(w[t - 2], 17) ^ _rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = _rotr(e, 6) ^ _rotr(e, 11) ^ _rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + _SHA256_K[t] + w[t]) >>> 0;
      const S0 = _rotr(a, 2) ^ _rotr(a, 13) ^ _rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map(v => v.toString(16).padStart(8, '0'))
    .join('');
}

async function sha256(str) {
  const text = String(str ?? '');
  try {
    if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('crypto.subtle unavailable, using fallback SHA-256:', e);
  }
  return _sha256Fallback(text);
}

async function checkAnswer() {
  if (_isActiveCipherResolved()) return;
  const chapter = CHAPTERS[state.chapter];
  if (!chapter || !Array.isArray(chapter.ciphers)) {
    console.warn('checkAnswer: chapter is unavailable', state.chapter);
    return;
  }
  const cipher = chapter.ciphers[state.cipherIdx];
  if (!cipher) {
    console.warn('checkAnswer: cipher is unavailable', state.cipherIdx);
    return;
  }
  // Если текущее задание — quiz, делегируем в quizSubmit
  if (cipher.type === 'quiz') {
    if (typeof quizSubmit === 'function') quizSubmit();
    return;
  }
  const inp    = document.getElementById('cipher-input');
  if (!inp) {
    console.warn('checkAnswer: cipher-input element not found');
    return;
  }
  const rawVal = inp.value || '';
  const val = rawVal.trim().toUpperCase().replace(/\s+/g,' ');
  const correct = cipher.answer; // хеш
  if (!correct || typeof correct !== 'string') {
    console.warn('checkAnswer: missing answer hash for cipher', cipher);
    return;
  }

  if (!val) { inp.focus(); return; }

  const elapsed = getEffectiveElapsed(state.startTime);

  const normVal = _normalizeForCompare(rawVal);

  // Несколько эквивалентных вариантов, чтобы убрать ложные "неверно"
  const candidates = new Set([
    val,
    val.replace(/\s+/g, ''),
    normVal,
    normVal.replace(/\s+/g, ''),
    rawVal.trim(),
  ]);
  const digitsOnly = normVal.replace(/\D/g, '');
  if (digitsOnly) candidates.add(digitsOnly);

  const hashes = await Promise.all(Array.from(candidates).filter(Boolean).map(c => sha256(c)));
  let isCorrect = hashes.includes(correct);

  if (isCorrect) {
    // ── ПРАВИЛЬНО ──
    inp.className  = 'cipher-input correct';
    inp.disabled   = true;
    _markActiveCipherResolved();
    const checkBtn = document.getElementById('btn-check') || document.querySelector('.btn-check');
    if (checkBtn) checkBtn.disabled = true;
    state.streak = (state.streak || 0) + 1;
    playSound('correct');
    const pts      = calcPoints(cipher, elapsed);
    state.chapterScore += pts;
    saveState();
    autoSync(false, true);
    stopTimer();
    if (elapsed <= 5) state._fastAnswers = (state._fastAnswers || 0) + 1;
    registerSolvedCipherType(cipher.type);
    const isFirstTry = (state._chapterErrors || 0) === 0;
    const cipherTypeCtx = {
      cipherType:     cipher.type,
      quizCorrect:    cipher.type === 'quiz',
      mathCorrect:    cipher.type === 'math',
      anagramCorrect: cipher.type === 'anagram',
      mapCorrect:     cipher.type === 'map',
      morseFast:      cipher.type === 'morse' && elapsed <= 10,
    };
    try {
      checkAchievements({ elapsed, firstTry: isFirstTry, ...cipherTypeCtx });
    } catch (achErr) {
      console.warn('checkAnswer: achievements update skipped', achErr);
    }
    setTimeout(() => showSuccess(cipher, pts, elapsed), 400);

  } else {
    // ── НЕПРАВИЛЬНО ──
    inp.className = 'cipher-input wrong';
    playSound('wrong');
    setTimeout(() => inp.className = 'cipher-input', 500);
    state.streak = 0;
    state._chapterErrors = (state._chapterErrors || 0) + 1;
    if (!state.adminMode) {
      state.lives--;
      animateLifeLoss();
      screenPulseRed();
      playSound('life_lost');
    }
    saveState();
    autoSync(false, true);

    if (state.lives <= 0) {
      if (state.adminMode) {
        // Режим администратора — восстанавливаем жизни
        state.lives = 5; saveState(); autoSync(false, true); renderLives();
        const hb = document.getElementById('cipher-hint-box');
        const ht = document.getElementById('cipher-hint-text');
        if (hb && ht) {
          hb.className = 'cipher-hint-box show';
          ht.textContent = '⚡ Режим админа: жизни восстановлены';
          setTimeout(() => { hb.className = 'cipher-hint-box'; }, 2000);
        }
      } else {
        // Для tester/player: при 0 жизней начинаем эту же главу заново
        inp.disabled = true;
        renderLives();
        stopTimer();
        const hb = document.getElementById('cipher-hint-box');
        const ht = document.getElementById('cipher-hint-text');
        if (hb && ht) {
          hb.className = 'cipher-hint-box show';
          ht.textContent = 'Жизни закончились. Глава начата заново.';
        }
        setTimeout(() => {
          if (hb) hb.className = 'cipher-hint-box';
          restartChapterFromStart(state.chapter);
        }, 900);
      }
    } else {
      renderLives();
    }
  }
}

function isCloseEnough(val, correct) {
  if (val === correct) return true;
  if (val.replace(/\s/g,'') === correct.replace(/\s/g,'')) return true;
  if (correct.length <= 8 && levenshtein(val, correct) === 1) return true;
  return false;
}

function levenshtein(a, b) {
  const m=a.length, n=b.length;
  const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i||j));
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++)
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}

function showHint() {
  const cipher = CHAPTERS[state.chapter].ciphers[state.cipherIdx];
  if (state.hintsUsed) return;
  state.hintsUsed = true;

  // Показываем подсказку в hint-box
  playSound('hint');
  const hintBox  = document.getElementById('cipher-hint-box');
  const hintText = document.getElementById('cipher-hint-text');
  if (hintBox && hintText) {
    hintText.textContent = cipher.hint;
    hintBox.className = 'cipher-hint-box show';
  }
  const btn = document.getElementById('btn-hint');
  if (btn) { btn.disabled = true; btn.textContent = '✓ ПОДСКАЗКА'; }

  // Для карты — дополнительно показываем hint в map-hint-text
  if (cipher.type === 'map') {
    const mht = document.getElementById('map-hint-text');
    if (mht) mht.textContent = '💡 ' + cipher.hint;
  }

  // Подсказка стоит жизнь (но не для админа)
  if (!state.adminMode && state.lives > 1) {
    state.lives--;
    state._chapterHints = (state._chapterHints || 0) + 1;
    saveState();
    renderLives();
  }
}

// ═══════════════════════════════════════════════════════
//  ЭКРАН УСПЕХА (один шифр)
// ═══════════════════════════════════════════════════════
function showSuccess(cipher, pts, elapsed) {
  _markActiveCipherResolved();
  const quizOption = (cipher.options && cipher.options[cipher.correctIndex]) || 'Верно';
  const solvedLabel = cipher.type === 'quiz'
    ? quizOption
    : 'Ответ принят';
  document.getElementById('succ-answer').textContent = solvedLabel;
  document.getElementById('succ-cipher-name').textContent = '// ' + cipher.typeLabel;
  const factEl = document.getElementById('succ-fact');
  if (factEl) factEl.innerHTML = cipher.fact ? '<span style="color:var(--accent3);margin-right:4px">📜</span>' + cipher.fact : '';
  document.getElementById('succ-pts').textContent  = pts > 0 ? '+' + pts : '0';
  document.getElementById('succ-time').textContent = typeof elapsed === 'number' ? elapsed + 'с' : elapsed;
  const speedEl = document.getElementById('succ-speed');
  const streak = state.streak || 0;
  let speedText = '', speedColor = 'var(--muted)';
  if (elapsed <= 10) { speedText = '⚡ Молниеносно!'; speedColor = 'var(--green)'; }
  else if (elapsed <= 20) { speedText = '🔥 Быстро!'; speedColor = 'var(--accent)'; }
  else if (elapsed > 60) { speedText = '🐢 Медленно...'; }
  else { speedText = '⏱ ' + elapsed + 'с'; }
  if (streak >= 2) {
    const bonus = Math.min(30, streak * 5);
    speedText += '  🔥 Стрик x' + streak + ' (+' + bonus + '%)';
    speedColor = streak >= 4 ? 'var(--green)' : 'var(--accent)';
  }
  if (speedEl) {
    speedEl.textContent = speedText;
    speedEl.style.color = speedColor;
  }

  const ch     = CHAPTERS[state.chapter];
  const isLast = state.cipherIdx === ch.ciphers.length - 1;
  const btn    = document.getElementById('succ-next-btn');
  if (btn) {
    const successKey = _activeCipherKey || _makeCipherKey();
    btn.textContent = isLast ? 'ЗАВЕРШИТЬ ГЛАВУ →' : 'СЛЕДУЮЩИЙ ШИФР →';
    btn.disabled = false;
    btn.onclick = () => nextCipher(successKey);
  }
  showScreen('s-success');
}

function nextCipher(expectedCipherKey = null) {
  if (_nextCipherBusy) return;
  const activeKey = _activeCipherKey || _makeCipherKey();
  if (expectedCipherKey && expectedCipherKey !== activeKey) {
    console.warn('nextCipher: stale success action ignored', expectedCipherKey, activeKey);
    return;
  }
  if (!_isActiveCipherResolved()) {
    console.warn('nextCipher: unresolved cipher transition blocked', activeKey);
    return;
  }
  _nextCipherBusy = true;
  const ch = CHAPTERS[state.chapter];
  if (!ch || !Array.isArray(ch.ciphers)) {
    console.warn('nextCipher: chapter is unavailable', state.chapter);
    showScreen('s-chapters');
    renderChapters();
    _nextCipherBusy = false;
    return;
  }
  if (state.cipherIdx < ch.ciphers.length - 1) {
    state.cipherIdx++;
    // Жизни НЕ сбрасываются между шифрами — они общие на главу
    saveState();
    _clearActiveCipherResolved();
    loadCipher();
    showScreen('s-cipher');
    _nextCipherBusy = false;
  } else {
    Promise.resolve(finishChapter()).catch((err) => {
      console.error('finishChapter failed:', err);
      showChapterEndFallback();
    }).finally(() => {
      _nextCipherBusy = false;
    });
  }
}

function showChapterEndFallback() {
  const ch = CHAPTERS[state.chapter];
  if (!ch) {
    showScreen('s-chapters');
    renderChapters();
    return;
  }
  const nameEl = document.getElementById('chend-chapter-name');
  const medalEl = document.getElementById('chend-medal');
  const scoreEl = document.getElementById('chend-score');
  const totalEl = document.getElementById('chend-total');
  const pctEl = document.getElementById('chend-pct');
  if (nameEl) nameEl.textContent = ch.title;
  if (medalEl) medalEl.textContent = '🥈';
  if (scoreEl) scoreEl.textContent = String(state.chapterScore || 0);
  if (totalEl) totalEl.textContent = String(state.totalScore || 0);
  if (pctEl) pctEl.textContent = '';
  const nextBtn = document.getElementById('chend-next-btn');
  if (nextBtn) {
    nextBtn.textContent = '← К ЗАДАНИЯМ';
    nextBtn.onclick = () => { showScreen('s-chapters'); renderChapters(); };
  }
  showScreen('s-chapter-end');
}

// ═══════════════════════════════════════════════════════
//  ЗАВЕРШЕНИЕ ГЛАВЫ
// ═══════════════════════════════════════════════════════
async function finishChapter() {
  const ch = CHAPTERS[state.chapter];
  const alreadyDone = !!state.completedChapters[ch.id];
  const chTime = Math.round((Date.now() - (state._chapterStartTime || Date.now())) / 1000);
  if (!state.chapterStats) state.chapterStats = {};
  state.chapterStats[ch.id] = {
    time: chTime, errors: state._chapterErrors || 0,
    hints: state._chapterHints || 0, score: state.chapterScore,
    max: ch.ciphers.reduce((s,c) => s+c.points, 0)
  };
  state.completedChapters[ch.id] = true;
  if (!alreadyDone && !state._noptsMode) {
    state.chapterScores[ch.id] = state.chapterScore;
    state.totalScore          += state.chapterScore;
    if (state.retryPenalty) state.retryPenalty = false;
  } else if (state._noptsMode) {
    // Без очков — просто отмечаем главу пройденной
    state.chapterScores[ch.id] = 0;
  }

  // Медали
  const maxPossible = ch.ciphers.reduce((s,c)=>s+c.points, 0);
  const pct = state.chapterScore / maxPossible;
  let medal = '🥉';
  if (pct >= 0.85) medal = '🥇';
  else if (pct >= 0.60) medal = '🥈';

  // Проверяем конец игры
  const allDone = CHAPTERS.every(c => state.completedChapters[c.id]);
  if (allDone) state.gameOver = true;

  // Обновляем таблицу лидеров локально
  updateLeaderboard();
  saveState();

  // Отправляем в бот
  sendResultToBot({
    type: 'chapter_complete',
    chapter: ch.id,
    chapter_title: ch.title,
    score: state.chapterScore,
    total_score: state.totalScore,
    user_id: getTgUserId(),
    game_over: allDone
  });

  document.getElementById('chend-chapter-name').textContent = ch.title;
  document.getElementById('chend-medal').textContent = medal;
  document.getElementById('chend-score').textContent = state.chapterScore;
  document.getElementById('chend-total').textContent = state.totalScore;
  document.getElementById('chend-pct').textContent = Math.round(pct*100) + '%';

  const nextBtn = document.getElementById('chend-next-btn');
  if (allDone) {
    nextBtn.textContent = '🏆 СМОТРЕТЬ ИТОГ';
    nextBtn.onclick = () => { showFinal(); };
  } else {
    nextBtn.textContent = '← К ЗАДАНИЯМ';
    nextBtn.onclick = () => { showScreen('s-chapters'); renderChapters(); };
  }

  // Comeback — прошёл главу после повторной попытки
  const wasRetryWin = !!state._isRetryAttempt;
  if (wasRetryWin) {
    state._isRetryAttempt = false;
    checkAchievements({ retryWin: true, comeback: true });
  }
  // Проверяем достижения главы
  const chNoErrors = (state._chapterErrors || 0) === 0;
  const chNoHints  = (state._chapterHints  || 0) === 0;
  if (chNoErrors) state._perfectChapters = (state._perfectChapters || 0) + 1;
  if (chNoHints)  state._noHintChapters  = (state._noHintChapters  || 0) + 1;
  const survived1Life = state.lives === 1;
  checkAchievements({
    chapterDone: true,
    chapterDoneNoErrors: chNoErrors,
    chapterDoneNoHints: chNoHints,
    survived1: survived1Life,
  });
  const artifactsGained = evaluateArtifacts({
    chapterDone: true,
    chapterId: ch.id,
    chapterDoneNoErrors: chNoErrors,
    chapterDoneNoHints: chNoHints,
    retryWin: wasRetryWin,
  });
  renderChapterEpicSummary(ch, state.chapterStats[ch.id] || {}, pct, medal, artifactsGained);
  playSound('chapter_win');
  launchConfetti(800, 20);
  showScreen('s-chapter-end');
}

function _chapterGradeInfo(pct) {
  const p = Number(pct || 0);
  if (p >= 0.9) return { grade: 'S', label: 'ЛЕГЕНДАРНО' };
  if (p >= 0.75) return { grade: 'A', label: 'ОТЛИЧНО' };
  if (p >= 0.6) return { grade: 'B', label: 'ХОРОШО' };
  if (p >= 0.45) return { grade: 'C', label: 'СТАБИЛЬНО' };
  return { grade: 'D', label: 'ТРЕБУЕТСЯ ПОВТОР' };
}

function copyChapterReportCard() {
  const reportEl = document.getElementById('chend-epic-report');
  if (!reportEl) return;
  const payload = String(reportEl.dataset.report || '').trim();
  if (!payload) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(payload).then(
      () => showToast('📋 Отчёт главы скопирован'),
      () => showToast('⚠ Не удалось скопировать отчёт')
    );
    return;
  }
  showToast('⚠ Копирование недоступно в этом режиме');
}

function renderChapterEpicSummary(chapter, stats, pct, medal, artifactsGained) {
  const screen = document.getElementById('s-chapter-end');
  if (!screen || !chapter) return;
  let report = document.getElementById('chend-epic-report');
  const nextBtn = document.getElementById('chend-next-btn');
  if (!report) {
    report = document.createElement('div');
    report.id = 'chend-epic-report';
    report.style.cssText = 'margin:0 0 14px 0';
    if (nextBtn && nextBtn.parentNode) nextBtn.parentNode.insertBefore(report, nextBtn);
    else screen.appendChild(report);
  }

  const totalTasks = Array.isArray(chapter.ciphers) ? chapter.ciphers.length : 0;
  const errors = Math.max(0, Number(stats.errors || 0));
  const hints = Math.max(0, Number(stats.hints || 0));
  const score = Math.max(0, Number(stats.score || 0));
  const timeSec = Math.max(0, Number(stats.time || 0));
  const accuracy = totalTasks ? Math.max(0, Math.round(((totalTasks - errors) / totalTasks) * 100)) : 100;
  const mm = String(Math.floor(timeSec / 60)).padStart(2, '0');
  const ss = String(timeSec % 60).padStart(2, '0');
  const gradeInfo = _chapterGradeInfo(pct);

  const gained = Array.isArray(artifactsGained) ? artifactsGained : [];
  const artifactsLine = gained.length
    ? gained.map(a => `${a.icon} ${a.name}`).join(' · ')
    : 'нет новых артефактов';

  report.dataset.report = [
    `Отчёт по главе: ${chapter.title}`,
    `Медаль: ${medal} · Ранг: ${gradeInfo.grade} (${gradeInfo.label})`,
    `Очки главы: ${score}`,
    `Точность: ${accuracy}%`,
    `Ошибки: ${errors}, подсказки: ${hints}`,
    `Время: ${mm}:${ss}`,
    `Артефакты: ${artifactsLine}`,
  ].join('\n');

  report.innerHTML = `
    <div style="background:linear-gradient(165deg,rgba(255,224,51,.16),rgba(18,16,10,.95));border:1px solid rgba(255,224,51,.42);border-radius:12px;padding:12px 12px 10px;box-shadow:0 10px 24px rgba(0,0,0,.45)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">
        <div style="font-family:var(--head);font-size:12px;color:#ffe8a2;letter-spacing:.09em">БОЕВОЙ ОТЧЁТ ГЛАВЫ</div>
        <div style="font-family:var(--head);font-size:12px;color:var(--accent)">РАНГ ${gradeInfo.grade}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px">
        <div style="background:rgba(0,0,0,.28);border:1px solid rgba(255,224,51,.2);border-radius:8px;padding:8px">
          <div style="font-size:10px;color:var(--muted)">ТОЧНОСТЬ</div>
          <div style="font-family:var(--head);font-size:18px;color:#fff2bf">${accuracy}%</div>
        </div>
        <div style="background:rgba(0,0,0,.28);border:1px solid rgba(255,224,51,.2);border-radius:8px;padding:8px">
          <div style="font-size:10px;color:var(--muted)">ВРЕМЯ</div>
          <div style="font-family:var(--head);font-size:18px;color:#fff2bf">${mm}:${ss}</div>
        </div>
        <div style="background:rgba(0,0,0,.28);border:1px solid rgba(255,224,51,.2);border-radius:8px;padding:8px">
          <div style="font-size:10px;color:var(--muted)">ОШИБКИ</div>
          <div style="font-family:var(--head);font-size:18px;color:#ffd4a8">${errors}</div>
        </div>
        <div style="background:rgba(0,0,0,.28);border:1px solid rgba(255,224,51,.2);border-radius:8px;padding:8px">
          <div style="font-size:10px;color:var(--muted)">ПОДСКАЗКИ</div>
          <div style="font-family:var(--head);font-size:18px;color:#ffd4a8">${hints}</div>
        </div>
      </div>
      <div style="font-size:11px;color:#efe2ba;line-height:1.45;margin-bottom:10px">Артефакты: ${artifactsLine}</div>
      <button class="btn btn-small" style="width:100%" onclick="copyChapterReportCard()">📋 СКОПИРОВАТЬ ОТЧЁТ</button>
    </div>`;
}


function restartChapterFromStart(idx) {
  unlockAudioInteraction();
  const ch = CHAPTERS[idx];
  if (!ch) {
    showScreen('s-chapters');
    renderChapters();
    return;
  }
  state.chapter = idx;
  state.cipherIdx = 0;
  _activeCipherKey = _makeCipherKey(idx, 0);
  _clearActiveCipherResolved();
  _nextCipherBusy = false;
  state.lives = state.adminMode ? Infinity : 5;
  state.chapterScore = 0;
  state.streak = 0;
  state.hintsUsed = false;
  state.startTime = Date.now();
  state._chapterStartTime = Date.now();
  state._chapterErrors = 0;
  state._chapterHints = 0;
  saveState();
  loadCipher();
  showScreen('s-cipher');
}

// ═══════════════════════════════════════════════════════
//  ПРОВАЛ ГЛАВЫ (кончились жизни)
// ═══════════════════════════════════════════════════════
async function failChapter() {
  const ch = CHAPTERS[state.chapter];
  const alreadyDone = !!state.completedChapters[ch.id];
  const chTime = Math.round((Date.now() - (state._chapterStartTime || Date.now())) / 1000);
  if (!state.chapterStats) state.chapterStats = {};
  state.chapterStats[ch.id] = {
    time: chTime, errors: state._chapterErrors || 0,
    hints: state._chapterHints || 0, score: state.chapterScore,
    max: ch.ciphers.reduce((s,c2) => s+c2.points, 0), failed: true
  };

  // Считаем сколько раз провалил эту главу
  if (!state.chapterFailCounts) state.chapterFailCounts = {};
  const failCount = (state.chapterFailCounts[ch.id] || 0) + 1;
  state.chapterFailCounts[ch.id] = failCount;

  // Штраф за провал: 5% * количество провалов (макс 50%)
  const penaltyPct = Math.min(0.50, failCount * 0.05);

  if (!alreadyDone && !state._noptsMode) {
    state.chapterScores[ch.id] = state.chapterScore;
    state.totalScore          += state.chapterScore;
  } else if (state._noptsMode) {
    state.chapterScores[ch.id] = 0;
  }

  const allDone = CHAPTERS.every(c => state.completedChapters[c.id]);
  if (allDone) state.gameOver = true;
  updateLeaderboard();
  saveState();

  sendResultToBot({
    type: 'chapter_failed',
    chapter: ch.id,
    chapter_title: ch.title,
    score: state.chapterScore,
    total_score: state.totalScore,
    user_id: getTgUserId()
  });

  document.getElementById('fail-chapter-name').textContent = ch.title;
  document.getElementById('fail-score-line').textContent =
    `Набрано очков в этой главе: ${state.chapterScore}`;

  const nextIdx = state.chapter + 1;
  const nextBtn = document.getElementById('fail-next-btn');
  if (nextIdx < CHAPTERS.length && !allDone) {
    const nextCh = CHAPTERS[nextIdx];
    nextBtn.textContent = 'СЛЕДУЮЩАЯ ГЛАВА: ' + nextCh.title + ' →';
    nextBtn.onclick = () => showBriefing(nextIdx);
    nextBtn.style.display = 'block';
  } else if (allDone) {
    nextBtn.textContent = '🏆 СМОТРЕТЬ ИТОГ';
    nextBtn.onclick = () => showFinal();
    nextBtn.style.display = 'block';
  } else {
    nextBtn.style.display = 'none';
  }
  // Показываем кнопку повторной попытки с информацией о штрафе
  const retryBtn = document.getElementById('fail-retry-btn');
  const retryInfo = document.getElementById('fail-retry-info');
  const currentFailCount = state.chapterFailCounts[ch.id] || 1;
  const currentPenalty = Math.min(50, currentFailCount * 5);
  if (retryBtn) {
    retryBtn.style.display = 'block';
    retryBtn.textContent = '🔄 ПОПРОБОВАТЬ СНОВА';
    retryBtn.onclick = () => {
      state._isRetryAttempt = true;
      retryChapterWithPenalty(state.chapter);
    };
  }
  if (retryInfo) {
    retryInfo.style.display = 'block';
    retryInfo.innerHTML = currentFailCount === 1
      ? `⚠️ Повтор: штраф <b>-${currentPenalty}%</b> от набранных очков<br>Жизни восстановятся`
      : `⚠️ Повтор #${currentFailCount}: штраф <b>-${currentPenalty}%</b> от очков<br>Жизни восстановятся`;
  }
  playSound('game_lose');
  showScreen('s-chapter-fail');
}

// ═══════════════════════════════════════════════════════
//  ПОВТОРНАЯ ПОПЫТКА С ШТРАФОМ
// ═══════════════════════════════════════════════════════
function retryChapterWithPenalty(idx) {
  const ch = CHAPTERS[idx];
  // Сколько раз уже проваливал эту главу
  if (!state.chapterFailCounts) state.chapterFailCounts = {};
  const failCount = state.chapterFailCounts[ch.id] || 1;
  const penaltyPct = Math.min(0.50, failCount * 0.05); // 5%, 10%, ..., 50%

  // Вычитаем штраф из ОБЩЕГО счёта
  const penalty = Math.round(state.totalScore * penaltyPct);
  state.totalScore = Math.max(0, state.totalScore - penalty);

  // Убираем главу из завершённых чтобы можно было пройти снова
  delete state.completedChapters[ch.id];
  delete state.chapterScores[ch.id];

  // Сбрасываем жизни и счётчики
  state.lives = 5;
  state.chapterScore = 0;
  state.streak = 0;
  state._chapterErrors = 0;
  state._chapterHints = 0;

  saveState();
  // Синхронизируем с БД сразу — фиксируем штраф
  autoSync(false);
  showBriefing(idx);
}

function retryChapter(idx) {
  // Старая функция — оставляем для совместимости
  retryChapterWithPenalty(idx);
}

// ═══════════════════════════════════════════════════════
//  ДЕТАЛЬНАЯ СТАТИСТИКА + ПОДЕЛИТЬСЯ
// ═══════════════════════════════════════════════════════
function showMyStats() {
  const name  = tgUser ? (tgUser.first_name || 'Игрок') : 'Гость';
  const stats = state.chapterStats || {};
  const total = state.totalScore;
  const maxAll = CHAPTERS.reduce((s,ch) => s + ch.ciphers.reduce((a,c2) => a+c2.points, 0), 0);
  const pct   = Math.round(total / maxAll * 100);

  const rows = CHAPTERS.map(ch => {
    const s     = stats[ch.id];
    const score = state.chapterScores[ch.id] || 0;
    const maxCh = ch.ciphers.reduce((a,c2) => a+c2.points, 0);
    if (!state.completedChapters[ch.id]) {
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);opacity:.35">'
        + '<div style="font-size:16px">🔒</div>'
        + '<div style="flex:1;font-size:var(--fs-sm);color:var(--muted)">' + ch.title + '</div>'
        + '<div style="font-size:11px;color:var(--muted)">не пройдена</div></div>';
    }
    const sp = Math.round(score / maxCh * 100);
    const medal = sp >= 85 ? '🥇' : sp >= 60 ? '🥈' : '🥉';
    const timeTxt = s ? (s.time >= 60 ? Math.floor(s.time/60) + 'м ' + (s.time%60) + 'с' : s.time + 'с') : '—';
    const failTag = s && s.failed ? ' <span style="color:var(--accent2);font-size:9px">ПРОВАЛ</span>' : '';
    return '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
      + '<div style="font-size:16px">' + medal + '</div>'
      + '<div style="flex:1;font-family:var(--head);font-size:var(--fs-sm);color:#fdfaf0">' + ch.title + failTag + '</div>'
      + '<div style="font-family:var(--head);font-size:var(--fs-base);color:var(--accent)">' + score + '</div></div>'
      + '<div style="display:flex;gap:10px;font-size:10px;color:var(--muted);padding-left:24px">'
      + '<span>⏱ ' + timeTxt + '</span>'
      + (s ? '<span>❌ ' + s.errors + ' ош.</span>' : '')
      + (s ? '<span>💡 ' + s.hints + ' подск.</span>' : '')
      + '<span>' + sp + '%</span></div></div>';
  }).join('');

  let modal = document.getElementById('stats-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'stats-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.85);display:flex;align-items:flex-end;justify-content:center';
    modal.onclick = (e) => { if (e.target === modal) closeMyStats(); };
    document.body.appendChild(modal);
  }

  modal.innerHTML = '<div style="background:#161612;border-radius:16px 16px 0 0;width:100%;max-width:480px;max-height:85vh;overflow-y:auto;padding:20px 16px 32px">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
    + '<div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent);letter-spacing:.06em">МОЯ СТАТИСТИКА</div>'
    + '<button onclick="closeMyStats()" style="background:rgba(255,255,255,.08);border:none;color:var(--muted);font-size:18px;width:32px;height:32px;border-radius:50%;cursor:pointer">✕</button></div>'
    + '<div style="background:#242418;border:1px solid rgba(255,224,51,.12);border-radius:8px;padding:14px;margin-bottom:14px;display:flex;justify-content:space-around;text-align:center">'
    + '<div><div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent)">' + total + '</div><div style="font-size:10px;color:var(--muted)">ОЧКОВ</div></div>'
    + '<div><div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent)">' + Object.keys(state.completedChapters).length + '/6</div><div style="font-size:10px;color:var(--muted)">ГЛАВ</div></div>'
    + '<div><div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent)">' + pct + '%</div><div style="font-size:10px;color:var(--muted)">РЕЗУЛЬТАТ</div></div></div>'
    + '<div style="font-family:var(--head);font-size:var(--fs-xs);color:var(--muted);letter-spacing:.1em;margin-bottom:8px">// ПО ГЛАВАМ</div>'
    + rows
    + '<button onclick="shareMyTotal()" style="width:100%;margin-top:16px;background:rgba(255,224,51,.1);border:1px solid rgba(255,224,51,.25);color:var(--accent);padding:12px;font-family:var(--head);font-size:var(--fs-sm);font-weight:600;border-radius:4px;cursor:pointer;letter-spacing:.08em">📤 ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ</button>'
    + '</div>';

  modal.style.display = 'flex';
}

function closeAchModal() {
  const m = document.getElementById('ach-modal');
  if (m) m.style.display = 'none';
}

function showMyAchievements() {
  // Синхронизируем с сервером перед показом достижений
  fetchAndApplyState().then(() => _renderAchModal());
  function _renderAchModal() {
  let modal = document.getElementById('ach-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ach-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.85);display:flex;align-items:flex-end;justify-content:center';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    document.body.appendChild(modal);
  }
  const inner = document.createElement('div');
  inner.style.cssText = 'background:#161612;border-radius:16px 16px 0 0;width:100%;max-width:480px;max-height:85vh;overflow-y:auto;padding:0 0 32px';
  inner.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 16px 8px;position:sticky;top:0;background:#161612;z-index:1">'
    + '<div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent)">МОИ ДОСТИЖЕНИЯ</div>'
    + '<button onclick="closeAchModal()" style="background:rgba(255,255,255,.08);border:none;color:var(--muted);font-size:18px;width:32px;height:32px;border-radius:50%;cursor:pointer">✕</button></div>';
  renderAchievementsTab(inner);
  modal.innerHTML = '';
  modal.appendChild(inner);
  modal.style.display = 'flex';
  } // end _renderAchModal
}

function closeMyStats() {
  const modal = document.getElementById('stats-modal');
  if (modal) modal.style.display = 'none';
}

function shareMyTotal() {
  const total  = state.totalScore;
  const done   = Object.keys(state.completedChapters).length;
  const maxAll = CHAPTERS.reduce((s,ch) => s + ch.ciphers.reduce((a,c2) => a+c2.points, 0), 0);
  const pct    = Math.round(total / maxAll * 100);
  const medal  = pct >= 90 ? '🌟' : pct >= 75 ? '⭐' : pct >= 55 ? '🎖' : '🏅';
  const text   = medal + ' ШИФРОВАЛЬЩИК: ' + total + ' очков (' + pct + '%), ' + done + '/6 глав | СШ 3 г. Хойники';
  if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast('📋 Скопировано! Вставьте в чат'));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('📋 Скопировано! Вставьте в чат');
  } catch(e) { showToast('Не удалось скопировать'); }
}

// ═══════════════════════════════════════════════════════
//  ФИНАЛ
// ═══════════════════════════════════════════════════════
async function showFinal() {
  document.getElementById('final-score-val').textContent = state.totalScore;

  // ID игрока на финальном экране
  const uid = getTgUserId();
  const finalUidEl = document.getElementById('final-uid');
  if (finalUidEl && uid) {
    finalUidEl.textContent = 'ID: ' + uid;
    finalUidEl.style.display = 'block';
  }

  const maxAll = CHAPTERS.reduce((s,ch)=>s+ch.ciphers.reduce((a,c)=>a+c.points,0),0);
  const pct    = Math.round(state.totalScore / maxAll * 100);
  let rank = 'НОВОБРАНЕЦ';
  if (pct >= 90) rank = 'МАРШАЛ ПОБЕДЫ 🌟';
  else if (pct >= 75) rank = 'ПОЛКОВНИК РАЗВЕДКИ ⭐';
  else if (pct >= 55) rank = 'КАПИТАН ПОДПОЛЬЯ 🎖';
  else if (pct >= 35) rank = 'СЕРЖАНТ СВЯЗИ 🏅';

  document.getElementById('final-rank').textContent  = rank;
  document.getElementById('final-pct').textContent   = pct + '% от максимума';

  // Итоги по главам
  let rows = '';
  CHAPTERS.forEach(ch => {
    const s = state.chapterScores[ch.id] || 0;
    const m = ch.ciphers.reduce((a,c)=>a+c.points,0);
    rows += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:17px">
      <span>${ch.subtitle}: ${ch.title}</span>
      <span style="color:var(--accent)">${s}/${m}</span>
    </div>`;
  });
  document.getElementById('final-chapter-scores').innerHTML = rows;

  setTimeout(() => document.getElementById('final-stars').classList.add('show'), 800);
  setTimeout(() => playSound('game_win'), 300);
  setTimeout(() => launchConfetti(1500, 40), 500);

  sendResultToBot({
    type: 'game_complete',
    total_score: state.totalScore,
    rank: rank,
    pct: pct,
    user_id: getTgUserId()
  });

  showScreen('s-final');
}

// ═══════════════════════════════════════════════════════
//  ТАБЛИЦА ЛИДЕРОВ
// ═══════════════════════════════════════════════════════
function updateLeaderboard() {
  if (state.adminMode || state.testerMode || state.gameRole === 'admin' || state.gameRole === 'tester') {
    return;
  }
  const name  = getTgUserName();
  const uid   = getTgUserId() || 'guest';
  const entry = { uid, name, score: state.totalScore, completed: Object.keys(state.completedChapters).length };
  const idx   = state.leaderboard.findIndex(e => e.uid === uid);
  if (idx >= 0) {
    if (state.totalScore >= state.leaderboard[idx].score) state.leaderboard[idx] = entry;
  } else {
    state.leaderboard.push(entry);
  }
  state.leaderboard.sort((a,b) => b.score - a.score);
}

function renderLeaderboard() {
  const list = document.getElementById('lb-list-tab');
  // Помечаем текущего игрока
  const myUid = getTgUserId() || 'guest';
  if (!state.leaderboard.length) {
    list.innerHTML = '<div class="lb-empty">Загрузка рейтинга...<br><span style="font-size:var(--fs-base);color:var(--muted)">Данные придут при следующем открытии через бот</span></div>';
    return;
  }
  list.innerHTML = state.leaderboard.slice(0,20).map((e,i) => {
    const rankClass = i===0?'gold':i===1?'silver':i===2?'bronze':'';
    const medals    = ['🥇','🥈','🥉'];
    const isMe      = e.uid === myUid;
    const totalGlav = 6;
    const pct = Math.round((e.completed / totalGlav) * 100);
    const bar = '█'.repeat(Math.round(pct/10)) + '░'.repeat(10 - Math.round(pct/10));
    const doneTag = e.completed >= totalGlav
      ? '✅ Все главы · 100%'
      : `${e.completed}/${totalGlav} глав · ${pct}%`;
    return `<div class="lb-row" style="${isMe?'background:rgba(255,224,51,.07);border-left:3px solid var(--accent)':''}">
      <div class="lb-rank ${rankClass}">${medals[i]||String(i+1)}</div>
      <div style="flex:1">
        <div class="lb-name">${e.name}${isMe?' 👈':''}</div>
        <div class="lb-cls" style="font-size:var(--fs-xs);color:var(--muted)">${doneTag}</div>
      </div>
      <div class="lb-score">${e.score}</div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════
//  СБРОС (только для гостей без tg-аккаунта)
// ═══════════════════════════════════════════════════════
function confirmReset() {
  const isAdmin = state.adminMode || window._adminMode === true;
  if (!isAdmin) {
    // Обычный пользователь — сброс запрещён
    if (getTgUserId()) {
      alert('Прогресс сохранён в системе и не может быть удалён.');
    }
    return;
  }

  // Для админа — сброс тестового прогресса
  if (!confirm('Сбросить тестовый прогресс к нулю? Все главы останутся открытыми.')) return;

  // 1. Сбрасываем state но сохраняем adminMode
  try { localStorage.removeItem(storageKey()); } catch(e) {}
  state = DEFAULT_STATE();
  state.adminMode = true; // сохраняем режим!
  state.achievements = {};
  state.achievementPts = 0;

  // 2. Отправляем сброс в БД через /game_reset (полный сброс, игнорирует GREATEST)
  const syncUrl = window._syncUrl;
  const uid = getTgUserId();
  if (syncUrl && uid) {
    const resetUrl = syncUrl.replace('/game_sync', '/game_reset');
    const payload = { user_id: uid };
    const initDataRaw = getTgInitDataRaw();
    if (initDataRaw) payload.init_data = initDataRaw;
    fetch(resetUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    }).then(r => r.json())
      .then(d => console.log('✅ Прогресс сброшен в БД:', d))
      .catch(e => console.warn('reset sync error:', e));
  }

  // 3. Перерендеривем — в adminMode все главы открыты
  renderChapters();
  showToast('🗑 Прогресс сброшен');
}

function clearLocalGameCache(withProgress = false) {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (withProgress && key.startsWith('cipher_v4_')) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('pending_results');
    localStorage.removeItem(AUDIO_PREF_KEY);
    localStorage.removeItem(LEGACY_MUSIC_PREF_KEY);
  } catch (e) {
    console.warn('clearLocalGameCache error:', e);
  }
}

function confirmCacheReset(mode = 'keep_progress') {
  const withProgress = mode === 'with_progress';
  const msg = withProgress
    ? 'Очистить кэш вместе с локальным прогрессом на этом устройстве?'
    : 'Очистить кэш без удаления прогресса? (прогресс и главы останутся)';
  if (!confirm(msg)) return;
  clearLocalGameCache(withProgress);
  showToast(withProgress ? '🧹 Кэш и локальный прогресс очищены. Перезагрузка...' : '🧹 Кэш очищен без удаления прогресса. Перезагрузка...');
  setTimeout(() => window.location.reload(), 250);
}

function confirmCacheResetKeepProgress() {
  confirmCacheReset('keep_progress');
}

function confirmCacheResetWithProgress() {
  confirmCacheReset('with_progress');
}

function openBugReportModal() {
  const modal = document.getElementById('bug-report-modal');
  if (!modal) return;
  modal.classList.add('show');
}

function closeBugReportModal() {
  const modal = document.getElementById('bug-report-modal');
  if (!modal) return;
  modal.classList.remove('show');
}

function contactGameAdmin() {
  closeBugReportModal();
  const url = GAME_ADMIN_CHAT_URL;
  try {
    if (tg && typeof tg.openTelegramLink === 'function') {
      tg.openTelegramLink(url);
      return;
    }
    window.open(url, '_blank');
  } catch (e) {
    console.warn('contactGameAdmin error:', e);
    showToast('Не удалось открыть чат администратора');
  }
}

document.addEventListener('click', (event) => {
  const modal = document.getElementById('bug-report-modal');
  if (!modal || !modal.classList.contains('show')) return;
  if (event.target === modal) closeBugReportModal();
});

// ══════════════════════════════════════════════
//  WOW EFFECTS
// ══════════════════════════════════════════════

// ══ THREE.JS 3D INTRO ══
function init3DIntro() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const W = window.innerWidth, H = window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.set(0, 0, 5);

  // Каркасный куб — основной
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.6, 1.6),
    new THREE.MeshBasicMaterial({ color: 0xffe033, wireframe: true, transparent: true, opacity: 0.28 })
  );
  scene.add(cube);

  // Куб побольше — красный
  const cube2 = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 2.8, 2.8),
    new THREE.MeshBasicMaterial({ color: 0xff3a3a, wireframe: true, transparent: true, opacity: 0.09 })
  );
  scene.add(cube2);

  // Кольцо 1
  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.007, 2, 64),
    new THREE.MeshBasicMaterial({ color: 0xffe033, transparent: true, opacity: 0.18 })
  );
  ring1.rotation.x = Math.PI / 3;
  scene.add(ring1);

  // Кольцо 2
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(3.1, 0.004, 2, 64),
    new THREE.MeshBasicMaterial({ color: 0xff3a3a, transparent: true, opacity: 0.1 })
  );
  ring2.rotation.y = Math.PI / 4;
  scene.add(ring2);

  // Точки-частицы
  const ptPos = new Float32Array(150 * 3);
  for (let i = 0; i < ptPos.length; i++) ptPos[i] = (Math.random() - 0.5) * 12;
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3));
  const points = new THREE.Points(ptGeo,
    new THREE.PointsMaterial({ color: 0xffe033, size: 0.045, transparent: true, opacity: 0.55 })
  );
  scene.add(points);

  // Resize
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // Останавливаем когда интро неактивно
  let active = true;
  const introEl = document.getElementById('s-intro');
  new MutationObserver(() => {
    active = introEl.classList.contains('active');
  }).observe(introEl, { attributes: true, attributeFilter: ['class'] });

  let f = 0;
  (function loop() {
    requestAnimationFrame(loop);
    if (!active) return;
    f++;
    const t = f * 0.008;
    cube.rotation.x  =  t * 0.7;
    cube.rotation.y  =  t;
    cube2.rotation.x = -t * 0.4;
    cube2.rotation.y =  t * 0.5;
    ring1.rotation.z =  t * 0.3;
    ring2.rotation.x =  t * 0.2;
    points.rotation.y = t * 0.1;
    camera.position.x = Math.sin(t * 0.3) * 0.3;
    camera.position.y = Math.cos(t * 0.2) * 0.15;
    renderer.render(scene, camera);
  })();
}


// ══════════════════════════════
//  ДЕНЬ ПОБЕДЫ — ИНТРО
// ══════════════════════════════

// ── Фейерверк ──
(function initFireworks(){
  const c = document.getElementById('fireworks-canvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  function resize(){ c.width=window.innerWidth; c.height=window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = [
    '#ff4422','#ff8800','#ffcc00','#ffe033',
    '#ffffff','#ff3388','#44aaff','#88ff44'
  ];
  let rockets = [], particles = [], frame = 0;
  let active = true;

  const intro = document.getElementById('s-intro');
  new MutationObserver(()=>{ active = intro.classList.contains('active'); })
    .observe(intro, {attributes:true, attributeFilter:['class']});

  function spawnRocket(){
    rockets.push({
      x: c.width * (.2 + Math.random() * .6),
      y: c.height,
      tx: c.width * (.1 + Math.random() * .8),
      ty: c.height * (.1 + Math.random() * .45),
      color: COLORS[Math.floor(Math.random()*COLORS.length)],
      trail: []
    });
  }

  function explode(r){
    const n = 60 + Math.floor(Math.random()*50);
    for(let i=0;i<n;i++){
      const angle = (Math.PI*2/n)*i + Math.random()*.3;
      const speed = 1.5 + Math.random()*2.5;
      particles.push({
        x:r.tx, y:r.ty,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        color: r.color,
        life: 1,
        decay: .012 + Math.random()*.018,
        size: 2 + Math.random()*2
      });
    }
    // Искры вниз
    for(let i=0;i<12;i++){
      particles.push({
        x:r.tx, y:r.ty,
        vx: (Math.random()-.5)*1.5,
        vy: Math.random()*2,
        color:'#ffeeaa',
        life:1, decay:.03, size:1.5
      });
    }
  }

  function draw(){
    requestAnimationFrame(draw);
    if(!active){ ctx.clearRect(0,0,c.width,c.height); return; }
    ctx.fillStyle='rgba(0,0,0,.18)';
    ctx.fillRect(0,0,c.width,c.height);
    frame++;

    // Запускаем ракеты
    if(frame > 60 && frame % 90 === 0) spawnRocket();
    if(frame > 120 && frame % 130 === 0) spawnRocket();

    // Ракеты
    rockets = rockets.filter(r=>{
      r.trail.push({x:r.x,y:r.y});
      if(r.trail.length>12) r.trail.shift();
      const dx=r.tx-r.x, dy=r.ty-r.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist < 5){ explode(r); return false; }
      const speed = Math.min(dist*.12, 14);
      r.x += dx/dist*speed; r.y += dy/dist*speed;
      // Хвост
      r.trail.forEach((pt,i)=>{
        const a = (i/r.trail.length)*.8;
        ctx.beginPath();
        ctx.arc(pt.x,pt.y,1.5,0,Math.PI*2);
        ctx.fillStyle = r.color;
        ctx.globalAlpha = a;
        ctx.fill();
      });
      ctx.globalAlpha=1;
      ctx.beginPath();
      ctx.arc(r.x,r.y,3,0,Math.PI*2);
      ctx.fillStyle='#fff';
      ctx.fill();
      return true;
    });

    // Частицы взрыва
    particles = particles.filter(p=>{
      p.x+=p.vx; p.y+=p.vy;
      p.vy+=.04; // гравитация
      p.vx*=.97; p.vy*=.97;
      p.life-=p.decay;
      if(p.life<=0) return false;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);
      ctx.fillStyle=p.color;
      ctx.globalAlpha=p.life*.9;
      ctx.fill();
      ctx.globalAlpha=1;
      return true;
    });
  }
  draw();
})();

// ── Падающие цветы / лепестки ──
(function initPetals(){
  const c = document.getElementById('petals-canvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  function resize(){ c.width=window.innerWidth; c.height=window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  // Цвета лепестков — гвоздики (красные и белые, как в Беларуси на 9 мая)
  const PCOLORS = ['#cc2211','#dd3322','#ee4433','#ffffff','#ffeeee','#cc1133'];
  let petals=[], active=true;

  const intro = document.getElementById('s-intro');
  new MutationObserver(()=>{ active = intro.classList.contains('active'); })
    .observe(intro, {attributes:true, attributeFilter:['class']});

  for(let i=0;i<28;i++){
    petals.push({
      x: Math.random()*window.innerWidth,
      y: Math.random()*window.innerHeight - window.innerHeight,
      r: 3+Math.random()*5,
      vx: (Math.random()-.5)*.6,
      vy: .4+Math.random()*.7,
      rot: Math.random()*Math.PI*2,
      rotV: (Math.random()-.5)*.06,
      color: PCOLORS[Math.floor(Math.random()*PCOLORS.length)],
      wobble: Math.random()*Math.PI*2,
      wobbleS: .02+Math.random()*.03
    });
  }

  function drawPetal(p){
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.beginPath();
    // Форма лепестка — эллипс с заострением
    ctx.ellipse(0, 0, p.r, p.r*1.8, 0, 0, Math.PI*2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = .75;
    ctx.fill();
    // Блик
    ctx.beginPath();
    ctx.ellipse(-p.r*.2, -p.r*.3, p.r*.3, p.r*.5, -.5, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha=1;
  }

  function loop(){
    requestAnimationFrame(loop);
    if(!active){ ctx.clearRect(0,0,c.width,c.height); return; }
    ctx.clearRect(0,0,c.width,c.height);
    petals.forEach(p=>{
      p.wobble += p.wobbleS;
      p.x += p.vx + Math.sin(p.wobble)*.5;
      p.y += p.vy;
      p.rot += p.rotV;
      if(p.y > c.height+20){
        p.y = -20; p.x = Math.random()*c.width;
        p.color = PCOLORS[Math.floor(Math.random()*PCOLORS.length)];
      }
      drawPetal(p);
    });
  }
  loop();
})();

// ── Поэтапное появление элементов интро ──
function introEntrance(){
  const seq = [
    ['intro-stamp',  300],
    ['intro-date',   700],
    ['intro-title',  1000],
    ['intro-ribbon', 1500],
    ['intro-desc',   1900],
    ['intro-quote',  2300],
    ['intro-btn',    2700],
    ['intro-how',    2950],
    ['intro-memory', 3200],
    ['skyline',      800],
  ];
  seq.forEach(([id, ms])=> setTimeout(()=>{
    const el = document.getElementById(id);
    if(el) el.classList.add('intro-show');
  }, ms));
}


// Запускаем после загрузки
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { init3DIntro(); introEntrance(); });
} else {
  init3DIntro();
  introEntrance();
}


// ── Частицы на интро ──
(function initParticles(){
  const c = document.getElementById('particles-canvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  let W, H, pts = [];

  function resize(){
    W = c.width  = window.innerWidth;
    H = c.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const CHARS = '01-./·•✦АБВ'.split('');
  for(let i=0;i<55;i++) pts.push({
    x: Math.random()*window.innerWidth,
    y: Math.random()*window.innerHeight,
    s: Math.random()*10+8,
    v: Math.random()*.4+.1,
    o: Math.random()*.5+.1,
    c: CHARS[Math.floor(Math.random()*CHARS.length)]
  });

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.font = '12px monospace';
    pts.forEach(p=>{
      ctx.globalAlpha = p.o;
      ctx.fillStyle = '#ffe033';
      ctx.fillText(p.c, p.x, p.y);
      p.y += p.v;
      if(p.y > H+20){ p.y=-20; p.x=Math.random()*W; p.c=CHARS[Math.floor(Math.random()*CHARS.length)]; }
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
})();

// ── Декоративная карта (линии координат) ──
(function initMap(){
  const c = document.getElementById('map-canvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  c.width  = window.innerWidth;
  c.height = window.innerHeight;
  ctx.strokeStyle = '#ffe033';
  ctx.lineWidth = .5;
  // Сетка
  for(let x=0;x<c.width;x+=40){
    ctx.globalAlpha = .3;
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,c.height); ctx.stroke();
  }
  for(let y=0;y<c.height;y+=40){
    ctx.globalAlpha = .3;
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(c.width,y); ctx.stroke();
  }
  // Крестики
  ctx.globalAlpha = .8;
  [[.2,.3],[.7,.2],[.5,.7],[.8,.6],[.3,.8]].forEach(([rx,ry])=>{
    const x=rx*c.width, y=ry*c.height;
    ctx.beginPath();
    ctx.moveTo(x-8,y); ctx.lineTo(x+8,y);
    ctx.moveTo(x,y-8); ctx.lineTo(x,y+8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x,y,12,0,Math.PI*2);
    ctx.stroke();
  });
})();

// ── Радар ──
function startRadar(){
  const c = document.getElementById('radar-canvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  let angle = 0;
  (function frame(){
    ctx.clearRect(0,0,70,70);
    const cx=35,cy=35,r=30;
    // Круги
    ctx.strokeStyle='rgba(255,224,51,.5)'; ctx.lineWidth=.8;
    [10,20,30].forEach(rad=>{
      ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2); ctx.stroke();
    });
    // Кресс
    ctx.beginPath();
    ctx.moveTo(cx-r,cy); ctx.lineTo(cx+r,cy);
    ctx.moveTo(cx,cy-r); ctx.lineTo(cx,cy+r);
    ctx.stroke();
    // Луч
    const grad = ctx.createConicalGradient
      ? ctx.createConicalGradient(cx,cy,angle-Math.PI*.5)
      : null;
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(angle);
    const sweepGrad = ctx.createLinearGradient(0,0,r,0);
    sweepGrad.addColorStop(0,'rgba(255,224,51,.9)');
    sweepGrad.addColorStop(1,'rgba(255,224,51,0)');
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,r,-Math.PI*.3,0);
    ctx.closePath();
    ctx.fillStyle = sweepGrad;
    ctx.globalAlpha = .6;
    ctx.fill();
    ctx.restore();
    // Точки
    ctx.fillStyle='#ff3a3a';
    ctx.globalAlpha=1;
    [[15,10],[22,18],[-10,20]].forEach(([dx,dy])=>{
      ctx.beginPath();
      ctx.arc(cx+dx,cy+dy,2,0,Math.PI*2);
      ctx.fill();
    });
    angle += .04;
    requestAnimationFrame(frame);
  })();
}

// ── Конфетти при правильном ответе ──
function launchConfetti(){
  const colors=['#ffe033','#ff3a3a','#55dd55','#3af','#f3a','#fa3'];
  for(let i=0;i<50;i++){
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = [
      `left:${Math.random()*100}vw`,
      `top:-10px`,
      `background:${colors[Math.floor(Math.random()*colors.length)]}`,
      `transform:rotate(${Math.random()*360}deg)`,
      `width:${6+Math.random()*6}px`,
      `height:${6+Math.random()*6}px`,
      `animation-duration:${.8+Math.random()*1.2}s`,
      `animation-delay:${Math.random()*.4}s`
    ].join(';');
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 2500);
  }
}

// ── Эффект печатной машинки для шифра ──
function typewriterEffect(el, text, speed){
  el.textContent='';
  const cursor = document.createElement('span');
  cursor.className='cipher-cursor';
  el.appendChild(cursor);
  let i=0;
  const interval = setInterval(()=>{
    if(i < text.length){
      el.insertBefore(document.createTextNode(text[i]),cursor);
      i++;
    } else {
      clearInterval(interval);
      setTimeout(()=>cursor.remove(),1500);
    }
  }, speed||40);
}

// ── Глитч при ошибке ──
function triggerGlitch(el){
  el.classList.add('glitch');
  el.setAttribute('data-enc', el.textContent);
  setTimeout(()=>el.classList.remove('glitch'), 450);
}

// ── Пульс кнопки ──
function pulseBtn(el){
  el.classList.add('pulse');
  setTimeout(()=>el.classList.remove('pulse'), 650);
}

// ── Вспышка очков ──
function flashScore(el){
  el.classList.add('score-flash');
  setTimeout(()=>el.classList.remove('score-flash'), 450);
}

// ── Переопределяем loadCipher — добавляем typewriter ──
const _origLoadCipher = loadCipher;
loadCipher = function(){
  _origLoadCipher();
  const box = document.getElementById('cipher-box');
  const chapter = CHAPTERS[state.chapter];
  if (!box || !chapter || !Array.isArray(chapter.ciphers)) return;
  const cipher = chapter.ciphers[state.cipherIdx];
  if (!cipher) return;
  if(cipher.type !== 'morse' && cipher.type !== 'anagram' && cipher.type !== 'photo' && cipher.type !== 'map' && cipher.type !== 'math'){
    const originalText = box.textContent;
    if(originalText.trim()){
      box.textContent = '';
      typewriterEffect(box, originalText, 55);
    }
  }
};

// ── Переопределяем checkAnswer — добавляем эффекты ──
const _origCheck = checkAnswer;
let _checkAnswerBusy = false;
checkAnswer = async function(){
  if (_checkAnswerBusy) return;
  if (_isActiveCipherResolved()) return;
  _checkAnswerBusy = true;
  const btn = document.querySelector('.btn-check');
  if (btn) {
    pulseBtn(btn);
    btn.disabled = true;
  }
  try {
    await _origCheck();
  } catch (e) {
    console.error('checkAnswer failed:', e);
    const chapter = CHAPTERS[state.chapter];
    const cipher = chapter && Array.isArray(chapter.ciphers) ? chapter.ciphers[state.cipherIdx] : null;

    if (cipher && cipher.type === 'quiz' && (!_quizState || !_quizState.cipher)) {
      console.warn('checkAnswer recover: empty quiz state, reloading cipher');
      try { loadCipher(); } catch (reloadErr) { console.error('quiz reload failed:', reloadErr); }
      showToast('⚠ Задание обновлено. Нажмите «Проверить» снова');
    } else {
      showToast('⚠ Ошибка проверки. Попробуйте ещё раз');
    }
  } finally {
    if (btn && !_isActiveCipherResolved()) btn.disabled = false;
    setTimeout(() => { _checkAnswerBusy = false; }, 120);
  }
};

// ── Переопределяем showSuccess — добавляем конфетти ──
const _origSuccess = showSuccess;
showSuccess = function(cipher, pts, elapsed){
  try {
    _origSuccess(cipher, pts, elapsed);
  } catch (e) {
    console.error('showSuccess failed:', e);
    showToast('⚠ Ошибка экрана результата. Попробуйте ещё раз');
    return;
  }
  if(pts > 0) {
    launchConfetti();
    setTimeout(()=>{
      const el = document.getElementById('succ-pts');
      if(el) flashScore(el);
    }, 300);
  }
};

// ── Переопределяем showBriefing — запускаем радар ──
const _origBriefing = showBriefing;
showBriefing = function(idx){
  _origBriefing(idx);
  setTimeout(startRadar, 100);
};

// ── Анимируем карточки с задержкой ──
const _origRenderChapters = renderChapters;
renderChapters = function(){
  _origRenderChapters();
  document.querySelectorAll('.chapter-card').forEach((card,i)=>{
    card.style.animationDelay = (i*80)+'ms';
  });
};




// ═══════════════════════════════════════════════════════
//  НИЖНЕЕ МЕНЮ — ТАББАР
// ═══════════════════════════════════════════════════════
let currentTab = 'chapters';

function showBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (nav) nav.style.display = 'flex';
}

function hideBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (nav) nav.style.display = 'none';
}

function switchTab(tab) {
  currentTab = tab;

  // Деактивируем все экраны
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  // Деактивируем все табы
  document.querySelectorAll('.bn-tab').forEach(b => b.classList.remove('active'));

  showBottomNav();

  const screenMap = {
    'chapters':     's-chapters',
    'leaderboard':  's-leaderboard-tab',
    'profile':      's-profile-tab',
    'about':        's-about-tab',
    'achievements': 's-achievements-tab',
    'settings':     's-settings-tab',
  };
  const tabMap = {
    'chapters':     'bn-chapters',
    'leaderboard':  'bn-leaderboard',
    'profile':      'bn-profile',
    'about':        'bn-about',
    'achievements': 'bn-achievements',
    'settings':     'bn-settings',
  };

  const screenEl = document.getElementById(screenMap[tab]);
  const tabEl    = document.getElementById(tabMap[tab]);
  if (screenEl) screenEl.classList.add('active');
  if (tabEl)    tabEl.classList.add('active');

  if (tab === 'chapters')    { renderChapters(); fetchAndApplyState(); }
  if (tab === 'leaderboard') { renderLeaderboardTab(); fetchAndApplyState(); fetchAndApplyLeaderboard(); }
  if (tab === 'profile')     { renderProfileTab();     fetchAndApplyState(); }
  if (tab === 'about') {
    renderAboutTab();
    applyAboutBuildVersion();
  }
  if (tab === 'achievements') {
    const el = document.getElementById('achievements-tab-content');
    if (el) renderAchievementsTab(el);
  }
  if (tab === 'settings')     renderSettingsTab();
}

function renderAboutTab() {
  const el = document.getElementById('about-tab-content');
  if (!el) return;
  el.innerHTML = '<div style="background:linear-gradient(180deg,#1a1508 0%,#0d0b08 100%);padding:32px 20px 24px;text-align:center;border-bottom:1px solid rgba(255,224,51,.1)">'
    + '<div style="font-size:56px;margin-bottom:12px;filter:drop-shadow(0 0 24px rgba(255,224,51,.5))">🔐</div>'
    + '<div style="font-family:var(--head);font-size:var(--fs-2xl);color:var(--accent);letter-spacing:.08em;margin-bottom:4px">ШИФРОВАЛЬЩИК</div>'
    + '<div style="font-size:var(--fs-sm);color:var(--muted);letter-spacing:.06em">ВЕРСИЯ 1.0  ·  2025</div></div>'
    + '<div style="padding:20px 16px">'
    // О игре
    + '<div style="background:rgba(255,224,51,.04);border:1px solid rgba(255,224,51,.1);border-radius:8px;padding:16px;margin-bottom:14px">'
    + '<div style="font-family:var(--head);font-size:var(--fs-base);color:var(--accent);letter-spacing:.06em;margin-bottom:8px">📖 О ИГРЕ</div>'
    + '<div style="font-size:var(--fs-sm);color:rgba(255,255,255,.8);line-height:1.7"><b style="color:#fdfaf0">Шивровальщик</b> — образовательная игра о событиях Великой Отечественной войны на территории Беларуси. Вы — советский разведчик. Расшифруйте донесения, пройдите 6 операций и приблизьте День Победы.</div></div>'
    // Как играть
    + '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:16px;margin-bottom:14px">'
    + '<div style="font-family:var(--head);font-size:var(--fs-base);color:var(--accent);letter-spacing:.06em;margin-bottom:10px">🎮 КАК ИГРАТЬ</div>'
    + ['🗺 Выберите операцию — откройте главу и прочитайте брифинг',
       '🔐 Расшифруйте послание — 6 типов шифров',
       '❤️ 5 жизней на главу — каждая ошибка минус жизнь',
       '⚡ Скорость = очки — чем быстрее, тем больше',
       '🔥 Стрик — серия правильных ответов даёт бонус +5% за каждый',
       '🏆 Таблица лидеров — соревнуйтесь с другими учениками'
      ].map(t => '<div style="font-size:var(--fs-sm);color:rgba(255,255,255,.75);padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04)">' + t + '</div>').join('')
    + '</div>'
    // Операции
    + '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:16px;margin-bottom:14px">'
    + '<div style="font-family:var(--head);font-size:var(--fs-base);color:var(--accent);letter-spacing:.06em;margin-bottom:10px">📚 ОПЕРАЦИИ</div>'
    + [['I','🏙','Подполье Минска','Минск · Июль 1942'],
       ['II','💣','Рельсовая война','Витебск · Август 1943'],
       ['III','⚔️','Операция Багратион','Беларусь · Июнь 1944'],
       ['IV','🚩','Последний шифр','Берлин · Май 1945'],
       ['V','🌍','Знай свою землю','Беларусь · История'],
       ['VI','🎖','Дорога к Победе','Беларусь · 1941–1945']
      ].map(([n,ic,t,p]) => '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        + '<div style="font-size:18px">' + ic + '</div>'
        + '<div><div style="font-size:var(--fs-sm);color:#fdfaf0"><span style="color:var(--muted);font-size:10px">ГЛАВА ' + n + ' · </span>' + t + '</div>'
        + '<div style="font-size:10px;color:var(--muted)">' + p + '</div></div></div>'
      ).join('')
    + '</div>'
    // Разработка
    + '<div style="background:rgba(255,224,51,.04);border:1px solid rgba(255,224,51,.1);border-radius:8px;padding:16px;margin-bottom:14px">'
    + '<div style="font-family:var(--head);font-size:var(--fs-base);color:var(--accent);letter-spacing:.06em;margin-bottom:10px">👨‍💻 РАЗРАБОТКА</div>'
    + '<div style="display:flex;gap:12px;align-items:center;margin-bottom:10px"><div style="font-size:28px">🏫</div><div><div style="font-size:var(--fs-sm);color:#fdfaf0;font-weight:600">СШ №3 г. Хойники</div><div style="font-size:11px;color:var(--muted)">Государственное учреждение образования</div></div></div>'
    + '<div style="display:flex;gap:12px;align-items:center"><div style="font-size:28px">👨‍🎓</div><div><div style="font-size:var(--fs-sm);color:#fdfaf0;font-weight:600">Гуд Юрий Петрович</div><div style="font-size:11px;color:var(--muted)">Разработчик · Учитель информатики</div></div></div></div>'
    // Поддержка
    + '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:16px;margin-bottom:14px">'
    + '<div style="font-family:var(--head);font-size:var(--fs-base);color:var(--accent);letter-spacing:.06em;margin-bottom:10px">🆘 ПОДДЕРЖКА</div>'
    + '<div style="display:flex;gap:12px;align-items:center;margin-bottom:8px"><div style="font-size:22px">💬</div><div><div style="font-size:var(--fs-sm);color:#fdfaf0">Telegram</div><div style="font-size:11px;color:var(--muted)">@Yury_hud</div></div></div>'
    + '<div style="display:flex;gap:12px;align-items:center;margin-bottom:8px"><div style="font-size:22px">📧</div><div><div style="font-size:var(--fs-sm);color:#fdfaf0">Email</div><div style="font-size:11px;color:var(--muted)">uragud.2020@gmail.com</div></div></div>'
    + '<div style="display:flex;gap:12px;align-items:center"><div style="font-size:22px">🕐</div><div><div style="font-size:var(--fs-sm);color:#fdfaf0">Время ответа</div><div style="font-size:11px;color:var(--muted)">Пн–Пт, 9:00–18:00</div></div></div></div>'
    + '<div style="text-align:center;padding:12px 0;color:var(--muted);font-size:10px;letter-spacing:.06em">ШИФРОВАЛЬЩИК v1.0 · © 2025 СШ №3 г. Хойники</div>'
    + '</div>';
}

function applyAboutBuildVersion() {
  const el = document.getElementById('about-tab-content');
  if (!el) return;
  let buildVersion = 'vdev';
  try {
    const params = new URLSearchParams(window.location.search || '');
    const raw = (params.get('v') || window.__BOOT_VERSION || '').toString().trim();
    if (raw) buildVersion = 'v' + raw;
  } catch (e) {}
  const buildYear = String(new Date().getFullYear());
  let html = el.innerHTML || '';
  html = html.replace(/v1\.0/g, buildVersion);
  html = html.replace(/1\.0/g, buildVersion.toUpperCase());
  html = html.replace(/2025/g, buildYear);
  el.innerHTML = html;
}

function renderLeaderboardTab() {
  const list = document.getElementById('lb-list-tab');
  if (!list) return;
  syncTopStatusBars();
  // Если leaderboard пустой но tgInitLB есть — подгружаем
  if (!state.leaderboard.length && tgInitLB.length) mergeBotLeaderboard();
  const lb    = state.leaderboard || [];
  const myUid = getTgUserId() || 'guest';
  const total = lb.length;

  // Переключатель вкладок — объявляем ДО header чтобы использовать в шаблоне
  const currentRatingTab = window._ratingTab || 'score';

  // Шапка
  const header = `<div style="padding:12px 16px 8px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div>
        <div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent)">РЕЙТИНГ</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">👥 ${total || 0} уч. · <span style="color:rgba(255,224,51,.5)">👆 нажми на себя</span></div>
      </div>
      <button onclick="switchTab('leaderboard')"
        style="background:rgba(255,224,51,.1);border:1px solid rgba(255,224,51,.2);
        color:var(--accent);padding:6px 10px;border-radius:4px;font-family:var(--head);
        font-size:var(--fs-xs);cursor:pointer">🔄</button>
    </div>
    <div style="display:flex;gap:6px">
      <button onclick="window._ratingTab='score';renderLeaderboardTab()"
        style="flex:1;padding:7px;border-radius:6px;font-family:var(--head);font-size:10px;
        cursor:pointer;letter-spacing:.05em;border:1px solid rgba(255,224,51,.2);
        background:${currentRatingTab==='score'?'rgba(255,224,51,.15)':'transparent'};
        color:${currentRatingTab==='score'?'var(--accent)':'var(--muted)'}">⭐ ОЧКИ</button>
      <button onclick="window._ratingTab='achievements';renderLeaderboardTab()"
        style="flex:1;padding:7px;border-radius:6px;font-family:var(--head);font-size:10px;
        cursor:pointer;letter-spacing:.05em;border:1px solid rgba(255,224,51,.2);
        background:${currentRatingTab==='achievements'?'rgba(255,224,51,.15)':'transparent'};
        color:${currentRatingTab==='achievements'?'var(--accent)':'var(--muted)'}">🏅 ДОСТИЖЕНИЯ</button>
    </div>
  </div>`;

  if (!lb.length) {
    list.innerHTML = header + `
    <div style="text-align:center;padding:50px 24px">
      <div style="font-size:56px;margin-bottom:16px;filter:drop-shadow(0 0 20px rgba(255,224,51,.3))">🏆</div>
      <div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent);
        margin-bottom:8px;letter-spacing:.06em">ПОКА ПУСТО</div>
      <div style="font-size:var(--fs-sm);color:var(--muted);line-height:1.6;margin-bottom:24px">
        Никто ещё не прошёл ни одной главы.<br>
        <b style="color:#fdfaf0">Стань первым шивровальщиком школы!</b>
      </div>
      <button onclick="showMyStats()" style="width:100%;margin-bottom:8px;background:rgba(255,224,51,.08);border:1px solid rgba(255,224,51,.2);color:var(--accent);padding:11px;font-family:var(--head);font-size:var(--fs-sm);font-weight:600;border-radius:4px;cursor:pointer;letter-spacing:.08em">📊 ДЕТАЛЬНАЯ СТАТИСТИКА</button>
    <button onclick="showMyAchievements()" style="width:100%;margin-bottom:10px;background:rgba(255,180,0,.06);border:1px solid rgba(255,180,0,.2);color:#ffb400;padding:11px;font-family:var(--head);font-size:var(--fs-sm);font-weight:600;border-radius:4px;cursor:pointer;letter-spacing:.08em">🏅 МОИ ДОСТИЖЕНИЯ · ${Object.keys(state.achievements||{}).length}/${ACHIEVEMENTS.length}</button>
    <button onclick="switchTab('chapters')"
        style="background:var(--accent);color:#0a0a08;border:none;padding:12px 24px;
        font-family:var(--head);font-size:var(--fs-base);font-weight:700;
        border-radius:4px;cursor:pointer;letter-spacing:.08em;width:100%">
        ▶ НАЧАТЬ ИГРУ
      </button>
    </div>`;
    return;
  }

  const medals = ['🥇','🥈','🥉'];
  const myRole2 = state.gameRole || ((tgInitMe && tgInitMe.role) || '');
  const isAdminUser = myRole2 === 'admin';
  // Фильтруем: обычные игроки не видят админов/тестировщиков в рейтинге
  const filteredLb = isAdminUser
    ? lb  // Админ видит всех
    : lb.filter(e => e.role !== 'admin' && e.role !== 'tester');

  const visibleLb = isAdminUser ? filteredLb : filteredLb.slice(0, 10);
  const rows = visibleLb.map((e,i) => {
    const isMe   = e.uid === myUid;
    const pct    = Math.round((e.completed / 6) * 100);
    const done   = e.completed >= 6 ? '✅ Все главы' : `${e.completed}/6 глав · ${pct}%`;
    const rankBg = i===0?'rgba(255,215,0,.06)':i===1?'rgba(192,192,192,.04)':i===2?'rgba(205,127,50,.04)':'';
    const roleIcon  = e.role === 'admin' ? ' 👑' : e.role === 'tester' ? ' 🧪' : '';
    const roleTag   = e.role === 'admin' ? ' <span style="font-size:9px;color:var(--accent);opacity:.7;letter-spacing:.04em">(АДМИН)</span>'
                    : e.role === 'tester' ? ' <span style="font-size:9px;color:var(--muted);letter-spacing:.04em">(ТЕСТ)</span>'
                    : '';
    const roleLabel = e.role === 'admin' ? 'Администратор' : e.role === 'tester' ? 'Тестировщик' : '';
    const clickAttr = isMe ? ' onclick="showMyStats()" ' : '';
    return `<div ${clickAttr}style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.04);background:${isMe?'rgba(255,224,51,.06)':rankBg};${isMe?'border-left:3px solid var(--accent);cursor:pointer':''}">
      <div style="font-size:22px;min-width:30px;text-align:center;line-height:1">
        ${medals[i] || '<span style="font-family:var(--head);font-size:var(--fs-sm);color:var(--muted)">'+(i+1)+'</span>'}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-family:var(--head);font-size:var(--fs-base);
          color:${isMe?'var(--accent)':'#fdfaf0'};
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${e.name}${roleIcon}${roleTag}${isMe?' 👈':''}
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px;letter-spacing:.04em;display:flex;gap:6px">
          <span>${done}</span>
          ${roleLabel ? `<span style="color:rgba(255,224,51,.4)">${roleLabel}</span>` : ''}
        </div>
      </div>
      <div style="font-family:var(--head);font-size:var(--fs-xl);
        color:${isMe?'var(--accent)':'#c4b06a'};
        text-shadow:${isMe?'0 0 12px rgba(255,224,51,.5)':'none'}">
        ${e.score}
      </div>
    </div>`;
  }).join('');

  // Моя позиция если не в топ-20
  const myInTop = visibleLb.some(e => e.uid === myUid);
  const myPos   = myInTop ? '' : `
    <div style="margin:12px 16px;padding:12px;
      background:rgba(255,224,51,.05);border:1px solid rgba(255,224,51,.15);border-radius:6px;
      font-size:var(--fs-sm);color:var(--muted);text-align:center">
      📍 Вы не в топ-10. Нажмите на своё имя в рейтинге для статистики.
    </div>`;

  if (currentRatingTab === 'achievements') {
    // Рейтинг достижений
    const achLb = visibleLb.map((e, i) => {
      const isMe = e.uid === myUid;
      const achCount = e.achievementCount || 0;
      const achPts   = e.achievementPts   || 0;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span style="font-family:var(--head);font-size:var(--fs-sm);color:var(--muted)">${i+1}</span>`;
      return `<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;
        border-bottom:1px solid rgba(255,255,255,.04);
        background:${isMe?'rgba(255,224,51,.06)':''}">
        <div style="font-size:20px;min-width:28px;text-align:center">${medal}</div>
        <div style="flex:1">
          <div style="font-family:var(--head);font-size:var(--fs-sm);color:${isMe?'var(--accent)':'#fdfaf0'}">${e.name}${isMe?' 👈':''}</div>
          <div style="font-size:10px;color:var(--muted)">${achCount} достижений</div>
        </div>
        <div style="font-family:var(--head);font-size:var(--fs-md);color:var(--accent)">+${achPts}⭐</div>
      </div>`;
    }).join('');
    list.innerHTML = header + (achLb || '<div style="padding:40px;text-align:center;color:var(--muted);font-style:italic">Данные загружаются...</div>');
  } else {
    list.innerHTML = header + rows + myPos;
  }
}

function renderProfileTab() {
  const el = document.getElementById('profile-tab-content');
  if (!el) return;
  const uid = getTgUserId();
  const name = tgUser ? (tgUser.first_name || 'Игрок') : 'Гость';
  // Progress is rendered from current synchronized state
  const completed = _stateCompletedCount();
  const pct = Math.round((completed / CHAPTERS.length) * 100);

  // Role comes from synchronized game state
  const myRole = state.gameRole || (tgInitMe && tgInitMe.role) || 'player';
  const roleLabels = { admin: '👑 Администратор', tester: '🧪 Тестировщик', player: '' };

  // Звание по очкам
  const titles = [
    [0,   'Новобранец', '🎖'],
    [35,  'Сержант связи', '🏅'],
    [55,  'Капитан подполья', '🎖'],
    [75,  'Полковник разведки', '⭐'],
    [90,  'Маршал Победы', '🌟'],
  ];
  const maxScore = CHAPTERS.reduce((s,ch) => s + ch.ciphers.reduce((a,c2) => a+c2.points, 0), 0);
  const scorePct = Math.round((state.totalScore / maxScore) * 100);
  const rank = titles.filter(t => scorePct >= t[0]).pop() || titles[0];

  const roleLabel2 = roleLabels[myRole] || '';
  const nextRankData = titles.find(([t]) => scorePct < t);
  const toNextRank = nextRankData ? Math.max(0, Math.ceil(nextRankData[0] / 100 * maxScore) - state.totalScore) : 0;
  const nextRankName2 = nextRankData ? nextRankData[1] : null;

  // Строим историю глав
  const chapterHistory = CHAPTERS.map(ch => {
    const done  = !!state.completedChapters[ch.id];
    const score = state.chapterScores[ch.id] || 0;
    const icon  = done ? (score > 0 ? '✅' : '💔') : '🔒';
    const color = done ? (score > 0 ? 'var(--green)' : 'var(--accent2)') : 'rgba(255,255,255,.2)';
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;
        border-bottom:1px solid rgba(255,255,255,.04)">
      <div style="font-size:18px">${icon}</div>
      <div style="flex:1">
        <div style="font-size:var(--fs-sm);color:${done?'#fdfaf0':'rgba(255,255,255,.3)'}">${ch.title}</div>
        <div style="font-size:10px;color:var(--muted)">${ch.subtitle}</div>
      </div>
      <div style="font-family:var(--head);font-size:var(--fs-sm);color:${color}">
        ${score ? score + ' оч' : done ? '—' : ''}
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:52px;margin-bottom:10px;filter:drop-shadow(0 0 16px rgba(255,224,51,.4))">${rank[2]}</div>
      <div style="font-family:var(--head);font-size:var(--fs-2xl);color:var(--accent);letter-spacing:.04em">${name}</div>
      <div style="font-size:var(--fs-sm);color:var(--muted);margin-top:4px;letter-spacing:.06em">${rank[1].toUpperCase()}</div>
      ${roleLabel2 ? `<div style="margin-top:6px;font-family:var(--head);font-size:var(--fs-sm);color:var(--accent);letter-spacing:.06em;opacity:.8">${roleLabel2}</div>` : ''}
      <div style="margin-top:10px;display:inline-flex;align-items:center;gap:6px;
        background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
        border-radius:20px;padding:5px 14px">
        <span style="font-size:10px;color:var(--muted);letter-spacing:.06em">TELEGRAM ID</span>
        <span style="font-family:var(--mono);font-size:var(--fs-sm);color:#fdfaf0">${uid || 'гость'}</span>
      </div>
    </div>
    <div style="background:#141108;border:1px solid rgba(255,224,51,.12);border-radius:8px;padding:16px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-around;text-align:center">
        <div>
          <div style="font-family:var(--head);font-size:var(--fs-2xl);color:var(--accent)">${state.totalScore}</div>
          <div style="font-size:10px;color:var(--muted);letter-spacing:.06em">ОЧКОВ</div>
        </div>
        <div>
          <div style="font-family:var(--head);font-size:var(--fs-2xl);color:var(--accent)">${completed}/${CHAPTERS.length}</div>
          <div style="font-size:10px;color:var(--muted);letter-spacing:.06em">ГЛАВ</div>
        </div>
        <div>
          <div style="font-family:var(--head);font-size:var(--fs-2xl);color:var(--accent)">${pct}%</div>
          <div style="font-size:10px;color:var(--muted);letter-spacing:.06em">ПРОГРЕСС</div>
        </div>
      </div>
      <!-- Прогресс-бар -->
      <div style="margin-top:12px;background:rgba(255,255,255,.06);border-radius:4px;height:6px;overflow:hidden">
        <div style="height:100%;background:var(--accent);border-radius:4px;width:${pct}%;transition:width .5s"></div>
      </div>
    </div>
    <div style="margin-top:16px">
      <div style="font-family:var(--head);font-size:var(--fs-xs);color:var(--muted);
        letter-spacing:.1em;margin-bottom:8px">// МОИ ГЛАВЫ</div>
      ${chapterHistory}
    </div>
    <button onclick="switchTab('chapters')"
      style="width:100%;margin-top:16px;background:var(--accent);color:#0a0a08;
      border:none;padding:12px;font-family:var(--head);font-size:var(--fs-base);
      font-weight:700;border-radius:4px;cursor:pointer;letter-spacing:.08em">
      ▶ ПРОДОЛЖИТЬ ИГРУ
    </button>
    <div style="text-align:center;margin-top:12px;font-size:10px;color:var(--muted);letter-spacing:.04em">
      💾 Прогресс сохраняется автоматически
    </div>
    ${(state.adminMode || window._adminMode) ? '<button class="btn-back" onclick="confirmReset()" style="width:100%;margin-top:8px">🗑 Сбросить тестовый прогресс</button>' : ''}`;
}


// (Синхронизация выполняется автоматически через autoSync)


// ═══════════════════════════════════════════════════════
//  НАВИГАЦИЯ И ПАУЗА
// ═══════════════════════════════════════════════════════
let pausedFromScreen = null;

function pauseGame() {
  saveState();
  stopTimer();
  autoSync(false);
  pausedFromScreen = 's-cipher';
  hideBottomNav();
  const ch  = CHAPTERS[state.chapter];
  const el  = document.getElementById('pause-chapter-info');
  if (el && ch) {
    el.textContent = ch.subtitle + ' · ' + ch.title + ' · Задание ' + (state.cipherIdx + 1) + '/' + ch.ciphers.length;
  }
  showScreen('s-pause');
}

function resumeGame() {
  const target = pausedFromScreen || 's-cipher';
  pausedFromScreen = null;
  hideBottomNav();
  showScreen(target);
  if (target === 's-cipher') startTimer();
}

function goToChapters() {
  unlockAudioInteraction();
  stopTimer();
  saveState();
  showScreen('s-chapters');
  renderChapters();
  showBottomNav();
  // Синхронизация
  autoSync(false);
}

function exitToMain() {
  saveState();
  autoSync(false); // сохраняем перед выходом
  if (tg) {
    setTimeout(() => tg.close(), 300); // даём время на отправку
  } else {
    goToChapters();
  }
}


// ═══════════════════════════════════════════════════════
//  ВИКТОРИНА (QUIZ)
// ═══════════════════════════════════════════════════════
let _quizState = { cipher: null, startTime: 0, selected: null, answered: false };

function renderQuiz(cipher) {
  _quizState = { cipher, startTime: Date.now(), selected: null, answered: false };

  // quiz-container — уже скрыт в loadCipher, показываем
  const container = document.getElementById('quiz-container');
  if (!container) return;
  container.style.cssText = 'display:block;width:100%;padding:0 2px;margin-bottom:8px';

  const letters = ['А', 'Б', 'В', 'Г', 'Д'];
  const optionsHtml = cipher.options.map((opt, i) => `
    <div id="quiz-opt-${i}" onclick="quizSelect(${i})"
      style="width:100%;padding:13px 16px;margin-bottom:8px;
      background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.1);
      border-radius:10px;color:#fdfaf0;font-size:14px;cursor:pointer;
      display:flex;align-items:center;gap:12px;
      transition:all .15s ease;box-sizing:border-box;user-select:none">
      <div id="quiz-letter-${i}" style="flex-shrink:0;width:30px;height:30px;border-radius:50%;
        background:rgba(255,224,51,.08);border:1.5px solid rgba(255,224,51,.2);
        display:flex;align-items:center;justify-content:center;
        font-family:var(--head);font-size:13px;color:var(--accent);
        transition:all .15s">${letters[i]||String.fromCharCode(65+i)}</div>
      <span style="flex:1;line-height:1.5">${opt}</span>
    </div>`).join('');

  container.innerHTML = `
    <div id="quiz-options-list">${optionsHtml}</div>
    <div id="quiz-feedback" style="display:none;padding:10px 14px;border-radius:8px;
      margin-top:4px;font-size:13px;text-align:center;font-family:var(--head);
      letter-spacing:.04em"></div>`;

  // Обновляем кнопку "Проверить" — она работает для quiz через checkAnswer()
  // checkAnswer определяет что задание quiz и вызывает quizSubmit
  const checkBtn = document.getElementById('btn-check') || document.querySelector('.btn-check');
  if (checkBtn) {
    checkBtn.style.display = '';
    checkBtn.textContent = '✓ ПРОВЕРИТЬ';
    checkBtn.disabled = false;
  }
}

function quizSelect(idx) {
  if (_quizState.answered) return;
  _quizState.selected = idx;

  // Визуальный выбор
  _quizState.cipher.options.forEach((_, i) => {
    const opt = document.getElementById('quiz-opt-' + i);
    const let_ = document.getElementById('quiz-letter-' + i);
    if (!opt) return;
    if (i === idx) {
      opt.style.background    = 'rgba(255,224,51,.12)';
      opt.style.borderColor   = 'rgba(255,224,51,.45)';
      if (let_) { let_.style.background = 'rgba(255,224,51,.25)'; let_.style.borderColor = 'rgba(255,224,51,.6)'; let_.style.color = '#ffe033'; }
    } else {
      opt.style.background    = 'rgba(255,255,255,.04)';
      opt.style.borderColor   = 'rgba(255,255,255,.1)';
      if (let_) { let_.style.background = 'rgba(255,224,51,.08)'; let_.style.borderColor = 'rgba(255,224,51,.2)'; let_.style.color = 'var(--accent)'; }
    }
  });
}

function quizSubmit() {
  if (_quizState.answered) return;
  if (_isActiveCipherResolved()) return;
  const chapter = CHAPTERS[state.chapter];
  const fallbackCipher = chapter && Array.isArray(chapter.ciphers) ? chapter.ciphers[state.cipherIdx] : null;
  if (!_quizState.cipher && fallbackCipher && fallbackCipher.type === 'quiz') {
    _quizState.cipher = fallbackCipher;
  }
  const cipher = _quizState.cipher;
  if (!cipher || !Array.isArray(cipher.options) || !Number.isInteger(cipher.correctIndex)) {
    console.warn('quizSubmit: invalid quiz state, forcing reload', _quizState);
    _quizState.answered = false;
    showToast('⚠ Ошибка викторины. Задание будет перезагружено');
    setTimeout(() => {
      try { loadCipher(); } catch (e) { console.error('quizSubmit reload failed:', e); }
    }, 80);
    return;
  }
  if (_quizState.selected === null) {
    // Подсвечиваем что нужно выбрать
    const container = document.getElementById('quiz-container');
    if (container) {
      container.style.animation = 'none';
      container.style.border = '1.5px solid rgba(255,100,50,.4)';
      container.style.borderRadius = '10px';
      setTimeout(() => { container.style.border = ''; }, 800);
    }
    showToast('👆 Сначала выберите вариант ответа');
    return;
  }
  _quizState.answered = true;

  const correct = cipher.correctIndex;
  const sel     = _quizState.selected;
  const elapsed = getEffectiveElapsed(_quizState.startTime);
  const isOk    = sel === correct;

  // Подсвечиваем результат
  cipher.options.forEach((_, i) => {
    const opt  = document.getElementById('quiz-opt-' + i);
    const let_ = document.getElementById('quiz-letter-' + i);
    if (!opt) return;
    opt.style.cursor = 'default';
    if (i === correct && isOk) {
      opt.style.background  = 'rgba(40,200,80,.15)';
      opt.style.borderColor = 'rgba(40,200,80,.5)';
      opt.style.color = '#50ee80';
      if (let_) { let_.style.background = 'rgba(40,200,80,.25)'; let_.style.borderColor = 'rgba(40,200,80,.6)'; let_.style.color = '#50ee80'; }
    } else if (i === sel && !isOk) {
      opt.style.background  = 'rgba(255,50,50,.12)';
      opt.style.borderColor = 'rgba(255,50,50,.45)';
      opt.style.color = '#ff7070';
      if (let_) { let_.style.background = 'rgba(255,50,50,.2)'; let_.style.borderColor = 'rgba(255,50,50,.5)'; let_.style.color = '#ff7070'; }
    } else {
      opt.style.opacity = '0.35';
    }
  });

  const feedback = document.getElementById('quiz-feedback');

  if (isOk) {
    _markActiveCipherResolved();
    const checkBtn = document.getElementById('btn-check') || document.querySelector('.btn-check');
    if (checkBtn) checkBtn.disabled = true;
    playSound('correct');
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = 'rgba(40,200,80,.1)';
      feedback.style.border = '1px solid rgba(40,200,80,.3)';
      feedback.style.color = '#50ee80';
      feedback.textContent = '✅ Верно!';
    }
    state.streak = (state.streak || 0) + 1;
    const pts = calcPoints(cipher, elapsed);
    state.chapterScore += pts;
    saveState();
    autoSync(false, true);
    stopTimer();
    if (elapsed <= 5) state._fastAnswers = (state._fastAnswers || 0) + 1;
    registerSolvedCipherType('quiz');
    try {
      checkAchievements({ elapsed, firstTry: (state._chapterErrors||0)===0, cipherType: 'quiz', quizCorrect: true });
    } catch (achErr) {
      console.warn('quizSubmit: achievements update skipped', achErr);
    }
    setTimeout(() => {
      const qc = document.getElementById('quiz-container');
      if (qc) qc.style.display = 'none';
      const ciw = document.getElementById('cipher-input-wrap');
      if (ciw) ciw.style.display = '';
      showSuccess(cipher, pts, elapsed);
    }, 900);
  } else {
    playSound('wrong');
    screenPulseRed();
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = 'rgba(255,50,50,.1)';
      feedback.style.border = '1px solid rgba(255,50,50,.3)';
      feedback.style.color = '#ff8080';
      feedback.textContent = '❌ Неверно — выберите другой вариант';
    }
    state.streak = 0;
    state._chapterErrors = (state._chapterErrors||0) + 1;
    if (!state.adminMode) {
      state.lives--;
      animateLifeLoss();
      screenPulseRed();
      playSound('life_lost');
    }
    saveState();
    autoSync(false, true);
    renderLives();

    if (state.lives <= 0 && !state.adminMode) {
      stopTimer();
      setTimeout(() => restartChapterFromStart(state.chapter), 900);
    } else {
      // Сбрасываем через 1.5с — убираем подсветку, даём выбрать снова
      setTimeout(() => {
        _quizState.answered = false;
        _quizState.selected = null;
        cipher.options.forEach((_, i) => {
          const opt2  = document.getElementById('quiz-opt-' + i);
          const let2  = document.getElementById('quiz-letter-' + i);
          if (!opt2) return;
          opt2.style.background  = 'rgba(255,255,255,.04)';
          opt2.style.borderColor = 'rgba(255,255,255,.1)';
          opt2.style.color = '#fdfaf0';
          opt2.style.opacity = '1';
          opt2.style.cursor = 'pointer';
          if (let2) { let2.style.background = 'rgba(255,224,51,.08)'; let2.style.borderColor = 'rgba(255,224,51,.2)'; let2.style.color = 'var(--accent)'; }
        });
        if (feedback) feedback.style.display = 'none';
      }, 1500);
    }
  }
}

function checkQuizAnswer(idx) { quizSelect(idx); }


// ═══════════════════════════════════════════════════════

// Удалён дублирующий блок quiz (renderQuiz/quizSubmit), оставлена единая версия выше.
// ═══════════════════════════════════════════════════════
//  АНАГРАММА
// ═══════════════════════════════════════════════════════
let anagramState = { letters: [], placed: [], indices: [] };

function renderAnagram(cipher) {
  const box = document.getElementById('cipher-box');
  box.style.display = 'none';

  // Перемешанные буквы
  const letters = cipher.encrypted.split('');
  anagramState = { letters: [...letters], placed: Array(letters.length).fill(null), usedIdx: Array(letters.length).fill(false) };

  const ref = document.getElementById('cipher-ref');
  ref.innerHTML = `
    <div class="cipher-ref-title">// СОСТАВЬ СЛОВО</div>
    <div style="font-size:var(--fs-sm);color:var(--accent);font-weight:700;margin-bottom:10px;text-align:center;letter-spacing:.04em">
      👆 Тапай на буквы ниже — составляй слово<br>
      <span style="color:var(--muted);font-size:var(--fs-xs);font-weight:400">(ввод вручную не рекомендуется)</span>
    </div>
    <div class="anagram-answer" id="ag-answer">${
      letters.map((_,i) => `<div class="anagram-slot" id="ag-slot-${i}" onclick="removeFromSlot(${i})"></div>`).join('')
    }</div>
    <div class="anagram-pool" id="ag-pool">${
      letters.map((l,i) => `<div class="anagram-letter" id="ag-letter-${i}" onclick="addToSlot(${i})">${l}</div>`).join('')
    }</div>
    <div style="text-align:center">
      <button class="anagram-reset" onclick="resetAnagram()">↺ Сбросить</button>
    </div>`;
}

function addToSlot(letterIdx) {
  if (anagramState.usedIdx[letterIdx]) return;
  const slotIdx = anagramState.placed.indexOf(null);
  if (slotIdx === -1) return;
  anagramState.placed[slotIdx] = letterIdx;
  anagramState.usedIdx[letterIdx] = true;
  // Обновляем UI
  document.getElementById(`ag-letter-${letterIdx}`).classList.add('used');
  const slot = document.getElementById(`ag-slot-${slotIdx}`);
  slot.textContent = anagramState.letters[letterIdx];
  slot.classList.add('filled');
  // Если все слоты заполнены — автопроверка
  if (!anagramState.placed.includes(null)) {
    setTimeout(checkAnagram, 300);
  }
}

function removeFromSlot(slotIdx) {
  const letterIdx = anagramState.placed[slotIdx];
  if (letterIdx === null) return;
  anagramState.placed[slotIdx] = null;
  anagramState.usedIdx[letterIdx] = false;
  document.getElementById(`ag-letter-${letterIdx}`).classList.remove('used');
  const slot = document.getElementById(`ag-slot-${slotIdx}`);
  slot.textContent = '';
  slot.classList.remove('filled');
}

function resetAnagram() {
  const cipher = CHAPTERS[state.chapter].ciphers[state.cipherIdx];
  renderAnagram(cipher);
}

async function checkAnagram() {
  if (_isActiveCipherResolved()) return;
  const cipher  = CHAPTERS[state.chapter].ciphers[state.cipherIdx];
  const answer  = anagramState.placed.map(i => i !== null ? anagramState.letters[i] : '').join('');
  const elapsed = getEffectiveElapsed(state.startTime);

  // Подсветить слоты
  const slots = document.querySelectorAll('.anagram-slot');
  const ansHash = await sha256(answer.toUpperCase());
  if (ansHash === cipher.answer) {
    _markActiveCipherResolved();
    state.streak = (state.streak || 0) + 1;
    playSound('correct');
    stopTimer();
    slots.forEach(s => { s.style.borderColor = '#55dd55'; s.style.background = 'rgba(85,221,85,.15)'; });
    const pts = calcPoints(cipher, elapsed);
    state.chapterScore += pts;
    if (elapsed <= 5) state._fastAnswers = (state._fastAnswers || 0) + 1;
    registerSolvedCipherType('anagram');
    try {
      checkAchievements({
        elapsed,
        firstTry: (state._chapterErrors || 0) === 0,
        cipherType: 'anagram',
        anagramCorrect: true
      });
    } catch (achErr) {
      console.warn('checkAnagram: achievements update skipped', achErr);
    }
    saveState();
    autoSync(false, true);
    setTimeout(() => showSuccess(cipher, pts, elapsed), 600);
  } else {
    state.streak = 0;
    state._chapterErrors = (state._chapterErrors || 0) + 1;
    slots.forEach(s => { s.style.borderColor = '#ff3a3a'; s.style.background = 'rgba(255,58,58,.1)'; });
    setTimeout(() => slots.forEach(s => { s.style.borderColor = ''; s.style.background = ''; }), 800);
    screenPulseRed();
    if (!state.adminMode) {
      state.lives--;
      animateLifeLoss();
      playSound('life_lost');
    } else {
      playSound('wrong');
    }
    saveState();
    autoSync(false, true);
    if (state.lives <= 0) {
      if (state.adminMode) {
        state.lives = 5; saveState(); autoSync(false, true); renderLives();
        setTimeout(resetAnagram, 500);
      } else { setTimeout(() => restartChapterFromStart(state.chapter), 900); }
    } else { renderLives(); setTimeout(resetAnagram, 900); }
  }
}

// ═══════════════════════════════════════════════════════
//  КАРТА БЕЛАРУСИ
// ═══════════════════════════════════════════════════════
const MAP_CITIES = [
  { name:'МИНСК',    x:188, y:175, hint:'Столица' },
  { name:'БРЕСТ',    x:62,  y:268, hint:'Юго-запад' },
  { name:'ГРОДНО',   x:75,  y:148, hint:'Северо-запад' },
  { name:'ВИТЕБСК',  x:255, y:82,  hint:'Север' },
  { name:'МОГИЛЁВ',  x:268, y:198, hint:'Восток' },
  { name:'ГОМЕЛЬ',   x:278, y:298, hint:'Юго-восток' },
  { name:'ПОЛОЦК',   x:215, y:72,  hint:'Север' },
  { name:'БАРАНОВИЧИ',x:130, y:212, hint:'Центр-запад' },
  { name:'ПИНСК',    x:110, y:285, hint:'Юг' },
  { name:'БОБРУЙСК', x:228, y:240, hint:'Центр' },
];

let mapAnswered = false;

function renderMap(cipher) {
  mapAnswered = false;
  const target = cipher.mapCity;
  const ref = document.getElementById('cipher-ref');

  const dots = MAP_CITIES.map(c => {
    const isTarget = false; // не показываем правильный заранее
    return `<g class="map-city-dot" id="mcdot-${c.name}" onclick="checkMapAnswer('${c.name}')">
      <circle cx="${c.x}" cy="${c.y}" r="6" fill="#ffe033" opacity=".7" stroke="#0a0a08" stroke-width="1"/>
      <text class="map-city-label" x="${c.x + 9}" y="${c.y + 4}">${c.name}</text>
    </g>`;
  }).join('');

  ref.innerHTML = `
    <div class="cipher-ref-title">// КАРТА БЕЛАРУСИ — тапни по нужному городу</div>
    <div class="map-container">
      <svg viewBox="0 0 360 370" xmlns="http://www.w3.org/2000/svg">
        
        <path d="M80,20 L100,15 L130,18 L160,12 L195,18 L230,14 L265,22 L290,35 L310,55 L318,80
                 L322,105 L315,130 L320,155 L315,175 L322,200 L318,225 L308,248 L295,268
                 L275,285 L255,298 L230,308 L205,318 L175,322 L148,318 L120,310 L95,298
                 L72,282 L55,262 L42,238 L35,212 L30,185 L28,158 L32,132 L28,105
                 L35,80 L48,58 L65,40 Z"
              fill="#1a1a0c" stroke="#3a3a20" stroke-width="1.5"/>
        
        <path d="M188,175 L200,140 L215,100 L225,70" stroke="#1a3a5a" stroke-width="2" fill="none" opacity=".5"/>
        <path d="M188,175 L170,200 L145,230 L120,258 L95,275" stroke="#1a3a5a" stroke-width="1.5" fill="none" opacity=".4"/>
        
        ${dots}
      </svg>
    </div>
    <div class="map-hint-text" id="map-hint-text">Тапни по городу на карте</div>`;
}

async function checkMapAnswer(clicked, target) {
  if (mapAnswered) return;
  if (_isActiveCipherResolved()) return;
  const elapsed = getEffectiveElapsed(state.startTime);
  const cipher  = CHAPTERS[state.chapter].ciphers[state.cipherIdx];

  const dotEl = document.getElementById(`mcdot-${clicked}`);

  const clickedHash = await sha256(clicked);
  if (clickedHash === cipher.answer) {
    mapAnswered = true;
    _markActiveCipherResolved();
    state.streak = (state.streak || 0) + 1;
    playSound('correct');
    stopTimer();
    if (dotEl) dotEl.querySelector('circle').setAttribute('fill','#55dd55');
    document.getElementById('map-hint-text').textContent = '✅ Верно! ' + (cipher.mapCity || clicked);
    const pts = calcPoints(cipher, elapsed);
    state.chapterScore += pts;
    if (elapsed <= 5) state._fastAnswers = (state._fastAnswers || 0) + 1;
    registerSolvedCipherType('map');
    try {
      checkAchievements({
        elapsed,
        firstTry: (state._chapterErrors || 0) === 0,
        cipherType: 'map',
        mapCorrect: true
      });
    } catch (achErr) {
      console.warn('checkMapAnswer: achievements update skipped', achErr);
    }
    saveState();
    autoSync(false, true);
    setTimeout(() => showSuccess(cipher, pts, elapsed), 800);
  } else {
    state.streak = 0;
    state._chapterErrors = (state._chapterErrors || 0) + 1;
    if (dotEl) {
      const c = dotEl.querySelector('circle');
      c.setAttribute('fill','#ff3a3a');
      setTimeout(() => c.setAttribute('fill','#ffe033'), 700);
    }
    document.getElementById('map-hint-text').textContent = '❌ Не здесь. Попробуй ещё раз.';
    screenPulseRed();
    if (!state.adminMode) {
      state.lives--;
      animateLifeLoss();
      playSound('life_lost');
    } else {
      playSound('wrong');
    }
    saveState();
    autoSync(false, true);
    if (state.lives <= 0) {
      if (state.adminMode) {
        state.lives = 5; saveState(); autoSync(false, true); renderLives();
        document.getElementById('map-hint-text').textContent = '⚡ Режим админа: жизни восстановлены';
      } else { setTimeout(() => restartChapterFromStart(state.chapter), 900); }
    } else { renderLives(); }
  }
}


// ═══════════════════════════════════════════════════════
//  ЗВУКОВЫЕ ЭФФЕКТЫ (Web Audio API — без файлов)
// ═══════════════════════════════════════════════════════
let _audioCtx = null;
let _bgMusic = null;
let _audioUnlocked = false;
const AUDIO_PREF_KEY = 'cipher_audio_prefs_v2';
const LEGACY_MUSIC_PREF_KEY = 'cipher_music_enabled_v1';
let musicEnabled = true;
let sfxEnabled = true;
let musicVolume = 0.45;
let sfxVolume = 0.8;
let musicTrackIndex = 0;
const _brokenMusicTrackIds = new Set();
let _musicFailoverInProgress = false;
let _musicValidationStarted = false;

const GAME_MUSIC_TRACKS = [
  {
    id: 'epic_boss_battle',
    title: 'Epic Boss Battle (CC0)',
    url: 'https://opengameart.org/sites/default/files/Juhani%20Junkala%20-%20Epic%20Boss%20Battle%20%5BSeamlessly%20Looping%5D.wav'
  },
  {
    id: 'determination',
    title: 'Determination (CC0)',
    url: 'https://opengameart.org/sites/default/files/determination.mp3'
  },
  {
    id: 'prepare_your_swords',
    title: 'Prepare Your Swords (CC0)',
    url: 'https://opengameart.org/sites/default/files/prepare_your_swords.mp3'
  },
  {
    id: 'adventuring_song',
    title: 'Adventuring Song (CC0)',
    url: 'https://opengameart.org/sites/default/files/adventuring_song.mp3'
  },
  {
    id: 'town_theme',
    title: 'Town Theme (CC0)',
    url: 'https://opengameart.org/sites/default/files/TownTheme.mp3'
  }
];

function _clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function _normVolume(raw, fallback) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  const normalized = n > 1 ? (n / 100) : n;
  return _clamp(normalized, 0, 1);
}

function getCurrentMusicTrack() {
  return GAME_MUSIC_TRACKS[musicTrackIndex] || GAME_MUSIC_TRACKS[0];
}

function getNextWorkingTrackIndex(startIdx = 0) {
  const total = GAME_MUSIC_TRACKS.length;
  if (!total) return -1;
  for (let step = 1; step <= total; step++) {
    const idx = (startIdx + step) % total;
    const track = GAME_MUSIC_TRACKS[idx];
    if (track && !_brokenMusicTrackIds.has(track.id)) return idx;
  }
  return -1;
}

function onMusicTrackFailed(trackId) {
  if (_musicFailoverInProgress) return;
  _musicFailoverInProgress = true;
  try {
    if (trackId) _brokenMusicTrackIds.add(trackId);
    const nextIdx = getNextWorkingTrackIndex(musicTrackIndex);
    if (nextIdx === -1) {
      musicEnabled = false;
      saveAudioPreferences();
      syncMusicButtons();
      const audio = ensureBackgroundMusic();
      if (audio) audio.pause();
      showToast('🔇 Музыка недоступна: треки не загрузились');
      return;
    }
    musicTrackIndex = nextIdx;
    saveAudioPreferences();
    syncMusicButtons();
    const track = getCurrentMusicTrack();
    if (track) showToast('🎼 Переключено: ' + track.title);
    applyBackgroundMusic(true);
  } finally {
    _musicFailoverInProgress = false;
  }
}

function probeMusicTrack(url, timeoutMs = 7000) {
  return new Promise(resolve => {
    let done = false;
    const audio = new Audio();
    const cleanup = () => {
      audio.oncanplaythrough = null;
      audio.onloadedmetadata = null;
      audio.onerror = null;
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch (e) {}
    };
    const finish = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      cleanup();
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    audio.preload = 'auto';
    audio.oncanplaythrough = () => finish(true);
    audio.onloadedmetadata = () => finish(true);
    audio.onerror = () => finish(false);
    try {
      audio.src = url;
      audio.load();
    } catch (e) {
      finish(false);
    }
  });
}

async function validateMusicTracksInBackground() {
  if (_musicValidationStarted) return;
  _musicValidationStarted = true;
  for (const track of GAME_MUSIC_TRACKS) {
    const ok = await probeMusicTrack(track.url, 7000);
    if (!ok) _brokenMusicTrackIds.add(track.id);
  }
  const current = getCurrentMusicTrack();
  if (current && _brokenMusicTrackIds.has(current.id)) {
    onMusicTrackFailed(current.id);
  }
}

function loadAudioPreferences() {
  try {
    const raw = localStorage.getItem(AUDIO_PREF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      musicEnabled = parsed.musicEnabled !== false;
      sfxEnabled = parsed.sfxEnabled !== false;
      musicVolume = _normVolume(parsed.musicVolume, 0.45);
      sfxVolume = _normVolume(parsed.sfxVolume, 0.8);
      const idx = Number(parsed.musicTrackIndex);
      musicTrackIndex = Number.isInteger(idx) ? _clamp(idx, 0, GAME_MUSIC_TRACKS.length - 1) : 0;
      return;
    }
    const old = localStorage.getItem(LEGACY_MUSIC_PREF_KEY);
    if (old !== null) musicEnabled = old === '1';
  } catch (e) {}
}

function saveAudioPreferences() {
  try {
    localStorage.setItem(AUDIO_PREF_KEY, JSON.stringify({
      musicEnabled,
      sfxEnabled,
      musicVolume,
      sfxVolume,
      musicTrackIndex
    }));
    localStorage.setItem(LEGACY_MUSIC_PREF_KEY, musicEnabled ? '1' : '0');
  } catch (e) {}
}

function ensureBackgroundMusic() {
  if (_bgMusic) return _bgMusic;
  try {
    _bgMusic = new Audio();
    _bgMusic.loop = true;
    _bgMusic.preload = 'auto';
    _bgMusic.addEventListener('error', () => {
      const failedId = _bgMusic && _bgMusic.dataset ? _bgMusic.dataset.trackId : '';
      console.warn('background music load error', failedId, _bgMusic && _bgMusic.error);
      onMusicTrackFailed(failedId);
    });
  } catch (e) {
    _bgMusic = null;
  }
  return _bgMusic;
}

function applyBackgroundMusic(forceTrackReload = false) {
  const audio = ensureBackgroundMusic();
  if (!audio) return;
  let track = getCurrentMusicTrack();
  if (!track) return;
  if (_brokenMusicTrackIds.has(track.id)) {
    const nextIdx = getNextWorkingTrackIndex(musicTrackIndex);
    if (nextIdx !== -1 && nextIdx !== musicTrackIndex) {
      musicTrackIndex = nextIdx;
      saveAudioPreferences();
      track = getCurrentMusicTrack();
    }
  }
  if (!track || _brokenMusicTrackIds.has(track.id)) {
    audio.pause();
    return;
  }

  if (forceTrackReload || audio.dataset.trackId !== track.id) {
    audio.src = track.url;
    audio.dataset.trackId = track.id;
  }

  const riskBoost = 1 + (_riskIntensity * 0.18);
  audio.volume = _clamp(musicVolume * riskBoost, 0, 1);
  if (!musicEnabled || !_audioUnlocked || document.hidden) {
    audio.pause();
    return;
  }
  const p = audio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

function unlockAudioInteraction() {
  _audioUnlocked = true;
  const ctx = getAudio();
  if (ctx && ctx.state === 'suspended') {
    try { ctx.resume(); } catch (e) {}
  }
  void validateMusicTracksInBackground();
  applyBackgroundMusic(false);
}

function syncMusicButtons() {
  const btn = document.getElementById('btn-toggle-music');
  if (!btn) return;
  const track = getCurrentMusicTrack();
  btn.textContent = musicEnabled ? '🎵 МУЗЫКА: ON' : '🔇 МУЗЫКА: OFF';
  btn.style.opacity = musicEnabled ? '1' : '0.7';
  if (track) btn.title = 'Трек: ' + track.title;
}

function toggleMusicEnabled() {
  musicEnabled = !musicEnabled;
  if (musicEnabled) _audioUnlocked = true;
  saveAudioPreferences();
  syncMusicButtons();
  applyBackgroundMusic(false);
  showToast(musicEnabled ? '🎵 Музыка включена' : '🔇 Музыка выключена');
}

function toggleSfxEnabled() {
  sfxEnabled = !sfxEnabled;
  saveAudioPreferences();
  showToast(sfxEnabled ? '🔊 Эффекты включены' : '🔇 Эффекты выключены');
}

function setMusicTrack(indexLike) {
  const idx = Number(indexLike);
  if (!Number.isInteger(idx) || idx < 0 || idx >= GAME_MUSIC_TRACKS.length) return;
  musicTrackIndex = idx;
  // Выбор трека в настройках — явное действие пользователя.
  // Сразу разрешаем и запускаем музыку, не дожидаясь старта главы.
  _audioUnlocked = true;
  if (!musicEnabled) musicEnabled = true;
  const ctx = getAudio();
  if (ctx && ctx.state === 'suspended') {
    try { ctx.resume(); } catch (e) {}
  }
  const selectedTrack = GAME_MUSIC_TRACKS[idx];
  if (selectedTrack) _brokenMusicTrackIds.delete(selectedTrack.id);
  saveAudioPreferences();
  applyBackgroundMusic(true);
  syncMusicButtons();
  const track = getCurrentMusicTrack();
  if (track) showToast('🎼 Трек: ' + track.title);
}

function setMusicVolume(valueLike) {
  const n = Number(valueLike);
  if (!Number.isFinite(n)) return;
  const normalized = n > 1 ? (n / 100) : n;
  musicVolume = _clamp(normalized, 0, 1);
  if (musicVolume > 0 && !musicEnabled) musicEnabled = true;
  unlockAudioInteraction();
  saveAudioPreferences();
  syncMusicButtons();
  applyBackgroundMusic(false);
  const slider = document.getElementById('music-volume-range');
  if (slider) slider.value = String(Math.round(musicVolume * 100));
  const v = document.getElementById('music-vol-value');
  if (v) v.textContent = Math.round(musicVolume * 100) + '%';
}

function setSfxVolume(valueLike) {
  const n = Number(valueLike);
  if (!Number.isFinite(n)) return;
  const normalized = n > 1 ? (n / 100) : n;
  sfxVolume = _clamp(normalized, 0, 1);
  if (sfxVolume > 0 && !sfxEnabled) sfxEnabled = true;
  unlockAudioInteraction();
  saveAudioPreferences();
  const slider = document.getElementById('sfx-volume-range');
  if (slider) slider.value = String(Math.round(sfxVolume * 100));
  try { playSound('hint'); } catch (e) {}
  const v = document.getElementById('sfx-vol-value');
  if (v) v.textContent = Math.round(sfxVolume * 100) + '%';
}

loadAudioPreferences();
function getAudio() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _audioCtx;
}

function playSound(type) {
  if (!sfxEnabled || sfxVolume <= 0) return;
  const ctx = getAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    try { ctx.resume(); } catch (e) {}
  }
  const level = (base) => Math.max(0.0001, base * sfxVolume * (1 + _riskIntensity * 0.35));
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(784, now + 0.1);
      gain.gain.setValueAtTime(level(0.3), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.setValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(level(0.2), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'chapter_win') {
      const freqs = [523, 659, 784, 1047];
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(f, now + i * 0.1);
        g.gain.setValueAtTime(level(0.25), now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.3);
      });
    } else if (type === 'life_lost') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
      gain.gain.setValueAtTime(level(0.2), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'hint') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(level(0.15), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'game_win') {
      [523,659,784,880,1047].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = i % 2 === 0 ? 'sine' : 'triangle';
        o.frequency.setValueAtTime(f, now + i * 0.08);
        g.gain.setValueAtTime(level(0.2), now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        o.start(now + i * 0.08); o.stop(now + 1.5);
      });
    } else if (type === 'game_lose') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(294, now);
      osc.frequency.linearRampToValueAtTime(196, now + 0.2);
      osc.frequency.linearRampToValueAtTime(131, now + 0.45);
      gain.gain.setValueAtTime(level(0.25), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now); osc.stop(now + 0.55);
    }
  } catch(e) {}
}


// ═══════════════════════════════════════════════════════
//  КОНФЕТТИ (улучшенное)
// ═══════════════════════════════════════════════════════
document.addEventListener('pointerdown', unlockAudioInteraction, { once: true, passive: true });
document.addEventListener('keydown', unlockAudioInteraction, { once: true });
document.addEventListener('visibilitychange', () => applyBackgroundMusic(false));
applyBackgroundMusic(true);

function launchConfetti(duration = 800, intensity = 20) {
  // Вспышки по краям экрана вместо конфетти сверху
  const colors = ['#ffe033','#ff4455','#55ee66','#4488ff','#ff88ff'];
  const positions = [
    { left: '0', top: '20%' },
    { left: '0', top: '50%' },
    { right: '0', top: '20%' },
    { right: '0', top: '50%' },
  ];
  positions.forEach((pos, idx) => {
    setTimeout(() => {
      const flash = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      flash.style.cssText = `position:fixed;${Object.entries(pos).map(([k,v])=>k+':'+v).join(';')};
        width:60px;height:60px;border-radius:50%;pointer-events:none;z-index:9995;
        background:radial-gradient(circle,${color}cc 0%,${color}00 70%);
        animation:flashPulse .6s ease-out forwards`;
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 700);
    }, idx * 80);
  });
}

// ═══════════════════════════════════════════════════════
//  ЭКРАН ЗАГРУЗКИ
// ═══════════════════════════════════════════════════════
function showSplash() {
  const splash = document.createElement('div');
  splash.id = 'splash-screen';
  splash.style.cssText = `position:fixed;inset:0;z-index:9000;background:#0a0a08;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    transition:opacity .5s ease`;

  splash.innerHTML = `
    <div style="font-size:72px;margin-bottom:16px;animation:popIn .6s ease both">🔐</div>
    <div style="font-family:var(--head);font-size:var(--fs-hero);color:var(--accent);
      letter-spacing:.06em;text-align:center;line-height:.9;
      text-shadow:0 0 40px rgba(255,224,51,.6)">ШИФРО<br>ВАЛЬЩИК</div>
    <div style="margin-top:24px;width:200px;height:3px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden">
      <div id="splash-bar" style="height:100%;width:0%;background:var(--accent);border-radius:2px;
        transition:width .05s linear;box-shadow:0 0 8px var(--accent)"></div>
    </div>
    <div style="margin-top:10px;font-size:var(--fs-xs);color:var(--muted);letter-spacing:.1em">ЗАГРУЗКА...</div>
  `;
  document.body.appendChild(splash);

  // Анимируем прогресс-бар
  let pct = 0;
  const bar = splash.querySelector('#splash-bar');
  const interval = setInterval(() => {
    pct += Math.random() * 15;
    if (pct >= 100) { pct = 100; clearInterval(interval); }
    bar.style.width = pct + '%';
    if (pct >= 100) {
      setTimeout(() => {
        splash.style.opacity = '0';
        splash.style.pointerEvents = 'none'; // немедленно разрешаем клики под сплэшем
        setTimeout(() => { try { splash.remove(); } catch(_){} }, 500);
      }, 200);
    }
  }, 80);
  // Гарантированное удаление сплэша через 3 секунды (защита от зависания)
  setTimeout(() => {
    clearInterval(interval);
    try {
      splash.style.opacity = '0';
      splash.style.pointerEvents = 'none';
      setTimeout(() => { try { splash.remove(); } catch(_){} }, 500);
    } catch(_){}
  }, 3000);
}

// ═══════════════════════════════════════════════════════
//  ПУЛЬСАЦИЯ ЭКРАНА ПРИ ПОТЕРЕ ЖИЗНИ
// ═══════════════════════════════════════════════════════
function screenPulseRed() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;z-index:9998;pointer-events:none;
    background:rgba(255,50,50,0);transition:background .1s ease`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.background = 'rgba(255,50,50,0.18)';
    setTimeout(() => {
      overlay.style.background = 'rgba(255,50,50,0)';
      setTimeout(() => overlay.remove(), 200);
    }, 150);
  });
}


// ═══════════════════════════════════════════════════════
//  СИСТЕМА ДОСТИЖЕНИЙ (50 штук)
// ═══════════════════════════════════════════════════════
const ACHIEVEMENTS = [
  { id:'fast_5', icon:'⚡', name:'Молния', desc:'Дай правильный ответ за 5 секунд', pts:10 },
  { id:'fast_10', icon:'🚀', name:'Ускорение', desc:'5 быстрых ответов (<=10 сек)', pts:25 },
  { id:'fast_25', icon:'🌪️', name:'Штурм', desc:'25 быстрых ответов (<=10 сек)', pts:60 },
  { id:'streak_3', icon:'🔥', name:'На серии', desc:'Серия из 3 правильных ответов', pts:15 },
  { id:'streak_5', icon:'💥', name:'Без промаха', desc:'Серия из 5 правильных ответов', pts:30 },
  { id:'streak_8', icon:'☄️', name:'Огненный темп', desc:'Серия из 8 правильных ответов', pts:55 },
  { id:'chapter_1', icon:'🏅', name:'Первый рубеж', desc:'Заверши 1 главу', pts:20 },
  { id:'chapter_3', icon:'🥈', name:'Полпути', desc:'Заверши 3 главы', pts:45 },
  { id:'chapter_6', icon:'🥇', name:'Операция завершена', desc:'Заверши все 6 глав', pts:120 },
  { id:'flawless_1', icon:'🎯', name:'Снайпер', desc:'Заверши главу без ошибок', pts:40 },
  { id:'flawless_3', icon:'💎', name:'Холодный расчёт', desc:'3 главы без ошибок', pts:95 },
  { id:'no_hints_1', icon:'🧠', name:'Аналитик', desc:'Заверши главу без подсказок', pts:30 },
  { id:'no_hints_3', icon:'🎓', name:'Мастер шифра', desc:'3 главы без подсказок', pts:70 },
  { id:'score_500', icon:'⭐', name:'Первые очки', desc:'Набери 500 очков', pts:10 },
  { id:'score_1200', icon:'🌟', name:'Крепкий результат', desc:'Набери 1200 очков', pts:25 },
  { id:'score_2500', icon:'🏆', name:'В элите', desc:'Набери 2500 очков', pts:55 },
  { id:'score_4000', icon:'👑', name:'Легенда штаба', desc:'Набери 4000 очков', pts:90 },
  { id:'type_morse', icon:'📡', name:'Радист', desc:'Реши 3 задания Морзе', pts:20 },
  { id:'type_math', icon:'➗', name:'Штабной математик', desc:'Реши 3 математических задания', pts:20 },
  { id:'type_map', icon:'🗺️', name:'Навигатор', desc:'Реши 2 задания по карте', pts:20 },
  { id:'all_types', icon:'🎭', name:'Универсал', desc:'Реши все 6 типов заданий', pts:60 },
  { id:'comeback', icon:'💪', name:'Возвращение', desc:'Пройди главу после провала', pts:35 },
  { id:'survivor', icon:'🛡️', name:'На волоске', desc:'Заверши главу с 1 жизнью', pts:35 },
  { id:'school_time', icon:'🏫', name:'Школьный час', desc:'Играй с 8:00 до 15:00', pts:10 },
  { id:'weekend', icon:'📆', name:'Выходной разведчик', desc:'Играй в субботу или воскресенье', pts:10 },
  { id:'collector_8', icon:'🗃️', name:'Коллекционер', desc:'Получи 8 достижений', pts:30 },
  { id:'collector_16', icon:'🧩', name:'Архивариус', desc:'Получи 16 достижений', pts:65 },
];

const ARTIFACTS = [
  { id:'artifact_ch1', icon:'📜', rarity:'common', name:'Донесение Полесья', desc:'Открыто за завершение главы I' },
  { id:'artifact_ch2', icon:'🧾', rarity:'common', name:'Подпольный пропуск', desc:'Открыто за завершение главы II' },
  { id:'artifact_ch3', icon:'📻', rarity:'rare', name:'Радиограмма штаба', desc:'Открыто за завершение главы III' },
  { id:'artifact_ch4', icon:'🗂️', rarity:'rare', name:'Оперативная сводка', desc:'Открыто за завершение главы IV' },
  { id:'artifact_ch5', icon:'🧭', rarity:'epic', name:'Компас диверсанта', desc:'Открыто за завершение главы V' },
  { id:'artifact_ch6', icon:'🕊️', rarity:'epic', name:'Шифр Победы', desc:'Открыто за завершение главы VI' },
  { id:'artifact_flawless', icon:'🎖️', rarity:'rare', name:'Знак точности', desc:'Глава без ошибок' },
  { id:'artifact_silent', icon:'🕶️', rarity:'rare', name:'Тихий канал', desc:'Глава без подсказок' },
  { id:'artifact_fast', icon:'⏱️', rarity:'rare', name:'Хронометр штаба', desc:'10 быстрых ответов' },
  { id:'artifact_retry', icon:'🔁', rarity:'epic', name:'Нашивка феникса', desc:'Победа после провала' },
  { id:'artifact_polyglot', icon:'🧠', rarity:'epic', name:'Шифровальный диск', desc:'Освоены все типы шифров' },
  { id:'artifact_legend', icon:'🏛️', rarity:'legendary', name:'Архив Победы', desc:'Все главы завершены с высоким результатом' },
];

if (!state.achievements) state.achievements = {};
if (!state.achievementPts) state.achievementPts = 0;
if (!state.artifacts) state.artifacts = {};
if (!state.solvedTypes) state.solvedTypes = {};
if (!state.solvedTypeCounts) state.solvedTypeCounts = {};

function registerSolvedCipherType(type) {
  const t = String(type || '').trim().toLowerCase();
  if (!t) return;
  if (!state.solvedTypes || typeof state.solvedTypes !== 'object') state.solvedTypes = {};
  if (!state.solvedTypeCounts || typeof state.solvedTypeCounts !== 'object') state.solvedTypeCounts = {};
  state.solvedTypes[t] = true;
  state.solvedTypeCounts[t] = Math.max(0, Number(state.solvedTypeCounts[t] || 0)) + 1;
}

function unlockAchievement(id) {
  if (!state.achievements) state.achievements = {};
  if (state.achievements[id]) return;
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (!ach) return;
  state.achievements[id] = Date.now();
  state.achievementPts = (state.achievementPts || 0) + ach.pts;
  saveState();
  showAchievementToast(ach);
  setTimeout(() => autoSync(false), 350);
}

function showAchievementToast(ach) {
  const old = document.getElementById('ach-toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'ach-toast';
  el.style.cssText = `position:fixed;top:80px;left:50%;transform:translateX(-50%);
    z-index:9997;background:linear-gradient(135deg,#1a1508,#2a2010);
    border:1px solid rgba(255,224,51,.45);border-radius:12px;
    padding:12px 18px;display:flex;align-items:center;gap:12px;
    box-shadow:0 8px 32px rgba(0,0,0,.6),0 0 20px rgba(255,224,51,.15);
    max-width:300px`;
  el.innerHTML = `
    <div style="font-size:28px;flex-shrink:0">${ach.icon}</div>
    <div>
      <div style="font-size:9px;color:rgba(255,224,51,.68);letter-spacing:.1em;margin-bottom:2px">ДОСТИЖЕНИЕ</div>
      <div style="font-family:var(--head);font-size:var(--fs-sm);color:var(--accent)">${ach.name}</div>
      <div style="font-size:10px;color:var(--muted);margin-top:2px">${ach.desc} · +${ach.pts} оч</div>
    </div>`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s,transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(-10px)';
    setTimeout(() => el.remove(), 300);
  }, 2700);
}

function _artifactRarityStyle(rarity) {
  if (rarity === 'legendary') return { border:'rgba(255,186,61,.65)', glow:'0 0 18px rgba(255,186,61,.3)', text:'#ffdca2' };
  if (rarity === 'epic') return { border:'rgba(255,115,115,.55)', glow:'0 0 16px rgba(255,115,115,.2)', text:'#ffcfbf' };
  if (rarity === 'rare') return { border:'rgba(120,198,255,.55)', glow:'0 0 14px rgba(120,198,255,.2)', text:'#cce9ff' };
  return { border:'rgba(160,255,184,.45)', glow:'0 0 10px rgba(160,255,184,.15)', text:'#d8ffe2' };
}

function unlockArtifact(id) {
  if (!state.artifacts) state.artifacts = {};
  if (state.artifacts[id]) return null;
  const art = ARTIFACTS.find(a => a.id === id);
  if (!art) return null;
  state.artifacts[id] = Date.now();
  saveState();
  showArtifactToast(art);
  return art;
}

function showArtifactToast(artifact) {
  const old = document.getElementById('artifact-toast');
  if (old) old.remove();
  const style = _artifactRarityStyle(artifact.rarity);
  const el = document.createElement('div');
  el.id = 'artifact-toast';
  el.style.cssText = `position:fixed;top:140px;left:50%;transform:translateX(-50%);z-index:9997;
    background:linear-gradient(140deg,#11120d,#1d1a12);border:1px solid ${style.border};border-radius:12px;
    padding:11px 14px;display:flex;align-items:center;gap:10px;box-shadow:${style.glow};max-width:320px`;
  el.innerHTML = `
    <div style="font-size:25px">${artifact.icon}</div>
    <div>
      <div style="font-size:9px;letter-spacing:.11em;color:${style.text};opacity:.9">АРТЕФАКТ НАЙДЕН</div>
      <div style="font-family:var(--head);font-size:12px;color:${style.text};margin-top:2px">${artifact.name}</div>
      <div style="font-size:10px;color:var(--muted);margin-top:2px">${artifact.desc}</div>
    </div>`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .25s,transform .25s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(-8px)';
    setTimeout(() => el.remove(), 260);
  }, 2600);
}

function evaluateArtifacts(context = {}) {
  if (!state.artifacts) state.artifacts = {};
  const gained = [];
  const pushIf = (id, cond) => {
    if (!cond) return;
    const unlocked = unlockArtifact(id);
    if (unlocked) gained.push(unlocked);
  };

  pushIf('artifact_ch1', !!state.completedChapters[1]);
  pushIf('artifact_ch2', !!state.completedChapters[2]);
  pushIf('artifact_ch3', !!state.completedChapters[3]);
  pushIf('artifact_ch4', !!state.completedChapters[4]);
  pushIf('artifact_ch5', !!state.completedChapters[5]);
  pushIf('artifact_ch6', !!state.completedChapters[6]);

  pushIf('artifact_flawless', !!context.chapterDoneNoErrors);
  pushIf('artifact_silent', !!context.chapterDoneNoHints);
  pushIf('artifact_fast', (state._fastAnswers || 0) >= 10);
  pushIf('artifact_retry', !!context.retryWin);

  const solvedTypeCount = Object.keys(state.solvedTypes || {}).length;
  pushIf('artifact_polyglot', solvedTypeCount >= 6);

  const done = _stateCompletedCount();
  pushIf('artifact_legend', done >= 6 && Number(state.totalScore || 0) >= 2500);
  return gained;
}

function checkAchievements(context = {}) {
  const done = _stateCompletedCount();
  const score = Number(state.totalScore || 0);

  if (context.cipherType) {
    registerSolvedCipherType(context.cipherType);
  }

  if (context.elapsed <= 5) unlockAchievement('fast_5');
  if ((state._fastAnswers || 0) >= 5) unlockAchievement('fast_10');
  if ((state._fastAnswers || 0) >= 25) unlockAchievement('fast_25');

  if ((state.streak || 0) >= 3) unlockAchievement('streak_3');
  if ((state.streak || 0) >= 5) unlockAchievement('streak_5');
  if ((state.streak || 0) >= 8) unlockAchievement('streak_8');

  if (done >= 1) unlockAchievement('chapter_1');
  if (done >= 3) unlockAchievement('chapter_3');
  if (done >= 6) unlockAchievement('chapter_6');

  if (context.chapterDoneNoErrors) unlockAchievement('flawless_1');
  if ((state._perfectChapters || 0) >= 3) unlockAchievement('flawless_3');

  if (context.chapterDoneNoHints) unlockAchievement('no_hints_1');
  if ((state._noHintChapters || 0) >= 3) unlockAchievement('no_hints_3');

  if (score >= 500) unlockAchievement('score_500');
  if (score >= 1200) unlockAchievement('score_1200');
  if (score >= 2500) unlockAchievement('score_2500');
  if (score >= 4000) unlockAchievement('score_4000');

  const solvedTypes = state.solvedTypes || {};
  const solvedTypeCounts = state.solvedTypeCounts || {};
  const solvedTypeCount = Object.keys(solvedTypes).length;
  if ((solvedTypeCounts.morse || 0) >= 3) unlockAchievement('type_morse');
  if ((solvedTypeCounts.math || 0) >= 3) unlockAchievement('type_math');
  if ((solvedTypeCounts.map || 0) >= 2) unlockAchievement('type_map');
  if (solvedTypeCount >= 6) unlockAchievement('all_types');

  if (context.retryWin || context.comeback) unlockAchievement('comeback');
  if (context.survived1) unlockAchievement('survivor');

  const hour = new Date().getHours();
  const day = new Date().getDay();
  if (hour >= 8 && hour < 15) unlockAchievement('school_time');
  if (day === 0 || day === 6) unlockAchievement('weekend');

  const count = Object.keys(state.achievements || {}).length;
  if (count >= 8) unlockAchievement('collector_8');
  if (count >= 16) unlockAchievement('collector_16');

  evaluateArtifacts(context);
}

function renderAchievementsTab(container) {
  const myAchs = state.achievements || {};
  const total = ACHIEVEMENTS.length;
  const earned = Object.keys(myAchs).length;
  const earnedPts = state.achievementPts || 0;
  const progressPct = total ? Math.round((earned / total) * 100) : 0;
  const myArtifacts = state.artifacts || {};
  const artifactTotal = ARTIFACTS.length;
  const artifactEarned = Object.keys(myArtifacts).length;
  const artifactPct = artifactTotal ? Math.round((artifactEarned / artifactTotal) * 100) : 0;

  let html = `<div style="padding:16px">
    <div style="background:linear-gradient(160deg,rgba(255,224,51,.16),rgba(20,17,8,.95));
      border:1px solid rgba(255,224,51,.45);border-radius:12px;padding:14px;margin-bottom:14px;
      box-shadow:0 8px 24px rgba(0,0,0,.45)">
      <div style="display:flex;justify-content:space-around;text-align:center">
        <div>
          <div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent)">${earned}</div>
          <div style="font-size:10px;color:#f2e5b0;letter-spacing:.05em">ПОЛУЧЕНО</div>
        </div>
        <div>
          <div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent)">${total}</div>
          <div style="font-size:10px;color:#f2e5b0;letter-spacing:.05em">ВСЕГО</div>
        </div>
        <div>
          <div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent)">${earnedPts}</div>
          <div style="font-size:10px;color:#f2e5b0;letter-spacing:.05em">ОЧКОВ</div>
        </div>
      </div>
      <div style="margin-top:10px;background:rgba(0,0,0,.35);border-radius:999px;height:8px;overflow:hidden;">
        <div style="height:100%;width:${progressPct}%;background:linear-gradient(90deg,#ffe033,#fff1a8);box-shadow:0 0 8px rgba(255,224,51,.8)"></div>
      </div>
      <div style="margin-top:6px;font-size:10px;color:#f0df9d;text-align:right;">${progressPct}% коллекции достижений</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">`;

  ACHIEVEMENTS.forEach(ach => {
    const has = !!myAchs[ach.id];
    html += `<div style="background:${has ? 'linear-gradient(170deg,#2b240c,#171208)' : 'linear-gradient(170deg,#1a1711,#100e0a)'};
      border:1px solid ${has ? 'rgba(255,224,51,.55)' : 'rgba(255,255,255,.14)'};
      box-shadow:${has ? '0 0 18px rgba(255,224,51,.22)' : '0 0 0 rgba(0,0,0,0)'};
      border-radius:10px;padding:11px;opacity:${has ? '1' : '0.84'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <div style="font-size:24px;filter:${has ? 'drop-shadow(0 0 10px rgba(255,224,51,.45))' : 'none'}">${ach.icon}</div>
        <div style="font-size:9px;color:${has ? '#fff0b0' : '#c8c1a6'};letter-spacing:.05em">${has ? '✅ ПОЛУЧЕНО' : '🔒 НЕ ПОЛУЧЕНО'}</div>
      </div>
      <div style="font-family:var(--head);font-size:11px;color:${has ? '#ffe680' : '#f1e7c7'};
        letter-spacing:.04em;margin-top:6px">${ach.name}</div>
      <div style="font-size:10px;color:${has ? '#d8cfb0' : '#b6ad90'};margin-top:4px;line-height:1.45">${ach.desc}</div>
      <div style="font-size:10px;color:${has ? 'var(--accent)' : '#d5c99c'};margin-top:7px;font-family:var(--head)">+${ach.pts} очков</div>
    </div>`;
  });

  html += `</div>
    <div style="margin-top:14px;background:linear-gradient(160deg,rgba(130,220,255,.12),rgba(18,16,10,.94));
      border:1px solid rgba(130,220,255,.35);border-radius:12px;padding:14px;margin-bottom:14px;
      box-shadow:0 8px 22px rgba(0,0,0,.42)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div style="font-family:var(--head);font-size:12px;color:#d7f0ff;letter-spacing:.08em">🗃️ АРТЕФАКТЫ</div>
        <div style="font-family:var(--head);font-size:12px;color:#bfe8ff">${artifactEarned}/${artifactTotal}</div>
      </div>
      <div style="margin-top:10px;background:rgba(0,0,0,.35);border-radius:999px;height:8px;overflow:hidden;">
        <div style="height:100%;width:${artifactPct}%;background:linear-gradient(90deg,#7fc5ff,#d7f0ff);box-shadow:0 0 10px rgba(127,197,255,.8)"></div>
      </div>
      <div style="margin-top:6px;font-size:10px;color:#cfeaff;text-align:right;">${artifactPct}% коллекции артефактов</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">`;

  ARTIFACTS.forEach(artifact => {
    const has = !!myArtifacts[artifact.id];
    const rarityStyle = _artifactRarityStyle(artifact.rarity);
    const rarityLabel =
      artifact.rarity === 'legendary' ? 'ЛЕГЕНДАРНЫЙ' :
      artifact.rarity === 'epic' ? 'ЭПИЧЕСКИЙ' :
      artifact.rarity === 'rare' ? 'РЕДКИЙ' : 'ОБЫЧНЫЙ';
    html += `<div style="background:${has ? 'linear-gradient(168deg,#1f1a12,#13100b)' : 'linear-gradient(168deg,#171510,#0f0d09)'};
      border:1px solid ${has ? rarityStyle.border : 'rgba(255,255,255,.13)'};
      box-shadow:${has ? rarityStyle.glow : 'none'};
      border-radius:10px;padding:11px;opacity:${has ? '1' : '0.82'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div style="font-size:24px;filter:${has ? 'drop-shadow(0 0 8px rgba(255,255,255,.25))' : 'none'}">${artifact.icon}</div>
        <div style="font-size:9px;color:${has ? rarityStyle.text : '#b8b1a0'};letter-spacing:.05em">${has ? '✅ НАЙДЕН' : '🔒 СКРЫТ'}</div>
      </div>
      <div style="font-family:var(--head);font-size:11px;color:${has ? rarityStyle.text : '#e2dac0'};letter-spacing:.04em;margin-top:6px">${artifact.name}</div>
      <div style="font-size:9px;color:${has ? rarityStyle.text : '#b8b09a'};opacity:.92;margin-top:4px;letter-spacing:.06em">${rarityLabel}</div>
      <div style="font-size:10px;color:${has ? '#d9d0b6' : '#aea58c'};margin-top:5px;line-height:1.45">${artifact.desc}</div>
    </div>`;
  });

  html += '</div></div>';
  container.innerHTML = html;
}

function renderSettingsTab() {
  const el = document.getElementById('settings-tab-content');
  if (!el) return;
  const musicOn = musicEnabled;
  const sfxOn = sfxEnabled;
  const musicPct = Math.round(musicVolume * 100);
  const sfxPct = Math.round(sfxVolume * 100);
  const currentTrack = getCurrentMusicTrack();
  const trackOptions = GAME_MUSIC_TRACKS.map((track, idx) =>
    `<option value="${idx}" ${idx === musicTrackIndex ? 'selected' : ''}>${track.title}</option>`
  ).join('');

  el.innerHTML = `
    <div style="padding:20px 16px">
      <div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent);letter-spacing:.06em;margin-bottom:16px;">⚙️ НАСТРОЙКИ</div>

      <div class="settings-card">
        <div class="settings-card-title">🎵 ФОНОВАЯ МУЗЫКА</div>
        <div class="settings-inline">
          <button onclick="toggleMusicEnabled();renderSettingsTab();" class="btn btn-small" style="width:auto;padding:8px 18px;margin:0;">
            ${musicOn ? '🔊 ВКЛ' : '🔇 ВЫКЛ'}
          </button>
          <div style="font-size:11px;color:#dfd5b3;line-height:1.4">
            Текущий трек:<br><span style="color:#fff0bf">${currentTrack ? currentTrack.title : '-'}</span>
          </div>
        </div>
        <div class="settings-caption">Встроено 5 бесплатных треков (royalty-free).</div>
        <select class="settings-select" onchange="setMusicTrack(this.value);renderSettingsTab();">
          ${trackOptions}
        </select>
        <div class="settings-inline" style="margin-top:10px">
          <div style="font-size:12px;color:#f5ebc7">Громкость музыки</div>
          <div id="music-vol-value" style="font-family:var(--head);font-size:12px;color:var(--accent)">${musicPct}%</div>
        </div>
        <input id="music-volume-range" class="settings-range" type="range" min="0" max="100" step="1" value="${musicPct}" oninput="setMusicVolume(this.value)" onchange="setMusicVolume(this.value)">
      </div>

      <div class="settings-card">
        <div class="settings-card-title">🔊 ЗВУКОВЫЕ ЭФФЕКТЫ</div>
        <div class="settings-inline">
          <button onclick="toggleSfxEnabled();renderSettingsTab();" class="btn btn-small" style="width:auto;padding:8px 18px;margin:0;">
            ${sfxOn ? '🔊 ВКЛ' : '🔇 ВЫКЛ'}
          </button>
          <div style="font-size:11px;color:#dfd5b3;line-height:1.4">
            События:<br><span style="color:#fff0bf">победа / поражение / потеря жизни</span>
          </div>
        </div>
        <div class="settings-inline" style="margin-top:10px">
          <div style="font-size:12px;color:#f5ebc7">Громкость эффектов</div>
          <div id="sfx-vol-value" style="font-family:var(--head);font-size:12px;color:var(--accent)">${sfxPct}%</div>
        </div>
        <input id="sfx-volume-range" class="settings-range" type="range" min="0" max="100" step="1" value="${sfxPct}" oninput="setSfxVolume(this.value)" onchange="setSfxVolume(this.value)">
        <div class="settings-caption">Эффекты регулируются отдельно от фоновой музыки.</div>
      </div>

      <div class="settings-card">
        <div class="settings-card-title">🧹 СБРОС КЕША</div>
        <div class="settings-caption" style="margin-top:0;margin-bottom:10px;">Очищает локальный кеш игры для этого устройства во всех режимах (player/tester/admin).</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button onclick="confirmCacheResetKeepProgress();" class="btn" style="width:auto;padding:8px 16px;">🧹 БЕЗ ПРОГРЕССА</button>
          <button onclick="confirmCacheResetWithProgress();" class="btn btn-danger" style="width:auto;padding:8px 16px;">🗑 С ПРОГРЕССОМ</button>
        </div>
      </div>
      ${(state.adminMode || window._adminMode) ? `
      <div class="settings-card">
        <div class="settings-card-title">🗑 СБРОС ТЕСТОВОГО ПРОГРЕССА</div>
        <div class="settings-caption" style="margin-top:0;margin-bottom:10px;">Полный сброс игрового прогресса в БД доступен только администратору.</div>
        <button onclick="confirmReset();" class="btn btn-danger" style="width:auto;padding:8px 20px;">🗑 СБРОСИТЬ ПРОГРЕСС</button>
      </div>` : ''}
    </div>`;
  syncMusicButtons();
}
window.showScreen = showScreen;
window.switchTab = switchTab;
window.renderChapters = renderChapters;
window.toggleMusicEnabled = toggleMusicEnabled;
window.toggleSfxEnabled = toggleSfxEnabled;
window.setMusicTrack = setMusicTrack;
window.setMusicVolume = setMusicVolume;
window.setSfxVolume = setSfxVolume;
window.cancelCipherTimer = cancelCipherTimer;
window.confirmCacheReset = confirmCacheReset;
window.confirmCacheResetKeepProgress = confirmCacheResetKeepProgress;
window.confirmCacheResetWithProgress = confirmCacheResetWithProgress;
window.openBugReportModal = openBugReportModal;
window.closeBugReportModal = closeBugReportModal;
window.contactGameAdmin = contactGameAdmin;
window.checkAnswer = checkAnswer;
window.nextCipher = nextCipher;
window.showHint = showHint;
window.copyChapterReportCard = copyChapterReportCard;
// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
if (document.readyState === "loading") { showSplash(); } else { showSplash(); }
loadState();
syncMusicButtons();
applyBackgroundMusic(false);
const _cipherInput = document.getElementById('cipher-input');
if (_cipherInput) {
  _cipherInput.addEventListener('focus', ensureCipherInputKeyboard);
  _cipherInput.addEventListener('click', ensureCipherInputKeyboard);
  _cipherInput.addEventListener('touchstart', ensureCipherInputKeyboard, { passive: true });
}

// Применяем роль из window-флагов ДО mergeBotLeaderboard и renderChapters.
// Это гарантирует что adminMode/testerMode правильны даже если tgInitMe = null.
// window._adminMode / _testerMode / _gameRole установлены при парсинге startParam.
(function _applyRoleFromWindow() {
  if (window._adminMode === true) {
    state.adminMode  = true;
    state.testerMode = false;
    state.gameRole   = 'admin';
  } else if (window._testerMode === true) {
    state.adminMode  = false;
    state.testerMode = true;
    state.gameRole   = 'tester';
  } else {
    // Роль player или не определена — сбрасываем всё
    state.adminMode  = false;
    state.testerMode = false;
    state.gameRole   = window._gameRole || 'player';
  }
  // Обновляем tgOpenChapters из startParam 'open'
  // (tgOpenChapters уже мог быть установлен при парсинге выше)
})();

mergeBotLeaderboard();

async function fetchAndApplyState() {
  const uid = getTgUserId();
  const syncUrl = window._syncUrl;
  if (!uid || !syncUrl) return;
  try {
    const base = syncUrl.replace('/game_sync', '');
    const initDataRaw = getTgInitDataRaw();
    let stateUrl = base + '/game_state?user_id=' + encodeURIComponent(uid);
    if (initDataRaw) stateUrl += '&init_data=' + encodeURIComponent(initDataRaw);

    const resp = await fetch(stateUrl);
    const data = await resp.json().catch(() => null);
    if (!data || typeof data !== 'object') return;

    if (data.allowed === false) {
      if (data.access_reason === 'maintenance') {
        document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0d0b08;color:#fff;text-align:center;padding:32px;font-family:sans-serif"><div style="font-size:64px;margin-bottom:16px">🛠️</div><div style="font-size:22px;font-weight:700;color:#ffe033;margin-bottom:12px">Game is under maintenance</div><div style="font-size:15px;color:rgba(255,255,255,.7);max-width:360px;line-height:1.5">Access is temporarily limited.</div>' + (data.maintenance_until ? '<div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:14px">Until: ' + String(data.maintenance_until) + '</div>' : '') + '</div>';
      } else {
        document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0d0b08;color:#fff;text-align:center;padding:32px;font-family:sans-serif"><div style="font-size:64px;margin-bottom:16px">🚫</div><div style="font-size:22px;font-weight:700;color:#ffe033;margin-bottom:12px">Access denied</div><div style="font-size:15px;color:rgba(255,255,255,.7);max-width:320px">Open the game from Telegram button after access is granted.</div></div>';
      }
      return;
    }

    if (!resp.ok || !data.ok) return;
    if (data.banned) {
      document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0d0b08;color:#fff;text-align:center;padding:32px;font-family:sans-serif"><div style="font-size:64px;margin-bottom:16px">🚫</div><div style="font-size:22px;font-weight:700;color:#ffe033;margin-bottom:12px">Access blocked</div><div style="font-size:15px;color:rgba(255,255,255,.6);max-width:280px">Your account was blocked by administrator.</div></div>';
      try { localStorage.removeItem(storageKey()); } catch(e2) {}
      return;
    }

    if (data.admin_mode === true) {
      state.adminMode = true;
      state.testerMode = false;
    } else if (data.tester_mode === true) {
      state.adminMode = false;
      state.testerMode = true;
    } else {
      state.adminMode = false;
      state.testerMode = false;
    }
    if (data.role) state.gameRole = data.role;

    if (Array.isArray(data.open_chapters)) {
      let chaptersToOpen = data.open_chapters;
      if (chaptersToOpen.length === 0 && !data.admin_mode && !data.tester_mode) {
        chaptersToOpen = [1];
      }
      tgOpenChapters = new Set(chaptersToOpen);
    }
    if (Array.isArray(data.chapter_schedule)) {
      tgChapterSchedule = data.chapter_schedule;
    }

    const prevResetToken = _getStoredResetToken();
    if (typeof data.reset_token === 'number' && data.reset_token > 0) {
      _serverResetToken = data.reset_token;
      _storeResetToken(_serverResetToken);
    }

    tgInitMe = Object.assign({}, (tgInitMe || {}), {
      uid: String(uid),
      score: Number(data.score || 0),
      completed: Number(data.completed || 0),
      game_over: !!data.game_over,
      role: data.role || state.gameRole || 'player',
      admin_mode: !!data.admin_mode,
      tester_mode: !!data.tester_mode,
      restart_mode: data.restart_mode || null,
      reset_token: _serverResetToken || 0,
      banned: !!data.banned,
    });

    const srvScore = typeof data.score === 'number' ? data.score : state.totalScore;
    const srvCompleted = typeof data.completed === 'number' ? data.completed : _stateCompletedCount();
    const tokenChanged = (_serverResetToken > 0) && (
      prevResetToken <= 0 ? _hasLocalProgressData() : (_serverResetToken !== prevResetToken)
    );
    const forcedByTokenReset = (
      tokenChanged &&
      Number(srvScore || 0) === 0 &&
      Number(srvCompleted || 0) === 0 &&
      _hasLocalProgressData()
    );

    if (data.restart_mode === 'penalty' || data.restart_mode === 'nopts') {
      state.totalScore = 0;
      state.completedChapters = {};
      state.chapterScores = {};
      state.chapterStats = {};
      state.chapterFailCounts = {};
      state.gameOver = false;
      state.retryPenalty = data.restart_mode === 'penalty';
      state._noptsMode = data.restart_mode === 'nopts';
      state.achievements = {};
      state.achievementPts = 0;
      saveState();
    } else if (forcedByTokenReset) {
      _wipeLocalProgressForServerReset();
      saveState();
    } else {
      const mergeResult = _applyServerProgress(srvScore, srvCompleted, !!data.game_over, forcedByTokenReset);
      if (!mergeResult.applied) {
        // Server is behind local cache; push local snapshot to backend.
        autoSync(false);
      } else {
        saveState();
      }
    }

    _lastSyncedScore = Number(state.totalScore || 0);
    _lastSyncedCompleted = _stateCompletedCount();
    _lastSyncedSignature = [
      Number(state.totalScore || 0),
      _lastSyncedCompleted,
      _stateCurrentChapterId(),
      Number(state.chapterScore || 0),
      Number(state.cipherIdx || 0),
      Number(state.lives || 0),
      state.gameOver ? 1 : 0,
      Object.keys(state.achievements || {}).length,
      Number(state.achievementPts || 0)
    ].join('|');
    _refreshCurrentTabAfterSync();
  } catch (e) {
    console.warn('fetchAndApplyState:', e);
  }
}

let _lbSyncInFlight = false;
async function fetchAndApplyLeaderboard() {
  const uid = getTgUserId();
  const syncUrl = window._syncUrl;
  if (!uid || !syncUrl || _lbSyncInFlight) return;
  _lbSyncInFlight = true;
  try {
    const base = syncUrl.replace('/game_sync', '');
    const initDataRaw = getTgInitDataRaw();
    let lbUrl = base + '/game_leaderboard?user_id=' + encodeURIComponent(uid);
    if (initDataRaw) lbUrl += '&init_data=' + encodeURIComponent(initDataRaw);
    const resp = await fetch(lbUrl);
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data || !data.ok || !Array.isArray(data.leaderboard)) return;

    state.leaderboard = data.leaderboard.map(r => ({
      uid: String(r.uid),
      name: r.name || 'Игрок',
      score: Number(r.score || 0),
      completed: Number(r.completed || 0),
      role: r.role || 'player',
      achievementCount: Number(r.achievementCount || 0),
      achievementPts: Number(r.achievementPts || 0),
    }));
    tgInitLB = state.leaderboard.slice();
    if (currentTab === 'leaderboard') renderLeaderboardTab();
  } catch (e) {
    console.warn('fetchAndApplyLeaderboard:', e);
  } finally {
    _lbSyncInFlight = false;
  }
}

renderChapters();
fetchAndApplyState();
fetchAndApplyLeaderboard();
flushPendingResults();
try {
} catch(e) {}
