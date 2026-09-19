# Concept V2 runtime contract

## Boundary

This contract applies only to `tools/concept-v2/app`. It does not share the public Next.js Portfolio runtime, its `ScrollController`, `ScrollFrameCoordinator`, data contract or deployment path.

## Finite work owners

- `src/runtime/frame-task.mjs` coalesces a consumer's latest input into one read/write frame. It is disposable and never owns a permanent loop.
- `src/runtime/view-activity.mjs` combines target intersection with document visibility. A consumer must release pending work on inactivity instead of hiding it with opacity.
- `src/runtime/layout-invalidation.mjs` is a narrow position-invalidating signal. It is not a scroll controller.
- Hero pulses own their timer and only run for the visible map SVG. Experience owns its paint task; the existing Lenis root RAF remains the sole intentional permanent scroll loop.
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
