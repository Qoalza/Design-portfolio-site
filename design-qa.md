# Design QA

Дата: 2026-08-11

## Текущий статус

`READY_FOR_USER_REVIEW`.

Это не статус `PASSED`: пересобранная главная ожидает пользовательского принятия. Предыдущие статусы `REJECTED_BY_USER`, `IMPLEMENTATION_INCOMPLETE`, `STRUCTURAL_MISMATCH`, `VISUAL_QA_INVALID` относятся к старой реализации; её comparison остаётся недействительным.

## Источник проверки

- Figma: node `262:2382`, frame `Test design`, `1440 × 5976 px`.
- Актуальный экспорт Figma совпадает с `design-reference/homepage-figma-1440x5976.png`.
- Production DOM: `1440 × 5976 px`, без горизонтального переполнения.
- Полная инвентаризация: `design-inventory.md`.

## Посекционные comparison 1:1

| Секция | Размер | Figma | Production |
|---|---:|---|---|
| Шапка | `1440 × 80` | [header-figma.png](design-reference/homepage-qa-rebuild/header-figma.png) | [header-implementation.jpg](design-reference/homepage-qa-rebuild/header-implementation.jpg) |
| Hero | `1440 × 924` | [hero-figma.png](design-reference/homepage-qa-rebuild/hero-figma.png) | [hero-implementation.jpg](design-reference/homepage-qa-rebuild/hero-implementation.jpg) |
| Проекты | `1440 × 1332` | [projects-figma.png](design-reference/homepage-qa-rebuild/projects-figma.png) | [projects-implementation.jpg](design-reference/homepage-qa-rebuild/projects-implementation.jpg) |
| Процесс | `1440 × 1884` | [process-figma.png](design-reference/homepage-qa-rebuild/process-figma.png) | [process-implementation.jpg](design-reference/homepage-qa-rebuild/process-implementation.jpg) |
| AI | `1440 × 616` | [ai-figma.png](design-reference/homepage-qa-rebuild/ai-figma.png) | [ai-implementation.jpg](design-reference/homepage-qa-rebuild/ai-implementation.jpg) |
| Резюме | `1440 × 1080` | [resume-figma.png](design-reference/homepage-qa-rebuild/resume-figma.png) | [resume-implementation.jpg](design-reference/homepage-qa-rebuild/resume-implementation.jpg) |
| Footer | `1440 × 60` | [footer-figma.png](design-reference/homepage-qa-rebuild/footer-figma.png) | [footer-implementation.jpg](design-reference/homepage-qa-rebuild/footer-implementation.jpg) |

## Результат технической проверки

- Размеры всех секций и их последовательность совпадают с Figma; общая высота — `5976 px`.
- Восстановлены отсутствовавшие SVG, составные логотипы, полный контент и точная структура process/experience.
- `npm run lint` — успешно.
- `npm run build` — успешно; первая попытка в песочнице упала на запрете локального порта Turbopack, та же команда в разрешённом локальном контексте прошла.
- Production route smoke: `/`, `/projects`, `/projects/example-project`, `/mdx-test` — `200`; неизвестный маршрут — `404`.
- DOM audit: один `h1`, корректные landmarks, `lang="ru"`, уникальные ID, все изображения имеют `alt`, битых изображений и пустых ссылок нет.
- Read-only web-quality review не выявил новых Critical/High дефектов. Зафиксированные конфликты контраста и desktop-only reflow перечислены в `ACCESSIBILITY_EXCEPTIONS.md` и сохранены по политике приоритета Figma.

## Исторические недействительные материалы

- `design-reference/homepage-implementation-1440x5976.png` — отклонённая реализация.
- `design-reference/homepage-comparison-final.jpg` — `INVALID`, не использовать как доказательство текущей версии.
