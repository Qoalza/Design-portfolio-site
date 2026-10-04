import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
import { readFile, writeFile, rename, cp, rm, symlink, stat, mkdtemp, mkdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { locations, acquire, exists } from '../scripts/state.mjs'
import { backup, verifyBackup, restore, recover } from '../scripts/storage.mjs'

const state = locations()
assert.ok(state.fixture, 'Storage tests must never run against personal data')
const lock = await acquire(state)
try {
  await assert.rejects(acquire(state), /занято/)
  const credentials = new DatabaseSync(path.join(state.root, 'cms.db'))
  credentials.exec("UPDATE users SET reset_password_token='fixture-old-reset', reset_password_expiration='2099-01-01T00:00:00Z'")
  credentials.close()
  const id = await backup(state)
  const snapshot = await verifyBackup(state, id)
  assert.equal((await stat(snapshot)).mode & 0o777, 0o700)
  assert.equal((await stat(path.join(snapshot, 'secret'))).mode & 0o777, 0o600)
  const before = await readFile(path.join(state.root, 'cms.db'))
  const savedSecret = await readFile(path.join(snapshot, 'secret'))
  await writeFile(path.join(snapshot, 'secret'), 'broken')
  await assert.rejects(restore(state, id), /сумма/)
  assert.deepEqual(await readFile(path.join(state.root, 'cms.db')), before)
  await writeFile(path.join(snapshot, 'secret'), savedSecret)
  const manifestFile = path.join(snapshot, 'manifest.json')
  const manifest = await readFile(manifestFile, 'utf8')
  const badManifest = JSON.parse(manifest)
  badManifest.files[0].path = '../cms.db'
  await writeFile(manifestFile, JSON.stringify(badManifest))
  await assert.rejects(verifyBackup(state, id), /состав/)
  await writeFile(manifestFile, manifest)
  await symlink(path.join(state.root, 'secret'), path.join(snapshot, 'unexpected-link'))
  await assert.rejects(verifyBackup(state, id), /ссылок/)
  await rm(path.join(snapshot, 'unexpected-link'))
  const db = new DatabaseSync(path.join(state.root, 'cms.db'))
  db.exec("UPDATE projects SET title = 'changed after backup'")
  db.close()
  const previous = await restore(state, id)
  assert.ok(await exists(path.join(state.backups, previous, 'cms.db')))
  assert.equal(await exists(state.journal), false)
  const restored = new DatabaseSync(path.join(state.root, 'cms.db'), { readOnly: true })
  assert.equal(restored.prepare("SELECT title FROM projects WHERE slug = 'sample-case'").get().title, 'Опубликованная версия')
  assert.equal(restored.prepare('SELECT COUNT(*) AS n FROM users_sessions').get().n, 0, 'Restore must not revive login sessions')
  assert.equal(restored.prepare('SELECT COUNT(*) AS n FROM users WHERE reset_password_token IS NOT NULL OR reset_password_expiration IS NOT NULL').get().n, 0)
  restored.close()
  // Simulate each process interruption point using only the temporary fixture.
  for (const phase of ['journal-only', 'old-moved', 'new-installed']) {
    const token = randomUUID()
    const stage = path.join(state.backups, `restore-${token}`)
    const old = path.join(state.backups, `previous-${token}`)
    await cp(state.root, stage, { recursive: true })
    await writeFile(state.journal, JSON.stringify({ format: 1, token }), { mode: 0o600 })
    if (phase !== 'journal-only') await rename(state.root, old)
    if (phase === 'new-installed') await rename(stage, state.root)
    await recover(state)
    assert.ok(await exists(path.join(state.root, 'cms.db')))
    assert.equal(await exists(state.journal), false)
  }
  // Unknown journal state cannot silently select or erase data.
  await writeFile(state.journal, JSON.stringify({ format: 1, token: randomUUID() }), { mode: 0o600 })
  await assert.rejects(recover(state), /Неоднозначное/)
  assert.ok(await exists(state.journal))
  await rm(state.journal)
  for (const phase of ['journal-only', 'old-moved']) {
    const emptyRoot = await mkdtemp(path.join(os.tmpdir(), 'des-art-payload-test-'))
    const emptyState = locations(emptyRoot)
    const token = randomUUID()
    const stage = path.join(emptyState.backups, `restore-${token}`)
    await mkdir(emptyState.backups, { mode: 0o700 })
    await cp(state.root, stage, { recursive: true })
    await writeFile(emptyState.journal, JSON.stringify({ format: 1, token, initialized: false }))
    if (phase === 'old-moved') await rename(emptyRoot, path.join(emptyState.backups, `previous-${token}`))
    await recover(emptyState)
    assert.ok(await exists(emptyRoot))
    assert.equal(await exists(emptyState.journal), false)
    assert.equal(await exists(path.join(emptyRoot, 'cms.db')), false)
    await rm(emptyRoot, { recursive: true })
    await rm(emptyState.backups, { recursive: true })
  }
  console.log('PASS: копия/восстановление, повреждение, пути, symlink, блокировка и три точки прерывания')
} finally { await lock.release() }
