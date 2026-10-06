# Corvo: единые параметры боковой штриховки

Дата 2026-10-06. База 3a29b5b. Только codex/redesign-portfolio; production и соседние ветки не менялись.

Причина: боковой фон CSS повторял линии под прозрачным SVG 79×52; у продолжения был период 12 px, тогда как остальные штрих-блоки Corvo используют 15 px. При наложении менялись плотность и видимая толщина, слева и справа.

После уточнения пользователя принят один паттерн с параметрами остальных блоков Corvo: repeating-linear-gradient 126.87deg, transparent 0–10 px, Thin 10–11 px, transparent 11–15 px. SVG-слой topbar-hatch удалён из обоих callsites, исходный файл сохранён. Разделители SVG 1×52 сохранены. Нижний пунктир распространяется на всю ширину поля, кроме 1 px разделителя. Ruler/resize SVG, сцены, motion, остальные блоки и scroll не менялись.

Проверка: own Chromium runtime 1717×1000, оба computed backgrounds совпадают с параметрами caseHatch/scenarioHatch; нет topbarHatch; единственное изображение в каждом поле — исходный 1 px separator. Визуально проверены обе стороны, равномерная толщина и шаг без наложения. При 1440×1000 верхняя панель остаётся 52 px. Временный viewport сброшен.

npm run check: lint PASS, tests 230/230 PASS, build PASS (прежнее предупреждение bundle size). Screenshot итогового состояния corvo-topbar.png.

Review: source parameters соответствуют существующим Corvo case/scenario hatches и явному уточнению пользователя. Scope ограничен topbar CSS/markup; размеры центральной композиции, tabs, active underline, dotted baseline и интерактивная оболочка сохранены.
