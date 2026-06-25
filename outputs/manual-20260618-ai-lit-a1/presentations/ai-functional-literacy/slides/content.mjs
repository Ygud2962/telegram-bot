const C = {
  ink: "#172021",
  paper: "#F6F0E3",
  panel: "#FBF8EF",
  teal: "#116466",
  coral: "#D85C42",
  mustard: "#E3B448",
  slate: "#5E7480",
  paleTeal: "#DDEDE6",
  paleCoral: "#F4D8CF",
  paleMustard: "#F3E4B8",
  muted: "#65706D",
  line: "#D8CDB8",
  white: "#FFFFFF",
};

const slides = [
  {
    kicker: "ТЕЗИС",
    title: "ИИ развивает грамотность, когда ученик проверяет и объясняет результат",
    subtitle: "Выступление для учителей информатики · 20 минут",
    type: "cover",
  },
  {
    kicker: "КОНТЕКСТ",
    title: "Когда ответ может быть сгенерирован, учебная цель смещается к контролю результата",
    type: "comparison",
  },
  {
    kicker: "ОПРЕДЕЛЕНИЕ",
    title: "Функциональная грамотность в информатике собирается из прикладных цифровых действий",
    type: "competency",
  },
  {
    kicker: "ГРАНИЦЫ",
    title: "ИИ полезен как черновик и собеседник, но не как источник истины",
    type: "limits",
  },
  {
    kicker: "МОДЕЛЬ УРОКА",
    title: "Рабочий урок с ИИ строится как цикл постановки, проверки и улучшения",
    type: "cycle",
  },
  {
    kicker: "СЦЕНАРИИ",
    title: "Четыре формата заданий закрывают основные линии функциональной грамотности",
    type: "scenarios",
  },
  {
    kicker: "ПРИМЕР 1",
    title: "Проверка спорного утверждения учит не доверять первому цифровому ответу",
    type: "infoExample",
  },
  {
    kicker: "ПРИМЕР 2",
    title: "В программировании ИИ лучше использовать для тестов и отладки, а не для готового кода",
    type: "codeExample",
  },
  {
    kicker: "ОЦЕНИВАНИЕ",
    title: "Оценивать нужно процесс работы с ИИ, иначе инструмент подменит мышление",
    type: "rubric",
  },
  {
    kicker: "БЕЗОПАСНОСТЬ",
    title: "Правила использования ИИ должны быть ясными до начала задания",
    type: "safety",
  },
  {
    kicker: "ШАБЛОН",
    title: "Хороший промпт похож на короткое техническое задание",
    type: "prompt",
  },
  {
    kicker: "СТАРТ",
    title: "Начать можно с одного упражнения на 10-15 минут уже на следующем уроке",
    type: "close",
  },
];

function addText(ctx, slide, text, x, y, w, h, options = {}) {
  return ctx.addText(slide, {
    text,
    x,
    y,
    width: w,
    height: h,
    fontSize: options.size ?? 22,
    color: options.color ?? C.ink,
    bold: options.bold ?? false,
    typeface: options.face ?? (options.title ? ctx.fonts.title : ctx.fonts.body),
    align: options.align ?? "left",
    valign: options.valign ?? "top",
    fill: options.fill ?? "#00000000",
    line: options.line ?? ctx.line("#00000000", 0),
    insets: options.insets ?? { left: 0, right: 0, top: 0, bottom: 0 },
    name: options.name,
  });
}

function rect(ctx, slide, x, y, w, h, fill, line = "#00000000", lineWidth = 0, name) {
  return ctx.addShape(slide, {
    x,
    y,
    width: w,
    height: h,
    fill,
    line: ctx.line(line, lineWidth),
    name,
  });
}

function rule(ctx, slide, x, y, w, color = C.ink, h = 2) {
  rect(ctx, slide, x, y, w, h, color);
}

