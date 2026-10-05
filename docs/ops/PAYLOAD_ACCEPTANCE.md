# Онлайн Payload: аудит оставшейся приёмки

2026-10-05. Exact public code:7faa2b8f9709262cc2849de26479bb534a0268dd.
Deployment/config: PAYLOAD.md. Active plan: ../exec-plans/payload-site-integration.md v2.0.
Это evidence и границы проверки, не разрешение на дополнительные production mutations.

## Подтверждено на действующем HTTPS

- Независимый direct external HTTPS с Mac, verified IP/Host и certificate validation:
  главная/оба кейса200, admin/login200, public DTO200 с2 проектами, projects307,
  unknown404 на предыдущем05; на7faa внешний check подтвердил Corvo HTML/code marker
  и ранее missing shell SVG. Серверный actual HTTPS proof7faa также PASS.
- Все163 ресурса/DTO byte parity, native owner login/secure cookies, оба previews,
  unchanged BUILD_ID/preview manifest — current7faa server actual proof.
- Дополнительный внешний anonymous audit: projects/media/project-files/users403,
  invalid preview capability404, /data/cms.db404, /.env404,
  obsolete /api/publication/status404. No writes/no tokens/no browser.
- Desktop Hero fade в фактически опубликованном CSS использует
  var(--cv2-container-neutral-bg-main), как и фон. Browser desktop variants проверены в checkpoint ниже.
- Резюме без аккаунта HTTP200; HTML title подтверждает нужный PDF Google Drive,
  access-denied text отсутствует. Это anonymous HTML check, не full rendered viewer.

## Подтверждено на изолированных fixtures

Native draft→Publish→public без code build/deploy; failed publish сохраняет
previous published content, private draft assets, package/bitmap validation,
preview/fallback/capability, versions, schema and consistent backup/restore.
Types/lint/build/Linux candidate05 проверены; новый narrow host fix7faa описан ниже.
Preloader tests покрывают fast load, 200ms threshold, full revolution, slow10s,
retry abort, early/late connection failure, delayed ready, contextual retry reset.
Наличие этих tests не заменяет browser animation/visual acceptance.

## Актуализация10:37Z и browser evidence

Code7faa исправляет host routing для23 code-owned Corvo shell SVG, не Hero.
До исправления браузер показал connection-error preloader и404 конкретных SVG.
После: actual built shell23PASS; focused runtime/host tests4PASS; root lint PASS;
exact clean Linux build PASS; independent external code/SVG PASS. Actual HTTPS
proof всех163 CMS assets/auth/previews PASS10:37:03Z, tlsTransport loopback-nginx;
Host/SNI art-des.ru и certificate validation сохранены. Первый switch вернулся
на05 автоматически при transport timeout, затем7faa успешно активирован.
Два последовательных selfreview проверили ownership/completeness и privacy/CSP.

Browser use после пользовательского «Разрешаю» доступен. Corvo normal preloader
переходит в готовую страницу, Сараффан также; «Следующий экран» меняет изображение
и подпись. /projects browser navigation приводит на /#projects; unknown route
показывает новую interactive404. Все6 уникальных Figma links дают canvas/document без аккаунта;
предыдущие HTTP403 не доказали закрытость, browser check их разрешил.
Временный build swap безопасно выключен/удалён после memory guard, service active;
original swap сохранён. New consistent private backup18826003-328c-49d2-8357-0c2001b43efd
verified до code switch. Persistent content/schema/secret не менялись.

Browser selective resource failure: Network.setBlockedURLs только topbar-hatch.svg
в temporary tab → connection error + Retry. Blocking снят → штатный Retry →
«Пробую достучаться снова» → visible Corvo heading/ready. Corvo Statistics button
pressed и iframe statistics/index.html с таблицей подтверждены. Test settings
сняты, штатная тестовая вкладка закрыта; исходные пользовательские вкладки сохранены.

## Открытые требования — не объявлять полный Goal complete

1. Actual native editor acceptance: login/edit/reopen/saved draft/preview/
   native apply/public change, image/layout/raster/order/slug/version restore.
   Пользовательский вход в Payload ожидается; пароль модели не передавать.
2. Real production test PATCH/Publish ранее auto-review rejected из-за persistent
   content/version effects, не выполнялись. После нового разрешения ещё не проверены;
   fixtures не являются actual interaction proof.
3. Full visual/animation acceptance обоих Hero и прелоадера. Текущий browser proof
   частичен: normal load, resource failure/retry/recovery, Statistics и raster next.
   Offline top-level navigation
   вызвал native browser error-page; policy запрещает data: page и не позволяет
   наблюдать/очистить её этим tab handle. Не обходить; temporary tab без handoff
   закрывается при завершении turn, browser viewport reset выполнен. In-app retry
   и recovery данным тестом НЕ подтверждены.
4. Archive старого runtime/worktrees только после user acceptance. Standby3000,
   previous online05 unit и actual proxy/runtime backups сохранены.

## Следующая полезная работа

После входа пользователя закончить native editor acceptance и разрешённые actual
content checks; затем оставшиеся browser edge/visual states. SMTP не настроен,
console recovery описан в PAYLOAD.md. Не повторять successful build/HTTP suites
без нового изменения; не выполнять bootstrap второй раз.

## Browser checkpoint: долгий ответ и desktop fade

2026-10-05, deployed code7faa2b8f9709262cc2849de26479bb534a0268dd.
Main normal load, simulated12000ms network latency: browser показал «Долгая
загрузка», explanatory copy и Retry button. После снятия latency готовая главная
открылась автоматически. Slow-state Retry НЕ доказан: первая попытка click уже
не нашла кнопку после ready; второй observation deadline наступил до slow state.
Эти попытки не объявлять PASS, fixtures остаются отдельным evidence. Все test
network/cache overrides сняты, tabs закрыты, user settings не менялись.

Desktop fade:1920x1080 small и2560x1440 large runtime variants. Actual body и
hero-bottom-dots background одинаковы rgb(22,25,26). В large оба fade gradients
используют тот же RGB с изменяемой alpha. Lower Hero screenshot просмотрен;
цветовой шов старого fade не воспроизведён. Никаких CSS/design changes этим шагом.
Native editor login ещё открыт; owner credential вводит пользователь. Goal active,
не завершён. Next: native editing acceptance и ещё не подтверждённые browser
slow retry/late readiness/animation cases, без повторения успешных build/tests.

## Browser checkpoint: обе slow retries и поздняя ошибка

На deployed7faa один Image request topbar-hatch.svg удержан через explicit
non-Document Fetch pattern. После10s появилась «Долгая загрузка». Retry1 показал
«Второй заход пошёл», повторное ожидание→slow→Retry2 — «Третий заход без
капитуляции». Снятие interception + продолжение именно удержанного Image request
вернуло ready Corvo. Это заменяет прежний slow Retry UNVERIFIED checkpoint.
Отдельно удержание→slow→Image failure дало «Проблема с соединением»; первый retry
при blocked SVG снова дал connection error; второй после снятия block показал
«Снова пробую выйти на связь» и вернул ready Corvo. Документы/навигационные ответы
не перехватывались агентом. Network/cache/raw Fetch overrides очищены, tab закрыт.
CMS projects/versions/code не менялись. Native login всё ещё pending на /admin/login.
