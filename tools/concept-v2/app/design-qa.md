# Concept V2 — stage-one corrective QA

Status: `READY_FOR_REVIEW`

Baseline: `19bf69b4c1c04d91b4a536cf8e63bae6d62fb423`  
Corrective implementation: `613fda4f35730d4d0fbebfb7bca6f70af8e0e9b5`, review fix `5177616c66208c93b09c1a52cb6cf13c8943004e`  
Runtime: `http://127.0.0.1:43189/`  
Figma access: read-only; no Figma writes were made.

## Source mapping and corrections

| Area | Exact source | Confirmed source facts | Corrective result |
|---|---|---|---|
| Hero | `3125:81641`, `3125:81642`, lower strip `3116:66642` | Large/Small compositions, direct children, 1300 px height boundary, local Google Sans/Onest roles, corner image crop, 24 px caption gap and lower side strokes | Uses the exact corner asset/crop; selected schema node changes icon, label and accent color with 150 ms fade/up 4 px; published schema remains in place; lower strokes restored |
| Projects | `3075:60182`, cards `3110:65336`, `3110:65368` | Section 1278×1125, padding 120/80, gap 80; heading 1278×136 with side padding 56; grid 1278×709 with top padding 96; card 638.5×613; card and preview `clipsContent=false`, main `clipsContent=true` | Desktop geometry matches those values. Card/preview overflow is visible and only main clips. Below 1280 px the card and main use intrinsic height so the description and both controls cannot be cut off |
| Experience | section `3088:64107`, tape `3116:67342`, states `3116:67337`…`3116:67340`, progress `3108:64685` | Source rows 240/1164/240; composition 906; heading 1280×112; five exact connector paths; active state colors/radii; progress 296×4, track `#232526`, fill `#1d90eb` plus 4 px blur duplicate, no knob | Correct connector coordinates/directions; 1615 px horizontal travel consumes 2422.5 px vertical travel; one selected storyboard item per completed fifth; exact selected colors/rings; exact no-knob progress; below 1280 px a complete static layout replaces the horizontal sticky mechanic |
| Process icons | `3075:60247`, `3075:60249`, `3075:60266`, `3075:60284` and current Library V2 icon children | 64×64 clipped frames, line-only vectors, no movement | Fill stays inside the real line masks, starts from one stable random frame edge and now uses the explicit user override of 200 ms Ease In |
| Global scroll | Existing application Lenis root | A second RAF loop or wheel interception is forbidden | Still one Lenis loop, no wheel listener; wheel multiplier is 0.5 |

## Root causes closed

- The project card and preview contradicted Figma with `overflow:hidden`; responsive preview growth was also constrained by a fixed 613 px card height.
- Experience used the inverse ratio (`1615 / 1.5`) instead of 1.5 vertical pixels per horizontal pixel.
- Experience lacked the storyboard selection state and replaced the Figma progress glow with a knob.
- The first connector used the wrong x coordinate and two connector paths had the wrong direction/geometry.
- The 1100–1279 px range disabled JS travel without activating the static layout; specific per-job offsets then overrode the attempted reset.
- The root overflow and the original wheel multiplier contributed to broken sticky behavior and excessive perceived speed.
- Hero used the wrong corner treatment, a fixed caption icon/label and omitted the lower side strokes.

## Runtime evidence

- Fonts loaded from local files: Google Sans 400/500 and Onest; computed heading/body families matched their Figma roles.
- Hero at desktop source sizes: the selected “Проектирование” node produced the design icon, `rgb(67, 162, 238)` and a 0.15 s caption animation.
- Projects at 1440×900: section height 1125; heading local top 120 and height 136; grid local top 336 and height 709; card 638.5×613. Focus state reached −8° front rotation, full blue divider, blue glow and secondary description color.
- Projects in the ordinary unmodified app viewport: both controls remain visible after the image; the next card stays in document flow while rotated artwork may protrude from its non-clipping frame.
- Experience at 1440×900: sticky top 0; section height 3322.5; one wheel step after the 0.5 multiplier moved about 800 px rather than about 1595 px. At progress 0.2549 Eyeconweb was the sole selected item, with the exact selected colors and three node radii; progress had two blue layers and zero knob elements.
- Experience at short 490 px height fit the full 490 px composition using the contracted compression order. Below 1280 px the live page rendered a complete static grid with all six jobs and no retained absolute offsets.
- Reverse travel, resize-progress preservation, keyboard focus parity and reduced-motion final states were covered by focused checks.

## Automated verification

Final corrective run:

- `npm run lint` — passed; 23 source files checked.
- `npm test` — passed; 19/19 tests.
- `npm run build` — passed; 49 modules transformed.
- `npm run check:browser` — passed against the built bundle on a local loopback server.
- `git diff --check` — passed.

## Review passes

1. Fidelity/completeness review found and fixed the responsive project-height clipping and the 1100–1279 experience breakpoint mismatch.
2. Regression/scope review found and fixed both the per-job specificity leak that retained desktop `top/left` offsets in the static experience grid and the 150/200 ms mismatch that could move the icon fill origin during its final 50 ms. It confirmed no changes to Admin, shared contracts, published snapshot/archive, dependencies, Figma, production or deployment.
