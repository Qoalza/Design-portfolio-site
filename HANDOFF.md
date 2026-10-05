# HANDOFF

2026-10-05. Worktree: /Users/designer/.codex/worktrees/payload-1939/Design-portfolio-site.
Branch: codex/cms-integration. Один writer. Локальные последние commits — docs;
exact deployed code: 05abd7c1375eb9c731ee8c041d927eed225141d9.

## Текущий результат

Онлайн Payload активирован на https://art-des.ru/admin. Один Next/Payload runtime
обслуживает публичный сайт, native CMS и private preview. Native Publish меняет
committed content в БД; обычное редактирование не запускает build/archive/deploy.
Initial content — только проверенный actual production baseline, оба проекта,
163 asset aliases /156 native files; DTO и bytes полностью совпали.
Личный .local/USERSPACE, old Des-art Admin logic/state и fixtures не переносились.
Hero/scenes/geometry/physics/adaptives и утверждённый дизайн не менялись.
Portfolio desktop-only; главная не становится конструктором в CMS.

## Actual VPS runtime

- art-des-payload.service active/enabled, User portfolio, loopback127.0.0.1:3001.
- Code /opt/art-des-payload/releases/05abd7c1375eb9c731ee8c041d927eed225141d9.
- Permanent root /var/lib/art-des-payload/data, private0700; native files/DB/secret
  вне code releases/web root. Single SQLite runtime; не запускать второй writer.
- Actual Nginx /etc/nginx/sites-enabled/art-des — ОТДЕЛЬНЫЙ ФАЙЛ, НЕ SYMLINK.
  Он теперь proxy3001, upload25m, read/send120s; прежние TLS/http2/redirect сохранены.
  sites-available/art-des остаётся прежним неактивным конфигом. Не считать его
  источником текущего routing. Проверять nginx -T, не предполагать symlink.
- Native owner owner@art-des.ru, generated credentials приватно в
  /var/lib/art-des-payload/initial-owner.json0600. Не читать/печатать secret/password/
  JWT в tool output/chat/logs/Git. Пользователь может прочитать пароль сам на VPS.
- Cleanup временного2GB build swap начат после memory guard PASS; SSH оборвался
  до receipt, завершение swapoff/remove НЕ подтверждено. Root control socket снова
  отсутствует; повторный BatchMode root Permission denied. Live activation уже
  завершена/HTTPS proof PASS до этого обрыва; не выполнять повторный bootstrap.

## Evidence и границы проверок

Exact clean Linux build PASS, sourceDirty:false/codeSHA05abd7c; native full suite,
types/lint/build и renderer/runtime checks PASS на итоговом code candidate.
Actual HTTPS proof acceptance-live.json: home/оба кейса200, projects307→/#projects,
unknown404, все163 asset bytes, native owner login + Secure/HttpOnly/SameSiteLax,
anonymous API/raw file denial, closed first-register, оба private previews/CSP,
DTO и compiled BUILD_ID/preview-manifest неизменны. Native unit boot enabled.
Independent direct external HTTPS from Mac PASS: home/admin/login/DTO/both cases/
projects307/404 and exact code marker. Local-proxy request failed; direct worked.
Graceful restart PASS; consistent actual private backup verify PASS.
Restore проверен на Linux fixtures; actual production DB НЕ test-restored.
No-build draft→Publish→public и failure/version checks доказаны на isolated fixtures;
реальные production projects не менялись тестовыми PATCH/Publish.

Browser acceptance остаётся НЕПРОВЕРЕННОЙ. Ранее browser action auto-review denied;
не повторять/не обходить через CDP/Playwright/shell. Auto-review также rejected
real production test PATCH/Publish: persistent content/version side effects.
Команда не выполнялась; не повторять/не обходить. Использовать безопасные fixtures
и read-only actual checks. Не объявлять полную пользовательскую приёмку завершённой.

## Быстрый откат

Old art-des.service active127.0.0.1:3000, current static SHA
b44946021d55fb1cc8a4430c3bafd62e342714c9. Его current pointer — legacy standby,
НЕ active public runtime identity. Старый runtime/config сохранены в
/var/backups/art-des/pre-payload-0882f79. Actual proxy rollback source:
nginx-art-des-enabled; nginx-art-des — неактивный sites-available backup.
Restore actual enabled config + nginx -t + reload возвращает старый3000,
CMS data остаются на месте. До приёмки не удалять старый runtime/service/worktrees.
Latest verified CMS backup:
/var/lib/art-des-payload/data-backups/backup-eb490ba9-e9e9-406d-bad9-407accffb2d6.

## Next / pointers

Пользовательская browser acceptance редактора и реального разрешённого контентного
изменения остаётся открытой; SMTP не настроен, protected console recovery доступен.
Не добавлять archive-content publication workflow. Pure code releases отдельно.
Active plan v2.0: docs/exec-plans/payload-site-integration.md.
Live OPS/config/rollback: docs/ops/PAYLOAD.md.
