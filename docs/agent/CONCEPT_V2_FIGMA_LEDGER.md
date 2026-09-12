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
