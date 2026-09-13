# Concept V2 — stage-one corrective QA

Status: `READY_FOR_REVIEW`

Baseline: `19bf69b4c1c04d91b4a536cf8e63bae6d62fb423`
Corrective implementation: previous series through `3547255`; Plan 1.1 fixes `ff7bee4`, `386a9eb`, `369b398`
Runtime: `http://127.0.0.1:43189/`
Figma access: read-only; no Figma writes were made.

## Source mapping and corrections

| Area | Exact source | Confirmed source facts | Corrective result |
|---|---|---|---|
| Hero | `3125:81641`, `3125:81642`, lower strip `3116:66642` | Large/Small compositions, direct children, 1300 px height boundary, local Google Sans/Onest roles, corner image crop, 24 px caption gap and lower side strokes | Uses the exact corner asset/crop; selected schema node changes icon, label and accent color with 150 ms fade/up 4 px; published schema remains in place; lower strokes restored |
| Projects | `3075:60182`, cards `3110:65334`, `3110:65333`, Preview `3110:65160`, shade `3110:65162` | Card/Preview do not clip artwork; Preview shade is exactly 638×328 and is a child between the back and front artwork | Exact isolated shade vector fills only Preview, never Main; artwork remains above the divider and the shade disappears in 150 ms Ease In on hover/focus |
| Experience | section `3088:64107`, tape `3116:67342`, current marker `3108:64584`, states `3116:67337`…`3116:67340`, progress `3108:64685` | Reached states are cumulative; right fade is 280 px; mirrored left fade is 109 px in `67337`–`67339` and absent in final `67340` | 1615 px horizontal travel consumes 9690 px vertical travel; both fades are fixed outside the transformed tape; exact markers and connectors share one normalized progress |
| Process icons | `3075:60247`, `3075:60249`, `3075:60266`, `3075:60284` and current Library V2 icon children | 64×64 clipped frames, line-only vectors, no movement | Fill stays inside the real line masks, starts from one stable random frame edge and now uses the explicit user override of 200 ms Ease In |
| Global scroll | Existing application Lenis root | Downward entry inertia must stop at sticky start and progress 0; the next independent gesture must resume without losing its first event | One Lenis/RAF and no native wheel listener; an internal virtual-scroll gate arms after 120 ms idle; global `wheelMultiplier: 1` is unchanged |

## Root causes closed

- The project card and preview contradicted Figma with `overflow:hidden`; responsive preview growth was also constrained by a fixed 613 px card height.
- The preview divider had an explicit `z-index:6`, placing its one-pixel rule above both artwork layers; the layer stack is now glow 0, divider 1, back artwork 2, shade 3 and front artwork 4.
- Global Lenis scaling changed the speed of the whole page; the default multiplier is restored and the experience alone now uses 6 vertical pixels per horizontal pixel.
- Experience previously selected only the frontier item; every reached item now stays selected, and reverse travel clears states cumulatively.
- The first connector used the wrong x coordinate and two connector paths had the wrong direction/geometry.
- The 1100–1279 px range disabled JS travel without activating the static layout; specific per-job offsets then overrode the attempted reset.
- Root overflow contributed to broken sticky behavior; the later page-wide `wheelMultiplier: 0.5` workaround altered unrelated scrolling and has been removed.
- Hero used the wrong corner treatment, a fixed caption icon/label and omitted the lower side strokes.
- The previously used 473×417 layer belonged to the wrong export context and leaked into Main; the exact 638×328 Preview shade is now isolated from node `3110:65162` and independently clipped to Preview.
- Centering a 240 px decorative image inside a compressed field cropped its built-in boundary; edge anchoring now preserves the separation rule.
- The date marker used one CSS background with two identical outline circles and an oversized line. It now reproduces the exact Figma child tree with downloaded current/neutral/reached SVG assets and switches only the reached endpoint.

## Runtime evidence

