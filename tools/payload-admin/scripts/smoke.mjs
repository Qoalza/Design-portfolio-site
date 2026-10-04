import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { prepare } from './database.mjs'
import sharp from 'sharp'
import { locations, acquire, appRoot } from './state.mjs'

const root = await mkdtemp(path.join(os.tmpdir(), 'des-art-payload-test-'))
const state = locations(root)
const origin = `http://127.0.0.1:${state.port}`
let server
let ended
let logs = ''
async function start() {
  server = spawn(process.execPath, ['scripts/run.mjs', 'start'], { cwd: appRoot, env: { ...process.env, PAYLOAD_LOCAL_ROOT: root }, stdio: ['ignore', 'pipe', 'pipe'] })
  server.stdout.on('data', b => { logs = (logs + b.toString()).slice(-16000) })
  server.stderr.on('data', b => { logs = (logs + b.toString()).slice(-16000) })
  ended = new Promise((resolve, reject) => { server.once('exit', resolve); server.once('error', reject) })
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Собранный сервер завершился до запуска: ${logs}`)
    try {
      if ((await fetch(`${origin}/admin/login`)).status === 200) return
    } catch { /* wait for the loopback server */ }
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  throw new Error('Собранный сервер не открыл страницу входа за 30 секунд.')
}
async function stop() {
  if (!server || server.exitCode !== null) return
  server.kill('SIGTERM')
  await ended
}
try {
  const lock = await acquire(state)
  try { await prepare(state) } finally { await lock.release() }
  await start()
  const anonymous = await fetch(`${origin}/preview`, { redirect: 'manual' })
  assert.equal(anonymous.status, 307)
  const password = randomBytes(32).toString('hex')
  const account = { email: 'smoke@example.test', password }
  const registration = await fetch(`${origin}/api/users/first-register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(account) })
  assert.equal(registration.status, 200, 'First registration failed')
  const { token } = await registration.json()
  const headers = { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' }
  const saved = await fetch(`${origin}/api/projects?draft=true`, { method: 'POST', headers, body: JSON.stringify({ title: 'HTTP сохранённый черновик' }) })
  assert.equal(saved.status, 201)
  const { doc } = await saved.json()
  const preview = await fetch(`${origin}/preview/projects/${doc.id}`, { headers })
  assert.equal(preview.status, 200)
  assert.match(await preview.text(), /HTTP сохранённый черновик/)
  const png = await sharp({ create: { width: 2, height: 2, channels: 4, background: '#112233' } }).png().toBuffer()
  const upload = new FormData()
  upload.set('_payload', JSON.stringify({ alt: 'HTTP fixture' }))
  upload.set('file', new Blob([png], { type: 'image/png' }), 'http-fixture.png')
  const uploaded = await fetch(`${origin}/api/media`, { method: 'POST', headers: { Authorization: headers.Authorization }, body: upload })
  assert.equal(uploaded.status, 201, 'HTTP image upload failed')
  const { doc: media } = await uploaded.json()
  const imageURL = `${origin}/api/media/file/${encodeURIComponent(media.filename)}`
  assert.notEqual((await fetch(imageURL)).status, 200, 'Media must not be anonymously readable')
  const imageResponse = await fetch(imageURL, { headers })
  assert.equal(imageResponse.status, 200)
  assert.ok((await imageResponse.arrayBuffer()).byteLength > 0)
  const publication = await fetch(`${origin}/api/projects/${doc.id}`, { method: 'PATCH', headers, body: JSON.stringify({ title: 'HTTP опубликованный', slug: 'http-case', hero: { image: media.id }, header: { heading: 'HTTP опубликованный заголовок' }, _status: 'published' }) })
  assert.equal(publication.status, 200)
  const revision = await fetch(`${origin}/api/projects/${doc.id}?draft=true`, { method: 'PATCH', headers, body: JSON.stringify({ header: { heading: 'HTTP новый черновик' }, _status: 'draft' }) })
  assert.equal(revision.status, 200)
  const publishedPreview = await fetch(`${origin}/preview/projects/${doc.id}?mode=published`, { headers })
  assert.match(await publishedPreview.text(), /HTTP опубликованный заголовок/)
  assert.equal((await fetch(`${origin}/api/media/${media.id}`, { method: 'DELETE', headers })).status, 409)
  const bad = new FormData()
  bad.set('_payload', JSON.stringify({ alt: 'Invalid HTTP image' }))
  bad.set('file', new Blob(['invalid PNG'], { type: 'image/png' }), 'invalid.png')
  assert.equal((await fetch(`${origin}/api/media`, { method: 'POST', headers: { Authorization: headers.Authorization }, body: bad })).status, 400)
  await assert.rejects(acquire(state), /занято/)
  await stop()
  await start()
  const login = await fetch(`${origin}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(account) })
  assert.equal(login.status, 200)
  const loginResult = await login.json()
  const reopened = await fetch(`${origin}/preview/projects/${doc.id}`, { headers: { Authorization: `JWT ${loginResult.token}` } })
  assert.equal(reopened.status, 200)
  assert.match(await reopened.text(), /HTTP новый черновик/)
  console.log('PASS: built server, registration, upload/access, draft vs publication, media protection, restart and login')
} finally {
  await stop()
  for (const dir of [root, state.backups, state.lock]) await rm(dir, { recursive: true, force: true })
  await rm(state.journal, { force: true })
}
