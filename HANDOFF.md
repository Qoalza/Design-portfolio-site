# HANDOFF

Обновлено: 2026-10-05.
Checkout: codex/redesign-portfolio, /Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site.

## Checkpoint

Новая Goal активна: подготовить выпуск нового сайта с доказанным до выпуска подключением существующего Payload. Полный согласованный план version 3.1 в docs/exec-plans/redesign-production-release.md заменяет прежний Admin-first план. Target CMS — Payload. Пользователь прямо отменил правила/логику Des-art Admin для Payload; технические решения нового lifecycle исполнитель выбирает сам в рамках scope.
Визуальный/content baseline: 258e95b2a7720499c7a74ec7602c8608b8c58200; desktop-only и исправленный fade сохранены. Hero/сцены не изменять.
Группа 1 реализована: optional Shared redesign контракт, neutral export exact approved Git материалов и validated portable snapshot. Public renderer использует validated snapshot; настоящий Payload proof завершён. Новый production кандидат ещё не готов. Предыдущие полезные публичные checkpoints сохраняются в codex/redesign-admin-integration; незавершённые old Admin файлы не тронуты.

## Следующее действие

Группы 1–2 завершены: native Payload save/reopen/export и тот же renderer; native tests/typecheck/lint/build и real proof прошли. Два review с fixes. Группа 3 реализована: root Next host/Vite release entry/approved resources/meta/routes/packaging со stamp completed build. Scratch build, root lint, Vite222/222 и focused guards прошли, два review с fixes. Exact 6252950 build/archive/unpack/validator/HTTP451 ресурсов прошли. Desktop threshold/fade, anchor, scenes, carousel и404 частично проверены. Fault QA выявила stuck font retry; исправление и browser recovery прошли (Vite224 tests). Новый a514243 build/package/assets451 и большинство edge QA прошли. Обнаружен reserved Next /404: исправлен beforeFiles rewrite, реальный HTTP guard подтверждает red→green. f28c461 clean exact build/package/unpack/HTTP451assets/browser404 прошли; локальная приёмка записана в docs/ops/REDESIGN_ACCEPTANCE.md. Следующая группа только evidence/docs: пересобрать её exactHEAD и показать кандидат; затем SSH server/backup preflight. SSH metadata не получена. Автономное выполнение до готовой сборки разрешено; production gates сохраняются.

## Stop-lines

Нет разрешения на push/exact merge/upload/deploy, Figma write, real data migration/bootstrap, credentials или cleanup. Личный Payload .local и USERSPACE не читать; sandbox не переносить в Git/canonical/production. Старый production архивировать только после подтверждения пользователя нового production.

## Pointers

- docs/exec-plans/redesign-production-release.md
- docs/shared/PROJECT_CONTENT.md
- docs/exec-plans/redesign-portfolio-variant-registry.md
- design-reference/desktop-only-2026-10-04/ACCEPTANCE.md
- docs/requirements/admin-image-quality.md
- tools/payload-admin — tracked foundation перенесён из d21f7a3; личные stores отсутствуют.

- docs/ops/REDESIGN_RELEASE.md

- docs/ops/REDESIGN_ACCEPTANCE.md — текущая таблица приёмки и открытые условия выпуска.
