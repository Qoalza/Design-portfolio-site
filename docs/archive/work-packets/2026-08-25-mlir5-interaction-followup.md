# WORK_PACKET_MLIR5 — interaction follow-up

**Архивный статус:** `SUPERSEDED` последующим MLIR6 reconciliation.

## Contract

- Size: `LARGE`
- Risk: `ELEVATED`
- Mode: `FULL`
- Namespace: `MLIR5-*`
- Base: `38bda2ab5d21e3c5b0c405c42384c657a6a30aa8`
- Branch: `codex/main-layout-interaction-polish-mlir5`
- PR base: `codex/main-layout-interaction-polish`
- Evidence: `design-reference/main-layout-interaction-polish-mlir5/`
- Figma: strictly read-only
- Merge and deploy: excluded

Target: fix the confirmed Lenis interruption, idle Gallery RAF work, shared Tooltip geometry/motion, AI `Neutral+Accent` TextButton, the independent action-bar initial/scroll contracts, and Zen Gallery pointer activation.

## Sources

- Tooltip component: library `CRcI38SOIkr5knjKXeCV5h`, node `207:1498`.
- Tooltip placement: main file `5ZzspE0OrqesDcTP0RRPHr`, node `735:90306`.
- AI TextButton instance: main file node `725:88725`.
- TextButton master: library node `220:1793`.
- Action-bar behavior: the approved MLIR5 written contract; existing `88 px` height and `48 px` terminal gap remain unchanged.

Old MLIR4 evidence is diagnostic history and cannot prove MLIR5. The context-transfer directory and ZIP are excluded from every Git group.

## Blocks

### MLIR5-SCR

- Manual input cancels root Lenis only during `PROGRAMMATIC_SCROLL`.
- `SCROLL_TRACKING` never cancels ordinary wheel/touch/key inertia.
- Keep `lerp: 0.1`; measure multiplier `1` before considering `0.9`.
- Gallery Lenis subscribers are demand-driven and stop updating when idle or invisible.
- Preserve one shared RAF coordinator and native touch/coarse/reduced-motion behavior.

### MLIR5-TTP

- Lifecycle: `CLOSED → ENTERING → OPEN → EXITING → CLOSED`.
- Exact one-line copy, Onest `14/20`, icon `20×20`, natural content width.
- Real opacity enter and exit: `200 ms`; unmount only after exit.
- Preserve portal, collision handling, keyboard and touch behavior.

### MLIR5-TXB

- Add typed `TextButtonVariant = "neutral" | "neutralAccent"`.
- Default consumers remain neutral; the AI `Figma` instance uses `neutralAccent`.
- Implement all Figma states through the shared component, not a local override.

### MLIR5-ABA

- Initial resolver is independent from the scroll threshold.
- Before first paint, use `informationStart.top <= viewportHeight - 88` while information is active to select Adaptive; otherwise Full.
- Initial geometry has no transition; transitions enable only after a valid initial resolution.
- Only pages initially resolved as Full use the later `200 px` Full→Adaptive threshold.
- At the end of information / Gallery entry, return immediately to Full.
- Preserve terminal `48 + 88 px`, docking and stable `scrollHeight`.

### MLIR5-LBX

- Do not capture the pointer on `pointerdown`.
- Confirm horizontal drag after `8 px`; only then capture.
- Trigger one discrete step after `48 px` horizontal movement.
- An ordinary nested image-button click reaches the lightbox in Zen.
- Preserve top-layer dialog, Escape/backdrop, focus and scroll restoration.

## Execution and commits

1. `Define MLIR5 interaction follow-up contract`
2. `Fix Lenis interruption and idle Gallery scheduling`
3. `Align shared Tooltip geometry and motion`
4. `Add the Neutral Accent TextButton variant`
5. `Resolve project action bar initial and scroll states`
6. `Preserve Gallery click and drag interactions`
7. `Document MLIR5 verification evidence`

Each runtime block requires a focused guard and browser verification before its commit. G4 and G5 depend on the final G1 scroll behavior.

## Verification

- `node --experimental-strip-types --test tests/*.test.mjs`
- `npm run lint`
- `NEXT_PUBLIC_BUILD_SHA=<full CODE_SHA> npm run build`
- Production preview must return the exact full `data-build-sha` before evidence capture.
- Chromium and Zen `1.21.15b` / build `126.8.18`.
- Full action/navigation/Gallery matrix: `1280×720`, `1440×900`, `1440×999`, `1440×1200`, `1440×1356`, `1920×1080`.
- Tooltip and AI TextButton: both browsers at `1440×900`.
- Real wheel input on `/` and `/projects/corvo`; real Zen pointer sequence, never `element.click()`.
- Initial-frame and `200 px` action-bar evidence are independent.

## Stop-lines and status

Stop only the affected block if an obligatory Figma node, Zen real-input path, build provenance, or safe implementation is unavailable. New dependencies, destructive Git operations, Figma writes, merge and deploy are prohibited.

Internal status: `READY_FOR_USER_REVIEW` for CODE_SHA `effc718663489d433aa801f88ef424347736d801`.
`DESIGN_QA.md`: `OPEN → IN_PROGRESS → READY_FOR_REVIEW`; `CLOSED` requires explicit user acceptance.
