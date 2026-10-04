# Приёмка редизайна перед публикацией

Дата: 2026-10-05. Линия: codex/redesign-portfolio.
Production выпущен: b44946021d55fb1cc8a4430c3bafd62e342714c9 (PR #54).
Архив: 21 825 133 bytes, 1510 entries, SHA256
5915a2d18ff8aad42327bec3701d098c910e1e363d85b74ba9185887f2051bd5.
Страницы и ресурсы побайтно совпадают с показанным кандидатом 954c835a;
изменилась только привязка manifest к exact merged SHA.

## Проверенные условия

| Требование | Проверка и результат |
|---|---|
| Единый сайт | Root Next standalone выдаёт approved Vite renderer главной, Corvo, Сараффан.Радио и новой404; CMS не требуется для исполнения. |
| Материалы и Hero сохранены | Approved source258e95b2a7720499c7a74ec7602c8608b8c58200. Между a514243 и f28c461 manifests всех452 файлов и страниц побайтно одинаковы; /404 fix меняет только Next routing. |
| Payload подключаем позднее | Native temporary DB save/reopen/export, draft separation, обеHero, assets/full decode и renderer после остановкиCMS доказаны группой2; fixtures не входят в initial release. Полный редактор ещё не готов. |
| Desktop главная | Ordinary/large, threshold2312×1300/2313×1299/2313×1300; fade bodyrgb22,25,26; cursor/lens/карточки/Process; Experience wheel entry/completion/reset/reentry; graph pulse36segments/arrival; About3images/wrap/close/focus return; footer. |
| Проекты | Direct/navigation/reload/back/forward/reset; хлебные крошки; copy обоихURLs подтверждён настоящей вставкой в временное поле. |
| Corvo | Все4 сцены, presetMobile595/Tablet1279/Desktop1599, min360/max1933, drag/inertia/bounds и новый preset послеdrag; контролируемыйStatistics503 не ломает shell, переключение кgoodscene и восстановление проверены. Сохранение последнего кадра при503 не обещается; last-good snapshot защищён validation/export. |
| Raster | Реальные3, temp5/7/9 с тем же компонентом: initial/order/allpositions/wrap/5visible/arrows/dots/sideclick/fastnext/reduced-motion; Tablet/Mobile disabled. Fixture9 использует повтор approved3rasters, не является новым контентом. |
| Прелоадер | Cold/hot/fast, slow>10s/retry1/2/3/arrival; criticalfont/image/combinednetwork failure/recovery. Реальный failedfontretry исправлен; stale cancellation покрывается gate tests, multiple retry arrival не открываетoverlay повторно. |
| HTTP | RealNext guard GET/HEAD200/307/404/title/exactSHA/noindex; /projects временно→/#projects. /404 отдельно исправлен и проверен в архиве. Все451 публичныеassets hash/bytes matched; robots/sitemap/CSP/layout boundary. |
| Новая404 | Initial, wrongpacket/wrongslot/count0, correction/all5→finalheading/live, возвратглавная. Финальное состояние повторено на f28c461archive. |
| Публичные ссылки | ВсеuniqueFigmafiles фактическиsigned-outcanvas; CV безcookies200 настоящийPDF387772bytes; TelegrampublicArtur/@Coco_soul. |
| Build/archive | Cleanexactbuild/poststamp/package/unpack/deploy-v2manifestvalidator; realHTTP/browserSHA, no brokenimages и capturedconsole errors на нормальных проверенных состояниях. Намеренныеfault503 учитываются отдельно. |
| Изолированный откат | Actualactivation script/archive validator/atomicrename: success/restartfailure/readinessfailure. Backupoutside rotation checksum/restore. Linuxservice/ownership/flock mocked; previousfixture, а неrealprod. |

Evidence: design-reference/redesign-release-2026-10-05 содержит JSON proofs.
Подробный журнал browser edge states: /private/tmp/redesign-release-verification-checkpoint-20261005.md.
Группы1–3 и reviews: docs/exec-plans/redesign-production-release.md.

## Production проверен

Пользователь явно разрешил дальнейшие действия публикации и деплоя и открыл
административную SSH-сессию. Fresh VPS preflight: previous a44efab5830a8dda5a1fd1348f644358f047672c,
Linux x86_64, Node 22.23.2, service active, около 22 GiB свободно.
Установленные deploy-v2 script и validator совпали по SHA-256 с tracked sources.
До переключения создан root-only backup вне releases:
/var/backups/art-des/pre-redesign-a44efab5830a8dda5a1fd1348f644358f047672c/runtime.tar.gz.
Tar compare с работающим release и checksum прошли; previous release и backup
проверены снова после переключения, старый release остался на месте.

PR #54 merged в main; actual merged SHA clean build/poststamp/package/unpack/validator
и HTTP guard прошли. Deploy operation b44946021d55fb1cc8a4430c3bafd62e342714c9-5915a2d18ff8aad4
завершилась complete. Публичный HTTPS GET/HEAD/status/title/exactSHA/noindex/redirect
прошёл; все 451 public assets совпали по bytes/SHA-256. Browser desktop 1440×900:
главная/прелоадер/fonts, Corvo scene body и переключение Statistics,
Сараффан.Радио carousel next, новая 404/возврат; broken images и console errors отсутствуют.
HTTP resource report: /private/tmp/redesign-production-assets.json.

## Остаётся

1. Пользовательская приёмка нового production; только после неё архивировать
   предыдущий сайт вне публичных маршрутов. До этого сохранять быстрый откат.
2. Закончить удобный Payload authoring на доказанном snapshot interface,
   с отдельными gates real bootstrap/migrations/publish.

Goal активна: выпуск состоялся, полный Payload ещё не завершён.
