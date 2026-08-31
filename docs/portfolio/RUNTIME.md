# Portfolio Runtime Invariants

## Назначение

Только cross-component runtime правила, которые сложно безопасно восстановить из одного component file. Exact implementation и tests остаются source of factual behavior.

## Scroll coordination

- Desktop/fine-pointer smooth scroll использует один root `ScrollController` и один ordered `ScrollFrameCoordinator`.
- Root controller обновляется первым.
- Local Gallery controllers обновляются после root.
- Sticky navigation/action bar измеряют уже обновлённую DOM geometry последними.
- Независимые постоянные RAF loops в этих подсистемах запрещены.
- Touch/coarse input и `prefers-reduced-motion` сохраняют native scroll; Lenis не инициализируется.
- Smooth scroll не является source of layout state: active section/action-bar/Gallery offsets определяются measured DOM geometry.

Relevant owners: `src/lib/scroll-controller.ts`, `src/lib/scroll-frame-coordinator.ts`, `src/components/smooth-scroll-provider.tsx` и focused tests.

## Route, hash и history

- Новый pathname без hash открывается с top reset.
- Explicit hash navigation сохраняет anchor behavior и sticky offset contract.
- Navigation trail хранится в конкретной `history.state` entry с сохранением внутренних Next.js fields.
- Reload/Back/Forward восстанавливают entry-specific trail; query parameters не используются как hidden navigation state.
- Programmatic navigation, route reset, hash movement и lightbox scroll lock используют общий controller boundary.

Relevant owners: `src/components/navigation-scroll-controller.tsx`, `src/components/contextual-navigation.tsx`, `src/lib/navigation-trail.ts`, focused tests.

## Header и project action bar

- Общий `SiteHeader` поддерживает flow/fixed states; project variant включает breadcrumbs.
- Только active interactive copy доступна для focus/assistive technology.
- Project action bar имеет `Full`/`Adaptive` states, определяемые measured header/information/content/footer geometry.
- Bootstrap/initial/steady-state используют один geometry contract; разные thresholds между первым кадром и steady state недопустимы.
- Terminal region резервирует постоянную geometry и не меняет document height при docking.

Relevant owners: `src/components/site-header.tsx`, `src/components/project-action-bar.tsx`, `src/lib/project-action-bar-bootstrap.ts`, focused tests/evidence.

## Gallery и lightbox

- Один gesture даёт один discrete Gallery step.
- Gallery/root input arbitration происходит до неправильной native mutation.
- Controls и edge fade зависят от фактического overflow/current position.
- Lightbox находится в top layer, сохраняет aspect ratio/quality constraints, scroll lock и focus return.
- Historical screenshots не доказывают current Gallery behavior; проверять current code/runtime.

## Source boundary

Этот документ не хранит:

- Figma component tokens/icon rules — `DESIGN_SYSTEM.md`;
- exact pixel evidence — `design-reference/**`;
- active defects — `DESIGN_QA.md`;
- per-workstream decisions — active ExecPlan;
- field-level project data — executable Shared contract.
