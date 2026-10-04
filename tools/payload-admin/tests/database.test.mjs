import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { DatabaseSync } from 'node:sqlite'
import { prepare } from '../scripts/database.mjs'
import { locations, acquire, appRoot } from '../scripts/state.mjs'
import { requireCurrentSchema, schemaHash, schemaContract } from '../scripts/schema.mjs'

const state = locations()
assert.ok(state.fixture)
const lock = await acquire(state)
try {
  await prepare(state)
  await requireCurrentSchema(state.root)
  // A known legacy dev database adopts only migration metadata on a copy.
  const db = new DatabaseSync(path.join(state.root, 'cms.db'))
  db.exec("DELETE FROM payload_migrations; INSERT INTO payload_migrations (name,batch) VALUES ('dev',-1)")
  db.close()
  await prepare(state)
  const adopted = new DatabaseSync(path.join(state.root, 'cms.db'))
  assert.equal(adopted.prepare('SELECT COUNT(*) AS n FROM payload_migrations WHERE batch=-1').get().n, 0)
  adopted.exec('CREATE TABLE unexpected (id integer)')
  adopted.close()
  const before = await readFile(path.join(state.root, 'cms.db'))
  await assert.rejects(prepare(state), /Неизвестная/)
  assert.deepEqual(await readFile(path.join(state.root, 'cms.db')), before)
  const cleanup = new DatabaseSync(path.join(state.root, 'cms.db'))
  cleanup.exec('DROP TABLE unexpected')
  cleanup.exec('CREATE TRIGGER unexpected_trigger AFTER INSERT ON projects BEGIN DELETE FROM projects; END')
  cleanup.close()
  await assert.rejects(requireCurrentSchema(state.root), /Структура/)
  await assert.rejects(prepare(state), /Неизвестная/)
  const removeTrigger = new DatabaseSync(path.join(state.root, 'cms.db'))
  removeTrigger.exec('DROP TRIGGER unexpected_trigger')
  removeTrigger.close()
  await requireCurrentSchema(state.root)
  // Compare migrations with schema generated from the current collection config.
  const pushed = await mkdtemp(path.join(os.tmpdir(), 'des-art-payload-test-'))
  try {
    const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', "import {getPayload} from 'payload'; import config from './src/payload.config.ts'; const p=await getPayload({config}); await p.destroy();"], {
      cwd: appRoot, encoding: 'utf8', env: { ...process.env, NODE_ENV: 'development', PAYLOAD_TEST_PUSH: '1', PAYLOAD_LOCAL_ROOT: pushed, PAYLOAD_SECRET: randomBytes(48).toString('hex') },
    })
    assert.equal(result.status, 0, result.stderr)
    assert.equal(await schemaHash(pushed), (await schemaContract()).current, 'Collection config changed without a matching migration/schema contract')
  } finally { await rm(pushed, { recursive: true, force: true }) }
  console.log('PASS: чистая база, переход dev-базы на миграции, неизвестная схема не меняется, конфигурация совпадает с миграциями')
} finally { await lock.release() }
