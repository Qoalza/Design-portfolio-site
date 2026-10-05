# Experience: адаптив и входной стоппер

Дата: 2026-10-06. Локальный Concept V2, worktree codex/redesign-portfolio.
База: b0ec4de4c50dd9fe5b557cd1de842cd55637c6f5. Изменения и evidence принадлежат одному коммиту.
Область: PORTFOLIO / Concept V2; MEDIUM, ELEVATED, OPTIMIZED. Одна Git-группа.
Production, соседние ветки, Hero, контент, зависимости и Admin не менялись.

## Причины и исправления

- Режим композиции выбирался без объявленного резерва хедера 80 px. Теперь 1011 и 1078 px используют компактный вариант; его прежние размеры, inset, scale и скрытие полосы сохранены.
- Boundary-capture не обновлял timestamp. Следующий импульс сравнивался с событием до захвата. Теперь используется timestamp события захвата; поздний захват в paint использует текущее время.
- Правила возобновлённого жеста тачпада (48 ms / рост импульса) применялись к дискретным мышиным импульсам. Теперь мышь удерживается до существующего idle-arm 120 ms. Настройки тачпада сохранены.
- Отсутствие общего Lenis при ширине <1280 или reduced motion удаляло владельца стоппера. Fine-pointer owner теперь остаётся; обычные области в этих режимах нативные. При reduced motion отключены сглаживание колеса и анимация перехода по якорю.
- Граница защищённой области проверялась сырым deltaY, хотя Lenis передаёт нормализованные пиксели. Проверка теперь использует нормализованный deltaY и корректно работает для line/page событий.

## Проверки итогового состояния

- npm run check в tools/concept-v2/app: lint, 228/228 tests, Vite build PASS. Осталось прежнее предупреждение Vite о размере bundle.
- Собственная Chromium-вкладка, viewport 1369×1078: компактный режим, progress display:none, заголовок ниже хедера. Screenshot compact-1369x1078.png.
- Пять доверенных CDP mouseWheel импульсов deltaY=120 с промежутками 60 ms: все пять holding, scrollY=3210, progress=0.0000. Запись mouse-entry-trace.json. После паузы следующий импульс released и прогресс увеличивается.
- Viewport 1728×1011: компактный режим и отсутствие полосы подтверждены.
- Viewport 1279×1011: boundary wheel удерживает holding / progress=0.0000.
- Emulated prefers-reduced-motion:reduce: owner существует, smoothWheel=false, boundary wheel удерживает holding / progress=0.0000.
- Synthetic line-mode WheelEvent deltaY=6 нормализуется существующим Lenis в 100 px: при расстоянии 80 px до границы захват holding на sectionTop. Это проверка обработки единиц, не эмуляция физического устройства Firefox.
- После полного прохода: progress=1, высота=1078; выше завершённой секции: progress=0, reached=0, все stroke-dashoffset=1, полная высота=9887. Повторный boundary wheel: holding, progress=0, reached=0.
- /projects/sarafan-radio: переданные в существующий owner точные события выбирают trackpad/native, line-mode события mouse/smooth. Mount над всеми маршрутами дополнительно защищён тестом.
- Временные viewport/media overrides сброшены; диагностическая вкладка перезагружена. Пользовательские Arc/Zen не управлялись. Проверка выполнена на сопоставимых размерах в собственной вкладке; нативные окна этих браузеров не проверялись напрямую.

## Review

Fidelity/completeness: исправлены заявленные режимы, отступ и скрытие полосы; исходный путь 2047 px, вертикальный travel 9690/1.1, blur/masks и правила визуального сброса не изменены.
Regression/scope: root остаётся единственным wheel owner на всех маршрутах; native upward handoff и 160 ms delayed geometry rearm сохранены; reduced-motion anchors остаются immediate; listeners/timers освобождаются; новых зависимостей и production mutations нет.
