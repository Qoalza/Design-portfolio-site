import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { replaceValue } from '../src/authoring/model'
import { releaseProjectDocument, exportPayloadPublished } from '../src/release-export'
import { editorState } from '../src/authoring/hero'

const root = path.resolve(process.env.PAYLOAD_LOCAL_ROOT || '')
assert.equal(path.dirname(root), path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const payload = await getPayload({ config })
try {
 if (process.argv[2] === 'prepare') {
  const user = await payload.create({ collection: 'users', data: { email: 'editor@example.test', password: 'Disposable-Editor-Fixture-2026!' } })
  const access = { user: { ...user, collection: 'users' as const }, overrideAccess: false }
  const records = await payload.find({ collection: 'projects', ...access, depth: 1 })
  for (const record of records.docs) {
   const original = releaseProjectDocument(record)
   const edited = replaceValue(original, ['description'], 'Проверка редактора Payload')
   await payload.update({ collection: 'projects', id: record.id, ...access, draft: true, data: { releaseContent: edited, _status: 'draft' } })
   const published = await payload.findByID({ collection: 'projects', id: record.id, ...access, draft: false })
   const draft = await payload.findByID({ collection: 'projects', id: record.id, ...access, draft: true })
   assert.equal(releaseProjectDocument(published).description, original.description)
   assert.equal(releaseProjectDocument(draft).description, 'Проверка редактора Payload')
   assert.deepEqual(releaseProjectDocument(draft).redesign, original.redesign)
   await payload.update({ collection: 'projects', id: record.id, ...access, draft: true, data: { releaseContent: original, _status: 'draft' } })
  }
  await writeFile(path.join(root, 'editor-projects.json'), JSON.stringify(records.docs.map(p => ({ id: p.id, slug: p.slug }))))
  console.log('PASS: native Payload saves edited documents and preserves published versions and both Hero metadata')
 } else if (process.argv[2] === 'browser') {
  const users = await payload.find({collection:'users',where:{email:{equals:'editor@example.test'}}})
  const access = {user:{...users.docs[0],collection:'users' as const},overrideAccess:false}
  const records = await payload.find({collection:'projects',...access})
  const radio = records.docs.find(p=>p.slug==='sarafan-radio')!
  const baseline = releaseProjectDocument(radio)
  const saved = await payload.findByID({collection:'projects',id:radio.id,...access,draft:true})
  const draft = releaseProjectDocument(saved)
  assert.equal(draft.description,'Проверка черновика через интерфейс Payload — временный тест.')
  const hero = draft.redesign!.hero
  assert.equal(hero.kind,'raster')
  if(hero.kind!=='raster') throw new Error('Wrong fixture Hero')
  assert.deepEqual(hero.slides.map(s=>s.id),['home','delivery','variant'])
  assert.equal(hero.initialSlideId,'delivery')
  assert.equal(editorState(saved.releaseContent)?.heroes && typeof editorState(saved.releaseContent)?.heroes,'object')
  assert.notEqual(baseline.description,draft.description)
  // Native local publication must keep previous variants, but public export must omit them.
  await payload.update({collection:'projects',id:radio.id,...access,data:{releaseContent:saved.releaseContent,_status:'published'}})
  const published = await payload.findByID({collection:'projects',id:radio.id,...access,draft:false})
  assert.ok(editorState(published.releaseContent))
  const exported = await exportPayloadPublished({payload,user:users.docs[0],dataRoot:root})
  const exportedRadio = exported.projects.find(p=>p.slug==='sarafan-radio')!
  assert.equal(exportedRadio.description,draft.description)
  assert.equal('_payloadEditor' in exportedRadio,false)
  assert.deepEqual(exportedRadio.redesign!.hero,hero)
  // Return only disposable fixtures to their immutable baseline.
  await payload.update({collection:'projects',id:radio.id,...access,data:{releaseContent:baseline,_status:'published'}})
  console.log('PASS: browser edits survived process restart; publication retained Hero cache, snapshot omitted it, baseline restored')
 } else {
  const expected = JSON.parse(await readFile(path.join(root, 'editor-projects.json'), 'utf8')) as { id: number; slug: string }[]
  for (const item of expected) {
   const published = await payload.findByID({ collection: 'projects', id: item.id, draft: false })
   const draft = await payload.findByID({ collection: 'projects', id: item.id, draft: true })
   assert.deepEqual(releaseProjectDocument(draft), releaseProjectDocument(published))
   const versions = await payload.findVersions({ collection: 'projects', where: { parent: { equals: item.id } } })
   assert.ok(versions.totalDocs >= 3)
  }
  console.log('PASS: fresh Payload process reopens saved documents and retained versions')
 }
} finally { await payload.destroy() }
