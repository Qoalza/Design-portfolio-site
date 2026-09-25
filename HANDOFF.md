# HANDOFF

Обновлено: 2026-09-25.

## Текущий checkout

- Branch: `codex/concept-v2-responsive-hero`.
- Worktree: `/Users/designer/.codex/worktrees/concept-v2-responsive-hero/Design-portfolio-site`.
- Baseline этой ревизии: `806ab86`; актуальный результат — последний commit
  текущей ветки.
- Development URL: `http://127.0.0.1:4173/preview/project-responsive-hero`.

## Checkpoint

- Актуальная проверка: native Zen снова управляется после foreground пользователем.
  Удаление дублирующего border-radius само по себе не убрало кайму; opaque
  `mask-image: linear-gradient(#000, #000)` на внешнем productViewport убрало
  её в наблюдаемых кадрах Zen, сохранив левую форму через clip-path 8px.
  Scope: только внешний CSS и regression assertion; внутренний Corvo не менялся.
- Resize остаётся OPEN. Пользователь уточнил: дефект возникает при drag за
  ручку, не при выборе presets. В живых Chromium drag-кадрах через Desktop/Tablet
  видна переходная полоса снизу/обрезка формы. Эксперимент запуска height spring
  от rendered width вместо pointer target не устранил дефект и полностью откатан.
  Не подменять drag-проверку endpoint/preset smoke и не просить запись пользователя.
  Следующая проверка: синхронизация iframe paint, source-height clip и animated
  wrapper во время удержания указателя. Motion и product source сохраняются.
  CDP captureBeyondViewport при emulated viewport больше реального окна давал
  ложный вертикальный seam: использовать настоящий viewport override и visible
  screenshot. Старая просьба записи ниже больше не актуальна.

- OPEN, актуальная обратная связь: пользователь подтверждает оставшуюся
  светлую кайму в Zen и артефакты resize во всех браузерах. Предыдущие
  численные проверки не доказывают устранение этих визуальных дефектов.
- Проверяемый кандидат поверх `84a8380`: внешняя обрезка использует
  `clip-path: inset(0 round 8px 0 0 8px)` вместо `overflow: hidden`.
  Радиус, размеры, продукт и motion не изменены. Основание: единая явная
  область обрезки элемента и потомков, MDN:
  https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/clip-path
  В Chromium Desktop → Tablet: 92 кадра, 62 значения высоты, постоянный
  clipping path. Build и focused tests PASS. Это не доказательство исправления
  Zen: после reload native capture показывал старый кадр и потерял окно.
  Запрошена запись именно артефактов движения; задача не закрыта.

- Последняя коррекция поверх `495114b`: внешний iframe Authorization снова
  имеет левые радиусы `8px` на всех размерах и подложку `#242625`.
  Runtime Desktop → Tablet доказал причину скачка: рамка растёт `576→660px`,
  но scene/clip остаётся `576px` почти до конца. Прозрачная подложка оставляла
  до `83.7px` видимой сетки. Теперь анимируемую область заполняет исходный
  тёмный цвет; внутренний breakpoint/reflow продукта остаётся неизменным.
  Внутренние файлы продукта в этой коррекции не затронуты; их изменения
  соседней задачи сохранены. Прежние утверждения ниже о byte-to-byte source
  относятся к исторической проверке, а не к текущему продукту.
- Анимируемая высота iframe округляется вверх до целого логического пикселя;
  внешний clip остаётся непрерывным. Это устраняет измеренный зазор до
  `0.440625px` между документом iframe и рамкой. В пяти переходах built runtime
  незакрытый край по X/Y не обнаружен; меняющаяся высота содержит 62–65
  промежуточных значений. Проверены левые `8px` и правые `0px` во всех presets.
  Suite `138/138`, lint и build PASS. Zen визуально не подтверждён.

- Hero доступен только по `/preview/project-responsive-hero`; главная
  Concept-страница и 404 не изменены.
- Внешняя оболочка сохраняет `980px` Hero, header `52px` и ruler `64px`.
- Верхние крайние разделители всегда Surface `#272d30`; scenario underline
  имеет видимый быстрый вход снизу, text-selection отключен.
- Motion сохраняет вязкий drag, preset easing, magnetic release и inertia;
  наружный ввод на min/max теперь останавливается на границе без recoil.
- Все четыре готовые сцены Corvo связаны с tab-выбором. Они перенесены из
  разрешённого source byte-to-byte и загружаются без изменения внутренних
  HTML/CSS/assets, layout, scale или breakpoint-логики.
