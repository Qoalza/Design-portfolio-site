import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import sharp from 'sharp'

const payload = await getPayload({ config })
try {
  const user = (await payload.find({ collection: 'users', where: { email: { equals: 'fixture@example.test' } } })).docs[0]
  const access = { user, overrideAccess: false }
  const project = (await payload.find({ collection: 'projects', ...access, where: { slug: { equals: 'sample-case' } }, depth: 0 })).docs[0]
  const image = (await payload.find({ collection: 'media', ...access })).docs[0]
  const bytes = await readFile(path.join(process.env.PAYLOAD_LOCAL_ROOT!, 'media', image.filename!))
  const validFile = { name: 'another.png', mimetype: 'image/png', size: bytes.length, data: bytes }
  await assert.rejects(payload.delete({ collection: 'media', id: image.id, ...access }), /используется/)
  await assert.rejects(payload.update({ collection: 'media', id: image.id, ...access, data: { alt: 'Changed' }, file: validFile }), /новое изображение/)
  await assert.rejects(payload.update({ collection: 'media', id: image.id, ...access, data: { filename: 'broken.png' } }), /Метаданные/)
  assert.deepEqual(await readFile(path.join(process.env.PAYLOAD_LOCAL_ROOT!, 'media', image.filename!)), bytes)
  await payload.update({ collection: 'media', id: image.id, ...access, data: { alt: image.alt } })
  const fileRoot = path.join(process.env.PAYLOAD_LOCAL_ROOT!, 'media')
  const beforeFiles = (await readdir(fileRoot)).sort()
  const beforeCount = (await payload.count({ collection: 'media', ...access })).totalDocs
  for (const file of [
    { ...validFile, data: Buffer.from('this is not a PNG') },
    { ...validFile, mimetype: 'image/svg+xml', name: 'unsafe.svg' },
    { ...validFile, size: 21 * 1024 * 1024, data: Buffer.alloc(21 * 1024 * 1024) },
  ]) await assert.rejects(payload.create({ collection: 'media', ...access, data: { alt: 'Invalid fixture' }, file }))
  await assert.rejects(payload.create({ collection: 'media', ...access, data: { alt: '' }, file: validFile }))
  await assert.rejects(payload.create({ collection: 'media', ...access, overwriteExistingFiles: true, data: { alt: 'Overwrite' }, file: { ...validFile, name: image.filename! } }))
  assert.equal((await payload.count({ collection: 'media', ...access })).totalDocs, beforeCount)
  assert.deepEqual((await readdir(fileRoot)).sort(), beforeFiles)
  const unused = await payload.create({ collection: 'media', ...access, data: { alt: 'Temporary unreferenced' }, file: validFile })
  await payload.delete({ collection: 'media', id: unused.id, ...access })
  assert.equal((await readdir(fileRoot)).includes(unused.filename!), false)
  // Payload must not silently re-encode WebP originals or prepared candidates.
  const webp = await sharp(bytes).webp({lossless:true}).toBuffer()
  const stored = await payload.create({collection:'media', ...access, data:{alt:'Byte-preserving WebP'}, file:{name:'original.webp',mimetype:'image/webp',size:webp.length,data:webp}})
  assert.deepEqual(await readFile(path.join(fileRoot,stored.filename!)),webp)
  await payload.delete({collection:'media',id:stored.id,...access})
  // An image used only in an older version is still required for restoring it.
  const historical = await payload.create({ collection: 'media', ...access, data: { alt: 'Historical' }, file: validFile })
  const draft = await payload.create({ collection: 'projects', ...access, draft: true, data: { title: 'History guard', blocks: [{ blockType: 'gallery', images: [{ image: historical.id }] }] } })
  await payload.update({ collection: 'projects', id: draft.id, ...access, draft: true, data: { blocks: [] } })
  await assert.rejects(payload.delete({ collection: 'media', id: historical.id, ...access }), /используется/)
  await payload.delete({ collection: 'projects', id: draft.id, ...access })
  await payload.delete({ collection: 'media', id: historical.id, ...access })
  assert.equal((await payload.findByID({ collection: 'projects', id: project.id, ...access, depth: 0 })).hero?.image, image.id)
  console.log('PASS: ссылки текущих/исторических версий защищены, замена/подмена запрещены, плохая загрузка не оставляет файлов, неиспользуемое удаляется')
} finally { await payload.destroy() }
