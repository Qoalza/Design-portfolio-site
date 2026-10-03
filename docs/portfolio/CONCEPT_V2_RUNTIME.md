# Concept V2 runtime contract

## Boundary

This contract applies only to `tools/concept-v2/app`. It does not share the public Next.js Portfolio runtime, its `ScrollController`, `ScrollFrameCoordinator`, data contract or deployment path.

## Finite work owners

- `src/runtime/frame-task.mjs` coalesces a consumer's latest input into one read/write frame. It is disposable and never owns a permanent loop.
- `src/runtime/view-activity.mjs` combines target intersection with document visibility. A consumer must release pending work on inactivity instead of hiding it with opacity.
- `src/runtime/layout-invalidation.mjs` is a narrow position-invalidating signal. It is not a scroll controller.
- Hero pulses own their timer and only run for the visible map SVG. Active scroll cancels them synchronously; their immediate return is deferred through one finite frame task so it cannot overlap the final scroll event. Experience owns its paint task; the existing Lenis root RAF remains the sole intentional permanent scroll loop.
- One root wheel owner is mounted above the Concept V2 route selector, so the same input policy applies to the home page, project pages, 404 and standalone preview routes. It classifies input from its event pattern instead of the operating system: discrete mouse-wheel input keeps Lenis smoothing, while continuous precision-trackpad input uses native scrolling on ordinary page sections. Ambiguous impulses retain the last proven input type, including the first high-delta event after an idle trackpad gesture; repeated discrete evidence still hands ownership to a mouse. Native activity settles after the wheel stream is idle even when the document is already at a scroll boundary and emits no final `scroll` event. An upward trackpad fling that starts below Experience remains native while crossing it. A downward gesture hands back to the original Lenis path only on the wheel event that actually reaches the Experience scroll boundary, so merely revealing the section at the viewport edge cannot slow the preceding Process or AI sections. That native-to-Lenis handoff never resets native momentum. A gesture that starts inside Experience also keeps that original path.
- The Lenis owner publishes only scroll activity transitions for consumers that need them. Project card hover follows pointer position during and after scroll; its visual state, transitions and keyboard `:focus-within` behavior are independent of scroll activity.
- The Hero lens consumes that same activity signal. Active scroll cancels pending pointer work, settles the lens and caption without transition work, and requires new pointer movement before pointer interaction resumes; its approved radius, mask/filter and rest-state transition remain unchanged.
- About deck motion remains a finite 500 ms RAF animation. Its generation is invalidated before reduced-motion settlement.

## Geometry and input

- Pointer and scroll handlers retain only the newest primitive values; layout reads and DOM writes happen inside the owning frame task.
- Header threshold comes from its shell's measured height. Experience caches document geometry and refreshes it only after targeted invalidation, resize or font completion.
- Experience must reset its gate before any offscreen early return when the viewport is above the section. Its full paint loop starts only at the real section boundary; the preceding Process and AI sections must not activate offscreen Experience style work. The root wheel owner publishes the actual input stream independently from document movement. After completion, Experience restores its offscreen full-height geometry only when that wheel stream has been quiet for 160 ms and the root scroll owner has also settled; this keeps the 8809 px document-height change outside active native trackpad momentum, including events received at a scroll boundary. If the user reverses before that idle rearm, the next captured entry through the upper boundary rearms the full geometry and zero progress while the stopper already holds the page. Its travel, blur curve, masks, entry gate and Lenis wheel path are unchanged.
- While About viewer fixes `body`, Experience retains a dirty position cache. Viewer cleanup restores scroll first and then notifies invalidation.

## Media

- `src/media/ResponsivePicture.jsx` renders browser-selected sources for responsive media and returns a bare `img` for fallback-only consumers.
- `src/media/image-sources.mjs` owns only local paths, dimensions and MIME source data. It does not own project copy or canonical content.
- `src/media/image-preparation.mjs` prepares actual rendered image nodes. Priority may rise from low to high but never drops; decode readiness belongs to the node and selected resource.
- About retains both foreground and halo images. Project cards retain their existing wrappers and PNG fallback, while the browser may select their 640 px or 1080 px AVIF candidates for the actual 520 px slot.

## Consumer rule

New Concept V2 pages with similar behavior import these primitives instead of copying local RAF, pointer, scroll or preload effects. A new consumer needs coalescing, disposal, inactive-state and real-browser outcome coverage. Moving this behavior into the public Next.js Portfolio requires a separate integration decision.

## Approved preloader and navigation boundary

- The approved Concept V2 preloader has three visual states: ordinary loading, loading longer than ten seconds, and a confirmed connection failure. The 404 page is separate.
- `/preloader` remains the visual and copy demo. Its ten-second alternation and Retry button do not inspect or restart real navigation. The separate `transition-preview.html` remains a visual sample.
- The demo's normal-to-connection and Retry-to-normal transitions use the approved 370 ms A/connection-symbol morph. Background, caption and status change in the same interval; the other visual states and their loading logic remain unchanged.
- A real navigation must preserve the site's existing readiness and intentional lazy-loading rules. The preloader may cover work already required for a usable first view; it must not turn separately specified background or proximity-based loading into a blocking condition.
- On the first visit to the local Concept V2 page, the preloader covers the existing App while `first-view-readiness.mjs` waits only for the visible Header/Hero images and the fonts used by the first screen. The existing lazy/proximity loading in Projects, Experience and About is unchanged.
- Once the ordinary preloader is shown, keep it visible through one complete logo revolution and until the destination is ready. The phrase `Всё, перехожу` appears only when ordinary loading is confirmed ready after that revolution; its timed appearance in the standalone demo is not the runtime contract.
- At ten seconds, the loading attempt continues and the long-loading state offers waiting or Retry. If it finishes while this state is visible, reveal the page directly from that state: do not return to ordinary loading or show `Всё, перехожу`. A confirmed connection failure uses the connection state. If failure arrives during the first ordinary logo revolution, finish that revolution before changing to the connection state; later failures change immediately. Retry starts a new real attempt when navigation is connected.
- `preloader-gate.mjs` applies the approved 200 ms boundary from a controlled click: a destination ready earlier uses the soft background-color seam; a pending destination shows the preloader at 200 ms. The gate continues loading after ten seconds, aborts the previous attempt on Retry, and ignores stale completions.
- The current Concept V2 has one actual internal page. `/navigation-lab` contains two temporary local test pages that exercise the gate against a real local fetch. Its default preview loops through ordinary loading → long loading → Retry → ordinary loading → connection failure → Retry → ordinary loading → long loading. Individual simulated latency or failure presets remain selectable. It does not add Blog, Laboratory or project-detail navigation to the portfolio. External and anchor links retain their existing behavior.
- A future real internal page must supply its own `prepare` and `commit` functions to the gate. Its first usable view, rather than background/proximity work, determines readiness. The 404 page and server-error treatment still require their own route/design before such pages are added.
