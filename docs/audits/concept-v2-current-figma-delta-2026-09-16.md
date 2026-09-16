# Concept V2 — current Figma source delta audit

**Status:** `OPEN` — source audit complete; runtime implementation has not started. **Audited on:** 2026-09-16. **Runtime baseline:** `codex/concept-v2-visual-fidelity` at `b6f1a5a`. **Scope:** public Concept V2 runtime only. No Figma write, source-code change, asset download, Admin, shared contract, production or deploy action is included.

## Sources and method

| Source | Exact target | What was read |
|---|---|---|
| Concept V2 | [`3075:60105`](https://www.figma.com/design/sgKtUASp0aYzdkeH8kcXrL/Concept-V.2?node-id=3075-60105) | Current `Main page`, its top-level sections and their direct children/bindings. |
| Hero variants | [`3125:81643`](https://www.figma.com/design/sgKtUASp0aYzdkeH8kcXrL/Concept-V.2?node-id=3125-81643) | Current authoritative Hero component: `Screen=Small` `3125:81642` and `Screen=Large` `3125:81641`. It supersedes the now-unavailable page instance `3337:228682` for Hero D04 only. |
| Experience heading | [`3142:82981`](https://www.figma.com/design/sgKtUASp0aYzdkeH8kcXrL/Concept-V.2?node-id=3142-82981) | Exact heading, Resume control and scroll-scene instance. |
| Library V2 | [`9:387`](https://www.figma.com/design/nrqHGuE0qOo4Dwj59I9wEc/My-portfolio---Library-V.2?node-id=9-387) | All local Primitive, Semantic and Component color variables, including button states. |

The audit used Figma node metadata, component/instance design context, resolved variable bindings and direct child trees. Current screenshots of `3075:60105`, `3125:81642`, `3125:81641` and `3142:82981` were inspected during the audit but are not committed: Figma screenshot URLs are short-lived. The parent Hero component context timed out at its full size, so it was read through its direct descendants; no source was inferred from a screenshot alone.

Important: do not flatten equal-looking token names into one CSS value. The current source has both Library variables and existing component-instance variables. For example, the header’s `Color/Text/Neutral/Muted` resolves to `#909498`, while the current main-page headings resolve to `#636c73`. Node-level resolved values below are the implementation authority.

## Current page inventory

| Section | Figma node | Current geometry | Direct source observations |
|---|---:|---:|---|
| Hero, Small | `3125:81642` | `1440×1332` | `1200×492` main content, `720×452` graph and separate `320px` lower dotted field. |
| Hero, Large | `3125:81641` | `2313×1652` | Centred `751×316` copy, `947×594` graph and separate lower dotted field. |
| Projects + Process | `3075:60180` | `1574×2025` | Central content frame is `1280 px` wide, centred at `x=147`. |
| Tools | `3110:65436` | `1574×272` | Centre panel is `1280×272`; both side fields are `147 px`. |
| Experience | `3088:64107` | `1574×1644` | Top and bottom patterned fields are `240 px`; middle scene is `1164 px`. |
| About | `3223:139418` | `1574×961` | Heading is `312 px`, content is `649 px`; central frame is `1280 px`. |
| Footer | `3110:66042` | `1574×61` | Centre footer frame is `1280×60`. |

## Confirmed deltas from the current runtime

### 1. Color system — global migration, not a single `--page` replacement

The runtime still starts from the prior palette (`#17191a`, `#131414`, `#1d1e1f`, `#2e3133`, `#dadde0`, `#adb3b8`, `#676e73`, `#44494d`, `#232526`). The current source uses role-specific values:

| Role used in current Concept page | Figma resolved value | Current runtime equivalent / impact |
|---|---:|---|
| `Color/Container/Neutral/Other/Bg-main` | `#16181a` | `--page` is `#17191a`; affects page root and About heading. |
| `Color/Container/Neutral/Faint` | `#141517` | Runtime commonly uses `#131414`; affects Experience outer field, About content shell and footer. |
| `Color/Container/Neutral/Thin` | `#1c1f21` | Runtime commonly uses `#1d1e1f`; used by Hero fact-chip and Tools panel. |
| `Color/Container/Neutral/Soft` | `#222629` | Runtime commonly uses `#232526`; used by tabs, light controls and tool-icon backgrounds. |
| `Color/Border/Neutral/Surface` | `#2a2f33` | `--border` is `#2e3133`; section/frame boundaries need migration. |
| `Color/Border/Neutral/Muted` | `#32383d` | Runtime has no semantic role; Process card boundary candidate. |
| `Color/Border/Neutral/Secondary` | `#4d5459` | Runtime has no semantic role; Process state candidate. |
| `Color/Text/Neutral/Primary` | `#f2f4f5` | Already matches. |
| `Color/Text/Neutral/Secondary` | `#d7dce0` | `--secondary` is `#dadde0`; Hero intro, descriptions, cards and viewer text are affected. |
| `Color/Text/Neutral/Tertiary` | `#a9b1b8` | `--tertiary` is `#adb3b8`; controls, project/Process/AI copy are affected. |
| `Color/Text/Neutral/Muted` | `#636c73` | `--muted` is `#676e73`; section labels and technical notes are affected. |
| `Color/Text/Neutral/Thin` | `#42484d` | Runtime uses `#44494d`; neutral filled-button foreground and disabled controls are affected. |
| Header component only: Faint / Muted | `#f0f1f2` / `#909498` | Runtime brand currently matches these values and must retain this component-specific treatment. |
| Accent container / border / normal | `#0378d6` / `#1d90eb` / `#43a2ee` | These values remain current; do not change merely because the neutral palette changes. |

This is a confirmed all-section change: the root, Hero border, Projects/Process shell, Tools panel, Experience, About and footer all bind the new semantic roles. The audit does **not** authorize a blind search/replace: current source distinguishes `Bg-main`, `Faint`, `Thin` and `Soft` backgrounds.

### 2. Header

- The current Figma `General header` instance (`3114:66048`) is `1280×80`; the runtime `.header-row` is still limited to `1200 px`.
- Source navigation uses `#222629` active container, `#43a2ee` active icon, `#f2f4f5` active label and `#42484d` disabled icon/label. Runtime still has old `#232526` / `#44494d` consumers.
- Source availability text is `#a9b1b8`; runtime derives it from old `--tertiary`.
- Source Accent CTA enable state is background `#0378d6`, border `#1d90eb`, icon and label `#d7dce0`. Runtime icon/label remains the old `#dadde0`.

### 3. Hero — structural lower-area redesign

The authoritative Hero source is the two-variant component `3125:81643`, not the unavailable legacy page instance `3337:228682`.

- The lower `171 px` disciplines/facts strip in the runtime is superseded by a separate dotted field. In `Screen=Small`, it begins at `y=1012` and is `320px` high; in `Screen=Large`, it remains a direct Hero child beneath the main content. The centred fact-chip remains `279×42`.
- The chip contains only `29 лет · Екатеринбург · Senior`; it has `20 px` horizontal and `12 px` vertical padding, `12 px` radius, `#1c1f21` container, `#222629` border and `#636c73` medium body text. Runtime instead renders four labelled columns, including `СТАЖ 7 лет`, and disciplines above them.
- `Screen=Small` hides the former “Артур” eyebrow; `Screen=Large` shows it. Runtime’s existing height-based source switch is therefore preserved.
- Small Hero content is inside a `1200px` frame with a further `24px` left-copy inset. Large centres a `751px` copy and uses a `947×594` graph.
- Small graph remains `720×452`; Hero title remains `56/68`, intro is `20/36` and uses `#d7dce0`.
- The two action controls retain `36 px` height, `12 px` horizontal padding, `4 px` gap and `8 px` radius. `Мои работы` now uses neutral fill `#d7dce0`/label `#42484d`; `CV` uses ghost-neutral `#a9b1b8`.
- The CV action icon is now the full vector frame **`Medium / Files / File-05`** (`3361:147862`), not the existing download asset. It must be swapped as a full 24×24 frame with an SVG child under the established icon contract; no stroke/CSS approximation.

### 4. Projects — unmentioned source changes

- The heading `3075:60183` has `56 px` side padding, not the runtime’s `48 px`.
- It begins `120 px` below the Projects-section top; its content width is `496 px`.
- A right-aligned `218×36` light-neutral button exists: `Посмотреть все проекты` with **`Medium / Arrows / Chevron-right`** (`3265:179852`). Runtime has `Все работы`, so both the label and exact source asset must be explicitly reviewed during implementation.
- Both project-card instances bind the new `#2a2f33` surface border, `#1d90eb` accent-muted line, `#1c1f21` thin container, `#d7dce0` secondary text and `#a9b1b8` tertiary text. Their component layout keeps the existing `56/48/32/24/16/12 px` spacing family; no card geometry change was found in this pass.

### 5. Process

- Heading `3075:60233` now has `56 px` side padding. Runtime keeps `48 px`.
- Heading typography/content geometry is otherwise still H3 `36/48`, body `16/24`, technical note `16/20` Source Code Pro; all neutral text roles migrated to the new palette.
- All three current Process cards resolve: surface border `#2a2f33`, muted border `#32383d`, secondary border `#4d5459`, strong border `#a9b1b8`, heading `#a9b1b8`, label `#636c73`, accent interaction border `#1d90eb` and `56 px` internal padding. The current motion behavior is not changed by this audit.

### 6. Tools / AI — unmentioned structure

- The centre panel is `1280×272` with `#1c1f21` fill and `#2a2f33` border. Runtime still uses the old surface/border tokens.
- Source left column is `577 px`, with `56 px` horizontal and `40 px` vertical padding. Runtime has a `520 px` left grid column and different padding.
- Source right column also uses `56×40 px` padding and contains a static soft chip `и множество других` (`3210:124462`), absent from the runtime.
- Tool icon containers use `#222629`; tool titles are primary `#f2f4f5`; descriptions are tertiary `#a9b1b8`.

### 7. Experience

- Exact current heading `3142:82981` is `1280×112`, aligned to the central frame. Its content has `56 px` left/right padding — a confirmed change from runtime `48 px`.
- A right-aligned `105×36` light-neutral **`Резюме`** control exists at `x=1119`, with the full **`Medium / Files / File-05`** icon (`3361:147862`). Runtime has no corresponding Experience-heading action.
- Source heading roles: eyebrow `#636c73`, title `#f2f4f5`, description `#d7dce0`; runtime still uses the previous muted/secondary values.
- Current source section shells use `#141517` Faint outer fields, `#222629` Soft scene background, `#2a2f33` Surface boundaries and `240 px` top/bottom patterned fields. This confirms the palette migration reaches the complete scroll scene; it does not change the accepted scroll gateway or motion geometry by itself.

### 8. About and footer — unmentioned current deltas

- About heading `3216:138932` uses `#16181a` Bg-main, `#2a2f33` borders, `56 px` horizontal, `120 px` top and `80 px` bottom padding. Its H3 is now `36/48`; runtime has `28/36` for About specifically.
- About body (`3116:78467`) uses the current `#141517` Faint field and `#16181a` main copy field, plus new neutral/accent roles. Existing About deck/viewer geometry is not altered by this source audit.
- Footer source is `#141517` Faint with `#2a2f33` Surface border and `#636c73` text; runtime still uses prior colours.

## Library V2 color ledger

### Primitive palette

| Family | Current values |
|---|---|
| Blue | `20 #00355f`, `50 #004c88`, `100 #0462af`, `200 #0378d6`, `300 #1d90eb`, `400 #43a2ee`, `500 #62b8fc`, `600 #89c1ec`, `700 #b6ddfc`, `800 #d7ebfa`, `900 #ebf6ff`, `Alpha/400_2 #369ff333` |
| Gray | `10 #0a0e12`, `20 #141517`, `40 #1c1f21`, `50 #222629`, `100 #2a2f33`, `150 #32383d`, `200 #42484d`, `300 #4d5459`, `400 #636c73`, `500 #849099`, `600 #a9b1b8`, `700 #d7dce0`, `800 #f2f4f5`, `900 #ffffff`, `Alpha/600_1 #a9b1b81a`, `Alpha/800_5 #f2f4f5e5` |
| Red | `20 #fcf3f2`, `50 #ffd1cf`, `100 #f9b4b1`, `200 #ff938f`, `300 #ea7d79`, `400 #ec5753`, `500 #dd4743`, `600 #c43834`, `700 #bc302c`, `800 #962623`, `900 #7c1d1b` |
| Yellow | `20 #fffaed`, `50 #fff7e1`, `100 #fff2cc`, `200 #ffe59e`, `300 #ffd86a`, `400 #ffc626`, `500 #e7b21d`, `600 #daa40e`, `700 #bd921c`, `800 #927118`, `900 #6b5311` |

### Semantic roles actually used by Concept V2

| Group | Values |
|---|---|
| Neutral text / element | Strong `#ffffff`; Primary `#f2f4f5`; Secondary `#d7dce0`; Tertiary `#a9b1b8`; Muted `#636c73`; Thin `#42484d`; inverse `#0a0e12` |
| Accent text / element | Primary `#d7ebfa`; Secondary `#b6ddfc`; Tertiary `#89c1ec`; Muted `#43a2ee`; Thin `#1d90eb` |
| Neutral containers | Primary `#f2f4f5`; Tertiary `#d7dce0`; Muted `#a9b1b8`; Surface `#32383d`; Soft `#222629`; Thin `#1c1f21`; Faint `#141517`; inverse `#0a0e12` |
| Accent containers | Primary `#004c88`; Secondary `#0462af`; Tertiary `#0378d6`; Muted `#1d90eb`; Normal `#43a2ee`; Faint `#b6ddfc` |
| Neutral borders | Primary `#636c73`; Secondary `#4d5459`; Tertiary `#42484d`; Muted `#32383d`; Surface `#2a2f33`; Thin `#222629` |
| Accent borders | Primary `#89c1ec`; Secondary `#62b8fc`; Tertiary `#43a2ee`; Muted `#1d90eb` |

### Button component states

| Variant | Enable | Hover | Press | Disable |
|---|---|---|---|---|
| Filled Accent container | `#0378d6` | `#0462af` | `#004c88` | `#1c1f21` |
| Filled Accent icon / label | `#d7dce0` | `#f2f4f5` | `#ffffff` | `#42484d` |
| Filled Light Neutral container | `#222629` | `#222629` | `#1c1f21` | `#1c1f21` |
| Filled Light Neutral icon / label | `#a9b1b8` | `#f2f4f5` | `#ffffff` | `#42484d` |
| Ghost Neutral container | transparent | `#222629` | `#1c1f21` | transparent |
| Ghost Neutral icon / label | `#a9b1b8` | `#f2f4f5` | `#ffffff` | `#42484d` |

## Runtime impact inventory

The affected runtime ownership is deliberately kept separate from implementation:

- `tools/concept-v2/app/src/style.css` — legacy root palette and the Header, Hero, Projects, Process, Tools, Experience, About and footer consumers.
- `tools/concept-v2/app/src/v2/tokens.css` and `v2/controls.css` — component-state palette currently still contains old neutral values.
- `tools/concept-v2/app/src/App.jsx` — Hero lower structure, Hero CV action, Projects action, Tools chip and header width owner.
- `tools/concept-v2/app/src/Experience.jsx` — Experience Resume action and heading ownership.
- `tools/concept-v2/app/src/icon-vectors.js` plus `public/figma` assets — explicit source swaps for File-05 and the exact Projects chevron; preserve the full-frame/vector-child icon rule in `DESIGN_SYSTEM.md`.

## Required implementation guardrails

1. Introduce named semantic CSS roles before changing consumers; do not change all old hex values indiscriminately.
2. Use the resolved value on the exact Figma node when the Library and component instances differ.
3. Download/export only the exact Medium asset frame needed at implementation time, preserve its `24×24` frame and real vector stroke; do not recreate an icon with CSS or alter its SVG geometry.
4. Treat the new Hero lower area as a replacement of the old strip, not a reskin of its four fact columns.
5. Keep accepted About deck/viewer, Experience gateway and scroll behavior intact unless a separately verified source delta requires their change.
6. Before closing the future implementation group, inspect the updated Hero, Projects, Process, AI, Experience, About and footer in the runtime; palette migration is shared CSS with a wide regression surface.

## Audit result

The source change is broader than the initially named items. It includes a new semantic neutral palette, node-specific header colours, a rebuilt Hero lower section, full-frame document icons for both CV/Resume, 56 px side padding in Projects/Process/Experience headings, a new Projects action, an updated AI layout with an additional chip, and About typography/background updates. No unresolved source ambiguity blocks a follow-up implementation; the only intentionally deferred item is byte-level asset export, which should occur when the user authorizes implementation.
