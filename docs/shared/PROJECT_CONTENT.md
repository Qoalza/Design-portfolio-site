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

- Portfolio owns every visual rule: geometry, background, dot pattern, border, radius, shadow, clipping, device chrome and responsive behavior.
- Admin owns only editable content values declared by the registry. Для сложных поверхностей пользователь передаёт один утверждённый Figma Frame; importer заполняет named slots внутри локальной границы, не передавая layout authority в документ.
- `ProjectVisualInstance` contains only `templateId` and named image assets.
- `content/projects/*.json` and `public/assets/projects/<slug>/` are canonical published sources tracked in Git.
- Admin drafts/assets/preview/jobs/snapshots/backups are local state outside the canonical worktree.
- Admin-only metadata is removed before public validation and serialization.

## Schema v3

- `designProfile`: `catalog-only-v1 | corvo-v1 | sarafan-v1`.
- `homePlacement?: primary | secondary`; there are exactly two named homepage positions.
- `visuals.catalog`, optional `visuals.home` and `visuals.hero` are approved templates with named assets.
- Section visual block is `{ type: "visual", templateId, assets }`.
- Gallery stores only `templateId: "gallery.devices-v1"`, `deviceId` and images.
- Notice stores fixed template and editable text only.
- `hardBreak` is semantic; styled rich-text subheading is `h3` only.
- v3 contains no Frame composition, coordinates, dimensions, colors, effects or other user-authored layout authority.

New projects start with `catalog-only-v1`. Profile/template changes are code changes, not Admin choices.

## Validation and lifecycle

```text
canonical v3 JSON/assets
  → one approved Figma Frame or gallery/logo file input
  → local Admin draft and hidden named-slot assets
  → strict compile + collection preflight
  → merged isolated preview overlay
  → sandbox snapshot OR separately authorised live workflow
```

- Serializer always writes v3; public runtime rejects schema v2 and legacy Frame.
- Asset policy validates allowed operations, MIME, count and at least `2×` logical size. Code-owned composition slots keep an exact ratio within `0.1%`; gallery device slots accept an orientation-safe ratio range and contain the source inside the fixed device frame.
- Card, hero and section visual surfaces cannot be changed through the generic upload endpoint; only the approved read-only Figma importer can replace them as a whole.
- Collection policy validates unique/order-compatible catalog positions and named homepage placements.
- Project-only publish keeps global `catalogOrder` and `homePlacement` canonical.
- Preview validates partial drafts only after merging them with the canonical collection.

## Compatibility and migration

- v2 is readable only through dedicated migration code.
- Legacy Frame never receives implicit generic rendering; it needs an explicit approved-template mapping.
- Real-store migration is dry-run first, then backup with SHA-256 manifest, atomic apply, and supported rollback.
- Secrets, Keychain data and live config never enter migration backups.
- Figma source URL, `templateId` and scaled source preview may exist in `admin.visualSources`; `compileAdminDraft` removes all `admin` metadata before public validation and serialization. Preview confirms the imported whole Frame in Admin but never becomes public layout authority.

Any new schema/version/ownership/serialization/placement or migration behavior remains a `SHARED` contract change with tests for both Admin and Portfolio.
