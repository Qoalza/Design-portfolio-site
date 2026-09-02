# Production Deploy Runbook

## Scope

Current production release/rollback contract for `https://art-des.ru`.

Этот документ не содержит secrets, private keys, host credentials, historical smoke logs или автоматически достаточного разрешения на deploy.

## Approval boundary

Отдельный exact approval обязателен перед:

- merge в `main`;
- upload/publish exact SHA;
- production/service/Nginx/firewall/DNS/SSL mutation;
- migration real Admin data;
- rollback, если он меняет live state.

Read-only status/smoke можно выполнять в рамках diagnostic request.

Admin UI не имеет live publish workflow и не является разрешением на production-действие. Deploy выполняется только по этому runbook после отдельного прямого подтверждения.

## Canonical sources

- Release выполняется OPS-оператором по exact SHA. После одноразового valid live bootstrap `tools/des-art-admin/publish-worker.mjs` также выполняет прежний пользовательский live workflow из Admin: exact worktree → checks → PR → merge → upload/deploy → public SHA/routes verification. Sandbox mode этого пути не имеет.
- Restricted server command: `tools/des-art-admin/server/art-des-publish`.
- Canonical Git base: fresh `origin/main`.
- Production release identity: full 40-character merged SHA.
- Для Admin/Shared release действует односторонняя граница данных: **`production → новая локальная Admin`; никогда `sandbox → production`.** Local drafts, draft-assets, preview overlays, jobs, snapshots, migration backups и sandbox imports не являются release input.

Если runbook конфликтует с current code/config/live read-only state, остановиться и выяснить причину.

## Release model

- Перед release operator подтверждает fresh `origin/main`, exact target SHA, required checks и read-only provenance report; sandbox data не является release input.
- Merge, push и deploy остаются отдельными explicit approvals и не запускаются Admin.
- Release archive исключает `.git`, dependencies, build directories, macOS metadata и local Admin/runtime state.
- Ограниченный SSH key принимает только `status`, `upload <full-sha>`, `publish <full-sha>`.
- Server собирает новый release directory, записывает `DEPLOY_SHA`, атомарно переключает `/var/www/art-des/current`, перезапускает `art-des.service` и выполняет readiness loop.
- При readiness failure предыдущий release symlink восстанавливается.

## Preflight

До mutation подтвердить:

1. explicit approved scope и exact target;
2. clean/owned worktree или worker-owned disposable worktree;
3. fresh `origin/main` и full target SHA;
4. successful required checks из exact source;
5. Admin baseline, если он требуется после release, будет подтверждён public `data-build-sha`, совпадающим с deployed SHA;
6. подтверждённый provenance каждого изменённого canonical content/assets: production source, без sandbox-derived data;
7. `gh auth status` без вывода secrets;
8. restricted SSH `status`;
9. previous release/rollback boundary;
10. отсутствие непредвиденных data/config migrations.

При любом несоответствии остановиться до merge/deploy.

## Readiness и verification

Server readiness требует:

- `art-des.service` active;
- local `127.0.0.1:3000/` отвечает;
- served homepage содержит exact full SHA.

После deploy проверить минимум:

- restricted `status` возвращает expected release SHA;
- `/`, `/projects` и релевантный `/projects/<slug>` возвращают expected successful status;
- homepage served build SHA совпадает с deployed SHA;
- affected user behavior проходит focused browser smoke;
- unexpected console/hydration errors отсутствуют для затронутого flow.

Широкий visual matrix запускается только если blast radius этого требует.

## Service diagnostics

Текущая документированная модель:

- release root: `/var/www/art-des`;
- current symlink: `/var/www/art-des/current`;
- service: `art-des.service`;
- application listens only on `127.0.0.1:3000` behind Nginx.

Read-only diagnostics:

```text
systemctl status art-des.service
journalctl -u art-des.service -n 100 --no-pager
```

Nginx reload допустим только после config test и отдельного approved mutation:

```text
nginx -t
systemctl reload nginx
```

## Rollback

Первый rollback path — вернуть `/var/www/art-des/current` на предыдущий сохранённый release и перезапустить service. Не удалять failed/new/previous releases, logs или config во время первичного восстановления.

Если проблема находится в Nginx/SSL/DNS, использовать соответствующий заранее подтверждённый rollback boundary; не импровизировать destructive cleanup.

После rollback повторно проверить service, served SHA и public routes; сохранить краткий incident outcome в `PROJECT_HISTORY.md`, если причина/решение важно для будущей диагностики.

## Volatile state

Не хранить здесь как постоянную истину:

- текущий certificate expiration;
- текущие Node/npm/Nginx patch versions;
- последний smoke timestamp;
- current release SHA;
- временные branch/PR URLs.

Эти данные получать fresh read-only preflight и при необходимости кратко указывать в `HANDOFF.md` или конкретном ExecPlan.
