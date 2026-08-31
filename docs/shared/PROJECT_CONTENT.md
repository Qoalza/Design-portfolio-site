# Shared Project Content Contract

## Назначение

Короткая карта границы Admin↔Portfolio. Полная исполняемая schema не дублируется здесь.

## Sources of truth

- Schema/version/types/validation: `src/lib/project-contract.ts`.
- Canonical published documents: `content/projects/*.json`.
- Portfolio read/preview overlay behavior: `src/lib/projects.ts`.
- Admin draft/compiler: `tools/des-art-admin/draft-contract.mjs` и `core.mjs`.
- Publish pipeline: `tools/des-art-admin/publish-worker.mjs`.
- Contract checks: `tests/project-content-contract.test.mjs`, `tests/project-storage.test.mjs`, relevant `tests/local-admin-*.test.mjs`.

Если этот Markdown конфликтует с executable schema/current tests, сначала проверить exact HEAD и причину; не менять data автоматически.

## Ownership

- `content/projects/*.json` — canonical published content, tracked in Git.
- `public/assets/projects/<slug>/` — canonical published project assets.
- Admin drafts, preview overlays, draft assets, jobs и snapshots — local state вне canonical worktree, если специально не создаётся isolated test store.
- Admin-only metadata удаляется compiler до public validation/publish.
- Portfolio не читает raw Admin draft без explicit preview environment.

Все проекты, включая исторически первый Corvo, используют этот общий current contract. Старые project-specific briefs в `docs/archive/**` не являются current source of truth.

## Lifecycle

```text
canonical JSON/assets
  → Admin draft overlay
  → strict compile to ProjectDocument
  → isolated preview overlay
  → sandbox snapshot OR live publish worktree
  → checks
  → PR/merge exact SHA
  → atomic production release
```

## Project vs global publish scope

- Project scope публикует content/assets выбранного проекта.
- Global catalog/home placement (`catalogOrder`, `featuredOnHome`, `homeOrder`) остаётся canonical при project-only publish и меняется только общей публикацией.
- Live publish всегда начинает с fresh `origin/main` в disposable worktree.

## Compatibility

- Текущая schema version определяется `PROJECT_DOCUMENT_VERSION` в code.
- Unknown fields и invalid state combinations отклоняются validator.
- Изменение version/fields/ownership/serialization требует `[SHARED]`, explicit acceptance criteria, migration/backward-compatibility decision и contract tests обеих сторон.
- Legacy managed Frame composition не мигрируется автоматически без отдельного approved contract.

## Preview isolation

- Preview компилирует valid draft в отдельный overlay.
- Draft assets переписываются на env-gated preview route только в Admin preview.
- Preview не перезаписывает canonical JSON/assets.
- Каждый preview использует отдельный Next build directory/port contract.

## Figma Frame snapshot

- Figma импорт read-only и local.
- Root Frame остаётся responsive container.
- Immediate visible children сохраняются отдельными local raster units с root-level geometry/constraints/effects.
- Temporary Figma download URLs не являются production source.
- Snapshot replacement atomic; failure сохраняет last-good snapshot.

Подробный Admin contract: `tools/des-art-admin/SPEC.md`.

## Change gate

Остановить dependent implementation и запросить решение при unplanned change:

- schema/version;
- canonical source/ownership;
- Admin-only vs public field boundary;
- project/global publish scope;
- asset path/ownership;
- preview/public parity;
- migration/backward compatibility;
- live publish semantics.
