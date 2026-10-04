# Concept V2 Figma delta — G0 discrepancies

**Baseline:** `3ec86f0cf16944908695df4a940856881e5dd3a0`  
**Captured:** 2026-09-16  
**Scope:** source revalidation only; no runtime implementation was started.

## X-01 — current Hero source drift (resolved)

- **Related requirements:** D04, G0-H and G0-R.
- **Audited source:** `sgKtUASp0aYzdkeH8kcXrL`, node `3337:228682`, recorded as a `1574×1044` Hero. That node is absent (Figma debug UUID `eae87a9a-e12e-4918-a7fd-3e55716b519a`).
- **Resolution authority:** on 2026-09-16, the user supplied the current Hero component `3125:81643`. It is now the source for D04 only, replacing the unavailable node rather than silently treating the current Main-page instance as equivalent.

### Accepted Hero source manifest

| Variant | Figma node | Canvas | Direct D04 visual contract |
| --- | --- | --- | --- |
| `Screen=Small` | `3125:81642` | `1440×1332` | General header `1280×80` at `x=80`; main content `1200×492`; left copy `408×412`; graph `720×452`; a distinct lower patterned field starts at `y=1012` and is `320px` high. The `Артур` eyebrow is hidden. |
| `Screen=Large` | `3125:81641` | `2313×1652` | General header `1280×80` at `x=516.5`; centered copy `751×316`; graph `947×594`; the `Артур` eyebrow is visible; the graph caption follows the image. The lower patterned field is a direct Hero child, not the old facts panel. |

Shared direct-child contexts confirm:

- H1 is Google Sans Medium `56/68`, tracking `−0.2px`; body is Onest Light `20/36`; the action row uses two `36px` controls with an `8px` gap.
- The Small caption precedes the graph; the Large caption follows it.
- Both variants retain the existing `Light / General / Search` caption asset and graph image geometry. This resolution **does not** authorize any change to the frozen `SvgLens`, pointer mapping, caption resolver, pulses, touch behavior or the 1300px height switch.
- The CV action uses the source-confirmed `Medium / Files / File-05` inside a separate consumer frame; it remains subject to the frozen full-frame inline-SVG contract.

### Result

G0 is unblocked. The source replacement changes D04’s lower-Hero visual target only; it does not reopen any frozen interaction contract. No runtime code, assets, palette consumers or tests have been changed in this checkpoint.
