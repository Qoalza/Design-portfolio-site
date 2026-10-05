import type { QualityReport } from '../materials/image-quality'
import { editorState } from './hero'
import { replaceValue, valueAt, type Value, type ValuePath } from './model'
export type Material = {
 publicPath: string; original: { relationTo: 'media'; value: number }; prepared: { relationTo: 'media'; value: number };
 image: {src:string;alt:string;width:number;height:number}; report: QualityReport;
}
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value==='object' && !Array.isArray(value))
export function materialRecords(document: unknown): Material[] {
 const state=editorState(document), records=state?.materials
 if(records===undefined) return []
 if(!Array.isArray(records) || records.length>200) throw new Error('Слишком много материалов проекта.')
 return records.map(record=>{
  if(!isObject(record) || !isObject(record.original) || !isObject(record.prepared) || !isObject(record.image) || !isObject(record.report)) throw new Error('Материал повреждён.')
  for(const key of ['original','prepared'] as const) {
   const relation=record[key]
   if(!isObject(relation) || relation.relationTo!=='media' || !Number.isSafeInteger(relation.value) || Number(relation.value)<1) throw new Error('Файл материала не найден.')
  }
  const report=record.report
  if(report.version!==1 || !isObject(report.prepared) || !isObject(report.original)) throw new Error('Отчёт материала повреждён.')
  for(const info of [report.original,report.prepared]) {
   if(!['png','jpeg','webp'].includes(String(info.format)) || typeof info.sha256!=='string' || !/^[a-f0-9]{64}$/.test(info.sha256) || !Number.isSafeInteger(info.width) || !Number.isSafeInteger(info.height) || Number(info.width)<1 || Number(info.height)<1 || !Number.isSafeInteger(info.bytes) || Number(info.bytes)<1 || Number(info.bytes)>20*1024*1024) throw new Error('Метаданные материала повреждены.')
  }
  const extension=report.prepared.format==='jpeg'?'jpg':report.prepared.format
  if(typeof record.publicPath!=='string' || !/^\/assets\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*\/uploads\/[a-f0-9]{64}\.(?:png|jpg|webp)$/.test(record.publicPath) || !record.publicPath.endsWith(`/${report.prepared.sha256}.${extension}`) || record.image.src!==record.publicPath || record.image.width!==report.prepared.width || record.image.height!==report.prepared.height || typeof record.image.alt!=='string') throw new Error('Путь материала повреждён.')
  return record as unknown as Material
 })
}
export function imageSlot(path: ValuePath) {
 const named=path.join('.')
 return /^redesign\.card\.preview\.(back|front)$/.test(named) || /^redesign\.page\.(showcase|flow)\.image$/.test(named) || (path.length===5 && path[0]==='redesign' && path[1]==='hero' && path[2]==='slides' && typeof path[3]==='number' && path[4]==='image')
}
function keepMaterial(document: Value, material: Material): Value {
 const state=editorState(document), materials=materialRecords(document)
 const records=[...materials.filter(item=>item.prepared.value!==material.prepared.value),material]
 if(records.length>200) throw new Error('Слишком много материалов проекта.')
 return {...document as Record<string,Value>,_payloadEditor:{version:1,heroes:{},...state,materials:records}}
}
export function bindImage(document: Value, path: ValuePath, material: Material): Value {
 if(!imageSlot(path)) throw new Error('Это поле не предназначено для изображения.')
 const old=valueAt(document,path)
 if(!isObject(old) || typeof old.src!=='string') throw new Error('Изображение не найдено.')
 const updated=replaceValue(document,path,{...material.image,alt:typeof old.alt==='string'?old.alt:material.image.alt})
 return keepMaterial(updated,material)
}
export function appendRaster(document: Value, material: Material): Value {
 const hero=valueAt(document,['redesign','hero'])
 if(!isObject(hero) || hero.kind!=='raster' || !Array.isArray(hero.slides) || hero.slides.length>=9) throw new Error('Фикс адаптив поддерживает до9 экранов.')
 const prefix=`screen-${material.report.prepared.sha256.slice(0,12)}`
 let id=prefix,index=2
 while(hero.slides.some(item=>isObject(item)&&item.id===id)) id=`${prefix}-${index++}`
 const slides=[...hero.slides,{id,title:material.image.alt||`Экран ${hero.slides.length+1}`,image:material.image}]
 return keepMaterial(replaceValue(document,['redesign','hero'],{...hero,slides,initialSlideId:hero.initialSlideId||id}),material)
}
// Deletion guards inspect references even in incomplete saved drafts.
export function usesMaterialFile(document: unknown, collection:string, id:string) {
 if(!isObject(document) || !isObject(document._payloadEditor) || !Array.isArray(document._payloadEditor.materials)) return false
 return document._payloadEditor.materials.some(item=>isObject(item)&&['original','prepared'].some(key=>{
  const relation=item[key]
  return isObject(relation)&&relation.relationTo===collection&&String(relation.value)===id
 }))
}
