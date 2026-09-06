const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  PageBreak, Header, Footer, PageNumber, VerticalAlign
} = require("docx");
const fs = require("fs");

const GRANA = "8F2434", GRANA_DARK = "6C1A27", ORO = "B8912F", TINTA = "24211B", GRIS = "5C5346", CREMA_ALT = "ECE2CC";
const FONT_HEAD = "Cambria", FONT_BODY = "Calibri";

function sceneTitle(num, text) {
  return new Paragraph({
    spacing: { before: 500, after: 160 },
    border: { bottom: { color: GRANA, space: 6, style: BorderStyle.SINGLE, size: 8 } },
    children: [ new TextRun({ text: (num ? `${num}. ` : "") + text, bold: true, color: GRANA_DARK, font: FONT_HEAD, size: 27 }) ],
  });
}
function stageDir(text) {
  return new Paragraph({
    spacing: { before: 100, after: 140, line: 280 },
    indent: { left: 300, right: 300 },
    children: [ new TextRun({ text: `[${text}]`, italics: true, font: FONT_BODY, size: 20, color: GRIS }) ],
  });
}
function speaker(name) {
  return new Paragraph({
    spacing: { before: 160, after: 20 },
    children: [ new TextRun({ text: name, bold: true, font: FONT_HEAD, size: 21, color: GRANA, allCaps: true }) ],
  });
}
function line(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 60, line: 300 },
    indent: { left: 280 },
    alignment: AlignmentType.LEFT,
    children: [ new TextRun({ text, font: FONT_BODY, size: 22, color: TINTA, italics: opts.italics || false, bold: opts.bold || false }) ],
  });
}
function chorus(text) {
  return new Paragraph({
    spacing: { after: 80, line: 300 },
    indent: { left: 280 },
    children: [ new TextRun({ text, font: FONT_BODY, size: 22, color: GRANA_DARK, bold: true }) ],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 140, line: 300 }, alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [ new TextRun({ text, font: FONT_BODY, size: 21, color: TINTA, italics: opts.italics || false, bold: opts.bold || false }) ],
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 70, line: 280 },
    children: [ new TextRun({ text, font: FONT_BODY, size: 20, color: TINTA }) ],
  });
}
function spacer(h = 100) { return new Paragraph({ spacing: { after: h }, children: [] }); }
function divider() {
  return new Paragraph({
    spacing: { before: 260, after: 260 },
    alignment: AlignmentType.CENTER,
    children: [ new TextRun({ text: "◆ ◆ ◆", color: ORO, font: FONT_BODY, size: 20 }) ],
  });
}
function cellText(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: GRANA } : (opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined),
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [ new Paragraph({ children: [ new TextRun({ text, font: FONT_BODY, size: 18, bold: opts.header, color: opts.header ? "FFFFFF" : TINTA }) ] }) ],
  });
}
function table(headers, rows, widths) {
  const headerRow = new TableRow({ tableHeader: true, children: headers.map((hd, i) => cellText(hd, { header: true, width: widths[i] })) });
  const bodyRows = rows.map((r, ri) => new TableRow({ children: r.map((c, i) => cellText(c, { width: widths[i], fill: ri % 2 === 0 ? "FFFDF7" : CREMA_ALT })) }));
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, rows: [headerRow, ...bodyRows] });
}

