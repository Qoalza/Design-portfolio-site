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
