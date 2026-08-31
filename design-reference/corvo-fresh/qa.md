# Design QA — Corvo (актуальный Figma)

## Контрольная среда

- Source visual truth: `design-reference/corvo-fresh/figma-full.png`, свежий экспорт Figma node `321:29865` от 2026-08-12.
- Browser-rendered implementation: `design-reference/corvo-fresh/implementation-1440.png`.
- Viewport: `1440 × 900 CSS px`, zoom `100%`, `deviceScaleFactor: 1`.
- Source pixels: `1440 × 3913`; implementation pixels: `1440 × 4233`.
- Состояние: desktop, светлая тема, web fonts загружены, горизонтального переполнения нет.

## Доказательства сравнения

- Полный вид: `design-reference/corvo-fresh/comparison-1440.png`.
- Шапка, breadcrumbs, back и hero: `design-reference/corvo-fresh/comparison-header.png`.
- Секция процесса и свежая схема: `design-reference/corvo-fresh/comparison-process.png`.
- Открытый горизонтальный lightbox: `design-reference/corvo-fresh/lightbox-process.png`.
- Открытый крупный interface lightbox: `design-reference/corvo-fresh/lightbox-result.png`.
- Проверка отсутствия регрессии главной: `design-reference/corvo-fresh/home-regression-1440.png`.

## Обязательные поверхности fidelity

- Fonts and typography: header «Главная» — Google Sans `14/20`, tracking `0.42 px`; breadcrumbs — Google Sans Regular `16/20`, tracking `0.2 px`; Desktop/Mobile — Onest Regular `14/20`, tracking `-0.1 px`. Computed styles подтверждены в браузере.
- Spacing and layout: shell `1200 px`; back `44 × 40 px`; расстояние back → breadcrumbs `24 px`; breadcrumbs gap `12 px`; platform icons `20 × 20 px`, вертикальный separator `1 × 20 px`. Высота реализации больше Figma на `320 px` из-за уже существующего расширенного текста MDX, который текущая задача запрещает менять.
- Colors and tokens: neutral header icon `#656769`, header text `#202931`, breadcrumbs `#415e74/#a7b1b8`, back `#f5f6f7/#415e74`, platforms `#75848f`, separator `#e1e8ed` взяты из свежего design context.
- Image quality and asset fidelity: новый оригинальный `process-flow.png` (`1960 × 546`) и свежие SVG Desktop/Mobile сохранены локально; временных Figma URL в production-коде нет. Схема сохраняет crop Figma.
- Copy and content: текст и порядок секций не менялись.

## Интерактивная проверка lightbox

- Все четыре `ProjectMedia` открываются отдельными кнопками с доступными именами.
- Клик по увеличенному изображению не закрывает overlay.
- `Escape` закрывает overlay; клик по свободному фону закрывает overlay.
- При открытии `html` и `body` получают `overflow: hidden`; scroll position остаётся прежней.
- После закрытия overflow восстанавливается, фокус возвращается на исходную кнопку без прокрутки.
- Dialog использует `role="dialog"`, `aria-modal="true"` и доступное название.
- Console errors и hydration warnings: `0`.

## История итераций

1. RED: header home имел активную плашку; breadcrumbs были `20/24`; back имел рамку; platforms содержали `/`; production process asset отличался от свежего Figma; lightbox отсутствовал.
2. GREEN: применены свежие размеры/цвета/ассеты, `/` удалён из DOM, добавлен общий клиентский lightbox для `ProjectMedia`.
3. Функциональная итерация выявила несовместимость native `<dialog>` с тестовой Browser-средой; реализация заменена на доступный fixed overlay с dialog semantics, блокировкой scroll и восстановлением фокуса.
4. Повторное полное и фокусное сравнение: новых actionable P0/P1/P2 расхождений нет. Ожидаемая разница длины страницы относится к защищённому текущей задачей тексту.

## Findings

- P0: нет.
- P1: нет.
- P2: нет.
- P3: высота страницы отличается из-за более полного неизменяемого MDX-текста.

final result: passed
