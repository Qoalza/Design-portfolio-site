# Concept V2 — Figma parameter ledger

This ledger records only values inspected from current Figma data. Screenshots are validation evidence, not parameter sources. Rows are extended before the corresponding implementation group changes code.

## Foundation and Library V2

| Figma node | Property | Current Figma value / binding | Baseline implementation | Status | Verification |
|---|---|---|---|---|---|
| Library V2 document | Pages | Cover, TYPOGRAPHY, Main, BASE, Controls, Info, Lines, SYSTEM, Navigation | No tracked library source tree | differs | Read-only Plugin API inventory, 2026-09-13 |
| `62:4149` | Component set | `Filled / Button · Filled · Default`; Medium 36 px, Small 32 px | `Controls.jsx` supports one 36 px size | partial | `get_design_context` plus read-only component inventory |
| `62:4149` | Layout | gap 4 px; horizontal padding 12 px; text inset 4 px; radius 8 px | Same values in legacy CSS | matches | `get_design_context` |
| `62:4149` | Typography | Onest Regular, 14/16 px, letter spacing -0.1 px | Same values in legacy CSS | matches | `get_design_context` |
| `62:4149` | Fill/Accent states | Enable `#0378d6/#dadde0`, border `#1d90eb`; Hover `#0462af/#f2f4f5`, border `#0378d6`; Press `#004c88/#fff`, border `#0462af`; Disable `#1d1e1f/#44494d` | Legacy Enable omitted the `#1d90eb` border | differs | `get_design_context`; isolated V2 tokens added |
| `62:4149` | Fill/Neutral states | Enable `#dadde0/#44494d`; Hover `#f2f4f5/#232526`; Press `#fff/#0d0f0f`; Disable `#1d1e1f/#44494d` | Same colors; legacy border handled per consumer | partial | `get_design_context`; isolated V2 tokens added |
| `62:4149` | Light/Neutral states | Enable `#232526/#adb3b8`; Hover `#232526/#f2f4f5`; Press `#1d1e1f/#fff`, border `#44494d`; Disable `#1d1e1f/#44494d` | Same state values | matches | `get_design_context` |
| `62:4149` | Ghost/Neutral states | Enable transparent/`#adb3b8`; Hover `#232526/#f2f4f5`; Press `#1d1e1f/#fff`, border `#44494d`; Disable transparent/`#44494d` | Same except legacy press border was absent | differs | `get_design_context`; isolated V2 tokens added |
| `22:479` | Tabs | 32 px high; 4 px gap; 8 px horizontal padding; 8 px radius | Same geometry | matches | `get_design_context` |
| `22:479` | Tab states | Enable `#adb3b8`; Hover background `#1d1e1f`, foreground `#dadde0`; Active background `#232526`, label `#f2f4f5`, icon `#43a2ee`; Disable `#44494d` | Same values | matches | `get_design_context` |
| `22:4019` | Font roles | Google Sans for headings/buttons, Onest for labels/descriptions, Source Code Pro for tags/technical text | All three font families are bundled locally | matches | Read-only typography page inventory |
| `6:260` | Separation source | Dedicated Library V2 line component family | Legacy page uses borders and exported separation SVGs | structural equivalent pending per consumer | `get_design_context`; token `--v2-separation` isolated |

## Source provenance

- Implementation baseline: `19bf69b4c1c04d91b4a536cf8e63bae6d62fb423`.
- Published prototype source reference: `8b39e5e9600e53269d69e373d33d770b6f2ba28a`.
- `tools/concept-v2/source.tar.gz` SHA-256: `d3a2dc3d984c5c78289992853361616056dd5d9afa0f3dbf17572f0375476caf`.
- The archive and `public/concept-v2/**` remain immutable reference artifacts; implementation lives in `tools/concept-v2/app/**`.

## Hero and published process schema

