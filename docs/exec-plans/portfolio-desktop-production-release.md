# Публикация десктопного обновления портфеля — 2026-10-28

Статус: COMPLETE. OPS+PORTFOLIO / LARGE / HIGH / FULL. Goal создан по прямому запросу пользователя; бюджет не задан. Пользователь утвердил весь план, включая main и production. Единственный writer — текущий чат в portfolio-production-release, веткаcodex/portfolio-desktop-release-v1.

## Результат и границы

Выпустить наart-des.ru согласованный набор: карусель Corvo → B.Off → Сарафан.Радио; новый статичный Hero3/5+; B.Off с4Lottie, новым примечанием, ссылкой и утверждёнными подписями; регистр тегов; рабочий прелоадер; анимации«Как я работаю» с прежней раскраской300ms и согласованными скоростями/полосами.

Админка остаётся как сейчас: не отключать/обновлять/пересобирать и не запускать её публикацию. Нет новых мобильных/планшетных адаптивов, canonical/DB/draft/schema/data изменений, Figma writes, proxy/OS изменений или CI-миграции. Сохранить production-only исправления и штатный откат.

Source integrationf536e2a. Свежий public+remote mainbaselinecee57561cd9c0dd34897d9f2b18d5fa6333780ae. Public content revisionb158f7017c45d2c9e67f0d905c725e0138c2cff2782c37f09bbed45cdea6fb4c;2проектаCorvo/Sarafan. Публичный DTO сохранён только как read-only verification input внеGit.

## 1. Подготовить отдельную ветку выпуска

- [x] Создатьcodex/portfolio-desktop-release-v1 от свежейorigin/main в отдельном release-дереве.
- [x] Перенести только согласованную дельту интеграции, не заменяя prod-дерево целиком. Сохранить production image-source mapping, optional-logo guards и ранее выпущенный runtime.
- [x] Проверить отсутствие изменений Admin/Shared schemas/content/assets/drafts/USERSPACE и новых adaptive files.

## 2. Подключить к настоящей сборке

- [x] B.Off включить в public package с изображениями/4Lottie/примечанием/URL/подписями. Зарегистрировать/projects/boff в существующей manifest.pages:HTTP200, title/description/canonical/sitemap. При runtime merge страниц сохранить code-owned B.Off вместе с liveCorvo/Sarafan. Ничего не создавать в Admin.
- [x] Подключить startupModulePlugin({release:true}) к независимому public+preview builder и включить новые исходники/анимации в build identity. Проверятьportfolio:build, не толькоVite.
- [x] Отобразить liveSAAS/PARTNER PLATFORM/EVENT какSaaS/Partner Platform/Event в карточках и открытых проектах через public display adapter. DTO и его revision сохраняются; неизвестные значения не преобразуются.
- [x] Не менять public/shared schemas и Admin API. Новое public дополнение —/projects/boff.

## 3. Проверить кандидат

- [x] Focused RED/GREEN для новых runtime стыковок; app tests/lint и focused public/server/artifact/controller/preview checks.
- [x] Clean exact commit →portfolio:build/package→самостоятельный проверенный public artifact. Без CMS build/Docker/private build inputs.
- [x] Изолированный запуск с копией текущих публичных данных; hidden browser1280/1440/1920: home/Corvo/Sarafan/Boff, finite carousel/fades/glow/images, Hero450ms/shades/blur/captions,4BoffLottie, process hover/timing/stripes.
- [x] Preloader: fast/minimum1orbit, slow, download/evaluation/React startup errors, real retry without shell reset, stale attempt isolation and approved slow/error copy variants. Fault injection только локально.
- [x] Два последовательных review: полнота/fidelity, затем regression/scope/risk, исправления между ними; повторить затронутые проверки.

## 4. Выпустить main+production

- [x] Fresh main/controller/content check; сохранить previous compatible artifact/descriptor/state и контрольные признаки CMS. При изменении baseline/collision/unknown pending state не активировать.
- [x] Fast-forward exact проверенногоSHA вmain, безforce. Upload immutable verified package.
- [x] Existing code-controller: unique persistent intent app=portfolio с exact expected confirmed slot; после неизвестного ответа повторять те же bytes/ID. Активировать и перезапустить только Portfolio. Не менять CMS/proxy/settings.

## 5. Проверить и закрыть

- [x] Public exactSHA; home+3projects/sitemap/resources; hidden smoke и отсутствие unexpected errors.
- [x] Неизменность content revision/Corvo/Sarafan DTO/assets и CMS identity/PID/schema. B.Off остаётсяcode-owned.
- [x] При failed health/существенной регрессии штатный abort/new rollback intent на retained compatible previous artifact. Не откатывать data/DB/content.
- [x] Сохранить результаты, identity, rollback pointer и обновитьHANDOFF/историю. Goal complete только после подтверждения прода.

## Критерий завершения

Выбранные обновления работают наart-des.ru; B.Off доступен напрямую; админка в прежнем состоянии; новые адаптивы не опубликованы. Runtime identity относится к проверенному exact source; последующие docs commits не означают новый runtime release.

## Итог выпуска

Production source108820d23f9c27c9c771e4823fdf4d7020e9c5c0, artifact9fbb2ff0617c74a4c3de18fae3ee628fcd293e7117cd72b44ee6c95c52a39f53, renderer60f2ea1effbd72e1290a531a5a9922f7a724f998bce8f6b419a9ec25bbf95c35. Main fast-forward confirmed. Controller operation5c45bf4a-b1f0-48c1-991c-cf065fb5b3ec completed, code activation4. HTTP200 home/Corvo/Sarafan/Boff; sitemap includes Boff;11 explicit code/Boff resource checks and hidden production browser passed, no broken images or unexpected console errors.

Content revisionb158f7017c45d2c9e67f0d905c725e0138c2cff2782c37f09bbed45cdea6fb4c and actual project DTOs unchanged. DTO rendererId correctly changed with code. CMS descriptor hash/health/build/schema/PIDs exactly unchanged (76541/76604). No rollback needed. Retained previous compatible artifact99ff91a265c8ca3a80cb06d1b3a28fa66e15ff816b5bf00f670d5bd4709a8190 and descriptor in completed operation journal; rollback must use a new intent against current confirmed slot, not filesystem replacement.

Evidence: design-reference/releases/108820d-desktop/. Closing documentation commit does not change deployed runtime identity.
