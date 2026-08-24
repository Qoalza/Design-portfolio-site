# MLIR3 typography inventory

Status: `VERIFIED` for `fce9e2288c3a80a28da51479a5668fa33b22fb59`

Contract: all visible non-heading UI text uses Onest. Google Sans is limited to typography roles explicitly mapped as headings. Source Code Pro has no visible consumer in MLIR3 scope.

| Semantic role | Figma source | Code owners | Required runtime font |
|---|---|---|---|
| Page/section/card headings | Current page instances in `510:28120`, `373:50236`, `373:47102` | page CSS modules, `PageHeader`, `ProjectGallery`, `MainProjectCard` | Google Sans |
| Body/description/copy | Library `Desktop/Body/*` and current instances | global body, page CSS modules, MDX content | Onest |
| Buttons, tabs, text controls | Library controls and current instances | `ui-controls.module.css`, `SiteHeader` | Onest |
| Tags, metadata, dates, labels | Current page instances | `MainProjectCard`, `PageHeader`, project detail CSS | Onest |
| Sticky navigation and breadcrumbs | Current Header/project instances | `site-header.module.css`, project detail CSS | Onest |
| Action bar/helper text | Current Corvo local component | `project-action-bar.module.css` | Onest |
| Footer text/year | Library Footer `124:4841` | `SiteFooter` | Onest |
| Error-page copy/controls | Existing 404/500 layout (visual geometry out of scope) | `error-screen.module.css` | Onest |

Runtime acceptance: loaded `Onest` variable font, Cyrillic glyphs rendered without fallback, computed `font-family` matches this table in Chromium and Zen at 1440×900.
