# Accessibility Exceptions

Обновлено: 2026-08-31.

## Назначение

Только подтверждённые случаи, когда current утверждённый Figma source требует видимого отклонения от WCAG и пользовательский project contract предписывает реализовать Figma.

Это не accessibility audit и не разрешение автоматически переносить старое исключение на новый Figma source/runtime.

## Lifecycle

- `needs_revalidation` — исключение было доказано на старом source, но current source/runtime изменился;
- `open` — current source и runtime повторно проверены, конфликт сохраняется;
- `design_updated` — current Figma изменён и требует implementation/recheck;
- `resolved` — current implementation/source больше не нарушает критерий.

Для `open` обязательно указать:

- page/component;
- WCAG criterion/level;
- accessible alternative;
- exact current Figma source и binding/value;
- current runtime measurement;
- user impact;
- `last_verified` date;
- evidence path.

## Записи, требующие повторной проверки

Следующие четыре записи были проверены 2026-08-11/12 на прежних Figma nodes `262:*` и `321:*`. Позднее проект перешёл на sources `510:*` и `373:*`. Старые measurements сохраняются как historical evidence, но не доказывают current exception.

### 1. Приглушённая навигация и secondary text

- Historical criterion: WCAG 2.2 1.4.3, AA.
- Historical measurements: `#A2ACB5/#FCFCFD = 2.25:1`, `#75848F/#FCFCFD = 3.76:1`, `#8C949B/#FCFCFD = 3.0:1`.
- Historical source: homepage node `262:2382` и descendants.
- Current source to verify: homepage source map rooted at `510:28120`.
- Status: `needs_revalidation`.

### 2. Text interactive elements

- Historical criterion: WCAG 2.2 1.4.3, AA.
- Historical measurements: `#FBFBFB/#1D8BE3 = 3.47:1`, `#218EE6/#FCFCFD = 3.37:1`.
- Historical source: homepage node `262:2382` и descendants.
- Current source to verify: current button/link components and instances used by homepage.
- Status: `needs_revalidation`.

### 3. Desktop-only reflow

- Historical criterion: WCAG 2.2 1.4.10, AA.
- Historical contract: minimum page width `1280 px`, no 320 CSS px reflow.
- Historical source: homepage node `262:2382`.
- Current source/runtime to verify: current homepage/projects/project layouts and any responsive work after that source.
- Status: `needs_revalidation`.

### 4. Small project metadata contrast

- Historical criterion: WCAG 2.2 1.4.3, AA.
- Historical measurements: `#6C7D86/#FCFCFD = 4.17:1`, `#88949C/#FCFCFD = 3.03:1`.
- Historical source: Corvo node `321:29865`.
- Current source to verify: current project header/action-bar instances under the current project source map.
- Status: `needs_revalidation`.

## Current compliance statement

До отдельной read-only revalidation нельзя:

- называть эти четыре записи доказанными current `open` exceptions;
- объявлять current site полностью WCAG-compliant;
- удалять historical measurements;
- менять Figma или visible design ради revalidation без отдельного запроса.
