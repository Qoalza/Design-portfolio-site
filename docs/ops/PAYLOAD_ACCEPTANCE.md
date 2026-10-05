# Онлайн Payload: завершённая операционная приёмка

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

## Исторический список требований перед финальной приёмкой

1. Native editor/material acceptance перечисленных сценариев завершена; см. итоговый checkpoint ниже.
2. Transient browser Failed to fetch отражён отдельно; повтор подтверждён200/public update.
3. Full visual/animation acceptance обоих Hero и прелоадера. Текущий browser proof
   частичен: normal load, resource failure/retry/recovery, Statistics и raster next.
   Offline top-level navigation
   вызвал native browser error-page; policy запрещает data: page и не позволяет
   наблюдать/очистить её этим tab handle. Не обходить; temporary tab без handoff
   закрывается при завершении turn, browser viewport reset выполнен. In-app retry
   и recovery данным тестом НЕ подтверждены.
4. Archive старого runtime/worktrees только после user acceptance. Standby3000,
   previous online05 unit и actual proxy/runtime backups сохранены.

## Исторический следующий шаг до пользовательской приёмки

Native editor/material checks завершены. Далее пользовательская visual/animation приёмка и archive после её подтверждения. SMTP не настроен,
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

## Browser checkpoint: native редактирование и восстановление

Пользователь самостоятельно вошёл в Payload; пароль, cookie и tokens не читались.
На project2 штатный редактор изменил subtitle тестовой пометкой. Save draft →
reload сохранил текст; private draft preview показал его. Public /api/site-content
до Publish побайтно совпал с исходным baseline. Native Publish показал пометку в
public DTO без выпуска кода. Для возврата исходный текст отдельно сохранён
черновиком и опубликован; public projects полностью совпали с baseline.
Первая быстрая попытка возврата через Publish не дала подтверждённого public
изменения; успешной считаем только последующую save-draft/Publish + DTO проверку.
Не объявлять причину первой попытки установленным дефектом без воспроизведения.

Native Versions показали текущую и прежние published/draft версии. Исходная
версия2 восстановлена штатной кнопкой с подтверждением; public projects parity
PASS. Draft slug sarafan-radio-cms-check сохранился после reload, опубликованные
projects остались исходными. Затем штатный возврат к published убрал тестовый
черновик. Hero/scenes/assets не редактировались. Test versions остаются обычной
историей CMS, не удаляются. Canonical Git content не менялся.

Это не полная приёмка uploads/layout/raster/order/published slug change. Root
SSH истёк; текущий browser CMS workflow не требует этого канала.

## Browser checkpoint: actual image upload → Publish → restore

Через штатный input native редактора project2 загружен уже утверждённый
canonical sarafan-desktop-4.png (не личные данные/не fixture). Original PNG
1440×1162 сохранён в native media; lossless WebP59КБ вместо118КБ, report:
verified-lossless. После Save draft новая связь сохранена. Anonymous новый
upload path404 до Publish; после native Publish файл200 и SHA256 совпал с
prepared digest1cafe0215e7244841526a458395b544c3147b542bacdf9e362519ced2b5003c2.
Код не выпускался, оформление/Hero не менялись. Native restore исходной version2
вернул оба public projects к точному baseline; upload path снова404.
Материалы/versions сохранены в приватной истории CMS, не удалены.

Первая попытка Save была заблокирована native dialog «Документ изменен» после
предыдущего version restore. Обновление штатной кнопкой «Перезагрузить документ»
и повторная загрузка разрешили блокировку. Это не подтверждённый дефект upload
endpoint: ingest создаёт media, не меняет project document. Tool clipboard/
selector сбои не обходились другими средствами. Проверка PNG upload/storage/
lossless preparation/private draft/native publication/version resource revocation
actual PASS. JPEG/WebP inputs/layout package/raster order/published slug остаются
открытыми для actual проверки; fixture coverage учитывается отдельно.

## Native browser acceptance: оставшиеся сценарии — PASS

2026-10-05, deployed7faa, без code deploy.

