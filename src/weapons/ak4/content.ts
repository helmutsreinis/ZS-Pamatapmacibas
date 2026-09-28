import type { Stage, Step, TheoryQuestion } from '../types';

export const sources = {
  /** Jaunsarga rokasgrāmata, 12. nodaļa (AK-4); based on "Triecienšautene AK-4 (G-3)", Rīga 2005. */
  handbook: 'https://rojasvidusskola.lv/wp-content/uploads/2015/03/Jaunsarga-rokasgramata.pdf',
  /** Course presentation "Triecienšautene AK-4 (G-3)": part functions and technical data. */
  course: 'https://www.slideserve.com/andres/triecien-autene-ak-4-g-3',
  /** Bundeswehr ZDv 3/13 "Das Gewehr G3" (1999): the same rifle, the movements in detail. */
  zdv: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/ZDv_3-13_Das_Gewehr_G3_(1999).pdf',
  photo: 'https://commons.wikimedia.org/wiki/File:G3A3_disassembled_mod.jpg',
};

const JS = 'Jaunsarga rokasgrāmata · 12. nodaļa, AK-4';
const COURSE = 'Mācību prezentācija “Triecienšautene AK-4 (G-3)”';
const ZDV = 'Bundesvērs · ZDv 3/13 “Das Gewehr G3”';