// ================= PORTADA =================
const cover = [
  new Paragraph({ spacing: { before: 900 }, children: [] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "COLEGIO SANTA CRUZ — CALLAO", font: FONT_BODY, size: 20, color: GRIS, characterSpacing: 20 }) ] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [ new TextRun({ text: "Promoción BLESSED 2026 · Fiestas Patrias", font: FONT_BODY, size: 18, color: GRIS }) ] }),
  new Paragraph({ spacing: { before: 400 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { top: { color: ORO, space: 14, style: BorderStyle.SINGLE, size: 8 }, bottom: { color: ORO, space: 14, style: BorderStyle.SINGLE, size: 8 } },
    spacing: { before: 200, after: 200 },
    children: [ new TextRun({ text: "DE BRONCE Y MEMORIA", bold: true, font: FONT_HEAD, size: 50, color: GRANA_DARK }) ],
  }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160, after: 500 }, children: [ new TextRun({ text: "Un recorrido escénico por la historia del Perú", italics: true, font: FONT_HEAD, size: 24, color: TINTA }) ] }),
  new Paragraph({ spacing: { before: 500 }, children: [] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "Guion teatral para la representación en el patio", font: FONT_BODY, size: 20, color: TINTA }) ] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [ new TextRun({ text: "Duración estimada: 12–15 minutos", font: FONT_BODY, size: 18, color: GRIS }) ] }),
  new Paragraph({ spacing: { before: 600 }, children: [] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "Comisión Estudiantil, con la asesoría de la Prof. Giovanna", font: FONT_BODY, size: 18, color: GRIS }) ] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "Callao, Perú — 2026", font: FONT_BODY, size: 18, color: GRIS }) ] }),
  new Paragraph({ children: [ new PageBreak() ] }),
];

// ================= NOTAS DE PRODUCCIÓN =================
const notasSection = [
  sceneTitle(null, "Notas de producción"),
  p("Este guion está escrito para sentirse como una sola historia continua, no como una sucesión de discursos. Ningún personaje entra, habla y se retira: cada uno permanece en escena y se integra al cuadro visual que va creciendo hasta el gran cierre de cada bloque. La Prof. Giovanna presenta únicamente el inicio de cada bloque, sin anunciar \u201Cacto 1\u201D ni \u201Cacto 2\u201D \u2014simplemente da paso al siguiente momento."),
  p("Las frases atribuidas a Bolognesi, Grau y Túpac Amaru II corresponden a expresiones históricas documentadas; el resto de los diálogos es una construcción dramática basada en los hechos históricos conocidos de cada personaje, escrita para sonar como teatro y no como discurso escolar."),
  p("Indicaciones escénicas van entre corchetes y en cursiva. Los parlamentos que deben decirse al mismo tiempo están marcados como \u201Ctodos\u201D o con los nombres unidos por \u201Cy\u201D."),
  spacer(80),
  table(
    ["Bloque", "Contenido", "Tono"],
    [
      ["Presentación", "Prof. Giovanna abre, sin nombrar actos", "Breve, evocador"],
      ["Primera parte", "Independencia: Túpac Amaru II, Bartolina Sisa, José Olaya, cuarteto femenino, gran cierre", "Solemne → coral y emotivo"],
      ["Transición", "Prof. Giovanna da paso al siguiente momento", "Breve"],
      ["Segunda parte", "Guerra del Pacífico: Ugarte y Bolognesi, Cáceres y Antonia Moreno, Leoncio Prado, Grau, gran final", "Marcial → épico"],
    ],
    [2400, 4700, 2100]
  ),
  spacer(100),
  p("Reparto sugerido (según los roles ya asignados en la organización del evento):", { bold: true }),
  table(
    ["Personaje", "Estudiante"],
    [
      ["Túpac Amaru II", "Valentino Marino García"],
      ["Micaela Bastidas", "Ariana Ríos Ochoa"],
      ["Bartolina Sisa", "Jeany Gómez Mejía"],
      ["José Olaya", "Leonardo Adrián Marchand López"],
      ["Brígida Silva de Ochoa", "Daniela Olascoaga Mozo"],
      ["María Parado de Bellido", "Camila Tafur Mori"],
      ["Francisca Zubiaga", "Ainara Rocha Machado"],
      ["Juana de Dios Manrique", "Ana Flavia Carrión Obando"],
      ["Alfonso Ugarte", "Carlos Díaz Benavides"],
      ["Francisco Bolognesi", "Ricardo Cuadros Rojas"],
      ["Andrés Avelino Cáceres", "Esteban Villanueva Aguirre"],
      ["Antonia Moreno de Cáceres", "Kathryn Flores Benites"],
      ["Leoncio Prado", "Julio Benítez Olórtegui"],
      ["Miguel Grau", "Stephano Cerna Agudelo"],
    ],
    [3600, 5600]
  ),
  new Paragraph({ children: [ new PageBreak() ] }),
];

