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
| Experience | section `3088:64107`, tape `3116:67342`, window `3108:64578`, current marker `3108:64584`, states `3116:67337`…`3116:67340`, progress `3108:64685` | Updated tape window is 1280 px maximum; right fade is 240 px; per user clarification the mirrored 240 px left fade is absent initially, visible only while moving, and absent at the end | First and last node anchors travel center-to-center across 2047 px; vertical travel is `9690 ÷ 1.1`, exactly 10% faster; reached boundaries follow the real node anchors |
| Process icons | `3075:60247`, `3075:60249`, `3075:60266`, `3075:60284` and current Library V2 icon children | 64×64 clipped frames, line-only vectors, no movement | Fill stays inside the real line masks, starts from one stable random frame edge and now uses the explicit user override of 200 ms Ease In |
| Global scroll | Existing application Lenis root | Downward entry inertia must stop at sticky start and progress 0; the next independent gesture must resume without losing its first event, and a continuous wheel stream must never start the tape by timeout | One Lenis/RAF and no native wheel listener; the internal virtual-scroll gate arms only after a 120 ms quiet tail and has no maximum-hold release; global `wheelMultiplier: 1` is unchanged |

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
- Rasterizing the complete 1440×240 fields caused a fixed-width boundary and a dirty scaled edge. The fields are now native HTML/CSS: a full-width outer rule, centered 1280×239 bordered child, and a 16 px radial-dot tile matching the Figma instance grid.
- The date marker used one CSS background with two identical outline circles and an oversized line. It now reproduces the exact Figma child tree with downloaded current/neutral/reached SVG assets and switches only the reached endpoint.

## Runtime evidence

- Fonts loaded from local files: Google Sans 400/500 and Onest; computed heading/body families matched their Figma roles.
- Hero at desktop source sizes: the selected “Проектирование” node produced the design icon, `rgb(67, 162, 238)` and a 0.15 s caption animation.
- Projects at 1440×900: section height 1125; heading local top 120 and height 136; grid local top 336 and height 709; card 638.5×613. Focus state reached −8° front rotation, full blue divider, blue glow and secondary description color.
- Projects in the ordinary unmodified app viewport: both controls remain visible after the image; the next card stays in document flow while rotated artwork may protrude from its non-clipping frame.
- Projects at 1135×998 after the browser comment: computed stack order is divider 1, back artwork 2, shade 3, front artwork 4; the divider remains visible on the preview background and is occluded by both images.
- Experience at 1440×900: sticky top 0; local travel is `9690 ÷ 1.1 = 8809.09…` px while global Lenis remains at multiplier 1. Reached items remained selected together and cleared in reverse; progress retained two blue layers and zero knob elements.
- Experience at short 490 px height fit the full 490 px composition using the contracted compression order. Below 1280 px the live page rendered a complete static grid with all six jobs and no retained absolute offsets.
- Experience at progress 0: current card is exactly 288×216 at source x=148; date row is 44 px, rail 32×44, node frames 4×4, line 1×12, and the three current SVG hrefs match the exact Figma exports. At progress 0.4746 Eyeconweb and Freelance remained reached together; reverse to 0.1202 cleared both.
- Reverse travel, resize-progress preservation, keyboard focus parity and reduced-motion final states were covered by focused checks.
- Full viewport matrix used the actual browser viewport: 2560×1440 and 1920×1600 selected Large with a 947×594 map; 1920×1080, 1440×900, 1280×720 and 1440×1299 selected Small with a 720×452 map, except the contracted low-height 1280×720 fit at 650×408. The 1440×1300 boundary selected Large. Every desktop sample had `scrollWidth === clientWidth`; 1279×900 retained the complete non-sticky adaptive layout.
- Experience live travel at 1440×900 moved continuously from active index 0 to 5 and reversed to index 3; resize preserved logical progress. At progress 1 the last 280 px card is centered in the 1280 px tape window. At 1280×720 the sticky, heading, 530 px tape window and progress occupy one 720 px viewport without clipping; the last card remains fully visible as the footer enters.
- Hero keyboard focus activated the lens; pointer selection at the design node produced the `design` icon, “Проектирование” and `rgb(67, 162, 238)`. A live forward pulse from `document` to `design` was observed with its measured 2.45242 s route duration and terminal-only arrival.
- Project rapid pointer re-entry completed at the exact hover transform/shadows/glow/shade/text colors without a reset; keyboard focus on “Подробнее” produced the same active state. Process-card focus filled only the exact mask to 96 px while all three 64×64 icon frames retained `transform:none`.
- Local fonts reported `loaded`: Google Sans 400/500, Onest 350 and Source Code Pro 400 all passed `document.fonts.check`, with the expected computed family on heading, body and technical roles.
- Fresh final viewport matrix: 2560×1440 and 1920×1600 use Large with 947×594 map; 1920×1080, 1440×1299 and 1440×900 use Small with 720×452 map; 1440×1300 uses Large; 1280×720 contracts the Small map to 650×408; 1279×900 uses the complete relative/static experience and intrinsic 701.6 px project cards. Every sample reported `scrollWidth === clientWidth`.
- Fresh interaction pass: project pointer hover and keyboard focus both produced full divider scale, −8° front rotation and shade opacity 0 with stack order 1/2/3/4; process pointer hover and keyboard focus both reached a 96 px fill radius inside the unchanged 64×64 frame with `transform:none`.
- Plan 1.1 project geometry: at 1440×900 each Preview is 638.5×329 and its shade is 638×328 from y=1 exactly to Main; neither card reports Main overlap. At 1135×998 the shade scales to 533.5×274.328 and remains inside Preview.
- Plan 1.1 experience entry: one strong downward gesture stopped at section top 2957 with offset 0, progress `0.0000` and the gate armed. The next gesture was preserved and advanced only to `0.1567`; reverse travel reduced it to `0.0294` without re-gating.
- Final centered-tape proof at 2560×1440: the visible window is exactly 1280 px and centered in the 2545 px content viewport; both fades are 240 px and fixed to its edges. At progress 0 the first node center equals the window center and the left fade opacity is 0; during movement it is 1; at progress 1 the last node center again equals the window center and the left fade returns to 0.
- Final speed/activation proof: horizontal travel is the exact 2047 px distance between first and last node anchors, vertical travel is `9690 ÷ 1.1 = 8809.09…` px, and each cumulative reached state switches at its measured anchor crossing rather than equal fifths.
- Corrected field proof at 1920×1600: the field is 1920×240 with one full-width `#2e3133` boundary; its CSS grid is exactly 1280×239 at x=320 with 1 px side borders and a 16×16 dot tile. Both 320 px gutters are solid, `background-image` on the outer field is `none`, and horizontal overflow is zero.
- Short-height browser rule: both outer fields (dots and strokes together) are hidden below 48 px computed field height while their grid rows continue to preserve the central composition. At 1512×1080 the 27 px field is hidden; at 1512×982 the contracted field is also hidden. The threshold is inclusive at 48 px and covers the different content heights produced by Arc and Zen browser chrome on a 16-inch MacBook Pro.
- Follow-up repeat-cycle proof: a complete forward pass reached progress `1.0000`, reverse returned above the section with gate `idle`, the second entry stopped at progress `0.0000`, and an immediate upward gesture released the gate and moved to y=811.5. A third entry armed normally and the next downward gesture resumed progress, proving the component no longer remains stopped after reuse.
- Continuous-input proof at 1440×900: a stream extending beyond the quiet-tail interval released the gate instead of remaining in `holding`; after returning above the section the gate was `idle`, and the same stream on the second entry again reached `released` with non-zero progress without a reload.

