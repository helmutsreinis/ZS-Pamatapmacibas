# Mācību centrs – ieroču uzbūve un ierindas mācība

Latvian-language static learning website with separate modules behind one hub page:

- **G36** – field strip and assembly animated on a photographic model of the rifle with the adjustable stock (a close-up shows the stock's pin storage holes while the pins are removed), and a self-test (16-step ordering task plus one function question per part). The module was first published as G36C; old `#/g36c/...` links still open it.
- **AK-4** – the same for the AK-4 (Swedish licence build of the HK G3): 8 steps in the order of the Jaunsargs' handbook, movements from the G3 service manual, parts cut from a CC BY-SA photo.
- **Ierinda** – the drill-training material: ten topics with explanations and a flash-card mode, and a configurable test.
- **Munīcija** – four topics on ammunition: cartridge construction (a sectioned cartridge), calibre and designations ("5,56 × 45 mm NATO" decoded, dimension lines, rifling, a calibre comparison and C.I.P. dimensions), cartridge types (ball, tracer, blank, drill, armour-piercing, incendiary, simulation, plastic-bullet and subsonic rounds, the blank-firing adapter) and markings and safety (headstamps, storage, misfires); 68 questions.
- **Ekipējums** – seven topics on kit: the combat uniform and where its patches go (the photo from the Cabinet regulation), pocket contents on the course's soldier poster, wearing the uniform (COLD, appearance rules), the kit systems KIAS / KMPS / KSIP, the first-aid kit, the course's 3-day bag packing order on a rucksack photo, and the IMUMS pre-task check; 104 questions.
- **Kopējā pārbaude** – one test across every ready module: weapon questions generated from the module content (part functions, part photos, movement directions, step order) and each weapon's technical-data questions, plus the drill question bank and the ammunition and kit questions.

The ammunition and kit topics are photos with numbered markers: choosing a marker on the photo or in the list shows what it is; "Slēpt nosaukumus" hides the names for self-testing. Every marked photo also becomes test questions ("what is marked here?"), shown with the photo and a pulsing ring.

Everything runs in the browser: no backend, login, analytics or external runtime assets. Test preferences and the best result are kept in the browser's local storage only.

## Build

```powershell
npm install
npm run build
```

If the machine's global `npm` launcher is broken, the equivalent local commands are:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node node_modules/vitest/vitest.mjs run
```

The deployable output is `dist/`. Vite uses a relative base path and the pages use hash routes (`#/g36/macibas`), so the same build works on any static host, at the root or in a subfolder.

### Netlify

`netlify.toml` holds the whole configuration: Netlify installs the packages from `package-lock.json`, runs `npm test && npm run build` on Node 22 and publishes `dist/`. A failing test stops the deploy.

1. In Netlify choose **Add new site → Import an existing project → GitHub** and pick this repository.
2. Leave the build settings as Netlify reads them from `netlify.toml` (build command `npm test && npm run build`, publish directory `dist`) and deploy.

Every push to `main` then deploys automatically, and pull requests get preview deploys. No rewrites are needed for the hash routes; unknown paths are redirected to the home page, and the hashed files in `/assets/` are cached for a year.

### Azure Storage static website

Upload **the contents** of `dist/` to the storage account's `$web` container, with `index.html` as the index document.

## Pages

| Route | Page |
| --- | --- |
| `#/` | Hub: module cards (ready / planned) and the combined test |
| `#/<weapon>/macibas`, `#/<weapon>/parbaude` | Weapon learning mode and self-test |
| `#/ierinda`, `#/ierinda/tema-NN` | Drill topics |
| `#/ierinda/parbaude` | Drill test |
| `#/municija`, `#/municija/tema-NN`, `#/municija/parbaude` | Ammunition topics and test |
| `#/ekipejums`, `#/ekipejums/tema-NN`, `#/ekipejums/parbaude` | Kit topics and test |
| `#/parbaude` | Combined test |

Both tests share one engine (`src/exam/`): topic selection, 20 / 40 / 60 / all questions (drawn in proportion to the chosen topics), exam or training mode, optional time limit, pass mark 70–90 %, question map with flags, keyboard (1–4, ← →, F), results by module and topic, answer review and printing. A test in progress survives moving to another page.

## Code layout

- `src/modules.ts` – the registry: hub cards, weapons and exam definitions.
- `src/weapons/types.ts` – what a weapon module provides (`WeaponModule`).
- `src/weapons/g36/` – the G36 module: `content.ts` (Latvian texts; the supplied step labels are the order-test answer key; technical-data questions), `parts.ts` + `parts.json` (photo sprites), `timeline.ts` (the movements), `index.ts` (the module), `assets/` (sprites).
- `src/weapons/ak4/` – the AK-4 module, same structure; step labels follow the Jaunsargs' handbook.
- `src/weapons/learn-view.ts`, `test-view.ts`, `questions.ts` – weapon-independent learning page, self-test and exam questions (part functions, part photos, movement directions, step order).
- `src/scene/` – the animation engine: `engine.ts` draws the SVG scene from a `SceneModel`, `timeline.ts` evaluates keyframes, `player.ts` handles playback, `thumb.ts` draws part pictures.
- `src/drill/` – the drill question bank (`ierinda-bank.json`, as supplied), topics page and tabs.
- `src/study/` – study modules (chapters of explanations with photos, and a question bank): `types.ts` (`StudyModule`, content blocks, marked figures), `figure.ts` (photo with numbered markers, leader lines and dimension lines), `blocks.ts` (text, cards, tables, ordered steps, lists, notes, designation decoder), `view.ts` (chapter page), `questions.ts` (the question source, including the "what is marked here?" questions made from every figure with a `quiz` prompt), `study.css` (their styles).
- `src/study/ammo/` and `src/study/kit/` – the Munīcija and Ekipējums content (`index.ts`: sources, chapters, figures, questions) and their photos (`assets/`, sizes in `assets/images.json`). `src/study/kit/pockets.ts` holds the two figures drawn on course material: the pocket contents on the soldier poster and the 3-day bag order on the rucksack photo.
- `src/exam/` – question drawing and scoring (`model.ts`), the test pages (`view.ts`), local storage (`store.ts`).
- `src/ui/` – site shell, hub page and DOM helpers; `src/lv.ts` – Latvian number agreement and formatting.

## Adding a weapon

1. Create `src/weapons/<id>/` with the same files as the G36 and AK-4 folders: `content.ts` (steps in the course order, with `label`, `assemblyLabel`, `part`, `function`, `explanation`, directions and sources; optional `theory` questions), part sprites and `parts.json`, a `timeline.ts` with one segment per step, and an `index.ts` that exports a `WeaponModule`.
2. Register it in `src/modules.ts`: add it to `weapons` and add a `ready` card with the links `#/<id>/macibas` and `#/<id>/parbaude`.

The routes, header navigation, weapon self-test, exam question topics and the combined test pick the new module up from the registry. `src/modules.test.ts` and `src/weapons/questions.test.ts` check every registered weapon (timeline matches the steps, parts exist, generated questions are valid).

## Adding a study module

1. Create `src/study/<id>/index.ts` exporting a `StudyModule` (chapters with blocks, sources, questions with one correct and three wrong answers) and put its photos in `assets/` through the image tool below.
2. Register it in `src/modules.ts` (`studies`); the hub card, header tab, routes (`#/<id>`, `#/<id>/tema-NN`, `#/<id>/parbaude`), test and combined test follow. `src/study/study.test.ts` checks every study module: typography, three distinct wrong answers, known sources, markers inside their photos, credits, topic counts, and that the correct answer is the longest option in at most 40 % of the questions.

## Study-module photos

`tools/build_study_images.py` builds `src/study/*/assets/` from `tools/study_images.json`, which lists every photo with its source URL, author and licence (needs Pillow, numpy and opencv-python):

```powershell
python tools/build_study_images.py            # all photos; add a file-name fragment to rebuild one
```

The tool downloads each source once into `tools/.cache/study/` (not committed), then rotates, paints out printed labels (`trace_lines`, `paint_lines`, `erase`, `whiteout`), crops, pads and scales it, and writes the pixel sizes to `assets/images.json`. Marker coordinates in the module content are in the final image's pixels, so change them together with a crop.

- **Kaujas formas tērps:** figure 106 of annex 2 to Cabinet regulation No 26 (likumi.lv). Latvian copyright law (Autortiesību likums, section 6) does not protect normative acts; the printed labels and pointer lines were removed and replaced by the site's own markers.
- **Other photos:** Wikimedia Commons, US government works (public domain) and CC BY / CC BY-SA photos; every photo shows its author, source and licence under it and in the test. CC BY-SA derivatives (the crops) are under the same licence.
- **Course material:** the soldier poster (drawn by the trainee, used with permission) and the numbered 3-day bag photo are kept in `tools/study-sources/` and listed with `source` instead of `url`. The tool paints out the photo's printed numbers (`remove_markers`: webbing copied from whole rows away, plain fabric inpainted) so that the site's own markers can take their place, and the maker's logo (`whiteout`); the credit under the photo still names Tasmanian Tiger. The rucksack photo is a Tasmanian Tiger product photo from the course handout – **confirm that you may publish it before deploying the site publicly**, or replace `tools/study-sources/rucksack-course-numbered.png` with your own photo of the course rucksack and rerun the tool (the marker positions are in `src/study/kit/pockets.ts`).

## Part images

### G36

`tools/build_part_images.py` builds every sprite in `src/weapons/g36/assets/` and the placement file `src/weapons/g36/parts.json` (needs Python with `numpy` and `opencv-python`):

```powershell
python tools/build_part_images.py
```

- **Photographs:** receiver, carrying handle, grip with trigger mechanism, recoil spring with end piece, bolt carrier, bolt head front, cam-pin and firing-pin retaining-pin heads, magazine well, magazine catch, handguard, flash hider and magazine are cut from `src/assets/g36-reference-parts.png` (a left-side field-strip photo of a G36C), so they share light, colour and scale.
- **Adjustable stock:** cut from `src/assets/g36ka4-reference.webp`, [a photo of a Bundeswehr G36K A4](https://commons.wikimedia.org/wiki/File:German_Army_-_HK_G36K_A4_-_EOtech_holographic_sight_-_red_dot_magnifier_G33%E2%84%A2.webp) by Pierre Courtejoie (US Army / DVIDS, public domain; credited on the learning page and in the footer). The photo shows the right side, so the stock is mirrored, scaled so that its hinge matches the rear of the receiver (0.99 world units per photo pixel) and given the grip's tone. The tool also writes the positions of its three pin storage holes to `parts.json` (`stockHoles`); the learning page shows them in a close-up while the pins are removed.
- **Rebuilt:** the photo lacks the middle of the receiver; the tool rebuilds that 75 px section from the receiver's own side texture.
- **Renders:** the parts that are never visible in the photo – the three grip and handguard pins, firing pin, gas piston, operating rod and spring, and the barrel with its gas block – are shaded renders in the photo's colours. Any of them can be replaced with a real photo: put a left-side photo with a transparent background in the assets folder under the same name and adjust its size in `parts.json`.

Confirm that you may publish the G36C field-strip photos in `src/assets/` before deploying the site publicly.

### AK-4

`tools/build_ak4_images.py` (with the helpers in `tools/sprite_kit.py`) builds `src/weapons/ak4/assets/` and `src/weapons/ak4/parts.json`:

```powershell
python tools/build_ak4_images.py            # add --debug <folder> for fitting and cut-out previews
```

- **Source:** `src/assets/ak4-reference-parts.jpg` is [“G3A3 disassembled mod.jpg”](https://commons.wikimedia.org/wiki/File:G3A3_disassembled_mod.jpg) by lago4096, retouched by Auge=mit, Wikimedia Commons, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The sprites are derived works under the same licence; the credit is shown on the AK-4 learning page and in the site footer. Keep it there when publishing.
- **Fitting:** the photo is a collage (“nicht maßstabsgetreu”): every part has its own scale and some are shown from the other side. Each part is rotated, mirrored where needed (stock, grip) and scaled so that it matches the faded picture of the assembled rifle at the top of the photo, which defines the world (1 unit ≈ 0.8 mm, left side, muzzle left).
- **Rebuilt:** the bolt carrier is photographed from above; the tool rebuilds a side view (tube on top of the carrier body). The magazine was photographed at an angle and is stretched to its side-view proportions. The cocking handle, magazine catch, bare barrel (under the handguard) and pin holes are cut or painted so they can move independently. Pin heads seen end-on are rendered.
- The tool also writes `src/assets/ak4-reference-cover.jpg`, a parts-only crop of the photo used for the AK-4 page headers and on the hub.
- The other two photos supplied with the request (a deactivated G3 on white cloth) were used only to check proportions; they are not part of the site.

## Sources

- [Bundeswehr, Zentralrichtlinie A2-222/0-0-4741 “Das Gewehr G36”](http://bundzone.bplaced.net/images//dokumente/Zentralrichtlinie_GewehrG36.pdf), sections 331–336 (field strip, bolt, assembly and function check)
- [Heckler & Koch G36 technical data PDF](https://hk-manuals.s3.amazonaws.com/files/Military/G36/G36_Technical_Data.pdf) (G36: 1002 / 755 mm, 480 mm barrel, about 3630 g)
- [Heckler & Koch G36 product page](https://www.hecklerkoch.eu/en/Products/Military%20and%20Law%20Enforcement/Assault%20rifles/G36)
- [HKParts G36/SL8 catalog](https://hkparts.net/hk-rifle-smg-parts/g36-sl8-series/)
- [Jaunsarga rokasgrāmata](https://rojasvidusskola.lv/wp-content/uploads/2015/03/Jaunsarga-rokasgramata.pdf), chapter 12 (AK-4: parts, technical data, daļējā izjaukšana), based on “Triecienšautene AK-4 (G-3)”, Rīga 2005
- [Bundeswehr ZDv 3/13 “Das Gewehr G3” (1999)](https://upload.wikimedia.org/wikipedia/commons/6/6c/ZDv_3-13_Das_Gewehr_G3_(1999).pdf), Nr. 201–215 (parts, operation) and 318–323 (stripping, assembly, function check)
- [Course presentation “Triecienšautene AK-4 (G-3)”](https://www.slideserve.com/andres/triecien-autene-ak-4-g-3) (part functions)
- The supplied ten-page drill-training material (question bank in `src/drill/ierinda-bank.json`)
- Munīcija: [Ieroču aprites likums](https://likumi.lv/ta/id/305818-ierocu-aprites-likums) (terms), J. Melderis, [“Ieroču un munīcijas uzbūves un darbības principi”](https://virsnieki.lv/wp-content/uploads/2022/04/Ierocu-un-municijas-uzbuve-un-darbibas-principi.pdf) (NAA, 2008), C.I.P. dimension tables, the Bundeswehr G36 manual (Nr. 210, 502–511, 701–711), [MK noteikumi Nr. 494](https://likumi.lv/ta/id/316509) (misfire), the Jaunsarga rokasgrāmata (range rules), Nammo product data, US Army TM 43-0001-27, the Small Arms Survey identification handbook, SAAMI (via American Rifleman), Simunition
- Ekipējums: [MK noteikumi Nr. 26](https://likumi.lv/ta/id/311981-noteikumi-par-karavira-formas-terpiem-un-atskiribas-zimem) (uniform, patches), AM noteikumi Nr. 18-NOT (2012; appearance, reflective band, ID tag), JC noteikumi Nr. 8-NOT (Jaunsardze uniform), AM noteikumi Nr. 27-NOT (2015; kit systems), [MK noteikumi Nr. 720](https://likumi.lv/ta/id/214698) (first-aid kit), the Jaunsarga rokasgrāmata (rucksack), the VAM course reminder (IMUMS, COLD, hygiene), sargs.lv (2021 march kit, 2022 tourniquets), and the course's pocket list supplied by the trainee
- [Azure Storage static website documentation](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website)

The site is an unofficial study aid. Before using it as official training material, have an instructor check the points in [CONTENT_REVIEW.md](CONTENT_REVIEW.md).
