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
        encrypted:"ФСЙ",
        answer:"4897432de4be211f639b683e878ae091df780e52bb92a5ac7023ad88bf5e3b8f",
        hint:"Вычти 3: Ф(22)-3=19=С, С(19)-3=16=О, Й(11)-3=8=Ж. ФСЙ → СОЖ!",
        fact:"Река Сож протекает через Гомельскую область. Партизанские отряды Хойникского района часто использовали берега Сожа для переправ.", points:110 },
      { type:"num", typeLabel:"ЧИСЛОВОЙ КОД",
        task:"Перехвачено донесение о численности немецкого гарнизона в Хойниках. Каждое число — буква алфавита (А=1). Расшифруй ключевое слово:",
        encrypted:"16-1-18-20-10-9-1-14",
        answer:"27d97c40af3afb4879364af1fdddf55bbbb06effe822b3ad43d869f147751822",
        hint:"П=16, А=1, Р=18, Т=20, И=10, З=9, А=1, Н=14. Восемь букв.",
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
        encrypted:"....-/.-.././-...//.-.././.-...",
        answer:"9f105caf00cb3a6702aa88267e5efeac19d5ed77d966999d103ad3c02e09f622",
        hint:".... = Х, .-.. = Л, . = Е, -... = Б → ХЛЕБ. .-.= Р, .-.. = Л? Нет: Д=-.., О=---, Р=.-., О=---, Г=--.  ДОРОГ.",
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
        encrypted:"--/---/.../-//--./---/.-./../-",
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
        encrypted:".../.-.../.-/.-../.-/",
        answer:"9890080953fe693654e3db2bece9ddc1e28e86659ece82fd3a44e9904809a94f",
        hint:"С=...,Л=.-.. — нет. С=...,Л=.-..,А=.-,В=.--,А=.- = СЛАВА ✓",
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
        answer:"060672b8531404f598515957df33d6387e0647cbc382d35ef286fa3466362384",
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

const ANSWER_MAP = {
"a2504b40b4c895667b4364476daee719377afbab51bbd142e0b5a5f538b58875":"ГОМЕЛЬСКАЯ",
"4897432de4be211f639b683e878ae091df780e52bb92a5ac7023ad88bf5e3b8f":"СОЖ",
"01458a6a82aafaacc62d2a5fff5e7c73ae5a97661b706e5dccaa8c96cb82a234":"ПОЛЕСЬЕ",
"27d97c40af3afb4879364af1fdddf55bbbb06effe822b3ad43d869f147751822":"ПАРТИЗАН",
"b82e24ecc9743b7d5b1b5b5fafc3fa8181bbc2be139b8227873783adbb0b8a2c":"СОЖА",
"9f14025af0065b30e47e23ebb3b491d39ae8ed17d33739e5ff3827ffb3634953":"35",
"ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d":"5",
"4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a":"4",
"39fa9ec190eee7b6f4dff1100d6343e10918d044c75eac8f9e9a2596173f80c9":"60",

"469a02b8953ccf4cded9018fdfad65dad3b5d005e3c277b3d6d644fffaa52029":"ГЕРОЙ",
"b7a56873cd771f2c446d369b649430b65a756ba278ff97ec81bb6f55b2e73569":"25",
"f9e05f164c5a0d5f568e20655d6a3460a1b89be8ae2d039432b7f591269c56d7":"ГОРОД",
"9f105caf00cb3a6702aa88267e5efeac19d5ed77d966999d103ad3c02e09f622":"ХЛЕБ ДОРОГ",
"f4f847839b6e46ff3047b6ca7622555097aa47f3ee69e4f935530f4faa93d18c":"СКЛАД",
"f44ea8d11615d997a61d3b8b0b80d8b5ea76d2dbb60c17fa162ede87abbe7bf7":"СВЯЗЬ",
"20239dec89076cf07026693b3e5d5efc14bd7a26c1cd49e2bb77deb90cf8a00f":"ЯВКА",
"324d91c47431ef6d9a3d33983c3ff54e023f6bc359870d0ba5e3fce44afe2e6a":"МОСТ ГОРИТ",
"f275f3dada670a7d7abdacfb2143475de1ea768123cd40111fb66d0d52ca74d8":"ПУТЬ",
"06074d823df2801860e0d583c4c56927c9cf6f4255acced4541585f5123b3d50":"ОТРЯД",
"24e6357fad3c0e1a6a24349c4250d1ead3461a4ca8052433cbb0c95515e1b4db":"ВЗРЫВ",
"dc08aae51e3d3771be3986a40366d64f63635afd050b71e187ea15857c65b291":"ВРАГ БЕЖИТ",
"fec3d20ab54d04d7e2007c03c222a7204d732a1c75b18cf5730813d8007eb428":"РУБЕЖ",
"e4d2f03d6cacba6f4636f7a06005337f496fb959510878462cb55d1e688ab307":"ОСВОБОЖДЕН",
"3c52700fe62c8bff58582f5a574ddc38f0a83f05b7220763744bb61bc933b64d":"ПРОРЫВ",
"e6f182a0288b446b693099008c4747ce928497399ea20a4c89dfef0be894662c":"МИНСК",
"3872ed95b70ee6ebffbf1715e72742e00a4cba16dd7690862a993c4e0d9f8265":"ПОБЕДА",
"1f357f38d0a3225db20815563c70bfe154832f7e0cd2cb79edde8a1e5038a85b":"БРЕСТ",
"4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5":"10",
"011942ffde9054ddd74029d5914c259e8d658a850fa296d5d083a1e38fcadbd9":"ПЛОЩАДЬ ПОБЕДЫ",
"4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce":"3",
"9890080953fe693654e3db2bece9ddc1e28e86659ece82fd3a44e9904809a94f":"СЛАВА",
"0dd0a827bdd580e9eaa343e55ae702740b9f2346d8b6699c5a8669ea0b64571f":"МИР",
"d5473eac88f77d42d6202029dd2d341434f791a78879b40285516d309fe37b48":"ВОЙНА ОКОНЧЕНА",
"ee28ccd9c40886ef8f32df5d06a38b87a2742942250d9bc525585f47cf132c8c":"ГАРНИЗОН",
"06b21234e80f4cbe0bbcca7195551e94577a26f59f43bb4e78ea22aa3804b525":"БЕРЛИН",
"02502539349de7bcea28618412d857217fbf10a5533504d3af7361cbe66b66c1":"ВИТЕБСК",
"32076f76c7be7c437b41289f10c44cce9c107523aee32428024297703302ae2d":"БАГРАТИОН",
"e9a000b50262fd7992df43b2ef5d0c0e8347a3b14ab12143f0fc4bd210606e93":"ХОЙНИКИ",
"b82e24ecc9743b7d5b1b5b5fafc3fa8181bbc2be139b8227873783adbb0b8a2c":"СОЖА",
"27d97c40af3afb4879364af1fdddf55bbbb06effe822b3ad43d869f147751822":"ПАРТИЗАН",
"a371525f209c28d6fd1628900b18c725be85807884703f5fa8769a4990419512":"СВЯЗНОЙ",
"01458a6a82aafaacc62d2a5fff5e7c73ae5a97661b706e5dccaa8c96cb82a234":"ПОЛЕСЬЕ",
"e601539268946eebf1f84584657b2769e92be55ebc43a9a7266d8f0aec021dbb":"ГОМЕЛЬ",
"14cef73b1bd29459a634b6bb8f2138e41e047419c0c22e017938ca80b21dafb7":"МОЗЫРЬ",
"131f1b7eaf25d645a5a1a1fd3c35330be40dec081cd032ace5cfd7143ef011a7":"НАРОВЛЯ",
"59afe82b485cb35ce1c356ab850147ccaaa5d72241e4357ec2c30f18063fdec8":"ПРИПЯТЬ",
"32076f76c7be7c437b41289f10c44cce9c107523aee32428024297703302ae2d":"БАГРАТИОН",
"5933b0b35d5d3e9d1f53fbce9403c5672883fff37f429dc1da26881f47415672":"1941",
"66a7a5807c3130eb2d0b55bb260a6a001b9d62095c94b753cbb215f3e4f099e1":"1943",
"f513a0aa4f8f39744c6fddf2b5eb18cc1eac55ca866a1b243d835362a023f243":"1944",
"060672b8531404f598515957df33d6387e0647cbc382d35ef286fa3466362384":"1945",
"4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a":"4",
"ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d":"5",
"19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7":"9",
"9f14025af0065b30e47e23ebb3b491d39ae8ed17d33739e5ff3827ffb3634953":"35",
"39fa9ec190eee7b6f4dff1100d6343e10918d044c75eac8f9e9a2596173f80c9":"60",
};

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
try {
  tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    tgUser = tg.initDataUnsafe?.user;

    // Таблица лидеров, прогресс и открытые главы передаются через startParam
    const sp = tg.initDataUnsafe?.start_param;
    if (sp) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sp));
        tgInitLB = parsed.lb || [];
        tgInitMe = parsed.me || null;
        if (parsed.open) tgOpenChapters = new Set(parsed.open);
        if (parsed.sync_url) window._syncUrl = parsed.sync_url;
        // admin_mode может быть в корне payload (не в me)
        if (parsed.admin_mode === true) window._adminMode = true;
      } catch(e) { console.warn('startParam parse error:', e); }
    }

    // Фоллбэк: читаем из URL query параметров (если start_param пустой)
    if (!window._syncUrl) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const rawParam = urlParams.get('tgWebAppStartParam');
        if (rawParam) {
          const parsed2 = JSON.parse(decodeURIComponent(rawParam));
          if (parsed2.sync_url) window._syncUrl = parsed2.sync_url;
          if (!tgInitLB.length && parsed2.lb) tgInitLB = parsed2.lb;
          if (!tgInitMe && parsed2.me) tgInitMe = parsed2.me;
          if (!tgOpenChapters && parsed2.open) tgOpenChapters = new Set(parsed2.open);
          if (parsed2.admin_mode === true) window._adminMode = true;
        }
      } catch(e) { console.warn('URL param parse error:', e); }
    }

    console.log('🔗 sync_url:', window._syncUrl || 'НЕ ПОЛУЧЕН');
    console.log('👤 user:', tgUser?.id, tgUser?.first_name);
  }
} catch(e) {}

