# Corvo responsive scenes — source map

## Authorization · Figma read 2026-09-19

Файл `sgKtUASp0aYzdkeH8kcXrL`; source срез фиксирован в task-artifact области
`corvo-responsive-scenes/authorization/figma-2026-09-19/`.

| Figma root | Режим | Локальный участок |
| --- | --- | --- |
| `3600:172160` | Desktop, 1440 × 960 | `site/authorization/` desktop-scene |
| `3600:172155` | Tablet, 744 × 1100 | `site/authorization/` tablet override |
| `3600:172158` | Mobile, 360 × 640 | `site/authorization/` mobile base |

### Structure

- Desktop `3600:172162` → `.promo`: source texture `raw-01.png`, Corvo bird
  `raw-03.png`, title block. It is visually left despite its Figma layer name
  `Body main / Right side`.
- Desktop `3600:172163` → `.auth-panel`: main panel `616 × 912`, logo, fields,
  entrance and 68px footer.
- Tablet `3600:172157` → `.auth-panel`: external 16px margin, main panel
  `712 × 1068`, fields `498px`, 60px footer.
- Mobile `3600:172159` → `.auth-panel`: global `64px`, body `528px` clipped,
  fields `328px × 672px`, footer starts at y=592 and is `48px` high.
- Desktop contact `I3600:172163;3:42257` → `.contact-row`: two 270px fields,
  12px gap and wrap when their declared minima no longer fit.
- Tablet contact `I3600:172157;3:42289` and mobile
  `I3600:172159;3:42321` → stacked fields, 12px/8px vertical gaps.

### Local exported assets

| Asset | Figma node / use |
| --- | --- |
| `raw-01.png` | Desktop promo texture |
| `raw-03.png` | `I3600:172162;3:42599`, Corvo bird |
| `logo.svg` | `I3600:172163;3:42245`, brand symbol |
| `user.svg`, `globe.svg`, `send.svg`, `chevron-down.svg`, `eye.svg` | visible form controls from `I3600:172163;3:42255`, `:42256`, `:42258`, `:42270` |

### Constraints and type

- Рабочий reference использует `Manrope` из Google Fonts: 400 для основного
  текста, 500 для KPI-заголовков и 600 для главных заголовков. Загрузка идёт
  через CSS2 endpoint с `display=swap`.
- Responsive-режим определяется шириной viewport: Mobile 360–599px, Tablet
  600–1599px, Desktop 1600px и шире. В desktop содержимое ограничено шириной
  1440px и центрируется; 960px — фиксированная высота сцены, не breakpoint ширины.
- Внешние content frames квадратные во всех адаптивах. Скругления остаются
  только у внутренней authorization card: 24px mobile, 28px tablet и 32px
  desktop.
- Desktop form: min 480px, max 640px; promo min 360px. Inner body: min 328px,
  max 672px. Desktop fields min/max 328/610px.

## Media campaigns · Figma read 2026-09-19

- Roots: desktop `3600:173694`, tablet `3600:173727`, mobile `3600:173759`.
- `site/media-campaigns/` maps their product header, metrics, filters and table;
  source SVG/PNG assets live in `site/assets/media-campaigns/`.
- The approved plan defines continuous ranges: mobile below 600px, tablet
  600–1599px, desktop at 1600px and above. Tablet cards retain their 252px
  minimum and clip.

### Exact structure

| Figma nodes | Code surface | Constraint retained |
| --- | --- | --- |
| Desktop `3600:173697`, `173698` | `.global`, `.title` | 72px rail; header 80px; title 100px |
| Desktop `3600:173723` | `.metrics`, `.metric-card` | x=8 / right=16; three 440 × 252 cards at 1440px |
| Desktop `3600:173725`, `173726` | `.filters`, `.table-wrap` | 1344 × 48 filters; 1344 × 424 table |
| Tablet `3600:173728`, `173730`, `173755` | tablet overrides | header 72px; 252 × 212 no-wrap cards, third card clips |
| Tablet `3600:173757`, `173758` | tablet filters/table | 720 × 112 filters; 720 × 552 table |
| Mobile `3600:173760`, `173762`, `173771` | mobile overrides | header 137px; title 84px; one 344 × 190 card |
| Mobile `3600:173773`, `173774` | mobile filters/table | 344 × 92 filters; 344 × 545 clipped table |

Table edge contracts are source-specific: desktop keeps fixed 220px Name,
180px GEO minimum, 136px Created and 90px Action; tablet keeps fixed 194px
Name, 129px Created and 80px Action; mobile keeps fixed 120px Name and 62px
Action while all four middle fields remain horizontally traversable.

