# Library V2 Hero revision — audit

Дата: 2026-09-25  
Runtime baseline: `a53a76f`  
Figma Hero: `sgKtUASp0aYzdkeH8kcXrL` · `3774:200462`  
Scenario tabs: `nrqHGuE0qOo4Dwj59I9wEc` · `2147:1776`  
Size tabs: `nrqHGuE0qOo4Dwj59I9wEc` · `2151:15044`

## Structural coverage

- Hero component set: five `1440×980` variants.
- Header: `1440×52`; center `1280`; at `1440px` side hatches are `79px`
  with `1px` separators.
- Scenario group: center-relative `x=40`, `y=12`, `height=40`, `gap=24`.
- Scenario instance widths: `146 / 92 / 97 / 119`.
- Hint: center-relative `x=926`, `y=12`, `318×40`.
- Workspace: starts at `y=52`, height `928`.
- Ruler: center-relative `x=40`, `y=48`, `1200×64`.
- Ruler segments: `256 / 141 / 415 / 188 / 200`.

## Scenario tab contract

- Height `40`; text inset `4px 8px`; icon/text gap `8`; icon slot `16`;
  bottom padding `8`; underline `1px`.
- Onest Regular `14/16`, tracking `-0.1px`.
- Enable `#747f87 / #b7c0c7`.
- Hover `#b7c0c7 / #e9eef2 / #475157`.
- Active `#43a2ee / #e9eef2 / #1d90eb`.
- Disable `#363d42 / #475157`, no underline.

## Size tab contract

- Height `48`; padding `8px 12px`; gap `12`; icon container `32×32`,
  radius `8`; icon slot `16`.
- Source Code Pro `12/16` tracking `-0.3px` and `14/16` tracking `-0.5px`.
- Enable `#475157 / #949ea6 / #b7c0c7`.
- Hover `#949ea6 / #d3dbe0 / #d3dbe0`, container `#181c1f`.
- Active `#43a2ee / #d3dbe0 / #43a2ee`, container `#1d2124`.
- Disable text `#475157`, icon `#363d42`.

## Explicit exception

Corvo iframe is owned by the existing runtime, not by the current Figma
comparison. Its geometry, direct `scale(.6)`, source layout, breakpoints,
assets, preset values and motion are regression-only and must remain unchanged.

## Runtime acceptance

- Final chrome geometry: `980 / 52 / 928 / 64` for Hero, header, workspace
  and ruler respectively.
- Scenario instances: `146 / 92 / 97 / 119`; ruler segments:
  `256 / 141 / 415 / 188 / 200`.
- Active endpoint uses the Figma blue upper boundary; neutral endpoints retain
  the neutral edge token.
- Header hatch, three separately phased `8×8` dashed baselines and solid
  active underline remain separate layers.
- Regression diff contains no changes to responsive scene files, iframe source,
  `width.mjs`, `motion.mjs`, `App.jsx` or the main Concept page.
- Verification: focused Hero tests `8/8`; complete suite `134/134`; lint and
  Vite production build passed on 2026-09-25.
