import { APIError, type CollectionBeforeDeleteHook, type CollectionBeforeOperationHook } from 'payload'
import sharp from 'sharp'
import type { Media, Project } from './payload-types'
import { usesReleaseFile } from './release-content'

function richTextUsesMedia(value: unknown, id: string): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(item => richTextUsesMedia(item, id))
  const node = value as Record<string, unknown>
  if (node.type === 'upload' && node.relationTo === 'media') {
    const media = node.value && typeof node.value === 'object' ? (node.value as Record<string, unknown>).id : node.value
    if (String(media) === id) return true
  }
  return Object.values(node).some(item => richTextUsesMedia(item, id))
}
function usesMedia(project: Partial<Project>, id: string) {
  const match = (value: number | Media | null | undefined) => String(value && typeof value === 'object' ? value.id : value) === id
  return usesReleaseFile(project, 'media', id) || match(project.hero?.image) || project.blocks?.some(block => block.blockType === 'gallery'
    ? block.images?.some(item => match(item.image))
    : match(block.image) || richTextUsesMedia(block.text, id))
}
export const protectMediaDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  // Use the operation's transaction; versions include saved drafts and history.
  for (let page = 1; ; page++) {
    const result = await req.payload.find({ collection: 'projects', req, overrideAccess: true, depth: 0, limit: 100, page })
    if (result.docs.some(project => usesMedia(project, String(id)))) throw new APIError('Изображение используется в проекте или его сохранённой версии. Сначала уберите ссылку; история также сохраняет изображения.', 409)
    if (!result.hasNextPage) break
  }
  for (let page = 1; ; page++) {
    const result = await req.payload.findVersions({ collection: 'projects', req, overrideAccess: true, depth: 0, limit: 100, page })
    if (result.docs.some(doc => usesMedia(doc.version, String(id)))) throw new APIError('Изображение используется в сохранённой версии проекта. Оно нужно для восстановления истории.', 409)
    if (!result.hasNextPage) break
  }
}

const metadataFields = ['filename', 'url', 'thumbnailURL', 'mimeType', 'filesize', 'width', 'height'] as const
export const validateMediaOperation: CollectionBeforeOperationHook<'media'> = async ({ operation, req, args, overrideAccess }) => {
  if (operation !== 'create' && operation !== 'update') return
  if (!overrideAccess && !req.user) throw new APIError('Необходимо войти в админку.', 401)
  if (operation === 'update') {
    if (req.file) throw new APIError('Чтобы заменить файл, загрузите новое изображение и выберите его в проекте. Существующий файл сохраняется для истории.', 409)
    if ('data' in args && args.data && typeof args.data === 'object') {
      const data = args.data as Record<string, unknown>
      if (metadataFields.some(field => field in data)) {
        if (!('id' in args) || (typeof args.id !== 'number' && typeof args.id !== 'string')) throw new APIError('Метаданные файлов нельзя менять массово.', 400)
        const current = await req.payload.findByID({ collection: 'media', id: args.id, req, overrideAccess: true })
        if (metadataFields.some(field => field in data && data[field] !== current[field])) throw new APIError('Метаданные файла нельзя менять вручную. Загрузите новое изображение.', 400)
      }
    }
    return
  }
  if ('overwriteExistingFiles' in args && args.overwriteExistingFiles) throw new APIError('Перезапись существующих файлов запрещена. Загрузите новое изображение.', 409)
  const file = req.file
  if (!file || !Buffer.isBuffer(file.data)) throw new APIError('Выберите файл изображения.', 400)
  if (file.data.length > 20 * 1024 * 1024 || file.size > 20 * 1024 * 1024) throw new APIError('Размер изображения не должен превышать 20 МБ.', 400)
  const formats: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpeg', 'image/webp': 'webp' }
  if (!formats[file.mimetype]) throw new APIError('Допустимы PNG, JPEG и WebP.', 400)
  try {
    const image = sharp(file.data, { limitInputPixels: 40_000_000, animated: true })
    const metadata = await image.metadata()
    if (metadata.format !== formats[file.mimetype]) throw new Error('File type does not match content')
    await image.stats()
  } catch { throw new APIError('Файл изображения повреждён, имеет неверный формат или превышает 40 мегапикселей.', 400) }
}
