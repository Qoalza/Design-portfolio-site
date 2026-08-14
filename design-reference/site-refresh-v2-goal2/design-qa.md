# Goal 2 — header and project action bar QA

Дата проверки: 2026-08-14

Статус: `READY_FOR_USER_REVIEW`

## Источники Figma

- header states: `373:48009`, `295:3490`, `373:48438`;
- project states: `373:47102`, `373:47103`, `373:47416`;
- action bar variants: `373:50562`, `373:50563`, `373:50576`;
- floating bar geometry: `373:47451`, `373:47531`.

Свежий `get_design_context` получен для необходимых узлов. `get_motion_context` для секций состояний не вернул motion nodes, поэтому направления и длительность взяты из пользовательского контракта: transform-переходы `300 ms`, без fade, scale, blur и декоративных эффектов.

## Проверенные состояния

- Главная сверху: обычный header в flow, fixed-копия скрыта.
- Главная после выхода header: fixed-копия высотой `80 px`, `top: 0`, один активный navigation landmark; высота документа не меняется.
- Corvo сверху: обычный двухрядный блок header + breadcrumbs.
- Corvo после прокрутки: единый fixed-блок высотой `160 px`, `top: 0`, с разделителем между строками.
- Плавающая плашка появляется снизу, уходит вниз при первом пересечении inline-копии (`IntersectionObserver`, `threshold: 0`) и возвращается при обратном пересечении; focused check фиксировал состояние при `2 px` видимой области.
- При нескольких быстрых пересечениях итоговое состояние стабильно, flicker и дубли активных действий не обнаружены.
- Focus с активной кнопки `Поделиться` переносится в становящуюся активной копию с `preventScroll`; focused-элемент не находится внутри `inert`.
- Доступный вариант Corvo содержит Figma URL, дату и Share. Недоступный вариант `example-project` содержит точный информационный текст, не содержит Figma-ссылку и дату, Share остаётся активным.
- Copy fallback сообщает `Ссылка скопирована` через единый live region.
- `prefers-reduced-motion: reduce`: header и плашка используют `0.01 ms`, конечная геометрия сохраняется.

## Геометрия

| Viewport | DPR | Left | Width | Bottom | Horizontal overflow |
| --- | ---: | ---: | ---: | ---: | ---: |
| `1280 × 900` | 1 | `40 px` | `760 px` | `44 px` | `0 px` |
| `1440 × 900` | 1 | `120 px` | `760 px` | `44 px` | `0 px` |
| `1920 × 1080` | 1 | `360 px` | `760 px` | `44 px` | `0 px` |
| `1440 × 900` | 2 | `120 px` | `760 px` | `44 px` | `0 px` |

## Motion evidence

- `08-bar-motion-000ms.png`: transform `translateY(172px)`, плашка полностью ниже viewport.
- `09-bar-motion-150ms.png`: промежуточный transform около `translateY(31px)`.
- `10-bar-motion-370ms.png`: transform `translateY(0)`, `bottom: 44 px`.
- При уходе: около `80 ms` transform `translateY(13px)`, около `150 ms` — `translateY(54px)`, после `370 ms` — `translateY(172px)`.
- При возвращении: около `80 ms` — `translateY(114px)`, около `150 ms` — `translateY(54px)`, после `370 ms` — `translateY(0)`.

## Совместимость

- Project back, breadcrumb, browser Back/Forward открывают новый pathname с `scrollY = 0`.
- `#projects` сохраняется; верх секции находится на `128 px`, то есть на `48 px` ниже fixed header.
- Lightbox сохраняет позицию между открытым и закрытым состоянием, `Escape` закрывает диалог и возвращает focus триггеру.
- Production fonts имеют статус `loaded`; загружены `44/44` изображений главной и `9/9` изображений Corvo.
- Console errors, hydration warnings, asset failures и горизонтальный overflow не обнаружены.

## Артефакты

1. `01-home-top.png`
2. `02-home-sticky.png`
3. `03-corvo-top.png`
4. `04-corvo-sticky-header.png`
5. `05-corvo-floating-bar.png`
6. `06-corvo-inline-transition.png`
7. `07-reduced-motion.png`
8. `08-bar-motion-000ms.png`
9. `09-bar-motion-150ms.png`
10. `10-bar-motion-370ms.png`

Статус остаётся `READY_FOR_USER_REVIEW`; ручная приёмка пользователя не заменена автоматической проверкой.
