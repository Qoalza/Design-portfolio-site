# Приёмка оболочки проектов — 2026-10-04

База:6b310bd; codex/redesign-portfolio. Проверен итоговый runtime4193, viewport1440×900.

| Требование | Статус | Прямое доказательство |
|---|---|---|
| Сараффан: описание, правильный фон и боковой пунктир | Check | Figma parent4332:731802 Faint#141617; summary4332:731899 dash16/16. runtime.json: summary488px, inner486px, bg20/22/23, gradient16/16. sarafan-description.png |
| Нет линии между шапкой и крошками обоих проектов | Check | Figma4332:731794/4332:726748: только нижний stroke. Runtime: header border0, shadow none; crumbs нижний1pxThin |
| Сараффан: правильный фон названия | Check | inherited Faint#141617; runtime intro bg20/22/23,216px. sarafan-top.png |
| Corvo: Главная не выбрана | Check | runtime selected0 на обеих страницах; corvo-top.png |
| Нет скачка общей шапки и разных иконок | Check | identicalHeader=true, identicalRects=true; общий ProjectSiteHeader. brand191,nav97/76/133,CTA121. LightLock/Telegram trueSVGstroke1,currentColor,non-scaling; masks0 |

Смежная сверка:
- Corvo root4332:726747: фон#17191a; исправлен прежний#16191a.
- Сараффан: flow392px; media1016px; receiving817px; result465px; footer61px. Фоны flowBgMain, result/footerFaint. Высота страницы4616px совпадает с источником.
- Corvo6357px. После закрепления и возврата обе высоты неизменны; headerY0,crumbY80, floatingpositionfixed → static.
- Все проверенные изображения загружены; проектные ссылки и цветные логотипы сохранены.
- True centerlines взяты из exactFigmaVector; duotoneLock сохраняет исходный fill0.2. Source и transforms в figma-source.json.
- Уточнение Border/Thin применено на обычном хедере главной; на проектах нижняя линия находится под крошками. Дополнительной линии внутри общей оболочки нет.

Review1 fidelity/completeness: проверены все5 требований и цепочки наследования fills. Найдены и исправлены outlinedLock, maskedTelegram и rootCorvo.
Review2 regression/scope: проверен итоговый diff; не менялись Hero, Experience/Lenis/reset, preloader, morph605/36, copywidth, ссылки, настройки contactmotion. Sharedheader preserves80px, shell145px и travel150ms. Соседний checkout/ветка не затронуты.

Итоговые проверки:210/210 tests; lint92files; build565modules; diff--check.
Снимки и runtime относятся к финальному коду после последнего изменения.
