import path from 'node:path'
import { open, constants } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import type { Payload } from 'payload'
import sharp from 'sharp'
import type { User, Project } from './payload-types'
import { withoutEditorState } from './authoring/hero'
import { validateProjectDocument, type ProjectDocument } from '../../../src/lib/project-contract'
import { createProjectSnapshot, requiredAssets } from '../../portfolio-release/project-snapshot.mjs'

export function releaseProjectDocument(record: Project): ProjectDocument {
 if (!record.releaseContent || typeof record.releaseContent !== 'object' || Array.isArray(record.releaseContent)) throw new Error('Project has no redesign content')
 return validateProjectDocument({ ...withoutEditorState(record.releaseContent), title: record.title, slug: record.slug, visibility: 'published' })
}
// Preview and publication use this same mapping. Drafts are only returned to authenticated preview callers.
export async function readReleaseProjects(payload: Payload, user: User | null, mode: 'draft' | 'published') {
 if (!user) throw new Error('Payload project access requires authentication')
 const docs: Project[] = []
 for (let page = 1; ; page++) {
  const result = await payload.find({ collection: 'projects', user, overrideAccess: false, draft: mode === 'draft', depth: 1, limit: 100, page, sort: 'slug',
   where: mode === 'published' ? { and: [{ _status: { equals: 'published' } }, { releaseContent: { exists: true } }] } : { releaseContent: { exists: true } },
  })
  docs.push(...result.docs)
  if (!result.hasNextPage) break
 }
 return docs
}
export async function exportPayloadPublished({ payload, user, dataRoot }: { payload: Payload; user: User | null; dataRoot: string }) {
 const records = await readReleaseProjects(payload, user, 'published')
 const projects = records.map(releaseProjectDocument)
 const assets: Array<{ publicPath: string; sha256: string; bytes: Buffer }> = []
 const required = new Set<string>(projects.flatMap(project => [...requiredAssets(project).paths] as string[]))
 for (const record of records) for (const binding of record.releaseAssets ?? []) {
  if (!required.has(binding.publicPath)) continue
  const relation = binding.file
  if (!relation?.value) throw new Error('Missing Payload asset relation')
  const media = typeof relation.value === 'object' ? relation.value : await payload.findByID({ collection: relation.relationTo, id: relation.value, user, overrideAccess: false })
  const name = media.filename
  if (!name || path.basename(name) !== name) throw new Error('Unsafe Payload filename')
  const directory = relation.relationTo === 'media' ? 'media' : 'project-files'
  const file = await open(path.join(dataRoot, directory, name), constants.O_RDONLY | constants.O_NOFOLLOW)
  let bytes: Buffer
  try {
   const stat = await file.stat()
   if (!stat.isFile() || stat.size === 0 || stat.size > 20 * 1024 * 1024) throw new Error('Invalid Payload file')
   bytes = await file.readFile()
  } finally { await file.close() }
  const sha256=createHash('sha256').update(bytes).digest('hex')
  if(binding.publicPath.includes('/uploads/') && path.posix.basename(binding.publicPath).split('.')[0]!==sha256) throw new Error('Immutable upload path does not match bytes')
  assets.push({ publicPath: binding.publicPath, sha256, bytes })
 }
 // Header metadata alone accepts truncated files. Decode every packaged bitmap,
 // including prepared AVIFs and scene resources, before a new snapshot can exist.
 const checked = new Set<string>()
 for (const asset of assets) if (/\.(?:png|jpe?g|webp|avif)$/i.test(asset.publicPath) && !checked.has(asset.sha256)) {
  await sharp(asset.bytes, { limitInputPixels: 40_000_000, animated: true }).stats()
  checked.add(asset.sha256)
 }
 const byPath = new Map(assets.map(asset => [asset.publicPath, asset]))
 async function verifyImages(value: unknown): Promise<void> {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) { for (const item of value) await verifyImages(item); return }
  const item = value as Record<string, unknown>
  if (typeof item.src === 'string' && typeof item.width === 'number' && typeof item.height === 'number') {
   const asset = byPath.get(item.src)
   if (!asset) throw new Error('Missing Payload image')
   const metadata = await sharp(asset.bytes, { limitInputPixels: 40_000_000 }).metadata()
   if (metadata.width !== item.width || metadata.height !== item.height) throw new Error('Payload image dimensions differ from project metadata')
  }
  for (const child of Object.values(item)) await verifyImages(child)
 }
 for (const project of projects) await verifyImages(project.redesign)
 const externalDependencies = [...new Set(records.flatMap(record => record.releaseExternalDependencies?.map(item => item.url) ?? []))]
 const publicationId = createHash('sha256').update(JSON.stringify(records.map(record => [record.id, record.updatedAt]))).digest('hex')
 const prepared = { projects, assets, provenance: { origin: 'payload-published', publicationId, externalDependencies } }
 return { ...prepared, snapshot: createProjectSnapshot(prepared) }
}
