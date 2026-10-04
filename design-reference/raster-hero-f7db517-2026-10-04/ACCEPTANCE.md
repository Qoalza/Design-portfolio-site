# Raster Hero f7db517 — acceptance
2026-10-04. Base redesign52d174d; source f7db5171be80ba4c045328d4ed3c5a842f6ad5b2.
Source выбран пользователем вместо шаблона Figma. Source — последний найденный commit для ProjectRasterHero. Он отменяет эксперимент whole-card depth handoff; перенесено его итоговое дерево, а не только revert patch.
Check: ProjectRasterHero.jsx/CSS, raster-carousel, raster-variants, variants preview и оба raster tests совпадают с source.
Check: package.json/lock совпадают с source, carousel1.0.14, resize-detector override12.3.0; зависимости установлены offline без scripts. Публичный Next.js package не менялся.
Check: tooltip.css совпадает с source — description12/16, calt0, word-breakbreak-word. Tooltip.jsx/позиционирование совпадали изначально; title14/16 и механика сохранены.
Check: браузер Сараффан — Next: Главная → Настройка выбранного варианта; Prev: обратно; точка: Настройка доставки; нажатие на открытую боковую карточку: Настройка выбранного варианта. Все изображения decoded; clip-pathnone.
Check: preview3/5/7; для5 и7 видимых точек5. Стрелка7 меняет центральный кадр. TooltipTablet computed12px/16px,calt0,break-word,opacity1.
Check: fidelity/completeness review — точные source files + нужные зависимости, initial centered home, новые штатные shades/shadows; не добавлена собственная анимация.
Check: regression/scope review — timercleanup/contextreset/reducedmotion source сохранены; Corvo adaptive Hero, ProjectTitleBlock, main header, Experience/Lenis/preloader/morph/contact/links вне diff. Shared Tooltip изменён только в типографике description согласно уточнению пользователя.
Check:204/204tests,lint94,build999modules,gitdiff--check.
Tests count уменьшился210→204 из-за замены проверок удалённого кастомного carousel на source tests новой карусели. Foundation изменён только под pinneddependencies; другие source отличия foundation не переносились.
Соседние ветки/worktrees не открывались и не изменялись; чтение только Git objects указанного commit.
