# Локальная автоматическая приёмка разделения

Дата: 2026-10-06. Проверенный code candidate: `7d6767607d12dd3e0b4d42f9a02ee54fc00ec66f`.
Перед сборками, упаковкой и проверками checkout был чистым. Этот отчёт фиксирует
именно указанный candidate; последующий documentation commit не является новым
проверенным runtime. Production не переключён; G1–G6 ещё не приняты полностью.

## Артефакты

| Идентификатор | Значение |
| --- | --- |
| Portfolio artifactSha256 | `905792ade88d5ab8ef62fd0b435a541542848da3e8773e077a4b446c1807f7da` |
| CMS artifactSha256 | `d1f9a05edf99bce88d9ccd3447332817de28690d72ed41a28da517f734b8584a` |
| rendererId | `e4ceea6c47ad3ea86db69bc125cd2a1506236d5497371a4f0361d510356f31b6` |
| Portfolio archive SHA-256 | `1a6b67c535eabb5e4f7b28be67ee80b68e266d3dd0b8d4d28a8a5280975525f8` |
| CMS archive SHA-256 | `ae0ee4ecaef6da9c085be1406d07de088960b205ef5ed0efe95189f1909744ba` |

CMS — macOS arm64/Node 22 fixture, `productionEligible: false`. Это не Linux release.
Архивы содержат code-only приложения. БД, uploads, drafts, accounts, secret и
publication/preview state не входят в артефакты или этот отчёт.
Локально сохранены в `/private/tmp/des-art-payload-test-final-code-artifacts-r4fDSB`;
это временное хранилище, его наличие после очистки OS-temp не гарантируется.

## Автоматические проверки

- `npm run portfolio:build`, `npm run cms:build`: PASS.
- `separation:test -- --browser-review`: полный headless этап PASS, затем ограниченный
  браузерный этап; wrapper завершился с exit 0 и удалил собственные fixtures.
- Renderer suite: 231/231; root/CMS lint и строгие CMS types: PASS.
- Delivery/coordinator/code state/controller/runtime/preview compiler matrix: 43/43.
- Payload content/release host/artifact/writer lifecycle matrix: 17/17.
- Полный `tools/payload-admin/scripts/test.mjs`: PASS, exit 0. Первоначальный запуск
  корректно остановился на maintenance guard занятого браузерным стендом порта;
  успешный прогон выполнен после подтверждённого завершения этого стенда.
- `test-publication.mjs`: PASS, включая actual SQLite commit rejection с проглоченной
  ошибкой helper и fresh native durability confirmation; явный retry коммитит один раз.
- `test-writer-dev.mjs`: PASS; actual dev writer SIGKILL не оставляет writer/порт.

Полный separated harness проверяет реальные независимые source builds, два
процесса, target-only публикацию, приватность сохранённого draft, raw API/file
запреты, concurrency, потерю HTTP response body, receipt replay после actual CMS
restart, slug/order/placement/no-detail, Unpublish/Delete/empty, retained asset
hashes, code rollback/startup failure/explicit abort и cold public restart при
полностью остановленной CMS. Проверки выполнялись только на новых disposable roots.

## Браузерный маршрут

Утверждённые материалы — Git fixture `258e95b2a7720499c7a74ec7602c8608b8c58200`;
renderer и оба code artifacts — проверенный candidate выше. Реальные production
данные и соседние worktrees не использовались.

- Фактические размеры окна: 1280×800 и 1280×720. Запрос 610 px был ограничен
  браузером до 720 px; этот отчёт не утверждает проверку высоты 610 px.
- Bg-main `rgb(23,25,26)`; resting header без линии, pinned с inset line.
  Compact Experience оставляет отступ под header, скрывает progress strip.
- Автоматическая прокрутка достигает конца ленты, выходит после паузы и повторно
  входит с непустым содержимым. Это проверка устойчивых состояний, не физического
  wheel/trackpad и не каждого промежуточного animation frame.
- Corvo: четыре сцены, Mobile/Tablet/Desktop; одинаковый CSS hatch на двух сторонах
  без вложенного SVG. Tooltip открывается с клавиатуры; copy feedback и изменение
  ширины кнопки наблюдались, исходный пустой clipboard восстановлен.
- Сараффан.Радио: три экрана переключаются; заявленные disabled adaptives сохранены.
  Loaded broken images не обнаружены; шрифты загружены; console warnings/errors нет.
- Hover контакта запускает `contact-plane-glide` и `contact-border-orbit` без
  внешней навигации. Прелоадер fixed, покрывает 1280×720, завершается страницей кейса.
- Главная/оба кейса HTTP 200, sitemap включает оба кейса. Авторская 404 и неизвестный
  адрес HTTP 404/noindex; robots/sitemap HTTP 200.
- Native editor и private preview показывают сохранённый новый draft после actual
  restart, независимый public показывает опубликованную версию; ошибок console нет.

### Вложенная сеть preview

Actual authenticated wrapper → sandboxed renderer → вложенная утверждённая HTML
сцена Statistics. Обращение CDP по `targetId` устранило прежний недостаточный
охват через `sessionId`. Наблюдались все 32 request/ExtraInfo/response пары одной
сцены; ответы HTTP 200, event stream без truncation или непрочитанных страниц.

Google CSS и font: actual wire headers не содержат Cookie или Authorization;
referrer CSS пустой, referrer font указывает только на публичный Google stylesheet.
Native session token, HttpOnly canary и приватный preview key сравнивались в памяти
браузерного инструмента с external URL/headers и отсутствовали. Positive control:
actual wrapper request отправляет native session cookie и harmless HttpOnly canary.
Оба iframe имеют `sandbox="allow-scripts"`, без allow-same-origin. Console чистая.
Fixture log scan не обнаружил JWT-like значения, private capability URL или
Authorization header; raw headers/credentials в отчёт не сохранены.
Сессия/canary удалены штатным Set-Cookie ответом временного loopback helper,
собственные вкладки закрыты; wrapper завершился exit 0, временный helper удалён.
Это evidence наблюдённой сцены, не утверждение о произвольных внешних ресурсах.

## Незакрытые условия

1. Actual Linux native build/start, service users/systemd/cgroup и resource proof.
   macOS-пакет и локальные проверки этого не подтверждают. Linux builder не указан.
2. Физические mouse/trackpad: stopper непрерывного wheel до паузы и повторный вход
   без краткого phantom frame. Пользовательское наблюдение пока не получено.
3. G7/A12 — отдельный защищённый production этап: свежие deployed SHA/backup/parity,
   exact service/proxy/OS delta и отдельное разрешение. Он не выполнялся.

Два последовательных read-only review (fidelity/completeness, затем regression/
scope/risk) итогового evidence не нашли подтверждённых проблем. Это не закрывает
перечисленные внешние условия и не даёт разрешение на production переход.