function base(ctx, slide, data, index, dark = false) {
  rect(ctx, slide, 0, 0, ctx.W, ctx.H, dark ? C.ink : C.paper);
  rect(ctx, slide, 0, 0, 22, ctx.H, dark ? C.coral : C.teal);
  rect(ctx, slide, 22, 0, 5, ctx.H, dark ? C.mustard : C.coral);
  const textColor = dark ? C.paper : C.ink;
  rect(ctx, slide, 64, 42, 9, 9, dark ? C.mustard : C.coral, "#00000000", 0, "kicker-marker");
  addText(ctx, slide, data.kicker, 84, 34, 220, 26, {
    size: 14,
    color: dark ? C.paleMustard : C.teal,
    bold: true,
    name: "kicker-label",
    valign: "middle",
  });
  addText(ctx, slide, data.title, 64, 70, 980, 94, {
    size: 34,
    color: textColor,
    bold: true,
    title: true,
  });
  addText(ctx, slide, String(index + 1).padStart(2, "0"), 1158, 650, 46, 24, {
    size: 15,
    color: dark ? "#CDBF9F" : C.muted,
    align: "right",
  });
}

function panel(ctx, slide, x, y, w, h, fill = C.panel, accent = C.teal, label) {
  rect(ctx, slide, x, y, w, h, fill, C.line, 1);
  rect(ctx, slide, x, y, 7, h, accent);
  if (label) {
    addText(ctx, slide, label, x + 22, y + 18, w - 44, 28, { size: 19, bold: true, color: C.ink });
  }
}

function bulletList(ctx, slide, items, x, y, w, options = {}) {
  const gap = options.gap ?? 43;
  items.forEach((item, i) => {
    const yy = y + i * gap;
    rect(ctx, slide, x, yy + 8, 10, 10, options.dot ?? C.coral);
    addText(ctx, slide, item, x + 24, yy, w - 24, options.h ?? 34, {
      size: options.size ?? 20,
      color: options.color ?? C.ink,
    });
  });
}

function stage(ctx, slide, n, label, note, x, y, w, accent) {
  rect(ctx, slide, x, y, w, 120, C.panel, C.line, 1);
  rect(ctx, slide, x, y, w, 9, accent);
  addText(ctx, slide, String(n), x + 18, y + 24, 34, 34, {
    size: 24,
    color: accent,
    bold: true,
    align: "center",
  });
  addText(ctx, slide, label, x + 62, y + 18, w - 80, 31, { size: 20, bold: true });
  addText(ctx, slide, note, x + 62, y + 54, w - 80, 44, { size: 16, color: C.muted });
}

function slideCover(presentation, ctx, data) {
  const slide = presentation.slides.add();
  rect(ctx, slide, 0, 0, ctx.W, ctx.H, C.ink);
  rect(ctx, slide, 0, 0, 426, ctx.H, C.teal);
  rect(ctx, slide, 426, 0, 22, ctx.H, C.coral);
  rect(ctx, slide, 980, 0, 300, ctx.H, C.paper);
  addText(ctx, slide, "ИИ НА УРОКАХ ИНФОРМАТИКИ", 64, 52, 500, 28, { size: 16, color: C.paleMustard, bold: true });
  addText(ctx, slide, "Использование ИИ на уроках информатики как средство развития функциональной грамотности", 64, 116, 790, 235, {
    size: 47,
    color: C.paper,
    bold: true,
    title: true,
  });
  addText(ctx, slide, "20 минут · выступление для педагогов", 68, 372, 430, 32, { size: 23, color: "#E6DCC5" });
  const rails = [
    ["1", "Формулируем задачу"],
    ["2", "Проверяем результат"],
    ["3", "Объясняем решение"],
  ];
  rails.forEach((r, i) => {
    const y = 500 + i * 52;
    rect(ctx, slide, 68, y, 34, 34, i === 1 ? C.mustard : C.coral);
    addText(ctx, slide, r[0], 68, y + 4, 34, 24, { size: 17, color: C.ink, bold: true, align: "center" });
    addText(ctx, slide, r[1], 118, y + 2, 280, 30, { size: 21, color: C.paper, bold: true });
  });
  addText(ctx, slide, "Главная рамка", 1018, 78, 190, 26, { size: 15, color: C.teal, bold: true });
  addText(ctx, slide, "ИИ не заменяет учебное действие. Он делает видимыми вопрос, критерии, проверку и ответственность за итог.", 1018, 120, 198, 236, {
    size: 25,
    color: C.ink,
    bold: true,
    title: true,
  });
  rect(ctx, slide, 1018, 430, 164, 8, C.coral);
  addText(ctx, slide, "Функциональная грамотность = знание, примененное в ситуации", 1018, 466, 198, 86, { size: 20, color: C.muted });
  return slide;
}

