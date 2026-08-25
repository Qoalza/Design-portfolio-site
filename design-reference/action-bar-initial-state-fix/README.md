# Project action bar initial-state fix

Статус: `READY_FOR_USER_REVIEW`

Runtime `CODE_SHA`: `4a59f8cfd9c61ca710f9a39942303356d99bf5f3`

Маршрут: `/projects/corvo`

## Подтверждённая причина

На прежнем runtime `62152793e8a7d501209f9ed8a257636ef846bcce` при `1440×999`, `scrollY=0` начало information layout находилось на `902 px`, верх action bar — на `911 px`, а реально видимая часть information layout составляла только `97 px`.

Bootstrap и initial resolver считали `Adaptive` уже при пересечении начала information layout с линией action bar. Steady-state resolver использовал другой контракт — не менее `200 px` видимой information-области — и после первых пикселей scroll исправлял состояние на `Full`. Расхождение двух geometry thresholds было непосредственной причиной дефекта. Полные измерения сохранены в [root-cause.json](root-cause.json).

## Исправление и regression guard

- bootstrap, initial resolver и steady-state resolver используют общий нормализованный geometry contract;
- менее `200 px` → `Full`, ровно `200 px` и более при активной information-области → `Adaptive`;
- после information layout и в Gallery сохраняется `Full`;
- первый вариант устанавливается до пользовательски видимого кадра без timer, принудительного mount-state, искусственного scroll-event, сокрытия bar или глобального отключения transition;
- `tests/project-action-bar-initial.browser.mjs` проверяет direct URL, hard reload и реальный client navigation и фиксирует первые физические кадры. До исправления guard получал `Adaptive` при низком viewport; после исправления получает `Full` без blank-frame и layout shift.

## Технические проверки

- focused tests: `15/15` PASS;
- `npm run lint`: PASS;
- production build с `NEXT_PUBLIC_BUILD_SHA=4a59f8cfd9c61ca710f9a39942303356d99bf5f3`: PASS;
- фактически отданный HTML содержит полный `data-build-sha="4a59f8cfd9c61ca710f9a39942303356d99bf5f3"`.

## Chromium

Browser: Codex in-app Chromium, Chrome `151.0.0.0`.

- direct URL / hard reload / client navigation: `9/9` PASS для low `1440×999`, boundary `1440×1102` и high `1440×1200`;
- low: `97 px` → первый видимый `Full`;
- boundary: `200 px` → первый видимый `Adaptive`;
- high: `298 px` → первый видимый `Adaptive`;
- six-viewport matrix: `6/6` PASS (`1280×720`, `1440×900`, `1440×999`, `1440×1200`, `1440×1356`, `1920×1080`);
- threshold: `199.5 → Full`, `200 → Adaptive`, `200.5 → Adaptive`;
- Gallery/terminal: `Full`, gap `48 px`, стабильный `scrollHeight`;
- console: без ошибок и предупреждений.

Машиночитаемый результат и screenshots: [chromium/results.json](chromium/results.json), каталог `chromium/`.

## Zen / Gecko

Browser: Zen `1.21.15b`, build `126.8.18`, Gecko/Firefox UA `154.0`.

- direct URL / hard reload / client navigation: `9/9` PASS на тех же low/boundary/high состояниях;
- первые физические кадры имеют правильный variant, opacity `1`, visibility `visible`, без attributable layout shift;
- six-viewport matrix: `6/6` PASS;
- threshold: `199.5 → Full`, `200 → Adaptive`, `200.5 → Adaptive`;
- Gallery/terminal: `Full`, gap `48 px`, стабильный `scrollHeight`;
- console: без ошибок и предупреждений.

Машиночитаемый результат и screenshots: [zen/results.json](zen/results.json), каталог `zen/`.

## Scope boundary

Внутренний layout action bar, Tooltip, Gallery, lightbox, project tags и CTA не изменялись. Figma не изменялась. Merge и deploy не выполнялись.
