# Concept V2 — обновление главной и Library V2

**Статус:** `READY_FOR_REVIEW`. **Ветка:** `codex/redesign-portfolio`.
**Базовый commit:** `eca46ce13c15fb44885a3955ef256aa3e8ffca61`.

## Outcome

Сверить и точечно обновить главную Concept V2 по current source Figma и
Library V2, сохранив утверждённое поведение Hero по высоте окна и все
out-of-scope runtime-механики.

## Источники и границы

- Main page: `3960:274722`, Sections/Projects+Process: `3960:274725`, AI:
  `3960:274763` в `sgKtUASp0aYzdkeH8kcXrL`.
- Library typography: `2172:2780` в `nrqHGuE0qOo4Dwj59I9wEc`.
- В scope: Concept V2 runtime, его тесты и долговечные evidence-документы.
- Не входят: Admin, Shared contract, public portfolio, preloader, 404,
  isolated project Hero, Corvo scenes, Figma write, merge и deploy.
- Адреса действий «Сарафан.Радио» отложены: в runtime не добавляются
  вымышленные переходы.

## Группы и доказательства

1. **Основа и Library — COMPLETE.** Semantic palette и states controls;
   evidence: 151 tests, lint, production build, built-runtime smoke и локальная
   проверка main. Commit фиксирует этот checkpoint.
2. **Projects — COMPLETE.** Один Corvo и один «Сараффан.Радио» с
   подтверждённой геометрией `638.5×661`, Preview `329` и Main `332` px.
   Для Сараффан добавлены исходные Figma PNG, локальные `640/1080` AVIF,
   категории, жёлтая метка и статические действия без вымышленных переходов.
   Многослойный пурпурный знак взят из уже реализованной главной по прямому
   указанию пользователя; исходники публичной главной не менялись. Evidence:
   152 tests, lint, Vite production build, built-runtime smoke и AX-проверка.
3. **AI и остальные секции — COMPLETE.** AI теперь повторяет current source:
   центральная панель `1280×335`, content field `241px`, синяя полоса `94px`,
   локальные source assets hatch/Codex и точная copy. Удалены прежние
   ChatGPT/Codex cards и chip. Process сверен с `3960:274725`; Experience,
   About и Footer оставлены без визуальных правок, поскольку current semantic
   roles и их принятая геометрия уже соответствуют подтверждённой части scope.
   Scroll, viewer и hover-механики не менялись. Evidence: focused tests,
   полный набор `152/152`, lint, Vite production build, built-runtime smoke и
   AX-проверка локальной главной на отдельном текущем preview.

После последней группы проведены две проверки: fidelity/completeness подтвердила
все прямые children AI source и отсутствие старого списка; regression/scope
подтвердила, что затронуты только Concept V2 runtime, tests, source assets и
evidence-документы. Hero сохраняет viewport-height behavior.
