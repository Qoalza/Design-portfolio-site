import { DatabaseSync } from 'node:sqlite'
import { randomBytes } from 'node:crypto'
import { mkdtemp, rm, cp, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { locations, acquire, appRoot, privateDirectory, exists, regular } from './state.mjs'
import { backup, verifyBackup, restore, inspectDatabase } from './storage.mjs'
import { schemaHash, schemaContract, requireCurrentSchema } from './schema.mjs'

export async function migrateStage(root) {
  const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/migrate-worker.ts'], {
    cwd: appRoot, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production', PAYLOAD_RUNTIME_MODE:'fixture',PAYLOAD_DATA_ROOT:'',PAYLOAD_PUBLIC_URL:'',PAYLOAD_PORT:'',PAYLOAD_MIGRATING: 'true', PAYLOAD_TEST_PUSH: '', PAYLOAD_LOCAL_ROOT: root, PAYLOAD_SECRET: await readFile(path.join(root, 'secret'), 'utf8') },
  })
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)) })
  if (code !== 0) throw new Error('Обновление тестовой копии не удалось. Активная база не изменена.')
}
export async function prepare(state) {
  const contract = await schemaContract()
  const stageRoot = await mkdtemp(path.join(os.tmpdir(), 'des-art-payload-test-'))
  const stageState = locations(stageRoot)
  try {
    const hasDB = await exists(path.join(state.root, 'cms.db'))
    if (hasDB) {
      const hash = await schemaHash(state.root)
      const known = contract.history.find(item => item.hash === hash)
      if (!known) throw new Error('Неизвестная структура базы. Автоматическое обновление остановлено; нужна проверка разработчиком.')
      const id = await backup(state)
      console.log(`Перед обновлением сохранена копия: ${id}`)
      const source = await verifyBackup(state, id)
      await cp(source, stageRoot, { recursive: true })
      await rm(path.join(stageRoot, 'manifest.json'))
      const db = new DatabaseSync(path.join(stageRoot, 'cms.db'))
      try {
        const rows = db.prepare('SELECT name, batch FROM payload_migrations').all()
        const applied = rows.filter(row => row.batch !== -1).map(row => row.name)
        if (applied.some(name => !known.migrations.includes(name))) throw new Error('История миграций не соответствует структуре базы.')
        if (!applied.length && known.migrations.length) {
          // Adopt only a structurally exact known legacy database, on staging.
          db.exec('BEGIN')
          db.exec('DELETE FROM payload_migrations WHERE batch = -1')
          for (const name of known.migrations) db.prepare('INSERT INTO payload_migrations (name, batch) VALUES (?, 1)').run(name)
          db.exec('COMMIT')
        } else if (rows.some(row => row.batch === -1) || applied.length !== known.migrations.length) throw new Error('Неоднозначная история базы; требуется проверка.')
      } finally { db.close() }
    } else {
      await privateDirectory(state.root)
      if (await exists(path.join(state.root, 'secret'))) {
        await regular(path.join(state.root, 'secret'))
        await cp(path.join(state.root, 'secret'), path.join(stageRoot, 'secret'))
      } else await writeFile(path.join(stageRoot, 'secret'), randomBytes(48).toString('hex'), { mode: 0o600 })
      await privateDirectory(path.join(stageRoot, 'media'))
    }
    await migrateStage(stageRoot)
    await requireCurrentSchema(stageRoot)
    await inspectDatabase(stageRoot)
    const candidateID = await backup(stageState)
    const candidate = await verifyBackup(stageState, candidateID)
    await privateDirectory(state.backups)
    await cp(candidate, path.join(state.backups, candidateID), { recursive: true, errorOnExist: true, force: false })
    await restore(state, candidateID)
    console.log('База подготовлена и проверена. Можно запускать админку.')
  } finally {
    await rm(stageRoot, { recursive: true, force: true })
    await rm(stageState.backups, { recursive: true, force: true })
  }
}
async function main() {
  const state = locations()
  const lock = await acquire(state)
  try { await prepare(state) } finally { await lock.release() }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1 })