## Automated verification

Latest corrective run:

- `npm run lint` — passed; 25 source files checked.
- `npm test` — passed; 27/27 tests, including repeatable entry-gate cycles, upward escape, bounded continuous-input holding, tail suppression/resume, cumulative forward/reverse experience boundaries, local pacing, one Lenis instance and unmount cleanup.
- `npm run build` — passed; 51 modules transformed.
- `npm run check:browser` — passed against the built bundle on a local loopback server.
- `git diff --check` — passed.

## Review passes

1. Fidelity/completeness review found and fixed the responsive project-height clipping and the 1100–1279 experience breakpoint mismatch.
2. Regression/scope review found and fixed both the per-job specificity leak that retained desktop `top/left` offsets in the static experience grid and the 150/200 ms mismatch that could move the icon fill origin during its final 50 ms. It confirmed no changes to Admin, shared contracts, published snapshot/archive, dependencies, Figma, production or deployment.
3. After the Figma connection recovered, the current marker, inactive marker and reached storyboard state were reread from exact nodes. The implementation uses byte-identical downloaded SVG exports, and the complete viewport/interaction matrix was rerun against the current runtime.
4. Plan 1.1 fidelity/completeness review re-read the exact Preview shade and all four experience storyboard states, then verified shade bounds, edge fades, focus state and single-progress behavior in the live runtime.
5. Plan 1.1 regression/scope review confirmed one Lenis/RAF, timer/subscription cleanup, keyboard scrolling outside the pointer gate, preserved reverse travel and unchanged behavior below 1280 px. The diff is confined to `tools/concept-v2/app`; Admin, shared contracts, Hero, published schema, process fill, dependencies, Figma and production remain untouched.
6. Follow-up fidelity/regression review replaced the fixed raster fields with responsive HTML/CSS geometry grounded in the Figma outer/child/tile nodes, and exercised full forward, reverse, second-entry escape and third-entry resume cycles with the real Lenis runtime.

