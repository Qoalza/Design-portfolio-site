# Итоговая приемка страниц проектов

2026-10-04. Локальный runtime4193, viewport1440×900.
Исходная база37c64cf; исправления81c2a65, fba77e3 и локальное уточнение фоновой привязки Сараффана, включенное в финальный commit.

| Требование | Итог | Прямое доказательство |
|---|---|---|
| Белая Figma в метриках Corvo | Check | `corvo-metrics.jpg`; computed background rgb(214,220,224); Fill Neutral; источник4332:731621 |
| Одна линия Thin под hatch Corvo | Check | `corvo-result.jpg`; hatch bottom0, result top1 rgb(31,34,36) |
| Хедер движется вместе с крошками на обоих проектах | Check | На обеих страницах после прокрутки header top0, crumbs top80, slot145; по возврате наверх surface static, intro top145. Высота документа не меняется: Corvo6357, Сараффан4616 |
| Крошки и цветной логотип Сараффана | Check | `sarafan-top.jpg`; frame logo16, intro logo44; compact Ghost с label и точными inset/gap; источник4332:731794 |
| Intro Сараффана | Check | `sarafan-top.jpg`;216px, flag16, subtitle Secondary, actions container; источник4332:731803 |
| Описание и уведомление | Check | `sarafan-summary.jpg`;488px, copy984px, paragraphs48/72/48 с gaps24, weight350 Muted; notice1000px padding20, icon20 stroke1.3px currentColor rgb(120,128,135), fill:none и non-scaling-stroke |
| Фон описания / результата | Check | summary прозрачный, наследует root#17191a; result#141617. Read-only Figma проверка exact root4332:731793: RGB .089/.09725/.1; result4332:731985 RGB .07937255/.08658824/.09019609. Общий токен главной/Corvo не изменялся |
| Сценарий и media | Check | `sarafan-flow.jpg`;flow392px, media1016px, canvas1176px, source image1047×860 at62/70; рабочая ссылка projectLinks.sarafanFlow |
| Получение и состояния | Check | `sarafan-receiving.jpg`;817px, 936px copy, headings24/32, текст16/24/350 без paragraph gaps; один внутренний separator |
| Штрих и результат Сараффана | Check | `sarafan-result.jpg`;88px и465px; hatch bottom0, result top1 Thin; source4332:731985 |
| Footer | Check | `sarafan-result.jpg`;61px, icon16, font12/14 #788087; source4332:731991 |
| Принятая image/grid Hero сцена | Check / исключение | ProjectRasterHero и definition не имеют diff относительно37c64cf; wrapper928px |
| Копирование и morph | Check | Corvo click: «Скопировано», right1324; после feedback возвращается «Копировать ссылку», right1324; SVG fill:none/stroke1.3. Компоненты morph и их spring605/36 не изменены |

Все rendered images загрузились: complete=true, naturalWidth>0. Только локальные действия; внешние ссылки проверены по href без открытия/отправки данных.

## Review 1 — fidelity / completeness

Сопоставлены все значимые секции Сараффана с полученными design context и metadata; проверены видимые children, geometry, typography, colors и assets. Обнаружен Telegram-placeholder из Figma в слоте проектного logo: по прямому требованию пользователя сохранен существующий цветной RadioSymbol. Первичный layout CSS дефект найден локальной проверкой и исправлен до приемки. В исходнике Hero остается только утвержденное исключение для image/grid сцены.

## Review 2 — regression / scope

Проверены diff и lifecycle ProjectHeaderShell: измеряемый порог, стабильный shell, coalescing через createFrameTask, очистка ResizeObserver/listeners/timer, 150ms enter/exit как у главной, reduced-motion. В этом проходе уточнен root фон Сараффана по его фактической Figma привязке, локальный override распространяется на floating surface.

Подтвержден пустой diff37c64cf для App, Experience, project-hero, morph-icon, smooth-scroll, preloader, contact-motion и project-links. Главная открыта в runtime: Hero и Experience присутствуют, Inktech сохранен, first-view images загружены. Соседние ветки/checkouts не читались и не изменялись.

Итоговые проверки после последней CSS правки:210/210 tests, lint90, production build PASS; git diff --check PASS. Предупреждение Vite о размере общего bundle остается прежним и не относится к этим исправлениям. Tests преимущественно проверяют контракты источников; визуальная приемка и scroll-return проверены отдельно в реальном браузере.
