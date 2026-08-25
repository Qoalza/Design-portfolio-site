# Action bar acceptance fix — verification evidence

- Status: `READY_FOR_USER_REVIEW`
- `BASE_SHA`: `226e226f2420c14f18dfe973d710c98e01834460`
- Runtime `CODE_SHA`: `62152793e8a7d501209f9ed8a257636ef846bcce`
- Branch: `codex/action-bar-acceptance-fix`
- Route: `/projects/corvo?review=6215279`
- Figma: read-only

## Подтверждённые причины

1. Initial resolver выбирал правильный логический `Adaptive`, но переходы включались до того, как правильная физическая геометрия пережила видимый кадр. При client navigation первый rect оставался полноэкранным и анимировался к `1000 px`.
2. Последующая scroll-state зависела от initial variant вместо одной геометрической state machine, поэтому обратные переходы и граница information/Gallery могли расходиться.
3. «Поделиться» использовал разветвление Web Share/clipboard и не давал единого подтверждённого copy-контракта.

RED-трасса до исправления: [`traces/red-client-navigation-1920x1080.json`](traces/red-client-navigation-1920x1080.json).

## Figma contract

| Состояние | Source | Reference |
|---|---|---|
| Full | main file `576:33195`, screen `553:3036` | [`figma/full-553-3036.png`](figma/full-553-3036.png) |
| Adaptive | main file `528:1540`, screen `553:3314` | [`figma/adaptive-553-3314.png`](figma/adaptive-553-3314.png) |

Подтверждённые параметры: высота `88 px`, верхний border `#E2E5E7`, фон `#FCFCFD`, padding `24 px`, gap `8 px`, Figma button `40 px`, Onest `14/16`, дата Source Code Pro `14/16` с `-0.5 px`, текст `Обновлено 13.05.2026`. Terminal geometry постоянно резервирует `48 + 88 px`.

## Chromium — PASS

- Browser: Chrome `151.0.0.0`.
- Build provenance: фактически отданный HTML содержит полный `data-build-sha="62152793e8a7d501209f9ed8a257636ef846bcce"`.
- Low initial `1280×720`: первый стабильный вариант `Full`, rect `0 / 1280 / 88`.
- High initial и client navigation `1920×1080`: первый зарегистрированный action frame уже `Adaptive`, rect `left=560`, `width=1000`, opacity `1`, visibility `visible`, transitions выключены; следующая активация transitions не меняет rect.
- Scroll threshold `1280×720`: `199 px → Full`, `200 px → Adaptive`, `201 px → Adaptive`; при окончании information/Gallery — `Full`.
- Terminal: gap `48 px`, bar `88 px`, `scrollHeight=6163` до и после docking.
- Share: настоящий pointer-click записал текущий URL и показал общий Tooltip/announcement `Скопировано`.
- Console errors: `0`.

Measurements и frame trace: [`chromium/results.json`](chromium/results.json).

Screenshots:

- [`chromium/initial-full-1280x720.png`](chromium/initial-full-1280x720.png)
- [`chromium/client-navigation-adaptive-1920x1080.png`](chromium/client-navigation-adaptive-1920x1080.png)
- [`chromium/threshold-adaptive-200px-1280x720.png`](chromium/threshold-adaptive-200px-1280x720.png)
- [`chromium/terminal-docked-1280x720.png`](chromium/terminal-docked-1280x720.png)

## Zen — PASS

- Browser: Zen `1.21.15b`, build `126.8.18`; Gecko UA записан в JSON.
- Initial matrix: `1280×720`, `1440×900`, `1440×999`, `1440×1200`, `1440×1356`, `1920×1080` — `6/6 PASS`.
- Первый action frame каждого viewport имеет правильные variant, rect, opacity и visibility без blank-frame и attributable CLS.
- Client navigation `1920×1080`: первый action frame — `Adaptive`, `left=560`, `width=1000`, transitions выключены.
- Scroll threshold и terminal: `199/200/201`, Gallery return, gap `48 px`, неизменный `scrollHeight` — PASS.
- Share: WebDriver BiDi `pointerMove → pointerDown → pointerUp` записал текущий URL; Tooltip и live announcement — `Скопировано`.
- Console errors затронутой страницы: `0`.

Полный результат: [`zen/results.json`](zen/results.json). Screenshots находятся в [`zen/`](zen/).

## Technical checks

- `node --experimental-strip-types --test tests/*.test.mjs`: `103/103 PASS`.
- `npm run lint`: PASS.
- `NEXT_PUBLIC_BUILD_SHA=62152793e8a7d501209f9ed8a257636ef846bcce npm run build`: PASS.
- Первый sandbox build был отклонён только ограничением внутреннего Turbopack-порта; тот же build вне sandbox дошёл до TypeScript, выявил и после исправления подтвердил корректный browser timer type.

## Scope status

- First visible geometry: `VERIFIED`.
- Independent `200 px` scroll contract: `VERIFIED`.
- Gallery return and terminal docking: `VERIFIED`.
- Exact internal component layout: `VERIFIED`.
- Copy-current-URL and shared feedback: `VERIFIED`.
- Общий MLIR5 backlog из `DESIGN_QA.md` не входит в эту изолированную Goal и остаётся `OPEN`.

