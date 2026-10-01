# Concept V2 — актуализация главной по текущему Worktree Redesign

**Статус:** `COMPLETE`. **Ветка:** `codex/redesign-main-fidelity`.
**Worktree:** `/private/tmp/design-portfolio-redesign-main-fidelity`.
**Базовый commit:** `5df17c7b7c9dc3bad6470d990eb2f2ca07c00339`.

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

## Текущий пакет исправлений после пользовательской приёмки

1. Projects: вернуть разделитель за изображения, сделать его невидимым в
   покое и раскрывать только в пределах inset `12px`; исправить тонкую рамку,
   квадратную заливку корня, скругление glow и точную hover-геометрию.
2. Process: убрать старую сетку из SVG-иконок, использовать точные default и
   hover-иконки, добавить hover-цвет сетки карточки, убрать постоянную верхнюю
   линию и восстановить структуру divider + padded body.
3. AI: восстановить верхнюю и нижнюю строки рамки у боковой штриховки.
4. Experience: совместить физические начала сеток `320px` и `20px`, чтобы
   сильная линия заменяла каждую шестнадцатую мелкую границу; вернуть нижний
   полноширинный stroke перед About.
5. About: убрать заливку title frame и применить точные цвета точек
   `#363d42` / `#43a2ee`.

## Этапы

1. **Аудит — COMPLETE.** Сопоставить exact Figma children, размеры, цвета,
   слои и эффекты с текущим runtime; зафиксировать только подтверждённые
   расхождения.
2. **Projects / Process / AI — COMPLETE.** Исправить структуру слоёв,
   рамки, иконки, сетку и боковую штриховку без изменения утверждённых
   длительностей и поведения.
3. **Experience / About — COMPLETE.** Исправить фазу сетки, нижний разделитель,
   фон heading и цвета carousel dots.
4. **Полная проверка — COMPLETE.** Запустить отдельный runtime на порту `4190`,
   пройти exact desktop states и затем выполнить два последовательных review.
5. **Закрытие — COMPLETE.** Обновить evidence и `HANDOFF.md`, создать отдельный
   commit в изолированной ветке и оставить результат для пользовательской
   приёмки без merge/push.

## Acceptance

- На desktop текущий runtime соответствует `4150:804068` по всем секциям с
  учётом пяти пользовательских исключений.
- Верхние эффекты карточек Projects и Process сохранены и визуально проверены.
- About embedded Preview имеет `320×436`; rear cards — `256×336`, `y=50`.
- Viewer остаётся `480×630` после прежнего масштаба `1.5×`; анимации остаются
  `500ms` и используют прежние траектории.
- Focused tests, lint, tests и production build Concept V2 проходят на
  итоговом состоянии.

## Evidence

- В живом runtime просмотрены Projects, Process, AI, Experience, About и
  Footer; отдельно подтверждены верхние слои Projects и Process и итоговая
  высота About Preview.
- Первый fidelity/completeness review обнаружил утечку desktop-ассетов и
  стилей в `<1280px`; после исправления проверены прежние состояния на
  `1024px` и `760px`.
- Последующий regression/scope/risk review не нашёл оставшихся дефектов и
  подтвердил изоляцию worktree и breakpoint.
- В runtime `1574px` проверены Projects, default/hover Process, AI, Experience,
  нижний разделитель Experience и About.
- Итоговый `npm run check`: lint, `162/162` tests и production build.
