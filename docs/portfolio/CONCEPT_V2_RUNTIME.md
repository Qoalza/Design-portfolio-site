# Concept V2 runtime contract

## Boundary

This contract applies only to `tools/concept-v2/app`. It does not share the public Next.js Portfolio runtime, its `ScrollController`, `ScrollFrameCoordinator`, data contract or deployment path.

## Finite work owners

- `src/runtime/frame-task.mjs` coalesces a consumer's latest input into one read/write frame. It is disposable and never owns a permanent loop.
- `src/runtime/view-activity.mjs` combines target intersection with document visibility. A consumer must release pending work on inactivity instead of hiding it with opacity.
- `src/runtime/layout-invalidation.mjs` is a narrow position-invalidating signal. It is not a scroll controller.
- Hero pulses own their timer and only run for the visible map SVG. Experience owns its paint task; the existing Lenis root RAF remains the sole intentional permanent scroll loop.
- The Lenis owner publishes only scroll activity transitions. Project hover effects yield immediately while a physical or smooth scroll is active, then retain their existing hover behavior once scrolling settles.
- About deck motion remains a finite 500 ms RAF animation. Its generation is invalidated before reduced-motion settlement.

## Geometry and input

- Pointer and scroll handlers retain only the newest primitive values; layout reads and DOM writes happen inside the owning frame task.
- Header threshold comes from its shell's measured height. Experience caches document geometry and refreshes it only after targeted invalidation, resize or font completion.
- Experience must reset its gate before any offscreen early return when the viewport is above the section. Its travel, blur curve, masks, entry gate and Lenis configuration are unchanged.
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
- The current `/preloader` route is a visual and copy demo. Its ten-second alternation and Retry button do not inspect or restart real navigation. The separate `transition-preview.html` is a provisional visual sample, not site navigation.
- A real navigation must preserve the site's existing readiness and intentional lazy-loading rules. The preloader may cover work already required for a usable first view; it must not turn separately specified background or proximity-based loading into a blocking condition.
- Once the preloader is actually shown, keep it visible through one complete logo revolution and until the destination is ready. The phrase `Всё, перехожу` is reserved for confirmed readiness; its timed appearance in the demo is not the runtime contract.
- At ten seconds, the loading attempt continues and the long-loading state offers waiting or Retry. A confirmed connection failure uses the connection state. Retry starts a new real attempt when navigation is connected.
- For controlled internal navigation, the approved decision boundary is 200 ms from the click: a destination ready before then uses the soft page transition; if it is still pending at 200 ms, show the preloader. Click feedback is immediate, and navigation work starts immediately. This rule is approved but not connected to the demo or live navigation yet.
- The exact navigation target and the runtime readiness signal remain open integration decisions. Do not infer them from the visual demo.
