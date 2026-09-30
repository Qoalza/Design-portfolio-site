# HANDOFF

Обновлено: 2026-10-01.

## Текущий checkout

- Ветка: `codex/redesign-portfolio`.
- Worktree: `/Users/designer/.codex/worktrees/redesign-portfolio/Design-portfolio-site`.
- Контракт и история сборки: `docs/exec-plans/redesign-portfolio-consolidation.md`.

## Checkpoint

- Локальный Concept V2 объединяет главную, страницу Corvo, 404, прелоадер,
  изолированный Hero preview и четыре сцены Corvo.
- Страница Corvo перенесена из `codex/redesign-project-page` (`44bafef`):
  карточка главной открывает `/projects/corvo`, ссылка «Главная» возвращает
  обратно, прямой вход на проект проходит через прелоадер.
- Ранее пройдены Vite build и браузерные маршруты главная → Corvo → главная,
  прямой вход на Corvo, 404 и сцена Statistics.
- Исправлен скачок из «Обо мне» в незавершённый путь опыта после закрытия фото:
  блок опыта сохраняет геометрию при временной блокировке прокрутки. В браузере
  проверены открытие/закрытие фото и сохранение позиции секции.
- Desktop-главная обновлена по Figma `4150:804068`: геометрия и верхние
  эффекты Projects и Process, статичная двухколоночная AI-композиция,
  подложка Experience `20px` внутри плиток `320px` с `60%` opacity и без
  нижнего поля, упрощённый About и Hero-chip `Middle+ / Senior`.
- Горизонтальный Hero, поведение и длительности анимаций карточек сохранены.
  Copy/View и часы из шаблона Figma не добавлены. Изменения ограничены
  desktop; прежние tablet/mobile правила и текст Hero-chip сохранены.
- В финальной проверке исправлены каскад Process, который возвращал декор в
  flex-flow, и пустые Sarafan AVIF: карточка использует проверенный PNG.
  В браузере подтверждены обе верхние сцены Projects и три карточки Process.
- Повторный аудит текущего runtime против Figma `4150:804068` исправил цвет
  служебных подписей Projects/Process на neutral thin `#475157` и новую
  embedded-геометрию About Preview: front `320×436`, rear `256×336` на
  `y=50`. Viewer `420px`, траектории и длительности анимаций сохранены.
- Итоговый `npm run check` прошёл: lint, `161/161` tests и production build.
  План: `796ee61`; реализация: `594bbd8`. Два последовательных review не
  нашли оставшихся fidelity или regression проблем. Пользовательская
  визуальная приёмка открыта.
  Актуальный локальный просмотр: `http://127.0.0.1:4189/`.

## Stop-lines

Не трогать Admin, Shared contract, `USERSPACE/**`, `main`, production,
Figma, опубликованный Next.js Portfolio и старые worktree/ветки. Очистка и
deploy не входят в эту цель.
