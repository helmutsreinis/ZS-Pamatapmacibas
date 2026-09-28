import { photoLibrary } from '../photos';
import type { Credit, Figure, Picture, StudyModule } from '../types';
import sizes from './assets/images.json';
import { pocketFigure } from './pockets';

const photo = photoLibrary(import.meta.glob<string>('./assets/*.jpg', { eager: true, query: '?url', import: 'default' }), sizes);

const CC_BY_2 = 'https://creativecommons.org/licenses/by/2.0/deed.lv';
const commons = (author: string, file: string, licence: string, licenceUrl?: string, changes = 'izgriezts'): Credit => ({
  author, source: 'Wikimedia Commons', url: `https://commons.wikimedia.org/wiki/File:${file}`, licence, licenceUrl, changes,
});
const regulationCredit: Credit = {
  author: 'Ministru kabinets', source: 'MK noteikumi Nr. 26, 2. pielikums, 106. attēls',
  url: 'https://likumi.lv/ta/id/311981-noteikumi-par-karavira-formas-terpiem-un-atskiribas-zimem',
  licence: 'normatīvā akta daļa, autortiesības neattiecas (Autortiesību likuma 6. pants)', licenceUrl: 'https://likumi.lv/ta/id/5138-autortiesibu-likums',
  changes: 'izgriezts, noņemti uzraksti un norādes līnijas',
};
const picture = (file: string, alt: string, credit: Credit): Picture => ({ ...photo(file), alt, credit });

const sources = {
  mk26: { label: 'Ministru kabineta 2020. gada 14. janvāra noteikumi Nr. 26 „Noteikumi par karavīra formas tērpiem un atšķirības zīmēm” (1. pielikums – MK 04.02.2025. noteikumu Nr. 74 redakcijā)', short: 'MK noteikumi Nr. 26', url: 'https://likumi.lv/ta/id/311981-noteikumi-par-karavira-formas-terpiem-un-atskiribas-zimem' },
  am18: { label: 'Aizsardzības ministrijas 2012. gada 17. jūlija noteikumi Nr. 18-NOT par karavīra un zemessarga formas tērpiem, 1. pielikums „Prasības ārējam izskatam” un 2.–3. pielikums (kaujas un zemessarga lauka formas tērpi)', short: 'AM noteikumi Nr. 18-NOT (2012)', url: 'https://www.mil.lv/sites/mil/files/document/Prasibas_arejam_izskatam.pdf' },
  jc8: { label: 'Jaunsardzes centra 2021. gada 30. septembra noteikumi Nr. 8-NOT par jaunsarga un Jaunsardzes centra darbinieka formas tērpu', short: 'JC noteikumi Nr. 8-NOT', url: 'https://www.jc.gov.lv/sites/jic/files/document/Noteikumi_par%20Jaunsarga%20un%20darbinieka%20formas%20terpu_2021_11_09.pdf' },
  am27: { label: 'Aizsardzības ministrijas 2015. gada 6. oktobra noteikumi Nr. 27-NOT, 2. pielikums „Mīkstā inventāra apgādes normas”', short: 'AM noteikumi Nr. 27-NOT (2015)', url: 'https://www.mil.lv/sites/mil/files/document/Apgades_normas.pdf' },
  mk720: { label: 'Ministru kabineta 2010. gada 3. augusta noteikumi Nr. 720 par paplašinātās pirmās palīdzības mācību kursu, 2. pielikums (individuālais komplekts)', short: 'MK noteikumi Nr. 720', url: 'https://likumi.lv/ta/id/214698' },
  jrg: { label: 'Jaunsarga rokasgrāmata: 8.1. „Mugursoma” (39.–40. lpp.) un 13.1. „Ekipējuma sagatavošana” (89. lpp.)', short: 'Jaunsarga rokasgrāmata', url: 'https://rojasvidusskola.lv/wp-content/uploads/2015/03/Jaunsarga-rokasgramata.pdf' },
  atgadne: { label: 'Valsts aizsardzības mācība, „Pamata militāro prasmju kursa atgādne”: „Sagatavošanās uzdevumam” (IMUMS), „Formastērpa efektīva izmantošana”, „Personīgā higiēna”', short: 'VAM kursa atgādne', url: 'https://site-710050.mozfiles.com/files/710050/VAM_atgadne__PMP_kurss_elektroniski.pdf' },
  sargs2021: { label: 'Sargs.lv, 19.06.2021.: „Alūksnē izturīgākie Latvijas karavīri pulcējas uz pirmā militarizētā marša sacīkstēm”', short: 'Sargs.lv (2021)', url: 'https://www.sargs.lv/lv/nbs/2021-06-19/aluksne-izturigakie-latvijas-karaviri-pulcejas-uz-pirma-militarizeta-marsa-sacikstem' },
  sargs2022: { label: 'Sargs.lv, 22.12.2022.: par žņaugu nēsāšanu (Zemessardzes pirmās palīdzības pasniedzēja seržante D. Kleinberga)', short: 'Sargs.lv (2022)', url: 'https://www.sargs.lv/lv/uznemejdarbiba-un-inovacijas/2022-12-22/nakotne-nbs-formas-terpos-varetu-tikt-iestradata-ipasa' },
  vam: { label: 'Jaunsardzes centrs, VAM tematu plāns: „Kājnieka individuālā ekipējuma sagatavošana uzdevumam”', short: 'VAM tematu plāns', url: 'https://www.jc.gov.lv/sites/jic/files/document/Tematu%20plans_1.MG_VAM112h.pdf' },
  course: { label: 'Kursa materiāls: kabatu saturs (iesniedza kursa dalībnieks, 2026. gada 28. septembrī)', short: 'Kursa materiāls' },
};

const patches: Figure = {
  id: 'patches', ...photo('uniform-regulation.jpg'),
  alt: 'Karavīrs vasaras kaujas formas tērpā „LatPat” no priekšpuses ar uzšuvēm uz krūtīm un piedurknēm',
  caption: 'Vasaras kaujas formas tērps ar atšķirības zīmēm pēc MK noteikumiem Nr. 26 (2. pielikuma 106. attēls). Uzšuves piestiprina ar līplenti. Kreisā un labā puse ir paša karavīra kreisā un labā puse.',
  credit: regulationCredit,
  quiz: 'Kā sauc attēlā ar marķieri norādīto atšķirības zīmi?',
  spots: [
    { id: 'cockade', x: 176, y: 28, mx: 262, my: 30, label: 'Kokarde „Saulīte”', text: 'Izšūta kokarde kaujas formas tērpa cepures priekšpusē.' },
    { id: 'rank', x: 134, y: 160, mx: 40, my: 118, label: 'Uzšuve „Dienesta pakāpe”', text: 'Jakas labajā pusē virs krūšu kabatas. Smilšu krāsas audums ar līplenti, pakāpes simboli izšūti brūniem diegiem uzšuves centrā.' },
    { id: 'surname', x: 225, y: 161, mx: 322, my: 118, label: 'Uzšuve „Uzvārds”', text: 'Jakas kreisajā pusē virs krūšu kabatas. Lieli drukātie burti, 15 mm augsti.' },
    { id: 'flag', x: 85, y: 172, mx: 28, my: 168, label: 'Piedurknes uzšuve „Latvija karogs”', text: 'Labās piedurknes augšdaļā, uz augšdelma kabatas.' },
    { id: 'unit', x: 80, y: 200, mx: 28, my: 214, label: 'Vienības piedurknes uzšuve', text: 'Labajā piedurknē zem karoga uzšuves – regulāro spēku vienības uzšuve.' },
    { id: 'specialty', x: 270, y: 168, mx: 330, my: 160, label: 'Specialitātes zīme un rotas uzšuve', text: 'Kreisās piedurknes augšdaļā.' },
    { id: 'subunit', x: 280, y: 198, mx: 330, my: 206, label: 'Apakšvienības piedurknes uzšuve', text: 'Kreisajā piedurknē zem specialitātes zīmes.' },
  ],
};

