# Project title blocks — acceptance
Дата: 2026-10-04. Base: 270e82f7a3a9c638120d305506873350d90074c0.
Scope: только вводный блок с названием и действиями Corvo/Sarafan в Concept V2.
Source: Concept V2 / Основа, Corvo 4332:726757, Sarafan 4332:731803. Полные design context и скриншоты источника прочитаны, compact structure и skin states сохранены в figma-source.json.

## Fidelity/completeness review
Check — оба instance используют ProjectTitleBlock; все непосредственные элементы: tags/dots/year divider, logo, name, status, description, action frame, Copy и Figma.
Check — intro 216px; workarea 1280px, top48/bottom36, gap24; heading left36/right40; description left68; action frame 52px, padding8/gap8/radius12.
Check — настоящий library ControlButton Ghost Medium + Fill Neutral Medium, внутри-frame strokes не увеличивают размер.
Check — все цвета source по конкретной привязке, включая action background #1b1d1f и year #adb3b8; Figma icon наследует icon role, а не label role.
Check — Copy/Figma Enable/Hover/Press. Fill без stroke во всех состояниях; Ghost hover/press используют source border.
Check — Corvo B2B сохраняется как явное пользовательское исключение к B2B2C в source.
Размеры/координаты в runtime.json: обе action группы и кнопки совпадают; ширина 296.078125 вместо округлённых 297 в Figma — менее 1px из-за метрик browser font, без фиксации ширины Copy. Figma91×36, frame52.
Скриншоты итогового браузера1440×900: corvo.png, sarafan.png, corvo-copied.png.

## Regression/scope review
Check — морф stroke1.3 fillnone и текущие springs не менялись; Figma hover → arrow сохранён.
Check — успешное копирование, повторное нажатие с перезапуском2000ms, cleanup/unmount/error и reduced-motion сохранены.
Check — измерение rAF при копировании обеих страниц: ширина меняется постепенно, right=1320 во всех записанных кадрах; Corvo возвращается к «Копировать ссылку».
Check — страницы/ссылки/hero/scenes/Experience/Lenis/preloader/contact/shared main header вне diff.
Check — общий компонент исключает расхождение верстки между проектами. Старые duplicate title selectors и copy implementations удалены; unrelated selectors сохранены.
Check — 210/210 focused suite, lint94 source files, production build567 modules, git diff --check.
Работа выполнена в redesign worktree; соседний чат, его ветки и worktree не затрагивались.
