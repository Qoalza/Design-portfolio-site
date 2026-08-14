# Site refresh v2 — visual QA

Статус: `READY_FOR_USER_REVIEW`

## Эталон

- Главная: Figma node `262:2382`, свежий export `1440 × 6018 px`.
- Corvo: Figma node `373:47103`, свежий export `1440 × 4007 px`.
- Общий футер: Figma node `378:50597`, `1200 × 60 px`.
- Контрольный viewport: `1440 × 900`, масштаб браузера `100%`.
- Внешний desktop-shell: `1280 px`, центрирован; внутренний контент и футер: `1200 px`.
- Адаптив ниже `1280 px` в этот этап не входит.

Свежие Figma-экспорты проверены в текущей сессии напрямую. Production-реализация зафиксирована секционными кадрами, потому что full-page capture встроенного браузера некорректно обрабатывает ленивые изображения.

## Проверенные области

### Главная

- `home-top-production.png` — header и hero.
- `home-projects-production.png`, `home-cards-production.png` — проекты и состояния действий.
- `home-process-production.png`, `home-process-end-production.png` — процесс и актуальный ассет.
- `home-ai-production.png` — AI-блок и статичный факт.
- `home-resume-production.png` — резюме и типографика стажа.
- `home-footer-production.png` — общий футер.

### Corvo

- `corvo-top-production.png` — header, toolbar, breadcrumb и hero.
- `corvo-about-production.png`, `corvo-task-production.png`, `corvo-process-production.png`, `corvo-result-production.png` — статья и изображения.
- `corvo-footer-production.png` — общий футер.

## Технические подтверждения

- Реальные размеры viewport: `1440 × 900`.
- Горизонтальное переполнение: отсутствует на главной и Corvo.
- Onest variable font загружен; основной текст Corvo имеет фактический вес `350`.
- Corvo back control: `32 × 32 px`, позиция `x=144`, `y=104`.
- Общий футер: `1200 × 60 px`, позиция `x=120` при viewport `1440 px`.
- Console errors, warnings и hydration warnings в production: отсутствуют.
- `npm run lint`: passed.
- `npm run build`: passed.

## Граница этапа

Нижняя плавающая плашка открытого проекта, sticky-header, `/projects`, страницы ошибок, адаптив и deploy относятся к следующим этапам и не реализованы.