// Order of the daļējā izjaukšana in the Jaunsargs' handbook (12.2); its step 6 is split into
// the selector and the trigger mechanism. Movements follow ZDv 3/13, Nr. 319–323.
export const steps: Step[] = [
  {
    id: 'stock', label: 'Atvienot laidi ar atgriezējmehānismu', assemblyLabel: 'Pievienot laidi ar atgriezējmehānismu',
    part: 'Laide ar atgriezējmehānismu', hint: 'sprosttapas uz sāniem, laidi atpakaļ', assemblyHint: 'laidi uz priekšu, tapas vietā',
    direction: 'taisni uz aizmuguri',
    function: 'Ļauj stingri noturēt ieroci pie pleca, bet atgriezējmehānisms pēc šāviena atgriež aizslēga rāmi ar aizslēgu sākotnējā stāvoklī.',
    explanation: 'Laidi pie stobra kārbas notur divas sprosttapas laides priekšgalā. No laides priekšgala stobra kārbā ieiet atgriezējmehānisma vadstienis ar atsperi – noņemot laidi, tas izslīd ārā.',
    action: 'Izbīdi uz sāniem abas laides priekšgalā esošās sprosttapas un ievieto tās laides dobajās kniedēs (pagaidu vietā). Stingri satver laidi un velc to taisni uz aizmuguri.',
    assemblyAction: 'Ievirzi atgriezējmehānisma vadstieni stobra kārbā un piespied laidi līdz galam. Izņem sprosttapas no dobajām kniedēm un ievieto tās laides priekšgalā.',
    tip: 'Sprosttapas uzreiz ievieto laides dobajās kniedēs – tā tās nepazūd.',
    assemblyTip: 'Pirms laides pievienošanas aizslēga rāmim jābūt stobra kārbā un pistoļveida rokturim – nostiprinātam.',
    term: 'Vāciski – Bodenstück mit Schulterstütze; sprosttapas – Haltebolzen, dobās kniedes – Hohlnieten.',
    source: sources.handbook, sourceName: JS,
  },
  {
    id: 'carrier', label: 'Izņemt aizslēga rāmi ar aizslēgu', assemblyLabel: 'Ievietot aizslēga rāmi ar aizslēgu',
    part: 'Aizslēga rāmis ar aizslēgu', hint: 'ar pārlādēšanas rokturi atpakaļ', assemblyHint: 'no aizmugures, rullīši ievilkti',
    direction: 'uz aizmuguri',
    function: 'Aizslēga rāmis vada aizslēgu ieroča darbības laikā, saspiež atgriezējatsperi un uzvelk šaušanas mehānismu.',
    explanation: 'Kad laide noņemta, stobra kārba aizmugurē ir vaļā. Pārlādēšanas rokturis atduras pret aizslēga rāmja caurules priekšgalu un izbīda rāmi uz aizmuguri, pēc tam to izvelk ar roku.',
    action: 'Velc pārlādēšanas rokturi uz aizmuguri – tas izbīda aizslēga rāmi ar aizslēgu no stobra kārbas. Satver rāmi un izvelc to pavisam, tad pārlādēšanas rokturi atbīdi uz priekšu.',
    assemblyAction: 'Ievieto aizslēga rāmi ar aizslēgu stobra kārbā no aizmugures un iebīdi līdz galam.',
    assemblyTip: 'Aizslēga bloķēšanas rullīšiem jābūt pilnībā ievilktiem aizslēgā, citādi rāmis neieslīd stobra kārbā.',
    term: 'Vāciski – Verschluss (Verschlussträger ar Verschlusskopf); pārlādēšanas rokturis – Spannhebel.',
    source: sources.handbook, sourceName: JS,
  },
  {
    id: 'grip', label: 'Atvienot pistoļveida rokturi ar šaušanas mehānismu', assemblyLabel: 'Pievienot pistoļveida rokturi ar šaušanas mehānismu',
    part: 'Pistoļveida rokturis', hint: 'sprosttapa uz sāniem, rokturis uz leju', assemblyHint: 'no apakšas, tapa vietā',
    direction: 'uz leju',
    function: 'Ļauj ērti noturēt ieroci šāviena brīdī un tēmējot; tā korpusā atrodas šaušanas mehānisms un drošinātājs-pārslēdzējs.',
    explanation: 'Kad laide noņemta, korpusa aizmuguri vairs nekas netur, bet priekšgalā to notur viena sprosttapa. Kad tā izbīdīta, rokturi kopā ar šaušanas mehānismu noņem uz leju.',
    action: 'Izbīdi uz sāniem sprosttapu šaušanas mehānisma korpusa priekšgalā. Nolaid korpusa aizmuguri un noņem pistoļveida rokturi ar šaušanas mehānismu uz leju. Sprosttapu ievieto atpakaļ korpusa atverē.',
    assemblyAction: 'Pieliec korpusa priekšgalu pie stobra kārbas, ievieto sprosttapu un pacel korpusa aizmuguri pie stobra kārbas.',
    term: 'Vāciski – Griffstück mit Abzugseinrichtung; rokasgrāmatā – šaušanas mehānisma korpuss ar pistoļveida rokturi.',
    source: sources.handbook, sourceName: JS,
  },
  {
    id: 'handguard', label: 'Noņemt pastobri', assemblyLabel: 'Uzlikt pastobri',
    part: 'Pastobre', hint: 'sprosttapa uz sāniem, priekšgals uz leju', assemblyHint: 'aizmugure kārbā, priekšgals augšā',
    direction: 'uz leju, tad uz priekšu',
    function: 'Aizsargā šāvēja rokas no sakarsušā stobra, šaujot vairākus šāvienus vai sēriju.',
    explanation: 'Pastobres aizmugure ieiet stobra kārbas padziļinājumā, bet priekšgalu pie grauda pamatnes notur sprosttapa. Tāpēc pastobri vispirms nolaiž priekšgalā un tikai tad izvelk uz priekšu.',
    action: 'Izbīdi uz sāniem sprosttapu pastobres priekšgalā. Nolaid pastobres priekšgalu un izvelc pastobri uz priekšu. Sprosttapu ievieto atpakaļ grauda pamatnes atverē.',
    assemblyAction: 'Ievirzi pastobres aizmuguri stobra kārbas padziļinājumā, pacel priekšgalu līdz grauda pamatnei un nostiprini ar sprosttapu.',
    term: 'Vāciski – Handschutz. AK-4 materiālos – pastobre, G36 materiālos bieži – pastobrs.',
    source: sources.handbook, sourceName: JS,
  },
  {
    id: 'selector', label: 'Izņemt drošinātāju-pārslēdzēju', assemblyLabel: 'Ievietot drošinātāju-pārslēdzēju',
    part: 'Drošinātājs-pārslēdzējs', hint: 'pagriez vertikāli, izbīdi uz sāniem', assemblyHint: 'ievieto vertikāli, pagriez uz S',
    direction: 'pagriežot vertikāli, uz sāniem',
    function: 'Nodrošina ieroci pret nejaušu šāvienu un ļauj izvēlēties uguns režīmu: S – drošs, P – atsevišķi šāvieni, A – automātiskā uguns.',
    explanation: 'Drošinātājs-pārslēdzējs iet cauri korpusam un šaušanas mehānismam un tur mehānismu korpusā. To var izņemt tikai vertikālā augšējā stāvoklī.',
    action: 'Nekustīgi turot pistoļveida rokturi, pagriez drošinātāju-pārslēdzēju pretēji pulksteņrādītāja virzienam vertikālā augšējā stāvoklī un izbīdi to uz sāniem no korpusa.',
    assemblyAction: 'Ievieto drošinātāju-pārslēdzēju vertikālā stāvoklī, lai tas iziet cauri šaušanas mehānismam, un pagriez to pozīcijā S (drošs).',
    term: 'Vāciski – Sicherungshebel (G3 pozīcijas S, E, F). AK-4 kursa materiālos – S, P, A.',
    source: sources.handbook, sourceName: JS,
  },
  {
    id: 'trigger', label: 'Izņemt šaušanas mehānismu', assemblyLabel: 'Ievietot šaušanas mehānismu',
    part: 'Šaušanas mehānisms', hint: 'aiz gaiļa uz augšu', assemblyHint: 'korpusā no augšas',
    direction: 'uz augšu',
    function: 'Izraisa šāvienu: nospiežot mēlīti, atbrīvo uzvilkto gaili, kas sit pa belzni.',
    explanation: 'Šaušanas mehānismā ir mēlīte, gailis un sprūda detaļas. Kad drošinātājs-pārslēdzējs izņemts, korpusā to vairs nekas netur.',
    action: 'Nekustīgi turot korpusu aiz pistoļveida roktura, satver šaušanas mehānismu aiz gaiļa un, ceļot uz augšu, izņem to no korpusa.',
    assemblyAction: 'Ievieto šaušanas mehānismu korpusā no augšas, līdz tas nosēžas vietā.',
    tip: 'Šaušanas mehānismu tālāk neizjauc – to dara tikai ieroču remonta speciālisti.',
    term: 'Vāciski – Abzugsgehäuse ar Abzugseinrichtung.',
    source: sources.handbook, sourceName: JS,
  },
  {
    id: 'bolt', label: 'Atvienot aizslēgu un belžņa ieliktni', assemblyLabel: 'Pievienot aizslēgu un belžņa ieliktni',
    part: 'Aizslēgs un belžņa ieliktnis', plural: true, hint: 'pagriez, tad uz priekšu', assemblyHint: 'uz rāmja, tad pagriez',
    direction: 'uz priekšu, pagriežot',
    function: 'Aizslēgs iebīda patronu patrontelpā, noslēdz to un izvelk čaulīti; belžņa ieliktnis izspiež aizslēga bloķēšanas rullīšus un vada belzni.',
    explanation: 'Aizslēgu aizslēga rāmī notur aizslēga sprostsvira. Pagriežot aizslēgu, sprostsvira atbrīvojas, un aizslēgu kopā ar belžņa ieliktni var novilkt no rāmja uz priekšu.',
    action: 'Stingri turi aizslēga rāmi un grozi aizslēgu pretēji pulksteņrādītāja virzienam, līdz aizslēga sprostsvira atbrīvojas. Novelc aizslēgu kopā ar belžņa ieliktni no rāmja uz priekšu.',
    assemblyAction: 'Uzbīdi belžņa ieliktni ar aizslēgu uz aizslēga rāmja līdz atdurei un pagriez aizslēgu, līdz aizslēga sprostsvira to nofiksē.',
    tip: 'Aizslēga rāmi, aizslēgu un belžņa ieliktni nesamaini ar cita ieroča detaļām – tās ir savstarpēji pielāgotas.',
    term: 'Vāciski – Verschlusskopf (aizslēgs) un Steuerstück (belžņa ieliktnis); aizslēga sprostsvira – Sperrhebel.',
    source: sources.handbook, sourceName: JS,
  },
  {
    id: 'firing-pin', label: 'Izņemt belzni un belžņa atsperi', assemblyLabel: 'Ievietot belzni un belžņa atsperi',
    part: 'Belznis un belžņa atspere', plural: true, hint: 'no rāmja uz priekšu', assemblyHint: 'rāmī no priekšpuses',
    direction: 'uz priekšu',
    function: 'Belznis ar smaili sit pa patronas kapseli un izraisa šāvienu, bet atspere atvelk belzni atpakaļ.',
    explanation: 'Belznis ar atsperi atrodas aizslēga rāmī aiz belžņa ieliktņa. Kad aizslēgs un ieliktnis noņemti, tos izņem no rāmja priekšpuses.',
    action: 'Izņem belzni un belžņa atsperi no aizslēga rāmja priekšpuses.',
    assemblyAction: 'Ievieto belzni ar atsperi aizslēga rāmī no priekšpuses.',
    term: 'Vāciski – Schlagbolzen un Schlagbolzenfeder.',
    source: sources.handbook, sourceName: JS,
  },
];

