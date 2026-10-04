'use client'

import { useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import { moveItem, replaceValue, type Value, type ValuePath } from '../authoring/model'
import { switchHero } from '../authoring/hero'
import styles from './release-editor.module.css'

const labels: Record<string, string> = {
 description: 'Описание', subtitle: 'Подзаголовок', role: 'Роль', year: 'Год', tags: 'Теги', detailTags: 'Теги кейса',
 materials: 'Материалы проекта', figmaUrl: 'Ссылка на Figma', projectState: 'Состояние проекта', fileState: 'Состояние материалов',
 redesign: 'Страница и Hero', card: 'Карточка на главной', tag: 'Подпись карточки', preview: 'Изображения карточки', back: 'Задний экран', front: 'Передний экран',
 page: 'Содержимое страницы', summary: 'Введение', notice: 'Примечание', heading: 'Заголовок', title: 'Название', body: 'Текст',
 metrics: 'В цифрах', items: 'Элементы', label: 'Подпись', value: 'Значение', secondaryValue: 'Дополнительное значение',
 copy: 'Текст', action: 'Ссылка', href: 'Адрес ссылки', sections: 'Разделы', blocks: 'Содержимое', content: 'Текст', text: 'Текст',
 paragraphs: 'Абзацы', flow: 'Сценарий', result: 'Результат', showcase: 'Пример сценария', eyebrow: 'Надзаголовок', image: 'Изображение', alt: 'Описание изображения',
 hero: 'Hero проекта', scenes: 'Сцены', slides: 'Экраны', source: 'Верстка', adaptives: 'Адаптивы', enabled: 'Доступные размеры',
}
const projectFields = new Set(['description', 'subtitle', 'role', 'year', 'tags', 'detailTags', 'materials', 'redesign'])
const hidden = new Set(['schemaVersion', 'version', 'designProfile', 'visibility', 'catalogOrder', 'homePlacement', 'slug', 'templateId', 'chromeProfile', 'id', 'type', 'kind', 'level', 'variant', 'width', 'height', 'src', 'minWidth', 'maxWidth', 'presetWidth', 'files', 'assetBase', 'entry', 'sha256', 'size', 'mime'])
const choices: Record<string, readonly string[]> = {
 projectState: ['in_progress', 'completed'], fileState: ['available', 'absent', 'unavailable'], style: ['ordered', 'unordered'],
}
const choiceLabels: Record<string, string> = { in_progress: 'В процессе', absent: 'Нет материалов', unavailable: 'Пока недоступно', completed: 'Завершён', available: 'Доступно', ordered: 'Нумерованный', unordered: 'Маркированный', mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' }
type EditProps = { value: Value; path: ValuePath; name: string; root: Value; change: (path: ValuePath, value: Value) => void; reorder: (path: ValuePath, from: number, to: number) => void; readOnly: boolean }

function EditorNode({ value, path, name, root, change, reorder, readOnly }: EditProps) {
 const label = labels[name] || name
 if (Array.isArray(value)) {
  if (name === 'marks') return <fieldset className={styles.group}><legend>Оформление текста</legend>{(['strong', 'emphasis', 'underline'] as const).map(mark => <label key={mark}><input type="checkbox" disabled={readOnly} checked={value.includes(mark)} onChange={event => change(path, event.target.checked ? [...value, mark] : value.filter(item => item !== mark))} /> {{ strong: 'Жирный', emphasis: 'Курсив', underline: 'Подчёркнутый' }[mark]}</label>)}</fieldset>
  if (name === 'enabled') return <fieldset className={styles.group}><legend>{label}</legend>{['mobile', 'tablet', 'desktop'].map(id => <label key={id}><input type="checkbox" disabled={readOnly} checked={value.includes(id)} onChange={event => change(path, event.target.checked ? [...value, id] : value.filter(item => item !== id))} /> {choiceLabels[id]}</label>)}</fieldset>
  const canReorder = ['slides', 'paragraphs', 'summary', 'blocks', 'content'].includes(name)
  return <details className={styles.group} open={name === 'slides' || name === 'scenes'}><summary>{label} · {value.length}</summary>{value.map((item, index) => {
   const identifier = item && typeof item === 'object' && !Array.isArray(item) && typeof item.id === 'string' ? item.id : index
   return <div className={styles.item} key={identifier}><div className={styles.itemHeader}><span>{index + 1}</span>{canReorder ? <span><button type="button" disabled={readOnly || index === 0} onClick={() => reorder(path, index, index - 1)} aria-label={`${label}: переместить ${index + 1} выше`}>↑</button><button type="button" disabled={readOnly || index === value.length - 1} onClick={() => reorder(path, index, index + 1)} aria-label={`${label}: переместить ${index + 1} ниже`}>↓</button></span> : null}</div><EditorNode value={item} path={[...path, index]} name={typeof item === 'string' ? 'text' : label} root={root} change={change} reorder={reorder} readOnly={readOnly} /></div>
  })}</details>
 }
 if (value && typeof value === 'object') {
  if (name === 'source' && value.kind === 'package') return <p className={styles.hint}>Подключён пакет верстки. Его файлы сохраняются вместе с версией проекта.</p>
  return <details className={styles.group} open={path.length === 0 || name === 'redesign' || name === 'hero' || name === 'page'}><summary>{label}{name === 'hero' ? ` · ${value.kind === 'layout' ? 'Верстка' : 'Фикс адаптив'}` : ''}</summary>{name === 'hero' ? <label className={styles.field}>Вариант Hero<select aria-label="Вариант Hero" disabled={readOnly} value={String(value.kind)} onChange={event => change([], switchHero(root, event.target.value === 'layout' ? 'layout' : 'raster'))}><option value="layout">Верстка</option><option value="raster">Фикс адаптив</option></select><span className={styles.hint}>Настройки предыдущего варианта сохраняются. Фикс адаптив — только Desktop; для публикации нужно 3, 5, 7 или 9 экранов.</span></label> : null}{Object.entries(value).filter(([key]) => !hidden.has(key) && (path.length !== 0 || projectFields.has(key))).map(([key, item]) => <EditorNode key={key} value={item} path={[...path, key]} name={key} root={root} change={change} reorder={reorder} readOnly={readOnly} />)}</details>
 }
 if (name === 'initialSceneId' || name === 'initialSlideId') {
  const hero = root && typeof root === 'object' && !Array.isArray(root) && root.redesign && typeof root.redesign === 'object' && !Array.isArray(root.redesign) ? root.redesign.hero : null
  const list = hero && typeof hero === 'object' && !Array.isArray(hero) ? hero[name === 'initialSceneId' ? 'scenes' : 'slides'] : []
  return <label className={styles.field}>Начальный экран<select disabled={readOnly} value={String(value)} onChange={event => change(path, event.target.value)}>{Array.isArray(list) ? list.map(item => item && typeof item === 'object' && !Array.isArray(item) ? <option key={String(item.id)} value={String(item.id)}>{String(item.title)}</option> : null) : null}</select></label>
 }
 if (typeof value === 'boolean') return <label className={styles.field}><input type="checkbox" disabled={readOnly} checked={value} onChange={event => change(path, event.target.checked)} /> {label}</label>
 if (typeof value === 'number') return <label className={styles.field}>{label}<input type="number" disabled={readOnly} value={value} onChange={event => { const parsed = Number(event.target.value); if (Number.isFinite(parsed)) change(path, parsed) }} /></label>
 if (typeof value !== 'string') return null
 if (choices[name]) return <label className={styles.field}>{label}<select disabled={readOnly} value={value} onChange={event => change(path, event.target.value)}>{choices[name].map(option => <option key={option} value={option}>{choiceLabels[option] || option}</option>)}</select></label>
 if (name === 'marks') return null
 return <label className={styles.field}>{label}{['href', 'url', 'figmaUrl'].includes(name) ? <input type="url" disabled={readOnly} value={value} onChange={event => change(path, event.target.value)} /> : <textarea rows={value.length > 100 ? 4 : 2} disabled={readOnly} value={value} onChange={event => change(path, event.target.value)} />}</label>
}

export const ReleaseEditor: JSONFieldClientComponent = ({ path, readOnly }) => {
 const field = useField<Value>({ path })
 if (!field.value || typeof field.value !== 'object' || Array.isArray(field.value)) return <p className={styles.hint}>Содержимое редизайна пока не подключено. Проект можно сохранить как черновик.</p>
 const disabled = Boolean(readOnly || field.disabled || field.formProcessing)
 return <section className={styles.editor} aria-label="Редактор проекта"><p className={styles.hint}>Изменения сохраняются штатными кнопками Payload. Сохранённый черновик и опубликованная версия разделены.</p><EditorNode value={field.value} root={field.value} path={[]} name="Проект" change={(at, value) => field.setValue(replaceValue(field.value, at, value))} reorder={(at, from, to) => field.setValue(moveItem(field.value, at, from, to))} readOnly={disabled} />{field.showError ? <p role="alert">{field.errorMessage}</p> : null}</section>
}