function getTgUserId() {
  if (tgUser?.id) return String(tgUser.id);
  return null;
}
function getTgUserName() {
  if (tgUser) return tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '');
  return 'Разведчик';
}
async function sendResultToBot(data) {
  data.completed        = Object.keys(state.completedChapters).length;
  data.total_score      = state.totalScore;
  data.achievement_count = Object.keys(state.achievements || {}).length;
  data.achievement_pts   = state.achievementPts || 0;
  data.user_id    = getTgUserId();
  data.user_name  = tgUser
    ? ((tgUser.first_name||'') + (tgUser.last_name?' '+tgUser.last_name:'')).trim()
    : 'Игрок';

  console.log('📤 sendResultToBot:', data.type, 'score:', data.total_score,
    'syncUrl:', window._syncUrl ? '✅' : '❌ ПУСТО', 'userId:', data.user_id);

  // Способ 1: HTTP POST к /game_sync (основной — работает всегда)
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
          document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0d0b08;color:#fff;text-align:center;padding:32px;font-family:sans-serif"><div style="font-size:64px;margin-bottom:16px">🚫</div><div style="font-size:22px;font-weight:700;color:#ffe033;margin-bottom:12px">Доступ заблокирован</div><div style="font-size:15px;color:rgba(255,255,255,.6);max-width:280px">Ваш аккаунт заблокирован администратором.</div></div>';
          try { localStorage.removeItem(storageKey()); } catch(e2) {}
          return;
        }
        const localCompleted = Object.keys(state.completedChapters || {}).length;
        const serverCompleted = result.db_completed || 0;
        if (
          typeof result.db_score === 'number' &&
          (result.db_score > state.totalScore || serverCompleted > localCompleted)
        ) {
          state.totalScore = result.db_score;
          state.completedChapters = {};
          for (let i = 1; i <= (serverCompleted||0); i++) state.completedChapters[i] = true;
          state.chapterScores = {};
          try { localStorage.removeItem(storageKey()); } catch(e2) {}
          saveState();
        }
        _lastSyncedScore = data.total_score;
        _lastSyncedCompleted = data.completed;
        showToast('✅ Прогресс сохранён');
        return;
      }
      console.warn('game_sync HTTP error:', resp.status);
    } catch(e) {
      console.warn('game_sync fetch error:', e);
    }
  }

  // Способ 2: tg.sendData (работает только из KeyboardButton, НЕ из InlineKeyboardButton)
  if (tg && tg.sendData && tg.initData) {
    try {
      tg.sendData(JSON.stringify(data));
      return;
    } catch(e) {
      console.warn('tg.sendData failed:', e);
    }
  }

  // Способ 3: localStorage — бот прочитает при следующем открытии
  try {
    const pending = JSON.parse(localStorage.getItem('pending_results') || '[]');
    pending.push({ ...data, ts: Date.now() });
    localStorage.setItem('pending_results', JSON.stringify(pending.slice(-10)));
  } catch(e) {}
}

