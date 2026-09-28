import { photoLibrary } from '../photos';
import type { Credit, Figure, Picture, StudyModule } from '../types';
import sizes from './assets/images.json';

const photo = photoLibrary(import.meta.glob<string>('./assets/*.jpg', { eager: true, query: '?url', import: 'default' }), sizes);

const BY_SA_4 = 'https://creativecommons.org/licenses/by-sa/4.0/deed.lv';
const BY_SA_3 = 'https://creativecommons.org/licenses/by-sa/3.0/deed.lv';
const BY_2 = 'https://creativecommons.org/licenses/by/2.0/deed.lv';
const commons = (author: string, file: string, licence: string, licenceUrl: string, changes = 'izgriezts'): Credit => ({
  author, source: 'Wikimedia Commons', url: `https://commons.wikimedia.org/wiki/File:${file}`, licence, licenceUrl, changes,
});
const picture = (file: string, alt: string, credit: Credit): Picture => ({ ...photo(file), alt, credit });

const sources = {
  ial: { label: 'Ieroču aprites likums, 1. pants (termini: kalibrs, patrona, salūtpatrona, šāviņš, trasējošā munīcija)', short: 'Ieroču aprites likums', url: 'https://likumi.lv/ta/id/305818-ierocu-aprites-likums' },
  mel: { label: 'J. Melderis, „Ieroču un munīcijas uzbūves un darbības principi”, Nacionālā aizsardzības akadēmija, 2008 (2.2. nodaļa „Patronas”)', short: 'Melderis, NAA (2008)', url: 'https://virsnieki.lv/wp-content/uploads/2022/04/Ierocu-un-municijas-uzbuve-un-darbibas-principi.pdf' },
  cip: { label: 'C.I.P. patronu un patrontelpu izmēru tabulas (TDCC): 223 Rem, 308 Win (7,62 × 51), 7,62 × 39, 9 mm Luger, 50 Browning', short: 'C.I.P. izmēru tabulas', url: 'https://bobp.cip-bobp.org/uploads/tdcc/tab-i/223-rem-170406-en.pdf' },
  bw: { label: 'Bundesvērs, Zentralrichtlinie A2-222/0-0-4741 „Das Gewehr G36”: Nr. 210 (stobrs), 502–511 (salūtšaušanas ierīce), 701–711 (drošības noteikumi)', short: 'G36 rokasgrāmata (Bundesvērs)', url: 'http://bundzone.bplaced.net/images//dokumente/Zentralrichtlinie_GewehrG36.pdf' },
  jrg: { label: 'Jaunsarga rokasgrāmata: 12. nodaļa (AK-4 tehniskie dati) un šaušanas nodarbību drošības noteikumi (30.–31. punkts)', short: 'Jaunsarga rokasgrāmata', url: 'https://rojasvidusskola.lv/wp-content/uploads/2015/03/Jaunsarga-rokasgramata.pdf' },
  mk494: { label: 'Ministru kabineta 2020. gada 28. jūlija noteikumi Nr. 494 par šautuvēm un treniņšaušanas drošību, 37. punkts', short: 'MK noteikumi Nr. 494', url: 'https://likumi.lv/ta/id/316509' },
  vam: { label: 'Jaunsardzes centrs, VAM nodarbība „Šaujamieroču vēsture un munīcijas veidi” (2022)', short: 'VAM nodarbība par munīciju', url: 'https://site-710050.mozfiles.com/files/710050/1_MG_6FEB_1_prezen.pdf' },
  nammo: { label: 'Nammo produktu dati: 5,56 × 45 mm un 7,62 × 51 mm NATO trasējošās un plastmasas salūtpatronas', short: 'Nammo produktu dati', url: 'https://www.nammo.com/products/ammunition/small-caliber-ammunition/5-56mm-series/5-56-mm-x-45-nato-tracer/' },
  tm: { label: 'ASV armija, TM 43-0001-27 „Army Ammunition Data Sheets – Small Caliber Ammunition” (1994)', short: 'ASV armija, TM 43-0001-27', url: 'https://archive.org/stream/TM_43-0001-27/TM_43-0001-27_djvu.txt' },
  sas: { label: 'Small Arms Survey, „Weapons Identification Handbook”, 4. nodaļa (munīcijas marķējums, 2018)', short: 'Small Arms Survey (2018)', url: 'https://www.smallarmssurvey.org/sites/default/files/resources/SAS-HB-06-Weapons-ID-ch4.pdf' },
  saami: { label: 'American Rifleman: „.223 Remington vs. 5.56 NATO: What’s in a Name?” (SAAMI brīdinājums par 5,56 mm patronām .223 Rem ieročos)', short: 'American Rifleman / SAAMI', url: 'https://www.americanrifleman.org/content/223-remington-vs-5-56-what-s-in-a-name/' },
  simunition: { label: 'Simunition, „FX Marking Cartridges” (ražotāja apraksts)', short: 'Simunition FX', url: 'https://simunition.com/fx-training-system/' },
  course: { label: 'Kursa materiāls: salūtšaušanas ierīci sauc arī par kompensatoru (iesniedza kursa dalībnieks, 2026. gada 28. septembrī)', short: 'Kursa materiāls' },
};

const cutaway: Figure = {
  id: 'cutaway', ...photo('cutaway.jpg'),
  alt: 'Pārgriezta šautenes patrona no sāniem: lode pa labi, čaulas iekšpuse, kapsele čaulas dibenā pa kreisi',
  caption: 'Pārgriezta Šveices 7,5 × 55 mm šautenes patrona. Uzbūve ir tāda pati kā 5,56 × 45 mm un 7,62 × 51 mm NATO patronām; griezumā pulvera lādiņš ir izbērts.',
  credit: commons('BreTho', '7.5x55_Cutaway_cartridge.jpeg', 'CC BY-SA 4.0', BY_SA_4, 'pagriezts un izgriezts'),
  quiz: 'Kā sauc attēlā ar marķieri norādīto patronas daļu?',
  spots: [
    { id: 'bullet', x: 1040, y: 160, label: 'Lode', text: 'Šāviņš, kas izlido no stobra. Parastajai lodei ir apvalks (tombaka vai tērauda) un serdenis (svina vai tērauda). Lode ir nedaudz resnāka par kalibru, lai iegrieztos vītnēs.' },
    { id: 'neck', x: 865, y: 110, mx: 865, my: 28, label: 'Čaulas kakliņš', text: 'Čaulas priekšējā daļa, kurā ievalcēta (nostiprināta) lode.' },
    { id: 'body', x: 440, y: 82, mx: 440, my: 26, label: 'Čaulas korpuss', text: 'Čaulas galvenā daļa pulvera lādiņam. Čaula savieno visas patronas daļas un neļauj pulvera gāzēm izplūst aizslēga virzienā.' },
    { id: 'powder', x: 420, y: 175, label: 'Pulvera lādiņš', text: 'Bezdūmu pulveris, kas, strauji sadegot, rada gāzes – to spiediens izdzen lodi no stobra. Šajā griezumā pulveris ir izbērts.' },
    { id: 'primer', x: 44, y: 177, mx: 150, my: 322, label: 'Kapsele', text: 'Aizdedzes kapsele čaulas dibena kapseles ligzdā. No belžņa uzsitiena tās pirotehniskais maisījums uzliesmo un aizdedzina pulvera lādiņu.' },
    { id: 'groove', x: 46, y: 93, mx: 70, my: 26, label: 'Ekstrakcijas rieviņa', text: 'Ievirpota rieva čaulas dibena priekšā. Aiz tās ekstraktors izvelk čaulu no patrontelpas.' },
    { id: 'base', x: 25, y: 273, mx: 40, my: 322, label: 'Čaulas dibens', text: 'Čaulas noslēgtā daļa (pamatne) ar kapseles ligzdu un marķējumu. Patronām ar izvirzītu malu – rantīti – apzīmējumā raksta „R”.' },
  ],
};