function slideComparison(presentation, ctx, data, index) {
  const slide = presentation.slides.add();
  base(ctx, slide, data, index);
  const cols = [
    ["Было удобно оценивать", "правильный ответ", "термин", "готовую программу", "пересказ"],
    ["Стало важно видеть", "как поставлена задача", "как проверен ответ", "где найдена ошибка", "как объяснен выбор"],
    ["Роль учителя", "задает границы", "оценивает процесс", "учит проверке", "снимает магию с ИИ"],
  ];
  const accents = [C.slate, C.coral, C.teal];
  cols.forEach((col, i) => {
    const x = 78 + i * 382;
    panel(ctx, slide, x, 218, 330, 330, C.panel, accents[i], col[0]);
    bulletList(ctx, slide, col.slice(1), x + 25, 276, 280, { dot: accents[i], size: 20, gap: 50 });
  });
  rule(ctx, slide, 78, 594, 1078, C.ink, 2);
  addText(ctx, slide, "Вывод для урока: ученик должен показать не только итог, но и управление цифровым результатом.", 80, 612, 940, 38, {
    size: 23,
    bold: true,
    color: C.ink,
  });
  return slide;
}

function slideCompetency(presentation, ctx, data, index) {
  const slide = presentation.slides.add();
  base(ctx, slide, data, index);
  rect(ctx, slide, 488, 278, 300, 126, C.ink);
  addText(ctx, slide, "Функциональная\nграмотность", 510, 298, 256, 72, {
    size: 30,
    color: C.paper,
    bold: true,
    align: "center",
    valign: "middle",
    title: true,
  });
  const nodes = [
    ["Информационная", "найти, сравнить, проверить источник", 94, 238, C.coral],
    ["Цифровая", "выбрать инструмент и понять ограничения", 855, 238, C.teal],
    ["Алгоритмическая", "разложить задачу на шаги и тесты", 94, 460, C.mustard],
    ["Работа с данными", "собрать, представить, сделать вывод", 855, 460, C.slate],
  ];
  nodes.forEach(([name, note, x, y, accent]) => {
    panel(ctx, slide, x, y, 318, 118, C.panel, accent);
    addText(ctx, slide, name, x + 26, y + 22, 245, 26, { size: 23, bold: true });
    addText(ctx, slide, note, x + 26, y + 56, 252, 44, { size: 17, color: C.muted });
  });
  rule(ctx, slide, 412, 300, 76, C.line, 4);
  rule(ctx, slide, 788, 300, 67, C.line, 4);
  rule(ctx, slide, 412, 520, 76, C.line, 4);
  rule(ctx, slide, 788, 520, 67, C.line, 4);
  addText(ctx, slide, "ИИ полезен, если становится материалом для проверки, уточнения и аргументации.", 412, 574, 456, 50, {
    size: 24,
    color: C.teal,
    bold: true,
    align: "center",
  });
  return slide;
}

function slideLimits(presentation, ctx, data, index) {
  const slide = presentation.slides.add();
  base(ctx, slide, data, index);
  panel(ctx, slide, 86, 222, 500, 370, C.panel, C.teal, "Что можно поручать ИИ");
  bulletList(ctx, slide, [
    "предложить варианты объяснения",
    "создать черновик плана или задания",
    "сформулировать тестовые случаи",
    "помочь найти возможную ошибку",
    "адаптировать текст под аудиторию",
  ], 118, 288, 420, { dot: C.teal, size: 19, gap: 47 });
  panel(ctx, slide, 684, 222, 500, 370, C.panel, C.coral, "Что остается за человеком");
  bulletList(ctx, slide, [
    "проверка фактов и источников",
    "выбор корректного решения",
    "защита персональных данных",
    "учет класса и учебной цели",
    "ответственность за итоговую работу",
  ], 716, 288, 420, { dot: C.coral, size: 19, gap: 47 });
  addText(ctx, slide, "Правило для учеников: ИИ предлагает, человек проверяет.", 198, 628, 886, 38, {
    size: 30,
    color: C.ink,
    bold: true,
    align: "center",
    title: true,
  });
  return slide;
}