## Stage two — final polish

Status: `READY_FOR_REVIEW`

| Area | Exact source | Confirmed result |
|---|---|---|
| Process | `3075:60232`, `3075:60233`, `3075:60247` | Desktop heading is 136 px; the cards use the source 365/446/383 px minima, 56 px padding and 48 px internal spacing. The existing 200 ms stationary icon-fill interaction is retained. |
| AI strip | `3110:65436`, `3110:65403`, `3110:65404`, `3110:65416` | Full-width 272 px strip has 80 px patterned side fields and a centered 1280 px panel. Its source column split, 56 px padding, 24/32 title and 56 px tool frames are reproduced. |
| Personal and footer | `3116:78466`, `3116:78467`, `3116:78468`, `3110:66042`, `3075:60343` | Desktop personal section is 1440×1066 with the intentionally empty 709 px area. Footer is 61 px outer / 60 px inner, 1280 px wide at 1440. |
| Cursor | User-selected Bibata Original Classic | Direct 22 px arrow and hand SVG cursors replace only the ordinary desktop pointer states. The custom scheme lens cursor, disabled states and text cursor remain unchanged; there is no magnetic, trailing or delayed effect. |

### Stage-two runtime evidence

- At 1440×900, `scrollWidth === clientWidth`; Process is 1278×629, AI is 1440×272 with a 1280 px central panel, the personal section is 1440×1066, and the footer is 1440×61 with its 1280 px inner frame.
- At 1279×900, `scrollWidth === clientWidth`; the personal section is intentionally hidden, AI becomes the single-column adaptive layout, footer becomes 72 px, and the earlier responsive Process layout remains intact.
- At the desktop breakpoint, computed CSS resolves the 22 px Bibata Original Classic arrow for ordinary content and the matching hand for links/buttons. The process map still resolves to `cursor:none` for its bespoke lens interaction.
- Latest verification: `npm test` passed 30/30; `npm run lint`, `npm run build`, `npm run check:browser` and `git diff --check` passed.

## About correction — final evidence

Status: `READY_FOR_REVIEW`

- The implementation is based on the approved Concept V2 line, not the obsolete About worktree: branch `codex/concept-v2-about-correction` starts at exact baseline `3fe274a48d29caf0a96a599a13e97881b9e277dc`.
- At 1440×960 the section is 1066 px tall with a 312 px heading and 649 px body. The centered content body is 1280 px wide; the copy/panel split is 684 / 1 / 593 px. The CSS dot field reports `16px 16px` and reaches the lower border.
- At 2560×1440, 1920×1080 and 1440×900 the carousel frame stays at its source dimensions and document `scrollWidth === clientWidth`. At 1280×720 the deck has one uniform scale of `0.888889` and still has no horizontal overflow. At 1279×900 the pre-existing rule hides the desktop-only section; the rest of the approved static layout remains active.
- Browser interaction evidence: each right/left action selects its target indicator at transition start; the three assets remain individual DOM images; the active card opens the viewer; `Esc` closes it. The viewer uses the active image in its foreground, halo and own side/rear context.
- Opening the viewer at 1440×960 retained `documentElement.clientWidth` at 1440 before, during and after locking the body. Closing restored the prior vertical position without adding a visible scrollbar or width jump.
- Automated final run: `npm run check` passed (34 tests, lint and production Vite build); `npm run check:browser` passed against the built bundle; `git diff --check` passed.

### One final implementation self-review

1. Fidelity/completeness: rechecked direct Figma children for heading, hatch, body copy, 16/16 dividers, panel pattern, all three card roles, lower gradient, hover action and enlarged viewer. Fixed the accidental CSS nesting under Experience and restored the 1440 px source scale (rather than scaling it down at the reference viewport).
2. Regression/scope: rechecked the baseline experience grid, its entry mechanics and the existing below-1280 fallback through the repository tests and browser matrix. The change is confined to the isolated Concept V2 app, assets and evidence; no Admin, shared contract, Figma, published snapshot/archive, dependency, production or deployment action occurred.

## Scroll runtime optimization — 2026-09-19

Status: `READY_FOR_REVIEW`

Baseline: `ce040c9a22bb3dab227e6aceb2673e186a096a55`

### Goal

Remove avoidable main-thread, paint, image-transfer and decode work around Hero, Projects and Experience while preserving the approved Concept V2 composition, geometry, appearance, transitions and interaction semantics. The optimization must be invisible: no visual redesign, no removed effect and no altered Experience entry/exit behavior.