// Отправляем накопленные результаты при открытии
async function flushPendingResults() {
  const syncUrl = window._syncUrl;
  // Пробуем HTTP POST для ранее не отправленных
  if (syncUrl && getTgUserId()) {
    try {
      const pending = JSON.parse(localStorage.getItem('pending_results') || '[]');
      if (!pending.length) return;
      const last = pending[pending.length - 1];
      last.user_id = getTgUserId();
      last.user_name = getTgUserName();
      const resp = await fetch(syncUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(last)
      });
      if (resp.ok) {
        localStorage.removeItem('pending_results');
        console.log('✅ flushPendingResults: HTTP POST OK');
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
let _lastSyncedScore = -1;
let _syncInFlight = false;

async function autoSync(showNotification = true) {
  const syncUrl = window._syncUrl;
  const uid = getTgUserId();
  if (!syncUrl || !uid) return;
  // Не отправляем дубли
  const completed = Object.keys(state.completedChapters).length;
  if (state.totalScore === _lastSyncedScore && completed === _lastSyncedCompleted) return;
  if (_syncInFlight) return;
  _syncInFlight = true;

  const data = {
    type: completed > 0 ? 'chapter_complete' : 'sync',
    chapter: completed > 0 ? Math.max(...Object.keys(state.completedChapters).map(Number)) : 0,
    score: 0,
    total_score: state.totalScore,
    completed: completed,
    game_over: state.gameOver || false,
    user_id: uid,
    user_name: getTgUserName(),
  };

  try {
    const resp = await fetch(syncUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    if (resp.ok) {
      _lastSyncedScore = state.totalScore;
      _lastSyncedCompleted = completed;
      console.log('✅ autoSync OK:', state.totalScore, 'pts,', completed, 'chapters');
      if (showNotification) showToast('✅ Прогресс сохранён');
    }
  } catch(e) {
    console.warn('autoSync error:', e);
  } finally {
    _syncInFlight = false;
  }
}
let _lastSyncedCompleted = -1;

// Автосинк при сворачивании / переключении вкладки
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.totalScore > 0) {
    saveState();
    autoSync(false); // тихо, без тоста
  }
});

// Автосинк при закрытии
window.addEventListener('beforeunload', () => {
  if (state.totalScore > 0 && window._syncUrl && getTgUserId()) {
    // Используем navigator.sendBeacon — не блокирует закрытие
    const data = {
      type: 'sync', total_score: state.totalScore,
      completed: Object.keys(state.completedChapters).length,
      game_over: state.gameOver || false,
      user_id: getTgUserId(), user_name: getTgUserName(),
    };
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
  chapterFailCounts: {}, // {chapterId: количество провалов}
  chapterStats: {},
  gameOver: false, leaderboard: [],
  adminMode: false
});

let state = DEFAULT_STATE();

function storageKey() {
  const uid = getTgUserId();
  return uid ? `cipher_v4_${uid}` : 'cipher_v4_guest';
}

// Загружаем таблицу лидеров из бота (если передана) в state
function mergeBotLeaderboard() {
  const myUid = getTgUserId();

  // Всегда берём leaderboard из БД как источник правды
  if (tgInitLB.length) {
    state.leaderboard = tgInitLB.map(r => ({
      uid: String(r.uid), name: r.name, score: r.score,
      completed: r.completed, role: r.role || 'player',
      achievementCount: r.achievementCount || 0,
      achievementPts: r.achievementPts || 0
    }));
  }

  // Синхронизируем прогресс с БД
  if (tgInitMe && myUid) {
    const dbScore       = tgInitMe.score        || 0;
    const dbCompleted   = tgInitMe.completed    || 0;
    const dbGameOver    = tgInitMe.game_over    || false;
    const dbRestartMode = tgInitMe.restart_mode || null;
    // admin_mode: из tgInitMe или window._adminMode (установлен при парсинге startParam)
    // После confirmReset adminMode уже в state — не перезаписываем если нет данных от бота
    const dbAdminMode = (tgInitMe && tgInitMe.admin_mode === true) || window._adminMode === true;
    if (dbAdminMode) {
      state.adminMode = true;
      console.log('👑 adminMode=true установлен от бота');
    }
    // Если dbAdminMode=false, не сбрасываем — мог быть установлен через localStorage

    // Режим перезапуска после game_over
    if (dbRestartMode === 'penalty') {
      // Сбрасываем прогресс для нового прохождения, retryPenalty=true
      state.totalScore = 0;
      state.completedChapters = {};
      state.chapterScores = {};
      state.gameOver = false;
      state.retryPenalty = true;
      state._noptsMode = false;
      try { localStorage.removeItem(storageKey()); } catch(e2) {}
    } else if (dbRestartMode === 'nopts') {
      // Сбрасываем прогресс, но очки не будут начисляться
      state.totalScore = 0;
      state.completedChapters = {};
      state.chapterScores = {};
      state.gameOver = false;
      state.retryPenalty = false;
      state._noptsMode = true;
      try { localStorage.removeItem(storageKey()); } catch(e2) {}
    } else {
      // БД всегда приоритетнее localStorage
      // Если dbScore < state.totalScore — был сброс через админку, берём БД
      state.totalScore = dbScore;
      state.completedChapters = {};
      for (let i = 1; i <= dbCompleted; i++) {
        state.completedChapters[i] = true;
      }
      // chapterScores — если db_completed < local, очищаем лишние
      const newScores = {};
      for (let i = 1; i <= dbCompleted; i++) {
        if (state.chapterScores[i]) newScores[i] = state.chapterScores[i];
      }
      state.chapterScores = newScores;
      state.gameOver = dbGameOver;
      try { localStorage.removeItem(storageKey()); } catch(e2) {}
    }
    saveState();
  }
}

function loadState() {
  try {
    const s = localStorage.getItem(storageKey());
    if (s) {
      Object.assign(state, JSON.parse(s));
      // adminMode и _noptsMode всегда приходят из бота, не из кэша
      // adminMode из localStorage оставляем (нужен после confirmReset)
      // _noptsMode всегда берётся из бота
      state._noptsMode = false;
    }
  } catch(e) {}
}

function saveState() {
  try {
    // _noptsMode не сохраняем — приходит от бота
    // adminMode сохраняем ТОЛЬКО если он true (нужен после confirmReset)
    const toSave = Object.assign({}, state, { _noptsMode: false });
    localStorage.setItem(storageKey(), JSON.stringify(toSave));
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════
//  ПЕРЕКЛЮЧАТЕЛЬ КЛАВИАТУРЫ
// ═══════════════════════════════════════════════════════
function toggleKeyboard() {
  const inp = document.getElementById('cipher-input');
  const btn = document.getElementById('btn-keyboard');
  if (!inp) return;
  if (inp.readOnly) {
    inp.removeAttribute('readonly');
    inp.focus();
    if (btn) { btn.style.background = 'rgba(255,224,51,.25)'; btn.style.borderColor = 'rgba(255,224,51,.5)'; }
  } else {
    inp.setAttribute('readonly', true);
    inp.blur();
    if (btn) { btn.style.background = 'rgba(255,224,51,.1)'; btn.style.borderColor = 'rgba(255,224,51,.2)'; }
  }
}

// ═══════════════════════════════════════════════════════
//  НАВИГАЦИЯ
// ═══════════════════════════════════════════════════════
let currentChapter = 0;
function showScreen(id) {
  const TAB_SCREENS = ['s-leaderboard-tab','s-profile-tab','s-about-tab'];
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

  CHAPTERS.forEach((ch, i) => {
    const isDone  = !!state.completedChapters[ch.id];
    if (isDone) completedCount++;

    // В режиме администратора — всё всегда открыто
    let isLocked, visuallyLocked;
    if (state.adminMode) {
      isLocked = false;
      visuallyLocked = false;
    } else {
      const serverAllows = !tgOpenChapters || tgOpenChapters.has(ch.id);
      const prevDone = i === 0 || !!state.completedChapters[CHAPTERS[i-1].id];
      isLocked = !(serverAllows && prevDone);
      visuallyLocked = isLocked;
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
    else if (!serverAllows) { statusText='🔒 НЕ ОТКРЫТА'; badgeIcon='🔒'; }
    else if (isLocked) { statusText='🔒 ЗАКРЫТО'; badgeIcon='🔒'; }
    else { statusText='▶ ДОСТУПНО'; badgeIcon='▶'; }

    const scoreVal = isDone && state.chapterScores[ch.id] ? state.chapterScores[ch.id] : '';

    card.innerHTML = `
      <div class="ch-icon">${ch.stamp || '🔐'}</div>
      <div class="ch-inner">
        <div class="ch-num">${ch.subtitle} · ${statusText}</div>
        <div class="ch-title">${ch.title}</div>
        <div class="ch-place">${ch.place}</div>
        <div class="ch-tags">${tags}</div>
      </div>
      <div class="ch-right">
        <div class="ch-badge">${badgeIcon}</div>
        ${scoreVal ? `<div class="ch-score">${scoreVal}</div>` : ''}
      </div>`;

    // adminMode / retryPenalty / noptsMode — можно переигрывать
    const canRepeat = state.retryPenalty || state._noptsMode;
    const canPlay = state.adminMode || (!isLocked && (!isDone || canRepeat));
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
    banner.textContent = '👑 РЕЖИМ АДМИНИСТРАТОРА · Все главы открыты · Рейтинг не учитывается';
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
  if (scEl) scEl.textContent = state.totalScore;
  // Кнопка сброса — только для админа
  const resetBtn = document.getElementById('btn-reset-header');
  if (resetBtn) resetBtn.style.display = (state.adminMode || window._adminMode) ? 'inline-block' : 'none';
  const plEl = document.getElementById('stat-players-label');
  const plCount = tgInitLB.length || state.leaderboard.length;
  if (plEl) plEl.textContent = '👥 ' + (plCount || '—') + ' игроков';

  // Если игра окончена — показываем кнопку финала
  if (state.gameOver) {
    document.getElementById('btn-to-final').style.display = 'block';
  } else {
    document.getElementById('btn-to-final').style.display = 'none';
  }
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

// ═══════════════════════════════════════════════════════
//  СТАРТ ГЛАВЫ
// ═══════════════════════════════════════════════════════
function startChapter(idx) {
  state.chapter           = idx;
  state.cipherIdx         = 0;
  state.lives             = 5;
  state.chapterScore      = 0;
  state.streak            = 0;
  state._chapterStartTime = Date.now();
  state._chapterErrors    = 0;
  state._chapterHints     = 0;
  // retryPenalty сбрасывается только если НЕ был установлен через retryChapter
  // (retryChapter вызывает showBriefing → startChapter — флаг уже true)
  saveState();
  loadCipher();
  showScreen('s-cipher');
}

// ═══════════════════════════════════════════════════════
//  ЗАГРУЗКА ШИФРА
// ═══════════════════════════════════════════════════════
function loadCipher() {
  const ch = CHAPTERS[state.chapter];
  if (!ch) { showScreen('s-chapters'); renderChapters(); return; }
  const cipher = ch.ciphers[state.cipherIdx];
  if (!cipher) { finishChapter(); return; }

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
    if (checkBtn) checkBtn.style.display = '';
    if (hintBtn)  { hintBtn.style.display = ''; hintBtn.disabled = false; hintBtn.textContent = '💡 ПОДСКАЗКА'; }
    if (boxEl)    boxEl.style.display    = '';
  } else {
    // Quiz — скрываем input, показываем только quiz-container
    if (inp)      inp.style.display      = 'none';
    if (inpWrap)  inpWrap.style.display  = 'none';
    if (checkBtn) checkBtn.style.display = 'none';
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
    inputWrap.style.display  = 'none';
    btnCheck.style.display   = 'none';
  } else if (cipher.type === 'anagram') {
    inputWrap.style.display  = 'none';
    btnCheck.style.display   = 'none';
  } else {
    inputWrap.style.display  = '';
    btnCheck.style.display   = '';
  }

  // Жизни
  renderLives();
  startTimer();

  // Сброс ввода (inp уже объявлен выше)
  const inpReset = document.getElementById('cipher-input');
  if (inpReset) { inpReset.value = ''; inpReset.className = 'cipher-input'; inpReset.disabled = false; inpReset.setAttribute('readonly', true); }
  const kbBtn = document.getElementById('btn-keyboard');
  if (kbBtn) { kbBtn.style.background = 'rgba(255,224,51,.1)'; kbBtn.style.borderColor = 'rgba(255,224,51,.2)'; }
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
  if (cipher.type !== 'map' && cipher.type !== 'anagram') inp.focus();
}

function renderLives() {
  const el = document.getElementById('cipher-attempts-label');
  if (!el) return;
  if (state.adminMode) {
    el.innerHTML = '<div style="line-height:1.2;text-align:center;color:gold">♾️ АДМИН</div>';
    return;
  }
  const n = state.lives;
  let row1 = '', row2 = '';
  for(let i=0;i<3;i++) row1 += i < n ? '❤️' : '🖤';
  for(let i=3;i<5;i++) row2 += i < n ? '❤️' : '🖤';
  el.innerHTML = '<div style="line-height:1.2;text-align:center"><div>' + row1 + '</div><div>' + row2 + '</div></div>';
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

function startTimer() {
  if (_timerInterval) clearInterval(_timerInterval);
  const el = document.getElementById('cipher-timer');
  if (!el) return;
  const start = Date.now();
  el.textContent = '0с';
  el.style.color = 'var(--muted)';
  _timerInterval = setInterval(() => {
    const sec = Math.round((Date.now() - start) / 1000);
    el.textContent = sec + 'с';
    if (sec <= 10) el.style.color = 'var(--green)';
    else if (sec <= 30) el.style.color = 'var(--accent)';
    else if (sec <= 60) el.style.color = 'var(--accent2)';
    else el.style.color = 'var(--red)';
  }, 1000);
}

function stopTimer() {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  const el = document.getElementById('cipher-timer');
  if (el) el.style.color = 'var(--muted)';
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
    <div style="font-size:var(--fs-base);color:var(--accent);font-weight:700;margin-bottom:8px;letter-spacing:.05em">
      -/ — разделение букв &nbsp;&nbsp; // — пробел (новое слово)
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
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function checkAnswer() {
  // Если текущее задание — quiz, делегируем в quizSubmit
  const cipher = CHAPTERS[state.chapter].ciphers[state.cipherIdx];
  if (cipher.type === 'quiz') {
    quizSubmit();
    return;
  }
  const inp    = document.getElementById('cipher-input');
  const val    = inp.value.trim().toUpperCase().replace(/\s+/g,' ');
  const correct = cipher.answer; // теперь это хеш

  if (!val) { inp.focus(); return; }

  const elapsed = Math.round((Date.now() - state.startTime) / 1000);
  const valHash = await sha256(val);
  const closeHash = await sha256(val.replace(/\s+/g,''));

  // Проверяем точное совпадение и вариант без пробелов
  const valHashNS   = await sha256(val.replace(/\s+/g,''));
  if (valHash === correct || closeHash === correct || valHashNS === correct) {
    // ── ПРАВИЛЬНО ──
    inp.className  = 'cipher-input correct';
    inp.disabled   = true;
    state.streak = (state.streak || 0) + 1;
    playSound('correct');
    const pts      = calcPoints(cipher, elapsed);
    state.chapterScore += pts;
    saveState();
    stopTimer();
    if (elapsed <= 5) state._fastAnswers = (state._fastAnswers || 0) + 1;
    const isFirstTry = (state._chapterErrors || 0) === 0;
    const cipherTypeCtx = {
      quizCorrect:    cipher.type === 'quiz',
      mathCorrect:    cipher.type === 'math',
      anagramCorrect: cipher.type === 'anagram',
      mapCorrect:     cipher.type === 'map',
      morseFast:      cipher.type === 'morse' && elapsed <= 10,
    };
    checkAchievements({ elapsed, firstTry: isFirstTry, ...cipherTypeCtx });
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

    if (state.lives <= 0) {
      if (state.adminMode) {
        // Режим администратора — восстанавливаем жизни
        state.lives = 5; saveState(); renderLives();
        const hb = document.getElementById('cipher-hint-box');
        const ht = document.getElementById('cipher-hint-text');
        hb.className = 'cipher-hint-box show';
        ht.textContent = '⚡ Режим админа: жизни восстановлены';
        setTimeout(() => { hb.className = 'cipher-hint-box'; }, 2000);
      } else {
        // Жизни кончились — сразу завершаем главу с провалом
        inp.disabled = true;
        renderLives();
        stopTimer();
        setTimeout(() => failChapter(), 1200);
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
  document.getElementById('succ-answer').textContent = ANSWER_MAP[cipher.answer] || cipher.answer;
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
  speedEl.textContent = speedText;
  speedEl.style.color = speedColor;

  const ch     = CHAPTERS[state.chapter];
  const isLast = state.cipherIdx === ch.ciphers.length - 1;
  const btn    = document.getElementById('succ-next-btn');
  btn.textContent = isLast ? 'ЗАВЕРШИТЬ ГЛАВУ →' : 'СЛЕДУЮЩИЙ ШИФР →';
  showScreen('s-success');
}

function nextCipher() {
  const ch = CHAPTERS[state.chapter];
  if (state.cipherIdx < ch.ciphers.length - 1) {
    state.cipherIdx++;
    // Жизни НЕ сбрасываются между шифрами — они общие на главу
    saveState();
    loadCipher();
    showScreen('s-cipher');
  } else {
    finishChapter();
  }
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
    user_name: getTgUserName(),
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
  if (state._isRetryAttempt) {
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
    chapterDoneNoErrors: chNoErrors,
    chapterDoneNoHints: chNoHints,
    survived1: survived1Life,
  });
  playSound('chapter_win');
  launchConfetti(800, 20);
  showScreen('s-chapter-end');
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
    user_id: getTgUserId(),
    user_name: getTgUserName()
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

  const lastCh = CHAPTERS[state.chapter];
  const lastChapterId = lastCh ? lastCh.id : 6;
  const lastChapterScore = state.chapterScore ||
    (state.chapterScores && lastCh ? (state.chapterScores[lastCh.id] || 0) : 0) ||
    0;

  sendResultToBot({
    type: 'game_complete',
    total_score: state.totalScore,
    rank: rank,
    pct: pct,
    chapter: lastChapterId,
    score: lastChapterScore,
    // Важно: чтобы бот не затирал game_over=false на финальном экране.
    game_over: true,
    user_id: getTgUserId(),
    user_name: getTgUserName()
  });

  showScreen('s-final');
}

// ═══════════════════════════════════════════════════════
//  ТАБЛИЦА ЛИДЕРОВ
// ═══════════════════════════════════════════════════════
function updateLeaderboard() {
  const name  = getTgUserName();
  const uid   = getTgUserId() || 'guest';
  const entry = {
    uid, name, score: state.totalScore,
    completed: Object.keys(state.completedChapters).length,
    achievementCount: Object.keys(state.achievements || {}).length,
    achievementPts: state.achievementPts || 0
  };
  const idx   = state.leaderboard.findIndex(e => e.uid === uid);
  if (idx >= 0) {
    if (state.totalScore >= state.leaderboard[idx].score) state.leaderboard[idx] = entry;
  } else {
    state.leaderboard.push(entry);
  }
  state.leaderboard.sort((a,b) => b.score - a.score);
}

function renderLeaderboard() {
  const list = document.getElementById('lb-list');
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

  // 2. Отправляем сброс в БД через /game_reset (полный сброс, игнорирует GREATEST)
  const syncUrl = window._syncUrl;
  const uid = getTgUserId();
  if (syncUrl && uid) {
    const resetUrl = syncUrl.replace('/game_sync', '/game_reset');
    fetch(resetUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: uid })
    }).then(r => r.json())
      .then(d => console.log('✅ Прогресс сброшен в БД:', d))
      .catch(e => console.warn('reset sync error:', e));
  }

  // 3. Перерендеривем — в adminMode все главы открыты
  renderChapters();
  showToast('🗑 Прогресс сброшен');
}

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
  const cipher = CHAPTERS[state.chapter].ciphers[state.cipherIdx];
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
checkAnswer = function(){
  const btn = document.querySelector('.btn-check');
  if(btn) pulseBtn(btn);
  _origCheck();
};

// ── Переопределяем showSuccess — добавляем конфетти ──
const _origSuccess = showSuccess;
showSuccess = function(cipher, pts, elapsed){
  _origSuccess(cipher, pts, elapsed);
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
    'chapters':    's-chapters',
    'leaderboard': 's-leaderboard-tab',
    'profile':     's-profile-tab',
    'about':       's-about-tab',
  };
  const tabMap = {
    'chapters':    'bn-chapters',
    'leaderboard': 'bn-leaderboard',
    'profile':     'bn-profile',
    'about':       'bn-about',
  };

  const screenEl = document.getElementById(screenMap[tab]);
  const tabEl    = document.getElementById(tabMap[tab]);
  if (screenEl) screenEl.classList.add('active');
  if (tabEl)    tabEl.classList.add('active');

  if (tab === 'chapters')    { renderChapters(); fetchAndApplyState(); }
  if (tab === 'leaderboard') renderLeaderboardTab();
  if (tab === 'profile')     renderProfileTab();
  if (tab === 'about')       renderAboutTab();
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
    + '<div style="font-size:var(--fs-sm);color:rgba(255,255,255,.8);line-height:1.7"><b style="color:#fdfaf0">Шифровальщик</b> — образовательная игра о событиях Великой Отечественной войны на территории Беларуси. Вы — советский разведчик. Расшифруйте донесения, пройдите 6 операций и приблизьте День Победы.</div></div>'
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

function renderLeaderboardTab() {
  const list = document.getElementById('lb-list-tab');
  if (!list) return;
  // Если leaderboard пустой но tgInitLB есть — подгружаем
  if (!state.leaderboard.length && tgInitLB.length) mergeBotLeaderboard();
  const lb    = state.leaderboard || [];
  const myUid = getTgUserId() || 'guest';
  const total = tgInitLB.length || lb.length;

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
        <b style="color:#fdfaf0">Стань первым шифровальщиком школы!</b>
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
  const myRole2 = tgInitMe?.role || '';
  const isAdminUser = myRole2 === 'admin' || (tgUser && tgUser.id === 516406248);
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
  // Берём максимум из localStorage и данных БД (tgInitMe)
  const dbCompleted = tgInitMe?.completed || 0;
  const dbScore     = tgInitMe?.score     || 0;
  const localCompleted = Object.keys(state.completedChapters).length;
  const completed = Math.max(localCompleted, dbCompleted);
  // Обновляем state если БД даёт больше
  if (dbScore > state.totalScore) state.totalScore = dbScore;
  const pct = Math.round((completed / CHAPTERS.length) * 100);

  // Роль из БД (передаётся через tgInitMe)
  const myRole = tgInitMe?.role || (tgUser?.id === 516406248 ? 'admin' : 'player');
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
  saveState();
  showScreen('s-chapters');
  renderChapters();
  showBottomNav();
  // Синхронизация
  autoSync(true);
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

  const cipher  = _quizState.cipher;
  const correct = cipher.correctIndex;
  const sel     = _quizState.selected;
  const elapsed = Math.round((Date.now() - _quizState.startTime) / 1000);
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
    stopTimer();
    if (elapsed <= 5) state._fastAnswers = (state._fastAnswers || 0) + 1;
    checkAchievements({ elapsed, firstTry: (state._chapterErrors||0)===0, quizCorrect: true });
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
    renderLives();

    if (state.lives <= 0 && !state.adminMode) {
      stopTimer();
      setTimeout(() => failChapter(), 1400);
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

function renderQuiz(cipher) {
  _quizState = { cipher, startTime: Date.now(), selected: null, answered: false };

  // Элементы уже скрыты в loadCipher для типа quiz

  let container = document.getElementById('quiz-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'quiz-container';
    const refEl = document.getElementById('cipher-hint-box');
    if (refEl && refEl.parentNode) refEl.parentNode.insertBefore(container, refEl);
    else document.getElementById('cipher-body') && document.getElementById('cipher-body').appendChild(container);
  }
  container.style.cssText = 'display:block;width:100%;padding:0 2px;margin-bottom:12px';

  // Строим варианты ответов
  const letters = ['А', 'Б', 'В', 'Г', 'Д'];
  const optionsHtml = cipher.options.map((opt, i) => `
    <div id="quiz-opt-${i}" onclick="quizSelect(${i})"
      style="width:100%;padding:14px 16px;margin-bottom:8px;
      background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.1);
      border-radius:10px;color:#fdfaf0;font-size:14px;cursor:pointer;
      display:flex;align-items:center;gap:12px;
      transition:all .15s ease;box-sizing:border-box;user-select:none">
      <div id="quiz-letter-${i}" style="flex-shrink:0;width:30px;height:30px;border-radius:50%;
        background:rgba(255,224,51,.08);border:1.5px solid rgba(255,224,51,.2);
        display:flex;align-items:center;justify-content:center;
        font-family:var(--head);font-size:13px;color:var(--accent);
        transition:all .15s">${letters[i] || String.fromCharCode(65+i)}</div>
      <span style="flex:1;line-height:1.5">${opt}</span>
    </div>`).join('');

  container.innerHTML = `
    <div style="font-size:10px;color:rgba(255,224,51,.5);letter-spacing:.12em;
      text-align:center;margin-bottom:10px;font-family:var(--head)">
      👆 ВЫБЕРИТЕ ВАРИАНТ И НАЖМИТЕ ОТВЕТИТЬ
    </div>
    <div id="quiz-options-list">${optionsHtml}</div>
    <div id="quiz-feedback" style="display:none;padding:10px 14px;border-radius:8px;
      margin-top:4px;margin-bottom:8px;font-size:13px;text-align:center;
      font-family:var(--head);letter-spacing:.04em"></div>
    <button id="quiz-submit-btn" onclick="quizSubmit()"
      style="width:100%;padding:14px;margin-top:4px;
      background:rgba(255,224,51,.12);border:1.5px solid rgba(255,224,51,.2);
      color:rgba(255,224,51,.5);font-family:var(--head);font-size:var(--fs-sm);
      font-weight:700;border-radius:8px;cursor:not-allowed;letter-spacing:.08em;
      transition:all .2s;pointer-events:none" disabled>
      ✓ ОТВЕТИТЬ
    </button>`;
}

function quizSelect(idx) {
  if (_quizState.answered) return;
  _quizState.selected = idx;

  // Сбрасываем все варианты
  _quizState.cipher.options.forEach((_, i) => {
    const opt = document.getElementById('quiz-opt-' + i);
    const let_ = document.getElementById('quiz-letter-' + i);
    if (!opt) return;
    if (i === idx) {
      opt.style.background = 'rgba(255,224,51,.12)';
      opt.style.borderColor = 'rgba(255,224,51,.45)';
      opt.style.color = '#fdfaf0';
      if (let_) { let_.style.background = 'rgba(255,224,51,.25)'; let_.style.borderColor = 'rgba(255,224,51,.6)'; let_.style.color = '#ffe033'; }
    } else {
      opt.style.background = 'rgba(255,255,255,.04)';
      opt.style.borderColor = 'rgba(255,255,255,.1)';
      opt.style.color = '#fdfaf0';
      if (let_) { let_.style.background = 'rgba(255,224,51,.08)'; let_.style.borderColor = 'rgba(255,224,51,.2)'; let_.style.color = 'var(--accent)'; }
    }
  });

  // Активируем кнопку
  const submitBtn = document.getElementById('quiz-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.style.background = 'rgba(255,224,51,.2)';
    submitBtn.style.borderColor = 'rgba(255,224,51,.5)';
    submitBtn.style.color = '#ffe033';
    submitBtn.style.cursor = 'pointer';
    submitBtn.style.pointerEvents = 'auto';
    submitBtn.style.boxShadow = '0 0 12px rgba(255,224,51,.15)';
  }
}

function quizSubmit() {
  if (_quizState.answered || _quizState.selected === null) return;
  _quizState.answered = true;

  const cipher   = _quizState.cipher;
  const correct  = cipher.correctIndex;
  const selected = _quizState.selected;
  const elapsed  = Math.round((Date.now() - _quizState.startTime) / 1000);
  const isCorrect = selected === correct;

  // Блокируем кнопку ответить
  const submitBtn = document.getElementById('quiz-submit-btn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.style.pointerEvents = 'none'; }

  // Подсвечиваем правильный/неправильный
  cipher.options.forEach((_, i) => {
    const opt  = document.getElementById('quiz-opt-' + i);
    const let_ = document.getElementById('quiz-letter-' + i);
    if (!opt) return;
    opt.style.cursor = 'default';
    if (i === correct) {
      opt.style.background = 'rgba(40,200,80,.15)';
      opt.style.borderColor = 'rgba(40,200,80,.5)';
      opt.style.color = '#50ee80';
      if (let_) { let_.style.background = 'rgba(40,200,80,.25)'; let_.style.borderColor = 'rgba(40,200,80,.6)'; let_.style.color = '#50ee80'; }
    } else if (i === selected && !isCorrect) {
      opt.style.background = 'rgba(255,50,50,.12)';
      opt.style.borderColor = 'rgba(255,50,50,.45)';
      opt.style.color = '#ff7070';
      if (let_) { let_.style.background = 'rgba(255,50,50,.2)'; let_.style.borderColor = 'rgba(255,50,50,.5)'; let_.style.color = '#ff7070'; }
    } else {
      opt.style.opacity = '0.4';
    }
  });

  const feedback = document.getElementById('quiz-feedback');

  if (isCorrect) {
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
    stopTimer();
    if (elapsed <= 5) state._fastAnswers = (state._fastAnswers || 0) + 1;
    const cipherTypeCtx = { quizCorrect: true, elapsed };
    checkAchievements({ elapsed, firstTry: (state._chapterErrors || 0) === 0, ...cipherTypeCtx });
    setTimeout(() => {
      // Скрываем quiz-container перед показом экрана успеха
      const qc = document.getElementById('quiz-container');
      if (qc) qc.style.display = 'none';
      // Восстанавливаем cipher-input-wrap для следующего задания
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
      feedback.textContent = '❌ Неверно — правильный ответ выделен зелёным';
    }
    state.streak = 0;
    state._chapterErrors = (state._chapterErrors || 0) + 1;
    if (!state.adminMode) {
      state.lives--;
      animateLifeLoss();
      playSound('life_lost');
    }
    saveState();
    renderLives();

    if (state.lives <= 0) {
      stopTimer();
      setTimeout(() => failChapter(), 1400);
    } else {
      // Через 2 секунды разрешаем выбрать снова (кроме правильного)
      setTimeout(() => {
        _quizState.answered = false;
        _quizState.selected = null;
        cipher.options.forEach((_, i) => {
          const opt2 = document.getElementById('quiz-opt-' + i);
          const let2 = document.getElementById('quiz-letter-' + i);
          if (!opt2 || i === correct) return;
          opt2.style.background = 'rgba(255,255,255,.04)';
          opt2.style.borderColor = 'rgba(255,255,255,.1)';
          opt2.style.color = '#fdfaf0';
          opt2.style.opacity = '1';
          opt2.style.cursor = 'pointer';
          if (let2) { let2.style.background = 'rgba(255,224,51,.08)'; let2.style.borderColor = 'rgba(255,224,51,.2)'; let2.style.color = 'var(--accent)'; }
        });
        if (feedback) feedback.style.display = 'none';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.style.background = 'rgba(255,224,51,.08)';
          submitBtn.style.borderColor = 'rgba(255,224,51,.15)';
          submitBtn.style.color = 'rgba(255,224,51,.4)';
          submitBtn.style.cursor = 'not-allowed';
          submitBtn.style.pointerEvents = 'none';
          submitBtn.style.boxShadow = 'none';
        }
      }, 2000);
    }
  }
}

// Совместимость — старый checkQuizAnswer больше не используется
function checkQuizAnswer(idx) { quizSelect(idx); }
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
  const cipher  = CHAPTERS[state.chapter].ciphers[state.cipherIdx];
  const answer  = anagramState.placed.map(i => i !== null ? anagramState.letters[i] : '').join('');
  const elapsed = Math.round((Date.now() - state.startTime) / 1000);

  // Подсветить слоты
  const slots = document.querySelectorAll('.anagram-slot');
  const ansHash = await sha256(answer.toUpperCase());
  if (ansHash === cipher.answer) {
    slots.forEach(s => { s.style.borderColor = '#55dd55'; s.style.background = 'rgba(85,221,85,.15)'; });
    const pts = calcPoints(cipher, elapsed);
    state.chapterScore += pts;
    saveState();
    setTimeout(() => showSuccess(cipher, pts, elapsed), 600);
  } else {
    slots.forEach(s => { s.style.borderColor = '#ff3a3a'; s.style.background = 'rgba(255,58,58,.1)'; });
    setTimeout(() => slots.forEach(s => { s.style.borderColor = ''; s.style.background = ''; }), 800);
    state.lives--;
    saveState();
    if (state.lives <= 0) {
      if (state.adminMode) {
        state.lives = 5; saveState(); renderLives();
        setTimeout(resetAnagram, 500);
      } else { setTimeout(() => failChapter(), 1200); }
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
  const target = cipher.mapCity || '';
  const ref = document.getElementById('cipher-ref');

  const dots = MAP_CITIES.map(c => {
    const isTarget = false; // не показываем правильный заранее
    return `<g class="map-city-dot" id="mcdot-${c.name}" onclick="checkMapAnswer('${c.name}','${target}')">
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
  const elapsed = Math.round((Date.now() - state.startTime) / 1000);
  const cipher  = CHAPTERS[state.chapter].ciphers[state.cipherIdx];

  const dotEl = document.getElementById(`mcdot-${clicked}`);

  const clickedHash = await sha256(clicked);
  if (clickedHash === cipher.answer) {
    mapAnswered = true;
    if (dotEl) dotEl.querySelector('circle').setAttribute('fill','#55dd55');
    document.getElementById('map-hint-text').textContent = '✅ Верно! ' + target;
    const pts = calcPoints(cipher, elapsed);
    state.chapterScore += pts;
    saveState();
    setTimeout(() => showSuccess(cipher, pts, elapsed), 800);
  } else {
    if (dotEl) {
      const c = dotEl.querySelector('circle');
      c.setAttribute('fill','#ff3a3a');
      setTimeout(() => c.setAttribute('fill','#ffe033'), 700);
    }
    document.getElementById('map-hint-text').textContent = '❌ Не здесь. Попробуй ещё раз.';
    state.lives--;
    saveState();
    if (state.lives <= 0) {
      if (state.adminMode) {
        state.lives = 5; saveState(); renderLives();
        document.getElementById('map-hint-text').textContent = '⚡ Режим админа: жизни восстановлены';
      } else { setTimeout(() => failChapter(), 1200); }
    } else { renderLives(); }
  }
}


// ═══════════════════════════════════════════════════════
//  ЗВУКОВЫЕ ЭФФЕКТЫ (Web Audio API — без файлов)
// ═══════════════════════════════════════════════════════
let _audioCtx = null;
function getAudio() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _audioCtx;
}

function playSound(type) {
  const ctx = getAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'correct') {
      // Победный звук — два тона вверх
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(784, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'wrong') {
      // Ошибка — низкий дребезжащий звук
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.setValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'chapter_win') {
      // Победная фанфара
      const freqs = [523, 659, 784, 1047];
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(f, now + i * 0.1);
        g.gain.setValueAtTime(0.25, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.3);
      });
    } else if (type === 'life_lost') {
      // Потеря жизни — тревожный звук
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'hint') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'game_win') {
      // Финальная победа — торжественный аккорд
      [523,659,784,880,1047].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = i % 2 === 0 ? 'sine' : 'triangle';
        o.frequency.setValueAtTime(f, now + i * 0.08);
        g.gain.setValueAtTime(0.2, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        o.start(now + i * 0.08); o.stop(now + 1.5);
      });
    }
  } catch(e) {}
}


// ═══════════════════════════════════════════════════════
//  КОНФЕТТИ (улучшенное)
// ═══════════════════════════════════════════════════════
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
        setTimeout(() => splash.remove(), 500);
      }, 200);
    }
  }, 80);
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
  // Скорость
  {id:'speed_1',    icon:'⚡', name:'Молния',          desc:'Ответил за 5 секунд',           pts:10},
  {id:'speed_5',    icon:'🚀', name:'Реактивный',       desc:'5 ответов быстрее 5 секунд',    pts:25},
  {id:'speed_10',   icon:'🌪', name:'Вихрь',            desc:'10 ответов быстрее 10 секунд',  pts:50},
  {id:'speed_all',  icon:'🏎', name:'Формула-1',         desc:'Вся глава за 3 минуты',         pts:75},
  // Точность
  {id:'perfect_1',  icon:'🎯', name:'Снайпер',          desc:'Глава без единой ошибки',       pts:50},
  {id:'perfect_3',  icon:'💎', name:'Бриллиант',        desc:'3 главы без ошибок',            pts:100},
  {id:'perfect_all',icon:'👑', name:'Безупречный',      desc:'Все главы без ошибок',          pts:200},
  {id:'no_hints_1', icon:'🧠', name:'Умник',            desc:'Глава без подсказок',           pts:30},
  {id:'no_hints_all',icon:'🎓',name:'Мастер шифров',    desc:'Все главы без подсказок',       pts:150},
  // Стрик
  {id:'streak_3',   icon:'🔥', name:'На волне',         desc:'Стрик 3 правильных ответа',     pts:15},
  {id:'streak_5',   icon:'💥', name:'Огонь!',           desc:'Стрик 5 правильных ответа',     pts:30},
  {id:'streak_10',  icon:'🌋', name:'Вулкан',           desc:'Стрик 10 правильных ответов',   pts:60},
  {id:'streak_all', icon:'☄️', name:'Метеор',           desc:'Вся глава одним стриком',       pts:100},
  // Прогресс
  {id:'ch1_done',   icon:'🏅', name:'Первый шаг',       desc:'Пройдена глава I',              pts:20},
  {id:'ch3_done',   icon:'🥈', name:'Полпути',          desc:'Пройдено 3 главы',              pts:40},
  {id:'ch6_done',   icon:'🥇', name:'Победитель',       desc:'Пройдена вся игра',             pts:100},
  {id:'ch1_gold',   icon:'🌟', name:'Золото главы I',   desc:'80%+ очков в главе I',          pts:30},
  {id:'ch2_gold',   icon:'🌟', name:'Золото главы II',  desc:'80%+ очков в главе II',         pts:30},
  {id:'ch3_gold',   icon:'🌟', name:'Золото главы III', desc:'80%+ очков в главе III',        pts:30},
  {id:'ch4_gold',   icon:'🌟', name:'Золото главы IV',  desc:'80%+ очков в главе IV',         pts:30},
  {id:'ch5_gold',   icon:'🌟', name:'Золото главы V',   desc:'80%+ очков в главе V',          pts:30},
  {id:'ch6_gold',   icon:'🌟', name:'Золото главы VI',  desc:'80%+ очков в главе VI',         pts:30},
  {id:'all_gold',   icon:'👸', name:'Чемпион',          desc:'80%+ во всех главах',           pts:200},
  // Очки
  {id:'score_100',  icon:'💫', name:'Первые очки',      desc:'Набрал 100 очков',              pts:5},
  {id:'score_500',  icon:'⭐', name:'Набирает обороты', desc:'Набрал 500 очков',              pts:10},
  {id:'score_1000', icon:'🌠', name:'Тысячник',         desc:'Набрал 1000 очков',             pts:20},
  {id:'score_2500', icon:'💎', name:'Эксперт',          desc:'Набрал 2500 очков',             pts:40},
  {id:'score_5000', icon:'🏆', name:'Легенда',          desc:'Набрал 5000+ очков',            pts:80},
  // Шифры
  {id:'morse_1',    icon:'📡', name:'Морзист',          desc:'Решил задание на азбуке Морзе', pts:10},
  {id:'morse_5',    icon:'📻', name:'Радист',           desc:'5 заданий на Морзе',            pts:25},
  {id:'caesar_5',   icon:'🔐', name:'Цезарь',           desc:'5 заданий шифром Цезаря',       pts:20},
  {id:'atbash_3',   icon:'🪞', name:'Зеркало',          desc:'3 задания шифром Атбаш',        pts:15},
  {id:'math_3',     icon:'➗', name:'Математик',        desc:'3 математических задания',      pts:20},
  {id:'anagram_3',  icon:'🔤', name:'Буквоед',          desc:'3 анаграммы',                   pts:20},
  {id:'map_1',      icon:'🗺', name:'Картограф',        desc:'Нашёл город на карте',          pts:15},
  // Особые
  {id:'first_try',  icon:'🎊', name:'С первого раза',   desc:'Правильный ответ без ошибок',   pts:5},
  {id:'comeback',   icon:'💪', name:'Возвращение',      desc:'Прошёл главу после провала',    pts:30},
  {id:'night_owl',  icon:'🦉', name:'Полуночник',       desc:'Играл после 23:00',             pts:15},
  {id:'early_bird', icon:'🐦', name:'Ранняя пташка',    desc:'Играл до 8:00',                 pts:15},
  {id:'dedicated',  icon:'📚', name:'Усердный',         desc:'Прошёл 10+ заданий',            pts:20},
  {id:'veteran',    icon:'🎖', name:'Ветеран',          desc:'Прошёл 30 заданий',             pts:50},
  {id:'collector',  icon:'🗃', name:'Коллекционер',     desc:'Получил 10 достижений',         pts:30},
  {id:'explorer',   icon:'🧭', name:'Исследователь',   desc:'Открыл все 6 глав',             pts:25},
  {id:'historian',  icon:'📜', name:'Историк',          desc:'Прочитал 10 исторических фактов',pts:20},
  {id:'survivor',   icon:'🛡', name:'Выживший',         desc:'Остался с 1 жизнью и победил',  pts:40},
  {id:'comeback_ch',icon:'🔄', name:'Несломленный',     desc:'Повторил главу и победил',      pts:35},
  {id:'top3',       icon:'🏅', name:'Призёр',           desc:'Попал в топ-3 рейтинга',        pts:50},
  {id:'top1',       icon:'🥇', name:'Чемпион школы',    desc:'Первое место в рейтинге',       pts:100},
  {id:'all_types',  icon:'🎭', name:'Универсал',        desc:'Решил все типы шифров',         pts:60},
  {id:'full_game',  icon:'🎮', name:'Настоящий разведчик', desc:'Прошёл игру полностью',      pts:150},
,
  // ── ХОЙНИКИ И ГОМЕЛЬСКАЯ ОБЛАСТЬ ──────────────────────
  {id:'hoiki_1',     icon:'🌿', name:'Сын Полесья',       desc:'Завершил главу о Хойниках',               pts:25},
  {id:'hoiki_quiz',  icon:'📍', name:'Знаток Хойник',     desc:'Ответил на все вопросы о Хойниках',       pts:40},
  {id:'gomel_map',   icon:'🗺', name:'Компас Гомельщины', desc:'Нашёл Гомель на карте',                   pts:20},
  {id:'polesia',     icon:'🌲', name:'Дух Полесья',       desc:'Узнал название региона',                  pts:15},
  {id:'soizh_river', icon:'🌊', name:'По реке Сож',       desc:'Расшифровал название реки',               pts:20},
  // ── ИСТОРИЯ И GEOGRAPHY ─────────────────────────────
  {id:'quiz_5',      icon:'🧩', name:'Знаток',            desc:'Правильно ответил на 5 вопросов викторины',pts:30},
  {id:'quiz_10',     icon:'🎓', name:'Профессор',         desc:'Правильно ответил на 10 вопросов викторины',pts:60},
  {id:'quiz_all',    icon:'🏫', name:'Учёный',            desc:'Все вопросы викторины правильно',          pts:100},
  {id:'date_1941',   icon:'📅', name:'Помню 41-й',        desc:'Назвал год начала оккупации',              pts:15},
  {id:'date_1945',   icon:'🕊', name:'Помню 45-й',        desc:'Назвал год Победы',                       pts:15},
  // ── СКОРОСТЬ II УРОВЕНЬ ──────────────────────────────
  {id:'speed_ch1',   icon:'💨', name:'Стремительный старт',desc:'Глава I за менее чем 5 минут',            pts:40},
  {id:'speed_any',   icon:'🔥', name:'На максимуме',      desc:'Любое задание за 3 секунды',               pts:35},
  {id:'speed_morse', icon:'📻', name:'Телеграфист',       desc:'Морзе за 10 секунд',                       pts:30},
  {id:'no_wrong_1',  icon:'✨', name:'Без промаха',       desc:'Первое задание без ошибок',                pts:10},
  {id:'fast_start',  icon:'⏩', name:'Быстрый старт',     desc:'Первые 3 задания за 30 секунд',            pts:25},
  // ── СТОЙКОСТЬ ────────────────────────────────────────
  {id:'one_life',    icon:'❤️', name:'На волоске',        desc:'Прошёл главу с 1 оставшейся жизнью',       pts:50},
  {id:'retry_2',     icon:'🔄', name:'Настойчивый',       desc:'Повторил одну главу дважды',               pts:25},
  {id:'retry_win',   icon:'💪', name:'Не сдаётся',        desc:'После провала прошёл главу с первой попытки',pts:60},
  {id:'no_penalty',  icon:'🎖', name:'Без штрафов',       desc:'Прошёл игру без повторных попыток',        pts:80},
  {id:'comeback_3',  icon:'🦅', name:'Феникс',            desc:'Провалил и победил 3 раза подряд',         pts:70},
  // ── РАЗНООБРАЗИЕ ─────────────────────────────────────
  {id:'first_quiz',  icon:'❓', name:'Первый вопрос',     desc:'Ответил на первый вопрос викторины',        pts:5},
  {id:'first_math',  icon:'🔢', name:'Первый расчёт',     desc:'Решил первую математическую задачу',        pts:5},
  {id:'first_anagram',icon:'🔤',name:'Первая анаграмма',  desc:'Разгадал первую анаграмму',                pts:5},
  {id:'first_map_t', icon:'🧭', name:'Первая карта',      desc:'Нашёл первый город на карте',              pts:5},
  {id:'all_quiz',    icon:'📚', name:'Эрудит',            desc:'Все вопросы викторины пройдены',            pts:50},
  // ── КОМБИНИРОВАННЫЕ ──────────────────────────────────
  {id:'perfect_run', icon:'🌈', name:'Идеальный забег',   desc:'Глава без ошибок, без подсказок и быстро', pts:120},
  {id:'speedrun',    icon:'🏁', name:'Спидран',           desc:'Все 6 глав менее чем за 1 час',            pts:150},
  {id:'pacifist',    icon:'🕊', name:'Пацифист',          desc:'Не использовал ни одной подсказки',        pts:100},
  {id:'iron_will',   icon:'⚙️', name:'Железная воля',    desc:'5 заданий подряд без ошибок',              pts:45},
  {id:'chain_6',     icon:'⛓', name:'Цепная реакция',    desc:'6 правильных ответов подряд (2 главы)',     pts:80},
  // ── ВРЕМЯ ────────────────────────────────────────────
  {id:'weekend',     icon:'📆', name:'Выходной разведчик',desc:'Играл в выходной день',                    pts:10},
  {id:'school_time', icon:'🏫', name:'Школьный час',      desc:'Играл с 8 до 15 часов',                   pts:10},
  {id:'marathon',    icon:'🏃', name:'Марафон',           desc:'Прошёл 3 главы за один сеанс',             pts:35},
  {id:'all_in_day',  icon:'☀️', name:'День победы',      desc:'Прошёл все 6 глав за один день',           pts:100},
  {id:'long_game',   icon:'🌙', name:'Долгая ночь',       desc:'Играл более 30 минут',                    pts:20},
  // ── РЕЙТИНГ И СОЦИАЛЬНОЕ ─────────────────────────────
  {id:'top5',        icon:'⭐', name:'В элите',           desc:'Вошёл в топ-5 рейтинга',                  pts:60},
  {id:'beat_someone',icon:'📈', name:'Обогнал',           desc:'Поднялся выше другого игрока',             pts:15},
  {id:'shared',      icon:'📤', name:'Поделился',         desc:'Поделился результатом',                    pts:10},
  {id:'ach_20',      icon:'🏆', name:'Достиженец',        desc:'Получил 20 достижений',                   pts:40},
  {id:'ach_30',      icon:'💠', name:'Мастер наград',     desc:'Получил 30 достижений',                   pts:60},
  // ── ТЕМАТИЧЕСКИЕ ─────────────────────────────────────
  {id:'war_expert',  icon:'🎗', name:'Эксперт войны',     desc:'Правильно ответил на все вопросы о ВОВ',   pts:75},
  {id:'geo_expert',  icon:'🌍', name:'Географ',           desc:'Нашёл все 3 города на карте',              pts:50},
  {id:'cipher_master',icon:'🔓',name:'Взломщик',          desc:'Разгадал все шифры без подсказок',         pts:90},
  {id:'history_buff',icon:'📖', name:'Историк',           desc:'Прочитал 15 исторических фактов',          pts:30},
  {id:'memory',      icon:'🎖', name:'Вечная память',     desc:'Завершил игру и прочитал все факты',        pts:80},
  // ── ФИНАЛЬНЫЕ ────────────────────────────────────────
  {id:'all_100',     icon:'💯', name:'Сотка!',            desc:'Получил 100 достижений',                   pts:250},
  {id:'true_hero',   icon:'🌟', name:'Настоящий герой',   desc:'Прошёл все главы на золото без подсказок',  pts:300},
  {id:'school_legend',icon:'👑',name:'Легенда школы',     desc:'Первый кто получил все достижения',         pts:500},
  {id:'peacekeeper', icon:'🕊', name:'Миротворец',        desc:'Помнит и чтит историю своей Родины',       pts:100},
  {id:'defender',    icon:'🛡', name:'Защитник',          desc:'Завершил игру — настоящий разведчик',       pts:150},
];

// Состояние достижений
if (!state.achievements) state.achievements = {};
if (!state.achievementPts) state.achievementPts = 0;

function unlockAchievement(id) {
  if (!state.achievements) state.achievements = {};
  if (state.achievements[id]) return; // уже есть
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (!ach) return;
  state.achievements[id] = Date.now();
  state.achievementPts = (state.achievementPts || 0) + ach.pts;
  saveState();
  // Показываем уведомление
  showAchievementToast(ach);
  // Синхронизируем
  setTimeout(() => autoSync(false), 500);
}

function showAchievementToast(ach) {
  const old = document.getElementById('ach-toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'ach-toast';
  el.style.cssText = `position:fixed;top:80px;left:50%;transform:translateX(-50%);
    z-index:9997;background:linear-gradient(135deg,#1a1508,#2a2010);
    border:1px solid rgba(255,224,51,.4);border-radius:12px;
    padding:12px 18px;display:flex;align-items:center;gap:12px;
    box-shadow:0 8px 32px rgba(0,0,0,.6),0 0 20px rgba(255,224,51,.15);
    animation:slideDown .4s cubic-bezier(.34,1.56,.64,1) both;
    max-width:280px`;
  el.innerHTML = `
    <div style="font-size:28px;flex-shrink:0">${ach.icon}</div>
    <div>
      <div style="font-size:9px;color:rgba(255,224,51,.6);letter-spacing:.1em;margin-bottom:2px">ДОСТИЖЕНИЕ</div>
      <div style="font-family:var(--head);font-size:var(--fs-sm);color:var(--accent)">${ach.name}</div>
      <div style="font-size:10px;color:var(--muted);margin-top:2px">${ach.desc} · +${ach.pts}⭐</div>
    </div>`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s,transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(-10px)';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function checkAchievements(context = {}) {
  const done = Object.keys(state.completedChapters).length;
  const score = state.totalScore;
  const achs = state.achievements || {};
  const stats = state.chapterStats || {};
  const typesUsed = new Set();

  // Считаем типы шифров и задания
  let totalCiphers = 0;
  let morseCount = 0, caesarCount = 0, atbashCount = 0, mathCount = 0, anagramCount = 0, mapCount = 0;
  CHAPTERS.forEach(ch => {
    if (state.completedChapters[ch.id]) {
      ch.ciphers.forEach(c => {
        totalCiphers++;
        typesUsed.add(c.type);
        if (c.type === 'morse') morseCount++;
        if (c.type === 'caesar') caesarCount++;
        if (c.type === 'atbash') atbashCount++;
        if (c.type === 'math') mathCount++;
        if (c.type === 'anagram') anagramCount++;
        if (c.type === 'map') mapCount++;
      });
    }
  });

  // Скорость
  if (context.elapsed <= 5) unlockAchievement('speed_1');
  if ((state._fastAnswers || 0) >= 5) unlockAchievement('speed_5');
  if ((state._fastAnswers || 0) >= 10) unlockAchievement('speed_10');

  // Точность
  if (context.chapterDoneNoErrors) unlockAchievement('perfect_1');
  if ((state._perfectChapters || 0) >= 3) unlockAchievement('perfect_3');
  if ((state._perfectChapters || 0) >= 6) unlockAchievement('perfect_all');
  if (context.chapterDoneNoHints) unlockAchievement('no_hints_1');
  if ((state._noHintChapters || 0) >= 6) unlockAchievement('no_hints_all');

  // Стрик
  if ((state.streak || 0) >= 3) unlockAchievement('streak_3');
  if ((state.streak || 0) >= 5) unlockAchievement('streak_5');
  if ((state.streak || 0) >= 10) unlockAchievement('streak_10');

  // Прогресс
  if (done >= 1) unlockAchievement('ch1_done');
  if (done >= 3) unlockAchievement('ch3_done');
  if (done >= 6) { unlockAchievement('ch6_done'); unlockAchievement('full_game'); }
  if (done >= 6) unlockAchievement('explorer');

  // Золото за главы
  CHAPTERS.forEach((ch, i) => {
    if (!state.completedChapters[ch.id]) return;
    const s = state.chapterStats && state.chapterStats[ch.id];
    const maxCh = ch.ciphers.reduce((a,c) => a+c.points, 0);
    const chScore = state.chapterScores[ch.id] || 0;
    if (chScore >= maxCh * 0.8) {
      unlockAchievement('ch' + (i+1) + '_gold');
    }
  });
  // Все золото
  const goldCount = CHAPTERS.filter((ch,i) => {
    const maxCh = ch.ciphers.reduce((a,c) => a+c.points, 0);
    return (state.chapterScores[ch.id] || 0) >= maxCh * 0.8;
  }).length;
  if (goldCount >= 6) unlockAchievement('all_gold');
  if (goldCount >= 6) unlockAchievement('champion');

  // Очки
  if (score >= 100)  unlockAchievement('score_100');
  if (score >= 500)  unlockAchievement('score_500');
  if (score >= 1000) unlockAchievement('score_1000');
  if (score >= 2500) unlockAchievement('score_2500');
  if (score >= 5000) unlockAchievement('score_5000');

  // Шифры
  if (morseCount >= 1)   unlockAchievement('morse_1');
  if (morseCount >= 5)   unlockAchievement('morse_5');
  if (caesarCount >= 5)  unlockAchievement('caesar_5');
  if (atbashCount >= 3)  unlockAchievement('atbash_3');
  if (mathCount >= 3)    unlockAchievement('math_3');
  if (anagramCount >= 3) unlockAchievement('anagram_3');
  if (mapCount >= 1)     unlockAchievement('map_1');
  if (typesUsed.size >= 6) unlockAchievement('all_types');

  // Задания
  if (totalCiphers >= 10) unlockAchievement('dedicated');
  if (totalCiphers >= 30) unlockAchievement('veteran');

  // Особые
  const h = new Date().getHours();
  if (h >= 23 || h < 6)  unlockAchievement('night_owl');
  if (h >= 5 && h < 8)   unlockAchievement('early_bird');
  if (context.firstTry)  unlockAchievement('first_try');
  if (context.survived1) unlockAchievement('survivor');
  if (context.comeback)  unlockAchievement('comeback');
  if (context.retryWin)  unlockAchievement('comeback_ch');

  // Коллекционер
  const achCount = Object.keys(state.achievements || {}).length;
  if (achCount >= 10) unlockAchievement('collector');
  if (achCount >= 20) unlockAchievement('ach_20');
  if (achCount >= 30) unlockAchievement('ach_30');
  if (achCount >= 100) unlockAchievement('all_100');

  // Хойники
  if (state.completedChapters[1]) unlockAchievement('hoiki_1');
  if (done >= 1 && context.quizCorrect) unlockAchievement('first_quiz');
  if (context.quizCorrect) {
    state._quizCorrect = (state._quizCorrect || 0) + 1;
    if (state._quizCorrect >= 5)  unlockAchievement('quiz_5');
    if (state._quizCorrect >= 10) unlockAchievement('quiz_10');
  }
  if (context.mathCorrect) unlockAchievement('first_math');
  if (context.anagramCorrect) unlockAchievement('first_anagram');
  if (context.mapCorrect) unlockAchievement('first_map_t');

  // Скорость
  if (context.elapsed <= 3) unlockAchievement('speed_any');
  if (context.elapsed <= 5 && !achs.no_wrong_1) unlockAchievement('no_wrong_1');
  if (context.morseFast) unlockAchievement('speed_morse');

  // Время игры
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 15)   unlockAchievement('school_time');
  const day = new Date().getDay();
  if (day === 0 || day === 6)   unlockAchievement('weekend');

  // Стойкость
  if (state.lives === 1 && context.chapterDoneNoErrors === false && done > 0) unlockAchievement('one_life');
  if (context.retryWin) unlockAchievement('retry_win');

  // Поделился
  if (context.shared) unlockAchievement('shared');

  // Рейтинг достижений
  if (done >= 6) unlockAchievement('defender');
  if (done >= 6 && (state._perfectChapters || 0) >= 6 && (state._noHintChapters || 0) >= 6) unlockAchievement('true_hero');
  if (done >= 6 && context.readAllFacts) unlockAchievement('memory');
}

function renderAchievementsTab(container) {
  const myAchs = state.achievements || {};
  const total = ACHIEVEMENTS.length;
  const earned = Object.keys(myAchs).length;
  const earnedPts = state.achievementPts || 0;

  let html = `<div style="padding:16px">
    <div style="background:#141108;border:1px solid rgba(255,224,51,.12);
      border-radius:8px;padding:14px;margin-bottom:16px;display:flex;justify-content:space-around;text-align:center">
      <div>
        <div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent)">${earned}</div>
        <div style="font-size:10px;color:var(--muted)">ПОЛУЧЕНО</div>
      </div>
      <div>
        <div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent)">${total}</div>
        <div style="font-size:10px;color:var(--muted)">ВСЕГО</div>
      </div>
      <div>
        <div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent)">${earnedPts}</div>
        <div style="font-size:10px;color:var(--muted)">ОЧКОВ</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">`;

  ACHIEVEMENTS.forEach(ach => {
    const has = !!myAchs[ach.id];
    html += `<div style="background:${has ? 'linear-gradient(145deg,#1a1808,#141208)' : '#0e0c08'};
      border:1px solid ${has ? 'rgba(255,224,51,.25)' : 'rgba(255,255,255,.05)'};
      border-radius:8px;padding:10px;opacity:${has ? '1' : '0.35'}">
      <div style="font-size:22px;margin-bottom:4px">${ach.icon}</div>
      <div style="font-family:var(--head);font-size:11px;color:${has ? 'var(--accent)' : '#fdfaf0'};
        letter-spacing:.04em">${ach.name}</div>
      <div style="font-size:9px;color:var(--muted);margin-top:2px;line-height:1.4">${ach.desc}</div>
      <div style="font-size:9px;color:${has ? 'var(--accent)' : 'rgba(255,255,255,.2)'};margin-top:4px">+${ach.pts}⭐</div>
    </div>`;
  });
  html += '</div></div>';
  container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
if (document.readyState === "loading") { showSplash(); } else { showSplash(); }
loadState();
mergeBotLeaderboard();

async function fetchAndApplyState() {
  // Синхронизируем всегда — включая режим администратора (для сохранения очков)
  const uid = getTgUserId();
  const syncUrl = window._syncUrl;
  if (!uid || !syncUrl) return;
  try {
    const base = syncUrl.replace('/game_sync', '');
    const resp = await fetch(base + '/game_state?user_id=' + uid);
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.ok) return;
    if (data.banned) {
      document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0d0b08;color:#fff;text-align:center;padding:32px;font-family:sans-serif"><div style="font-size:64px;margin-bottom:16px">🚫</div><div style="font-size:22px;font-weight:700;color:#ffe033;margin-bottom:12px">Доступ заблокирован</div><div style="font-size:15px;color:rgba(255,255,255,.6);max-width:280px">Ваш аккаунт заблокирован администратором.</div></div>';
      try { localStorage.removeItem(storageKey()); } catch(e2) {}
      return;
    }
    const localCompleted = Object.keys(state.completedChapters || {}).length;
    const serverCompleted = data.completed || 0;
    const serverScore = typeof data.score === 'number' ? data.score : 0;
    const serverGameOver = !!data.game_over;

    // Сервер может быть впереди (например, если localStorage “устарел” после перезагрузки).
    // Тогда обязаны подтянуть сервер, иначе прогресс “откатится”.
    const serverIsAhead =
      serverScore > (state.totalScore || 0) ||
      serverCompleted > localCompleted ||
      (serverGameOver && !state.gameOver);

    if (serverIsAhead) {
      const savedAdminMode = state.adminMode; // сохраняем перед перезаписью
      state.totalScore = serverScore;
      state.completedChapters = {};
      for (let i = 1; i <= (serverCompleted || 0); i++) state.completedChapters[i] = true;
      state.chapterScores = {};
      state.gameOver = serverGameOver;
      state.adminMode = savedAdminMode; // восстанавливаем
      try { localStorage.removeItem(storageKey()); } catch(e2) {}
      saveState();
      renderChapters();
    }
  } catch(e) { console.warn('fetchAndApplyState:', e); }
}

renderChapters();
fetchAndApplyState();
try {
} catch(e) {}
