# Выпуск исправлений портфолио с сохранением Payload

Status: Complete. 2026-10-06. PORTFOLIO + OPS; MEDIUM/HIGH/FULL. Worktree codex/redesign-portfolio, единственный writer. Пользователь явно разрешил интеграцию и production publish первым вариантом; token budget отсутствует.

## Outcome и baseline

Public production и /admin обслуживает art-des-payload.service, exact c61d0609ec09438958526ca7b8c55238de218c03, /opt/art-des-payload/releases/<SHA>/tools/payload-admin, loopback3001. Nginx proxy3001 и постоянные /var/lib/art-des-payload/data остаются. Наш source9ca9cc0: compact Experience/stopper/reentry; собственное Lenis lerp.1, multiplier1, smoothWheel; единый Corvo hatch; Bg-main#17191A; домашний header Thin только pinned. Дополнение пользователя: вернуть custom404 для прямого /404 через beforeFiles rewrite в Payload Next config; HTTP404/noindex и renderer обязаны совпадать с неизвестным адресом. Preserve CMS schema/storage/secret/assets/content/access и все Hero scenes/Experience geometry/travel.

## Последовательность

1. Exact deployed code → объединить с исправлениями в текущем worktree → runtime совместим с production → сравнить diff с c61: CMS/shared/schema без изменений; tests/lint/typecheck, два review fidelity и regression/data boundaries.
2. Clean committed source → archive только Git files без USERSPACE, private state и node_modules → новая Linux release directory → hash/source SHA, Linux native deps, fixture-only build и schema-free verification. Не использовать actual data/secret для build. Старый release остаётся неизменным.
3. Текущий systemd unit → backup и изменить только WorkingDirectory на новый exact release → restart → readiness3001/publicSHA/adminlogin/private APIs/public DTO/assets parity. До stop зафиксировать hashed публичный DTO/assets baseline. При failure восстановить точный старый unit и restart. Не мигрировать/восстанавливать DB. Краткая недоступность при restart допустима, обновление данных не требуется.
4. Runtime → actual HTTPS + browser главная/проекты/404/цвет/header/Experience/hatch → подтверждённый доставленный результат → safe evidence и checkpoint, документация текущего code release отдельно от native content Publish.

## Acceptance

Все пять согласованных правок доставлены; текущий publicSHA = новый sourceSHA. Public projects DTO/asset bytes не меняются, /admin доступна, private APIs остаются закрыты. Native current schema требует того же contract. Previews используют пересобранный renderer; без чтения credential/sandbox/private files. Source/backup/receipt traceable. Старый working release/unit сохранён.

## Stop-lines

Source/public identity меняется при подготовке; непонятный writer или dirty ownership; schema/db migration; потребуется Nginx/port/access/secret/data change; broken tests/build; actual health или DTO parity fails. Новый scope не включать. GitHub main сейчас static baseline; не выпускать весь main/static архив поверх CMS. Exact source хранить в согласованной ветке редизайна; соседнюю ветку не менять. После deploy отдельно фиксировать docs: будущий Admin redesign/deploy split не входит.

## Progress

- Discovery PASS: exact public c61d060 и unit/proxy3001 подтверждены read-only.
- Integration ongoing; source merge clean except checkpoint.

- Integration213a681 PASS: 230 UI tests, root/CMS lint, CMS typecheck/native fixture tests; два review PASS. Initial Linux clone пропустил approved-source ref, исправлено explicit read-only fetch source-reference; production не менялся. Новый запрос restore404 разрешил единственное code отличие CMS host config (rewrite), schema/editor без изменений.

Final published SHA: c735f3151a297eccb2885e69c0a215143c2dfe2f. All release/build/public/Admin/parity checks PASS. Evidence: design-reference/payload-portfolio-fixes-2026-10-06/REPORT.md. Temporary resources cleaned, previous unit/release retained.