### Responsive source assets

- Graph line pairs are distinct exports for desktop, tablet and mobile; CSS never
  stretches a desktop graph into another source mode.
- Rail, metric, filter, table and indicator icons are local Figma exports.
- Table remains semantic markup; fixed source columns, clipping and footer are
  composed in CSS instead of using a screenshot as a table background.

## My Space / Media items · Figma read 2026-09-20

- Cloud Figma file `sgKtUASp0aYzdkeH8kcXrL`; exact roots: desktop
  `3600:186134` (1440×960), tablet `3600:186175` (744×1100), mobile
  `3600:186213` (360×640). The rejected preview nodes `3510:113449` /
  `3510:118257` are deliberately not a source for this scene.
- Title/action: `3600:186142` / `3600:186180` / `3600:186218` → `.my-title`:
  `Tech Innovations Inc.`, source subtitle and `Create items` action.
- Info cards: `3600:186143` / `3600:186181` / `3600:186219` → `.identity`.
  Desktop cards are 172/148/176×72; tablet 147/126/150×60; mobile
  125/106/128×48. Mobile's third card clips past the 360px frame by source.
- Metrics: `3600:186171` / `3600:186209` / `3600:186231` → `.metrics` and
  `.metric-card`. Exact local SVG exports in `assets/my-space/` retain the
  desktop 440×220, tablet 252×192 and single mobile 344×190 graph variants.
- Filters: `3600:186173` / `3600:186211` / `3600:186233` → `.filters`:
  only Active/Deactivated and Search; dimensions 1344×48, 716×48 and 344×92.
- Table: `3600:186174` / `3600:186212` / `3600:186234` → `.table-wrap`:
  1344×320, 716×512 and source residual 344×1 below the mobile frame.

### Table contract

- Source fields, in order: ID & Name, URL, Reward plan, GEO, Media items,
  Deposits Count, Deposits Amount, Clicks, Unique Clicks, Registrations,
  Created at. No invented Action column or fixed trailing edge.
- Visible source row data starts with `P84651O / Tech Innovations Inc.`,
  `novacart.com/main/promocode`, `RevShare 22 % + CPA 100 $ + Fixed payment
  900 $`, `5 259 521`, `789`, `51 887.28 $`, `6 273`, `46 888`, `632`,
  `30.04.2023`.
- Mobile breadcrumbs keep the 24px Home/Media Campaign value chips from
  `3600:186216`; mobile info cards show icon + value only, as defined by
  `3600:186219`.
- Tablet KPI copy is adaptive source data from `3600:186209`: all values are
  `987 451.8`, with `+36.8% / -36.8% / +36.8%`. Desktop retains its distinct
  `100 283 214` and `22.9B` values.
- Tablet table `3600:186212` keeps the 194px fixed ID column, then 180px URL,
  180px Reward plan and 144px GEO columns. URL values are 24px bordered chips;
  eight semantic rows keep the seven-row visible tablet body filled.

## Statistics · Figma read 2026-09-20

- Cloud Figma section `3600:199174`; canonical roots: desktop `3600:199175`
  (1440×960), tablet `3600:199187` (744×1100), mobile `3600:199198`
  (360×640).
- Global/header: `3600:199182` / `3600:199192` / `3600:199203`; it reuses the
  approved shell and full `Home | Affiliate > Media Campaign` breadcrumbs.
- Title: `3600:199183` / `3600:199194` / `3600:199205` → `.my-title`; no KPI,
  identity, tabs or create-action blocks exist in this scene.
- Controls: `3600:199185` / `3600:199196` / `3600:199207` → Search, Export and
  Columns only, at 1344×48, 720×48 and 344×40.
- Export icon: component `3600:198853` (`Medium / General / Share-01`) → exact
  cloud-Figma mask asset `site/assets/statistics/export.svg`; runtime color
  comes from the instance token `#5e6260`, without redrawing its path.
- Table: `3600:199186` / `3600:199197` / `3600:199208` → `.table-wrap`, sized
  1344×636, 720×792 and 344×546. The runtime deliberately clips a fixed table;
  it does not redistribute columns or add horizontal scrolling.
- Implemented visible fields only: Affiliate & ID, Clicks, Unique Clicks,
  Registrations, FTD Count, Reg to FTD, Click to Reg, Click to FTD, Repeat
  Deposit. Fixed visible-table widths are 1391px desktop, 1221px tablet and
  994px mobile.
- Statistics is the active Pie-chart rail state; other product rail items keep
  their inactive source state.
