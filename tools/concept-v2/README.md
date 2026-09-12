# Concept V.2

Обычная дополнительная страница сайта: /concept-v2 (вариант с завершающим / нормализуется существующим Next.js redirect).
Не добавляется в меню или sitemap. Это публичная ссылка, не авторизация: meta robots и X-Robots-Tag задают noindex,nofollow.

## Граница

Статический снимок принятого прототипа8b39e5e9600e53269d69e373d33d770b6f2ba28a.
Исходники сохранены в source.tar.gz: только src, public, vendor, package.json, vite.config.js, index.html из этого commit.
Нет local drafts, Admin runtime, credentials, node_modules, Git, evidence или пользовательских архивов.
Все собственные ресурсы под /concept-v2/; стили и React bundle не импортируются основной страницей.
Главная, проекты, canonical content/assets, Admin и зависимости основного приложения не меняются.

## Воспроизведение

В отдельной рабочей копии сначала переместить существующий public/concept-v2 в резервную папку вне checkout (build намеренно не перезаписывает снимок). Затем выполнить:

    node tools/concept-v2/build.mjs /absolute/path/to/prototype/node_modules

Зависимости прототипа указаны точными версиями в сохранённом package.json. Можно установить их в отдельно распакованном source.tar.gz. Скрипт проверяет версии. Обычный build сайта использует уже сохранённый public/concept-v2 и не устанавливает Vite.

## Проверка и выпуск

PORTFOLIO + OPS; MEDIUM / ELEVATED / FULL.
База: main и опубликованный release5faae9ea3ab7f8be738b31d0be611044e6d6f971.
Проверить production build, /concept-v2, ресурсы, лупу, 36px кнопки, mobile, noindex и неизменность /, /projects, /projects/corvo.
Два review: полнота/fidelity, затем isolation/regression/release risk.
Никаких изменений Nginx, DNS, SSH, CMS или данных. Merge/deploy только через установленный release gate по exact SHA.
Откат: revert добавления этой страницы и стандартный release; аварийный server rollback — по docs/ops/DEPLOY.md.

## Источники механики публикации

## Приёмка candidate

Production build Next16.2.10 и lint: PASS. check.mjs: три варианта URL, noindex, точные байты всех ресурсов, / и обе страницы проектов: PASS.
Изолированный Chromium: desktop1440 и mobile390, SVG-лупа, подавление импульсов при наведении, кнопки36px, только /concept-v2/ resource requests, ошибок страницы нет.
Независимое review:76 файлов source archive совпадают с prototype SHA,52 исходных public assets без изменений; исходящие asset paths имеют prefix. Отдельная проверка scope/regression не нашла изменений canonical content, Admin, dependencies или существующих страниц.
Единственное замечание о повторной сборке уточнено в инструкции выше.

## Документация

- https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites
- https://vite.dev/guide/build.html#public-base-path
