# MLIR3 icon source inventory

Status: `IN_PROGRESS`

Classification is established by mapping each real consumer to its current Figma component/frame. XML checks validate structure but do not, by themselves, prove that a filled path was not produced from an outlined stroke.

| Consumer group | Figma/source mapping | Type | Local full-frame assets |
|---|---|---|---|
| Header navigation/status | Header library and current page instances | Stroke / Solid | `home.svg`, `lock.svg`, `status.svg` |
| Telegram CTA | current Header button instance; complete Telegram frame | Stroke | `telegram.svg` |
| SquareButton arrows/back | Square Button library and current instances | Stroke | `chevron-down.svg`, `chevron-left.svg`, `chevron-right.svg`, `back.svg` |
| Project metadata/actions | current project-card instances | Stroke | `project-bullet.svg`, `project-info.svg`, `project-refresh.svg`, `project-share.svg`, `external-link.svg` |
| Device labels | current device icon instances | Stroke | `desktop.svg`, `tablet.svg`, `mobile.svg` |
| Project notices/action bar | current Corvo local components | Stroke | `info.svg`, `info-circle.svg`, `external-link.svg` |
| Footer | Footer library `124:4841` | Stroke | `footer-author.svg` |
| Hero/process decoration | current main-page instances | Stroke / Duotone / Color according to mapped frame | `hero-icon-*.svg`, `process-*.svg`, ring/glow SVGs |
| Brand/product marks | current page instances | Solid / Color | `logo.svg`, `corvo-symbol.svg`, `corvo/logo.svg`, radio-logo frames, `chatgpt.svg`, `codex.svg` |
| Resume decoration | current Resume instance | Stroke / Solid | `experience-briefcase.svg`, `experience-crest.svg`, `experience-star.svg`, separator |

Required checks per source: intact viewBox/frame, source-appropriate stroke/fill, stroke width, cap/join, intrinsic alignment, semantic color/currentColor, and enabled/disabled/hover/focus state at the actual consumer.
