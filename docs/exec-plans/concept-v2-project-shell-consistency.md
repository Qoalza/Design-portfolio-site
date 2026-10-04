# Единая оболочка страниц проектов

Статус: COMPLETE. Дата:2026-10-04. База:6b310bd.
PORTFOLIO / Concept V2; MEDIUM, ELEVATED, FULL из-за повторных визуальных дефектов и reused header.
Только worktree redesign-portfolio, ветка codex/redesign-portfolio, текущий чат единственный writer.

## Результат

Обе страницы получают одинаковую верхнюю часть хедера (геометрия, иконки, невыбранная Главная), без линии между header и crumbs. Сараффан получает точный inherited Faint фон intro и summary и пунктир16/16 по бокам summary. Проверить также соседние границы, цвета и отступы обоих shell.

## Источник и причины Fail

Read-only Figma «Основа», Concept V.2 sgKtUASp0aYzdkeH8kcXrL:
- 4332:731803 и4332:731897 имеют fills=[], НО parent4332:731802 имеет Faint binding VariableID:81a6cf2b2c5accee883a7e3f1931003d426f9f54/2213:11 (#141617). Предыдущая приемка неверно наследовала root; исправляется только in-scope фон intro/summary.
- 4332:731899: боковые stroke Thin, dashPattern[16,16], top/bottom0. CSS dashed дает другой короткий паттерн; нужен точный16px stroke /16px gap.
- 4332:731794 и4332:726748 имеют только нижнюю линию. Между General header и crumbs линии нет.
- Общие General header4332:731795 /4332:726749 используют одну структуру; current Corvo и Sarafan собраны разным кодом, имеют разные nav widths и Light/Medium icons.

## Действия: target → изменение → результат → проверка

1. ProjectSiteHeader → вынести общую верхнюю шапку в один компонент с одним CSS и точными existing Light SVG, brand191, nav97/76/133, right378, indicator213, contact121; принимаемые crumbs children внутри существующего ProjectHeaderShell → одинаковые rects/icons/цвета/spacing на обеих страницах; Главная Ghost без selected → сравнение DOM rects, computed styles и SVG на одном viewport1440 для двух URL, static и pinned.
2. Sarafan CSS → intro и summary Faint; боковые линии summary отдельные pseudo elements16/16, сохраняющие1px structural width и исходную geometry → фон#141617, dashed16/16 по обеим сторонам → Figma parent chain и runtime computed background/pattern, screenshot участка.
3. Смежный shell audit → проверить crumbs widths/gap, внешнюю нижнюю Thin границу, intro border и summary top/bottom ownership, footer/result текущие neutral backgrounds, links/icons → нет лишних линий и геометрических скачков → source mapping и полный проход Сараффана, Corvo метрики/границы.
4. Проверки → updated focused assertions только по новому ownership, tests/lint/build, два review (fidelity/completeness, затем regression/scope), финальные screenshots → каждый пользовательский пункт Check с прямым evidence.

## Сохранить

ProjectHeaderShell travel150ms, slot145 и measured threshold; принятую image/grid Hero scene; Experience/Lenis/stopper/reset; глобальную политику ввода; preloader; copy/morph605/36 и правый край; contact blue orbit/halo/clipped plane/glide; проектные ссылки; всю главную. Никаких новых зависимостей, соседних checkout/веток, USERSPACE, Figma write, production, push/merge/deploy.

## Готовность и критерий завершения

Ready for execution: источники и причины подтверждены, продуктовых неопределенностей нет. План проверен на все5 явных требований и соседние in-scope элементы; общая шапка исключает дублирование и разную геометрию. Не расширять работу на главную или принятую Hero сцену. Если source отсутствует, сначала получить read-only; не подменять неизвестное догадкой.

Цель завершается только после прямого runtime доказательства каждого5 пункта, проверок, review, commit и сохранения evidence.

## Дополнительные подтвержденные исправления

- Light Lock-01 исходно имел stroke1 и fillopacity0.2, но SVG-export превратил stroke в outlined fill. Light Telegram сохранил stroke внутри SVG-mask. В runtime перенесены точные vectorPaths и relativeTransform из Figma, без изменения геометрии; теперь настоящий stroke1, currentColor, non-scaling-stroke.
- Root Corvo4332:726747 использует #17191a. Прежний #16191a заменен в оболочке Corvo; локальные Faint области и Hero не затронуты.
- Последнее уточнение пользователя Border/Thin: на главной Thin применяется и к обычному состоянию хедера; в проектах Thin — внешняя нижняя линия под крошками. Внутренний разделитель по пункту2 остается отсутствующим.

## Результат

Все5 пунктов Check. Прямые runtime measurements и снимки: design-reference/project-shell-consistency-2026-10-04/ACCEPTANCE.md. tests210/210, lint92, build565; два review завершены. Одна согласованная Git-группа: единая оболочка проектов и последнее уточнение Thin.
