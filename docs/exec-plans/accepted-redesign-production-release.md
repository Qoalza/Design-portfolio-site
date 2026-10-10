# Принятые правки Concept V2: production code release

Status: Complete. 2026-10-11. OPS / PORTFOLIO / ADMIN / SHARED; FULL, HIGH.

## Результат и baseline

Выпустить принятые пользователем layout, controls и runtime правки Redesign df033cfde0ce0b251c6b2257b6cf252c82c73bfb и совместимость независимых описаний Shared4083c13 и Payload editor32423cf на существующий раздельный production runtime. Отдельный OPS checkout codex/portfolio-production-only; Redesign source остаётся неизменным; Payload получает только ту же Shared delivery compatibility fix, отдельно от сайта.

Fresh production read-only preflight: source e804c00ae4e8b59750a1311f95c0f6b7dceb927d, Portfolio3101 / CMS3102, fixed controller /etc/art-des-separated/controller.json. Portfolio artifact440372b1e07d3efb501ad8485f11713524dc6dd1a74dcb84b5386243c24c045c; CMS artifactdd795228cfde33183c3155538a493e4cca520be70512b1151e0a1c18c5b08e1d. Unchanged CMS schema6c4a98e232cb7b33f46ad2a79bc7c7efbf2e8a035dc44cece1ac996f0d1ac44a. Published content e1da1ae14abcda784c20ad143e7dd16d85bb721d70a8637869c6fc52f60e4d49, activationSeq0. Legacy static/current and combined Payload are not active targets.

## Scope / preserve

Approved home/project layout, text-button breadcrumbs, title colors, About alignment/NBSP, Experience exit, project/header/scenario sizing, native first-HTML preloader with original minimum/retry/copy/morph. Shared compatibility separates card description from page.summary; Payload editor gets independent fields with existing one-time legacy-copy adapter. Integrate actual independent public+preview compiler, preserving its content-independent source, required DTO injection, scoped AVIF mapping, capabilities and code controller. No new dependencies.

No main merge/push, Figma write, OS/proxy/ports/ownership changes, account/session/secret configuration, schema migration, initial projection/bootstrap, unapproved draft publication, unapproved native DB changes or copying sandbox/canonical content into production. Live content stays the source of truth; local exporter copy is not permission to replace live data. Previously accepted browser evidence limitation remains explicit: tools refused local browser selection; no alternate surface/raw CDP workaround.

## Stages

1. OPS candidate → integrate approved source against current architecture → no production runtime regression → inspect source diff and focused tests. Required online injection and current scoped asset paths are preserved.
2. Published generation → read-only public content/asset baseline → prove compatibility and unchanged content identity → validate current generation with new contract and record hashes without private DB reads.
3. Exact candidate → focused/shared/authoring/public+preview/controller tests, lint/types, independent public+preview build and code-only Portfolio package; separate Linux22/x64/glibc Payload build/package → clean immutable artifacts bound to exact HEAD → verify manifests/schema/content-independent package boundaries.
4. Concrete artifact/release intents → two bounded sequential reviews (fidelity/completeness, then regression/scope/risk) → reconcile findings → verify source/archive identities and rollout/rollback limits. Fresh reviewer required by doubt-driven-review skill.
5. Exact production target → satisfy existing upload/activation exact approval rule after preparation → fixed code controller: Portfolio first, then independently packaged compatible Payload → actual PID-correlated health/source identities. Persist unique intents and retry same bytes after uncertain outcomes. Retain old code; no content/DB restore.
6. HTTPS and loopback → verify home/project/routes/assets/early HTML/TextButton and private guards, code identities, unchanged generation/schema → accepted edits live with native data preserved → save safe release evidence and current HANDOFF.

## Stop-lines / residuals

Stop before live mutation on changed production baseline, dirty/unknown release inputs, failing checks, target/schema/capability incompatibility, unexpected data migration, unconfirmed exact upload/activation gate or inability to obtain eligible Linux artifacts. User explicitly reconfirmed both separate releases: Portfolio source in OPS integration from e804c00, Payload source in existing Payload worktree. Docker is used only for native Linux CMS package, with fresh Git source and lockfile-installed dependencies in an isolated volume. Public artifact is architecture-neutral Node code. No build on active VPS or resource/config changes. Any required production content edit needs its own concrete user authorization. Rollback is a new controller intent to retained compatible code; never restore content/DB from a code receipt.

## Acceptance

Exact candidate clean Git HEAD and verified Portfolio and separate Payload artifacts. Both Shared readers preserve legacy intro once without changing immutable generation identity; updated Payload editor edits card/page fields independently. Early preloader exists in initial public+preview HTML before external application modules. Active production process build IDs match released packages. During both code-only activations public generation bytes/contentId/assets and native tables/schema remain unchanged, and CMS supervisor retains ownership during writer reload. The separately approved Corvo card text publication afterward may create a new generation through native hooks/coordinator; all unrelated projects/assets/auth/schema must remain unchanged. A failed controller response is reconciled using the original intent, never blind restart/selection. Missing actual browser coverage is reported rather than labeled PASS.

## Completed outcome — 2026-10-11

All stages complete. Code sources Portfolio856b1f3615bc74366745bfe19c5a982303872265 and CMS3c72c0a642359295d0a602080b4e3b99640c2ddd are independently live and identity-verified. User also approved shorter Corvo home description/full independent project intro and autonomous execution of the full release. This scoped content step used the existing native coordinator, refused unrelated drafts, retained protected backup/journal and delivered operation1d2a510d-0159-4c10-8366-b5ed99eef87a. New active content b158f7017c45d2c9e67f0d905c725e0138c2cff2782c37f09bbed45cdea6fb4c; all163 assets, other project, auth and schema preserved. No sandbox source or auth changes.

Final HTTPS routes/private guards/initial HTML/DTO PASS; 451 post-code resources and163 new-generation assets byte-perfect; published+draft native previews PASS; final native/schema/backup audit PASS. Both services healthy. Exact evidence, rollback compatibility limits, auxiliary source-hash gap and explicit browser/Docker limitations: design-reference/accepted-redesign-production-20261011/REPORT.md. No runtime changes after exact packaged SHAs; closing documentation commits do not claim another deployed build.
