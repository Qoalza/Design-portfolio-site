# Design Portfolio Site

Русскоязычное портфолио Product Designer с публичным Next.js-сайтом и отдельной локальной админкой для проектного контента.

## Что находится в репозитории

- `src/app` — публичный Portfolio на Next.js App Router.
- `src/components`, `src/lib` — публичные компоненты, runtime-механики и общий контракт проектов.
- `content/projects/*.json` — канонические опубликованные проектные документы schema v3.
- `public/assets` — публичные локальные ассеты.
- `tools/des-art-admin` — локальный Des-art Admin: UI, draft compiler, preview и publish worker.
- `tests` — focused contract, runtime и Admin tests.
- `design-system` — read-only baseline дизайн-системы и icon library.
- `design-reference` — evidence конкретных visual/runtime проверок; не current source of truth.
- `docs` — долговечные карты контрактов, runtime/runbook и архивная документация.
- `USERSPACE` — локальная пользовательская папка вне Git/project scope; Codex не читает её без прямого точечного запроса пользователя.

## Требования

- Node.js 20.9+ для обычной разработки; production environment проверяется отдельно по runbook.
- npm.

## Публичный Portfolio

```bash
npm install
npm run dev
```

Открыть `http://localhost:3000`.

Production build:

```bash
npm run build
npm run start
```

## Des-art Admin

```bash
npm run admin:build
```

Обычный `npm run build` запускает Admin build через `prebuild`.

Пользовательский запуск, local storage, preview, Figma read-only import, одноразовый live bootstrap и обычная live-публикация описаны в:

- `tools/des-art-admin/README.md`;
- `tools/des-art-admin/SPEC.md`.

Admin UI использует Radix Themes только внутри своего статического bundle. Публичный App Router не импортирует Radix.

## Проектный контент

Текущий published source — JSON в `content/projects/`.

Исполняемая schema и validator находятся в `src/lib/project-contract.ts`.

Все проекты, включая Corvo, используют общий project-content contract. Исторические материалы отдельных старых кейсов могут находиться в `docs/archive/**`, но не участвуют в обычном runtime/workflow.

## Команды

- `npm run dev` — публичный development server.
- `npm run admin:build` — собрать Admin bundle.
- `npm run lint` — ESLint.
- `npm run build` — Admin prebuild + production Next.js build.
- `npm run start` — запустить production Next.js build.
- Focused Node tests запускаются точными файлами из `tests/` по области изменения.

## Документы

- `AGENTS.md` — правила работы агента и routing контекста.
- `HANDOFF.md` — короткий текущий checkout/checkpoint.
- `DESIGN_SYSTEM.md` — Figma↔code component contract.
- `DESIGN_QA.md` — только активные visual findings.
- `ACCESSIBILITY_EXCEPTIONS.md` — current/revalidation Figma↔WCAG exceptions.
- `PROJECT_HISTORY.md` — важная завершённая история.
- `docs/shared/PROJECT_CONTENT.md` — ownership/lifecycle проектного контента.
- `docs/portfolio/RUNTIME.md` — cross-component Portfolio runtime invariants.
- `docs/ops/DEPLOY.md` — production runbook.
- `docs/exec-plans/*.md` — living execution plans только когда нужен durable state.
- `docs/archive/**` — legacy/history, не current source of truth.
- `USERSPACE/**` — локальные пользовательские материалы, не project documentation.

## Важные границы

- Figma по умолчанию read-only.
- Не хранить secrets в repository/docs.
- Не выполнять merge/deploy без отдельного точного подтверждения.
- Старый evidence не заменяет актуальную проверку current code/Figma/runtime.
- `USERSPACE/**` не читать и не использовать в разработке без прямого точечного запроса пользователя.
