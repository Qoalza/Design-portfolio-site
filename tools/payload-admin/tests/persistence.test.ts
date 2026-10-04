import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { readPreviewProject } from '../src/preview'

// Runs in a fresh process after content.test.ts closes its database.
const root = path.resolve(process.env.PAYLOAD_LOCAL_ROOT || '')
assert.equal(path.dirname(root), path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const payload = await getPayload({ config })
try {
  const users = await payload.find({ collection: 'users', where: { email: { equals: 'fixture@example.test' } } })
  assert.equal(users.totalDocs, 1)
  const user = users.docs[0]
  const projects = await payload.find({ collection: 'projects', user, overrideAccess: false, where: { slug: { equals: 'sample-case' } } })
  assert.equal(projects.totalDocs, 1)
  const id = String(projects.docs[0].id)
  const published = await readPreviewProject(payload, user, id, 'published')
  const draft = await readPreviewProject(payload, user, id, 'draft')
  assert.equal(published?.title, 'Опубликованная версия')
  assert.equal(draft?.title, 'Новая версия')
  assert.equal(published?.blocks?.[0].blockType, 'section')
  assert.equal(draft?.blocks?.[0].blockType, 'gallery')
  const media = published?.hero?.image
  assert.ok(media && typeof media === 'object' && media.filename)
  assert.equal(media.alt, 'Синтетическое изображение для проверки')
  const bytes = await readFile(path.join(root, 'media', media.filename))
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  const versions = await payload.findVersions({ collection: 'projects', user, overrideAccess: false, where: { parent: { equals: Number(id) } } })
  assert.ok(versions.totalDocs >= 2)
  await assert.rejects(payload.find({ collection: 'projects', overrideAccess: false }))
  console.log('PASS: новый процесс читает опубликованный проект, отдельный черновик, версии и файл изображения')
} finally {
  await payload.destroy()
}