### Implemented decisions

- Hero route pulses now exist only while the actual map SVG intersects the viewport. The observer follows the map rather than the whole Hero, keeps an 8 px offscreen safety margin and confirms exit on the next animation frame so a still-visible edge cannot lose its pulse. A true exit cancels the scheduler, current 36-segment pulse and arrival state instead of hiding them with opacity. Re-entry emits the first pulse immediately and then resumes the original random 2–3 second cadence. Tab visibility, reduced motion and resize behavior remain active.
- Experience retains the approved 2500×530 tape, sticky scene, dynamic blur, masks, center-to-center travel and Lenis entry gate. Its DOM targets are resolved once, section geometry is refreshed on layout/resize rather than every scroll event, repeated style/class writes are suppressed, and scroll work is coalesced to at most one paint per animation frame. Heavy painting is skipped until the section is within two viewports and resumes from the current document position without changing progress semantics.
- About keeps the original PNG files as compatibility fallbacks and keeps both foreground and halo DOM instances required by the visual treatment. Responsive 640 px and 1080 px AVIF/WebP derivatives were added for all three cards. The browser chooses AVIF first, WebP second and PNG last; reserved card geometry remains unchanged.
- About preparation is proactive rather than immediate: after the page load, the browser may prepare the AVIF set during idle time at low priority; entering a 200% viewport margin promotes preparation to the required path and requests decode before the section is visible. Ordinary `<img>` elements remain lazy and asynchronous, so About no longer competes with Hero during the critical initial render and still arrives without a broken or empty image state during normal scrolling.
- No dependency was added. Derivatives were produced with a one-off external image tool and committed as ordinary static assets.

### Asset result

- Original PNG set remains approximately 6.9 MiB: Artur 2.0 MiB, road 2.7 MiB and dogs 2.2 MiB.
- The complete 640 px AVIF set is approximately 336 KiB; the complete 1080 px AVIF set is approximately 660 KiB.
- WebP equivalents are retained as the intermediate browser fallback: approximately 384 KiB at 640 px and 828 KiB at 1080 px.
- At the checked 1280×720 runtime the browser selected the 640 px AVIF variants; all six visible foreground/halo image nodes were decoded, complete and rendered at the existing 320×420 or 256×336 geometry.

### Runtime evidence

- With the Hero map visible, a scheduled route rendered all 36 pulse segments. After the map moved fully beyond the viewport, the segment count became zero and remained zero past a complete 3.2 second cadence window. Returning to the top produced 36 segments immediately.
- At Experience progress `0.2317`, the optimized runtime retained active index 1, shift `-474.27447884416927px`, the expected first completed/second partial path offsets and the cumulative reached state. The dynamic blur still responded to movement and returned to zero after the existing quiet timer.
- The About section rendered with unchanged card composition and dimensions; Chromium selected `about-*-640.avif`. No runtime console errors were recorded.
- `npm run check` passed: lint checked 29 source files, all 72 tests passed and the production Vite build transformed 76 modules.
- `npm run check:browser` passed against the built bundle on a temporary loopback server.
- `git diff --check` passed.

### Constraints and explicit non-scope

- This change is confined to the local Concept V2 app under `tools/concept-v2/app`. It does not modify the public Next.js portfolio, current production version, Admin, shared content contract, canonical project data, Figma, deploy configuration or production.
- Lenis retains its existing continuous root RAF loop. Changing its idle lifecycle was intentionally deferred because it is coupled to the Experience gesture gate and was not needed to remove the confirmed dominant waste.
- The Experience dynamic blur and its visual masks remain unchanged. The first pass removes surrounding JS/DOM work; any later blur redesign requires new profiling evidence and separate visual approval.
- Oversized Project artwork is not converted in this group. Final project assets should be exported near their real rendered dimensions with density-aware responsive sources when final content is prepared.
- Direct profiling in Zen remains an acceptance follow-up because browser automation access was unavailable there. The Chromium production-build checks prove the implemented lifecycle and rendering contracts, but Zen should still receive one manual feel/performance pass before this concept becomes a release candidate.

### Review passes

1. Fidelity/completeness: confirmed that no stylesheet geometry or visual tokens changed; Hero preserves its pulse renderer and cadence, Experience preserves blur/masks/travel/gate, and About preserves both image layers, fallback originals and fixed card dimensions. Browser screenshots confirmed the existing Hero, Experience and About compositions.
2. Regression/scope/risk: confirmed cleanup for timers, observers, animation frames and listeners; verified immediate Hero re-entry, complete offscreen cancellation, responsive-image selection, Experience progress/reached/path states and a clean console. The diff remains inside the isolated Concept V2 app and adds no package dependency or production action.
