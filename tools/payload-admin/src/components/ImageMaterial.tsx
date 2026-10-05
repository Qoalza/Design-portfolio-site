'use client'
import { useState } from 'react'
import type { Material } from '../authoring/materials'
import type { ImageContext } from '../materials/image-quality'
import styles from './release-editor.module.css'
const reasons:Record<string,string>={
 'verified-lossless':'Пиксели, размеры и цветовой профиль проверены; выбран меньший lossless WebP.',
 'original-context-unknown':'Назначение не установлено — сохранён исходник.',
 'original-already-webp':'WebP сохранён без повторного сжатия.',
 'original-not-smaller':'Кандидат не легче оригинала — выбран исходник.',
 'original-quality-mismatch':'Качество кандидата не подтверждено — выбран исходник.',
 'original-encoding-failed':'Конвертация не завершилась — выбран исходник.',
 'original-orientation':'Сохранён исходник с его ориентацией.',
 'original-unsupported-depth':'Сохранена исходная глубина цвета.',
 'original-animated':'Сохранён исходный файл с анимацией.',
}
export function ImageMaterial({label,readOnly,material,upload}:{label:string;readOnly:boolean;material?:Material;upload:(file:File,context:ImageContext)=>Promise<void>}) {
 const [context,setContext]=useState<ImageContext>('screen'),[busy,setBusy]=useState(false),[error,setError]=useState('')
 return <div className={styles.group}><label className={styles.field}>Назначение изображения<select aria-label={`${label}: назначение изображения`} disabled={readOnly||busy} value={context} onChange={event=>setContext(event.target.value as ImageContext)}><option value="screen">Экран интерфейса</option><option value="diagram">Схема</option><option value="photo">Фотография</option><option value="illustration">Иллюстрация</option><option value="unknown">Пока не определено</option></select></label><label className={styles.field}>{label}<input aria-label={label} type="file" accept="image/png,image/jpeg,image/webp" disabled={readOnly||busy} onChange={async event=>{
  const input=event.currentTarget,file=input.files?.[0]
  if(!file) return
  setBusy(true);setError('')
  try{await upload(file,context)}catch(error){setError(error instanceof Error?error.message:'Не удалось загрузить материал. Прежнее изображение сохранено.')}finally{setBusy(false);input.value=''}
 }} /></label>{busy?<p role="status">Сохраняем оригинал и проверяем изображение…</p>:null}{error?<p role="alert">{error}</p>:null}{material?<p className={styles.hint}>{material.report.original.format.toUpperCase()} · {material.report.original.width}×{material.report.original.height} · {Math.ceil(material.report.original.bytes/1024)}КБ → {material.report.prepared.format.toUpperCase()} · {Math.ceil(material.report.prepared.bytes/1024)}КБ. {reasons[material.report.reason]||'Сохранён оригинал.'}</p>:null}<p className={styles.hint}>Новая связь сохранится штатной кнопкой «Сохранить черновик». Оригинал доступен в «Изображениях».</p></div>
}
