# Исправление страниц проектов Concept V2

Статус: IN_PROGRESS. Дата: 2026-10-04.
База до исправлений: `37c64cf6afffaf36d0d98f15062fbc2eb6f11c76`.
Область: PORTFOLIO / Concept V2; LARGE, ELEVATED, FULL.
Единственный writer: текущий чат; единственный worktree — redesign-portfolio.

## Результат и границы

Corvo получает белую Filled Neutral кнопку Figma в «В цифрах», единственную линию Thin под штриховкой и выезжающий общий хедер вместе с breadcrumbs. Вся страница Сараффана соответствует текущим значимым секциям Figma, кроме принятой тестовой области изображения и сетки Hero.

Не затрагивать соседний чат, его ветки и checkout. Не менять главную Hero, Experience (собственный Lenis, стоппер, сброс, rearm и исправление фантомного кадра), глобальную политику ввода, прелоадер, источник проектных ссылок, принятый copy/morph и контактные эффекты. Figma read-only; production, merge, deploy, push вне задачи.

## Источники и аудит

Figma: Concept V.2 `sgKtUASp0aYzdkeH8kcXrL`, только страница «Основа».
Свежие design context и структура 2026-10-04 подтверждают:

| Требование | База | Источник / исправление |
|---|---|---|
| Corvo: Figma в широкой карточке метрик | Fail: Light | `4332:731621`: Fill Neutral, 36px, #d6dce0, иконка справа; сохранить hover morph |
| Corvo: линия под штрихом | Fail: hatch bottom + result top | Единственный владелец линии, 1px токена border Thin |
| Projects: хедер и breadcrumbs выезжают вместе | Fail: статичны | Повторить принятую механику главного хедера, измерять высоту shell145, сохранить место в документе |
| Сараффан: crumbs, indicator, nav | Fail: потеря logo, plain text, другой nav | `4332:731794`, `4332:731800`; Color logo16, compact Ghost, home16, gap16, padding24; header80 |
| Сараффан: intro | Fail: неправильные отступы, отсутствуют flag и контейнер действий | `4332:731803`: top48 bottom36, tags pl40, heading pl36 pr40, logo44 gap20, name44/56, yellow flag16, subtitle pl68 Secondary, actions container Thin radius12 padding8 |
| Сараффан: image/grid Hero | Check / исключение | Сохранить ProjectRasterHero и definition без изменений, высота928 |
| Сараффан: описание | Fail: синий фон, centered1000, неверный notice | `4332:731897`: наследуемый фон; inner1280 dashed edges; padding48/52/64, gap40; copy1000 inset8; notice1000 padding20, info20 gap12, title16/20, body16/24 |
| Сараффан: flow | Частично: текст и media есть, top spacing неверен | `4332:731908`, `4332:731910`: внешний top56 + title top64; content pl64 pr52 pt8 pb40, copy936 pr40; media1016 canvas1176 image1047×860 at62/70 |
| Сараффан: получение / состояния | Fail: лишние paragraph margins и границы | `4332:731975`: outer1280 py56, sections py64, copy max1000 pl64, h24/32, body16/24 без paragraph gaps; один separator между секциями |
| Сараффан: штрих / результат | Fail: цвет и geometry | `4348:872588`, `4332:731985`: hatch88, результат Faint #141617, одна линия Thin, inner1280 py64 max1000 pl64; bottom40; body gaps24 |
| Сараффан: footer | Нужна проверка полной структуры | `4332:731991`: получить context перед правкой, сверить children и geometry |

Стили токенов сверять по привязке конкретного элемента; одинаковое название роли не доказывает одинаковую переменную. Пользовательский override: нижняя линия общего хедера Thin на всех страницах.

## Порядок исполнения

1. Corvo: исправить вариант кнопки и единственного владельца разделителя. Проверить источник, локальные assertions и реальный вид; отдельный commit.
2. Получить полные context header, intro, receiving, hatch, footer Сараффана; сопоставить каждый видимый child с существующим asset/component. Не рисовать logo заново; использовать точный Color asset или доказанный эквивалент.
3. Исправить только внешнюю страницу Сараффана по таблице. Проверить desktop1440: геометрию секций, переносы, цвета, assets, границы. Hero scene diff должен быть пустым.
4. Добавить общий проектный shell с механизмом главного header: threshold равен измеренной высоте, frame coalescing и disposal, fixed header+crumbs одним блоком, прежнее место остается. Главный header не менять без необходимости. Проверить оба проекта: scroll down/up, entry/exit, no layout jump, корректные действия и breadcrumbs.
5. Провести два последовательных review: fidelity/completeness по всем строкам, затем regression/scope по invariants. Исправить каждый подтвержденный Fail.
6. После последней правки: focused tests, lint, build; runtime обеих страниц и главной с фактическими screenshots/computed geometry. Итоговый Check допускается только с прямым доказательством. Обновить этот план и HANDOFF, commits завершенных групп. Цель завершать только когда все требования проверены.

## Критерий готовности и stop-lines

Каждый пункт таблицы Check с текущим source/runtime evidence. Реальная страница не заменяется зелеными source assertions. Принятые исключения сохранены. Новая зависимость или необходимость менять invariant/чужой worktree/production требует остановки соответствующей работы и решения пользователя. Нужного Figma child context сначала получить, не угадывать.

## Проверка плана

Последовательность определяет source, точные target, исключения и доказательства; реализация уже разрешена целью. Product/architecture решений исполнителю не оставлено. Уточнений для первых групп нет. Бюджет токенов не назначается.

## Прогресс

- 2026-10-04: preflight clean, аудит значимых блоков Сараффана и точной кнопки Corvo; подтверждены перечисленные Fail. Реализация и полная runtime приемка еще не завершены.
- Corvo slice: Fill Neutral и одна граница реализованы; focused tests 8/8, lint88. В текущем браузере4193 computed styles: Figma rgb(214,220,224); hatch bottom0; result top1 rgb(31,34,36). Полная визуальная приемка остается в итоговом проходе.
