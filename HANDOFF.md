# HANDOFF

Обновлено: 2026-10-06.
Checkout: codex/redesign-portfolio, /Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site.

## Checkpoint

Редизайн выпущен на https://art-des.ru/. Deployed SHA b44946021d55fb1cc8a4430c3bafd62e342714c9, PR #54 merged. Пользователь явно разрешил публикацию/деплой. Clean exact build/archive/validator и public HTTP/pages/451asset hashes/browser smoke прошли.
Previous a44efab5830a8dda5a1fd1348f644358f047672c остался в releases; до переключения создан и проверен protected backup вне rotation. Exact evidence: docs/ops/REDESIGN_ACCEPTANCE.md.
Native temporary Payload proof завершён; полноценное управление проектами через Payload ещё открыто. Старую Des-art Admin не использовать как продуктовую логику/данные; existing deploy script только инфраструктура.

Локально исправлены адаптив и входной стоппер Experience (2026-10-06); ещё не опубликовано. Evidence: design-reference/experience-scroll-2026-10-06/REPORT.md. Дополнительно восстановлена собственная плавность схемы независимо от общего native/reduced-motion режима; evidence: design-reference/experience-smoothing-2026-10-06/REPORT.md. 229 tests, lint/build и локальные browser checks прошли. Мышь ожидает пользовательской проверки. User preview: http://127.0.0.1:4193/.

Также локально исправлен боковой штрих Corvo: один CSS-паттерн с параметрами остальных блоков, без наложения SVG. Evidence: design-reference/corvo-hatch-2026-10-06/REPORT.md; 230 tests, lint/build PASS.

Выкатка локальных исправлений отменена пользователем 2026-10-06; production не менялся. Дополнительно локально исправлен общий Bg-main (#17191A), проекты и элементы 404 подключены к общей роли. На главной линия Thin у хедера только при закреплении; исходное положение и возврат наверх без линии. Browser computed checks главной/Corvo/Сараффана и 230 tests PASS.

## Next

Получить пользовательскую приёмку production перед архивированием предыдущего сайта. Продолжить группу6 active plan: удобный Payload editor на доказанном snapshot/export boundary.

## Stop-lines

Hero/geometry/scenes/adaptives не менять. Портфолио desktop-only. Личный Payload .local и USERSPACE не читать; sandbox fixtures не переносить в production. Real CMS bootstrap/migrations/credentials требуют отдельного решения. Старые источники/эксперименты не удалять; previous архивировать только после подтверждения пользователя.

## Pointers

- docs/exec-plans/redesign-production-release.md
- docs/ops/REDESIGN_ACCEPTANCE.md
- docs/ops/REDESIGN_RELEASE.md
- tools/payload-admin