// ================= APERTURA =================
const aperturaSection = [
  sceneTitle(null, "Apertura"),
  stageDir("La Prof. Giovanna se dirige brevemente al público. No anuncia actos ni explica la historia; solo da paso a la representación."),
  speaker("Prof. Giovanna"),
  line("Hay historias que no se cuentan: se viven. Hoy la promoción no viene a recordarles la historia del Perú. Viene a devolvérsela. Escuchen. Ya empieza."),
  stageDir("Se retira a un costado. Silencio. Un solo golpe de tambor, lejano."),
];

// ================= I. TÚPAC AMARU II Y MICAELA =================
const escena1 = [
  sceneTitle("I", "Túpac Amaru II y Micaela Bastidas"),
  stageDir("Luz tenue. Túpac Amaru II entra desde un extremo, con paso firme pero cansado, como quien carga siglos. Micaela Bastidas entra desde el otro extremo, con una vela o antorcha. Se encuentran al centro."),
  speaker("Micaela"),
  line("José Gabriel. Los caminos están cerrados. Cargan cadenas donde antes había ríos."),
  speaker("Túpac Amaru II"),
  line("Lo sé, Micaela. Los he cruzado todos. En cada uno, un hombre de mi sangre pidiendo pan y recibiendo látigo."),
  speaker("Micaela"),
  line("¿Y aun así vienes con las manos vacías?"),
  speaker("Túpac Amaru II"),
  line("Vengo con las manos vacías porque se las he dado todas al pueblo. Lo que me queda... es la voz."),
  speaker("Micaela"),
  line("Entonces que se oiga. Que se oiga hasta Castilla."),
  stageDir("Él alza la voz, como una proclama."),
  speaker("Túpac Amaru II"),
  line("¡Desde hoy no correrá más sangre indígena por el capricho de un rey lejano! ¡Cusco despierta, y con él, todo el Perú!"),
  speaker("Micaela"),
  line("Y si te falta el brazo, José Gabriel, aquí tienes el mío. No vine a llorarte. Vine a pelear contigo."),
  speaker("Túpac Amaru II"),
  line("Sé que el precio será alto."),
  speaker("Micaela"),
  line("Los precios altos son los únicos que valen la pena, esposo. La libertad no se compra con monedas. Se compra con nosotros."),
  stageDir("Se toman de la mano. Silencio breve."),
  speaker("Túpac Amaru II y Micaela"),
  chorus("Que ardan las cadenas antes que arda el silencio."),
  stageDir("No salen del escenario. Se desplazan lentamente hacia un costado, donde permanecen de pie, observando lo que sigue, como testigos."),
];

// ================= II. BARTOLINA SISA =================
const escena2 = [
  sceneTitle("II", "Bartolina Sisa"),
  stageDir("Tambor más intenso. Las montoneras irrumpen en el escenario y ocupan posiciones con decisión. Bartolina Sisa entra al centro, entre ellas, con autoridad total."),
  speaker("Bartolina Sisa"),
  line("¡Aquí no hay lugar para el miedo! ¡El que tenga miedo, que se lo trague, porque detrás de nosotras no queda nadie más que lo cargue!"),
  stageDir("Levanta el brazo. Las montoneras responden formando una figura o alzando también el brazo, en silencio absoluto: solo el gesto, ninguna palabra."),
  speaker("Bartolina Sisa"),
  line("Nos llamaron rabonas, como si camináramos detrás de la historia. ¡Y hoy la historia camina detrás de nosotras!"),
  stageDir("Nuevo gesto de mando. Las montoneras avanzan un paso, disciplinadas."),
  speaker("Bartolina Sisa"),
  line("No vinimos a llorar a nuestros muertos. Vinimos a que no haya más muertos que llorar."),
  stageDir("Silencio. Ella respira, mira al horizonte imaginario."),
  speaker("Bartolina Sisa"),
  line("Adelante."),
  stageDir("Las montoneras se desplazan ordenadamente hacia ambos extremos del escenario, sin desaparecer: quedan formando parte del cuadro. Bartolina permanece al centro un instante más, luego se integra a un costado, cerca de Túpac Amaru y Micaela."),
];