function slideCycle(presentation, ctx, data, index) {
  const slide = presentation.slides.add();
  base(ctx, slide, data, index);
  const steps = [
    ["Проблема", "жизненная или учебно-практическая ситуация"],
    ["Запрос", "цель, данные, ограничения, формат"],
    ["Ответ ИИ", "черновик, гипотеза, вариант"],
    ["Проверка", "источники, тесты, учебник, обсуждение"],
    ["Улучшение", "правка, уточнение, повторный запрос"],
    ["Рефлексия", "что сработало и где была ошибка"],
  ];
  steps.forEach((s, i) => {
    const x = 72 + (i % 3) * 386;
    const y = i < 3 ? 232 : 414;
    const accent = [C.coral, C.mustard, C.teal, C.slate, C.coral, C.teal][i];
    stage(ctx, slide, i + 1, s[0], s[1], x, y, 318, accent);
  });
  rule(ctx, slide, 390, 288, 62, C.line, 4);
  rule(ctx, slide, 776, 288, 62, C.line, 4);
  rule(ctx, slide, 390, 470, 62, C.line, 4);
  rule(ctx, slide, 776, 470, 62, C.line, 4);
  addText(ctx, slide, "Если убрать проверку и рефлексию, останется списывание. Если оставить цикл, появляется грамотность.", 106, 626, 980, 40, {
    size: 23,
    color: C.ink,
    bold: true,
    align: "center",
  });
  return slide;
}

function slideScenarios(presentation, ctx, data, index) {
  const slide = presentation.slides.add();
  base(ctx, slide, data, index);
  const cells = [
    ["Информация", "проверить спорное утверждение", "критерии надежности, сравнение источников", C.coral],
    ["Код", "найти ошибку через тесты", "гипотеза, запуск, исправление", C.teal],
    ["Данные", "построить вывод по таблице", "визуализация, интерпретация, ограничения", C.mustard],
    ["Продукт", "создать понятную инструкцию", "аудитория, точность, безопасность", C.slate],
  ];
  cells.forEach((cell, i) => {
    const x = 96 + (i % 2) * 546;
    const y = i < 2 ? 228 : 430;
    panel(ctx, slide, x, y, 470, 142, C.panel, cell[3], cell[0]);
    addText(ctx, slide, cell[1], x + 28, y + 58, 390, 30, { size: 24, bold: true });
    addText(ctx, slide, cell[2], x + 28, y + 96, 390, 34, { size: 17, color: C.muted });
  });
  addText(ctx, slide, "Общий принцип: ИИ дает материал, ученик доказывает качество результата.", 158, 624, 960, 36, {
    size: 24,
    bold: true,
    align: "center",
    color: C.teal,
  });
  return slide;
}

function slideInfoExample(presentation, ctx, data, index) {
  const slide = presentation.slides.add();
  base(ctx, slide, data, index);
  rect(ctx, slide, 86, 224, 464, 96, C.ink);
  addText(ctx, slide, "Утверждение", 112, 242, 140, 24, { size: 16, color: C.mustard, bold: true });
  addText(ctx, slide, "«Нейросети всегда точнее поисковых систем»", 112, 272, 386, 34, { size: 24, color: C.paper, bold: true });
  const process = [
    ["1", "Спросить ИИ", "получить план проверки"],
    ["2", "Выбрать критерии", "достоверность, актуальность, проверяемость"],
    ["3", "Сравнить источники", "найти совпадения и расхождения"],
    ["4", "Сформулировать вывод", "где ИИ полезен, а где рискован"],
  ];
  process.forEach((p, i) => {
    const y = 360 + i * 62;
    rect(ctx, slide, 92, y, 42, 42, i === 0 ? C.coral : C.teal);
    addText(ctx, slide, p[0], 92, y + 7, 42, 24, { size: 18, color: C.paper, bold: true, align: "center" });
    addText(ctx, slide, p[1], 154, y, 230, 24, { size: 20, bold: true });
    addText(ctx, slide, p[2], 154, y + 27, 410, 24, { size: 16, color: C.muted });
  });
  panel(ctx, slide, 684, 246, 438, 270, C.panel, C.mustard, "Что развивается");
  bulletList(ctx, slide, [
    "видеть проверяемые и непроверяемые утверждения",
    "различать объяснение и доказательство",
    "работать с критериями надежности",
    "делать вывод с оговорками",
  ], 718, 312, 360, { dot: C.mustard, size: 19, gap: 48 });
  return slide;
}