| Figma node | Property | Current Figma value / binding | Implementation | Status | Verification |
|---|---|---|---|---|---|
| `3125:81641` | Large composition | Vertical; content max-width 1200 px; horizontal padding 24 px; main gap 64 px | Height-driven `data-layout="large"`; same max-width, padding and gap | matches | `get_design_context`; runtime at 2560×1440 and 1920×1600 |
| `3125:81641` | Large title block | Width 751 px; title 56/68 Google Sans; intro 20/36 Onest; text/action spacing 72 px | Same geometry, typography and spacing | matches | `get_design_context`; computed runtime styles |
| `3125:81641` | Large schema placement | 947×594 px; caption below with 24 px gap | Published SVG rendered at 947×594; caption below | matches | `get_design_context`; runtime rects |
| `3125:81642` | Small composition | Horizontal; max-width 1200 px; padding 24 px; gap 24 px; name hidden | Same; selected for viewport height below 1300 px | matches | `get_design_context`; runtime at 1920×1080 and 1440×900 |
| `3125:81642` | Small schema placement | Caption above; 24 px gap; schema 720×452 px | Same placement and size | matches | `get_design_context`; runtime rects |
| `3125:81641`, `3125:81642` | Header | 80 px high; max-width 1200 px; Library tabs/buttons | Existing accessible header retained and aligned to Library V2 tokens | structural equivalent | source instance tree and Library component contexts |
| `3125:81641`, `3125:81642` | Lower strip | 171 px total; disciplines row above four equal facts; inner width 1280 px; fact padding 24×40 px | Same hierarchy, heights, widths, separators and text styles | matches | `get_design_context`; runtime rects |
| `30894:424` | Code icon | Light / Dev / Code; 24 px frame; true 1 px rounded stroke vector | Exact Figma-exported SVG stored as `public/assets/code.svg`; used at the development node | matches | `get_design_context`; `figma_download_assets`; runtime href |
| Published SVG source | Geometry and interaction | 1000×666.667 viewBox, seven nodes, three routes, interactive lens | Original route/node data retained; magnification now uses an SVG group transform and accounts for `meet` free fields | matches | source diff, pure coordinate tests, keyboard/pointer runtime check |
| User contract | Pulse cadence and arrival | Random idle pause 2–3 s; terminal outline/glow 60 ms in + 240 ms fade; reverse arrives at opposite terminal; cancellation suppresses late arrival | Scheduler and terminal-only SVG animation implement the same timings and cancellation | matches | deterministic scheduler test and runtime pulse observation |

## Project card

| Figma node | Property | Enable | Hover | Implementation / verification |
|---|---|---|---|---|
| `3110:65334`, `3110:65333` | Card geometry | 638.5×613 px; top 329 px; bottom 284 px | unchanged | Exact runtime rects at 1440×900 |
| `3075:60182` | Section geometry | 1278×1125 px; vertical gap 80; padding 120 px top / 80 px bottom; `clipsContent=false` | Desktop section uses the same minimum height, padding and gap | Exact CSS plus runtime rects at 1440×900 |
| `3075:60329` | Heading / grid placement | Heading 1278×136 with 56 px side padding; grid 1278×709 with 96 px top padding | Same desktop geometry | Exact CSS plus runtime rects at 1440×900 |
| `3110:65164`, `3110:65198` | Main layout | padding 24 px top, 56 px sides, 48 px bottom; gap 32 px | unchanged | Exact CSS and runtime rects |
| `3110:65334`, `3110:65333`, preview children | Clipping | Card and preview `clipsContent=false`; main content `clipsContent=true` | Card/preview overflow remains visible; only `.project-main` clips | Source hierarchy rechecked; responsive card height expands so content and controls remain reachable |
| `3110:65161`, `3110:65195` | Back image wrapper | left center +78.8; bottom 44.27; 406.612×339.46; image 385.696×313.318; rotate 4° | left center +79.96; bottom 87.15; 405.879×338.847; image 385×312.753; rotate 4°; blue shadow | Single persistent layer; computed values checked in both states |
| `3110:65163`, `3110:65197` | Front image wrapper | left center −19.75; bottom 20.9; 483.975×396.206; image 471×380; rotate −2°; neutral shadow | left center −47.25; bottom 46.98; 519.311×441.916; image 471×380.064; rotate −8°; blue + neutral shadows | Single persistent layer; computed transforms/shadows checked |
| `3110:65162`, `3110:65196` | Shade | radial neutral shade visible | transparent | One layer transitions opacity 150 ms Ease In |
| `3110:65193` | Preview glow | none | Figma radial blue glow with inspected stops | Dedicated same-tree layer transitions opacity 150 ms Ease In |
| `3116:67014`, `3116:67021` | Accent divider | `#1d90eb`, x=80…557.5 in a 637.5 px line | `#1d90eb`, x=0…637.5 | Centered scale 0.749→1 in 150 ms Ease In; source SVGs compared directly |
| `3110:65169`, `3110:65203` | Description | Onest 350 16/24, `#adb3b8` | same type, `#dadde0` | Color transitions 150 ms Ease In |
| User contract | State mechanics | one layer tree; links/buttons active | hover and keyboard focus are equivalent | `:hover` and `:focus-within` verified independently; no hidden alternate preview |

## Experience