// ================= III. JOSÉ OLAYA =================
const escena3 = [
  sceneTitle("III", "José Olaya"),
  stageDir("Cambio de ritmo, más urgente. José Olaya atraviesa el escenario de un extremo a otro, con paso decidido, mirando hacia atrás como quien es perseguido, algo escondido bajo la ropa."),
  speaker("José Olaya"),
  line("Que me pregunten cien veces. Que me corten cien veces la lengua. No hay tormento que valga más que mi palabra empeñada."),
  stageDir("Se detiene un instante al centro, mira directamente al público."),
  speaker("José Olaya"),// ======== DEMACIADO CORTO, FALTAN ALEGORIAS A LO QUE HIZO, SUS CARTAS, LO QUE NADO, NS
  line("Un pescador no tiene ejércitos. Tiene una barca, una promesa... y un mar que no traiciona a quien no lo traiciona a él."),
  stageDir("Retoma su marcha, cruza hacia el otro extremo, pero no sale: se detiene ahí, de pie, vigilante, sumándose al cuadro."),
];

// ================= IV. CUARTETO FEMENINO =================
const escena4 = [
  sceneTitle("IV", "Cuarteto femenino"),
  stageDir("Luz cálida, distinta a la anterior, más íntima. Brígida Silva de Ochoa, María Parado de Bellido, Francisca Zubiaga y Juana de Dios Manrique entran juntas, casi como una sola figura que se abre en cuatro."),
  speaker("Brígida"), line("Yo no disparé un solo tiro."),
  speaker("María Parado"), line("Yo tampoco."),
  speaker("Francisca"), line("Ni yo."),
  speaker("Juana"), line("Ni yo. Y aun así, nos temieron más que a un batallón entero."),
  speaker("Brígida"), line("Porque en mi casa se escondían los mensajes que el ejército no podía leer."),
  speaker("María Parado"), line("Porque en mi silencio se escondían los nombres que el verdugo quería."),
  speaker("Francisca"), line("Porque en mi paciencia se escondía la espera exacta del momento justo."),
  speaker("Juana"), line("Porque en mi voz se escondía el coraje de decir \u201Caquí no\u201D cuando todos callaban."),
  speaker("Brígida"), line("Me llamaron espía."),
  speaker("María Parado"), line("A mí, terca."),
  speaker("Francisca"), line("A mí, ambiciosa."),
  speaker("Juana"), line("A mí, imprudente."),
  speaker("Todas"),
  chorus("Y todas teníamos el mismo nombre: patria."),
  stageDir("Se miran entre ellas."),
  speaker("María Parado"), line("Me exigieron los nombres de mis compañeros. Me dijeron que hablara o moriría."),
  speaker("Brígida"), line("Y ella respondió lo único que una mujer libre puede responder..."),
  speaker("María Parado"), line("Maten no más. Que no diré nada.", { bold: true }),
  stageDir("Silencio breve, pesado."),
  speaker("Francisca"), line("No todas las batallas se pelean con pólvora."),
  speaker("Juana"), line("Algunas se pelean quedándose. Sosteniendo la casa. Sosteniendo el nombre. Sosteniendo a los que faltan."),
  stageDir("Las cuatro comienzan a moverse, lentamente, convergiendo hacia el centro del escenario."),
  speaker("Todas"),
  chorus("Nosotras también somos la patria."),
];

