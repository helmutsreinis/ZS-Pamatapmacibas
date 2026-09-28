# Mācību centrs – ieroču uzbūve un ierindas mācība

Latvian-language static learning website with separate modules behind one hub page:

- **G36C** – field strip and assembly animated on a photographic model of the rifle, and a self-test (16-step ordering task plus one function question per part).
- **AK-4** – the same for the AK-4 (Swedish licence build of the HK G3): 8 steps in the order of the Jaunsargs' handbook, movements from the G3 service manual, parts cut from a CC BY-SA photo.
- **Ierinda** – the drill-training material: ten topics with explanations and a flash-card mode, and a configurable test.
- **Kopējā pārbaude** – one test across every ready module: weapon questions generated from the module content (part functions, part photos, movement directions, step order) and each weapon's technical-data questions, plus the drill question bank.

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

The deployable output is `dist/`. Vite uses a relative base path and the pages use hash routes (`#/g36c/macibas`), so the same build works on any static host, at the root or in a subfolder.

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
| `#/parbaude` | Combined test |

Both tests share one engine (`src/exam/`): topic selection, 20 / 40 / 60 / all questions (drawn in proportion to the chosen topics), exam or training mode, optional time limit, pass mark 70–90 %, question map with flags, keyboard (1–4, ← →, F), results by module and topic, answer review and printing. A test in progress survives moving to another page.

## Code layout

- `src/modules.ts` – the registry: hub cards, weapons and exam definitions.
- `src/weapons/types.ts` – what a weapon module provides (`WeaponModule`).
- `src/weapons/g36c/` – the G36C module: `content.ts` (Latvian texts; the supplied step labels are the order-test answer key; technical-data questions), `parts.ts` + `parts.json` (photo sprites), `timeline.ts` (the movements), `index.ts` (the module), `assets/` (sprites).
- `src/weapons/ak4/` – the AK-4 module, same structure; step labels follow the Jaunsargs' handbook.
- `src/weapons/learn-view.ts`, `test-view.ts`, `questions.ts` – weapon-independent learning page, self-test and exam questions (part functions, part photos, movement directions, step order).
- `src/scene/` – the animation engine: `engine.ts` draws the SVG scene from a `SceneModel`, `timeline.ts` evaluates keyframes, `player.ts` handles playback, `thumb.ts` draws part pictures.
- `src/drill/` – the drill question bank (`ierinda-bank.json`, as supplied), topics page and tabs.
- `src/exam/` – question drawing and scoring (`model.ts`), the test pages (`view.ts`), local storage (`store.ts`).
- `src/ui/` – site shell, hub page and DOM helpers; `src/lv.ts` – Latvian number agreement and formatting.

## Adding a weapon

1. Create `src/weapons/<id>/` with the same files as the G36C and AK-4 folders: `content.ts` (steps in the course order, with `label`, `assemblyLabel`, `part`, `function`, `explanation`, directions and sources; optional `theory` questions), part sprites and `parts.json`, a `timeline.ts` with one segment per step, and an `index.ts` that exports a `WeaponModule`.
2. Register it in `src/modules.ts`: add it to `weapons` and add a `ready` card with the links `#/<id>/macibas` and `#/<id>/parbaude`.

The routes, header navigation, weapon self-test, exam question topics and the combined test pick the new module up from the registry. `src/modules.test.ts` and `src/weapons/questions.test.ts` check every registered weapon (timeline matches the steps, parts exist, generated questions are valid).

## Part images

### G36C

`tools/build_part_images.py` builds every sprite in `src/weapons/g36c/assets/` and the placement file `src/weapons/g36c/parts.json` (needs Python with `numpy` and `opencv-python`):

```powershell
python tools/build_part_images.py
```

- **Photographs:** stock, receiver, carrying handle, grip with trigger mechanism, recoil spring with end piece, bolt carrier, bolt head front, cam-pin and firing-pin retaining-pin heads, magazine well, magazine catch, handguard, flash hider and magazine are cut from `src/assets/g36-reference-parts.png` (a left-side field-strip photo), so they share light, colour and scale.
- **Rebuilt:** the photo lacks the middle of the receiver; the tool rebuilds that 75 px section from the receiver's own side texture.
- **Renders:** the parts that are never visible in the photo – the three grip and handguard pins, firing pin, gas piston, operating rod and spring, and the barrel with its gas block – are shaded renders in the photo's colours. Any of them can be replaced with a real photo: put a left-side photo with a transparent background in the assets folder under the same name and adjust its size in `parts.json`.

Confirm that you may publish the G36C reference photos in `src/assets/` before deploying the site publicly.

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
- [Heckler & Koch G36 technical data PDF](https://hk-manuals.s3.amazonaws.com/files/Military/G36/G36_Technical_Data.pdf) (G36C: 716 / 500 mm, 228 mm barrel)
- [Heckler & Koch G36 product page](https://www.hecklerkoch.eu/en/Products/Military%20and%20Law%20Enforcement/Assault%20rifles/G36)
- [HKParts G36/SL8 catalog](https://hkparts.net/hk-rifle-smg-parts/g36-sl8-series/)
- [Jaunsarga rokasgrāmata](https://rojasvidusskola.lv/wp-content/uploads/2015/03/Jaunsarga-rokasgramata.pdf), chapter 12 (AK-4: parts, technical data, daļējā izjaukšana), based on “Triecienšautene AK-4 (G-3)”, Rīga 2005
- [Bundeswehr ZDv 3/13 “Das Gewehr G3” (1999)](https://upload.wikimedia.org/wikipedia/commons/6/6c/ZDv_3-13_Das_Gewehr_G3_(1999).pdf), Nr. 201–215 (parts, operation) and 318–323 (stripping, assembly, function check)
- [Course presentation “Triecienšautene AK-4 (G-3)”](https://www.slideserve.com/andres/triecien-autene-ak-4-g-3) (part functions)
- The supplied ten-page drill-training material (question bank in `src/drill/ierinda-bank.json`)
- [Azure Storage static website documentation](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website)

The site is an unofficial study aid. Before using it as official training material, have an instructor check the points in [CONTENT_REVIEW.md](CONTENT_REVIEW.md).
