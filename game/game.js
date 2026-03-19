// ═══════════════════════════════════════════════════════
//  ДАННЫЕ ИГРЫ — 20 ШИФРОВ, 4 ГЛАВЫ
// ═══════════════════════════════════════════════════════
const CHAPTERS = [
  {
    id:1, title:"ПОДПОЛЬЕ МИНСКА", subtitle:"Глава I",
    place:"МИНСК · ИЮЛЬ 1942", stamp:"📜",
    meta:"Дата: 14.07.1942\nМесто: Минск, оккупация\nСтатус: АКТИВНО",
    briefing:`Лето 1942 года. Минск под оккупацией уже год. Подпольная сеть «Комета» действует в городе. Перехваченные донесения содержат сведения о вражеских колоннах. Немцы меняют коды каждые 48 часов — действуй быстро.`,
    mission:"Расшифруй 5 донесений минского подполья",
    ciphers:[
      { type:"caesar", typeLabel:"ШИФР ЦЕЗАРЯ", shift:3,
        task:"Каждая буква сдвинута на 3 позиции вперёд. А→Г, Б→Д...",
        encrypted:"ЁСУСЖ", answer:"f9e05f164c5a0d5f568e20655d6a3460a1b89be8ae2d039432b7f591269c56d7",
        hint:"Ё(6)−3=3=Г. С(19)−3=16=О. У(21)−3=18=Р. С(19)−3=16=О. Ж(8)−3=5=Д. ГОРОД!",
        fact:"Минское подполье — одна из крупнейших сетей сопротивления в Европе: более 9000 участников.", points:100 },
      { type:"morse", typeLabel:"АЗБУКА МОРЗЕ", shift:0,
        task:"Буквы разделены -/, слова разделены //",
        encrypted:"....-/.-..-/.-/-...//-..-/----/.-.-/----/--.",
        answer:"9f105caf00cb3a6702aa88267e5efeac19d5ed77d966999d103ad3c02e09f622",
        hint:".... = Х, .-.. = Л, . = Е, -... = Б → ХЛЕБ. -.. = Д, --- = О, .-. = Р, --- = О, --. = Г → ДОРОГ.",
        fact:"Подпольщики рисковали жизнью при каждом выходе в эфир — немцы засекали радиосигналы за несколько минут.", points:120 },
      { type:"caesar", typeLabel:"ШИФР ЦЕЗАРЯ", shift:4,
        task:"Сдвиг изменился — теперь 4 позиции вперёд.",
        encrypted:"ХОПДЗ", answer:"f4f847839b6e46ff3047b6ca7622555097aa47f3ee69e4f935530f4faa93d18c",
        hint:"Х(24)−4=20=С. О(16)−4=12=К. П(17)−4=13=Л. Д(5)−4=1=А. З(9)−4=5=Д. СКЛАД!",
        fact:"Подпольщики организовывали тайные склады оружия и медикаментов для партизан.", points:130 },
      { type:"atbash", typeLabel:"ШИФР АТБАШ", shift:0,
        task:"Каждая буква заменяется на зеркальную: А↔Я, Б↔Ю, В↔Э... Алфавит читается с двух сторон одновременно.",
        encrypted:"НЭАЧГ", answer:"f44ea8d11615d997a61d3b8b0b80d8b5ea76d2dbb60c17fa162ede87abbe7bf7",
        hint:"Алфавит 33 буквы. А(1)↔Я(33), Б(2)↔Ю(32)... Н(15)↔С(19). Э(31)↔В(3)? Нет — Э зеркало В. А↔Я, Ч(24)↔А? Нет — считай: 33+1−позиция. Н(15)→33+1−15=19=С ✓",
        fact:"Шифр Атбаш — один из древнейших шифров, использовался ещё в библейские времена.", points:150 },
      { type:"num", typeLabel:"ЧИСЛОВОЙ КОД", shift:0,
        task:"Каждое число — порядковый номер буквы в алфавите. А=1, Б=2, В=3...",
        encrypted:"33-3-12-1", answer:"20239dec89076cf07026693b3e5d5efc14bd7a26c1cd49e2bb77deb90cf8a00f",
        hint:"33=Я, 3=В? Нет — алфавит: А=1,Б=2,В=3,Г=4,Д=5,Е=6,Ё=7,Ж=8,З=9,И=10,Й=11,К=12,Л=13. 33=Я, 3=В, 12=К, 1=А → ЯВКА!",
        fact:"Явка — место для секретных встреч подпольщиков. Адрес передавали только числовым кодом.", points:160 }
    ]
  },
  {
    id:2, title:"РЕЛЬСОВАЯ ВОЙНА", subtitle:"Глава II",
    place:"ВИТЕБСК · АВГУСТ 1943", stamp:"💣",
    meta:"Дата: 03.08.1943\nМесто: Витебская обл.\nСтатус: КРИТИЧНО",
    briefing:`3 августа 1943 года — ночь «Рельсовой войны». Тысячи партизан одновременно атакуют железные дороги по всей Беларуси. Координация — через шифрованные радиограммы. Расшифруй донесения о результатах операции до рассвета.`,
    mission:"Расшифруй 5 оперативных донесений штаба",
    ciphers:[
      { type:"morse", typeLabel:"АЗБУКА МОРЗЕ", shift:0,
        task:"Расшифруй радиограмму. Буквы разделены -/, слова //",
        encrypted:"---/----/...-/-//--.-/----/.-.-/..-/-",
        answer:"324d91c47431ef6d9a3d33983c3ff54e023f6bc359870d0ba5e3fce44afe2e6a",
        hint:"-- = М, --- = О, ... = С, - = Т → МОСТ. --. = Г, --- = О, .-. = Р, .. = И, - = Т → ГОРИТ.",
        fact:"За одну ночь 3 августа 1943 партизаны взорвали более 40 000 рельсов, парализовав снабжение немцев.", points:120 },
      { type:"caesar", typeLabel:"ШИФР ЦЕЗАРЯ", shift:7,
        task:"Сдвиг 7. Одно слово:",
        encrypted:"ЦЪЩГ", answer:"f275f3dada670a7d7abdacfb2143475de1ea768123cd40111fb66d0d52ca74d8",
        hint:"Ц(20)−7=13=П. Ъ(28)−7=21=У. Щ(27)−7=20=Т. Г(4)−7+33=30=Ь. ПУТЬ!",
        fact:"Партизаны знали каждую тропу — это давало огромное преимущество в родных лесах.", points:130 },
      { type:"atbash", typeLabel:"ШИФР АТБАШ", shift:0,
        task:"Зеркальный шифр: первая буква алфавита↔последняя. Расшифруй слово:",
        encrypted:"РМОАЫ", answer:"06074d823df2801860e0d583c4c56927c9cf6f4255acced4541585f5123b3d50",
        hint:"Р(18)→33+1−18=16=О ✓. М(14)→33+1−14=20=Т ✓. О(16)→33+1−16=18=Р ✓. А(1)→33=Я? Нет — А(1)↔Я(33), значит А→Я, но здесь А зашифровано... О(16)↔П(17)? Нет. Р→О, М→Т, О→Р, А→Я? Проверь: Я(33)↔А(1). Д(5)↔Э(29)... нет. А(1)→Я ✓, стой — ответ ОТРЯД: О-Т-Р-Я-Д. Я=зеркало А ✓. Д(5)↔Э(29). Проверь: Ы(29)↔Д(5) ✓.",
        fact:"Партизанские отряды действовали автономно, но координировали атаки через штаб.", points:150 },
      { type:"num", typeLabel:"ЧИСЛОВОЙ КОД", shift:0,
        task:"Числовой код. А=1, Б=2... Расшифруй:",
        encrypted:"3-9-18-29-3", answer:"24e6357fad3c0e1a6a24349c4250d1ead3461a4ca8052433cbb0c95515e1b4db",
        hint:"3=В, 9=З, 18=Р, 29=Ы, 3=В → ВЗРЫВ! Алфавит: ...З=9, К=11, Л=13, М=14, Н=15, О=16, П=17, Р=18, С=19, Т=20... Ы=29.",
        fact:"Партизаны использовали взрывчатку, добытую из неразорвавшихся авиабомб и снарядов.", points:160 },
      { type:"morse", typeLabel:"АЗБУКА МОРЗЕ", shift:0,
        task:"Расшифруй радиограмму. Буквы разделены -/, слова //",
        encrypted:".---/.-.-/.--/--.//-...-/.-/...--/..-/-",
        answer:"dc08aae51e3d3771be3986a40366d64f63635afd050b71e187ea15857c65b291",
        hint:".-- = В, .-. = Р, .- = А, --. = Г → ВРАГ. -... = Б, . = Е, ...- = Ж, .. = И, - = Т → БЕЖИТ.",
        fact:"Рельсовая война снизила пропускную способность немецких дорог на 35–40%, срывая переброску войск.", points:180 }
    ]
  },
  {
    id:3, title:"ОПЕРАЦИЯ БАГРАТИОН", subtitle:"Глава III",
    place:"БЕЛАРУСЬ · ИЮНЬ 1944", stamp:"⚔️",
    meta:"Дата: 23.06.1944\nМесто: Вся территория БССР\nСтатус: НАСТУПЛЕНИЕ",
    briefing:`23 июня 1944 года началась операция «Багратион» — крупнейшее наступление Второй мировой. Разведка сообщает о прорывах обороны. Расшифруй донесения с передовой и передай координаты штабу.`,
    mission:"Расшифруй 5 донесений разведки в ходе наступления",
    ciphers:[
      { type:"caesar", typeLabel:"ШИФР ЦЕЗАРЯ", shift:4,
        task:"Первое донесение о прорыве. Сдвиг 4:",
        encrypted:"ФЧЕИК", answer:"fec3d20ab54d04d7e2007c03c222a7204d732a1c75b18cf5730813d8007eb428",
        hint:"Ф(22)−4=18=Р. Ч(25)−4=21=У. Е(6)−4=2=Б. И(10)−4=6=Е. К(12)−4=8=Ж. РУБЕЖ!",
        fact:"«Багратион» — крупнейшее наступление войны. За 68 дней советские войска продвинулись на 600 км.", points:150 },
      { type:"morse", typeLabel:"АЗБУКА МОРЗЕ", shift:0,
        task:"Расшифруй радиограмму. Буквы разделены -/, слова //",
        encrypted:"----/...-/.---/----/-...-/----/...--/-..-/.-/-.",
        answer:"e4d2f03d6cacba6f4636f7a06005337f496fb959510878462cb55d1e688ab307",
        hint:"--- = О, ... = С, .-- = В, --- = О, -... = Б, --- = О, ...- = Ж, -.. = Д, . = Е, -. = Н → ОСВОБОЖДЕН!",
        fact:"3 июля 1944 года был освобождён Минск. 57 000 немецких солдат попали в «Минский котёл».", points:160 },
      { type:"atbash", typeLabel:"ШИФР АТБАШ", shift:0,
        task:"Зеркальный шифр. Расшифруй донесение о прорыве:",
        encrypted:"ПОРОДЭ", answer:"3c52700fe62c8bff58582f5a574ddc38f0a83f05b7220763744bb61bc933b64d",
        hint:"П(17)→33+1−17=17=П? Нет — П↔Р: П(17), зеркало 34−17=17? Алфавит 33: 34−17=17=П — сам себе? Нет. А(1)↔Я(33), Б(2)↔Ю(32)... П(17)↔О(17)? Считай: 33−17+1=17. Хм. Попробуй: pos=17, зеркало=33−17+1=17=П. А зеркало П — тоже П! Значит П↔П. О(16)↔П(17)? Нет — О(16), зеркало=33−16+1=18=Р ✓. Р(18)↔О(16) ✓. О(16)↔Р(18). Р↔О, О↔Р, Д(5)↔Э(29). Э↔Д. В(3)↔Ь(31)? Нет...",
        fact:"Операция «Багратион» завершилась полным освобождением Беларуси в августе 1944 года.", points:200 },
      { type:"num", typeLabel:"ЧИСЛОВОЙ КОД", shift:0,
        task:"Числовой код — название освобождённого города:",
        encrypted:"14-10-15-19-12", answer:"e6f182a0288b446b693099008c4747ce928497399ea20a4c89dfef0be894662c",
        hint:"14=М, 10=И, 15=Н, 19=С, 12=К → МИНСК! Алфавит: ...И=10, Й=11, К=12, Л=13, М=14, Н=15, О=16, П=17, Р=18, С=19...",
        fact:"Минск был оккупирован 28 июня 1941 года и освобождён 3 июля 1944 — почти ровно 3 года спустя.", points:180 },
      { type:"caesar", typeLabel:"ШИФР ЦЕЗАРЯ", shift:9,
        task:"Финальное донесение главы. Сдвиг 9:",
        encrypted:"ШЧЙНМИ", answer:"3872ed95b70ee6ebffbf1715e72742e00a4cba16dd7690862a993c4e0d9f8265",
        hint:"Ш(24)−9=15=П. Ч(25)−9=16=О. Й(10)−9=1=А? Нет — Б(2)+9=11=Й, значит Й→Б. Н(15)−9=6=Е. М(14)−9=5=Д. И(10)−9=1=А. ПОБЕДА!",
        fact:"«Багратион» уничтожил 17 дивизий противника — самое сокрушительное поражение Германии в войне.", points:220 }
    ]
  },
  {
    id:4, title:"ПОСЛЕДНИЙ ШИФР", subtitle:"Глава IV",
    place:"БЕРЛИН · МАЙ 1945", stamp:"🚩",
    meta:"Дата: 09.05.1945\nМесто: Берлин\nСтатус: ПОБЕДА",
    briefing:`9 мая 1945 года. Берлин пал. Война в Европе окончена. Последние донесения — слова солдат, которые дошли до конца. Расшифруй их — твоя миссия завершена.`,
    mission:"Расшифруй 5 последних донесений Победы",
    ciphers:[
      { type:"morse", typeLabel:"АЗБУКА МОРЗЕ", shift:0,
        task:"Расшифруй радиограмму. Буквы разделены -/, слова //",
        encrypted:".--/--/.--/-.--/.-//--.-/----/--/----/.--",
        answer:"37044ecc4bc515eb47200f6ba5a8ebc23489bfd594929188f1dcb0128c4607f9",
        hint:".- = А, - = Т, .- = А, -.- = К, .- = А → АТАКА. --. = Г, --- = О, - = Т, --- = О, .-- = В → ГОТОВ.",
        fact:"Штурм Берлина начался 16 апреля и завершился 2 мая 1945. В нём участвовали более 2,5 млн солдат.", points:200 },
      { type:"caesar", typeLabel:"ШИФР ЦЕЗАРЯ", shift:11,
        task:"Донесение из Рейхстага. Сдвиг 11:",
        encrypted:"ЛПЫЦУШ", answer:"06b21234e80f4cbe0bbcca7195551e94577a26f59f43bb4e78ea22aa3804b525",
        hint:"Б(2)+11=13=Л ✓. Е(6)+11=17=П ✓. Р(18)+11=29=Ы ✓. Л(13)+11=24=Ц ✓. И(10)+11=21=У ✓. Н(15)+11=26=Ш ✓. Значит читай наоборот: Л→Б, П→Е, Ы→Р, Ц→Л, У→И, Ш→Н. БЕРЛИН!",
        fact:"Красное Знамя водружено над Рейхстагом 1 мая 1945 года советскими солдатами Егоровым и Кантарией.", points:220 },
      { type:"atbash", typeLabel:"ШИФР АТБАШ", shift:0,
        task:"Последний зеркальный шифр войны:",
        encrypted:"НУЯЭЯ", answer:"9890080953fe693654e3db2bece9ddc1e28e86659ece82fd3a44e9904809a94f",
        hint:"Н(15)→34−15=19=С ✓. У(21)→34−21=13=Л ✓. Я(33)→34−33=1=А ✓. Э(31)→34−31=3=В ✓. Я(33)→34−33=1=А ✓. СЛАВА!",
        fact:"«Слава» — первое слово, которое кричали советские солдаты, узнав о капитуляции Германии.", points:250 },
      { type:"num", typeLabel:"ЧИСЛОВОЙ КОД", shift:0,
        task:"Последний числовой код — самое долгожданное слово:",
        encrypted:"14-10-18", answer:"0dd0a827bdd580e9eaa343e55ae702740b9f2346d8b6699c5a8669ea0b64571f",
        hint:"14=М, 10=И, 18=Р → МИР. Алфавит: М=14, И=10, Р=18. Всего три числа — три буквы, три года войны.",
        fact:"9 мая 1945 года — День Победы. Беларусь потеряла каждого третьего жителя. Мы помним.", points:280 },
      { type:"morse", typeLabel:"АЗБУКА МОРЗЕ", shift:0,
        task:"Расшифруй радиограмму. Буквы разделены -/, слова //",
        encrypted:".---/----/.----/-.-/.-//----/-.--/----/-.-/---.-/.-/-.-/.-",
        answer:"d5473eac88f77d42d6202029dd2d341434f791a78879b40285516d309fe37b48",
        hint:".-- = В, --- = О, .--- = Й, -. = Н, .- = А → ВОЙНА. --- = О, -.- = К, --- = О, -. = Н, ---. = Ч, . = Е, -. = Н, .- = А → ОКОНЧЕНА.",
        fact:"8 мая 1945 в Берлине подписан акт о капитуляции. 9 мая стало Днём Победы для советского народа.", points:300 }
    ]
  },
  {
    id:5, title:"ЗНАЙ СВОЮ ЗЕМЛЮ", subtitle:"Глава V",
    place:"БЕЛАРУСЬ · ИСТОРИЯ", stamp:"🗺",
    meta:"Тип: ИСТОРИЯ И ГЕОГРАФИЯ\nТема: Беларусь\nСтатус: ПРОВЕРКА ЗНАНИЙ",
    briefing:`Разведчик должен знать свою землю как себя. Города, реки, даты, имена. Здесь нет шифров — только знание. Ответь на вопросы о Беларуси и Великой Отечественной войне. Пять заданий — пять проверок.`,
    mission:"Выполни 5 заданий по истории и географии Беларуси",
    ciphers:[
      { type:"anagram", typeLabel:"АНАГРАММА",
        task:"Переставь буквы чтобы получить название белорусского города — место крупнейшего партизанского движения:",
        encrypted:"НИСКМ", answer:"e6f182a0288b446b693099008c4747ce928497399ea20a4c89dfef0be894662c",
        hint:"Столица Беларуси. В ней находится Площадь Победы с обелиском.",
        fact:"Минск — один из немногих городов-героев СССР. Был полностью разрушен во время оккупации и отстроен заново.", points:150 },
      { type:"math", typeLabel:"МАТЕМАТИКА",
        task:"Партизанский отряд из 90 человек разделился на 3 группы поровну. Потом из каждой группы ушло по 5 человек на задание. Сколько осталось в каждой группе?",
        encrypted:"90 ÷ 3 − 5 = ?", answer:"b7a56873cd771f2c446d369b649430b65a756ba278ff97ec81bb6f55b2e73569",
        hint:"90 делим на 3 = 30 человек в каждой группе. Потом 30 − 5 = 25. В каждой группе осталось 25 человек.",
        fact:"Белорусские партизаны к 1944 году насчитывали более 370 000 человек — крупнейшее движение в Европе.", points:170 },
      { type:"photo", typeLabel:"УГАДАЙ ПО ОПИСАНИЮ",
        task:"Это место — символ стойкости и героизма. Здесь 1200 советских солдат держались против 45 000 немцев в первые дни войны. Крепость стала символом несгибаемости. Назови это место (одно слово):",
        encrypted:"🏰",
        image:"<img src=\"data:image/svg+xml,%3Csvg viewBox='0 0 280 160' xmlns='http://www.w3.org/2000/svg'%3E %3Crect width='280' height='160' fill='%231a1208'/%3E %3Crect width='280' height='80' fill='%231a0a00'/%3E %3Cellipse cx='140' cy='80' rx='140' ry='40' fill='%233d1500' opacity='.8'/%3E %3Cellipse cx='140' cy='82' rx='30' ry='12' fill='%23cc4400' opacity='.6'/%3E %3Crect x='20' y='80' width='240' height='60' fill='%232a1f0a'/%3E %3Crect x='15' y='55' width='35' height='90' fill='%23241a08'/%3E %3Cpolygon points='15,55 32,38 50,55' fill='%231a1208'/%3E %3Crect x='230' y='55' width='35' height='90' fill='%23241a08'/%3E %3Cpolygon points='230,55 247,38 265,55' fill='%231a1208'/%3E %3Crect x='110' y='45' width='60' height='95' fill='%232e2510'/%3E %3Cpolygon points='110,45 140,25 170,45' fill='%23221c0c'/%3E %3Crect x='125' y='60' width='12' height='16' rx='6' fill='%230a0804'/%3E %3Crect x='143' y='60' width='12' height='16' rx='6' fill='%230a0804'/%3E %3Crect x='125' y='85' width='12' height='16' rx='1' fill='%230a0804'/%3E %3Crect x='143' y='85' width='12' height='16' rx='1' fill='%230a0804'/%3E %3Cpath d='M128,140 L128,115 Q140,105 152,115 L152,140Z' fill='%230a0804'/%3E %3Cpolygon points='140,28 142,34 148,34 143,38 145,44 140,40 135,44 137,38 132,34 138,34' fill='%23cc2200' opacity='.9'/%3E %3Cpath d='M50,75 L55,68 L52,62 L58,55' stroke='%233a2810' stroke-width='1.5' fill='none' opacity='.7'/%3E %3Cpath d='M220,80 L225,70 L222,62' stroke='%233a2810' stroke-width='1.5' fill='none' opacity='.7'/%3E %3Cellipse cx='60' cy='155' rx='25' ry='8' fill='%23cc4400' opacity='.3'/%3E %3Cellipse cx='220' cy='155' rx='25' ry='8' fill='%23cc4400' opacity='.3'/%3E %3Ctext x='140' y='152' text-anchor='middle' font-family='serif' font-size='9' fill='%23e8a060' opacity='.8'%3E22 ИЮНЯ 1941%3C/text%3E %3C/svg%3E\" style=\"width:100%;border-radius:4px\">",
        answer:"1f357f38d0a3225db20815563c70bfe154832f7e0cd2cb79edde8a1e5038a85b",
        hint:"Западный форпост СССР. Её гарнизон дрался до последнего. Город на реке Буг.",
        fact:"Брестская крепость держалась почти месяц. На стене бойцы написали: «Я умираю, но не сдаюсь! Прощай, Родина. 20.VII.41»", points:180 },
      { type:"map", typeLabel:"НАЙДИ НА КАРТЕ",
        task:"Покажи на карте Беларуси, где находится Брестская крепость. Тапни по нужному городу:",
        encrypted:"🗺",
        answer:"1f357f38d0a3225db20815563c70bfe154832f7e0cd2cb79edde8a1e5038a85b",
        mapCity:"БРЕСТ",
        hint:"Крайний юго-запад Беларуси, на границе с Польшей, у слияния рек Буг и Мухавец.",
        fact:"Брест основан в 1019 году. Во время войны город был оккупирован в первый же день — 22 июня 1941.", points:200 },
      { type:"anagram", typeLabel:"АНАГРАММА",
        task:"Тапни на буквы в правильном порядке — составь слово, которым называют человека, совершившего подвиг ради Родины:",
        encrypted:"ЙРЕОГ", answer:"469a02b8953ccf4cded9018fdfad65dad3b5d005e3c277b3d6d644fffaa52029",
        hint:"5 букв. Это звание присваивалось самым храбрым защитникам Родины. Начинается на Г.",
        fact:"Звание Героя Советского Союза за оборону Брестской крепости получили 12 человек. Крепость сражалась почти месяц.", points:220 }
    ]
  },
  {
    id:6, title:"ДОРОГА К ПОБЕДЕ", subtitle:"Глава VI",
    place:"БЕЛАРУСЬ · ПАМЯТЬ", stamp:"🌟",
    meta:"Тип: ЭРУДИЦИЯ\nТема: ВОВ и Беларусь\nСтатус: ФИНАЛЬНЫЙ ЭКЗАМЕН",
    briefing:`Последняя глава. Здесь собраны самые важные знания о войне. Математика разведчика, тайные места, зашифрованные имена. Докажи что ты достоин звания Маршала Победы.`,
    mission:"Пройди финальный экзамен — 5 заданий разного типа",
    ciphers:[
      { type:"math", typeLabel:"МАТЕМАТИКА",
        task:"Операция «Багратион» началась 23 июня 1944. Минск освобождён 3 июля 1944. Сколько дней прошло от начала операции до освобождения Минска?",
        encrypted:"23 июня → 3 июля", answer:"4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5",
        hint:"Июнь: 23, 24, 25, 26, 27, 28, 29, 30 — 7 дней. Июль: 1, 2, 3 — 3 дня. Итого: 10 дней.",
        fact:"За 10 дней операции «Багратион» советские войска окружили и разгромили группу армий «Центр».", points:160 },
      { type:"photo", typeLabel:"УГАДАЙ ПО ОПИСАНИЮ",
        task:"Этот монумент — главный символ Победы в Беларуси. Высота обелиска — 38 метров, увенчан орденом Победы. Находится в столице на главном проспекте. Как называется эта площадь? (два слова):",
        encrypted:"🏛",
        image:"<img src=\"data:image/svg+xml,%3Csvg viewBox='0 0 280 180' xmlns='http://www.w3.org/2000/svg'%3E %3Crect width='280' height='180' fill='%230d0b08'/%3E %3Crect width='280' height='130' fill='%23080604'/%3E %3Ccircle cx='30' cy='20' r='1' fill='%23ffe033' opacity='.6'/%3E %3Ccircle cx='80' cy='15' r='1.5' fill='%23fff' opacity='.5'/%3E %3Ccircle cx='150' cy='10' r='1' fill='%23fff' opacity='.7'/%3E %3Ccircle cx='200' cy='25' r='1' fill='%23ffe033' opacity='.5'/%3E %3Ccircle cx='250' cy='12' r='1.5' fill='%23fff' opacity='.6'/%3E %3Ccircle cx='45' cy='40' r='1' fill='%23fff' opacity='.4'/%3E %3Ccircle cx='240' cy='35' r='1' fill='%23ffe033' opacity='.5'/%3E %3Cellipse cx='140' cy='130' rx='100' ry='30' fill='%23cc4400' opacity='.15'/%3E %3Crect x='110' y='115' width='60' height='55' rx='2' fill='%231e1810'/%3E %3Crect x='105' y='112' width='70' height='8' rx='1' fill='%232a2318'/%3E %3Cpolygon points='133,20 147,20 150,115 130,115' fill='%232a2318'/%3E %3Cpolygon points='136,18 144,18 143,22 137,22' fill='%23332b1c'/%3E %3Cpolygon points='140,8 142,15 149,15 143,19 145,26 140,22 135,26 137,19 131,15 138,15' fill='%23ffe033' opacity='.95'/%3E %3Cellipse cx='140' cy='100' rx='18' ry='5' fill='none' stroke='%23e8a060' stroke-width='1.5' opacity='.7'/%3E %3Crect x='112' y='120' width='56' height='25' rx='1' fill='%23241e0c'/%3E %3Cellipse cx='125' cy='127' rx='5' ry='7' fill='%231a1608'/%3E %3Cellipse cx='140' cy='126' rx='5' ry='8' fill='%231a1608'/%3E %3Cellipse cx='155' cy='127' rx='5' ry='7' fill='%231a1608'/%3E %3Cellipse cx='140' cy='168' rx='20' ry='6' fill='%23cc4400' opacity='.5'/%3E %3Cpath d='M133,168 C132,158 136,153 140,148 C144,153 148,158 147,168Z' fill='%23ff6600' opacity='.7'/%3E %3Cpath d='M136,168 C135,161 138,157 140,153 C142,157 145,161 144,168Z' fill='%23ffaa00' opacity='.8'/%3E %3Ctext x='140' y='177' text-anchor='middle' font-family='serif' font-size='8' fill='%23e8a060' opacity='.9'%3EМИНСК%3C/text%3E %3C/svg%3E\" style=\"width:100%;border-radius:4px\">",
        answer:"011942ffde9054ddd74029d5914c259e8d658a850fa296d5d083a1e38fcadbd9",
        hint:"Две слова. Второе слово — главный итог войны. Площадь находится в центре Минска.",
        fact:"Площадь Победы в Минске заложена в 1954 году. Обелиск высотой 38 м с орденом Победы виден со всего проспекта.", points:190 },
      { type:"map", typeLabel:"НАЙДИ НА КАРТЕ",
        task:"Покажи на карте, где находится город Витебск — место крупнейшей операции Рельсовой войны:",
        encrypted:"🗺",
        answer:"02502539349de7bcea28618412d857217fbf10a5533504d3af7361cbe66b66c1",
        mapCity:"ВИТЕБСК",
        hint:"Северо-восток Беларуси, на реке Западная Двина. Четвёртый по величине город страны.",
        fact:"Витебск оккупирован 11 июля 1941 и освобождён 26 июня 1944 в ходе операции «Багратион».", points:200 },
      { type:"anagram", typeLabel:"АНАГРАММА",
        task:"Переставь буквы чтобы получить название главной военной операции по освобождению Беларуси в 1944 году:",
        encrypted:"АНИТАБОРГ", answer:"32076f76c7be7c437b41289f10c44cce9c107523aee32428024297703302ae2d",
        hint:"9 букв. Назван в честь русского полководца Отечественной войны 1812 года.",
        fact:"Операция «Багратион» (23 июня — 19 августа 1944) — крупнейшая наступательная операция Второй мировой войны.", points:230 },
      { type:"math", typeLabel:"МАТЕМАТИКА",
        task:"Беларусь потеряла в войне каждого 3-го жителя. В 1941 году население БССР составляло около 9 миллионов человек. Сколько приблизительно человек погибло? (ответ в миллионах, одна цифра):",
        encrypted:"9 000 000 ÷ 3 = ?", answer:"4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
        hint:"9 разделить на 3 равно 3. Три миллиона человек — каждый третий житель Беларуси.",
        fact:"Беларусь потеряла 3 миллиона человек — больше, чем любая другая советская республика в пересчёте на долю населения.", points:250 }
    ]
  }
];

