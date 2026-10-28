# HANDOFF
2026-10-28. Release worktree portfolio-production-release, branch codex/portfolio-desktop-release-v1. Goal active; user approved main + production under docs/exec-plans/portfolio-desktop-production-release.md.

Selected desktop code prepared from integration f536e2a on production baseline cee5756. App 315 tests/lint, focused public runtime 15 tests, unpacked artifact check passed. Two sequential fresh reviewer gates found no actionable issues. Hidden browser checked home/carousel, Corvo, Sarafan, Boff/Lottie/process hover. Local download/evaluation/startup/slow faults each generated a real query attempt and recovered without document reload. Evidence: docs/portfolio/DESKTOP_RELEASE_20261028.md.

Next: exact clean final build/package, fresh controller/content/CMS/main preflight, fast-forward main, immutable upload and Portfolio-only controller activation. Admin/content/schema/adaptives excluded. Use split controller, not obsolete combined Payload procedure in DEPLOY.md. Previous descriptor and current generation retained for rollback.