const fightingLoad: Figure = {
  id: 'fighting-load', ...photo('kit-zemessargs.jpg'),
  alt: 'Zemessargs ar ķiveri, formas tērpā „LatPat”, ar uzkabi un triecienšauteni AK-4',
  caption: 'Zemessargs mācībās „Strong Guard 2016” pie Tukuma: ķivere, kaujas formas tērps, uzkabe ar kabatām un triecienšautene AK-4.',
  credit: commons('Staff Sgt. Kimberly Derryberry, ASV Nacionālā gvarde', 'A_Zemessarde_(Latvian_National_Guard)_pulls_security_during_Strong_Guard_2016_near_Tukums.jpg', 'publiskais īpašums (ASV valdības darbs)'),
  quiz: 'Kā sauc attēlā ar marķieri norādīto ekipējuma daļu?',
  spots: [
    { id: 'helmet', x: 298, y: 70, label: 'Bruņucepure ar pārvalku', text: 'Galvas aizsardzība. Pieder kaujas individuālās aizsardzības sistēmai (KIAS) kopā ar pārvalku un ieliktņiem.' },
    { id: 'uniform', x: 100, y: 360, label: 'Kaujas formas tērps', text: 'Jaka un bikses ar maskēšanās rakstu „LatPat” – arī tas pieder KIAS.' },
    { id: 'vest', x: 230, y: 330, label: 'Uzkabe', text: 'Nesamā sistēma munīcijai, ūdenim un medicīnas paketei. Veste, josta, aptveru somas un kabatas pieder kaujas MTL pārnēsāšanas sistēmai (KMPS).' },
    { id: 'mag-pouches', x: 210, y: 660, label: 'Aptveru somas', text: 'Uzkabes apakšā – rezerves aptverēm. Pirms uzdevuma pārbauda, vai tās ir aizvērtas un netrokšņo.' },
    { id: 'rifle', x: 350, y: 570, label: 'Triecienšautene AK-4', text: 'Ierocis nav ekipējuma sistēmu daļa, bet uzkabi komplektē tā, lai ierocim būtu pietiekami daudz aptveru.' },
  ],
};

const rucksack: Figure = {
  id: 'rucksack', ...photo('kit-rucksack.jpg'),
  alt: 'Karavīre ar lielu militāro mugursomu, redzamas plecu siksnas un gurnu josta',
  caption: 'Latvijas karavīre sacensībās „Baltic Warrior 2023” Ādažos ar lielo mugursomu.',
  credit: commons('Staff Sgt. Cesar Rivas, ASV armija', 'Baltic_Warrior_2023_(7795647).jpg', 'publiskais īpašums (ASV valdības darbs)'),
  quiz: 'Kā sauc attēlā ar marķieri norādīto mugursomas daļu?',
  spots: [
    { id: 'top', x: 160, y: 55, label: 'Mugursomas augšdaļa', text: 'Virspusē liek to, kas uzdevumā vajadzīgs visvairāk, piemēram, munīciju.' },
    { id: 'straps', x: 122, y: 175, label: 'Plecu siksnas', text: 'Pielāgo tā, lai soma cieši pieguļ mugurai un nešūpojas.' },
    { id: 'side', x: 315, y: 180, label: 'Ārējā sānu kabata', text: 'Ārējās kabatās liek tikai pašu nepieciešamāko.' },
    { id: 'hip-belt', x: 190, y: 335, label: 'Gurnu josta', text: 'Mugursomas slodzei jāgulstas uz gurniem, nevis uz pleciem vai muguras – gurni ir ķermeņa izturīgākā daļa.' },
  ],
};