const cartridge556: Figure = {
  id: 'cartridge-556', ...photo('cartridge-556.jpg'),
  alt: '5,56 × 45 mm NATO patrona no sāniem ar izmēru līnijām: kopgarums un čaulas garums',
  caption: '5,56 × 45 mm NATO patrona. Izmēri – pēc C.I.P. tabulām; attēls nav mērogā.',
  credit: commons('metroplex, papildinājis Shotgun', 'Patrone_5,56x45mm.jpg', 'CC BY-SA 3.0', BY_SA_3, 'pievienotas baltas malas un izmēru līnijas'),
  lines: [
    { x1: 835, y1: 95, x2: 28, y2: 95, label: 'kopgarums līdz 57,40 mm' },
    { x1: 195, y1: 280, x2: 835, y2: 280, label: 'čaulas garums 44,70 mm' },
  ],
  spots: [
    { id: 'overall', x: 150, y: 95, label: 'Kopgarums', text: 'No lodes gala līdz čaulas dibenam – ne vairāk par 57,40 mm.' },
    { id: 'case', x: 280, y: 280, label: 'Čaulas garums', text: '44,70 mm – apzīmējumā to noapaļo līdz „45”.' },
    { id: 'bullet', x: 100, y: 185, label: 'Lode', text: 'Lodes diametrs ir 5,70 mm – nedaudz vairāk par kalibru 5,56 mm, lai lode iegrieztos vītnēs.' },
  ],
};

const rifling: Figure = {
  id: 'rifling', ...photo('rifling.jpg'),
  alt: 'Šautenes stobra gals tuvplānā, stobra kanālā redzamas spirālveida vītnes',
  caption: 'Mosina karabīnes M44 (7,62 × 54R) stobra gals. Līnija rāda, kur mēra kalibru – starp pretējām stobra pamatkanāla sieniņām.',
  credit: commons('Darron Birgenheier', 'Romanian_M44_rifle_muzzle_and_bore_focus_stacked.jpg', 'CC BY 2.0', BY_2, 'izgriezts, pievienota izmēru līnija'),
  lines: [{ x1: 102, y1: 262, x2: 408, y2: 262, label: 'kalibrs 7,62 mm' }],
  spots: [
    { id: 'bore', x: 255, y: 205, label: 'Stobra kanāls', text: 'Pa to lode virzās uz stobra galu. Kanāla sieniņās iegrieztas vītnes.' },
    { id: 'grooves', x: 280, y: 301, label: 'Vītnes', text: 'Spirālveida rievas stobra kanālā: tās liek lodei griezties, un griešanās stabilizē lodi lidojumā.' },
    { id: 'muzzle', x: 55, y: 260, label: 'Stobra gals', text: 'Stobra priekšējais gals. Tam jābūt bez bojājumiem – no tā atkarīga šaušanas precizitāte.' },
  ],
};

const calibres: Figure = {
  id: 'calibres', ...photo('calibres.jpg'),
  alt: 'Četras šautenes patronas blakus: 7,62 × 39, 5,45 × 39, 5,56 × 45 un 7,62 × 51 mm',
  caption: 'Starpkalibra un šautenes patronas vienā mērogā: 7,62 × 39, 5,45 × 39, 5,56 × 45 un 7,62 × 51 mm.',
  credit: commons('Grasyl', 'Intermediate_caliber_cartridges_comparison_-_7.62x39mm,_5.45x39mm,_5.56x45mm_and_7.62x51mm_NATO.jpg', 'CC BY-SA 4.0', BY_SA_4),
  quiz: 'Kura patrona attēlā norādīta ar marķieri?',
  spots: [
    { id: '76239', x: 104, y: 520, label: '7,62 × 39 mm', text: 'Kalašņikova automātu AK-47 un AKM patrona. Kalibrs tāds pats kā 7,62 × 51 mm, bet čaula ir īsāka, tāpēc patronas nav savstarpēji aizvietojamas.' },
    { id: '54539', x: 259, y: 520, label: '5,45 × 39 mm', text: 'Triecienšautenes AK-74 patrona: mazāka kalibra lode tikpat garā 39 mm čaulā.' },
    { id: '55645', x: 420, y: 520, label: '5,56 × 45 mm NATO', text: 'G36 patrona. NATO standarts – STANAG 4172.' },
    { id: '76251', x: 576, y: 480, label: '7,62 × 51 mm NATO', text: 'AK-4 patrona. NATO standarts – STANAG 2310; civilajā tirdzniecībā līdzīgu patronu sauc par .308 Winchester.' },
  ],
};

const typesG3: Figure = {
  id: 'types-g3', ...photo('types-g3.jpg'),
  alt: 'Piecas 7,62 × 51 mm patronas: parastā, ar sarkanu galu, zila plastmasas, melna ar sadalītu galu un patrona ar rievām pie dibena',
  caption: 'Heckler & Koch G3 (AK-4 pirmtēva) 7,62 × 51 mm patronu veidi. Krāsas un izskats atkarīgi no valsts un ražotāja.',
  credit: commons('Auge=mit', 'HecklerundKoch_G3_Munitionsarten.jpg', 'CC BY-SA 4.0', BY_SA_4, 'izgriezts bez uzrakstiem'),
  quiz: 'Kāds patronas veids attēlā norādīts ar marķieri?',
  spots: [
    { id: 'ball', x: 90, y: 325, label: 'Kaujas patrona ar parasto lodi', text: 'Standarta kaujas patrona. Lodei ir apvalks un serdenis, gals bez krāsas.' },
    { id: 'tracer', x: 328, y: 325, label: 'Trasējošā patrona', text: 'Lodes gals nokrāsots sarkanā krāsā. Lodes aizmugurē ir trasējošais sastāvs, kas lidojumā deg un padara trajektoriju redzamu.' },
    { id: 'plastic', x: 570, y: 325, label: 'Patrona ar plastmasas lodi', text: 'Mācību šaušanai nelielos attālumos. Plastmasas lode lido īsāk, bet arī tā ir bīstama.' },
    { id: 'blank', x: 840, y: 325, label: 'Salūtpatrona', text: 'Patrona bez lodes: tās vietā saspiests čaulas kakliņš vai plastmasas uzgalis, kas šāvienā sadrūp. Automātiski šauj tikai ar salūtšaušanas ierīci (kompensatoru).' },
    { id: 'drill', x: 1085, y: 325, label: 'Mācību patrona', text: 'Bez pulvera lādiņa un kapseles, atpazīstama pēc rievām čaulā. Lieto pielādēšanas, izlādēšanas un ieroča pārbaudes treniņiem.' },
  ],
};

