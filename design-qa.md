# Design QA — Corvo

## Контрольная среда

- Source visual truth: `design-reference/corvo/figma-full.png`, Figma node `321:29865`.
- Browser-rendered implementation: `design-reference/corvo/implementation-1440.png`.
- Локальный маршрут: `/projects/corvo?review=working`.
- Viewport: `1440 × 900 CSS px`, zoom `100%`, `deviceScaleFactor: 1`.
- Source pixels: `1440 × 3917`.
- Implementation pixels: `1440 × 4237`.
- Нормализация плотности: оба кадра записаны в масштабе `1:1`; дополнительный downsample не применялся.
- Состояние: desktop, светлая тема, web fonts `loaded`, горизонтальное переполнение `0 px`.

## Доказательства сравнения

- Полный вид: `design-reference/corvo/comparison-1440.png`.
- Header, hero и «О проекте»: `design-reference/corvo/comparison-focus-top.png`.
- «Процесс»: `design-reference/corvo/comparison-focus-process.png`.
- «Результат»: `design-reference/corvo/comparison-focus-result.png`.

Фокусные сравнения нужны, потому что в полном кадре недостаточно читаемы типографика, точные отступы, crop схемы и интерфейсные изображения.

## Обязательные поверхности fidelity

- Fonts and typography: загружены локальные Google Sans, Onest и Source Code Pro; диапазоны `400 500`, `font-synthesis: none`; размеры, line-height и tracking соответствуют Figma. Основной текст после итерации использует точный более светлый цвет `#5c6a77`.
- Spacing and layout: shell `1200 px`, основной поток `776 px`, media `720 px`; контрольные точки hero, заголовков, текста и изображений совпадают с эталоном. Реализация длиннее источника на `320 px`, потому что актуальный MDX содержит дополнительные утверждённые абзацы и пункты; контент не урезан.
- Colors and tokens: фон, основные, вторичные, action и border-цвета сопоставлены с Figma. Известные Figma/WCAG-конфликты малых метаданных записаны в `ACCESSIBILITY_EXCEPTIONS.md`.
- Image quality and asset fidelity: логотип, иконки, схема и три интерфейсных изображения выгружены из Figma и сохранены локально; замены CSS-art, inline SVG или placeholder-графикой отсутствуют.
- Copy and content: актуальный `content/projects/corvo.mdx` является источником текста; frontmatter и все четыре секции отображаются полностью.

## История итераций

1. Первый полный comparison выявил два P2: content media были сдвинуты на `8 px` вправо, а у process-flow появился отсутствующий в Figma внешний border/radius. Исправлено: секционный padding приведён к `16 + 8 px`, у flow удалены внешний border, radius и background.
2. Повторное фокусное сравнение выявило P2 по visual weight: body и display headings выглядели темнее источника. Исправлено: body приведён к `#5c6a77`, display headings — к `#203749`.
3. Финальные `comparison-1440.png` и три focus-comparison проверены повторно. Actionable P0/P1/P2 расхождений не осталось.

## Функциональная и техническая проверка

- Основной маршрут, back/home и Figma URL присутствуют и семантически корректны.
- «Поделиться» — нативная кнопка с Web Share API и copy fallback; результат объявляется через `aria-live`.
- Один `h1`, последовательные `h2`, `html[lang=ru]`, описательные alt у всех четырёх content images, видимый `:focus-visible` и skip-link.
- Console errors: `0`.
- Production route smoke: `/projects/corvo` вернул title, `Corvo`, «О проекте» и «Результат».
- `npm run lint`: passed.
- `npm run build`: passed.

## Findings

- P0: нет.
- P1: нет.
- P2: нет.
- P3: полная высота отличается от Figma из-за более полного актуального текста; это ожидаемое контентное отличие, а не visual regression.

final result: passed
