# HANDOFF

Обновлено: 2026-10-06. Worktree codex/redesign-portfolio.

## Checkpoint

Текущий public/admin production: exact c61d0609ec09438958526ca7b8c55238de218c03, art-des-payload.service, loopback3001. Standby static b449460 не является текущим сайтом. Native CMS data/secret вне release; не читать и не переносить. Пользователь разрешил первый вариант: интегрировать согласованные Experience/hatch/Bg-main/header правки в текущий Payload runtime, сохранить CMS/data, выпустить. Отмена прежнего static deploy заменена этой явной командой.
В этом worktree объединяется только exact deployed Payload code и наш 9ca9cc0. Соседняя ветка/папка не затрагиваются. Единственный конфликт — этот stale checkpoint; runtime объединён без конфликтов.

## Next

План: docs/exec-plans/payload-preserving-portfolio-fixes.md. Проверить интеграцию, clean exact Linux build на одноразовом fixture, сохранить прежний unit/release, переключить только WorkingDirectory текущего сервиса, readiness/public/admin/data parity. Без миграций/bootstrap/content writes и без разделения runtime.

## Stop-lines

Не менять schema/secret/DB/native assets, не запускать bootstrap/restore. Не менять Nginx/порт/доступы, не трогать standby static service. Hero scenes/geometry/Experience path/travel сохраняются. Разделение выпуска и редизайн Admin — отдельная будущая работа.
