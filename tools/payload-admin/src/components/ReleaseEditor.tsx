'use client'

import { useField, useDocumentInfo, useForm } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import { moveItem, removeSlide, replaceValue, valueAt, type Value, type ValuePath } from '../authoring/model'
import { switchHero } from '../authoring/hero'
import { appendCopy, removeCopy, copyKinds, setOptionalCopy } from '../authoring/copy'
import { LayoutMaterial } from './LayoutMaterial'
import { bindPackage,bindSceneUrl,packageRecords,sceneSourceSlot,type PackageMaterial } from '../authoring/packages'
import type { RedesignLayoutSource } from '../../../../src/lib/project-redesign-contract'
import { ImageMaterial } from './ImageMaterial'
import { bindImage, appendRaster, materialRecords, imageSlot, type Material } from '../authoring/materials'
import type { ImageContext } from '../materials/image-quality'
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
type EditProps = { value: Value; path: ValuePath; name: string; root: Value; change: (path: ValuePath, value: Value) => void; reorder: (path: ValuePath, from: number, to: number) => void; readOnly: boolean; upload: (at: ValuePath | null, file: File, context: ImageContext) => Promise<void>; uploadLayout:(at:ValuePath,files:File[],paths:string[],entry:string)=>Promise<void> }

function EditorNode({ value, path, name, root, change, reorder, readOnly, upload, uploadLayout }: EditProps) {
 const label = labels[name] || name
 if (Array.isArray(value)) {
  if (name === 'marks') return <fieldset className={styles.group}><legend>Оформление текста</legend>{(['strong', 'emphasis', 'underline'] as const).map(mark => <label key={mark}><input type="checkbox" disabled={readOnly} checked={value.includes(mark)} onChange={event => change(path, event.target.checked ? [...value, mark] : value.filter(item => item !== mark))} /> {{ strong: 'Жирный', emphasis: 'Курсив', underline: 'Подчёркнутый' }[mark]}</label>)}</fieldset>
  if (name === 'enabled') return <fieldset className={styles.group}><legend>{label}</legend>{['mobile', 'tablet', 'desktop'].map(id => <label key={id}><input type="checkbox" disabled={readOnly} checked={value.includes(id)} onChange={event => change(path, event.target.checked ? [...value, id] : value.filter(item => item !== id))} /> {choiceLabels[id]}</label>)}</fieldset>
  const kinds = copyKinds(root,path)
  const canReorder = ['slides', 'paragraphs', 'summary', 'blocks', 'content'].includes(name)
  return <details className={styles.group} open={name === 'slides' || name === 'scenes'}><summary>{label} · {value.length}</summary>{value.map((item, index) => {
   const identifier = item && typeof item === 'object' && !Array.isArray(item) && typeof item.id === 'string' ? item.id : index
   return <div className={styles.item} key={identifier}><div className={styles.itemHeader}><span>{index + 1}</span>{canReorder ? <span><button type="button" disabled={readOnly || index === 0} onClick={() => reorder(path, index, index - 1)} aria-label={`${label}: переместить ${index + 1} выше`}>↑</button><button type="button" disabled={readOnly || index === value.length - 1} onClick={() => reorder(path, index, index + 1)} aria-label={`${label}: переместить ${index + 1} ниже`}>↓</button></span> : null}{kinds.length ? <button type="button" disabled={readOnly || Boolean(item && typeof item==='object' && !Array.isArray(item) && item.type==='notice')} aria-label={`Удалить ${label}: ${index+1}`} onClick={()=>change([],removeCopy(root,path,index))}>Удалить</button>:null}{name === 'slides' ? <button type="button" disabled={readOnly || value.length <= 1} aria-label={`Удалить экран ${index+1}`} onClick={()=>{const hero=valueAt(root,['redesign','hero']) as {kind:string;initialSlideId:string;slides:{id:string}[]};change(['redesign','hero'],removeSlide(hero,index) as Value)}}>Удалить экран</button> : null}</div><EditorNode value={item} path={[...path, index]} name={typeof item === 'string' ? 'text' : label} root={root} change={change} reorder={reorder} readOnly={readOnly} upload={upload} uploadLayout={uploadLayout} /></div>
  })}{kinds.length ? <label className={styles.field}>Добавить элемент<select aria-label={`${label}: добавить элемент`} disabled={readOnly} value="" onChange={event=>{if(event.target.value) change([],appendCopy(root,path,event.target.value as Parameters<typeof appendCopy>[2]))}}><option value="">Выбрать…</option>{kinds.map(kind=><option key={kind} value={kind}>{{text:'Текст',link:'Ссылка',paragraph:'Абзац',heading:'Заголовок',list:'Список',hardBreak:'Разрыв строки',tag:'Тег'}[kind]}</option>)}</select></label>:null}</details>
 }
 if (value && typeof value === 'object') {
  if (imageSlot(path) && typeof value.src === 'string') {
   const material=materialRecords(root).find(item=>item.publicPath===value.src)
   return <details className={styles.group} open><summary>{label} · {String(value.width)}×{String(value.height)}</summary><ImageMaterial label={`${label}: заменить изображение`} readOnly={readOnly} material={material} upload={(file,context)=>upload(path,file,context)} /><EditorNode value={value.alt??''} path={[...path,'alt']} name="alt" root={root} change={change} reorder={reorder} readOnly={readOnly} upload={upload} uploadLayout={uploadLayout} /></details>
  }
  const optional = path.length===0 ? ['subtitle'] : path.length===1 && path[0]==='materials' ? ['figmaUrl'] : path.join('.')==='redesign.card' ? ['tag'] : path[0]==='redesign' && path[1]==='page' && path.includes('metrics') && value.id ? ['secondaryValue'] : []
  const inline = path[0]==='redesign' && path[1]==='page' && ['text','link'].includes(String(value.type))
  const optionalFields = <>{optional.map(key=><label key={key} className={styles.field}>{labels[key]||key}<input type={key==='figmaUrl'?'url':'text'} disabled={readOnly} value={typeof value[key]==='string'?value[key]:''} onChange={event=>change([],setOptionalCopy(root,path,key,event.target.value||undefined))}/></label>)}{inline ? <fieldset className={styles.group}><legend>Оформление текста</legend>{(['strong','emphasis','underline'] as const).map(mark=><label key={mark}><input type="checkbox" disabled={readOnly} checked={Array.isArray(value.marks)&&value.marks.includes(mark)} onChange={event=>{const marks=Array.isArray(value.marks)?value.marks:[];const next=event.target.checked?[...marks,mark]:marks.filter(item=>item!==mark);change([],setOptionalCopy(root,path,'marks',next.length?next:undefined))}}/>{{strong:'Жирный',emphasis:'Курсив',underline:'Подчёркнутый'}[mark]}</label>)}</fieldset>:null}</>
  if(sceneSourceSlot(path)) return <LayoutMaterial source={value as unknown as RedesignLayoutSource} packages={packageRecords(root)} readOnly={readOnly} upload={(files,paths,entry)=>uploadLayout(path,files,paths,entry)} url={url=>change([],bindSceneUrl(root,path,url))} select={material=>change([],bindPackage(root,path,material))}/>
  return <details className={styles.group} open={path.length === 0 || name === 'redesign' || name === 'hero' || name === 'page'}><summary>{label}{name === 'hero' ? ` · ${value.kind === 'layout' ? 'Верстка' : 'Фикс адаптив'}` : ''}</summary>{name === 'hero' ? <label className={styles.field}>Вариант Hero<select aria-label="Вариант Hero" disabled={readOnly} value={String(value.kind)} onChange={event => change([], switchHero(root, event.target.value === 'layout' ? 'layout' : 'raster'))}><option value="layout">Верстка</option><option value="raster">Фикс адаптив</option></select><span className={styles.hint}>Настройки предыдущего варианта сохраняются. Фикс адаптив — только Desktop; для публикации нужно 3, 5, 7 или 9 экранов.</span></label> : null}{name === 'hero' && value.kind === 'raster' ? <ImageMaterial label="Добавить экран" readOnly={readOnly || (Array.isArray(value.slides) && value.slides.length >= 9)} upload={(file,context)=>upload(null,file,context)} /> : null}{optionalFields}{Object.entries(value).filter(([key]) => !optional.includes(key) && !(inline && key==='marks') && !hidden.has(key) && (path.length !== 0 || projectFields.has(key))).map(([key, item]) => <EditorNode key={key} value={item} path={[...path, key]} name={key} root={root} change={change} reorder={reorder} readOnly={readOnly} upload={upload} uploadLayout={uploadLayout} />)}</details>
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
 return <label className={styles.field}>{label}{['href', 'url', 'figmaUrl'].includes(name) ? <input type={name==='href'?'text':'url'} disabled={readOnly} value={value} onChange={event => change(path, event.target.value)} /> : <textarea rows={value.length > 100 ? 4 : 2} disabled={readOnly} value={value} onChange={event => change(path, event.target.value)} />}</label>
}

export const ReleaseEditor: JSONFieldClientComponent = ({ path, readOnly }) => {
 const field = useField<Value>({ path })
 const { id } = useDocumentInfo()
 const form = useForm()
 async function upload(at: ValuePath | null, file: File, context: ImageContext) {
  if(!id || file.size>20*1024*1024) throw new Error('Сначала сохраните проект; файл должен быть до20МБ.')
  form.setProcessing(true)
  try {
   const body=new FormData();body.set('file',file);body.set('projectId',String(id));body.set('context',context);body.set('slot',at===null || at[1]==='hero'?'raster':'image')
   const response=await fetch('/api/materials/images',{method:'POST',body,credentials:'same-origin'})
   if(!response.ok) {const failure=await response.json() as {error?:string};throw new Error(failure.error || 'Не удалось подготовить изображение.')}
   const {material}=await response.json() as {material:Material}
   const current=form.getData().releaseContent as Value
   field.setValue(at===null?appendRaster(current,material):bindImage(current,at,material))
  } finally {form.setProcessing(false)}
 }
 async function uploadLayout(at:ValuePath, files:File[], paths:string[], entry:string) {
  if(!id) throw new Error('Сначала сохраните проект.')
  if(files.length>512 || files.some(file=>file.size>20*1024*1024) || files.reduce((sum,file)=>sum+file.size,0)>64*1024*1024) throw new Error('Верстка превышает лимиты файлов или размера.')
  form.setProcessing(true)
  try {
   const body=new FormData();body.set('projectId',String(id));body.set('entry',entry)
   files.forEach((file,index)=>{body.append('file',file);body.append('path',paths[index])})
   const response=await fetch('/api/materials/layout',{method:'POST',body,credentials:'same-origin'})
   if(!response.ok) {const failure=await response.json() as {error?:string};throw new Error(failure.error||'Не удалось подключить верстку.')}
   const {material}=await response.json() as {material:PackageMaterial}
   field.setValue(bindPackage(form.getData().releaseContent as Value,at,material))
  }finally{form.setProcessing(false)}
 }
 if (!field.value || typeof field.value !== 'object' || Array.isArray(field.value)) return <p className={styles.hint}>Содержимое редизайна пока не подключено. Проект можно сохранить как черновик.</p>
 const disabled = Boolean(readOnly || field.disabled || field.formProcessing)
 return <section className={styles.editor} aria-label="Редактор проекта"><p className={styles.hint}>Изменения сохраняются штатными кнопками Payload. Сохранённый черновик и опубликованная версия разделены.</p><EditorNode value={field.value} root={field.value} path={[]} name="Проект" change={(at, value) => field.setValue(replaceValue(field.value, at, value))} reorder={(at, from, to) => field.setValue(moveItem(field.value, at, from, to))} readOnly={disabled} upload={upload} uploadLayout={uploadLayout} />{field.showError ? <p role="alert">{field.errorMessage}</p> : null}</section>
}
