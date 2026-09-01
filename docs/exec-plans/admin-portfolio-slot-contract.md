# Admin edits data, Portfolio owns visual

Status: `IN_PROGRESS`  
Started: 2026-09-01  
Branch: `codex/admin-slot-contract`  
Base: `e9aa5b9baa377c2872b56908284263b88468470b`

## Outcome

Admin изменяет только объявленные content slots. Portfolio-компоненты и общий registry владеют геометрией, фоном, точками, рамками, эффектами, clipping и responsive behavior. Неутверждённые шаблоны и несовместимые assets нельзя сохранить или опубликовать.

## Scope

- `SHARED`: schema v3, template registry, validation, v2→v3 migration и global placement rules.
- `PORTFOLIO`: code-owned catalog, home, hero, canvas и gallery templates.
- `ADMIN`: UI только для разрешённых slots, реальные preview routes, publish preflight и обратимая локальная migration.
- Canonical Boff, Corvo и Sarafan JSON, реальный локальный Sarafan draft и его assets.

## Non-scope и stop-lines

- Figma только read-only.
- Нет push, PR, merge, deploy, production mutation и публикации draft.
- Нет новых visual decisions: Corvo — baseline, Sarafan — exact Figma source.
- Protected untracked и `USERSPACE/**` не затрагиваются.
- Packaged Admin не запускается после реальной v3 migration до merge; acceptance использует workspace Admin в sandbox mode.

## Authoritative evidence

- Current source checkout: `e9aa5b9baa377c2872b56908284263b88468470b`.
- Packaged Admin managed checkout: `96cabb7f80ad3f20afd07c5d54ad245a09495142`.
- Sarafan catalog: Figma node `921:58611`, version `2393886021118029769`.
- Sarafan hero: Figma node `877:11692`, version `2393886021118029769`.
- Sarafan model: Figma node `970:71251`, version `2394166594161517629`.
- Sarafan scenarios: Figma node `969:65533`, version `2393973178870359967`.
- Sarafan setup: Figma node `978:17454`, version `2394189808985678988`.
- Shared Sarafan/Corvo canvas shell: `1000px`, background `#f5f6f7`, dots `#e3e6e8`, diameter `3px`, step `32px`.
- Model content: `888×240`, `x=56`, `y=56`.
- Scenarios content: `861×349.5`, `x=70`, `y=65`.
- Setup desktop: `603×414`, `x=68`, `y=151`; panel: `464×588`, `x=480`, `y=72`, approved shadow.

## Target contract

- `ProjectDocument.schemaVersion = 3`.
- `designProfile`: `catalog-only-v1 | corvo-v1 | sarafan-v1`.
- `homePlacement?: primary | secondary`; exactly two named homepage positions.
- `visuals.catalog`, `visuals.home`, `visuals.hero` contain only `{ templateId, assets }`.
- Section visual block: `{ type: "visual", templateId, assets }`.
- Gallery stores only `deviceId` and images; presentation belongs to `gallery.devices-v1`.
- Notice template is fixed; Admin edits content only.
- `hardBreak` is semantic; styled subheadings are `h3` only.
- v2 is accepted only by a dedicated migrator; serializer always writes v3.

Approved template IDs:

- `catalog.browser`, `catalog.corvo-stack`, `catalog.sarafan-collage`;
- `home.sarafan-radio`;
- `hero.corvo-browser`, `hero.sarafan-collage`;
- `canvas.corvo-quotes`, `canvas.corvo-process`, `canvas.corvo-controls`;
- `canvas.sarafan-model`, `canvas.sarafan-scenarios`, `canvas.sarafan-setup`;
- `gallery.devices-v1`.

## Milestones and commits

1. Baseline and durable workstream — `docs: start admin slot contract workstream`.
2. Schema v3, registry, validators and migrator — `feat: define project visual slot contract`.
3. Portfolio-owned templates and canonical migration — `feat: render approved project visual templates`.
4. Slot-only Admin and exact preview routes — `feat: constrain Admin to declared content slots`.
5. Semantic content rhythm and global placement validation — `fix: enforce project placement and content rhythm`.
6. Reversible real-draft migration — `feat: add reversible Admin v3 migration`.
7. Legacy cleanup and durable docs — `docs: close admin slot contract migration`.

Each milestone starts with a focused failing test or explicit failing check, ends with the nearest sufficient verification, and remains independently reviewable. During transition, legacy compatibility may exist only inside the migrator and is removed before completion.

## Migration and rollback

- Migrator supports `--dry-run`, `--apply`, `--rollback`.
- Backup includes draft JSON, draft-owned assets and a SHA-256 manifest; excludes secrets and live-config.
- Temporary-store proof order: backup → apply → rollback → apply.
- Real store is changed only after green temporary proof and review.
- Sarafan gallery's incompatible `3:2` image is backup-only; the active empty gallery block is removed.
- Real Sarafan draft is migrated but not published.

## Review gates

1. Architecture: ownership, typing, migration boundary, raw visual authority search.
2. User/visual: valid and invalid assets, section/gallery operations, placements, exact preview routes and before/after evidence.
3. Adversarial: full diff, data/secrets/partial failure, focused and full tests, lint, build, migrated real draft and clean branch.

Any finding returns the workstream to the relevant milestone; the affected review is repeated after the fix.

## Baseline

- `npm run lint`: green on `e9aa5b9`.
- `npm run build`: green outside filesystem sandbox; the sandbox-only Turbopack port denial is environmental.
- `node --experimental-strip-types --test`: 222/225 green. Three pre-existing stale failures are recorded before implementation:
  - `tests/local-admin-boundary.test.mjs` expects a launcher string that moved behind `ensureProductionDataBaseline`;
  - `tests/mlir4-project-availability.test.mjs` references removed `content/projects/example-project.json`;
  - `tests/project-content-contract.test.mjs` references the same removed example fixture.
- Plain `node --test` cannot load repository `.ts` modules under Node `22.16.0`; the repository-wide executable invocation therefore includes `--experimental-strip-types`.

## Definition of done

- Asset replacement cannot alter code-owned presentation.
- Invalid template/asset/placement is rejected before save and publish.
- Corvo remains visually unchanged.
- Sarafan uses five code-owned surfaces and three canvas templates without generic Frame.
- Public/Admin consumers contain no `catalogFrame`, `heroFrame`, public section `type: "frame"`, or user-authored visual properties.
- Three reviews are clean and all required tests, lint and build pass.