const ANSWER_MAP = {
"469a02b8953ccf4cded9018fdfad65dad3b5d005e3c277b3d6d644fffaa52029":"ГЕРОЙ",
"b7a56873cd771f2c446d369b649430b65a756ba278ff97ec81bb6f55b2e73569":"25","f9e05f164c5a0d5f568e20655d6a3460a1b89be8ae2d039432b7f591269c56d7": "ГОРОД", "9f105caf00cb3a6702aa88267e5efeac19d5ed77d966999d103ad3c02e09f622": "ХЛЕБ ДОРОГ", "f4f847839b6e46ff3047b6ca7622555097aa47f3ee69e4f935530f4faa93d18c": "СКЛАД", "f44ea8d11615d997a61d3b8b0b80d8b5ea76d2dbb60c17fa162ede87abbe7bf7": "СВЯЗЬ", "20239dec89076cf07026693b3e5d5efc14bd7a26c1cd49e2bb77deb90cf8a00f": "ЯВКА", "324d91c47431ef6d9a3d33983c3ff54e023f6bc359870d0ba5e3fce44afe2e6a": "МОСТ ГОРИТ", "f275f3dada670a7d7abdacfb2143475de1ea768123cd40111fb66d0d52ca74d8": "ПУТЬ", "06074d823df2801860e0d583c4c56927c9cf6f4255acced4541585f5123b3d50": "ОТРЯД", "24e6357fad3c0e1a6a24349c4250d1ead3461a4ca8052433cbb0c95515e1b4db": "ВЗРЫВ", "dc08aae51e3d3771be3986a40366d64f63635afd050b71e187ea15857c65b291": "ВРАГ БЕЖИТ", "fec3d20ab54d04d7e2007c03c222a7204d732a1c75b18cf5730813d8007eb428": "РУБЕЖ", "e4d2f03d6cacba6f4636f7a06005337f496fb959510878462cb55d1e688ab307": "ОСВОБОЖДЕН", "3c52700fe62c8bff58582f5a574ddc38f0a83f05b7220763744bb61bc933b64d": "ПРОРЫВ", "e6f182a0288b446b693099008c4747ce928497399ea20a4c89dfef0be894662c": "МИНСК", "3872ed95b70ee6ebffbf1715e72742e00a4cba16dd7690862a993c4e0d9f8265": "ПОБЕДА", "37044ecc4bc515eb47200f6ba5a8ebc23489bfd594929188f1dcb0128c4607f9": "АТАКА ГОТОВ", "06b21234e80f4cbe0bbcca7195551e94577a26f59f43bb4e78ea22aa3804b525": "БЕРЛИН", "9890080953fe693654e3db2bece9ddc1e28e86659ece82fd3a44e9904809a94f": "СЛАВА", "0dd0a827bdd580e9eaa343e55ae702740b9f2346d8b6699c5a8669ea0b64571f": "МИР", "d5473eac88f77d42d6202029dd2d341434f791a78879b40285516d309fe37b48": "ВОЙНА ОКОНЧЕНА", "c6f3ac57944a531490cd39902d0f777715fd005efac9a30622d5f5205e7f6894": "33", "1f357f38d0a3225db20815563c70bfe154832f7e0cd2cb79edde8a1e5038a85b": "БРЕСТ", "4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5": "10", "011942ffde9054ddd74029d5914c259e8d658a850fa296d5d083a1e38fcadbd9": "ПЛОЩАДЬ ПОБЕДЫ", "02502539349de7bcea28618412d857217fbf10a5533504d3af7361cbe66b66c1": "ВИТЕБСК", "32076f76c7be7c437b41289f10c44cce9c107523aee32428024297703302ae2d": "БАГРАТИОН", "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce": "3", "ee28ccd9c40886ef8f32df5d06a38b87a2742942250d9bc525585f47cf132c8c": "ГАРНИЗОН"};
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
  data.completed  = Object.keys(state.completedChapters).length;
  data.total_score = state.totalScore;
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
        if (typeof result.db_score === 'number' && result.db_score < state.totalScore) {
          state.totalScore = result.db_score;
          state.completedChapters = {};
          for (let i = 1; i <= (result.db_completed||0); i++) state.completedChapters[i] = true;
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
      completed: r.completed, role: r.role || 'player'
    }));
  }

  // Синхронизируем прогресс с БД
  if (tgInitMe && myUid) {
    const dbScore       = tgInitMe.score        || 0;
    const dbCompleted   = tgInitMe.completed    || 0;
    const dbGameOver    = tgInitMe.game_over    || false;
    const dbRestartMode = tgInitMe.restart_mode || null;
    // admin_mode: true = режим администратора, false или отсутствует = режим игрока
    // ВАЖНО: явно устанавливаем, не берём из localStorage
    const dbAdminMode = tgInitMe.admin_mode === true;
    state.adminMode = dbAdminMode;

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
    } else if (dbScore >= state.totalScore) {
      state.totalScore = dbScore;
      if (dbCompleted > Object.keys(state.completedChapters).length) {
        state.completedChapters = {};
        for (let i = 1; i <= dbCompleted; i++) {
          state.completedChapters[i] = true;
        }
      }
      if (dbGameOver) state.gameOver = true;
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
      state.adminMode  = false;
      state._noptsMode = false;
    }
  } catch(e) {}
}

