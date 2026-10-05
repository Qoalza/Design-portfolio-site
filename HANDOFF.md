# HANDOFF

2026-10-05. Checkout codex/cms-integration,
/Users/designer/.codex/worktrees/payload-1939/Design-portfolio-site.
Code checkpoint: verified offline production-baseline bootstrap; commit history supplies exact SHA.

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

## Current implementation / next action

Единый Next/Payload содержит public catchall + committed published DTO reader,
escaped runtime JSON для прежнего renderer и dynamic metadata/routes/sitemap.
Native Publish → actual public HTML/title/data без изменения compiled JS/BUILD_ID
проверено через HTTP для обоих templates; черновики private. Full native tests,
typecheck/lint/build, root runtime tests, renderer lint/build PASS; two reviews.
Obsolete archive publication APIs/worker/helpers removed; old endpoints404.
Pure code release tooling сохранено. Hero/design implementation не менялись.

Published assets теперь читаются только из committed native bindings, с проверкой
bytes/closure/dimensions. BeforeChange отвергает неполный publish до commit;
incomplete draft разрешён. Static shell выдаётся без DB read; stale bundled
project resources не являются fallback. HTTP upload → private draft → native
publish → public exact image/HEAD/ETag, полный asset closure и сохранность сайта
при rejected publish PASS; BUILD_ID unchanged, fixture restored. Slug alias PASS.
Native full suite, typecheck/lint/build, renderer build, root host tests PASS.
Две последовательные selfreviews: completeness и regression/access/risk; без
изменения Hero. Тестовый HTTP server остановлен.
Private preview теперь использует prebuilt shell: runtime DTO/assets saved draft,
expiring read-only capability, CSP sandbox, no-store; никаких child compilation
processes в content path. Compiling scripts используются только при code build.
Actual HTTP обеих templates + new draft title + rejected incomplete preview with
previous successful own slug frame PASS; public DTO/BUILD_ID/shell digest unchanged.
Native full suite, types/lint/build PASS. Два selfreview выполнены; race capacity
после async shell load и fallback slug устранены до финального HTTP check.
Explicit development/fixture/server settings теперь едины для native config,
readers, hooks и maintenance. Online root вне code/public, approved HTTPS origin,
secure same-site cookies, Origin/Host checks, closed first-register. Test runner
принудительно isolated fixture; staging migrations не наследуют server data root.
Actual online-mode HTTP: cookie login, draft/private published apply/preview,
foreign-origin403, anonymous403 PASS. Verified backup/restore + restart PASS.
Full native suite/types/lint/build, root host/config tests PASS. SVG sandbox gap
найден вторым selfreview и исправлен RED→GREEN; Hero не менялись.
Next OPS требует fresh VPS preflight: root BatchMode SSH отклонён, agent identities
нет, control socket отсутствует; app terminal подтверждает closed session.
Private initial content bootstrap реализован и проверен только на свежей временной
SQLite: два проекта/163 ресурса, exact DTO/bytes parity, owned offline lock и
empty content/history/physical uploads; wrong identity/orphan/retry rejected.
Source verifier принимает externally verified deployed SHA/snapshot digest,
clean approved provenance и exact asset bytes. Actual production source bootstrap,
initial owner/Linux packaging/service+proxy activation пока НЕ готовы.
Не заменять этот отсутствующий этап loopback fixture evidence. README/PAYLOAD.md
теперь описывают фактический online contract и ещё не выполненный VPS этап. Local sandbox не является online release.
Не новый Apply/deploy job: используется штатная native publication.

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

SSH reconnect prepared: /private/tmp/art-des-payload-vps-2e4mn657/connection;
pointer /private/tmp/art-des-payload-control-path.txt. Requires user password
login in app terminal with PubkeyAuthentication=no, PreferredAuthentications=password,
ControlPersist=12h. No new authorization requested: missing authentication only.
Own test servers stopped; fixture server lock released. Code group verification includes full native suite/types/lint/build; exact checkpoint via Git.
Current compiled scratch build is not a Linux exact-HEAD production artifact;
next Linux build must use the final clean candidate after fresh VPS preflight.

Fresh public HTTPS preflight: / and both cases200, /projects307 → /#projects,
unknown route404, deployed build SHA b44946021d55fb1cc8a4430c3bafd62e342714c9.
Public HTML lacks snapshot digest; obtain it with server read-only preflight.
GitHub CLI auth token invalid: Linux CI alternative unavailable. Root SSH control
socket still absent. Existing server access request is the critical dependency;
no production changes, no claim online CMS installation complete.

## Live continuation checkpoint — administrative access restored

Root control socket /private/tmp/art-des-payload-vps-2e4mn657/connection works
with sandbox escalation. Current private Linux checkout is
/opt/art-des-payload/releases/0882f797276de8ad8ba10dd4f4ae500faffcb5a5.
Live systemd build job art-des-payload-build-0882f79: Linux full suite, types/lint
passed; Next build still live. Generated payload-types description comments were
stale and tests regenerated them: current scratch candidate MUST NOT be activated.
Final clean code commit05abd7c1375eb9c731ee8c041d927eed225141d9 fixes only comments.
Exact small delta uploaded to /var/tmp/payload-final-code-delta.pack; after original
job becomes terminal, rename checkout to final SHA, unpack delta as portfolio,
checkout final SHA, then run /var/tmp/art-des-payload-final-build.sh via systemd.
Do not move/change code while current build job is live. No npm reinstall needed.
Source bare archive had generated AppleDouble metadata: removed only own .git
metadata and ._source.git before build. Source only, no local data uploaded.

Actual VPS production baseline parity reader PASS: both projects/all163 assets,
source b44946021d55fb1cc8a4430c3bafd62e342714c9; reconstructed verified content
hash23d7de746136d591ce350f60c1bd241bce35836d4b710b32fe9d9e2f2ebf29c2.
Old deployed manifest lacks snapshot; legacy reader verifies exact approved Git
provenance and production bytes before bootstrap. Current old public service still
active127.0.0.1:3000 and proxy unchanged. Private backup of actual runtime/config
/var/backups/art-des/pre-payload-0882f79 (runtime40MB, old SHA receipt).
Future proxy /var/tmp/art-des-payload-nginx.conf points3001, upload25m/timeout120s;
full candidate nginx configuration syntax test PASS, not yet applied.
Permanent container /var/lib/art-des-payload created private portfolio0700;
initial-owner.json private0600 created, never print/read credentials into chat/logs.
No actual schema/owner/content bootstrap yet. /var/tmp/art-des-payload.service and
/var/tmp/art-des-payload-initial-bootstrap.mts already updated to final05abd7c path;
not installed/run. Bootstrap only actual verified production content; initial
credential file is read privately on server. Next fresh schema → initial bootstrap
→ closed3001 runtime + native auth/assets/public/preview → backup/restart/review →
proxy activation with quick old3000 rollback → actual HTTPS checks. Browser gate
still unverified; do not bypass prior denied action.

Measured RAM pressure during Next build:1core/2GB RAM, original512MB swap fully
used. Requested temporary private2GB /var/lib/art-des-payload-build.swap (no fstab);
verify swapon success/current memory before more jobs. Remove only after build and
runtime verification if safe swapoff is possible. Do not claim Linux build ready.