- Fonts loaded from local files: Google Sans 400/500 and Onest; computed heading/body families matched their Figma roles.
- Hero at desktop source sizes: the selected “Проектирование” node produced the design icon, `rgb(67, 162, 238)` and a 0.15 s caption animation.
- Projects at 1440×900: section height 1125; heading local top 120 and height 136; grid local top 336 and height 709; card 638.5×613. Focus state reached −8° front rotation, full blue divider, blue glow and secondary description color.
- Projects in the ordinary unmodified app viewport: both controls remain visible after the image; the next card stays in document flow while rotated artwork may protrude from its non-clipping frame.
- Projects at 1135×998 after the browser comment: computed stack order is divider 1, back artwork 2, shade 3, front artwork 4; the divider remains visible on the preview background and is occluded by both images.
- Experience at 1440×900: sticky top 0; local travel is 9690 px while global Lenis remains at multiplier 1. Reached items remained selected together and cleared in reverse; progress retained two blue layers and zero knob elements.
- Experience at short 490 px height fit the full 490 px composition using the contracted compression order. Below 1280 px the live page rendered a complete static grid with all six jobs and no retained absolute offsets.
- Experience at progress 0: current card is exactly 288×216 at source x=148; date row is 44 px, rail 32×44, node frames 4×4, line 1×12, and the three current SVG hrefs match the exact Figma exports. At progress 0.4746 Eyeconweb and Freelance remained reached together; reverse to 0.1202 cleared both.
- Reverse travel, resize-progress preservation, keyboard focus parity and reduced-motion final states were covered by focused checks.
- Full viewport matrix used the actual browser viewport: 2560×1440 and 1920×1600 selected Large with a 947×594 map; 1920×1080, 1440×900, 1280×720 and 1440×1299 selected Small with a 720×452 map, except the contracted low-height 1280×720 fit at 650×408. The 1440×1300 boundary selected Large. Every desktop sample had `scrollWidth === clientWidth`; 1279×900 retained the complete non-sticky adaptive layout.
- Experience live travel at 1440×900 moved continuously from active index 0 to 5 and reversed to index 3; progress `0.6533` survived resize to 1920×1080 exactly. At progress 1 the last 280 px card was centered at x=720, outside the fade beginning at x=1160. At 1280×720 the sticky, heading, 530 px tape window and progress occupied one 720 px viewport without clipping; the last card centered at x=640 and remained fully visible as the footer entered.
- Hero keyboard focus activated the lens; pointer selection at the design node produced the `design` icon, “Проектирование” and `rgb(67, 162, 238)`. A live forward pulse from `document` to `design` was observed with its measured 2.45242 s route duration and terminal-only arrival.
- Project rapid pointer re-entry completed at the exact hover transform/shadows/glow/shade/text colors without a reset; keyboard focus on “Подробнее” produced the same active state. Process-card focus filled only the exact mask to 96 px while all three 64×64 icon frames retained `transform:none`.
- Local fonts reported `loaded`: Google Sans 400/500, Onest 350 and Source Code Pro 400 all passed `document.fonts.check`, with the expected computed family on heading, body and technical roles.
- Fresh final viewport matrix: 2560×1440 and 1920×1600 use Large with 947×594 map; 1920×1080, 1440×1299 and 1440×900 use Small with 720×452 map; 1440×1300 uses Large; 1280×720 contracts the Small map to 650×408; 1279×900 uses the complete relative/static experience and intrinsic 701.6 px project cards. Every sample reported `scrollWidth === clientWidth`.
- Fresh interaction pass: project pointer hover and keyboard focus both produced full divider scale, −8° front rotation and shade opacity 0 with stack order 1/2/3/4; process pointer hover and keyboard focus both reached a 96 px fill radius inside the unchanged 64×64 frame with `transform:none`.
- Plan 1.1 project geometry: at 1440×900 each Preview is 638.5×329 and its shade is 638×328 from y=1 exactly to Main; neither card reports Main overlap. At 1135×998 the shade scales to 533.5×274.328 and remains inside Preview.
- Plan 1.1 experience entry: one strong downward gesture stopped at section top 2957 with offset 0, progress `0.0000` and the gate armed. The next gesture was preserved and advanced only to `0.1567`; reverse travel reduced it to `0.0294` without re-gating.
- Plan 1.1 fades: intermediate storyboard state computed left width 109/opacity 1 and right width 280; the left fade is removed only at normalized progress 1.

## Automated verification

Latest corrective run:

- `npm run lint` — passed; 25 source files checked.
- `npm test` — passed; 25/25 tests, including entry-gate tail suppression/resume, cumulative forward/reverse experience boundaries, local pacing, one Lenis instance and unmount cleanup.
- `npm run build` — passed; 51 modules transformed.
- `npm run check:browser` — passed against the built bundle on a local loopback server.
- `git diff --check` — passed.

## Review passes

1. Fidelity/completeness review found and fixed the responsive project-height clipping and the 1100–1279 experience breakpoint mismatch.
2. Regression/scope review found and fixed both the per-job specificity leak that retained desktop `top/left` offsets in the static experience grid and the 150/200 ms mismatch that could move the icon fill origin during its final 50 ms. It confirmed no changes to Admin, shared contracts, published snapshot/archive, dependencies, Figma, production or deployment.
3. After the Figma connection recovered, the current marker, inactive marker and reached storyboard state were reread from exact nodes. The implementation uses byte-identical downloaded SVG exports, and the complete viewport/interaction matrix was rerun against the current runtime.
4. Plan 1.1 fidelity/completeness review re-read the exact Preview shade and all four experience storyboard states, then verified shade bounds, edge fades, focus state and single-progress behavior in the live runtime.
5. Plan 1.1 regression/scope review confirmed one Lenis/RAF, timer/subscription cleanup, keyboard scrolling outside the pointer gate, preserved reverse travel and unchanged behavior below 1280 px. The diff is confined to `tools/concept-v2/app`; Admin, shared contracts, Hero, published schema, process fill, dependencies, Figma and production remain untouched.