- Published slug: новый адрес200, прежний404, sitemap обновлён; delivery asset
  по новому alias200 с исходным digest. Native restore вернул исходный адрес.
- Layout folder:142 canonical Corvo files совпали с published manifest до upload.
  Native folder chooser/entry media-campaigns/index.html/ingest/draft/reopen/
  Publish подтверждены; published version17, public source/manifest parity PASS.
  Затем native restore исходной version1.
- Raster: move/save/Publish дал home/delivery/variant; исходный порядок возвращён.
  WebP4096×2958,605КБ сохранён без повторного сжатия как четвёртый draft screen.
  Publish400 с сообщением о неготовых данных Hero; public baseline unchanged.
  Revert убрал тестовый черновик.
- JPEG: approved Corvo avatar.png по magic JPEG1024×1024,107КБ. Ingest сохранил
  исходник, поскольку candidate не легче; draft .jpg binding/anonymous404/
  public unchanged PASS. JPEG не публиковался в карточке; draft возвращён.
- HTTPS source: ссылка на тот же approved media-campaigns/index.html, private
  preview nested heading PASS; native Publish/public kind:url PASS; затем restore.
- Верстка→Фикс адаптив→Верстка сохранила4 сцены. Выключенный Tablet в saved
  draft preview disabled:true; Mobile/Desktop disabled:false. Revert вернул
  оригинальные настройки. Portfolio adaptive и Hero code/geometry/physics не менялись.

Final оба public projects точно совпали с актуальным baseline до проверок.
Некоторые первые browser submit дали Failed to fetch; повтор200/public update
подтверждены. Это transport failure, связь с VPN не установлена; настройки сети
не менялись. Test versions/materials остаются private; maxPerDoc20 ограничивает
историю, не обещать доступность самых ранних test versions. Fixture content/
credentials/.local/USERSPACE не переносились. Root SSH истёк, CMS от него не зависит.

## Browser checkpoint: оставшиеся сцены и цикл карусели

2026-10-05, public code7faa, read-only проверка без CMS/code writes.
Corvo: native My Space/Authorization переключают pressed state и iframe на
my-space/index.html / authorization/index.html того же approved package.
Загруженные body и screenshots подтверждают таблицу My Space и форму Authorization
с иллюстрацией. Форму не отправляли; геометрию/поведение Hero не меняли.
Сараффан: три последовательных Next дают Главная→Вариант→Доставка→Главная;
Previous возвращает Доставку. Подпись и центральное изображение синхронно меняются.
Tablet/Mobile остаются disabled. Временные вкладки закрыты, network/viewport
настройки не вводились. Это evidence переключения и отрисовки, не доказательство
каждого промежуточного animation frame. Пользовательская визуальная приёмка и
архивирование после её подтверждения остаются открытыми.

## Завершение 2026-10-05

Пользователь подтвердил работоспособность, вынес переделку дизайна в отдельную
задачу и прямо разрешил архивировать старую версию и завершить работу. Это
операционная приёмка; она не превращает частичные visual/animation checks в
полный визуальный PASS. SMTP/actual production DB test-restore не заявляются.
Приватный архив: /var/backups/art-des/archived-static-20261005T133522Z.
static-runtime.tar.gz:207197016bytes, mode0600, directory0700;
SHA256 b71e9788496889f924a67f26f2fa1bd610c12aa3c2f29d8367ce782bb1095a65.
Содержит3 прежних static releases, current symlink, old unit и pre-redesign/
pre-payload runtime/config backups. gzip integrity, tar compare с исходными
файлами и SHA256 verification PASS. Исходные releases сохранены для быстрого
отката. art-des.service inactive/disabled; после SIGTERM143 wrapper оставил
failed status, reset-failed снял только статус, процесс не перезапускался.
art-des-payload.service active, code7faa неизменен. Actual TLS через Nginx:
главная/оба кейса/admin-login200, public projects до/после точно равны.
RESTORE.txt и receipt.txt находятся в архивной директории. Возврат static требует
сначала enable --now старого сервиса и readiness3000, затем approved proxy
rollback; БД Payload не восстанавливать для static rollback. Worktrees не удалены.
