# DESIGN QA

Обновлено: 2026-08-31.

## Назначение

Только текущие подтверждённые visual/interaction findings со статусами:

`OPEN | IN_PROGRESS | READY_FOR_REVIEW`

Закрытые и superseded пакеты здесь не хранятся. После пользовательской приёмки запись удаляется; важный системный root cause при необходимости сохраняется в `PROJECT_HISTORY.md`, evidence остаётся в `design-reference/**`.

## OPEN — current platform icon visual fidelity

Механика platform icons уже принята и **не является дефектом**:

- full icon frame/canvas;
- intrinsic dimensions;
- mask/currentColor/semantic color role;
- отсутствие forced generic `20×20`;
- отсутствие stale hard-coded consumer color.

Этот долговечный contract находится в `DESIGN_SYSTEM.md`.

Открытым остаётся только визуальное/source соответствие конкретных current platform-icon instances.

Перед закрытием:

1. получить exact current Figma source mapping для затронутых platform icons;
2. проверить current `main`/runtime instances;
3. подтвердить geometry, frame, color, alignment и source family;
4. получить пользовательскую visual acceptance конкретных current instances.

Историческая системная причина сохраняется в `PROJECT_HISTORY.md`.

## Не является записью этого файла

- принятые 404/500 pages;
- старый Admin Figma Frame preview checkpoint без воспроизведения на current source/runtime;
- MLIR2–MLIR7 history/closed packages;
- preloaders/loading states без подтверждённого current Figma discrepancy;
- старые `READY_FOR_USER_REVIEW` screenshots;
- feature backlog, архитектурные планы и deploy tasks.
