# HANDOFF

Обновлено: 2026-10-01.

## Текущий checkout

- Ветка: `codex/redesign-main-fidelity`.
- Worktree: `/private/tmp/design-portfolio-redesign-main-fidelity`.
- Базовый commit: `5df17c7b7c9dc3bad6470d990eb2f2ca07c00339`.
- Рабочий план: `docs/exec-plans/concept-v2-mainpage-library-refresh.md`.

## Checkpoint

- Desktop-главная Concept V2 повторно сверена с Figma Main `4150:804068` по
  фактическому runtime.
- Projects: верхний separator находится за изображениями и раскрывается внутри
  inset `12px`; рамки, glow, корень и hover-геометрия приведены к компоненту.
- Process: grid принадлежит карточке, меняет цвет на hover; desktop использует
  чистые default/hover SVG, старые adaptive SVG и маски сохранены для `<1280px`.
- AI: боковая штриховка имеет верхний и нижний stroke.
- Experience: переиспользуемый `GridPattern` повторяет один exact SVG-тайл из
  нового source `4198:875236`: ячейки `20px / #16191c`, разделители плиток
  `320px / #191e21`, общий opacity `70%`. Внутренние линии обрываются на
  границах плитки. Компонент зафиксирован без визуальных props: consumer
  вставляет `<GridPattern/>` и не настраивает сетку. Верхнее точечное поле
  между AI и Experience снова видно,
  нижний полноширинный stroke `1px #1d2124` отделяет About.
- About: heading frame прозрачен; неактивные точки `#363d42`, активная
  `#43a2ee`; мера строки copy возвращена к `572px`, карточка остаётся
  `320×436px`.
- Восстановлена разработанная адаптивная механика Hero: `large` включается от
  `2313×1300px`, остальные окна используют `small`. Copy/View, часы,
  tablet/mobile и утверждённые длительности анимаций не менялись.
- Итоговый `npm run check` прошёл: lint, `162/162` tests и production build.
  Два последовательных review закрыты; второй не нашёл замечаний.
- Актуальный локальный просмотр: `http://127.0.0.1:4201/`.

## Stop-lines

Не трогать соседний worktree
`/Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site`,
ветку `codex/redesign-portfolio`, Admin, Shared contract, `USERSPACE/**`,
`main`, production, Figma и опубликованный Next.js Portfolio. Merge, push и
deploy не входят в эту цель.