- Неактивное подчёркивание табов находится на `1px` ниже clipped frame;
  hover-линия поднимается на `1px` за `250ms` с синхронным opacity-ramp,
  не выезжая под header и не появляясь мгновенно.
- Девять иконок верхних табов сверены с actual Figma Hero instances: Medium
  stroke `1.3px` остаётся неизменным при уменьшении полного SVG canvas до
  `16px`. Key восстановлен как повёрнутый line-вектор. По прямой новой правке
  пользователя Mobile имеет Duotone-корпус с fill `20%` и stroke `1.3px`;
  текущий Figma Hero instance Mobile остаётся Line, это сознательный override.
- Физическая и логическая ширины внешнего фрейма теперь всегда связаны ровным
  `scale(.6)`. Высота внешнего фрейма снова плавно анимируется вместе с
  шириной при preset и drag; после регрессионной коррекции высота самого iframe
  вновь движется вместе с внешней рамкой. Отдельный clip ограничивает видимость
  iframe фактической высотой текущего breakpoint, поэтому белый canvas
  Authorization не выступает за тёмную сцену.
  Логическая ширина самого iframe округляется вверх менее чем на `1px`, чтобы
  белый document canvas не мелькал у правого края. У Authorization внешняя
  подложка использует исходный тёмный цвет `#242625` и левое скругление
  `8px 0 0 8px`.

## Проверка

- Focused Hero tests `8/8`; полный Concept V2 suite `134/134`.
- Lint, Vite production build и built runtime smoke — PASS.
- Runtime: Statistics, My Space и Authorization переключены и подтвердили
  свои URL; Authorization визуально загружен.
- Runtime: ArrowRight в max сохраняет slider на logical width `1933`.
- `diff -qr` подтвердил точное совпадение 142 Corvo source files.
- Два review-прохода: fidelity/completeness и regression/scope/risk — без
  открытых замечаний.
- В актуальном runtime: Tablet viewport `767.398px` против scaled iframe
  `767.400px`; при preset-переходе и drag максимальный кадр `10.5ms`, без
  интервалов свыше `25ms` на локальном устройстве. Corvo files не менялись.
- Последняя коррекция: на дробной ширине iframe перекрывает внешний viewport
  меньше чем на `0.6px`; Mobile/Tablet/Desktop/max имеют согласованную высоту
  источника и оболочки. Focused tests `8/8`, suite `134/134`, lint и build — PASS.
- Built runtime проверен в Codex browser; автоматическое взаимодействие с
  открытым Zen было недоступно. Визуальная приёмка в Zen остаётся открытой.
- Новая проверка: focused `8/8`, полный suite `134/134`, lint и production
  build — PASS; в runtime все 9 верхних иконок имеют computed stroke `1.3px`.
  Hover измерен в промежуточных кадрах; Authorization
  на Tablet сохраняет перекрытие правого края и левое скругление.
- Дополнительный runtime-review после Mobile-правки: все 5 size-tab SVG имеют
  итоговый frame `16px`, stroke `1.3px`; Mobile, Tablet и Desktop имеют
  fill-opacity `0.2`. Mobile остается на том же месте в табе.
- Исправление скачка высоты: до правки Tablet → Mobile давал одномоментное
  `660 → 384px` при плавной ширине. В свежей сборке оба направления имеют
  промежуточные кадры по ширине и высоте; focused tests `8/8`, полный suite
  `134/134`, lint и build прошли. Внутренние Corvo files и `scale(.6)` не изменены.
- Последняя регрессия: дискретная высота iframe давала скачок `384 → 660px`
  при высоте рамки `≈386px` на переходе Mobile → Tablet. В новой сборке
  iframe и рамка расходятся не более чем на `0.1px` в замеренных кадрах обоих
  направлений; clip ограничивает только лишний canvas сцены. Focused Hero
  tests `8/8`, весь suite `134/134`, lint и build прошли. Скругление именно
  в Zen остаётся открытой визуальной проверкой; инструмент показывает старую
  вкладку Zen при адресе Hero, поэтому успех в Zen не заявлен.

## Следующее действие

Показать пользователю актуальный isolated preview и получить приёмку
плавности и левого скругления в Zen. Не добавлять новые эффекты перехода.

## Stop-lines

Не интегрировать Hero в concept-страницу, не менять 404/preloader, не менять
внутреннюю Corvo-разметку, не выполнять merge/deploy/Figma write.

## Pointer

- `docs/exec-plans/project-responsive-hero.md`
