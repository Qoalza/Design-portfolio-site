# Выпуск Hero и прокрутки Portfolio

Статус: подготовка релиза,2026-10-20. OPS+PORTFOLIO / MEDIUM / HIGH / FULL. Единственный writer: текущий чат в portfolio-production-release, codex/portfolio-production-only. Пользователь прямо разрешил main+production и включил Lenis; физическая работа мыши подтверждена пользователем.

Результат: main и production содержат принятый Hero/Dribbble200ms со случайной точкой появления и возвратом к ней, исправления классификации колеса и передачи управления Lenis, текущую ширину верхнего поля точек1216px. Нижнее поле не возвращать. Источник пользовательских правок: redesign9473066; переносится только дельта app от df033cf, сохраняя production-only optional-logo guard.

Baseline: origin/main b449460, предок OPS100c5d6; независимый public source856b1f3615bc74366745bfe19c5a982303872265 / artifact14e16eade49b396f891abfde62e9c8a1817f19f14e69630267699e61ac76d2a0. Live controller confirmed=selected epoch1. CMS source3c72c0a642359295d0a602080b4e3b99640c2ddd, epoch2, supervisor76541/writer76604. Content b158f7017c45d2c9e67f0d905c725e0138c2cff2782c37f09bbed45cdea6fb4c /seq1. Private health подтверждён read-only. Старая main отстаёт от ранее выпущенной OPS-линии; fast-forward сохраняет уже принятую архитектуру.

1. OPS candidate → перенести ограниченную app-дельту и проверить → исходный production adapter/Shared/CMS/data сохраняются → app263 tests, lint, focused public/runtime/controller/preview checks; последовательные reviews fidelity/completeness и regression/scope/risk.
2. Чистый exact commit → independent public+preview build/package → content-independent artifact с тремя новыми SVG,200ms и Lenis → manifest verification, локальная fixture/HTTP проверка; никаких CMS/Linux/Docker сборок и private build inputs.
3. main+production → fast-forward push exact candidate, upload immutable artifact, сверить fresh expected slot и применить уникальный controller intent → перезапуск только Portfolio → private healthy identity/epoch, неизменные CMS PID/build/schema и contentId/seq, public routes/DTO/assets и скрытая визуальная проверка Hero.
4. Сохранить результаты и фактические identity в evidence/HANDOFF. Сохранить прежний immutable artifact и intent/receipt. Отдельные документационные коммиты не являются новой runtime identity.

Границы: нет Figma write, CMS release/migration/publish, draft/canonical content изменений, settings/proxy/OS/dependencies. Трекпад сохраняет native ordinary policy; protected Experience/reduced-motion guards проверяются тестами. Temporary diagnostics остаются DEV-only. Не включать sandbox в Git или архив.

Стоп: remote main меняется несовместимо, controller pending/unknown state, content несовместим с кандидатом, build/package/check failure или unexpected data drift. До переключения production остаётся прежним. При failed health — существующий controller abort с новым ID, прежним совместимым descriptor и ссылкой на failed operation; не восстанавливать БД/content. Не удалять retained releases, private state или чужие файлы.
