# Выпуск утверждённого редизайна

Публичный интерфейс остаётся в tools/concept-v2/app. Корневой app содержит только
Next host для скомпилированного Vite site; прежний src/app сохранён, но Next не
использует его при наличии корневого app. Рабочие Hero/геометрия/CSS сохранены.

Первый выпуск получает контент и публичные UI-ресурсы из approved Git baseline
258e95b2a7720499c7a74ec7602c8608b8c58200, не из temporary Payload proof. Полный
редактор Payload подключается после выпуска на уже проверенном snapshot boundary.
CMS, БД, авторизация и Des-art Admin отсутствуют в публичном runtime.

## Проверить и собрать

Из текущего redesign checkout:

```sh
npm ci
npm ci --prefix tools/concept-v2/app
npm run lint
npm run check --prefix tools/concept-v2/app
node --experimental-strip-types --test tests/redesign-release-host.test.mjs tests/redesign-build-stamp.test.mjs tests/redesign-asset-delivery.test.mjs
npm run build
npm run release:package
```

Первый и второй ci имеют отдельные lockfiles. Публичной сборке не требуется
install/build Payload или старой Admin. Native CMS имеет свои независимые проверки.

Prebuild создаёт .portfolio-release/site из approved sources и release entry,
без test/lab/preview routes. Postbuild фиксирует успешный Next build, SHA,
site manifest, BUILD_ID и fingerprints фактических standalone/static файлов.
Упаковка разрешена только для чистого exact HEAD с совпадающим завершённым build.
Scratch build на dirty source допускает разработку, но упаковка его запрещена.
После commit/merge обязательно пересобрать на фактическом новом SHA.

Архив .portfolio-release/<SHA>.tar.gz содержит server.js, минимальный package.json,
Next runtime/static, compiled approved site, DEPLOY_SHA и deploy-v2 SHA-256 manifest.
Sources, docs, tests, old public/concept-v2, Admin/CMS/stores, secrets, source maps,
native Mac modules и пути checkout исключены. Host работает из подготовленных
изображений; Next image optimizer отключён. Лимит архива — 75 MiB.

## Проверить реальный архив

Распаковать архив в новую временную папку, проверить RELEASE_MANIFEST.json
существующим deploy-v2 validator, запустить node server.js на отдельном loopback
порту. Не использовать старый root public или dev server как доказательство.
Проверить /, /projects/corvo, /projects/sarafan-radio (200); /projects (307 →
/#projects); /404, неизвестные/старые адреса (404), HEAD, robots/sitemap, metadata,
все manifest-listed ресурсы, CSP и credential-free CORS layout packages.

Обязательно проверить настоящий Next runtime (handler unit-test не покрывает
зарезервированный Next адрес /404):

```sh
node tools/portfolio-release/verify-runtime.mjs http://127.0.0.1:<PORT> <EXACT_SHA>
```

/404 внутренне переписывается на release-not-found до маршрутизации Next,
адрес посетителя остаётся /404, ответ — настоящий 404 с новым интерфейсом.

Desktop и пограничные состояния проверяются по матрице active ExecPlan:
../../docs/exec-plans/redesign-production-release.md. Мобильную/планшетную версию
портфолио не разрабатывать; внутренние adaptives проекта сохраняются.

## Production gate

Этот документ и успешная локальная сборка не разрешают merge, push, upload или
activation. До разрешения — только read-only production preflight, локальная
проверка отката и показ точной сборки пользователю. Перед переключением подтвердить
exact deployed baseline и возможность вернуть его. Существующий deploy-v2 server
protocol остаётся инфраструктурным механизмом; правила/данные старой Des-art Admin
не являются источником нового сайта или Payload lifecycle.

Прежний сайт сохраняется для возврата. Архивировать его вне публичных маршрутов
можно только после подтверждения пользователя, что новый production работает.