// ================= V. GRAN CIERRE PRIMER BLOQUE =================
const escena5 = [
  sceneTitle("V", "Gran cierre del primer bloque"),
  stageDir("Se reincorporan todos: Túpac Amaru, Micaela, Bartolina, José Olaya, las montoneras y el cuarteto femenino, que se integra al centro. La música crece, tenue al inicio."),
  stageDir("Todos avanzan, poco a poco, desde sus posiciones hacia el centro. Cada quien pronuncia una sola frase, en cadena, sin pausas largas entre una y otra: el ritmo se acelera con cada línea."),
  speaker("Túpac Amaru II"), line("Sembramos la primera grieta..."),
  speaker("Micaela"), line("...para que otros derribaran el muro."),
  speaker("Bartolina Sisa"), line("Enseñamos que también se pelea desde atrás..."),
  speaker("José Olaya"), line("...y que también se muere en silencio."),
  speaker("Brígida"), line("Enseñamos que la casa también es trinchera."),
  speaker("María Parado"), line("Que el silencio también es un arma."),
  speaker("Francisca"), line("Que la espera también es coraje."),
  speaker("Juana"), line("Que decir \u201Cno\u201D también es servir."),
  stageDir("Todos muy cerca del centro, formando una composición visual: un cuadro histórico vivo."),
  speaker("Todos"),
  chorus("Nosotros no terminamos la historia del Perú."),
  stageDir("Pausa mínima."),
  speaker("Todos"),
  chorus("Nosotos la empezamos."),
  stageDir("Se congelan en la composición final durante unos segundos, como una pintura histórica. La luz baja lentamente, o se hace un corte de transición."),
  divider(),// ======== QUE VIVA LA UNIÓN, QUE VIVA LA LIBERTAD, QUE VIVA LA INDEPENDENCIA
  stageDir("TRANSICIÓN — la Prof. Giovanna presenta brevemente el siguiente momento, sin nombrar actos."),
  speaker("Prof. Giovanna"),
  line("La grieta que abrieron se hizo camino. Y ese camino, un siglo después, tuvo que ser defendido con la vida. Escuchen lo que vino después."),
  new Paragraph({ children: [ new PageBreak() ] }),
];

// ================= VI. UGARTE Y BOLOGNESI =================
const escena6 = [
  sceneTitle("VI", "Alfonso Ugarte y Francisco Bolognesi"),
  stageDir("Tambor militar. Alfonso Ugarte y Francisco Bolognesi entran marchando, uno al lado del otro. Detrás de ellos, el destacamento del Ejército ingresa y comienza a tomar posiciones: el movimiento no se detiene, todo fluye."),
  speaker("Bolognesi"), line("Coronel Ugarte, las municiones no alcanzan para otro día de asedio."),
  speaker("Ugarte"), line("Entonces que alcancen para esta tarde, coronel. Arica no se rinde por falta de balas."),
  speaker("Bolognesi"), line("Se rendirá por falta de hombres, si Dios no nos ayuda."),
  speaker("Ugarte"), line("Los hombres que quedan valen por cien. Yo respondo por los míos."),
  stageDir("Ambos llegan a su posición. El Ejército termina de formar detrás de ellos."),
  speaker("Bolognesi"),// ======== DEMACIADO CORTO, FALTAN FRASES DE ALFONZO UGARTE
  line("Diga usted, general, que tengo deberes sagrados que cumplir, y que los cumpliré hasta quemar el último cartucho."),
  speaker("Ugarte"), line("Y yo no la entregaré ni muerto."),
  stageDir("Ambos desenvainan la espada al mismo tiempo, gesto simultáneo y marcial."),
  speaker("Ugarte y Bolognesi"),
  chorus("¡Por el Perú!"),
  stageDir("Se desplazan hacia un costado, integrándose con el Ejército ya formado."),
];

