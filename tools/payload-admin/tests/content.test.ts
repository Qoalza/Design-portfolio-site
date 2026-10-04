import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import sharp from 'sharp'
import { readPreviewProject } from '../src/preview'

const payload = await getPayload({ config })
try {
  const user = await payload.create({ collection: 'users', data: { email: 'fixture@example.test', password: randomBytes(32).toString('hex') } })
  const access = { user: { ...user, collection: 'users' as const }, overrideAccess: false }
  await assert.rejects(payload.create({ collection: 'projects', draft: true, data: { title: 'Anonymous' }, overrideAccess: false }))
  await assert.rejects(payload.find({ collection: 'projects', overrideAccess: false }))
  await assert.rejects(payload.find({ collection: 'media', overrideAccess: false }))
  const png = await sharp({ create: { width: 2, height: 2, channels: 4, background: '#112233' } }).png().toBuffer()
  const media = await payload.create({
    collection: 'media', ...access, data: { alt: 'Синтетическое изображение для проверки' },
    file: {
      name: 'fixture.png', mimetype: 'image/png', size: png.length, data: png,
    },
  })
  assert.ok(media.filename)
  const draft = await payload.create({ collection: 'projects', ...access, draft: true, data: { title: 'Неполный черновик' } })
  assert.equal(draft._status, 'draft')
  await assert.rejects(payload.update({ collection: 'projects', id: draft.id, ...access, data: { _status: 'published' } }))
  const project = await payload.update({
    collection: 'projects', id: draft.id, ...access,
    data: {
      title: 'Опубликованная версия', slug: 'sample-case', hero: { image: media.id }, header: { heading: 'Заголовок кейса' },
      blocks: [
        { blockType: 'section', heading: 'Задача', text: { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', children: [{ type: 'text', text: 'Тестовый текст', format: 0, detail: 0, mode: 'normal', style: '', version: 1 }] }] } }, note: 'Примечание' },
        { blockType: 'gallery', images: [{ image: media.id, caption: 'Тест' }] },
      ],
      _status: 'published',
    },
  })
  assert.equal(project._status, 'published')
  await payload.update({ collection: 'projects', id: project.id, ...access, draft: true, data: { title: 'Новая версия', blocks: [...(project.blocks ?? [])].reverse(), _status: 'draft' } })
  const published = await payload.findByID({ collection: 'projects', id: project.id, ...access, draft: false })
  const revised = await payload.findByID({ collection: 'projects', id: project.id, ...access, draft: true })
  assert.equal(published.title, 'Опубликованная версия')
  assert.equal(revised.title, 'Новая версия')
  assert.equal(published.blocks?.[0].blockType, 'section')
  assert.equal(revised.blocks?.[0].blockType, 'gallery')
  const draftPreview = await readPreviewProject(payload, user, String(project.id), 'draft')
  const publishedPreview = await readPreviewProject(payload, user, String(project.id), 'published')
  assert.equal(draftPreview?.title, 'Новая версия')
  assert.equal(publishedPreview?.title, 'Опубликованная версия')
  assert.equal(typeof publishedPreview?.hero?.image, 'object')
  await assert.rejects(readPreviewProject(payload, null, String(project.id), 'draft'))
  assert.equal(await readPreviewProject(payload, user, '../1', 'draft'), null)
  const unpublished = await payload.create({ collection: 'projects', ...access, draft: true, data: { title: 'Только черновик' } })
  assert.equal(await readPreviewProject(payload, user, String(unpublished.id), 'published'), null)
  const versions = await payload.findVersions({ collection: 'projects', ...access, where: { parent: { equals: project.id } } })
  assert.ok(versions.totalDocs >= 2)
  await assert.rejects(payload.findVersions({ collection: 'projects', overrideAccess: false }))
  console.log('PASS: доступ, загрузка, неполный черновик, валидация публикации, версии и порядок блоков')
} finally {
  await payload.destroy()
}
