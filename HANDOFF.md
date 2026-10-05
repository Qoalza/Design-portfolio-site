# HANDOFF

2026-10-05. Checkout codex/cms-integration,
/Users/designer/.codex/worktrees/payload-1939/Design-portfolio-site.
Checkpoint 06bd7f7da7d5e393f26772c9b1b4e5d134d33d1a.

## Current target

Пользователь прямо исправил цель: ОНЛАЙН Payload — открыл в браузере, изменил,
применил, сайт обновился БЕЗ сборки/архива/deploy при каждой content правке.
Старый local CMS + archive publication workflow был ошибочным выбором агента.
Не продолжать его worker/deploy/UI/recovery. Plan version2.0:
docs/exec-plans/payload-site-integration.md.

## Preserve

Native custom editor, immutable materials/packages, drafts/versions, validators
и обе готовые Hero переиспользовать. Public ProjectDocument schema/design/Hero
geometry/physics/adaptives сохраняются. Портфолио desktop-only.
Личный .local/USERSPACE и old Des-art Admin logic/data не читать/не использовать.
Disposable fixtures не публиковать. Old worktrees не удалять.

## Next action

Проверить и реализовать один online Next/Payload runtime: private /admin,/api,
public renderer получает committed published records при запросе вместо build-only
documents. Native Payload publish = Apply; не новый archive/job workflow.
Не менять public pointer внутри Payload hooks (они до transaction commit).
План2.0 содержит остальной online deployment/preview/asset/backup scope.

## Evidence / access

Готовые native editor/material/preview/export проверки — в historical checkpoints.
06bd7f7 preparation API group сохранена, но obsolete. Actual HTTP new prepare
после commit завершился PREPARATION_FAILED; разбор остановлен из-за новой цели.
Собственный fixture server41741 остановлен. Root pointer
/private/tmp/payload-editor-test-root.txt; personal state/production untouched.
Прежний VPS control socket /private/tmp/art-des-vps-session-G4pLXP/connection
отсутствует (fresh read-only check). Независимая online implementation продолжается.
Browser action ранее denied auto-review: не повторять/не обходить.
Перед live запуском нужны exact code + production source + access/rollback checks;
пользователь разрешил автономную работу, вопросы только при критическом препятствии.
