# Shared Project Content Contract

## Sources of truth

- Schema v3, types, validation and serializer: `src/lib/project-contract.ts`.
- Approved visual templates and asset/placement policies: `src/lib/project-visual-registry.ts`.
- Canonical published documents: `content/projects/*.json`.
- Portfolio read and preview overlay: `src/lib/projects.ts`.
- Admin compiler/store: `tools/des-art-admin/draft-contract.mjs` and `core.mjs`.
- Legacy migration only: `tools/des-art-admin/project-v2-migration.ts` and `migrate-v3.mjs`.

Executable code and current contract tests take precedence over this map.

## Ownership

- Для карточки и hero пользователь передаёт целый Figma Frame: пользовательский фон, произвольное число растровых элементов, constraints и тени. Importer сохраняет проверенный raster snapshot каждого элемента и переносит responsive constraints и поддержанные тени в публичную композицию.
- Для визуальных блоков секций Portfolio по-прежнему владеет геометрией через registry и named slots.
- `ProjectVisualInstance` contains only `templateId` and named image assets.
- `content/projects/*.json` and `public/assets/projects/<slug>/` are canonical published sources tracked in Git.
- Admin drafts/assets/preview/jobs/snapshots/backups are local state outside the canonical worktree.
- Admin-only metadata is removed before public validation and serialization.
- До первого live bootstrap действует односторонняя граница: **`production → новая local Admin`; sandbox не попадает в Git, canonical source или production во время bootstrap.** По отдельному выбору sandbox project-authoring state может стать local live drafts поверх exact production; bootstrap их не публикует. После marker v5 обычная отдельная live-публикация остаётся единственным путём этих drafts в Portfolio.
- Existing `production-live` marker v4 — не bootstrap: после подтверждения current deployed SHA он повышается только до v5 `legacy-live`, сохраняя active local store без archive, transfer или sandbox fallback.

## Schema v3

- `designProfile`: `catalog-only-v1 | corvo-v1 | sarafan-v1`.
- `homePlacement?: primary | secondary`; there are exactly two named homepage positions.
- `visuals.catalog`, optional `visuals.home` and `visuals.hero` are approved templates with named assets.
- Optional `catalogFrame` and `heroFrame` are whole adaptive Frame compositions and take precedence over the corresponding template surface.
- Section visual block is `{ type: "visual", templateId, assets }`.
- Gallery stores only `templateId: "gallery.devices-v1"`, `deviceId` and images.
- Notice stores fixed template and editable text only.
- `hardBreak` is semantic; styled rich-text subheading is `h3` only.
- v3 may contain Frame composition geometry, root fill, raster assets, constraints and supported CSS shadows for `catalogFrame` and `heroFrame`.

New projects start with `catalog-only-v1`. Profile/template changes are code changes, not Admin choices.

## Validation and lifecycle

```text
canonical v3 JSON/assets
  → one approved Figma Frame or gallery/logo file input
  → local Admin draft and hidden named-slot assets
  → strict compile + collection preflight
  → merged isolated preview overlay
  → local sandbox snapshot
```

- Serializer always writes v3; public runtime rejects schema v2 and validates optional Frame compositions fail-closed.
- Asset policy validates allowed operations, MIME, count and at least `2×` logical size. Code-owned composition slots keep an exact ratio within `0.1%`. Gallery captions retain the reference dimensions (Desktop `1480–2960 × 1024–2048 px`, Tablet `800–1600 × 1132–2266 px`, Mobile `360–1080 × 640–1920 px`), but gallery sources have no upper width/height limit: they remain limited to 20 MB and 40 MP. The first gallery image fixes the device-pool proportion within `0.1%`, not its exact dimensions. Portfolio owns fixed device widths and derives each frame height from that first proportion, so every accepted source fills its frame without internal fields or crop.
- Card and hero Frame surfaces can be replaced only through the read-only Figma importer; the generic upload endpoint remains unavailable for them. Section visual surfaces keep the approved template importer.
- Collection policy validates unique/order-compatible catalog positions and named homepage placements.
- Project-only publish keeps global `catalogOrder` and `homePlacement` canonical.
- Preview validates partial drafts only after merging them with the canonical collection.
- Перед code merge/release read-only provenance verifier сравнивает exact base/target Git refs; недоказанный sandbox-derived материал является stop-line. Пользовательский live publish worker после отдельного нажатия «Опубликовать» выполняет свой PR/merge/deploy workflow.

## Compatibility and migration

- v2 is readable only through dedicated migration code.
- Existing template visuals remain backward-compatible fallback; newly imported card/hero Frames render through the validated adaptive Frame renderer.
- Real-store migration is dry-run first, then backup with SHA-256 manifest, atomic apply, and supported rollback.
- Secrets, Keychain data and live config never enter migration backups.
- Figma source URL, adapter id and scaled source preview may exist in `admin.visualSources`; `compileAdminDraft` removes all `admin` metadata. Public `catalogFrame`/`heroFrame` retains only the validated local composition needed by Portfolio.

Any new schema/version/ownership/serialization/placement or migration behavior remains a `SHARED` contract change with tests for both Admin and Portfolio.
