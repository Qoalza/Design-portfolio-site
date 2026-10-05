import {runtimeSettings} from '../scripts/runtime-settings.mjs'
import { APIError, type Field, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionBeforeOperationHook } from 'payload'
import {withPublicAssetAliases} from './asset-alias'
import { validateProjectDocument } from '../../../src/lib/project-contract'
import type { Project } from './payload-types'
import { packageRecords, usesPackageFile } from './authoring/packages'
import { materialRecords, usesMaterialFile } from './authoring/materials'
import { withoutEditorState, withEditorState } from './authoring/hero'
import {prepareRecordAssets} from './release-export'

// Native Payload fields and versions remain the single content store.
// The custom field edits this JSON boundary without a SQL schema change.
export const releaseFields: Field[] = [
 { name: 'releaseContent', label: 'Данные нового портфолио', type: 'json', admin: { components: { Field: '/components/ReleaseEditor#ReleaseEditor' } } },
 { name: 'releaseAssets', label: 'Ресурсы нового портфолио', type: 'array', admin: { readOnly: true, description: 'Связи создаются при загрузке изображений и верстки. Вручную менять пути не требуется.' }, fields: [
  { name: 'publicPath', label: 'Путь в сайте', type: 'text', required: true },
  { name: 'file', label: 'Файл', type: 'upload', relationTo: ['media', 'project-files'], required: true },
 ] },
 { name: 'releaseExternalDependencies', label: 'Внешние ресурсы верстки', type: 'array', fields: [{ name: 'url', type: 'text', required: true }] },
]
export const validateReleaseProject: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
 const effective = { ...originalDoc, ...data }
 if (effective.releaseContent) {
  let records
  try {records=materialRecords(effective.releaseContent)} catch {throw new APIError('Связи материалов повреждены. Повторите загрузку изображения.',400)}
  const previousMaterials=originalDoc?.releaseContent?materialRecords(originalDoc.releaseContent):[]
  const previousPackages=originalDoc?.releaseContent?packageRecords(originalDoc.releaseContent):[]
  const assets=new Map((effective.releaseAssets??[]).map((asset: NonNullable<Project['releaseAssets']>[number])=>[asset.publicPath,asset]))
  for(const record of records) {
   if(!record.publicPath.startsWith(`/assets/projects/${effective.slug}/uploads/`)&&!previousMaterials.some(previous=>JSON.stringify(previous)===JSON.stringify(record))) throw new APIError('Материал принадлежит другому адресу проекта.',400)
   assets.set(record.publicPath,{publicPath:record.publicPath,file:record.prepared})
  }
  let packages
  try {packages=packageRecords(effective.releaseContent)} catch {throw new APIError('Связи верстки повреждены. Повторите загрузку пакета.',400)}
  for(const material of packages) {
   if(!material.source.assetBase.startsWith(`/assets/projects/${effective.slug}/hero-layout/`)&&!previousPackages.some(previous=>JSON.stringify(previous)===JSON.stringify(material))) throw new APIError('Верстка принадлежит другому адресу проекта.',400)
   for(const binding of material.bindings) assets.set(binding.publicPath,binding)
  }
  if(records.length||packages.length) data.releaseAssets=[...assets.values()]
  if(packages.length) data.releaseExternalDependencies=[...new Set([...(effective.releaseExternalDependencies??[]).map((item:{url:string})=>item.url),...packages.flatMap(item=>item.externalDependencies)])].map(url=>({url}))
 }
 if (effective._status !== 'published' || !effective.releaseContent) return data
 try {
  const input = withoutEditorState(effective.releaseContent)
  const normalized = validateProjectDocument({ ...withPublicAssetAliases(effective.slug,input) as Record<string,unknown>, title: effective.title, slug: effective.slug, visibility: 'published' })
  if(normalized.redesign?.hero.kind==='raster' && normalized.redesign.hero.slides.length>9) throw new Error('Too many screens')
  data.releaseContent = withEditorState(normalized, effective.releaseContent)
 } catch { throw new APIError('Данные проекта не готовы к публикации. Исправьте поля и входные данные Hero.', 400) }
 try {
  const record={...originalDoc,...data} as Project
  const dataRoot=runtimeSettings().root
  await prepareRecordAssets({dataRoot,records:[record],resolveFile:(collection,id)=>req.payload.findByID({collection,id,req,overrideAccess:true,depth:0})})
 }catch{throw new APIError('Материалы проекта не готовы к публикации. Проверьте изображения и ресурсы верстки.',400)}
 return data
}
export function usesReleaseFile(project: Partial<Project>, collection: string, id: string) {
 return usesPackageFile(project.releaseContent,collection,id) || usesMaterialFile(project.releaseContent,collection,id) || (project.releaseAssets?.some(asset => asset.file?.relationTo === collection && String(asset.file.value && typeof asset.file.value === 'object' ? asset.file.value.id : asset.file.value) === id) ?? false)
}
export const protectReleaseFileDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
 for (const versions of [false, true]) for (let page = 1; ; page++) {
  const options = { collection: 'projects' as const, req, overrideAccess: true, depth: 0, limit: 100, page }
  const result = versions ? await req.payload.findVersions(options) : await req.payload.find(options)
  if (result.docs.some(doc => usesReleaseFile(('version' in doc ? doc.version : doc) as Partial<Project>, 'project-files', String(id)))) throw new APIError('Файл используется в проекте или его версии.', 409)
  if (!result.hasNextPage) break
 }
}
export const validateReleaseFileOperation: CollectionBeforeOperationHook<'project-files'> = ({ operation, req, args, overrideAccess }) => {
 if (operation !== 'create' && operation !== 'update') return
 if (!overrideAccess && !req.user) throw new APIError('Необходимо войти в админку.', 401)
 if (operation === 'update') {
  if (req.file) throw new APIError('Загрузите новый файл; прежний сохраняется для версий.', 409)
  if ('data' in args && args.data && ['filename', 'url', 'mimeType', 'filesize', 'width', 'height'].some(field => field in args.data!)) throw new APIError('Метаданные файлов изменять нельзя.', 400)
 } else {
  if ('overwriteExistingFiles' in args && args.overwriteExistingFiles) throw new APIError('Перезапись файлов запрещена.', 409)
  if (!req.file || !Buffer.isBuffer(req.file.data) || req.file.data.length === 0 || req.file.data.length > 20 * 1024 * 1024) throw new APIError('Файл должен быть размером от 1 байта до 20 МБ.', 400)
 }
}