function saveState() {
  try { localStorage.setItem(storageKey(), JSON.stringify(state)); } catch(e) {}
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
    const isAdmin = tgUser && tgUser.id === 516406248;
    const isDone  = !!state.completedChapters[ch.id];
    const serverAllows = !tgOpenChapters || tgOpenChapters.has(ch.id);
    const prevDone = i === 0 || !!state.completedChapters[CHAPTERS[i-1].id] || state.adminMode;
    const isLocked = !isAdmin && !(serverAllows && prevDone);
    if (isDone) completedCount++;

    const card = document.createElement('div');
    card.className = 'chapter-card' + (isLocked?' locked':'') + (isDone?' completed':'');

    // Иконки типов заданий
    const typeIcons = {'caesar':'🔐','morse':'📡','atbash':'🪞','num':'🔢','anagram':'🔤','math':'➗','photo':'🖼','map':'🗺'};
    const uniqueTypes = [...new Set(ch.ciphers.map(c=>c.type))];
    const tags = uniqueTypes.map(t=>`<span class="ch-tag">${typeIcons[t]||'❓'} ${ch.ciphers.find(c=>c.type===t).typeLabel}</span>`).join('');

    // Статус
    let statusText, badgeIcon;
    if (isDone && state.chapterScores[ch.id] > 0) { statusText='✅ ЗАВЕРШЕНО'; badgeIcon='✅'; }
    else if (isDone) { statusText='💔 ПРОВАЛЕНО'; badgeIcon='💔'; }
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
    const canRepeat = state.adminMode || state.retryPenalty || state._noptsMode;
    const canPlay = !isLocked && (!isDone || isAdmin || canRepeat);
    if (canPlay) card.onclick = () => {
      if (isDone && !state.adminMode) {
        // Перепрохождение — очищаем только если явный режим или it is admin
        if (isAdmin) {
          delete state.completedChapters[ch.id];
          delete state.chapterScores[ch.id];
          saveState();
        }
        // retryPenalty и noptsMode — finishChapter сам не начислит очки
      }
      showBriefing(i);
    };
    else if (isDone) card.style.cursor = 'default';
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
  box.setAttribute('data-num', String(state.cipherIdx + 1).padStart(3,'0'));
  box.style.position = 'relative';

  if (cipher.type === 'morse') {
    box.innerHTML = '';
    animateMorse(box, cipher.encrypted);
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

  // Сброс ввода
  const inp = document.getElementById('cipher-input');
  inp.value = ''; inp.className = 'cipher-input'; inp.disabled = false;
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
  if (cipher.type !== 'map' && cipher.type !== 'anagram') inp.focus();
}

function renderLives() {
  const el = document.getElementById('cipher-attempts-label');
  if (!el) return;
  const isAdmin = tgUser && tgUser.id === 516406248;
  if (state.adminMode || isAdmin) {
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
  if (state.retryPenalty) factor = Math.max(0.10, factor * 0.7);
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
  const cipher = CHAPTERS[state.chapter].ciphers[state.cipherIdx];
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
    const pts      = calcPoints(cipher, elapsed);
    state.chapterScore += pts;
    saveState();
    stopTimer();
    setTimeout(() => showSuccess(cipher, pts, elapsed), 400);

  } else {
    // ── НЕПРАВИЛЬНО ──
    inp.className = 'cipher-input wrong';
    setTimeout(() => inp.className = 'cipher-input', 500);
    state.streak = 0;
    state._chapterErrors = (state._chapterErrors || 0) + 1;
    state.lives--;
    saveState();
    animateLifeLoss();

    if (state.lives <= 0) {
      if ((tgUser && tgUser.id === 516406248) || state.adminMode) {
        // Админ — восстанавливаем жизни
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
  const isAdmin = (tgUser && tgUser.id === 516406248) || state.adminMode;
  if (!isAdmin && state.lives > 1) {
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
  if (!state.adminMode) sendResultToBot({
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
    max: ch.ciphers.reduce((s,c) => s+c.points, 0), failed: true
  };
  state.completedChapters[ch.id] = true;
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

  if (!state.adminMode) sendResultToBot({
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
  const retryBtn = document.getElementById('fail-retry-btn');
  const retryInfo = document.getElementById('fail-retry-info');
  if (retryBtn) { retryBtn.style.display = 'block'; retryBtn.onclick = () => retryChapter(state.chapter); }
  if (retryInfo) retryInfo.style.display = 'block';
  showScreen('s-chapter-fail');
}

// ═══════════════════════════════════════════════════════
//  ПОВТОРНАЯ ПОПЫТКА
// ═══════════════════════════════════════════════════════
function retryChapter(idx) {
  const ch = CHAPTERS[idx];
  delete state.completedChapters[ch.id];
  state.totalScore = Math.max(0, state.totalScore - (state.chapterScores[ch.id] || 0));
  delete state.chapterScores[ch.id];
  state.retryPenalty = true;
  state.streak = 0;
  saveState();
  showBriefing(idx);
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

  sendResultToBot({
    type: 'game_complete',
    total_score: state.totalScore,
    rank: rank,
    pct: pct,
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
  const isAdmin = tgUser && tgUser.id === 516406248;
  if (isAdmin) {
    // Для админа — сброс своего прогресса разрешён
    if (confirm('Сбросить свой прогресс? (для повторного тестирования)')) {
      try { localStorage.removeItem(storageKey()); } catch(e) {}
      state = DEFAULT_STATE();
      saveState();
      switchTab('chapters');
    }
    return;
  }
  if (getTgUserId()) {
    // Обычный пользователь — сброс запрещён
    alert('Прогресс сохранён в системе и не может быть удалён.');
    return;
  }
  // Гость
  if (confirm('Сбросить прогресс?')) {
    try { localStorage.removeItem(storageKey()); } catch(e) {}
    state = DEFAULT_STATE();
    switchTab('chapters');
  }
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

  // Шапка
  const header = `<div style="padding:16px 16px 8px;display:flex;align-items:center;justify-content:space-between">
    <div>
      <div style="font-family:var(--head);font-size:var(--fs-xl);color:var(--accent)">РЕЙТИНГ</div>
      <div style="font-size:10px;color:var(--muted);margin-top:2px">👥 ${total || 0} участников · <span style="color:rgba(255,224,51,.5)">👆 нажми на себя для статистики</span></div>
    </div>
    <button onclick="switchTab('leaderboard')"
      style="background:rgba(255,224,51,.1);border:1px solid rgba(255,224,51,.2);
      color:var(--accent);padding:6px 12px;border-radius:4px;font-family:var(--head);
      font-size:var(--fs-xs);cursor:pointer;letter-spacing:.06em">🔄 ОБНОВИТЬ</button>
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
      <button onclick="showMyStats()" style="width:100%;margin-bottom:10px;background:rgba(255,224,51,.08);border:1px solid rgba(255,224,51,.2);color:var(--accent);padding:11px;font-family:var(--head);font-size:var(--fs-sm);font-weight:600;border-radius:4px;cursor:pointer;letter-spacing:.08em">📊 ДЕТАЛЬНАЯ СТАТИСТИКА</button>
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

  list.innerHTML = header + rows + myPos;
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
    <button class="btn-back" onclick="confirmReset()" style="width:100%;opacity:.4;margin-top:8px">🗑 Сбросить прогресс</button>`;
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
      if (tgUser && tgUser.id === 516406248) {
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
      if (tgUser && tgUser.id === 516406248) {
        state.lives = 5; saveState(); renderLives();
        document.getElementById('map-hint-text').textContent = '⚡ Режим админа: жизни восстановлены';
      } else { setTimeout(() => failChapter(), 1200); }
    } else { renderLives(); }
  }
}

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
loadState();
mergeBotLeaderboard();

async function fetchAndApplyState() {
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
    if (typeof data.score === 'number' && data.score < state.totalScore) {
      state.totalScore = data.score;
      state.completedChapters = {};
      for (let i = 1; i <= (data.completed||0); i++) state.completedChapters[i] = true;
      state.chapterScores = {};
      state.gameOver = data.game_over || false;
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
