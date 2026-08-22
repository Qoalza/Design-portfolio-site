# Main chapter reconciliation v2 — evidence index

- BASE SHA: `fc89d5e641cad9eb112a6a92c8c55a8fd465ffd9`
- Goal branch: `codex/main-chapter-reconciliation-v2`
- Последний визуально проверенный code HEAD до этого evidence-commit: `99fb7b4bb9073d48bfd8d606992e42b1b7f1e16a`
- Контрольный viewport точного Figma-сравнения: `1440×900`; layout smoke: `1280×720`, `1920×1080`.
- Браузеры интерактивной матрицы: Chromium и Zen `1.21.15b` (Firefox engine).
- Итоговый production-preview и четыре совпадающих SHA фиксируются в отчёте после финальной сборки, push и обновления Draft PR.

## Visual evidence

| Блоки | Figma node | Figma reference | Реализация | Результат |
|---|---|---|---|---|
| C01–C03, H01 | `510:28120`, `510:28150`, `510:28176` | `figma/home-510-28120-1440.png` | `h01-hero-1440.png` | VERIFIED |
| H02 | `510:28183`, `73:6063`, `515:30871`, `515:30873` | `figma/home-510-28120-1440.png` | `h02-step1-chromium-1440.png`, `h02-step2-chromium-1440.png`, `h02-step3-chromium-1440.png`, `h02-step2-zen-1440.png` | VERIFIED |
| H03 | `510:28178`, `510:28179`, `510:28180`, `510:28182` | `h03-projects-figma-1440.png` | `h03-projects-1440.png` | VERIFIED |
| H04 | `510:28231` | `h04-ai-figma-1440.png` | `h04-ai-1440.png` | VERIFIED |
| H05 | `510:28260` | `h05-resume-figma-1440.png` | `h05-resume-1440.png` | VERIFIED |
| P01–P03 | `373:50236` | `figma/projects-373-50236-1440.png` | `projects-final-1440.png`, `projects-cards-final-1440.png` | VERIFIED |
| N01 | `591:33341`, `553:3314` | `figma/projects-373-50236-1440.png`, `figma/corvo-373-47103-1440.png` | `breadcrumbs-direct-1440.png` | VERIFIED |
| D01–D02 | `373:47103`, `544:2527` | `figma/corvo-373-47103-1440.png` | `corvo-top-final-1440.png` | VERIFIED |
| D03–D04 | `553:3314`, `576:33195`, `528:1540` | `figma/corvo-373-47103-1440.png` | `corvo-adaptive-final-1440.png`, `corvo-adaptive-zen-1440.png` | VERIFIED |
| D05–D06 | `373:47103`, `555:3665` | `figma/corvo-373-47103-1440.png` | `corvo-footer-final-1440.png` | VERIFIED |

## Behavioral evidence

- H02 Chromium/Zen: wheel изменяет `scrollY`, но сохраняет текущий step; стрелки дают последовательность `1 → 2 → 3`; недоступная крайняя стрелка отсутствует.
- N02 Chromium/Zen: `Home→Works`, `Home→Corvo`, `Home→Works→Corvo`, direct entry, reload, Back, Forward, logo/home reset и другой проект сохраняют trail конкретной history entry без phantom trail.
- D03 Chromium/Zen: sticky top `160 px`; состояния `О проекте`, `Задача`, `Процесс`, `Результат` следуют реальным section boundaries на всех трёх viewport.
- D04 Chromium/Zen: Full занимает viewport; Adaptive совпадает с измеренной content column (`x/width`: `240/1000`, `320/1000`, `560/1000`); transition `250 ms`; обратный переход возвращает Full.
- D06 Chromium/Zen: action bar останавливается у footer без overlap (`0 px`), border последнего блока `0 px`, горизонтальный overflow `0 px`.
- Zen machine-readable result: `zen-results.json`; `console` пуст, hydration warnings отсутствуют.
- Focused source regression tests: `tests/main-chapter-interactions.test.mjs`, `tests/navigation-trail.test.mjs` — `19/19 PASS` на code HEAD `99fb7b4bb9073d48bfd8d606992e42b1b7f1e16a`.

## Status gate

Все C/H/P/N/D блоки достигли `VERIFIED`. Перевод Goal и Q01 в `READY_FOR_USER_REVIEW` допустим только после успешных финальных lint/build, production preview из финального HEAD, push и подтверждения того же SHA в Draft PR.
