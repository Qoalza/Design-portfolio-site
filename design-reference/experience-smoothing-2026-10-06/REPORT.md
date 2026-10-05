# Сохранение собственной плавности Experience

2026-10-06. База d0b31919bd655a40759ac29023742539953b4829, worktree codex/redesign-portfolio. MEDIUM / ELEVATED / OPTIMIZED. Только локальный Concept V2 wheel owner; компактная геометрия, travel, blur, reset, gate timings и соседние ветки не менялись.

## Подтверждённая ошибка

При prefers-reduced-motion:reduce конструктор устанавливал smoothWheel=false всему Lenis, включая защищённую область опыта. Browser reproduction внутри опыта: handling=smooth, isScrolling=native, animate.isRunning=false. Это подтверждённый путь отключения сохранённой плавности; предпочтение на пользовательском Arc/Zen напрямую не измерялось.

## Исправление

Experience сохраняет smoothWheel=true, lerp=.1, wheelMultiplier=1 независимо от общей политики. Обычные области с reduced motion всё ещё нативные; anchor transitions immediate. Остановленный Lenis всегда получает остаток wheel stream и отменяет его default, даже если профиль обычного скролла выбрал native.

## Итоговые проверки

- npm run check: lint PASS, 229/229 tests PASS, Vite build PASS (прежнее предупреждение размера bundle).
- В собственной вкладке с emulated reduced motion параметры true/.1/1; один impulse 120.5 px запускает smooth animation. По 8 RAF кадрам scrollY постепенно проходит 3052 → 3091.5 при target=3172.5, вместо мгновенного перехода.
- В обычном режиме аналогичный импульс проходит постепенно 3052 → 3106 за 12 RAF кадров, target=3172.5. Подробная запись frames.json. Перед импульсом закончены кадры позиционирования, чтобы проверить анимацию внутри опыта, а не тестовый programmatic overshoot на входе.
- Обычная область при precision input: native/defaultPrevented=false. После stop: smooth/defaultPrevented=true. Остаток жеста не проскакивает через stop.
- Compact layout не изменялся. Пользователь принял его; мышь пользователь проверит позже.
- Media override сброшен; диагностическая вкладка перезагружена после проверки. Пользовательские окна не управлялись. Production не менялся.

## Review

Fidelity: собственная кривая схемы восстановлена, альтернативная скорость/новый коэффициент не добавлены.
Regression/scope: общий native policy и reduced-motion anchors сохранены; root wheel owner остаётся единственным; остановка имеет приоритет над bypass; геометрия и уже исправленный сброс не затронуты.
