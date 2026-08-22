# Эксперимент: сохранение SVG Stroke из Figma

Дата: 2026-08-20  
Figma file: `jeml9SBpTFZNNWb3IeQaKA`  
Режим Figma: только чтение

## Проверка актуального состояния

- В библиотеке по-прежнему 302 component nodes: 300 пользовательских иконок и 2 служебных Mask-компонента.
- Видимые исходные Stroke используют только два требуемых веса: Light `1 px`, Medium `1.3 px` (`1.2999999523162842` во внутреннем числовом представлении Figma).
- `Link-02` повторно проверен: Light `1 px`, Medium `1.3 px`; прямой экспорт содержит настоящий `stroke`.
- `Duotone / Medium / Refresh-point` повторно проверен: `1.3 px`, прямой экспорт содержит настоящий `stroke`.
- В `Line / Light / Sale-02` остался скрытый старый слой `1.3 px`, но он имеет `visible=false`; видимый слой и итоговый экспорт корректно используют `1 px`. Он не влияет на SVG и не изменялся.

## Выбранные случаи

| Иконка | Причина выбора | Штатный результат |
| --- | --- | --- |
| `Download-cloud-01 / Line / Light` | mixed cap в vector network | Приемлем: настоящий Stroke `1 px` |
| `Close-filter-funnel-02 / Line / Medium` | mixed join, сложная vector network, пустой Boolean-слой | Отклонён: линия `1.3 px` превращена в outlined Fill |
| `Bar-chart-10-plus / Duotone / Light` | fill-region + сложная vector network с mixed join | Отклонён: secondary fill сохранён, но Stroke превращён в outlined Fill |

## Подтверждённые причины

1. Внешняя цветовая Mask не является причиной: она не входит в subtree выбранных компонентов. Прямой экспорт component frame без Mask сохраняет `viewBox="0 0 24 24"`.
2. Mixed cap сам по себе не заставляет Figma outline-ить линию. У `Download-cloud-01` различие находится на внутренней вершине сети и не создаёт разных видимых endpoint caps; Figma штатно отдаёт Stroke с butt cap и round join.
3. Outline возникает на сложных vector networks, где один VectorNode объединяет несколько ветвей/регионов и mixed join semantics. Штатный SVG-экспорт заменяет stroke area длинным залитым контуром.
4. Пустой `BOOLEAN_OPERATION` внутри `Close-filter-funnel-02` имеет размер `0×0`, не содержит детей и не экспортируется как видимый слой. Он не является причиной outline; фактическая проблемная геометрия находится в соседнем VectorNode.
5. Экспорт широкого subtree через asset-download был отклонён: в файл попали фоновые ancestor-слои библиотеки. Для baseline нужен прямой `component.exportAsync({ contentsOnly: true })`, а не ancestor-context export.

## Протестированные методы

### 1. Прямой component export без внешней Mask

- `Download-cloud-01`: **PASS**. Штатный SVG уже технически корректен.
- `Close-filter-funnel-02`: **FAIL**. Нет `stroke`, основная линия — outlined Fill.
- `Bar-chart-10-plus`: **FAIL**. Полупрозрачный fill сохранён, основная линия — outlined Fill.

### 2. Раздельное представление исходных ветвей Stroke

- `Close-filter-funnel-02`: **PASS**. Funnel и `X` записаны двумя SVG `<path>` с единым `stroke-width="1.3"`.
- `Bar-chart-10-plus`: **PASS**. Fill-region остаётся токенизированным `currentColor` с `fill-opacity="0.2"`, а обе геометрические ветви имеют настоящий `stroke-width="1"`.
- `Download-cloud-01`: **PASS**, но отдельный конвертер не требуется; кандидат лишь нормализует цвет и явные атрибуты.

### 3. Минимальный experimental vectorNetwork → SVG Stroke converter

Создан только для трёх выбранных форм. Он использует прочитанные `vectorPaths`, component-relative transforms и явные свойства Stroke. Полноценным универсальным экспортёром не является.

## XML-доказательства

Light (`1 px`):

```xml
<path
  fill="none"
  stroke="currentColor"
  stroke-width="1"
  stroke-linecap="butt"
  stroke-linejoin="round"
/>
```

Medium (`1.3 px`):

```xml
<path
  fill="none"
  stroke="currentColor"
  stroke-width="1.3"
  stroke-linecap="butt"
  stroke-linejoin="round"
/>
```

Duotone fill-region, который остаётся Stroke-геометрией по контуру:

```xml
<path
  fill="currentColor"
  fill-opacity="0.2"
  stroke="currentColor"
  stroke-width="1"
  stroke-linecap="butt"
  stroke-linejoin="round"
/>
```

Все кандидаты:

- проходят `xmllint --noout`;
- имеют `viewBox="0 0 24 24"`;
- используют `currentColor`;
- явно сохраняют `stroke-width`, `linecap`, `linejoin`;
- для Line не содержат залитых контуров основного рисунка;
- при рендере в `16`, `24`, `32`, `48 px` остаются Stroke-путями, а не масштабируемой Fill-геометрией.

## Числовое визуальное сравнение

Сравнение выполнялось после композиции на одинаковом фоне. Figma PNG и SVG-рендерер имеют небольшую собственную разницу антиалиасинга, поэтому дополнительно сравнивались кандидат и штатный визуальный outline в одном SVG-рендерере.

| Иконка | Figma → кандидат RMSE | Кандидат → штатная геометрия, максимальный RMSE на 16/24/32/48 |
| --- | ---: | ---: |
| Download-cloud-01 | 3.84 | 2.40 |
| Close-filter-funnel-02 | 2.17 | 1.18 |
| Bar-chart-10-plus | 1.15 | 1.44 |

Визуальные листы находятся рядом с каждым кандидатом и в `comparison-all.png`.

## Рекомендация для будущего массового экспорта

Использовать двухступенчатый pipeline:

1. Экспортировать каждый canonical component frame напрямую без внешней Mask и автоматически принимать только SVG, где структура уже соответствует политике Stroke.
2. Только для отклонённых файлов запускать graph-aware fallback: читать исходные `vectorPaths`/`vectorNetwork`, разделять ветви по совместимым cap/join/region semantics, сохранять component transforms и `24×24` viewBox, а Duotone regions выводить как tokenized fill + реальный Stroke.
3. Каждый результат блокирующе проверять XML-валидатором и structural policy до добавления в baseline.

Это позволяет не перерисовывать библиотеку вручную и не прогонять сложный конвертер там, где Figma уже экспортирует корректный Stroke.

## Ограничения эксперимента

- Не доказана универсальная декомпозиция branching vector networks с реально различающимися видимыми endpoint caps внутри одной ветви.
- Не тестировались variable-width, brush/dynamic strokes, inside/outside stroke emulation и сложные Boolean results с живыми дочерними операндами.
- Пустой Boolean-слой из выбранной иконки не пригоден для проверки экспорта исходных Boolean operands; он лишь подтвердил, что Boolean не был причиной текущего outline.
- Скрытый старый слой `Sale-02` не изменялся из-за read-only режима Figma.
- Массовый экспорт и основной baseline не обновлялись.