const typesSweden: Figure = {
  id: 'types-sweden', ...photo('types-sweden.jpg'),
  alt: 'Trīs 7,62 × 51 mm patronas: ar vara krāsas lodi, ar baltu lodes galu un ar sarkanu plastmasas uzgali; blakus 5 cm mērogs',
  caption: 'Zviedrijas Zemessardzes (Hemvärnet) 7,62 × 51 mm patronas triecienšautenei AK 4: tā pati patronu grupa, bet citas krāsas.',
  credit: commons('Indianarrow', '7.62×51mmNATO.jpg', 'CC BY-SA 3.0', BY_SA_3, 'izgriezts, noņemti cipari'),
  spots: [
    { id: 'ball', x: 125, y: 390, label: 'Kaujas patrona', text: 'Parastā lode ar tombaka apvalku, bez krāsas marķējuma.' },
    { id: 'tracer', x: 360, y: 390, label: 'Trasējošā patrona', text: 'Zviedrijā trasējošās lodes gals ir balts – nevis sarkans vai oranžs kā citviet.' },
    { id: 'blank', x: 575, y: 390, label: 'Salūtpatrona', text: 'Lodes vietā sarkans plastmasas uzgalis.' },
  ],
};

const headstamps: Figure = {
  id: 'headstamps', ...photo('headstamps.jpg'),
  alt: 'Divu patronu čaulu dibeni: pa kreisi ar uzrakstu FC 223 REM, pa labi ar LC 99 un NATO krustu aplī',
  caption: 'Čaulu dibeni: pa kreisi civilā .223 Remington patrona, pa labi militārā 5,56 × 45 mm patrona ar NATO marķējumu.',
  credit: commons('Static-rat', 'Two_223_Headstamps.jpg', 'CC BY-SA 3.0', BY_SA_3),
  quiz: 'Kas attēlā norādīts ar marķieri?',
  spots: [
    { id: 'rem', x: 135, y: 435, label: 'Patronas apzīmējums „223 REM”', text: 'Civilā patrona .223 Remington (ražotājs „FC” – Federal Cartridge). Izskatās kā 5,56 × 45 mm, bet nav tā pati patrona.' },
    { id: 'primer', x: 1240, y: 315, label: 'Kapsele', text: 'Kapsele čaulas dibena centrā. Neizšautai patronai tā ir gluda – bez belžņa iespieduma.' },
    { id: 'nato', x: 1180, y: 105, label: 'NATO krusts aplī', text: 'NATO marķējums: patrona ir pārbaudīta un atbilst sava kalibra NATO standartam.' },
    { id: 'maker', x: 1155, y: 500, label: 'Ražotāja kods „LC”', text: 'Ražotājs – Lake City (ASV).' },
    { id: 'year', x: 1425, y: 400, label: 'Izgatavošanas gads „99”', text: 'Gada pēdējie divi cipari – 1999. gads.' },
  ],
};