| Figma node | Property | Current Figma value / binding | Implementation | Status / verification |
|---|---|---|---|---|
| `3088:64107` | Section frame | 1440×1644; rows 240 / 1164 / 240 | Sticky viewport uses the contracted adaptive row algorithm | exact at 1644; computed at all acceptance heights |
| `3075:60331`, `3116:67190` | Outer fields | 1440×240 each; 1280 px patterned inner field | Exact node exports used as local decorative assets after hierarchy/size inspection | matches |
| `3084:63865`, `3142:82981` | Center | source center 1164; 906 px inner composition centered with 129 px free space | Same source values; free space is consumed before internal gaps | matches at 1644; pure layout tests |
| `3084:63866` | Heading | 1280×112; side padding 48; horizontal gap 4; title 36/48; tech note right | Same hierarchy, geometry and type | matches |
| `3116:67342`, `3108:64566` | Tape composition | 1440×746; top 24; timeline 530; progress gap 108; bottom 80 | Same; variables adapt in the explicit order 24→0, 108→24, 80→24 after free space | matches; runtime variables at 1600, 1280 and 720 heights |
| `3108:64584` | Current card | x 148, y 78, 288×216, vertical gap 24 | Same position/content/status rings | matches |
| `3108:64599` | Eyeconweb | x 522, y 258, 280×244, gap 22 | Same position/content | matches |
| `3108:64616` | Freelance | x 907, y 0, 280×244, gap 22 | Same position/content | matches |
| `3108:64633` | Vexel | x 1310, y 179, 280×244, gap 22 | Same position/content | matches |
| `3108:64650` | Agima | x 1729, y 36, 280×244, gap 22 | Same position/content | matches |
| `3108:64667` | Career start | x 2195, y 183, 280×244, gap 22 | Same position/content; centered at final progress for every tested width | matches |
| `3108:64579`…`3108:64583` | Connector geometry | Five exact rounded SVG segments at their source coordinates | Path data copied from exact Figma SVG exports; path-length reveal is sequential | matches; all offsets are zero at progress 1 |
| `3108:64684` | Right fade | x 1160, width 280, full 530 height; `#131414` at 3.31% to transparent | Same fixed viewport overlay; final card is centered outside its affected edge | matches |
| `3108:64685` | Progress | 296×4, radius 2, track `#232526`; fill `#1d90eb` plus a duplicate 4 px blur glow; no knob | One normalized progress controls both identical fill/glow layers; no indicator element | matches; DOM and computed runtime evidence |
| `3116:67337`…`3116:67340` | Storyboard selection | The reached job is selected after each completed fifth; selected company `#f2f4f5`, description `#dadde0`, end date `#adb3b8`, bottom date dot `#43a2ee`; node radii 4/10/16 px with `#62b8fc`, `rgba(3,120,214,.32)`, `rgba(4,98,175,.12)` | `floor(progress × 5)` selects exactly one of six jobs and applies those inspected values | deterministic boundary test plus runtime at progress 0.2549 |
| User contract | Scroll mechanics | document scroll; 1 horizontal px / 1.5 vertical px; no wheel interception | 1615 px horizontal / 2422.5 px vertical; passive scroll listener; existing Lenis remains the only continuous RAF; wheel input multiplier reduced to 0.5 | matches; one runtime wheel step reduced from about 1595 px to about 800 px |
| User contract | Motion blur | 0 through 100 px/s, linear to 0.6 px at 1800 px/s, clears in 80 ms | Derived only from measured horizontal delta/time; reduced motion forces zero | deterministic tests and runtime clear state |
| User contract | Resize | preserve active normalized progress | Resize recomputes layout and restores the same normalized document position | 0.6789 preserved from 900→1080 px runtime |

## Process icon fill

| Figma node | Property | Current Figma value / binding | Implementation | Status / verification |
|---|---|---|---|---|
| `3075:60247` | Step row | 1278×365; three columns 415 / 446 / 415; clipped | Existing responsive row retained | matches at desktop runtime |
| `3075:60248`, `3075:60265`, `3075:60283` | Card layout | height 364; padding 56; main vertical gap 48 | Existing source layout retained | matches |
| `3075:60249`, `3075:60266`, `3075:60284` | Icon frame | 64×64, no visible fill, clips content | 64×64 wrapper remains the clipping frame at desktop | matches; runtime rect 64×64 |
| icon vector children | Line geometry | Folder, system and send outlines plus internal lines; separate construction grid | Exact path data is isolated into three line-only SVG masks; base exports remain visible | matches source vector paths; fill cannot affect frame background |
| User contract | Desktop motion | no movement or rotation | All icon transforms are forced to `none` | matches; computed runtime transform |
| User contract | Fill origin | random point on one of four frame edges for each settled new hover/focus; fixed during state | Pure edge sampler uses the full 64 px coordinate space; quick re-entry retains the previous origin while the exit settles | deterministic tests and runtime origin on top edge |
| User override, 2026-09-13 | Fill timing | in/out 200 ms Ease In; hover and keyboard focus equivalent | Typed CSS radius expands through the line mask in 200 ms; pointer and focus share one state | matches; focused contract test |
| User contract | Reduced motion | final state only; no decorative transitions or blur | Icon/card transitions disabled and experience blur forced off under `prefers-reduced-motion` | stylesheet inspection and build |
