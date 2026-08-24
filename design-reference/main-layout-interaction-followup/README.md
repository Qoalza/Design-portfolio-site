# MLIR3 verification evidence

Статус: `READY_FOR_USER_REVIEW`

- Ветка: `codex/main-layout-interaction-followup`
- `BASE_SHA`: `65ac0cd0a8259b71097b33ad2df2a6279ed682c7`
- `CODE_SHA`: `fce9e2288c3a80a28da51479a5668fa33b22fb59`
- Preview provenance: фактически отданный HTML содержит `data-build-sha="fce9e2288c3a80a28da51479a5668fa33b22fb59"`.
- Figma использовалась строго read-only.

## Результаты блоков

| Блок | Статус | Проверенный результат |
|---|---|---|
| `MLIR3-INV` | `VERIFIED` | Закрытые typography/icon inventories сопоставляют Figma source, code owner и потребителей. |
| `MLIR3-TYP` | `VERIFIED` | Видимый non-heading UI использует Onest; heading roles остаются Google Sans. Computed-font проверен на `/`, `/projects`, `/projects/corvo`, 404 и 500. |
| `MLIR3-ICO` | `VERIFIED` | Полные icon frames сохраняют source type; Stroke/Duotone не заменены approximate glyph/CSS-примитивами. XML-check дополняется consumer→Figma mapping. |
| `MLIR3-CTA` | `VERIFIED` | Telegram CTA использует полный Light Stroke frame, актуальные Onest metrics и сохранённый URL. |
| `MLIR3-FTR` | `VERIFIED` | Footer дословно повторяет library node `124:4841`: `Deveploment and design Artur A.` и `2026`. |
| `MLIR3-SHD` | `VERIFIED` | Внешний wrapper preview не обрезает мягкую тень; внутреннее кадрирование каждого экрана сохранено; horizontal overflow отсутствует. |
| `MLIR3-ABA-I` | `VERIFIED` | Первый видимый action bar сразу `Full` на обычном viewport и `Adaptive` на высоком; provisional/blank frame отсутствует. |
| `MLIR3-ABA-T` | `VERIFIED` | Terminal region стабильно содержит `48 px + 88 px`; docking не меняет `scrollHeight`, Mobile и Footer не перекрываются. |
| `MLIR3-NAV` | `VERIFIED` | Последняя секция определяется индексом и геометрией и активна к началу Gallery; programmatic navigation сохранена. |
| `MLIR3-GAL` | `VERIFIED` | Доступность стрелок следует измеренному overflow: Desktop/Tablet перелистываются, полностью помещающийся Mobile disabled; offsets clamp к реальному максимуму. |
| `MLIR3-LBX` | `VERIFIED` | Lightbox находится в top-layer `<dialog>` через portal в `BODY`; кнопка, Escape и backdrop закрывают его, scroll/focus восстанавливаются. |
| `MLIR3-PRV` | `VERIFIED` | Верхний preview не имеет link/button/focus/click/keyboard/lightbox поведения и misleading cursor/ARIA. |
| `MLIR3-REG` | `VERIFIED` | Focused tests 78/78, lint и production build успешны; Chromium и Zen matrices прошли 6/6. |

## Figma reference

- Главная: `5ZzspE0OrqesDcTP0RRPHr`, node `510:28120` — `figma/main-510-28120.png`.
- `/projects`: node `373:50236` — `figma/projects-373-50236.png`.
- Corvo: node `373:47102` — `figma/corvo-373-47102.png`.
- Footer library: `CRcI38SOIkr5knjKXeCV5h`, node `124:4841` — `figma/footer-124-4841.png`.

Эти PNG получены свежим read-only экспортом. Старый MLIR2 evidence остаётся историческим и не используется для подтверждения MLIR3.

## Browser matrix

Обязательные viewport: `1280×720`, `1440×900`, `1440×999`, `1440×1200`, `1440×1356`, `1920×1080`.

- Chromium (Codex in-app Browser): `chromium/matrix-results-fce9e22.json`, все 6 результатов `PASS`, console пустая.
- Zen `1.21.15b`, Gecko UA Firefox/154.0, build `20260818101929`: `zen/matrix-results-fce9e22.json`, все 6 результатов `PASS`, console пустая.
- Foundation Chromium `1440×900`: `chromium/foundation-results-fce9e22.json`, 5/5 маршрутов `PASS`.
- Foundation Zen `1440×900` находится в `zen/matrix-results-fce9e22.json`: typography, footer, SHA и overflow подтверждены на пяти маршрутах. `/error-test?trigger=500` закономерно пишет production RSC exception, потому что маршрут специально вызывает 500; это не hydration/layout-регрессия.

Каждая matrix-запись содержит браузер/версию, viewport, полный SHA, DOM measurements, initial action variant, navigation, Gallery availability, lightbox/terminal state, console и итог `PASS/FAIL`.

## Focused screenshots из CODE_SHA

- `chromium/home-1440x900-fce9e22.png`
- `chromium/projects-1440x900-fce9e22.png`
- `chromium/corvo-full-1440x900-fce9e22.png`
- `chromium/corvo-adaptive-initial-1440x1200-fce9e22.png`
- `chromium/gallery-groups-1440x1200-fce9e22.png`
- `chromium/gallery-lightbox-1440x1200-fce9e22.png`
- `chromium/gallery-terminal-1440x1200-fce9e22.png`
- `chromium/matrix-*-fce9e22.png`
- `zen/matrix-*-fce9e22.png`

Файлы с суффиксом `3a38e55` — промежуточная диагностика до исправления Escape и не являются финальным evidence.

## Технические проверки

- `node --test --experimental-strip-types tests/*.test.mjs` — `PASS`, 78/78.
- `npm run lint` — `PASS`.
- `NEXT_PUBLIC_BUILD_SHA=fce9e2288c3a80a28da51479a5668fa33b22fb59 npm run build` — `PASS`.
- Production preview — `PASS`; HTML отдаёт точный полный `CODE_SHA`.
- SVG/XML assets — `PASS` через `xmllint`; source type подтверждён inventory mapping, а не только синтаксическим тестом.

Documentation/evidence commit не меняет runtime. Его `DOC_SHA` фиксируется после commit; browser evidence корректно относится к предшествующему `CODE_SHA`.