/** Not part of the scored order: always done before disassembly and after assembly. */
export const prep: Stage = {
  id: 'prep', label: 'Drošības pārbaude', part: 'Aptvere', hint: 'atvieno aptveri, pārbaudi patrontelpu',
  action: 'Nospied aptveres sprostsviru un atvieno aptveri. Pārvelc pārlādēšanas rokturi uz aizmuguri un pārliecinies, ka patrontelpā nav patronas. Atlaid rokturi un veic kontrolspiedienu.',
  explanation: 'Izjaukt drīkst tikai izlādētu ieroci. Kontrolspiedienu izdara tikai tad, kad patrontelpa pārbaudīta, un pēc tam ieroci nodrošina (S). Šis solis nav iekļauts testa secībā.',
  source: sources.handbook, sourceName: JS,
};

export const finalCheck: Stage = {
  id: 'check', label: 'Darbības pārbaude', part: 'Salikts ierocis', hint: 'S, P un A ar pārlādēšanu',
  action: 'Pozīcijā S nospied mēlīti – tā nedrīkst kustēties. Pozīcijā P turi mēlīti nospiestu, pārlādē, atlaid mēlīti (klikšķis) un nospied vēlreiz (klikšķis). Pozīcijā A turi mēlīti nospiestu, pārlādē vismaz divreiz – klikšķim nav jābūt. Beigās nodrošini ieroci (S).',
  explanation: 'Pēc salikšanas pārbaudi, vai drošinātājs-pārslēdzējs darbojas visās pozīcijās un aizslēgs pilnībā noslēdzas.',
  source: sources.zdv, sourceName: ZDV,
};

