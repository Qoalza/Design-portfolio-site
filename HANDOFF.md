# HANDOFF

2026-10-05. Worktree: /Users/designer/.codex/worktrees/payload-1939/Design-portfolio-site.
Branch: codex/cms-integration. Один writer. Exact deployed code:
7faa2b8f9709262cc2849de26479bb534a0268dd; последующие локальные commits — docs.

## Текущий результат

Онлайн Payload работает на https://art-des.ru/admin. Один Next/Payload runtime
обслуживает public site, native CMS и private preview. Native Publish применяет
committed content в БД без build/archive/deploy на каждую контентную правку.
Initial state: только actual approved production baseline, 2 проекта,
163 asset aliases /156 native files; DTO/bytes parity PASS. Личный .local/USERSPACE,
старый Des-art Admin и fixture content не переносились. Hero/scenes/geometry/
physics/adaptives не менялись; Portfolio desktop-only, главная не CMS-конструктор.

## Actual VPS

- art-des-payload.service active/enabled, portfolio, loopback3001.
- Code: /opt/art-des-payload/releases/7faa2b8f9709262cc2849de26479bb534a0268dd.
- Permanent data: /var/lib/art-des-payload/data, private0700, вне code/web root;
  single SQLite writer. Повторный bootstrap запрещён.
- Actual Nginx: /etc/nginx/sites-enabled/art-des — regular file, НЕ symlink.
  Proxy3001, upload25m/read-send120s; TLS/http2/redirect сохранены.
- Owner owner@art-des.ru. Credential file /var/lib/art-des-payload/initial-owner.json
  приватный0600. Пароль/JWT/secret НЕ читать или печатать в tool outputs/chat/Git.
  Пользователь получает пароль самостоятельно в серверном терминале.
- Root SSH ранее восстановлен пользователем, сейчас канал истёк. Временный build swap после memory guard
  выключен и удалён, receipt TEMP_BUILD_SWAP_CLEANUP_VERIFIED; /swapfile сохранён.

## Последнее исправление и evidence

Browser обнаружил 404 у code-owned SVG Corvo: dynamic CMS asset routing поглощал
готовые shell files. Host теперь выдаёт только exact allowlist23 verified built
SVG, explicit CMS ownership имеет приоритет; unknown/draft resources404.
Hero компоненты/CSS/поведение не менялись.
RED→GREEN regression; focused host/runtime tests4PASS, root lint PASS,
actual built shell23PASS; exact clean Linux build PASS/sourceDirty:false.
Два последовательных selfreview: completeness/ownership; regression/privacy/CSP.

Actual HTTPS receipt10:37:03Z: exact code7faa,2projects/all163bytes, native login,
secure cookies, private APIs/files, closed first-register, обе private previews,
unchanged compiled stamps PASS. Transport loopback-nginx с art-des.ru Host/SNI и
штатной TLS validation. Independent external Mac HTTPS code marker и ранее
missing SVG PASS. Первый switch автоматически вернулся на05 после timeout
внешнего HTTPS с VPS; повторный loopback TLS proof успешно завершил switch7faa.

Browser: Corvo normal preloader→ready; Сараффан normal preloader→ready и кнопка
«Следующий экран» меняет экран. Все6 Figma links ранее проверены анонимно в browser,
canvas открыт без аккаунта. Corvo Statistics selection открывает готовый statistics/index.html, iframe body
с таблицей подтверждён. Selective missing-SVG browser test показал connection
error→«Повторить»→«Пробую достучаться снова»→ready Corvo; blocked URLs сняты.
Пользователь вошёл в native Payload. Actual draft/reopen/private preview/Publish,
public update и штатное восстановление версии проверены. Оставшиеся native
editor/material сценарии также завершены; итоговый checkpoint ниже.
Offline top-level navigation в temporary tab привёл к native browser error page;
Browser Use policy запрещает data: error-page, поэтому in-app retry этим тестом
не проверен. Selective asset failure/retry проверен отдельным тестом выше.
Временная вкладка не помечена на сохранение, viewport reset выполнен;
не обходить policy и не выдавать это за PASS состояния прелоадера.

## Быстрый откат

Old art-des.service active3000, static SHA b44946021d55fb1cc8a4430c3bafd62e342714c9
— standby, НЕ current public identity. Backup /var/backups/art-des/pre-payload-0882f79,
actual Nginx rollback source nginx-art-des-enabled. Restore enabled config +
nginx -t/reload возвращает3000, CMS data сохраняются. Не удалять до user acceptance.
Предыдущий online code05 unit:
/var/backups/art-des/payload-before-corvo-fix-7faa2b8/art-des-payload.service.
Latest offline consistent CMS backup verified:
/var/lib/art-des-payload/data-backups/backup-18826003-328c-49d2-8357-0c2001b43efd.
Actual DB НЕ test-restored; restore/publication behavior проверены на fixtures.

## Следующий шаг / stop-lines

Native editor/material browser acceptance PASS: text/draft/reopen/preview/Publish,
PNG/JPEG/WebP,142-file folder/HTTPS source, raster order/count rejection,
published slug/routes/sitemap/assets, variants/adaptives, version restore/revert.
Final public projects exact baseline equality PASS. Test history/materials private,
maxPerDoc20; canonical Git/Hero code/geometry/physics не менялись.
Некоторые browser submit дали Failed to fetch; повтор200/public update проверен,
связь с VPN не доказана. Root SSH истёк; CMS workflow от него не зависит.
Next: пользовательская visual/animation приёмка; archive только после подтверждения.
Не повторять successful build/test suites без нового code change.
Main slow state при12000ms latency и automatic ready после снятия задержки PASS.
Slow Retry1/2 теперь PASS через удержанный Image request: корректные captions,
повторный slow и ready после release. Late slow→connection и connection Retry1/2
с последующим ready также PASS. Network/cache/Fetch overrides сняты, tab закрыт.
Tests не подменяют ещё не просмотренные animation states.
Desktop small1920/large2560: actual body/base fade RGB22,25,26 совпадает; gradients
используют тот же цвет с alpha, lower Hero визуально просмотрен. Overrides сняты,
test tabs закрыты. Публичные edge states/visual checks пока частичны. SMTP не настроен, protected
console recovery доступен. Goal не завершён; старые runtime/worktrees не архивировать.
Plan: docs/exec-plans/payload-site-integration.md v2.0.
OPS/rollback: docs/ops/PAYLOAD.md. Audit: docs/ops/PAYLOAD_ACCEPTANCE.md.