// ================= VII. CÁCERES Y ANTONIA =================
const escena7 = [
  sceneTitle("VII", "Andrés Avelino Cáceres y Antonia Moreno"),
  stageDir("Cambian la luz y el ritmo: más íntimo, sin dejar de ser firme. Andrés Avelino Cáceres y Antonia Moreno entran juntos, como si vinieran caminando la sierra."),
  speaker("Antonia"), line("Los hombres se cansan, Andrés. Los he visto. Tres años en la Breña pesan como treinta."),
  speaker("Cáceres"), line("Lo sé. Pero cada vez que creen que ya no queda ejército, alguien en la sierra les da de comer, les cura las heridas, les avisa por dónde viene el enemigo."),
  speaker("Antonia"), line("Ese alguien no siempre lleva fusil."),
  speaker("Cáceres"), line("No. A veces lleva una olla, un mensaje escondido, o el valor de decir \u201Cpor aquí no pasan\u201D."),
  speaker("Antonia"), line("Mientras tú resistías al frente, otras resistíamos por dentro. El Perú no se sostuvo solo con pólvora, Andrés. Se sostuvo con nosotras también."),
  speaker("Cáceres"), line("Lo sé, Antonia. Y el día que se escriba esta guerra, tu nombre no puede faltar junto al mío."),
  stageDir("Se toman del brazo, con firmeza."),
  speaker("Cáceres y Antonia"),// ======== DEMACIADO CORTO, FALTAN FRASES DE CÁCERES, endentible las alegorias a quienes participaron pero los protagonitas ahí son ellos 2
  chorus("La Breña no se rindió porque nunca estuvo sola."),
  stageDir("Se desplazan hacia el Ejército, quedando junto a Ugarte y Bolognesi."),
];

// ================= VIII. LEONCIO PRADO =================
const escena8 = [
  sceneTitle("VIII", "Leoncio Prado"),
  stageDir("La FAP comienza a ocupar posiciones mientras Leoncio Prado entra al centro, joven, erguido."),
  speaker("Leoncio Prado"), line("Me dijeron que era muy joven para la guerra. Les respondí que la patria no pregunta la edad de quien la defiende."),
  stageDir("Pausa."),// ======== DEMACIADO CORTO, FALTAN FRASES DE LEONCIO PRADO
  speaker("Leoncio Prado"), line("El honor no se hereda. Se construye cada vez que un hombre elige el deber por encima del miedo."),
  stageDir("Mira hacia la formación que se completa detrás de él."),
  speaker("Leoncio Prado"), line("Que quede claro: no defendemos una bandera de tela. Defendemos todo lo que esa tela representa."),
  stageDir("Se integra a su posición, firme."),
];

// ================= IX. MIGUEL GRAU =================
const escena9 = [
  sceneTitle("IX", "Miguel Grau"),
  stageDir("Silencio total. La luz cambia, algo más dorada, más solemne. Pausa deliberada antes de que Miguel Grau entre, con paso lento y medido, como quien ya conoce el peso de lo que representa. Su entrada debe sentirse distinta a todas las anteriores."),
  stageDir("Grau camina hasta el centro. No hay prisa. Cuando habla, lo hace con calma absoluta."),
  speaker("Miguel Grau"), line("El Huáscar no era solo un barco de hierro. Era la última puerta abierta del Pacífico."),
  stageDir("Pausa."),
  speaker("Miguel Grau"), line("En Angamos entendí que un hombre puede perder el combate y aun así ganar el respeto del mundo."),
  stageDir("Pausa más larga."),
  speaker("Miguel Grau"), line("Cuando el capitán Prat cayó frente a mí, no vi a un enemigo. Vi a un marino que cumplió su palabra hasta el final, igual que yo pensaba cumplir la mía."),
  stageDir("Con profunda solemnidad."),
  speaker("Miguel Grau"), line("Por eso devolví su espada, sus cartas, sus objetos, a su viuda. Porque el mar no distingue banderas cuando reconoce el honor."),
  stageDir("Silencio."),// ======== DEMACIADO CORTO, FALTAN FRASES DE miguel GRAU Y MÁS COSAS DE LO QUE HIZO.
  speaker("Miguel Grau"), line("Me llamaron el Caballero de los Mares. No por lo que hundí. Sino por lo que respeté incluso hundiendo."),
  stageDir("Se gira lentamente hacia la formación, asumiendo su lugar entre los héroes."),
  speaker("Miguel Grau"), line("El Perú no solo se defiende con cañones. Se defiende con la manera en que se pelea."),
  stageDir("Se integra a la formación general, junto a los demás héroes."),
];