export const termNotes = steps.filter((step) => step.term);

export const technical = { calibre: '7,62 × 51 mm NATO', length: '1045 mm', barrel: '450 mm', source: sources.handbook, sourceName: JS };

/** Technical data and operation (Jaunsarga rokasgrāmata 12.1, the course presentation and ZDv 3/13). */
export const theory: TheoryQuestion[] = [
  { id: 'ammunition', prompt: 'Kādu munīciju izmanto triecienšautene AK-4?', correct: '7,62 × 51 mm NATO',
    wrong: ['5,56 × 45 mm NATO', '7,62 × 39 mm', '9 × 19 mm'],
    explanation: 'AK-4 šauj ar 7,62 × 51 mm NATO patronām.', source: sources.handbook, sourceName: JS },
  { id: 'magazine', prompt: 'Cik patronu ietilpst AK-4 aptverē?', correct: '20',
    wrong: ['10', '30', '40'],
    explanation: 'Aptveres ietilpība ir 20 patronas; pielādēta aptvere sver 0,77 kg.', source: sources.handbook, sourceName: JS },
  { id: 'principle', prompt: 'Kāds ir AK-4 darbības princips?', correct: 'Izmanto atsitiena enerģiju; aizslēga atvēršanos aizkavē bloķēšanas rullīši',
    wrong: ['Pulvergāzes darbina gāzu virzuli, un aizslēgs pagriežas', 'Aizslēgu pēc katra šāviena pārlādē ar roku', 'Pulvergāzes pēc šāviena bīda stobru uz priekšu'],
    explanation: 'Rokasgrāmatā: “visa ieroča atsitiena enerģijas izmantošana”. Aizslēgam ir bloķēšanas rullīši, kas aizkavē tā atvēršanos, kamēr lode vēl ir stobrā.', source: sources.zdv, sourceName: ZDV },
  { id: 'barrel', prompt: 'Kāds ir AK-4 stobra garums?', correct: '450 mm',
    wrong: ['228 mm', '318 mm', '600 mm'],
    explanation: 'Stobra garums ir 450 mm, ieroča garums – 1045 mm.', source: sources.handbook, sourceName: JS },
  { id: 'length', prompt: 'Kāds ir AK-4 garums?', correct: '1045 mm',
    wrong: ['716 mm', '850 mm', '1300 mm'],
    explanation: 'Ieroča garums ir 1045 mm.', source: sources.handbook, sourceName: JS },
  { id: 'mass', prompt: 'Cik sver nepielādēta AK-4?', correct: '4,5 kg',
    wrong: ['2,5 kg', '3,2 kg', '6,8 kg'],
    explanation: 'Nepielādēta triecienšautene sver 4,5 kg, ar pielādētu aptveri – 5,3 kg.', source: sources.handbook, sourceName: JS },
  { id: 'range', prompt: 'Kāds ir AK-4 efektīvais šaušanas attālums?', correct: '400 m',
    wrong: ['100 m', '800 m', '1500 m'],
    explanation: 'Efektīvais šaušanas attālums ir 400 m; lodes maksimālais lidojuma attālums – 4500 m.', source: sources.handbook, sourceName: JS },
  { id: 'rate', prompt: 'Kāds ir AK-4 šaušanas temps?', correct: '500–650 šāvienu minūtē',
    wrong: ['100–150 šāvienu minūtē', '900–1000 šāvienu minūtē', '1400–1600 šāvienu minūtē'],
    explanation: 'Šaušanas temps ir 500–650 šāvienu minūtē.', source: sources.handbook, sourceName: JS },
  { id: 'velocity', prompt: 'Kāds ir lodes sākumātrums, šaujot ar AK-4?', correct: '780–800 m/s',
    wrong: ['340–360 m/s', '500–550 m/s', '1100–1200 m/s'],
    explanation: 'Lodes sākumātrums ir 780–800 m/s.', source: sources.handbook, sourceName: JS },
  { id: 'rifling', prompt: 'Cik vītņu ir AK-4 stobrā?', correct: '4, uz labo pusi',
    wrong: ['4, uz kreiso pusi', '6, uz labo pusi', '2, uz kreiso pusi'],
    explanation: 'Stobrā ir 4 vītnes uz labo pusi, to solis ir 305 mm.', source: sources.handbook, sourceName: JS },
  { id: 'sight', prompt: 'Kādos attālumos AK-4 mehānisko tēmēkli var iestatīt?', correct: 'No 200 līdz 500 m',
    wrong: ['No 50 līdz 150 m', 'No 100 līdz 1000 m', 'No 600 līdz 1200 m'],
    explanation: 'Ar mehānisko tēmēkli notēmēti paredzēts šaut no 200 līdz 500 m.', source: sources.handbook, sourceName: JS },
  { id: 'flash-hider', prompt: 'Kāds ir liesmu slāpētāja uzdevums?', correct: 'Slāpē sadegošo pulvergāzu liesmu pēc lodes izlidošanas no stobra',
    wrong: ['Aizsargā graudu no mehāniskiem bojājumiem', 'Palielina lodes sākumātrumu', 'Notur pastobri pie stobra'],
    explanation: 'Liesmu slāpētājs slāpē sadegošo pulvergāzu liesmu un samazina ložu izkliedi, šaujot no nestabiliem stāvokļiem.', source: sources.course, sourceName: COURSE },
  { id: 'drum', prompt: 'Kāds ir mērķekļa vēzriteņa uzdevums?', correct: 'Ļauj iestatīt tēmēkli vajadzīgajam šaušanas attālumam',
    wrong: ['Aizsargā graudu no mehāniskiem bojājumiem', 'Nofiksē aptveri ligzdā', 'Pārslēdz uguns režīmu'],
    explanation: 'Mērķekļa vēzritenis ir paredzēts ieroča notēmēšanai uz mērķi vajadzīgajā attālumā.', source: sources.course, sourceName: COURSE },
  { id: 'hood', prompt: 'Kāds ir grauda aizsargredzena uzdevums?', correct: 'Aizsargā graudu no mehāniskiem bojājumiem',
    wrong: ['Iestata šaušanas attālumu', 'Slāpē liesmu pēc šāviena', 'Notur pastobres priekšgalu'],
    explanation: 'Grauda aizsargredzens pasargā graudu no tiešiem mehāniskiem bojājumiem.', source: sources.course, sourceName: COURSE },
  { id: 'rollers', prompt: 'Kas jāievēro, ievietojot aizslēga rāmi stobra kārbā?', correct: 'Aizslēga bloķēšanas rullīšiem jābūt pilnībā ievilktiem aizslēgā',
    wrong: ['Rullīšiem jābūt izvirzītiem uz āru', 'Pārlādēšanas rokturim jābūt nofiksētam aizmugurē', 'Drošinātājam-pārslēdzējam jābūt pozīcijā A'],
    explanation: 'Ja rullīši ir izvirzīti, aizslēga rāmis neieslīd stobra kārbā.', source: sources.zdv, sourceName: ZDV },
  { id: 'selector-out', prompt: 'Kādā stāvoklī drošinātāju-pārslēdzēju var izņemt no korpusa?', correct: 'Vertikālā augšējā stāvoklī',
    wrong: ['Pozīcijā S', 'Pozīcijā A', 'Jebkurā stāvoklī'],
    explanation: 'Drošinātāju-pārslēdzēju pagriež pretēji pulksteņrādītāja virzienam vertikālā augšējā stāvoklī un izbīda uz sāniem.', source: sources.handbook, sourceName: JS },
];
