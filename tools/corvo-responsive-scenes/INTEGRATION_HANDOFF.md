# Corvo integration handoff

## Что утверждено

Пользователь вручную проверил и утвердил четыре responsive-сцены Corvo:
Authorization, Media Campaigns, Media Items и Statistics. Канонические сцены
используют Manrope из Google Fonts и находятся в `site/`.

| Сцена | Рабочий маршрут | Source |
| --- | --- | --- |
| Authorization | `/authorization/` | `site/authorization/` |
| Media Campaigns | `/media-campaigns/` | `site/media-campaigns/` |
| Media Items | `/my-space/` | `site/my-space/` |
| Statistics | `/statistics/` | `site/statistics/` |

Эталонные viewport: Desktop 1440 × 960, Tablet 744 × 1100, Mobile 360 × 640.
Диапазоны: Mobile 360–599px, Tablet 600–959px, Desktop 960px и шире.

## Как использовать пакет

Статические страницы — утверждённый визуальный и responsive-контракт, а не
готовый для буквальной вставки компонент приложения. При интеграции перенести:

- структуру компонентов и порядок блоков;
- responsive CSS и breakpoint-правила;
- локальные SVG/PNG-ассеты из `site/assets/`;
- поведение графиков, таблиц, фиксированных колонок, clipping и pagination;
- состояния rail-навигации, tabs и controls;
- Manrope 400/500/600 с эквивалентной стратегией `display=swap`.

Сохранять реальные данные, роутинг, семантику компонентов и технологический
стек целевого приложения. Не заменять SVG самодельными CSS-иконками и не
растягивать source-specific графики между адаптивами.

## Что не переносить

`archive/tt-norms/` — только исторический локальный reference. Он не является
частью рабочей версии, не раздаётся сервером и не создаёт font dependency для
Portfolio. Локальные TT Norms-файлы игнорируются Git.

Не менять Figma, shared project contract, Admin или production в рамках
интеграции этих сцен без отдельного согласования.

## Источники и проверки

- Figma-to-code mapping: `SOURCE_MAP.md`.
- Полная история решений и ручной приёмки:
  `../../docs/exec-plans/corvo-responsive-scenes.md`.
- Локальный запуск: `node tools/corvo-responsive-scenes/serve.mjs --port 8766`.
- Контракт шрифта: `node tools/corvo-responsive-scenes/test-font-contract.mjs`.
- Полная focused-проверка:

```text
node tools/corvo-responsive-scenes/test-font-contract.mjs
node tools/corvo-responsive-scenes/test-responsive-contract.mjs
node tools/corvo-responsive-scenes/test-media-campaigns.mjs
node tools/corvo-responsive-scenes/test-my-space.mjs
node tools/corvo-responsive-scenes/test-statistics.mjs
node --check tools/corvo-responsive-scenes/serve.mjs
```

После переноса проверить все четыре сцены на 360px, 744px и 1440px, отсутствие
горизонтального overflow у root frame и отсутствие ошибок в console.
