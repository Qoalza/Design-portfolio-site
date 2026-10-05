# Онлайн Payload: аудит оставшейся приёмки

2026-10-05. Exact public code:05abd7c1375eb9c731ee8c041d927eed225141d9.
Deployment/config: PAYLOAD.md. Active plan: ../exec-plans/payload-site-integration.md v2.0.
Это evidence и границы проверки, не разрешение на дополнительные production mutations.

## Подтверждено на действующем HTTPS

- Независимый direct external HTTPS с Mac, verified IP/Host и certificate validation:
  главная/оба кейса200, admin/login200, public DTO200 с2 проектами, projects307,
  unknown404; exact code marker05. Серверный actual HTTPS proof также PASS.
- Все163 ресурса/DTO byte parity, native owner login/secure cookies, оба previews,
  unchanged BUILD_ID/preview manifest — server actual proof перед closure SSH.
- Дополнительный внешний anonymous audit: projects/media/project-files/users403,
  invalid preview capability404, /data/cms.db404, /.env404,
  obsolete /api/publication/status404. No writes/no tokens/no browser.
- Desktop Hero fade в фактически опубликованном CSS использует
  var(--cv2-container-neutral-bg-main), как и фон. Visual browser state не просмотрен.
- Резюме без аккаунта HTTP200; HTML title подтверждает нужный PDF Google Drive,
  access-denied text отсутствует. Это anonymous HTML check, не full rendered viewer.

## Подтверждено на изолированных fixtures

Native draft→Publish→public без code build/deploy; failed publish сохраняет
previous published content, private draft assets, package/bitmap validation,
preview/fallback/capability, versions, schema and consistent backup/restore.
Types/lint/build/Linux candidate были проверены; новых code changes после05 нет.
Preloader tests покрывают fast load, 200ms threshold, full revolution, slow10s,
retry abort, early/late connection failure, delayed ready, contextual retry reset.
Наличие этих tests не заменяет browser animation/visual acceptance.

## Открытые требования — не объявлять полный Goal complete

1. Actual browser/native editor acceptance: login/edit/reopen/saved draft/preview/
   native apply/public change, image/layout/raster/order/slug/version restore и
   визуальные состояния обоих Hero/прелоадера. Ранее browser action auto-review
   denied; не повторять/не обходить через browser alternatives/CDP/Playwright/shell.
2. Реальные production project PATCH/Publish тесты auto-review rejected из-за
   persistent content/version side effects. Они не выполнялись. Не обходить;
   publication evidence сейчас fixture, а не actual project test mutation.
3. Все6 уникальных Figma URLs из actual public DTO вернули anonymous HTTP403.
   Причина не установлена; это не доказательство private sharing и не PASS.
   Пользователь ранее сообщил доступ по ссылке, но independent browser check открыт.
4. Optional temporary build swap cleanup запущен после memory guard PASS; receipt
   не получен. Root SSH снова недоступен: BatchMode Permission denied. При следующем
   доступе проверить swaps/file/service, не повторять bootstrap/install.
5. Archive старого runtime/worktrees только после пользовательской приёмки.
   Standby3000 и actual proxy/runtime backups сохранены, CMS root не удалять.

## Следующая полезная работа

При изменении доступов: закончить actual browser acceptance и/или проверить swap
после root reconnect. До изменения внешнего состояния не повторять все успешные
HTTP/build/tests ради нового status report, не симулировать фактическую приёмку.
SMTP остаётся не настроенным; console password recovery описан в PAYLOAD.md.
