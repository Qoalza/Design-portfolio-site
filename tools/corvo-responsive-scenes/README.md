# Corvo responsive scenes

Локальный статический reference-пакет утверждённых Corvo-сцен. Он не подключён
к Portfolio runtime и не использует зависимости проекта. Рабочая версия всех
сцен использует Manrope из Google Fonts.

## Запуск

```text
node tools/corvo-responsive-scenes/serve.mjs --port 8766
```

Рабочие сцены: `http://127.0.0.1:8766/authorization/`,
`http://127.0.0.1:8766/media-campaigns/`,
`http://127.0.0.1:8766/my-space/` и
`http://127.0.0.1:8766/statistics/`.

Manrope загружается весами 400, 500 и 600 с `display=swap`. У рабочих HTML и
CSS нет ссылок на TT Norms Pro или локальные font-файлы.

## Передача в интеграцию

Порядок переноса в продукт, границы и проверки описаны в
`INTEGRATION_HANDOFF.md`. Соответствие Figma и локальных участков хранится в
`SOURCE_MAP.md`.

Эталонные viewport: Desktop 1600 × 960, Tablet 744 × 1100, Mobile 360 × 640. Проверяйте responsive-режим изменением ширины viewport, а не browser zoom. 1600px — стартовый эталон для desktop-предпросмотра, а не максимальная ширина.

Диапазоны плана остаются прежними: Mobile 360–599px, Tablet 600–1279px,
Desktop 1280px и шире без верхнего ограничения. Исходный desktop-фрейм имеет размер 1600 × 960, а реализация остаётся резиновой при более широком viewport.

## Архив TT Norms Pro

Предыдущая реализация сохранена в `archive/tt-norms/` только как исторический
reference и не раздаётся локальным сервером. Она не является частью рабочей
версии и не должна переноситься в Portfolio. Локальные лицензированные
font-файлы находятся в игнорируемой Git папке
`archive/tt-norms/local-fonts/`.

Manrope остаётся единственной активной версией. Архив TT Norms синхронизирован
с ней только по responsive-геометрии: Mobile 360–599px, Tablet 600–1279px,
Desktop 1280px и шире без верхнего ограничения, исходный desktop-фрейм 1600 × 960.
