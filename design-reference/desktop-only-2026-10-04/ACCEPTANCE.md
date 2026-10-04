# Desktop-only portfolio checkpoint

Status: READY_FOR_REVIEW. Source baseline: e40f0b58eaff65dc6b5e479e10bbe37a486ec5f5 плюс изменения текущей Git-группы.
Полный src fingerprint SHA256 (sorted relative path + NUL + bytes + NUL): f20fb4e9a2642cd8f5d08633087a9ac29ae5a679b04c12aa1f377e601ded6067.

## Граница и происхождение

Неутверждённая адаптация находилась в responsive.css (история от 34828e6/a5a90ac), width-query слоях style.css/lens.css, MobileNavigation, мобильных копиях AI/фактов и width-switch Experience. Удалены эти ветви. Desktop CSS groups доступны при любом viewport; body и pinned header сохраняют canvas минимум 1280px. Desktop-only исключает разработку/приёмку mobile/tablet портфолио.

Сохранены width-query 1330px для существующего desktop header, desktop compact About viewer при 1439px/959px, height-based Experience и reduced-motion/pointer safety. Preview-only navigation-lab/preloader-preview не менялись. Правила project-hero, project-page, responsive-scenes и hero-layout.mjs побайтно совпадают с baseline по Git diff.

## Проверки окончательного состояния

- 208/208 Node tests; исходный desktop-only guard до правки падал на responsive.css, после правки проходит. Старые требования mobile UI заменены пользовательским desktop-only контрактом; desktop/Corvo tests сохранены.
- lint: 93 source files, success.
- Vite production build: success; index-BijAlmp9.js / index-DvTuV57r.css. Осталось существующее предупреждение о bundle >500kB; полный публичный host/release проверяется отдельными этапами 4–5.
- Browser: сравнение 27 основных блоков до/после при 1920×1080 и 2751×1500 — ноль различий в width/height/display/padding/gap/background.
- Threshold: 2312×1300 small; 2313×1299 small; 2313×1300 large. Совместный порог не изменён.
- Narrow 900×1080: canvas min1280, две колонки Projects, About видим, desktop AI grid, Experience sticky, mobile menu отсутствует. Это проверка отсутствия адаптивной подмены, не mobile приёмка.
- Fade large: RGB 22/25/26 во всех непрозрачных цветовых stop; opacity/геометрия прежние.
- Browser nav: «Мои работы» → Projects и pinned header; brand → scrollY0, обычный header. Experience вход на верхней границе и движение progress 0 → 0.245 подтверждены. Полная матрица reentry/reset остаётся этапом 5.
- Browser console error/warn: отсутствуют на проверенной главной.
- git diff --check: success.

## Последовательные review

1. Completeness/fidelity: сравнение scope и diff; найдены остаточные mobile width правила lens.css, удалены, добавлен guard. Desktop source mapping опирается на ранее утверждённые component contracts и current runtime; новых визуальных решений нет.
2. Regression/scope/risk после исправления: tests/lint/build повторены; browser размеры/порог/навигация проверены. Project Hero/scenes, Admin/Shared/production и реальные данные не затронуты. Открытых находок этой группы нет; пользовательская приёмка pending.

Screenshot: /Users/designer/.codex/visualizations/2026/10/04/01a106f3-b66f-7d80-b904-1476c409617d/desktop-only-1920.png.