function slideCodeExample(presentation, ctx, data, index) {
  const slide = presentation.slides.add();
  base(ctx, slide, data, index);
  rect(ctx, slide, 86, 222, 480, 326, C.ink);
  addText(ctx, slide, "Запрос к ИИ", 116, 248, 160, 22, { size: 16, color: C.mustard, bold: true });
  addText(ctx, slide, "Проверь мой алгоритм. Не пиши готовую программу. Предложи 5 тестов и объясни, что каждый тест проверяет.", 116, 292, 398, 150, {
    size: 27,
    color: C.paper,
    bold: true,
    title: true,
  });
  addText(ctx, slide, "Формулировка ограничивает ИИ и оставляет ключевое действие ученику.", 116, 472, 388, 46, {
    size: 18,
    color: "#D8CDB8",
  });
  const tests = [
    ["1", "крайний случай"],
    ["2", "минимальное простое"],
    ["9", "составное нечетное"],
    ["17", "простое"],
    ["25", "квадрат простого"],
  ];
  tests.forEach((t, i) => {
    const y = 246 + i * 58;
    rect(ctx, slide, 662, y, 74, 38, i % 2 ? C.paleTeal : C.paleMustard, C.line, 1);
    addText(ctx, slide, t[0], 662, y + 5, 74, 24, { size: 18, bold: true, align: "center", color: C.ink });
    addText(ctx, slide, t[1], 758, y + 4, 308, 28, { size: 19, color: C.ink });
  });
  rule(ctx, slide, 630, 570, 480, C.teal, 7);
  addText(ctx, slide, "Оцениваем: найденную ошибку, доказательство исправления, объяснение логики тестов.", 630, 596, 502, 44, {
    size: 21,
    bold: true,
    color: C.teal,
  });
  return slide;
}

function slideRubric(presentation, ctx, data, index) {
  const slide = presentation.slides.add();
  base(ctx, slide, data, index);
  const rows = [
    ["Постановка задачи", "цель, данные, ограничения", 0.92, C.teal],
    ["Качество запроса", "роль, контекст, формат ответа", 0.82, C.coral],
    ["Проверка результата", "источники, тесты, сверка", 0.96, C.mustard],
    ["Улучшение", "правки после проверки", 0.72, C.slate],
    ["Объяснение", "аргументация своими словами", 0.88, C.teal],
  ];
  rows.forEach((row, i) => {
    const y = 228 + i * 70;
    addText(ctx, slide, row[0], 104, y, 280, 24, { size: 21, bold: true });
    addText(ctx, slide, row[1], 104, y + 28, 280, 22, { size: 15, color: C.muted });
    rect(ctx, slide, 420, y + 8, 610, 18, "#E8DDC8");
    rect(ctx, slide, 420, y + 8, 610 * row[2], 18, row[3]);
    addText(ctx, slide, "0-2 балла", 1052, y + 1, 96, 24, { size: 17, color: C.muted, align: "right" });
  });
  addText(ctx, slide, "Такая рубрика делает видимым ход работы. Готовый ответ без процесса почти не набирает баллы.", 130, 616, 1010, 42, {
    size: 24,
    bold: true,
    align: "center",
  });
  return slide;
}

function slideSafety(presentation, ctx, data, index) {
  const slide = presentation.slides.add();
  base(ctx, slide, data, index);
  addText(ctx, slide, "Можно", 142, 224, 190, 34, { size: 30, bold: true, color: C.teal, title: true });
  addText(ctx, slide, "Нельзя", 772, 224, 190, 34, { size: 30, bold: true, color: C.coral, title: true });
  panel(ctx, slide, 100, 278, 440, 282, C.panel, C.teal);
  bulletList(ctx, slide, [
    "просить объяснение и примеры",
    "получать идеи тестов",
    "сравнивать варианты решения",
    "улучшать формулировку",
  ], 136, 324, 352, { dot: C.teal, size: 21, gap: 48 });
  panel(ctx, slide, 724, 278, 440, 282, C.panel, C.coral);
  bulletList(ctx, slide, [
    "вводить персональные данные",
    "сдавать ответ без проверки",
    "скрывать использование ИИ",
    "заменять ключевое действие урока",
  ], 760, 324, 352, { dot: C.coral, size: 21, gap: 48 });
  rect(ctx, slide, 610, 258, 18, 340, C.ink);
  addText(ctx, slide, "Договор с классом: где ИИ разрешен, как фиксируем использование, что проверяем вручную.", 154, 618, 956, 40, {
    size: 23,
    bold: true,
    align: "center",
    color: C.ink,
  });
  return slide;
}

