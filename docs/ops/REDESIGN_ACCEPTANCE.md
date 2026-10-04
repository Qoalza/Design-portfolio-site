# Приёмка редизайна перед публикацией

Дата: 2026-10-05. Линия: codex/redesign-portfolio. Production не изменён.
Функциональный кандидат: f28c4614061c16b19a0719e231bdc83f7e4c4232.
Архив этого SHA: 21 825 065 bytes, 1510 entries, SHA256
6b98cd9c1f731e5f09526f5e77dd5631e343f44ed45947350fefc6d44f314b34.
Следующий commit содержит только эту фиксацию evidence/docs; перед показом
пересобрать его exact HEAD и проверить упакованный runtime.

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

## Открытые условия выпуска

1. Получить SSH адрес/пользователя или профиль, без пароля/ключа в чате.
2. Read-only: exact deployed SHA/current/process, platform, disk capacity, доступ к существующему механизму публикации. HTTP marker a44efab5830a8dda5a1fd1348f644358f047672c не заменяет SSH preflight.
3. Перед разрешённым переключением сохранить и проверить настоящий предыдущий релиз вне rotation current+2: isolated rehearsal подтвердил, что oldest previous может удалиться при success. Production backup write требует разрешения.
4. Показать exactcandidate; получить отдельное разрешение exactmerge и публикации; послеmerge пересобрать actualmergedSHA.
5. После разрешённогоdeploy smoke и подтверждения пользователя архивировать старыйсайт внеpublicroutes.
6. После выпуска закончить удобный Payload authoring на доказанном snapshot interface, с отдельными gates real bootstrap/migrations/publish.

Новыеmobile/tabletportfolio, измененияHero, старыеAdminданные, Figmawrite,
удаление экспериментов и архивированиепрода до подтверждения исключены.
Goal остаётся активной; production-ready и завершённыйPayload не заявляются.