// ================= X. GRAN FINAL =================
const escena10 = [
  sceneTitle("X", "Gran final"),
  stageDir("Todos los héroes están presentes: Ugarte, Bolognesi, Cáceres, Antonia, Leoncio Prado, Grau. Todos los destacamentos (Ejército, Marina, FAP) están formados detrás. La música crece."),
  stageDir("Cada héroe pronuncia una sola frase corta, en cadena, sin pausas, construyendo un mensaje colectivo. Las tropas acompañan visualmente, avanzando ligeramente con cada frase."),
  speaker("Ugarte"), line("Defendimos la tierra..."),
  speaker("Bolognesi"), line("...hasta el último cartucho."),
  speaker("Cáceres"), line("Defendimos la sierra..."),
  speaker("Antonia"), line("...y a quienes la sierra escondía."),
  speaker("Leoncio Prado"), line("Defendimos la juventud del honor..."),
  speaker("Grau"), line("...y el honor, incluso frente al enemigo."),
  stageDir("Todos avanzan hacia el centro. Los destacamentos completan una única línea detrás y a los costados de los héroes."),
  stageDir("Al llegar al centro: TODOS desenvainan la espada exactamente al mismo tiempo. Sonido metálico único. Silencio absoluto. La pausa debe doler."),
  speaker("Todos"),
  chorus("¡VIVAN LOS HÉROES DEL PERÚ!"),
  chorus("¡VIVA LA PATRIA!"),
  chorus("¡¡¡VIVA EL PERÚ!!!"),
  stageDir("Mantienen la posición, espadas en alto, unos segundos. Silencio."),
  speaker("Comandante"),
  line("¡Tropas... retírense!"),
  stageDir("Las tropas responden con disciplina militar: giro marcial, paso firme, y abandonan el escenario en formación, sin romper el orden. Los héroes principales son los últimos en retirarse, con la mirada al frente."),
  spacer(200),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "FIN DE LA REPRESENTACIÓN", bold: true, font: FONT_HEAD, size: 26, color: GRANA_DARK }) ] }),
];

// ================= DOCUMENTO =================
const doc = new Document({
  numbering: { config: [ { reference: "bullets", levels: [ { level: 0, format: "bullet", text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 220 } } } } ] } ] },
  styles: { default: { document: { run: { font: FONT_BODY, size: 21, color: TINTA } } } },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: [...cover] },
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: { default: new Header({ children: [ new Paragraph({ alignment: AlignmentType.RIGHT, children: [ new TextRun({ text: "De Bronce y Memoria — Promoción BLESSED 2026", size: 14, color: GRIS, font: FONT_BODY }) ] }) ] }) },
      footers: { default: new Footer({ children: [ new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Página ", size: 14, color: GRIS, font: FONT_BODY }),
        new TextRun({ children: [PageNumber.CURRENT], size: 14, color: GRIS, font: FONT_BODY }),
        new TextRun({ text: " de ", size: 14, color: GRIS, font: FONT_BODY }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: GRIS, font: FONT_BODY }),
      ] }) ] }) },
      children: [
        ...notasSection, ...aperturaSection, ...escena1, ...escena2, ...escena3, ...escena4,
        ...escena5, ...escena6, ...escena7, ...escena8, ...escena9, ...escena10,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("De_Bronce_y_Memoria_Guion.docx", buffer);
  console.log("Guion generado OK");
});