export const ammo: StudyModule = {
  id: 'municija', name: 'Munīcija', genitive: 'Munīcijas', kicker: 'MUNĪCIJA', codePrefix: 'MU',
  title: 'PATRONAS <em>UZBŪVE UN VEIDI.</em>',
  lead: 'No kā sastāv patrona, ko nozīmē „5,56 × 45 mm NATO”, kā atpazīt kaujas, trasējošās, salūta un mācību patronas un kā ar munīciju rīkoties droši. Uz fotoattēliem izvēlies numuru, lai redzētu skaidrojumu.',
  summary: 'Patronas uzbūve, kalibrs un apzīmējumi, patronu veidi (kaujas, trasējošās, salūta, mācību u. c.), marķējums un drošība – ar fotoattēliem un pārbaudi.',
  notice: 'Termini ņemti no Ieroču aprites likuma un NAA mācību grāmatas, izmēri – no C.I.P. tabulām, drošības noteikumi – no normatīvajiem aktiem un G36 rokasgrāmatas. Krāsu marķējums dažādās valstīs atšķiras. Ar munīciju rīkojas tikai instruktora vadībā.',
  sources,
  chapters: [
    {
      number: '01', title: 'Patronas uzbūve',
      lead: 'Patrona ir munīcijas vienība vienam šāvienam: vienā veselumā apvienota lode, čaula, pulvera lādiņš un kapsele.',
      sources: ['ial', 'mel', 'bw'],
      blocks: [
        { kind: 'text', paragraphs: [
          'Ieroču aprites likumā **patrona** ir munīcija (ar šāviņu vai bez tā), kurā vienā veselumā apvienots šaujampulveris vai cits propelents, aizdedzināšanas ierīce (kapsele) un čaula. Šaujamieroča patronas četras daļas ir **lode**, **čaula**, **pulvera lādiņš** un **kapsele**.',
          'Čaulu izgatavo no misiņa vai mīksta tērauda. Tai ir korpuss pulvera lādiņam, kakliņš lodes nostiprināšanai un dibens (pamatne) ar kapseles ligzdu. Bezflanča čaulai dibena priekšā ir ievirpota ekstrakcijas rieviņa, flanča čaulai – izvirzīta mala (rantīte).',
        ] },
        { kind: 'figure', figure: cutaway },
        { kind: 'sequence', title: 'Kā notiek šāviens', items: [
          { title: 'Belznis sit pa kapseli', text: 'Kapseles pirotehniskais maisījums no uzsitiena uzliesmo.' },
          { title: 'Liesma aizdedzina pulvera lādiņu', text: 'Caur atveri kapseles ligzdā liesma nokļūst čaulā.' },
          { title: 'Pulveris strauji sadeg', text: 'Rodas pulvera gāzes, un spiediens čaulā strauji pieaug.' },
          { title: 'Gāzes izdzen lodi', text: 'Lodes apvalks iegriežas stobra vītnēs, lode sāk griezties un izlido no stobra.' },
          { title: 'Čaulu izvelk un izmet', text: 'Šāviena brīdī čaula noblīvē patrontelpu; pēc tam ekstraktors aiz rieviņas to izvelk un izmet.' },
        ] },
        { kind: 'cards', title: 'Lodes uzbūve', cards: [
          { id: 'ball-bullet', kicker: 'PARASTĀ LODE', title: 'Apvalks un serdenis', text: 'Apvalks (tombaka vai tērauda, pārklāts ar tombaku) iegriežas vītnēs un saglabā lodes formu. Iekšā ir svina vai tērauda serdenis, bieži ar svina starpslāni.' },
          { id: 'ss109', kicker: '5,56 MM NATO', title: 'SS109 lode', text: 'Standarta NATO 5,56 mm lodes priekšpusē ir tērauda serdenis, aiz tā – svins. Garākai lodei vajag straujāku vītņu soli: 178 mm iepriekšējo 305 mm vietā (ASV to ražo kā M855).' },
          { id: 'tracer-bullet', kicker: 'TRASĒJOŠĀ LODE', title: 'Trasējošais sastāvs', text: 'Lodes aizmugurē ir stobriņš ar trasējošo pirotehnisko sastāvu. Šāvienā to aizdedzina pulvera lādiņš, un deguma sliede padara lodes ceļu redzamu.' },
        ] },
      ],
    },
    {
      number: '02', title: 'Kalibrs un apzīmējumi',
      lead: 'Patronas apzīmējums pasaka divus galvenos izmērus: kalibru un čaulas garumu. Pēc tā izvēlas patronu ierocim – pēc līdzīga izskata ne.',
      sources: ['ial', 'mel', 'cip', 'bw', 'jrg', 'saami'],
      blocks: [
        { kind: 'decode', title: 'Ko nozīmē „5,56 × 45 mm NATO”', parts: [
          { value: '5,56', label: 'Kalibrs', text: 'Stobra kanāla diametrs milimetros, mērīts starp diametrāli pretējām stobra pamatkanāla sieniņām – nevis vītņu dziļumā. Lode ir resnāka – 5,70 mm –, lai iegrieztos vītnēs.' },
          { value: '× 45', label: 'Čaulas garums', text: 'Čaulas garums milimetros (precīzi 44,70 mm). Tas vajadzīgs, jo viena kalibra patronas ar dažādām čaulām nav aizvietojamas.' },
          { value: 'mm', label: 'Mērvienība', text: 'Metriskais apzīmējums. ASV un Lielbritānijā kalibru raksta collu daļās, piemēram, .223 vai .308.' },
          { value: 'NATO', label: 'Standarts', text: 'Patrona atbilst NATO standartam (5,56 mm – STANAG 4172, 7,62 mm – STANAG 2310). Uz čaulas dibena to rāda NATO krusts aplī.' },
        ] },
        { kind: 'figure', figure: cartridge556 },
        { kind: 'figure', figure: rifling },
        { kind: 'text', paragraphs: [
          'Ieroču aprites likums kalibru definē kā šaujamieroča stobra iekšējo diametru vai šāviņa un čaulas nosacīto izmēru. Patronai ar izvirzītu dibena malu (flanci, rantīti) apzīmējumā pievieno burtu **„R”**, piemēram, 7,62 × 54R.',
          'G36 stobrā ir **6 vītnes** uz labo pusi ar soli 178 mm, AK-4 stobrā – **4 vītnes** uz labo pusi ar soli 305 mm.',
        ] },
        { kind: 'figure', figure: calibres },
        { kind: 'table', caption: 'Izmēri milimetros (C.I.P. tabulas)', head: ['Patrona', 'Kalibrs', 'Lode', 'Čaula', 'Kopgarums', 'Ierocis'], rows: [
          ['5,56 × 45 mm NATO', '5,56', '5,70', '44,70', '57,40', 'G36'],
          ['7,62 × 51 mm NATO', '7,62', '7,85', '51,18', '71,12', 'AK-4'],
          ['7,62 × 39 mm', '7,62', '7,92', '38,70', '56,00', 'AK-47, AKM'],
          ['9 × 19 mm', '8,82', '9,03', '19,15', '29,69', 'Glock 17'],
          ['12,7 × 99 mm', '12,66', '12,98', '99,31', '138,43', 'lielkalibra ložmetēji'],
        ] },
        { kind: 'callout', tone: 'safety', title: 'Līdzīgs nenozīmē aizvietojams', text: '7,62 × 39 mm un 7,62 × 51 mm patronām ir vienāds kalibrs, bet dažāda čaula – tās nevar aizvietot. Arī .223 Remington un 5,56 × 45 mm NATO nav vienādas: 5,56 mm NATO patronu šaut ierocī ar .223 Remington patrontelpu nav droši, jo tai ir lielāks spiediens.' },
      ],
    },
    {
      number: '03', title: 'Patronu veidi',
      lead: 'Pēc uzdevuma patronas ir kaujas, trasējošās, salūta, mācību, simulācijas un speciālās. Tās atpazīst pēc lodes gala krāsas, lodes formas un čaulas.',
      sources: ['ial', 'mel', 'bw', 'nammo', 'tm', 'sas', 'simunition', 'vam', 'course'],
      blocks: [
        { kind: 'figure', figure: typesG3 },
        { kind: 'cards', title: 'Patronu veidi', cards: [
          { id: 'ball', kicker: 'STANDARTA', title: 'Kaujas patrona', swatch: { colours: ['#6f8f3a', '#b98a4e'], label: 'NATO 5,56 mm: zaļš gals vai bez krāsas' },
            text: 'Kaujas patrona ar **parasto lodi** – dzīvā spēka un neaizsargātu mērķu iznīcināšanai. Šaušanā tā ir „standarta” patrona.',
            facts: [{ label: 'Piemēri', value: 'SS109 / M855 / DM11 – zaļš gals; M193, DM41 – bez krāsas' }] },
          { id: 'tracer', kicker: 'TRASĒJOŠĀ', title: 'Trasējošā patrona', swatch: { colours: ['#c8302b', '#e07b24'], label: 'Bieži sarkans vai oranžs gals' },
            text: 'Lodē ir pirotehniskais sastāvs, kura degšana padara redzamu lodes trajektoriju. To lieto uguns koriģēšanai, mērķu norādīšanai un signāliem.',
            facts: [{ label: 'Trase', value: 'Sākas ne tālāk kā ~140 m no stobra un redzama vismaz līdz 600 m (ražotāju dati)' }, { label: 'Piemēri', value: 'DM21 – sarkans; M856, M62 – oranžs' }] },
          { id: 'blank', kicker: 'SALŪTA', title: 'Salūtpatrona', text: 'Patrona **bez šāviņa** – šaušanas imitācijai, salutēšanai vai signāla došanai. Čaulas kakliņš ir saspiests (zvaigznītē) vai noslēgts ar plastmasas uzgali.',
            facts: [{ label: 'Ierocis', value: 'Automātiskai šaušanai vajag salūtšaušanas ierīci (kompensatoru) uz stobra' }] },
          { id: 'drill', kicker: 'MĀCĪBU', title: 'Mācību patrona', text: 'Bez pulvera lādiņa un kapseles – ieroča pielādēšanas, izlādēšanas un pārbaudes treniņiem. Atpazīst pēc rievām, caurumiem vai iespiedumiem čaulā un tukšas kapseles ligzdas.',
            facts: [{ label: 'Piemēri', value: 'M199 – 6 rievas; vācu mācību patronas – niķelētas vai melnas plastmasas' }] },
          { id: 'ap', kicker: 'BRUŅUSITĒJA', title: 'Bruņusitēja patrona', swatch: { colours: ['#1b1b1b'], label: 'ASV: melns gals' },
            text: 'Lodei ir ciets serdenis vieglu bruņu caursišanai. Ieroču aprites likumā bruņusitēja, trasējošā un aizdedzinošā munīcija ir A kategorijā.',
            facts: [{ label: 'Piemēri', value: 'M995 (5,56 mm), M61 (7,62 mm)' }] },
          { id: 'api', kicker: 'AIZDEDZINOŠĀ', title: 'Bruņusitēja aizdedzinošā', swatch: { colours: ['#b9bcc0'], label: 'NATO: sudraba gals' },
            text: 'Lodes aizdedzinošais sastāvs pēc trāpījuma uzliesmo un var aizdedzināt degvielu, munīciju un citus viegli degošus priekšmetus.',
            facts: [{ label: 'Varšavas līgums', value: 'Melns gals ar sarkanu gredzenu' }] },
          { id: 'fx', kicker: 'SIMULĀCIJAS', title: 'Simulācijas patrona', picture: picture('fx.jpg', 'Simulācijas patronu kārba „FX Marking Cartridges”, zila lādēšanas plāksnīte un patrona ar rozā krāsas uzgali', commons('Syncro2000', 'FX_Patrone.jpg', 'CC BY-SA 4.0', BY_SA_4)),
            text: 'Divpusējiem treniņiem: lode ar samazinātu enerģiju atstāj krāsas traipu. Ierocim vajag pārveidošanas komplektu, kas neļauj ielādēt kaujas patronas.',
            facts: [{ label: 'Drošība', value: 'Sejas aizsargmaska obligāta' }] },
          { id: 'plastic', kicker: 'TRENIŅU', title: 'Patrona ar plastmasas lodi', text: 'Mācību šaušanai nelielos attālumos (piem., vācu DM38, ASV M862 ar zilu lodi). G36 rokasgrāmata brīdina: bīstamajā zonā arī plastmasas lode var smagi ievainot vai nogalināt.' },
          { id: 'subsonic', kicker: 'ZEMSKAŅAS', title: 'Zemskaņas patrona', text: 'Lode lido lēnāk par skaņu. Lieto ieročos ar trokšņa slāpētāju, lai šāviens būtu klusāks.' },
        ] },
        { kind: 'figure', figure: typesSweden },
        { kind: 'cards', title: 'Salūtšaušanas ierīce jeb kompensators', cards: [
          { id: 'mpg', kicker: 'G3 / G36', title: 'Salūtšaušanas ierīce', picture: picture('mpg.jpg', 'Metāla salūtšaušanas ierīce G3 un G36 šautenei no sāniem ar regulējamu sprauslas skrūvi', commons('Auge=mit', 'G3_G36_MPG_ManoeverPatronenGeraet.jpg', 'CC BY-SA 4.0', BY_SA_4, 'izgriezts viens skats')),
            facts: [{ label: 'Sauc arī', value: 'kompensators (kursā)' }],
            text: 'Uzskrūvē uz stobra liesmu slāpētāja vietā (vāciski Manöverpatronengerät, MPG); kursā to sauc arī par **kompensatoru**. Tā sašaurina izeju pulvera gāzēm, un spiediens darbina aizslēgu. Ierīce ir matēti hromēta, lai to nesajauktu ar liesmu slāpētāju.' },
        ] },
        { kind: 'callout', tone: 'safety', title: 'Salūtpatrona nav nekaitīga', text: 'G36 rokasgrāmata: bez salūtšaušanas ierīces (kompensatora) šaut ar salūtpatronām aizliegts; salūta munīciju izsniedz tikai tad, kad nevienam nav kaujas munīcijas; īpaši naktī un uzbrukumā jāievēro vismaz 10 m drošības attālums. Pēc treniņa ieroci izlādē, pārbauda un neizšautās patronas nodod.' },
        { kind: 'callout', tone: 'note', title: 'Krāsas atšķiras', text: 'Krāsu marķējums nav vienots: NATO munīcijā zaļš gals nozīmē parasto lodi, bet Varšavas līguma munīcijā – trasējošo; Zviedrijas trasējošajai lodei gals ir balts. Patronas veidu vienmēr pārbauda arī pēc iepakojuma marķējuma.' },
      ],
    },
    {
      number: '04', title: 'Marķējums un drošība',
      lead: 'Marķējums uz čaulas dibena un iepakojuma pasaka, kas, kur un kad patronu izgatavojis. Drošības noteikumi pasaka, kā ar to rīkoties.',
      sources: ['mel', 'sas', 'bw', 'jrg', 'mk494', 'vam'],
      blocks: [
        { kind: 'figure', figure: headstamps },
        { kind: 'text', paragraphs: [
          'Patronu marķējumā ietilpst patronas tips, izgatavošanas gads un **partija**, valsts un ražotājs un krāsu marķējums. Daļu no tā iespiež čaulas dibenā, pārējo raksta uz kārbām un kastēm; kastēm ar speciālo ložu patronām uzkrāso svītras lodes gala krāsā.',
          'Vienas partijas patronām ir viena pulvera un kapseļu partija. Ja kādas partijas patronas izrādās nederīgas, no lietošanas izņem visu partiju.',
        ] },
        { kind: 'list', title: 'Glabāšana un apiešanās', items: [
          'Munīciju tur tīru un sausu, sargā no saules un ūdens un **neeļļo**.',
          'Patronas neizjauc un neizmanto kā instrumentu.',
          'Netīras, oksidētas, bojātas patronas un patronas ar vaļīgu lodi nešauj – tās nodod atpakaļ. Belžņa nospiedums pēc pielādēšanas patronu par bojātu nepadara.',
          'Vienlaikus lieto tikai vienu munīcijas veidu: kaujas, treniņu, salūta vai mācību munīciju nejauc kopā.',
          'Munīciju un čaulītes no šaušanas vietas neiznes, un nesprāgušas patronas atkārtoti neizmanto.',
        ] },
        { kind: 'sequence', title: 'Ja patrona nenošauj', lead: 'Šautuvēs pēc MK noteikumiem Nr. 494 (37. punkts):', items: [
          { title: 'Tur ieroci mērķa virzienā vismaz 10 sekundes', text: 'Patrona var aizdegties ar nokavēšanos, tāpēc stobru uzreiz nenovērš no mērķa.' },
          { title: 'Brīdini apkārtējos', text: 'Joprojām turot ieroci mērķa virzienā. Mācībās: pārtrauc šaušanu, pacel roku (guļus – labo kāju) un gaidi instruktora norādījumus.' },
          { title: 'Izlādē ieroci', text: 'Ievērojot drošības pasākumus un instruktora norādījumus. Nesprāgušo patronu nodod – atkārtoti to neizmanto.' },
        ] },
      ],
    },
  ],
  questions: [
    // 01 · Patronas uzbūve
    { id: 'parts', chapter: '01', source: 'mel', prompt: 'No kādām četrām daļām sastāv šaujamieroča patrona?', correct: 'Lode, čaula, pulvera lādiņš un kapsele', wrong: ['Lode, stobrs, aizslēgs un kapsele', 'Lode, aptvere, pulvera lādiņš un belznis', 'Čaula, deglis, detonators un lode'], explanation: 'Patronu veido lode, čaula, pulvera lādiņš un aizdedzes kapsele.' },
    { id: 'primer', chapter: '01', source: 'mel', prompt: 'Kāds ir kapseles uzdevums?', correct: 'No belžņa uzsitiena aizdedzināt pulvera lādiņu', wrong: ['Nostiprināt lodi čaulas kakliņā līdz pat šāvienam', 'Izvilkt čaulu no patrontelpas pēc šāviena', 'Piešķirt lodei griešanos stobrā'], explanation: 'Kapseles pirotehniskais maisījums no uzsitiena uzliesmo un aizdedzina pulvera lādiņu.' },
    { id: 'case-role', chapter: '01', source: 'mel', prompt: 'Kāds ir čaulas uzdevums?', correct: 'Savienot daļas un neļaut gāzēm izplūst atpakaļ', wrong: ['Stabilizēt lodi lidojumā, piešķirot tai griešanos', 'Padarīt lodes trajektoriju redzamu', 'Samazināt stobra uzkaršanu šaujot'], explanation: 'Čaula savieno visas patronas daļas, aizsargā pulvera lādiņu un neļauj pulvera gāzēm izplūst aizslēga virzienā.' },
    { id: 'neck', chapter: '01', source: 'mel', prompt: 'Kurā čaulas daļā nostiprina lodi?', correct: 'Čaulas kakliņā', wrong: ['Kapseles ligzdā', 'Ekstrakcijas rieviņā', 'Čaulas dibenā'], explanation: 'Čaulai ir korpuss pulvera lādiņam, kakliņš lodes nostiprināšanai un dibens ar kapseles ligzdu.' },
    { id: 'groove', chapter: '01', source: 'mel', prompt: 'Kam paredzēta ekstrakcijas rieviņa čaulas dibena priekšā?', correct: 'Lai ekstraktors izvilktu čaulu no patrontelpas', wrong: ['Lai lode ciešāk turētos čaulā', 'Lai pulvera gāzes pēc šāviena izplūstu uz sāniem', 'Lai patronu varētu atšķirt tumsā'], explanation: 'Bezflanča čaulai ir ievirpota ekstrakcijas rieviņa, aiz kuras ekstraktors čaulu izvelk un izmet.' },
    { id: 'jacket', chapter: '01', source: 'mel', prompt: 'No kā sastāv parastā lode?', correct: 'No apvalka un svina vai tērauda serdeņa', wrong: ['No plastmasas uzgaļa un pulvera', 'No trasējošā sastāva un kapseles', 'No viengabala svina bez jebkāda apvalka'], explanation: 'Parastajai lodei ir tombaka vai tērauda apvalks un svina vai tērauda serdenis, bieži ar svina starpslāni.' },
    { id: 'ss109', chapter: '01', source: 'mel', prompt: 'Kas raksturīgs standarta NATO 5,56 mm lodei SS109?', correct: 'Tās priekšpusē ir tērauda serdenis', wrong: ['Tā ir no plastmasas un sadrūp', 'Tās galā ir trasējošais sastāvs', 'Tai nav apvalka, tikai svina serde'], explanation: 'SS109 lodes priekšpusē ir tērauda serdenis, aiz tā – svins; ASV to ražo kā M855.' },
    { id: 'twist', chapter: '01', source: 'mel', prompt: 'Kāpēc SS109 lodei vajadzēja stobru ar vītņu soli 178 mm iepriekšējo 305 mm vietā?', correct: 'Lai garākā lode lidojumā būtu stabila', wrong: ['Lai patronas ietilptu īsākā un vieglākā aptverē', 'Lai samazinātu šāviena troksni', 'Lai stobrs mazāk uzkarstu'], explanation: 'Garākai SS109 lodei stabilitātei vajadzēja straujāku griešanos – vītņu soli samazināja no 305 līdz 178 mm.' },
    { id: 'shot-order', chapter: '01', source: 'mel', prompt: 'Kas notiek tūlīt pēc tam, kad kapsele aizdedzina pulvera lādiņu?', correct: 'Pulveris sadeg, un gāzu spiediens izdzen lodi', wrong: ['Ekstraktors izvelk čaulu no patrontelpas', 'Belznis vēlreiz uzsit pa kapseli', 'Lode vispirms atdalās no čaulas ar atsperes spēku'], explanation: 'Sadegot pulverim, rodas gāzes; to spiediens izdzen lodi caur stobru, un lode iegriežas vītnēs.' },
    // 02 · Kalibrs un apzīmējumi
    { id: 'calibre', chapter: '02', source: 'mel', prompt: 'Kā mēra vītņota stobra kalibru?', correct: 'Starp pretējām stobra pamatkanāla sieniņām', wrong: ['Starp pretējām vītnēm to pašā dziļākajā vietā', 'Pa lodes lielāko diametru pie čaulas', 'Pa stobra ārējo diametru pie tievgaļa'], explanation: 'Vītņotam stobram kalibru mēra starp diametrāli pretējām stobra pamatkanāla sieniņām, nevis vītņu dziļumā.' },
    { id: 'first-number', chapter: '02', source: 'mel', prompt: 'Ko apzīmējumā „5,56 × 45 mm” nozīmē „5,56”?', correct: 'Kalibru – stobra kanāla diametru milimetros', wrong: ['Čaulas garumu milimetros', 'Lodes masu gramos', 'Patronas kopgarumu centimetros'], explanation: '5,56 ir kalibrs, 45 – čaulas garums milimetros.' },
    { id: 'second-number', chapter: '02', source: 'cip', prompt: 'Ko apzīmējumā „5,56 × 45 mm” nozīmē „45”?', correct: 'Čaulas garumu milimetros', wrong: ['Lodes masu gramos', 'Patronas kopgarumu milimetros', 'Vītņu soli milimetros'], explanation: 'Čaulas garums pēc C.I.P. tabulām ir 44,70 mm – apzīmējumā to noapaļo līdz 45.' },
    { id: 'bullet-diameter', chapter: '02', source: 'cip', prompt: 'Kāpēc 5,56 mm patronas lodes diametrs ir 5,70 mm?', correct: 'Lai lode iegrieztos vītnēs un sāktu griezties', wrong: ['Lai lode brīvi izslīdētu pa stobru', 'Lai kompensētu lodes rūsēšanu glabāšanā', 'Lai lodi varētu izšaut arī no 7,62 mm kalibra stobra'], explanation: 'Lode ir nedaudz resnāka par stobra pamatkanālu – tā iegriežas vītnēs un saņem griešanos.' },
    { id: 'case-length', chapter: '02', source: 'mel', prompt: 'Kāpēc patronas apzīmējumā raksta arī čaulas garumu?', correct: 'Viena kalibra patronas ar dažādu čaulu nav aizvietojamas', wrong: ['Tas nosaka lodes gala krāsu', 'Pēc tā nosaka izgatavošanas gadu', 'Tas norāda, cik patronu ietilpst ieroča standarta aptverē'], explanation: 'Viena kalibra patronas ar dažādiem čaulu izmēriem un formām viena otru nevar aizvietot, tāpēc apzīmējumā norāda čaulas garumu.' },
    { id: 'rimmed', chapter: '02', source: 'mel', prompt: 'Ko patronas apzīmējumā, piemēram, „7,62 × 54R”, nozīmē burts „R”?', correct: 'Čaulai ir izvirzīta dibena mala – rantīte', wrong: ['Patrona ir paredzēta revolverim', 'Lodei ir sarkans trasējošais gals', 'Patronu izgatavojusi Krievija'], explanation: 'Rantīšu (flanča) patronu čaulas apzīmē ar burtu „R” (vāciski Rand).' },
    { id: 'same-calibre', chapter: '02', source: 'cip', prompt: 'Vai 7,62 × 39 mm patronu var izšaut ar AK-4, kam vajag 7,62 × 51 mm patronu?', correct: 'Nē – kalibrs vienāds, bet čaula ir cita', wrong: ['Jā – izšķirošs ir tikai kalibrs', 'Jā, ja aptverē ielādē mazāk patronu nekā parasti', 'Tikai ar salūtšaušanas ierīci'], explanation: 'Abām patronām kalibrs ir 7,62 mm, bet čaula ir 38,70 un 51,18 mm gara – patronas nav aizvietojamas.' },
    { id: 'rem223', chapter: '02', source: 'saami', prompt: 'Vai 5,56 × 45 mm NATO patronu droši var izšaut ierocī ar .223 Remington patrontelpu?', correct: 'Nē – NATO patronai ir lielāks spiediens', wrong: ['Jā – tās ir vienādas patronas', 'Jā, bet tikai ar trasējošām vai mācību patronām', 'Nē – NATO patronai ir cits kalibrs'], explanation: 'SAAMI brīdina: 5,56 mm NATO patrona .223 Remington patrontelpā var radīt bīstamu spiedienu. Otrādi – .223 Rem patrona 5,56 mm patrontelpā – ir droši.' },
    { id: 'g36-rifling', chapter: '02', source: 'bw', prompt: 'Cik vītņu ir G36 stobrā?', correct: '6, uz labo pusi', wrong: ['4, uz labo pusi', '6, uz kreiso pusi', '8, uz kreiso pusi'], explanation: 'G36 stobrā ir 6 vītnes uz labo pusi ar soli 178 mm.' },
    { id: 'stanag', chapter: '02', source: 'mel', prompt: 'Ko uz čaulas dibena nozīmē NATO krusts aplī?', correct: 'Patrona atbilst NATO standartam', wrong: ['Patrona ir mācību patrona bez pulvera', 'Patrona ir izgatavota pirms 1949. gada', 'Patronu drīkst šaut tikai ložmetējā'], explanation: 'Patronām, kas atbilst NATO standartam, uz čaulas dibena uzliek NATO marķējumu – krustu aplī.' },
    { id: 'inch', chapter: '02', source: 'mel', prompt: 'Kā ASV parasti apzīmē patronu kalibru?', correct: 'Collu simtdaļās, piemēram, .30', wrong: ['Milimetros ar čaulas garumu', 'Lodes masā gramos', 'Ar lodes gala krāsu'], explanation: 'ASV kalibru izsaka collu simtdaļās, Lielbritānijā – tūkstošdaļās, ar punktu priekšā: .30 vai .300.' },
    // 03 · Patronu veidi
    { id: 'blank-def', chapter: '03', source: 'ial', prompt: 'Kas pēc Ieroču aprites likuma ir salūtpatrona?', correct: 'Patrona bez šāviņa šaušanas imitācijai vai signāliem', wrong: ['Patrona ar plastmasas lodi mācību šaušanai', 'Patrona bez pulvera un kapseles treniņiem', 'Patrona ar krāsas lodi divpusējām mācībām'], explanation: 'Salūtpatrona ir patrona, kurai nav šāviņa un kura paredzēta šaušanas imitācijai, salutēšanai vai signāla došanai.' },
    { id: 'tracer-def', chapter: '03', source: 'ial', prompt: 'Kas raksturīgs trasējošai munīcijai?', correct: 'Pirotehnisks sastāvs lodē padara trajektoriju redzamu', wrong: ['Lodei ir cieta tērauda serdenis vieglu bruņu caursišanai', 'Lodi aizstāj plastmasas uzgalis', 'Čaulā nav ne pulvera, ne kapseles'], explanation: 'Trasējošās munīcijas lodē ir pirotehnisks sastāvs, kura degšana padara redzamu lodes trajektoriju.' },
    { id: 'tracer-use', chapter: '03', source: 'mel', prompt: 'Kādam nolūkam lieto trasējošās patronas?', correct: 'Uguns koriģēšanai un mērķu norādīšanai', wrong: ['Klusai šaušanai ar trokšņa slāpētāju naktī', 'Ieroča pielādēšanas treniņiem', 'Bruņutehnikas aizdedzināšanai'], explanation: 'Trase rāda lodes ceļu, tāpēc trasējošās patronas lieto uguns koriģēšanai, mērķu norādīšanai un signāliem.' },
    { id: 'drill-def', chapter: '03', source: 'mel', prompt: 'Kā atpazīst mācību patronu?', correct: 'Tai nav pulvera un kapseles, čaulā ir rievas vai caurumi', wrong: ['Tās lodes gals ir nokrāsots sarkanā krāsā', 'Tai nav lodes, bet čaulas kakliņš ir saspiests', 'Tās čaula ir no alumīnija, un lode ir melna'], explanation: 'Mācību patronai nav pulvera lādiņa un kapseles; to apzīmē ar rievām, caurumiem vai iespiedumiem čaulā.' },
    { id: 'drill-use', chapter: '03', source: 'mel', prompt: 'Kam paredzētas mācību patronas?', correct: 'Ieroča pielādēšanas un pārbaudes treniņiem', wrong: ['Šaušanai divpusējās mācībās ar aizsargmaskām', 'Salutēšanai svinīgos pasākumos', 'Šaušanai nelielos attālumos šautuvē'], explanation: 'Mācību patronas bez pulvera lādiņa izmanto, trenējoties darbā ar ieroci vai to pārbaudot.' },
    { id: 'blank-adapter', chapter: '03', source: 'bw', prompt: 'Ko uzskrūvē uz G36 stobra, lai automātiski šautu ar salūtpatronām?', correct: 'Salūtšaušanas ierīci liesmu slāpētāja vietā', wrong: ['Trokšņa slāpētāju virs liesmu slāpētāja', 'Otru liesmu slāpētāju ar daudz šaurāku atveri', 'Neko – salūtpatronas šauj bez ierīcēm'], explanation: 'Liesmu slāpētāju noskrūvē un uzskrūvē salūtšaušanas ierīci (MPG); bez tās šaut ar salūtpatronām aizliegts.' },
    { id: 'blank-adapter-name', chapter: '03', source: 'course', prompt: 'Kā kursā sauc arī salūtšaušanas ierīci?', correct: 'Par kompensatoru', wrong: ['Par trokšņa slāpētāju', 'Par čaulu savācēju', 'Par aizslēga buferi'], explanation: 'Salūtšaušanas ierīci (vāciski Manöverpatronengerät) kursā sauc arī par kompensatoru; to uzskrūvē uz stobra liesmu slāpētāja vietā.' },
    { id: 'blank-how', chapter: '03', source: 'bw', prompt: 'Kāpēc ar salūtpatronām vajag salūtšaušanas ierīci?', correct: 'Tā rada gāzu spiedienu, kas pārlādē ieroci', wrong: ['Tā aiztur salūtpatronas lodi stobrā', 'Tā padara šāviena liesmu redzamāku', 'Tā atdzesē stobru pēc katra salūtpatronas šāviena'], explanation: 'Ierīces sprauslas skrūve regulē gāzu izplūdi; ja spiediens ir par mazu, aizslēgs neatiet un čaula netiek izmesta.' },
    { id: 'blank-distance', chapter: '03', source: 'bw', prompt: 'Kādu minimālo drošības attālumu G36 rokasgrāmata prasa, šaujot ar salūtpatronām?', correct: '10 m', wrong: ['1 m', '3 m', '25 m'], explanation: 'Īpaši naktī un uzbrukumā jāievēro, lai minimālais drošības attālums – 10 m – netiktu samazināts.' },
    { id: 'blank-issue', chapter: '03', source: 'bw', prompt: 'Kad drīkst izsniegt salūta munīciju?', correct: 'Kad nevienam nav līdzi kaujas munīcijas', wrong: ['Kad visiem ir pa vienai kaujas aptverei', 'Kad šaušana notiek tikai dienā', 'Kad ierocis ir iztīrīts un ieeļļots'], explanation: 'Salūta munīciju izsniedz tikai tad, ja ir pārliecība, ka nevienam karavīram nav līdzi kaujas munīcijas.' },
    { id: 'mpg-colour', chapter: '03', source: 'bw', prompt: 'Kāpēc G36 salūtšaušanas ierīce ir matēti hromēta?', correct: 'Lai to nesajauktu ar liesmu slāpētāju', wrong: ['Lai tā nerūsētu no pulvera gāzēm', 'Lai tā atstarotu gaismu signālu došanai', 'Lai to vieglāk atskrūvētu ar roku'], explanation: 'Ierīce ir matēti hromēta, lai to atšķirtu no liesmu slāpētāja un nesajauktu.' },
    { id: 'green-tip', chapter: '03', source: 'sas', prompt: 'Ko nozīmē zaļš lodes gals NATO 5,56 mm patronai (SS109/M855)?', correct: 'Parasto lodi ar tērauda serdeni', wrong: ['Trasējošo lodi', 'Salūtpatronu bez lodes', 'Mācību patronu bez pulvera'], explanation: 'NATO munīcijā zaļš gals apzīmē SS109 tipa parasto lodi; Varšavas līguma munīcijā zaļš gals ir trasējošajai.' },
    { id: 'black-tip', chapter: '03', source: 'tm', prompt: 'Ko ASV munīcijā parasti apzīmē melns lodes gals?', correct: 'Bruņusitēju lodi', wrong: ['Aizdedzinošo lodi', 'Zemskaņas lodi', 'Mācību lodi'], explanation: 'Bruņusitējām lodēm M995 (5,56 mm) un M61 (7,62 mm) gals ir melns.' },
    { id: 'colours-vary', chapter: '03', source: 'sas', prompt: 'Kāpēc patronas veidu nedrīkst noteikt tikai pēc lodes gala krāsas?', correct: 'Krāsu marķējums dažādās valstīs atšķiras', wrong: ['Krāsa glabāšanā vienmēr nobalē', 'Krāsu uzkrāso tikai mācību un salūta patronām', 'Krāsa rāda tikai izgatavošanas gadu'], explanation: 'Krāsu marķējums nav vienots: piemēram, zaļš gals NATO munīcijā ir parastā lode, bet Varšavas līguma munīcijā – trasējošā.' },
    { id: 'fx', chapter: '03', source: 'simunition', prompt: 'Kas raksturīgs simulācijas (marķējošajai) patronai FX?', correct: 'Lode ar mazu enerģiju atstāj krāsas traipu', wrong: ['Lode ar tērauda serdeni caursit bruņas', 'Patronai nav ne lodes, ne pulvera', 'Lode lido lēnāk par skaņu – klusai šaušanai'], explanation: 'FX patronas lode ar samazinātu enerģiju atstāj krāsas traipu; ierocim vajag pārveidošanas komplektu, sejas maska ir obligāta.' },
    { id: 'subsonic', chapter: '03', source: 'mel', prompt: 'Kāpēc lieto zemskaņas patronas?', correct: 'Lai ar trokšņa slāpētāju šāviens būtu klusāks', wrong: ['Lai trase būtu redzama naktī', 'Lai lode caursistu vieglās bruņas', 'Lai trenētos bez pulvera lādiņa'], explanation: 'Zemskaņas lode lido lēnāk par skaņu, tāpēc kopā ar trokšņa slāpētāju šāviens ir klusāks.' },
    // 04 · Marķējums un drošība
    { id: 'headstamp', chapter: '04', source: 'mel', prompt: 'Kas parasti ir iespiests čaulas dibenā?', correct: 'Ražotājs un izgatavošanas gads', wrong: ['Lodes masa un sākuma ātrums', 'Ieroča numurs un īpašnieks', 'Šaušanas attālums metros'], explanation: 'Čaulas dibenā iespiež daļu marķējuma: ražotāju, izgatavošanas gadu, bieži arī tipu un NATO zīmi.' },
    { id: 'lot', chapter: '04', source: 'mel', prompt: 'Kas notiek, ja kādas partijas patronas izrādās nederīgas?', correct: 'No lietošanas izņem visu partiju', wrong: ['Izņem tikai bojātās patronas', 'Partiju turpmāk izmanto tikai mācībās', 'Patronas pārkrāso citā krāsā'], explanation: 'Vienas partijas patronām ir kopīgs pulveris un kapseles, tāpēc nederīguma gadījumā izņem visu partiju.' },
    { id: 'box-stripes', chapter: '04', source: 'mel', prompt: 'Ko nozīmē krāsaina svītra uz patronu kastes?', correct: 'Kastē ir speciālās lodes – svītra lodes gala krāsā', wrong: ['Kastē ir tikai mācību patronas', 'Patronu derīguma termiņš ir beidzies', 'Kaste paredzēta tikai transportēšanai'], explanation: 'Kastēm ar speciālo ložu patronām uzkrāso svītras, kuru krāsa atbilst lodes gala krāsojumam.' },
    { id: 'oil', chapter: '04', source: 'vam', prompt: 'Kā pareizi uzglabāt munīciju?', correct: 'Tīru un sausu, sargātu no saules un neeļļotu', wrong: ['Ieeļļotu, lai tā nerūsētu', 'Atvērtā kastē saulē, lai izžūtu', 'Mitrā vietā, lai pulveris neuzsprāgtu'], explanation: 'Munīciju glabā tīru un sausu, sargā no saules un ūdens un neeļļo.' },
    { id: 'damaged', chapter: '04', source: 'bw', prompt: 'Ko dara ar netīru, oksidētu patronu vai patronu ar vaļīgu lodi?', correct: 'Nešauj un nodod atpakaļ', wrong: ['Notīra un šauj pirmo', 'Ielādē aptveres beigās', 'Izjauc un pārbauda pulveri'], explanation: 'Netīras, oksidētas, bojātas patronas un patronas ar vaļīgu lodi nelieto – tās nodod atpakaļ.' },
    { id: 'one-type', chapter: '04', source: 'bw', prompt: 'Cik munīcijas veidus karavīrs vienlaikus drīkst lietot?', correct: 'Tikai vienu', wrong: ['Divus – kaujas un salūta', 'Trīs – kaujas, salūta un mācību', 'Tik, cik aptverēs ietilpst'], explanation: 'G36 rokasgrāmata: vienlaikus lieto tikai vienu munīcijas veidu – kaujas, treniņu, salūta vai mācību munīciju.' },
    { id: 'misfire', chapter: '04', source: 'mk494', prompt: 'Cik ilgi ierocis jātur mērķa virzienā, ja patrona pēc nospiešanas nenošauj?', correct: 'Vismaz 10 sekundes', wrong: ['Vismaz 1 sekundi', 'Vismaz 1 minūti', 'Nav jātur – uzreiz jāpārlādē'], explanation: 'MK noteikumi Nr. 494: ieroci tur mērķa virzienā vismaz 10 sekundes, tad brīdina apkārtējos un izlādē ieroci.' },
    { id: 'misfire-hand', chapter: '04', source: 'jrg', prompt: 'Ko dara, ja šaušanas nodarbībā ar ieroci rodas kļūme?', correct: 'Pārtrauc šaušanu un paceļ roku', wrong: ['Izņem aptveri un aiziet no līnijas', 'Pagriež ieroci pret instruktoru', 'Turpina šaut ar nākamo patronu'], explanation: 'Pārtrauc šaušanu, tur ieroci mērķa virzienā, paceļ roku (guļus – labo kāju) un gaida instruktora norādījumus.' },
    { id: 'no-brass', chapter: '04', source: 'jrg', prompt: 'Ko šaušanas nodarbībās aizliegts darīt ar munīciju un čaulītēm?', correct: 'Iznest tās no šaušanas vietas', wrong: ['Savākt tās pēc šaušanas', 'Nodot tās instruktoram', 'Saskaitīt tās pēc vingrinājuma'], explanation: 'Jaunsarga rokasgrāmata: aizliegts iznest munīciju un čaulītes no šaušanas nodarbību vietas.' },
    { id: 'reuse', chapter: '04', source: 'jrg', prompt: 'Ko drīkst darīt ar nesprāgušu patronu?', correct: 'Nodot – atkārtoti to neizmanto', wrong: ['Ielādēt vēlreiz aptveres sākumā', 'Paturēt kā piemiņu', 'Izjaukt un pārbaudīt kapseli'], explanation: 'Atkārtoti izmantot lietoto munīciju, tostarp nesprāgušas patronas, aizliegts.' },
    { id: 'firing-pin-mark', chapter: '04', source: 'bw', prompt: 'Vai patrona ar belžņa nospiedumu pēc pielādēšanas uzskatāma par bojātu?', correct: 'Nē, to drīkst lietot', wrong: ['Jā, tā jānodod iznīcināšanai', 'Jā, bet to drīkst šaut tikai pēdējo', 'Tikai tad, ja nospiedums ir dziļš'], explanation: 'G36 rokasgrāmata: nospiedums pēc pielādēšanas patronu nepadara bojātu – tā ir droša lietošanai.' },
  ],
};
