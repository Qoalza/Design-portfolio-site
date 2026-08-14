# Site refresh v2 — regression fix QA

Статус: `READY_FOR_USER_REVIEW` после финальных lint/build/smoke и публикации ветки.

## Эталон

- Главная: Figma node `262:2382`, свежий export `1440 × 6018 px`.
- Corvo: Figma node `373:47103`, свежий export `1440 × 4007 px`; содержит `Desktop / Tablet / Mobile`.
- Футер: Figma node `378:50597`, свежий export `1200 × 60 px`.
- Основной контроль: viewport `1440 × 900`, zoom `100%`.
- Дополнительные desktop-проверки: `1280 × 900`, `1920 × 1080` и Retina `DPR=2`.

## Причины и исправления

1. Секцию проектов перекрывал полностью непрозрачный `hero-background.png`, который выходил из hero stacking context до `y≈1439`, тогда как проекты начинались на `y=1004`. Монолитный PNG заменён исходной SVG-композицией Figma. DOM и размеры секций не маскировались ручными offsets.
2. PNG `1440 × 1431` использовался как полноэкранный источник и давал только около `1x` на Retina. Hero теперь состоит из исходных SVG; raster upscale отсутствует.
3. Прямоугольный шов был границей того же непрозрачного PNG. У SVG-слоёв прозрачные края, поэтому переход hero → проекты не имеет растровой границы.
4. Геометрия `ai-info.svg` была правильной, но встроенный `#E2E2EC` выводился напрямую. Как в Figma, SVG используется mask с точным `#218ee6`, `24 × 24 px`, opacity `1`.
5. Footer SVG были точными по форме, но выводились со встроенным `#E2E2EC`. Они используются как masks с точным `#8c949b`, `16 × 16 px`, без общего opacity.
6. В frontmatter отсутствовал Tablet, а UI сводил любую неизвестную платформу к desktop-иконке. Добавлен строгий `ProjectPlatform`, data-driven mapping и точные свежие SVG `Desktop 21 × 19`, `Tablet 17 × 21`, `Mobile 13 × 21`.
7. Все четыре Corvo PNG побайтно совпадают с raw images Figma: `2960 × 1920`, `1960 × 546`, `2960 × 1920`, `2960 × 2278`. Размытие создавал Next Image при повторной lossy-оптимизации `q=75`. В lightbox теперь отдаётся исходный PNG без повторного кодирования; thumbnail-путь не менялся.
8. Live typography-дефект не подтвердился. `document.fonts.status=loaded`; Google Sans `500`, Onest `350/400`, Source Code Pro `450` реально выбираются; `font-synthesis:none`; transform/filter/backdrop-filter/opacity на текстовых родителях отсутствуют. Размытие воспроизводилось только в QA-capture: Retina `2560 × 1440 PNG` автоматически преобразовывался встроенным screenshot API в lossy `1280 × 720 JPEG`. Новые QA-кадры сохранены нативным PNG через CDP; CSS-цвета и веса Figma не изменялись.

## Focused browser evidence

- `comparison-hero.png` — векторный hero целиком.
- `comparison-hero-projects-transition.png` — переход без шва и без перекрытия.
- `comparison-projects-start.png` — полный заголовок и карточка Corvo.
- `comparison-ai-fact.png` — AI-блок и синяя info-иконка.
- `comparison-footer.png` — точные footer masks на baseline.
- `comparison-corvo-platforms.png` — `Desktop / Tablet / Mobile` против актуального Figma.
- `comparison-lightbox.png` — raw Figma image и фактический production lightbox.
- `comparison-gray-text.png` — серый Onest-текст Figma/production крупным планом.

## Проверенные инварианты

- На `1280`, `1440`, `1920 px`: horizontal overflow отсутствует; heading проектов `418.695 × 48 px`, Corvo card `1200 × 440 px`, оба видимы.
- Якорь «Мои работы»: URL получает `#projects`, `scrollY=956`, заголовок начинается на `48 px`.
- Полная высота главной: `6018 px`; Corvo: `3945 px`.
- Lightbox `1440 × 900`: raw overview `2960 × 1920` отображается примерно `1240 × 804`.
- Lightbox `1920 × 1080`: raw overview отображается примерно `1517 × 984`.
- Retina `DPR=2`: все четыре expanded images используют прямые `/assets/projects/corvo/*.png` и исходные natural dimensions.
- Закрытие Escape сохраняет позицию, снимает scroll lock и возвращает focus на trigger.
- Console errors, warnings и hydration warnings отсутствуют в production-preview.
- Все изображения актуальных focused captures загружены; web fonts имеют статус `loaded`.

## Границы

Goal 2 и Goal 3 не начаты. Sticky-header, нижняя плавающая панель проекта, новые анимации, страницы ошибок, адаптив ниже `1280 px`, merge и deploy не выполнялись.