export const kit: StudyModule = {
  id: 'ekipejums', name: 'Ekipējums', genitive: 'Ekipējuma', kicker: 'EKIPĒJUMS', codePrefix: 'EK',
  title: 'KARAVĪRA <em>EKIPĒJUMS.</em>',
  lead: 'Kaujas formas tērps un atšķirības zīmes, kabatu saturs, ekipējuma sistēmas, medpakete, mugursoma un sagatavošanās uzdevumam. Uz fotoattēliem izvēlies numuru, lai redzētu skaidrojumu.',
  summary: 'Formas tērps un uzšuves, kabatu saturs, ekipējuma sistēmas, medpakete, mugursoma un sagatavošanās uzdevumam – ar fotoattēliem un pārbaudi.',
  notice: 'Uzšuvju vietas un ekipējuma sastāvs ņemti no normatīvajiem aktiem, kabatu saturs – no kursa materiāla. Kārtība vienībās var atšķirties: noteicošais ir tavs komandieris un instruktors.',
  sources,
  chapters: [
    {
      number: '01', title: 'Formas tērps un uzšuves',
      lead: 'Kaujas formas tērpa sastāvu un atšķirības zīmju vietas nosaka Ministru kabineta noteikumi Nr. 26. Karogs ir uz labās piedurknes, uzvārds – krūšu kreisajā pusē, dienesta pakāpe – labajā.',
      sources: ['mk26', 'am18', 'jc8'],
      blocks: [
        { kind: 'text', paragraphs: [
          'Karavīra **kaujas formas tērpu** veido jaka, bikses un cepure no auduma ar maskēšanās rakstu „LatPat”, „MultiLatPat” vai „WoodLatPat”. Tam ir vasaras un ziemas variants, un komplektā ietilpst arī vēsu laikapstākļu kostīma jaka, aukstu laikapstākļu virsjaka ar kapuci vai bez tās un lietus kostīms.',
          'Pie kaujas formas tērpa valkā arī papildu elementus: bereti ar vienības apstiprināto kokardi, vēsu laikapstākļu cimdus un cepuri brūnā krāsā un saišu zābakus brūnā vai melnā krāsā. Atšķirības zīmes uz „MultiLatPat” un „WoodLatPat” tērpa izvieto tāpat kā uz „LatPat”.',
        ] },
        { kind: 'figure', figure: patches },
        { kind: 'table', caption: 'Uzšuvju izmēri (MK noteikumi Nr. 26, 2. pielikums)', head: ['Uzšuve', 'Izmērs', 'Izskats'], rows: [
          ['„Dienesta pakāpe” (no kareivja līdz pulkvedim)', '130 × 30 mm', 'Smilšu krāsas audums ar līplenti, simboli izšūti brūniem diegiem uzšuves centrā'],
          ['„Dienesta pakāpe” (no brigādes ģenerāļa)', '130 × 40 mm', 'Tāpat kā citām pakāpēm'],
          ['Speciālistu dienesta pakāpes', '130 × 30 mm', 'Papildus 5 mm plata brūna svītra 10 mm no kreisās malas'],
          ['„Uzvārds” (auduma)', '130 × 30 mm', 'Lieli drukātie burti 15 mm augstumā, izšūti uzšuves centrā'],
        ] },
        { kind: 'cards', title: 'Uzšuves fotoattēlos', cards: [
          { id: 'sleeve-latpat', title: 'Labā piedurkne', kicker: '„LATPAT”', picture: picture('flag-patch.jpg', 'Karavīrs melnā beretē; uz labās piedurknes karoga uzšuve un zem tās apaļa vienības uzšuve', commons('Kārlis Dambrāns', 'Latvian_soldier_with_weapon.jpg', 'CC BY 2.0', CC_BY_2)),
            text: 'Uzšuve „Latvija karogs” augšdelma kabatas augšdaļā, zem tās – vienības piedurknes uzšuve.' },
          { id: 'sleeve-multilatpat', title: 'Apakšvienības uzšuve', kicker: '„MULTILATPAT”', picture: picture('kit-saber-strike.jpg', 'Latvijas karavīrs „MultiLatPat” formas tērpā ar ķiveri, vesti un triecienšauteni G36; uz kreisās piedurknes apakšvienības uzšuve', commons('Pvt. Brandon Best, ASV armija', 'Saber_Strike_2017_Norwegian_STX_Lane_170604-A-YI894-0138.jpg', 'publiskais īpašums (ASV valdības darbs)')),
            text: 'Uz kreisās piedurknes – apakšvienības uzšuve. Karavīram ir arī ķivere, veste ar kabatām, austiņas un triecienšautene G36.' },
        ] },
        { kind: 'callout', tone: 'note', title: 'Jaunsargiem', text: 'Jaunsarga formas tērpā uzšuve „Latvijas karodziņš” ir uz labās piedurknes augšdelma kabatas aizdares, „Jaunsardzes emblēma – vairogs” – uz kreisās piedurknes augšdelma kabatas, „Jaunsardze” – virs kreisās krūšu kabatas, „Jaunsarga līmenis” un „Fiziskā sagatavotība” – virs labās krūšu kabatas (JC noteikumi Nr. 8-NOT).' },
        { kind: 'callout', tone: 'course', title: 'Zemessardzē – precizē vienībā', text: 'Aizsardzības ministrijas 2012. gada noteikumos zemessarga lauka formas tērpam uzvārda vietā bija paredzēta uzšuve „ZEMESSARDZE” un uz uzpleča – ZS bataljona numurs. Pašreizējos MK noteikumos Nr. 26 atsevišķa zemessarga varianta nav, tāpēc uzšuvju kārtību pārjautā savā vienībā.' },
      ],
    },
    {
      number: '02', title: 'Kabatu saturs',
      lead: 'Katrai lietai ir sava kabata, lai to atrastu uzreiz – arī tumsā un arī tad, ja to meklē biedrs. Šeit parādīts kursā noteiktais kabatu saturs.',
      sources: ['course', 'am18', 'jc8', 'atgadne'],
      blocks: [
        ...(pocketFigure ? [{ kind: 'figure' as const, figure: pocketFigure }] : []),
        { kind: 'table', caption: 'Kabatu saturs pēc kursa kārtības', head: ['Kabata', 'Saturs', 'Piezīme'], rows: [
          ['Kreisās piedurknes kabata', 'Kompass', '–'],
          ['Labās piedurknes kabata', 'Pierakstu blociņš ar pildspalvu', 'Pildspalva paliek kabatā: formas tērpa ārpusē to piestiprināt aizliegts (AM, 2012).'],
          ['Jakas kreisā krūšu kabata', 'Apliecība', 'Zemessargam, pildot dienesta pienākumus, dienesta apliecībai jābūt klāt (VAM atgādne).'],
          ['Kreisā augšstilba kabata', 'Taktiskie cimdi, balaklava (šalle)', '–'],
          ['Labā augšstilba kabata', 'Pēc izvēles – atkarībā no uzdevuma', '–'],
          ['Kreisā apakšstilba kabata', 'Medpakete', 'Visiem vienā vietā, tāpēc biedrs to atrod bez meklēšanas.'],
          ['Labā apakšstilba kabata', 'Atstarotājs un salvetes', 'Atstarotāju tumsā valkā transporta kustības pusē; jaunsargi – uz labās kājas potītes līmenī.'],
        ] },
        { kind: 'callout', tone: 'course', title: 'Kursa kārtība', text: 'Kabatu saturu nosaka kursa (vienības) kārtība, nevis Ministru kabineta noteikumi, tāpēc citās vienībās tas var atšķirties. Piezīmes pie kabatām ņemtas no normatīvajiem aktiem un VAM atgādnes.' },
        { kind: 'list', title: 'Ko nosaka normatīvie akti', items: [
          'Diennakts tumšajā laikā vai nepietiekamas redzamības apstākļos, pārvietojoties formas tērpā, valkā **atstarojošu aproci transporta kustības pusē** – uz rokas apakšdelma vai kājas apakšstilba apakšējās daļas (AM noteikumi Nr. 18-NOT, 2012).',
          'Jaunsargs atstarotāju „Jaunsardze” lieto uz formas tērpa **bikšu labās staras potītes līmenī** (JC noteikumi Nr. 8-NOT).',
          'Juvelierizstrādājumus, pildspalvas un zīmuļus **formas tērpa ārpusē piestiprināt aizliegts** (AM noteikumi Nr. 18-NOT, 2012).',
          'Mācībās, kursos, starptautiskajās operācijās un kara apstākļos **karavīra žetonu obligāti nēsā kaklā** (AM noteikumi Nr. 18-NOT, 2012).',
        ] },
      ],
    },
    {
      number: '03', title: 'Formas tērpa valkāšana',
      lead: 'Kārtīgs formas tērps nav tikai izskats: tīrs, brīvs un sauss apģērbs pasargā no pārkaršanas, salšanas un ādas problēmām. VAM atgādne to apkopo principā COLD.',
      sources: ['atgadne', 'am18'],
      blocks: [
        { kind: 'decode', title: 'Formas tērpa lietošanas princips COLD', parts: [
          { value: 'C', label: 'Clean – tīrs', text: 'Ekipējumu un apģērbu uztur tīru, zeķes maina vismaz reizi diennaktī.' },
          { value: 'O', label: 'Overheating – nepārkarst', text: 'Ģērbjas atbilstoši slodzei: pie mazākas slodzes – siltāk, pie lielākas – plānāk. Kustībā neļauj sev pārkarst un stipri svīst.' },
          { value: 'L', label: 'Loose – brīvs', text: 'Apģērbs nav ciešs, lai starp kārtām veidotos gaisa slāņi, kas silda.' },
          { value: 'D', label: 'Dry – sauss', text: 'Apģērbu uztur sausu un savlaicīgi žāvē. Vienu formas tērpa komplektu visu laiku tur sausu un lieto tikai pie mazas fiziskās slodzes.' },
        ] },
        { kind: 'list', title: 'Karstā un aukstā laikā (VAM atgādne)', items: [
          'Karstā laikā dzer daudz ūdens: smagā darbā Latvijas apstākļos – apmēram 3–6 litrus dienā.',
          'Aukstā laikā ēd siltu ēdienu un dzer siltus dzērienus.',
          'Zeķes maini pēc iespējas biežāk; mitras lietas pirms gulētiešanas nomaini ar sausām un žāvē guļammaisā ar ķermeņa siltumu.',
          'Ja strādā un svīsti, novelc lieko; kad kļūst vēsāk vai jāstāv nekustīgi, apģērbu atkal uzvelc.',
        ] },
        { kind: 'list', title: 'Ārējā izskata prasības (AM noteikumi Nr. 18-NOT, 2012)', items: [
          'Cepure ir formas tērpa sastāvdaļa: to valkā vienmēr, izņemot transportlīdzekļos un telpās (ja komandieris nav noteicis citādi).',
          'Pie kaujas formas tērpa drīkst nest militāru mugursomu vai tumšas krāsas auduma rokas somu; lietussargu pie kaujas formas tērpa nelieto.',
          'Saulesbrilles nedrīkst būt ar spoguļstikliem, un tās nelieto ierindā, telpās un stājoties priekšā komandierim.',
        ], note: 'Šie noteikumi ir no 2012. gada; pārbaudi pie instruktora, vai vienībā nav jaunāku prasību.' },
      ],
    },
    {
      number: '04', title: 'Ekipējuma sistēmas',
      lead: 'Karavīra individuālo ekipējumu Aizsardzības ministrijas apgādes normas grupē trīs sistēmās: aizsardzībai (KIAS), nešanai (KMPS) un izdzīvošanai un pastāvēšanai (KSIP).',
      sources: ['am27', 'sargs2021', 'vam'],
      blocks: [
        { kind: 'figure', figure: fightingLoad },
        { kind: 'cards', title: 'Trīs ekipējuma sistēmas', cards: [
          { id: 'kias', kicker: 'KIAS', title: 'Aizsardzība', text: '**Kaujas individuālās aizsardzības sistēma**: kaujas formas tērps ar apakšveļu, bruņucepure ar pārvalku, ausu aizbāžņi, elkoņu un ceļu sargi, balistiskās aizsardzības veste ar plāksnēm, guļammaisu sistēma, aizsardzība pret masu iznīcināšanas līdzekļiem (gāzmaska) un maskēšanās tērpi.' },
          { id: 'kmps', kicker: 'KMPS', title: 'Nešana', text: '**Kaujas MTL pārnēsāšanas sistēma** (MTL – materiāltehniskie līdzekļi): veste ar modulārām somām un kabatām, uzkabes josta, aptveru un lāpstas somas, radiostacijas kabata, 90 litru mugursoma un uzbrukuma mugursoma, pirmās palīdzības mugursoma un nestuves.' },
          { id: 'ksip', kicker: 'KSIP', title: 'Izdzīvošana un pastāvēšana', text: '**Kaujas sistēma izdzīvošanai un pastāvēšanai**: blašķe, medicīniskā pakete, lauka virtuves komplekts (ēdamrīki, krūze, katliņš, deglis), lukturis, kompass, lāpstiņa, nazis, higiēnas komplekts, lietvedības piederumi (blociņš, pildspalva, kartes soma), ķīmiskās gaismas un nesamā avārijas rezerve.' },
        ] },
        { kind: 'table', caption: 'Komplektu piemēri (AM noteikumi Nr. 27-NOT, 2015)', head: ['Komplekts', 'Sistēma', 'Saturs'], rows: [
          ['ALPK-L1', 'KIAS', 'Bruņucepure ar pārvalku un ieliktņiem, ausu aizbāžņi, elkoņu un ceļu prettraumu ieliktņi'],
          ['BEAR-II', 'KIAS', 'Balistiskās aizsardzības pārvalks ar paneļiem un plāksnēm (25 × 30 cm)'],
          ['PSK', 'KMPS', 'Uzkabes josta, radiostacijas kabata, aptveru soma, lāpstas soma'],
          ['MMS', 'KMPS', '90 litru mugursoma ar kabatām un vāku, uzbrukuma mugursoma'],
          ['KSIP-PAMATA', 'KSIP', 'Blašķe, medicīniskā pakete, apavu kopšanas un šūšanas piederumi, darba cimdi, dvielis'],
          ['LAUKA', 'KSIP', 'Lukturis, kompass, lāpstiņa, saliekamais nazis, aukla, karabīne, izolācijas lente, maisi'],
          ['ADMIN', 'KSIP', 'Piezīmju blociņš, SOP un pierakstu grāmata, kartes soma, pildspalva, zīmulis, marķieri'],
        ] },
        { kind: 'callout', tone: 'note', title: 'Pilnais ekipējums marša sacensībās', text: 'NBS militarizētā marša sacensībās 2021. gadā „pilnajā ekipējumā” ietilpa lauka formas tērps, uzkabe, ierocis, astoņas magazīnas, ķivere, medpaka un ūdens, bet lielajā mugursomā bija jānes trīs dienu ekipējums (Sargs.lv).' },
        { kind: 'callout', tone: 'course', title: 'KE un PKE', text: 'VAM programmā ekipējumu iedala kaujas ekipējumā (KE) un papildinātajā kaujas ekipējumā (PKE). Publiski pieejamos materiālos to precīzs sastāvs nav aprakstīts – kā tos komplektē tavā kursā, jautā instruktoram.' },
      ],
    },
    {
      number: '05', title: 'Medpakete',
      lead: 'Individuālā medicīnas pakete ir paredzēta dzīvības glābšanai pirmajās minūtēs pēc ievainojuma. Tās saturu nosaka Ministru kabineta noteikumi Nr. 720.',
      sources: ['mk720', 'sargs2022', 'course'],
      blocks: [
        { kind: 'text', paragraphs: [
          'Normatīvajos aktos medpaketi sauc par **karavīra un zemessarga individuālo medicīnisko materiālu un medikamentu komplektu**. Ar to drīkst rīkoties tas, kurš beidzis paplašinātās pirmās palīdzības individuālo kursu. Prasmes jāuztur: vismaz reizi trijos gados notiek vismaz astoņu stundu uzturēšanas apmācība.',
        ] },
        { kind: 'sequence', title: 'Individuālā komplekta saturs (MK noteikumi Nr. 720, 2. pielikums)', items: [
          { title: 'Modulāra soma', text: 'Kurā viss komplekts ir sakārtots.' },
          { title: 'Šķēres un vienreizējas lietošanas cimdi', text: 'Apģērba nogriešanai un sevis aizsardzībai.' },
          { title: 'Taktiskie žņaugi', text: 'Arteriālas asiņošanas apturēšanai.' },
          { title: 'Spiedošs pārsējs, marles saite, leikoplasts rullī', text: 'Asiņošanas apturēšanai un brūču pārsiešanai.' },
          { title: 'Trīsstūrveida lakatiņš', text: 'Pārsiešanai un fiksēšanai.' },
          { title: 'Nazofaringeālais elpvads (ar lubrikantu)', text: 'Elpceļu caurlaidības nodrošināšanai.' },
          { title: 'Lokālais hemostātiskais līdzeklis', text: 'Asiņošanas apturēšanai brūcē.' },
          { title: 'Pretsāpju, pretiekaisuma un pretinfekcijas līdzekļi', text: 'Perorālai lietošanai.' },
          { title: 'Folijas sega', text: 'Siltuma saglabāšanai.' },
          { title: 'Speciālais krūšu kurvja pārsējs', text: 'Krūšu kurvja brūcēm.' },
          { title: 'Cietušā karte un ūdens noturīgs marķieris', text: 'Sniegtās palīdzības atzīmēšanai.' },
        ], note: 'Sarakstā ir 17 pozīcijas; te tās apvienotas pa grupām. Skaidrojumi pie pozīcijām ir mācību palīglīdzeklis, nevis normatīvā akta teksts.' },
        { kind: 'callout', tone: 'note', title: 'Divi žņaugi', text: 'Zemessardzes paplašinātās pirmās palīdzības pasniedzēja skaidro, ka pēc kursa individuālajā ekipējumā jābūt diviem žņaugiem – vienam individuālajā somiņā, otram uz uzkabes (Sargs.lv, 2022).' },
        { kind: 'callout', tone: 'course', title: 'Kur medpakete atrodas', text: 'Kursa kārtībā medpakete ir kreisā bikšu apakšstilba kabatā. Tai jābūt vienā un tajā pašā vietā visiem, lai biedrs to atrastu bez meklēšanas.' },
      ],
    },
    {
      number: '06', title: 'Mugursoma un 3 dienu soma',
      lead: 'Lielajā mugursomā karavīrs nes ekipējumu vairākām dienām. Pareizi sakārtota soma ir sausa, netrokšņo, un vajadzīgākais tajā ir pa rokai.',
      sources: ['jrg', 'sargs2021', 'am27', 'atgadne'],
      blocks: [
        { kind: 'figure', figure: rucksack },
        { kind: 'sequence', title: 'Kā sakārtot mugursomu (Jaunsarga rokasgrāmata)', items: [
          { title: 'Pārbaudi somu', tag: 'pirms kārtošanas', text: 'Pārbaudi siksnas, rāvējslēdzējus, saspraudes un sprādzes; bojājumus novērs.' },
          { title: 'Ieliec ūdensnecaurlaidīgu maisu', tag: 'odere', text: 'Somā ieliek ūdensnecaurlaidīgu maisu, lai saturs nesamirktu, ja soma iekrīt ūdenī. Arī katru lietu iepako ūdensnecaurlaidīgā maisā.' },
          { title: 'Apakšā – smagākais un mazāk vajadzīgais', tag: 'apakša', text: 'Piemēram, rezerves drēbes – tās uzdevuma laikā nav vajadzīgas.' },
          { title: 'Virspusē – uzdevumam vajadzīgākais', tag: 'virspuse', text: 'Piemēram, munīcija: tai jābūt pieejamai pirmajai.' },
          { title: 'Ārējās kabatās – tikai pats nepieciešamākais', tag: 'kabatas', text: 'Ārējās kabatas nepārpilda.' },
          { title: 'Nostiprini, lai nekrīt un netrokšņo', tag: 'noslēgumā', text: 'Ekipējuma daļas nostiprina ar auklām vai līmlenti – var nākties pārvietoties gan skriešus, gan guļus.' },
        ], note: 'Mugursomai jānodrošina slodze uz gurniem, nevis uz pleciem vai muguras, tāpēc vēlama soma ar rāmi un gurnu jostu.' },
        { kind: 'list', title: 'Trīs dienu ekipējums lielajā mugursomā (Sargs.lv, 2021)', items: [
          'Guļammaiss',
          'Rezerves forma un rezerves zābaki',
          'Dvielis un higiēnas preces',
          'Pārtikas deva trim dienām',
          'Ne mazāk kā 3 litri dzeramā ūdens',
        ], note: 'Šis bija NBS militarizētā marša sacensību (20 km) nolikums. Kursa 3 dienu somas sarakstu un kārtošanas secību nosaka instruktors.' },
        { kind: 'list', title: 'Personīgās higiēnas piederumi (VAM atgādne)', items: [
          'Zobu suka un zobu pasta, ziepes, mazgāšanās sūklis',
          'Šķērītes un kāju kopšanas piederumi',
          'Skūšanās piederumi, vēlams – dušas čības',
        ] },
        { kind: 'callout', tone: 'note', title: 'Izsniegtās mugursomas', text: 'Apgādes normās modulārās mugursomas sistēmā (MMS) ir 90 litru mugursoma ar kabatām un vāku un mazāka uzbrukuma mugursoma (AM noteikumi Nr. 27-NOT, 2015).' },
        { kind: 'callout', tone: 'course', title: 'Alfa soma', text: 'Kursā lieto arī terminu „Alfa soma”. Publiski pieejamos NBS materiālos tā definīcija nav atrodama, tāpēc tās uzdevumu un saturu precizē pie instruktora.' },
      ],
    },
    {
      number: '07', title: 'Sagatavošanās uzdevumam',
      lead: 'Pirms uzdevuma karavīrs pārbauda ekipējumu noteiktā secībā. VAM atgādnē to sauc par IMUMS: ierocis, munīcija, uzkabe, maskēšanās, sakari.',
      sources: ['atgadne', 'jrg'],
      blocks: [
        { kind: 'sequence', title: 'IMUMS – pārbaude pirms uzdevuma', items: [
          { title: 'I – ierocis', text: 'Apskata stobra kanālu un pārbauda, vai liesmu slāpētājs (kompensators) ir labi nostiprināts, tad veic ieroča funkcionālo pārbaudi visos drošinātāja stāvokļos.' },
          { title: 'M – munīcija', text: 'Pārbauda, vai magazīnas nav bojātas, un izsniegto munīciju: vai tā atbilst ierocim un nav sarūsējusi, deformēta vai pārkarsusi. Salūta munīciju nesajauc ar kaujas vai mācību munīciju.' },
          { title: 'U – uzkabe', text: 'Nokomplektē un pielāgo uzkabi: medicīnas pakete, aptversomas, blašķes, kompass, rakstāmpiederumi, kartes, dzirdes un redzes aizsardzība. Pārbauda siksnas un sprādzes, lukturīša baterijas; beigās palēkā un paklausās, vai kaut kas negrab.' },
          { title: 'M – maskēšanās', text: 'Individuālā maskēšanās (maskēšanās krēms, dabīgie un mākslīgie līdzekļi) un ekipējuma maskēšana – gan skaņa, gan forma.' },
          { title: 'S – sakari', text: 'Pārbauda radiostaciju un tās barošanu, sagatavo to darbam, uzstāda frekvenci un veic sakaru pārbaudi.' },
        ] },
        { kind: 'callout', tone: 'safety', title: 'Karstas patronas', text: 'Patronu, kas ir tik karsta, ka to nevar noturēt kailā rokā (virs 60 °C), aizliegts ielādēt magazīnā un ieroča patrontelpā – var notikt nesankcionēts šāviens (VAM atgādne).' },
      ],
    },
  ],
  questions: [
    // 01 · Formas tērps un uzšuves
    { id: 'patterns', chapter: '01', source: 'mk26', prompt: 'Kuri maskēšanās raksti noteikti karavīra kaujas formas tērpam?', correct: '„LatPat”, „MultiLatPat” un „WoodLatPat”', wrong: ['„Woodland”, „Flecktarn” un „MultiCam”', '„LatPat” vasarā un balts raksts ziemā', '„MultiCam”, „LatPat” un „Desert Storm”'], explanation: 'MK noteikumi Nr. 26 paredz kaujas formas tērpu no auduma ar maskēšanās rakstu „LatPat”, „MultiLatPat” vai „WoodLatPat”.' },
    { id: 'flag-sleeve', chapter: '01', source: 'mk26', prompt: 'Kur uz kaujas formas tērpa jakas atrodas uzšuve „Latvija karogs”?', correct: 'Labās piedurknes augšdaļā', wrong: ['Kreisās piedurknes augšdaļā', 'Virs kreisās krūšu kabatas', 'Uz cepures priekšpuses'], explanation: 'Uzšuve „Latvija karogs” ir labās piedurknes augšdaļā, zem tās – vienības piedurknes uzšuve.' },
    { id: 'surname-side', chapter: '01', source: 'mk26', prompt: 'Kur uz kaujas formas tērpa jakas atrodas uzšuve „Uzvārds”?', correct: 'Jakas kreisajā pusē uz krūtīm', wrong: ['Jakas labajā pusē uz krūtīm', 'Labajā piedurknē zem karoga', 'Kreisās piedurknes augšdaļā'], explanation: 'Uzvārda uzšuve ir jakas kreisajā pusē, dienesta pakāpes uzšuve – labajā.' },
    { id: 'rank-side', chapter: '01', source: 'mk26', prompt: 'Kur uz kaujas formas tērpa jakas atrodas uzšuve „Dienesta pakāpe”?', correct: 'Jakas labajā pusē uz krūtīm', wrong: ['Jakas kreisajā pusē uz krūtīm', 'Kreisajā piedurknē zem karoga', 'Uz cepures kreisajā sānā'], explanation: 'Dienesta pakāpes uzšuve ir jakas labajā pusē virs krūšu kabatas.' },
    { id: 'under-flag', chapter: '01', source: 'mk26', prompt: 'Kas atrodas labajā piedurknē zem uzšuves „Latvija karogs”?', correct: 'Vienības piedurknes uzšuve', wrong: ['Specialitātes zīme un rotas uzšuve', 'Uzšuve „Uzvārds”', 'Uzšuve „Dienesta pakāpe”'], explanation: 'Zem karoga uzšuves ir regulāro spēku vienības piedurknes uzšuve.' },
    { id: 'left-sleeve', chapter: '01', source: 'mk26', prompt: 'Kas pēc MK noteikumiem Nr. 26 atrodas uz kreisās piedurknes?', correct: 'Specialitātes zīme, rotas un apakšvienības uzšuves', wrong: ['Uzšuve „Latvija karogs” un vienības uzšuve', 'Uzvārda un dienesta pakāpes uzšuves', 'Atstarojošā aproce un karavīra žetons'], explanation: 'Uz kreisās piedurknes ir specialitātes zīme un rotas uzšuve, zem tām – apakšvienības uzšuve.' },
    { id: 'surname-size', chapter: '01', source: 'mk26', prompt: 'Kāds ir auduma uzvārda uzšuves izmērs?', correct: '130 × 30 mm, burti 15 mm augsti', wrong: ['100 × 25 mm, burti 10 mm augsti', '150 × 40 mm, burti 20 mm augsti', '80 × 20 mm, burti 12 mm augsti'], explanation: 'Uzvārda uzšuve ir 130 mm gara un 30 mm plata; burti – lieli, drukāti, 15 mm augsti.' },
    { id: 'rank-attach', chapter: '01', source: 'mk26', prompt: 'Kā dienesta pakāpes uzšuvi piestiprina pie kaujas formas tērpa?', correct: 'Ar līplenti', wrong: ['Ar metāla piespraudi', 'Ar divām pogām', 'Piešujot pie kabatas'], explanation: 'Dienesta pakāpju uzšuves izgatavo no smilšu krāsas auduma ar līplenti; simboli izšūti brūniem diegiem.' },
    { id: 'js-flag', chapter: '01', source: 'jc8', prompt: 'Kur jaunsargs lieto uzšuvi „Latvijas karodziņš”?', correct: 'Uz labās piedurknes augšdelma kabatas aizdares', wrong: ['Uz kreisās piedurknes augšdelma kabatas aizdares', 'Virs formas tērpa jakas kreisās krūšu kabatas', 'Uz jakas labās krūšu kabatas aizdares'], explanation: 'JC noteikumi Nr. 8-NOT: „Latvijas karodziņš” – uz labās piedurknes augšdelma kabatas aizdares.' },
    { id: 'js-tape', chapter: '01', source: 'jc8', prompt: 'Kur uz jaunsarga formas tērpa jakas lieto uzšuvi „Jaunsardze”?', correct: 'Virs kreisās krūšu kabatas', wrong: ['Virs labās krūšu kabatas', 'Uz labās piedurknes kabatas', 'Uz cepures priekšpuses'], explanation: 'Uzšuve „Jaunsardze” ir virs kreisās krūšu kabatas, „Jaunsarga līmenis” un „Fiziskā sagatavotība” – virs labās.' },
    // 02 · Kabatu saturs
    { id: 'compass', chapter: '02', source: 'course', prompt: 'Kurā kabatā pēc kursa kārtības glabā kompasu?', correct: 'Kreisās piedurknes kabatā', wrong: ['Labās piedurknes kabatā', 'Jakas kreisajā krūšu kabatā', 'Labajā augšstilba kabatā'], explanation: 'Kompass ir kreisās piedurknes kabatā.' },
    { id: 'notebook', chapter: '02', source: 'course', prompt: 'Kurā kabatā pēc kursa kārtības ir pierakstu blociņš ar pildspalvu?', correct: 'Labās piedurknes kabatā', wrong: ['Kreisās piedurknes kabatā', 'Jakas kreisajā krūšu kabatā', 'Kreisajā augšstilba kabatā'], explanation: 'Pierakstu blociņš ar pildspalvu ir labās piedurknes kabatā.' },
    { id: 'id-card', chapter: '02', source: 'course', prompt: 'Kur pēc kursa kārtības glabā apliecību?', correct: 'Jakas kreisajā krūšu kabatā', wrong: ['Jakas labajā krūšu kabatā', 'Kreisajā augšstilba kabatā', 'Labās piedurknes kabatā'], explanation: 'Apliecība ir jakas kreisajā krūšu kabatā.' },
    { id: 'medkit', chapter: '02', source: 'course', prompt: 'Kur pēc kursa kārtības atrodas medpakete?', correct: 'Kreisajā bikšu apakšstilba kabatā', wrong: ['Labajā bikšu apakšstilba kabatā', 'Jakas kreisajā krūšu kabatā', 'Labās piedurknes kabatā'], explanation: 'Medpakete ir kreisajā bikšu apakšstilba kabatā – visiem vienā vietā, lai biedrs to atrastu uzreiz.' },
    { id: 'reflector-pocket', chapter: '02', source: 'course', prompt: 'Kas pēc kursa kārtības glabājas labajā bikšu apakšstilba kabatā?', correct: 'Atstarotājs un salvetes', wrong: ['Medpakete un žņaugs', 'Kompass un karte', 'Taktiskie cimdi un balaklava'], explanation: 'Labajā apakšstilba kabatā ir atstarotājs un salvetes.' },
    { id: 'left-thigh', chapter: '02', source: 'course', prompt: 'Ko pēc kursa kārtības glabā kreisajā augšstilba kabatā?', correct: 'Taktiskos cimdus un balaklavu', wrong: ['Atstarotāju un mitrās salvetes', 'Kompasu un pierakstu blociņu', 'Medpaketi un rezerves žņaugu'], explanation: 'Kreisajā augšstilba kabatā ir taktiskie cimdi un balaklava (šalle).' },
    { id: 'right-thigh', chapter: '02', source: 'course', prompt: 'Kam pēc kursa kārtības paredzēta labā augšstilba kabata?', correct: 'Brīvai izvēlei – atkarībā no uzdevuma', wrong: ['Rezerves aptverei un tīrīšanas piederumiem', 'Apliecībai un personīgajiem dokumentiem', 'Medpaketei un rezerves žņaugam'], explanation: 'Labā augšstilba kabata ir brīva – tās saturs atkarīgs no uzdevuma.' },
    { id: 'reflector-side', chapter: '02', source: 'am18', prompt: 'Kur valkā atstarojošu aproci, pārvietojoties formas tērpā tumsā?', correct: 'Transporta kustības pusē – uz apakšdelma vai apakšstilba', wrong: ['Uz mugursomas augšdaļas, lai to redzētu arī no aizmugures', 'Uz ķiveres pārvalka, lai to redzētu no visām pusēm', 'Vienmēr uz kreisās rokas neatkarīgi no ceļa puses'], explanation: 'Tumsā vai nepietiekamā redzamībā atstarojošu aproci valkā transporta kustības pusē uz rokas apakšdelma vai kājas apakšstilba apakšējās daļas.' },
    { id: 'js-reflector', chapter: '02', source: 'jc8', prompt: 'Kur jaunsargs lieto atstarotāju „Jaunsardze”?', correct: 'Uz bikšu labās staras potītes līmenī', wrong: ['Uz jakas kreisās piedurknes kabatas', 'Uz mugursomas vāka augšdaļā', 'Uz bikšu kreisās staras ceļgala līmenī'], explanation: 'JC noteikumi Nr. 8-NOT: atstarotāju lieto uz formas tērpa bikšu labās staras potītes līmenī.' },
    { id: 'pens', chapter: '02', source: 'am18', prompt: 'Ko ārējā izskata prasības nosaka par pildspalvām pie formas tērpa?', correct: 'Tās nedrīkst piestiprināt formas tērpa ārpusē', wrong: ['Tās jānēsā piespraustas pie krūšu kabatas', 'Tās drīkst nēsāt tikai virsnieki un ārsti', 'Tās jātur piedurknes ārējā pildspalvu ligzdā'], explanation: 'Juvelierizstrādājumus, pildspalvas un zīmuļus piestiprināt formas tērpa ārpusē aizliegts.' },
    { id: 'id-tag', chapter: '02', source: 'am18', prompt: 'Kā karavīrs mācībās un kara apstākļos nēsā identifikācijas žetonu?', correct: 'Obligāti kaklā', wrong: ['Kreisajā krūšu kabatā', 'Mugursomas iekšējā kabatā', 'Piestiprinātu pie uzkabes'], explanation: 'Kara apstākļos, starptautiskajās operācijās, mācībās un kursos karavīra žetonu obligāti nēsā kaklā.' },
    // 03 · Formas tērpa valkāšana
    { id: 'cold-c', chapter: '03', source: 'atgadne', prompt: 'Ko nozīmē burts „C” formas tērpa lietošanas principā COLD?', correct: 'Clean – ekipējumu un apģērbu uztur tīru', wrong: ['Cover – vienmēr ģērbj visas kārtas', 'Cool – ģērbjas vēsāk, nekā vajag', 'Camouflage – seju krāso maskēšanās krēmā'], explanation: 'C – Clean: ekipējumu un apģērbu uztur tīru, zeķes maina vismaz reizi diennaktī.' },
    { id: 'cold-o', chapter: '03', source: 'atgadne', prompt: 'Ko nozīmē burts „O” principā COLD?', correct: 'Overheating – nepārkarst un pārlieku nesvīst', wrong: ['Outside – vienmēr ģērbties kā ārā', 'Order – formas tērpu sakārto ierindai', 'Overdress – ģērbt vairāk kārtu nekā citi'], explanation: 'O – Overheating: ģērbjas atbilstoši slodzei, lai nepārkarstu un svīstu pēc iespējas mazāk.' },
    { id: 'cold-l', chapter: '03', source: 'atgadne', prompt: 'Ko nozīmē burts „L” principā COLD?', correct: 'Loose – apģērbs ir brīvs, ar gaisa slāņiem', wrong: ['Light – valkā vieglāko apģērbu, kas ir līdzi', 'Layer – valkā vienu biezu apģērba kārtu', 'Long – izvēlas tikai garas piedurknes'], explanation: 'L – Loose: apģērbs ir brīvs, lai starp kārtām veidotos gaisa slāņi.' },
    { id: 'cold-d', chapter: '03', source: 'atgadne', prompt: 'Ko nozīmē burts „D” principā COLD?', correct: 'Dry – apģērbu uztur sausu', wrong: ['Dress – vienmēr ģērbj visus slāņus', 'Dark – izvēlas tumšāku apģērbu', 'Daily – apģērbu maina katru dienu'], explanation: 'D – Dry: apģērbu uztur sausu un savlaicīgi žāvē.' },
    { id: 'dry-set', chapter: '03', source: 'atgadne', prompt: 'Ko VAM atgādne iesaka darīt ar vienu formas tērpa komplektu?', correct: 'Uzturēt to sausu un lietot pie mazas slodzes', wrong: ['Glabāt to mugursomā neizpakotu līdz mājām', 'Valkāt to tikai lietus laikā virs citām drēbēm', 'Izmantot to kā paklājiņu zem guļammaisa'], explanation: 'Vienu formas tērpa komplektu visu laiku uztur sausu un lieto tikai pie mazas fiziskās slodzes.' },
    { id: 'water', chapter: '03', source: 'atgadne', prompt: 'Cik ūdens dienā smagā darbā Latvijas apstākļos min VAM atgādne?', correct: 'Apmēram 3–6 litrus', wrong: ['Apmēram 1 litru', 'Ne vairāk kā 2 litrus', 'Vismaz 10 litrus'], explanation: 'Ja jāstrādā smagi, jādzer papildu ūdens – Latvijas apstākļos apmēram 3–6 litri dienā.' },
    { id: 'headwear', chapter: '03', source: 'am18', prompt: 'Kad formas tērpa cepuri pēc ārējā izskata prasībām drīkst nevalkāt?', correct: 'Transportlīdzeklī un telpās', wrong: ['Ierindā un sardzē', 'Mācībās un manevros', 'Ārā lietus laikā'], explanation: 'Cepuri valkā vienmēr, izņemot transportlīdzekļos un telpās, ja komandieris nav noteicis citādi.' },
    { id: 'bags', chapter: '03', source: 'am18', prompt: 'Kādu somu drīkst nest pie kaujas formas tērpa?', correct: 'Militāru mugursomu vai tumšu auduma rokas somu', wrong: ['Jebkuras krāsas sporta somu vai portfeli', 'Tikai dokumentu mapi, citas somas aizliegtas', 'Jebkuru somu, ja tā nav lielāka par 25 × 35 cm'], explanation: 'Pie kaujas formas tērpa drīkst nest tumšas krāsas auduma rokas somu vai militāru mugursomu.' },
    { id: 'umbrella', chapter: '03', source: 'am18', prompt: 'Vai pie kaujas formas tērpa lieto lietussargu?', correct: 'Nē, to nelieto', wrong: ['Jā, tikai melnu', 'Jā, ja lietus ir stiprs', 'Tikai maskēšanās krāsā'], explanation: 'Melnu lietussargu drīkst lietot pie ikdienas, parādes un viesību formas tērpa, bet pie kaujas formas tērpa – ne.' },
    // 04 · Ekipējuma sistēmas
    { id: 'kias', chapter: '04', source: 'am27', prompt: 'Ko nozīmē saīsinājums KIAS?', correct: 'Kaujas individuālās aizsardzības sistēma', wrong: ['Kaujas informācijas un apziņošanas sistēma', 'Kolektīvā inženiertehniskā aizsardzības sistēma', 'Kājnieku ieroču apkopes sistēma'], explanation: 'KIAS – kaujas individuālās aizsardzības sistēma: formas tērps, bruņucepure, balistiskā aizsardzība, guļammaisu sistēma u. c.' },
    { id: 'kmps', chapter: '04', source: 'am27', prompt: 'Ko nozīmē saīsinājums KMPS?', correct: 'Kaujas MTL pārnēsāšanas sistēma', wrong: ['Kaujas medicīniskās palīdzības sistēma', 'Kolektīvā maskēšanās un paslēpšanās sistēma', 'Kājnieku munīcijas piegādes sistēma'], explanation: 'KMPS – kaujas materiāltehnisko līdzekļu pārnēsāšanas sistēma: veste, somas, uzkabes josta, mugursomas.' },
    { id: 'ksip', chapter: '04', source: 'am27', prompt: 'Ko nozīmē saīsinājums KSIP?', correct: 'Kaujas sistēma izdzīvošanai un pastāvēšanai', wrong: ['Kaujas sakaru un informācijas pārraide', 'Kolektīvās sardzes un izlūkošanas plānošana', 'Kājnieku speciālo ieroču papildkomplekts'], explanation: 'KSIP – kaujas sistēma izdzīvošanai un pastāvēšanai: blašķe, medicīniskā pakete, lauka virtuve, higiēna, lietvedība u. c.' },
    { id: 'helmet-system', chapter: '04', source: 'am27', prompt: 'Kurai sistēmai pieder bruņucepure un balistiskās aizsardzības plāksnes?', correct: 'KIAS – individuālās aizsardzības sistēmai', wrong: ['KMPS – MTL pārnēsāšanas sistēmai', 'KSIP – izdzīvošanas un pastāvēšanas sistēmai', 'Nevienai – tas ir vienības inventārs'], explanation: 'Bruņucepure (ALPK-L1) un balistiskās aizsardzības komplekts (BEAR-II) ir KIAS komplekti.' },
    { id: 'pack-system', chapter: '04', source: 'am27', prompt: 'Kurai sistēmai pieder uzkabes josta, aptveru soma un 90 litru mugursoma?', correct: 'KMPS – pārnēsāšanas sistēmai', wrong: ['KIAS – aizsardzības sistēmai', 'KSIP – izdzīvošanas sistēmai', 'LVK – lauka virtuves komplektam'], explanation: 'Uzkabes josta un aptveru soma (PSK) un mugursomas (MMS) ir KMPS komplekti.' },
    { id: 'canteen-system', chapter: '04', source: 'am27', prompt: 'Kurai sistēmai pieder blašķe, medicīniskā pakete un kompass?', correct: 'KSIP – izdzīvošanas sistēmai', wrong: ['KIAS – aizsardzības sistēmai', 'KMPS – pārnēsāšanas sistēmai', 'PPK-MN – pirmās palīdzības komplektam'], explanation: 'Blašķe un medicīniskā pakete ir KSIP pamata komplektā, kompass – KSIP komplektā LAUKA.' },
    { id: 'mms', chapter: '04', source: 'am27', prompt: 'Kādas mugursomas ietilpst modulārās mugursomas sistēmas (MMS) komplektā?', correct: '90 litru mugursoma un uzbrukuma mugursoma', wrong: ['Divas 60 litru mugursomas un lietus pārvalks', '30 litru patruļsoma un medicīnas mugursoma', 'Mugursoma ar rāmi un guļammaisa pārvalks'], explanation: 'MMS komplektā ir 90 litru mugursoma ar kabatām un vāku un uzbrukuma mugursoma.' },
    { id: 'lvk', chapter: '04', source: 'am27', prompt: 'Ko ietver KSIP lauka virtuves komplekts (LVK)?', correct: 'Ēdamrīkus, krūzi, katliņu un degli', wrong: ['Guļammaisu, paklājiņu un teltenes pārvalku', 'Kompasu, lukturi un lāpstiņu', 'Gāzmasku, filtru un virsapavus'], explanation: 'LVK: dakšiņa, karote, nazis, krūze, katliņš ar vāku, deglis ar degvielas balonu un rāmi.' },
    { id: 'admin', chapter: '04', source: 'am27', prompt: 'Kas ietilpst KSIP lietvedības piederumu komplektā ADMIN?', correct: 'Piezīmju blociņš, pildspalva un kartes soma', wrong: ['Kompass, lukturis, lāpstiņa un saliekamais nazis', 'Ķīmiskās gaismas sarkanā, zaļā un zilā krāsā', 'Gāzmaska, filtrs, aizsargjaka un virsapavi'], explanation: 'ADMIN komplektā ir piezīmju blociņš, SOP un pierakstu grāmata, kartes soma, pildspalva, zīmulis un marķieri.' },
    { id: 'lauka', chapter: '04', source: 'am27', prompt: 'Kuri līdzekļi ietilpst KSIP komplektā LAUKA?', correct: 'Lukturis, kompass, lāpstiņa un nazis', wrong: ['Mitrās salvetes, skuveklis un tualetes papīrs', 'Blociņš, pildspalva, zīmulis un marķieri', 'Bruņucepure, pārvalks un ausu aizbāžņi'], explanation: 'LAUKA komplektā ir lukturis, kompass, lāpstiņa, saliekamais nazis, aukla, karabīne, izolācijas lente, savilcēji un maisi.' },
    { id: 'full-kit', chapter: '04', source: 'sargs2021', prompt: 'Kas NBS marša sacensībās 2021. gadā ietilpa „pilnajā ekipējumā”?', correct: 'Formas tērps, uzkabe, ierocis, ķivere, medpaka un ūdens', wrong: ['Formas tērps, guļammaiss, telts un trīs dienu pārtika', 'Tikai ierocis, astoņas magazīnas un ķivere', 'Mugursoma, rezerves zābaki, dvielis un higiēnas preces'], explanation: 'Pilnajā ekipējumā bija lauka formas tērps, uzkabe, ierocis, astoņas magazīnas, ķivere, medpaka un ūdens; trīs dienu ekipējums bija jānes lielajā mugursomā.' },
    // 05 · Medpakete
    { id: 'ifak-name', chapter: '05', source: 'mk720', prompt: 'Kā normatīvajos aktos sauc karavīra medpaketi?', correct: 'Individuālais medicīnisko materiālu un medikamentu komplekts', wrong: ['Glābēja aprīkojuma, materiālu un medikamentu komplekts vienībai', 'Vienības medicīniskās apgādes rezerves komplekts', 'Personīgo higiēnas un kāju kopšanas piederumu komplekts'], explanation: 'MK noteikumi Nr. 720 to sauc par karavīra un zemessarga individuālo medicīnisko materiālu un medikamentu komplektu.' },
    { id: 'ifak-count', chapter: '05', source: 'mk720', prompt: 'Cik pozīciju ir MK noteikumu Nr. 720 individuālā komplekta sarakstā?', correct: '17', wrong: ['7', '10', '25'], explanation: 'Individuālā komplekta sarakstā ir 17 pozīcijas – no modulāras somas līdz ūdens noturīgam marķierim.' },
    { id: 'bleeding', chapter: '05', source: 'mk720', prompt: 'Ar ko individuālajā komplektā aptur arteriālu asiņošanu?', correct: 'Ar taktiskajiem žņaugiem', wrong: ['Ar trīsstūrveida lakatiņu', 'Ar folijas segu', 'Ar nazofaringeālo elpvadu'], explanation: 'Komplektā ir taktiskie žņaugi arteriālās asiņošanas apturēšanai, kā arī spiedošs pārsējs un hemostātiskais līdzeklis.' },
    { id: 'npa', chapter: '05', source: 'mk720', prompt: 'Kam paredzēts nazofaringeālais elpvads?', correct: 'Elpceļu caurlaidības nodrošināšanai', wrong: ['Arteriālas asiņošanas apturēšanai', 'Cietušā sasildīšanai un siltuma saglabāšanai', 'Brūces dezinficēšanai pirms pārsiešanas'], explanation: 'Mācību programmā nazofaringeālais elpvads ir minēts pie elpceļu caurlaidības nodrošināšanas.' },
    { id: 'who-may', chapter: '05', source: 'mk720', prompt: 'Kas drīkst rīkoties ar individuālo medicīnisko komplektu?', correct: 'Tas, kurš beidzis paplašinātās pirmās palīdzības kursu', wrong: ['Tikai vienības ārsts vai medicīnas māsa ar sertifikātu', 'Jebkurš karavīrs, kas komplektu saņēmis noliktavā', 'Tikai komandieris vai viņa norīkots glābējs'], explanation: 'Ar komplektu drīkst rīkoties karavīrs vai zemessargs, kurš beidzis paplašinātās pirmās palīdzības individuālo kursu.' },
    { id: 'refresher', chapter: '05', source: 'mk720', prompt: 'Cik bieži jāapgūst individuālā kursa prasmju uzturēšanas apmācība?', correct: 'Ne retāk kā reizi trijos gados', wrong: ['Katru mēnesi', 'Tikai vienreiz dienesta laikā', 'Reizi desmit gados'], explanation: 'NBS vismaz reizi trijos gados organizē vismaz astoņu stundu prasmju uzturēšanas apmācību.' },
    { id: 'tourniquets', chapter: '05', source: 'sargs2022', prompt: 'Cik žņaugu pēc paplašinātās pirmās palīdzības kursa jābūt individuālajā ekipējumā?', correct: 'Divi – somiņā un uz uzkabes', wrong: ['Viens – mugursomas augšā', 'Trīs – visi medpaketē', 'Žņaugi nav jānēsā līdzi'], explanation: 'Pasniedzēja skaidro: jābūt diviem žņaugiem – vienam individuālajā somiņā, otram uz uzkabes (Sargs.lv, 2022).' },
    // 06 · Mugursoma un 3 dienu soma
    { id: 'pack-bottom', chapter: '06', source: 'jrg', prompt: 'Kas pēc Jaunsarga rokasgrāmatas jāliek mugursomas apakšā?', correct: 'Smagākais un mazāk vajadzīgais', wrong: ['Munīcija un ūdens, lai tie būtu stabili', 'Pārtika, lai tā nesaspiestos', 'Viss, kas vajadzīgs uzdevuma sākumā'], explanation: 'Rokasgrāmata: mugursomā apakšā liek smagāko un mazāk vajadzīgo, piemēram, rezerves drēbes.' },
    { id: 'pack-top', chapter: '06', source: 'jrg', prompt: 'Kas jāliek mugursomas virspusē?', correct: 'Uzdevumam vajadzīgākais, piemēram, munīcija', wrong: ['Rezerves drēbes, dvielis un rezerves zābaki', 'Guļammaiss, lai to ātri izņemtu vakarā', 'Smagākais, lai slodze paliktu uz pleciem'], explanation: 'Mugursomas saturu sakārto tā, lai visvairāk nepieciešamais konkrētā uzdevuma veikšanai būtu virspusē, piemēram, munīcija.' },
    { id: 'liner', chapter: '06', source: 'jrg', prompt: 'Kāpēc pirms kārtošanas mugursomā ieliek ūdensnecaurlaidīgu maisu?', correct: 'Lai saturs nesamirktu, iekrītot ūdenī', wrong: ['Lai soma kļūtu vieglāka', 'Lai ekipējums neradītu troksni', 'Lai somu varētu izmantot kā spilvenu'], explanation: 'Ūdensnecaurlaidīgs maiss pasargā somas saturu no samirkšanas, ja soma iekrīt ūdenī.' },
    { id: 'noise', chapter: '06', source: 'jrg', prompt: 'Kāpēc ekipējuma daļas nostiprina ar auklām vai līmlenti?', correct: 'Lai tās nekristu ārā un netrokšņotu', wrong: ['Lai tās vieglāk izņemtu tumsā', 'Lai soma izskatītos kārtīgāka ierindā', 'Lai ekipējums ātrāk izžūtu pēc lietus'], explanation: 'Ekipējumu nostiprina, lai tas nenokristu un neradītu troksni – var nākties pārvietoties skriešus vai guļus.' },
    { id: 'hips', chapter: '06', source: 'jrg', prompt: 'Uz kuru ķermeņa daļu jāgulstas mugursomas slodzei?', correct: 'Uz gurniem', wrong: ['Uz pleciem', 'Uz muguras', 'Uz kakla'], explanation: 'Mugursomai jānodrošina maksimālā slodze uz gurniem, nevis uz pleciem vai muguras – gurni ir ķermeņa izturīgākā daļa.' },
    { id: 'outer-pockets', chapter: '06', source: 'jrg', prompt: 'Ko liek mugursomas ārējās kabatās?', correct: 'Tikai pašu nepieciešamāko', wrong: ['Visas rezerves drēbes', 'Guļammaisu, paklājiņu un teltenes pārvalku', 'Visu, kas neietilpst somā'], explanation: 'Ārējās kabatās jāsaliek tikai pats nepieciešamākais.' },
    { id: 'water-3day', chapter: '06', source: 'sargs2021', prompt: 'Cik dzeramā ūdens bija jānes trīs dienu ekipējumā NBS marša sacensībās 2021. gadā?', correct: 'Ne mazāk kā 3 litri', wrong: ['Ne mazāk kā 1 litrs', 'Ne mazāk kā 6 litri', 'Ūdens nebija jānes'], explanation: 'Lielajā mugursomā bija jānes trīs dienu ekipējums, tostarp ne mazāk kā trīs litri dzeramā ūdens.' },
    { id: 'three-day', chapter: '06', source: 'sargs2021', prompt: 'Kas ietilpa trīs dienu ekipējumā NBS marša sacensībās 2021. gadā?', correct: 'Guļammaiss, rezerves forma un zābaki, dvielis', wrong: ['Telts, saliekamais krēsls un gāzes plīts', 'Sapieru lāpsta, cirvis un virve', 'Rācija, rezerves baterijas un binoklis'], explanation: 'Trīs dienu ekipējumā bija dvielis, rezerves zābaki, higiēnas preces, rezerves forma, guļammaiss, pārtikas deva trim dienām un ūdens.' },
    // 07 · Sagatavošanās uzdevumam
    { id: 'imums', chapter: '07', source: 'atgadne', prompt: 'Ko nozīmē saīsinājums IMUMS?', correct: 'Ierocis, munīcija, uzkabe, maskēšanās, sakari', wrong: ['Instruktāža, maršruts, uzdevums, mērķis, signāli', 'Izlūkošana, manevrs, uguns, maskēšanās, sardze', 'Ierocis, medicīna, uzturs, mugursoma, somas'], explanation: 'IMUMS – pārbaudes secība pirms uzdevuma: ierocis, munīcija, uzkabe, maskēšanās, sakari.' },
    { id: 'imums-i', chapter: '07', source: 'atgadne', prompt: 'Ko pārbauda IMUMS solī „I”?', correct: 'Ieroča stāvokli un tā funkcionālo darbību', wrong: ['Individuālo medicīnas paketi un abus žņaugus', 'Izlūkošanas datus un maršruta karti', 'Instruktora izsniegto uzdevuma pavēli'], explanation: 'Solī „I” apskata stobra kanālu, pārbauda liesmu slāpētāja stiprinājumu un veic ieroča funkcionālo pārbaudi.' },
    { id: 'imums-u', chapter: '07', source: 'atgadne', prompt: 'Kas VAM atgādnē minēts kā uzkabē nokomplektējams?', correct: 'Medicīnas pakete, aptversomas un kompass', wrong: ['Guļammaiss, paklājiņš un rezerves drēbes', 'Telts, katliņš un trīs dienu pārtikas deva', 'Rezerves zābaki, dvielis un higiēnas preces'], explanation: 'Uzkabē: medicīnas pakete, aptversomas, somas ūdens blašķēm, kompass, rakstāmpiederumi, kartes, dzirdes un redzes aizsardzība.' },
    { id: 'rattle', chapter: '07', source: 'atgadne', prompt: 'Kā pēc uzkabes sakārtošanas pārbauda, vai ekipējums netrokšņo?', correct: 'Palēkā un paklausās, vai kaut kas negrab', wrong: ['Noliek uzkabi uz grīdas un sakrata', 'Palūdz biedram to nosvērt rokās', 'Iegremdē uzkabi ūdenī un vēro burbuļus'], explanation: 'Beigās katrs palēkā un paklausās, vai uzkabē kaut kas negrab; nepilnības uzreiz novērš.' },
    { id: 'imums-m2', chapter: '07', source: 'atgadne', prompt: 'Ko ietver IMUMS otrais solis „M” – maskēšanās?', correct: 'Sevis un ekipējuma maskēšanu', wrong: ['Munīcijas pārskaitīšanu un nodošanu', 'Marša maršruta izvēli pa kartei', 'Magazīnu pielādēšanu ar trasētājiem'], explanation: 'Maskēšanās: individuālā maskēšanās (krēms, dabīgie un mākslīgie līdzekļi) un ekipējuma skaņas un formas maskēšana.' },
    { id: 'imums-s', chapter: '07', source: 'atgadne', prompt: 'Kas notiek IMUMS solī „S”?', correct: 'Pārbauda sakarus – staciju, barošanu, frekvenci', wrong: ['Pārbauda mugursomas saturu un kārtošanas secību', 'Sagatavo sardzes maiņu un posteņu sarakstu', 'Saņem signālraķetes un tās salādē'], explanation: 'Solī „S” pārbauda radiostaciju un barošanas avotu, uzstāda frekvenci un veic sakaru pārbaudi.' },
    { id: 'imums-m1', chapter: '07', source: 'atgadne', prompt: 'Kāda munīcija IMUMS solī „M” nav jāsajauc ar kaujas munīciju?', correct: 'Salūta munīcija', wrong: ['Trasējošā munīcija', 'Bruņusitējā munīcija', 'Zemskaņas munīcija'], explanation: 'Pārbaudot magazīnas, raugās, lai nebūtu uzdevumam neatbilstošas munīcijas – salūta munīciju nesajauc ar kaujas vai mācību munīciju.' },
  ],
};