function slidePrompt(presentation, ctx, data, index) {
  const slide = presentation.slides.add();
  base(ctx, slide, data, index);
  rect(ctx, slide, 92, 210, 710, 392, C.ink);
  const lines = [
    ["Роль", "Ты помощник по информатике."],
    ["Задача", "Мне нужно проверить алгоритм / текст / вывод."],
    ["Данные", "Вот исходные условия и что я уже сделал."],
    ["Ограничения", "Не давай готовый ответ. Помоги проверить."],
    ["Формат", "Список ошибок, тесты, критерии или план правки."],
    ["Контроль", "Отметь, что нужно проверить вручную."],
  ];
  lines.forEach((line, i) => {
    const y = 244 + i * 55;
    addText(ctx, slide, line[0], 126, y, 118, 24, { size: 16, color: C.mustard, bold: true });
    addText(ctx, slide, line[1], 250, y - 2, 492, 30, { size: 20, color: C.paper });
    if (i < lines.length - 1) rule(ctx, slide, 126, y + 36, 612, "#394542", 1);
  });
  panel(ctx, slide, 858, 264, 300, 250, C.panel, C.mustard, "Почему работает");
  bulletList(ctx, slide, [
    "ученик сначала понимает задачу",
    "появляются критерии качества",
    "ИИ не получает роль автора работы",
    "проверка встроена в запрос",
  ], 890, 326, 230, { dot: C.mustard, size: 18, gap: 44 });
  return slide;
}

function slideClose(presentation, ctx, data, index) {
  const slide = presentation.slides.add();
  base(ctx, slide, data, index, true);
  addText(ctx, slide, "Формула первого шага", 88, 210, 360, 30, { size: 20, color: C.mustard, bold: true });
  const steps = [
    ["1 тема", "любой текущий раздел"],
    ["1 инструмент", "один разрешенный ИИ-сервис"],
    ["1 критерий", "что именно проверяем"],
    ["1 вывод", "что ученик понял"],
  ];
  steps.forEach((s, i) => {
    const x = 88 + i * 286;
    rect(ctx, slide, x, 278, 224, 132, i % 2 ? C.paper : C.paleTeal);
    addText(ctx, slide, s[0], x + 22, 302, 174, 30, { size: 25, bold: true, color: C.ink, title: true });
    addText(ctx, slide, s[1], x + 22, 342, 168, 42, { size: 18, color: C.muted });
  });
  addText(ctx, slide, "ИИ становится средством развития функциональной грамотности, когда ученик отвечает не только за ответ, но и за способ его получения.", 112, 482, 998, 82, {
    size: 31,
    color: C.paper,
    bold: true,
    align: "center",
    title: true,
  });
  addText(ctx, slide, "Источники: OECD PISA 2022 Assessment and Analytical Framework · UNESCO Guidance for generative AI in education and research · UNESCO AI competency framework for teachers", 86, 646, 1050, 32, {
    size: 12,
    color: "#CDBF9F",
    align: "center",
  });
  return slide;
}

export async function renderSlide(presentation, ctx, index) {
  const data = slides[index];
  switch (data.type) {
    case "cover":
      return slideCover(presentation, ctx, data, index);
    case "comparison":
      return slideComparison(presentation, ctx, data, index);
    case "competency":
      return slideCompetency(presentation, ctx, data, index);
    case "limits":
      return slideLimits(presentation, ctx, data, index);
    case "cycle":
      return slideCycle(presentation, ctx, data, index);
    case "scenarios":
      return slideScenarios(presentation, ctx, data, index);
    case "infoExample":
      return slideInfoExample(presentation, ctx, data, index);
    case "codeExample":
      return slideCodeExample(presentation, ctx, data, index);
    case "rubric":
      return slideRubric(presentation, ctx, data, index);
    case "safety":
      return slideSafety(presentation, ctx, data, index);
    case "prompt":
      return slidePrompt(presentation, ctx, data, index);
    case "close":
      return slideClose(presentation, ctx, data, index);
    default:
      throw new Error(`Unknown slide type: ${data.type}`);
  }
}
