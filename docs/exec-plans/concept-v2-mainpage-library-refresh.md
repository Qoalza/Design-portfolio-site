# Concept V2 — актуализация главной по текущему Worktree Redesign

**Статус:** `ACTIVE`. **Ветка:** `codex/redesign-portfolio`.
**Базовый commit:** `9099a8759d7e463690c31229da9d82d28e7f3e95`.

## Outcome

Довести текущую desktop-реализацию главной Concept V2 до визуального
соответствия текущему Figma-фрейму, сравнивая Figma с фактически собранным
runtime, а не с предыдущей версией макета или кода.

## Source of truth и границы

- Figma: файл `sgKtUASp0aYzdkeH8kcXrL`, главная `4150:804068`.
- Разделы: Projects `4150:804072`, Process `4150:804089`, AI
  `4150:804109`, Experience `4150:804133`, About `4150:809005`.
- Runtime: текущая сборка `tools/concept-v2/app` из этой ветки.
- В scope: desktop Concept V2, его локальные компоненты, CSS, focused tests,
  build и evidence текущей визуальной приёмки.
- Не входят: mobile/tablet, Admin, Shared contract, опубликованный Portfolio,
  Figma write, merge и deploy.

## Зафиксированные пользовательские исключения

- Сохранить горизонтальный Hero из разработки; вертикальный Hero в Figma —
  шаблон.
- Не добавлять Copy, View и время Екатеринбурга.
- Не менять поведение и длительность анимаций Projects и Process.
- Заголовок Experience остаётся с inset `8px`.
- Подложка Experience использует новую сетку с opacity `60%`.

## Подтверждённые расхождения

1. Служебные подписи Projects и Process в runtime используют muted
   `#949ea6`, в текущем Figma — neutral thin `#475157`.
2. В About текущий Figma-инстанс Preview имеет `320×436`, задние карточки
   `256×336` центрированы по высоте на `y=50`. Runtime всё ещё показывает
   прежний embedded front `320×420` и задние карточки на `y=42`.
3. Общая геометрия Projects, Process, AI, Experience, About и Footer уже
   совпадает с измерениями текущего desktop-фрейма; исключения выше не считать
   дефектами.

## Этапы

1. **Аудит — COMPLETE.** Сопоставить exact Figma children, размеры, цвета,
   слои и эффекты с текущим runtime; зафиксировать только подтверждённые
   расхождения.
2. **Служебные подписи.** Target: Projects/Process desktop. Change: применить
   neutral thin. Expected: обе подписи имеют цвет `#475157`, адаптивные стили
   не меняются. Verification: focused source test и runtime screenshot.
3. **About Preview.** Target: embedded carousel. Change: растянуть только
   front до `436px`, центрировать rear на `y=50`, сохранить viewer `420px`,
   траектории, длительность и управление. Expected: точная геометрия
   `4150:809030` без регрессии viewer. Verification: endpoint/transition tests
   и runtime screenshot.
4. **Полная проверка.** Собрать текущий runtime и пройти Hero, Projects,
   Process, AI, Experience, About, Footer. Затем выполнить два review:
   fidelity/completeness и regression/scope/risk; исправить найденное.
5. **Закрытие.** Обновить evidence и `HANDOFF.md`, создать отдельные commits
   для плана и завершённой реализации.

## Acceptance

- На desktop текущий runtime соответствует `4150:804068` по всем секциям с
  учётом пяти пользовательских исключений.
- Верхние эффекты карточек Projects и Process сохранены и визуально проверены.
- About embedded Preview имеет `320×436`; rear cards — `256×336`, `y=50`.
- Viewer остаётся `480×630` после прежнего масштаба `1.5×`; анимации остаются
  `500ms` и используют прежние траектории.
- Focused tests, lint, tests и production build Concept V2 проходят на
  итоговом состоянии.
