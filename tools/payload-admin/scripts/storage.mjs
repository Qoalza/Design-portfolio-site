import { DatabaseSync } from 'node:sqlite'
import { createHash, randomUUID } from 'node:crypto'
import { copyFile, chmod, readdir, readFile, rename, rm, open } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { locations, exists, regular, privateDirectory, acquire, unlock } from './state.mjs'

async function durableJSON(file, value) {
  const handle = await open(file, 'wx', 0o600)
  try { await handle.writeFile(JSON.stringify(value, null, 2)); await handle.sync() } finally { await handle.close() }
}
async function files(dir, prefix = '') {
  await regular(dir, 'directory')
  const list = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) list.push(...await files(path.join(dir, entry.name), relative))
    else { await regular(path.join(dir, entry.name)); list.push(relative) }
  }
  return list.sort()
}
async function digest(file) {
  const bytes = await readFile(file)
  return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}
function validFile(file) {
  return typeof file === 'string' && !file.includes('\\') && !file.split('/').some(p => !p || p === '.' || p === '..')
    && (file === 'cms.db' || file === 'secret' || file.startsWith('media/') || file.startsWith('project-files/'))
}
function snapshotPath(state, id) {
  if (!/^backup-[0-9a-f-]{36}$/.test(id)) throw new Error('Укажите идентификатор backup из списка.')
  return path.join(state.backups, id)
}
export async function inspectDatabase(root) {
  await regular(root, 'directory')
  await regular(path.join(root, 'cms.db'))
  await regular(path.join(root, 'secret'))
  const secret = await readFile(path.join(root, 'secret'), 'utf8')
  if (!/^[0-9a-f]{96}$/.test(secret)) throw new Error('Локальный секрет отсутствует или повреждён.')
  const db = new DatabaseSync(path.join(root, 'cms.db'), { readOnly: true })
  try {
    const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(row => row.name))
    if (['users', 'media', 'projects', '_projects_v', 'payload_migrations'].some(table => !tables.has(table))) throw new Error('Это не база локальной Payload CMS.')
    if (db.prepare('PRAGMA integrity_check').all().some(row => Object.values(row)[0] !== 'ok')) throw new Error('Проверка целостности SQLite не пройдена.')
    if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('В базе есть повреждённые связи.')
    for (const [table, directory] of [['media', 'media'], ['project_files', 'project-files']]) {
      if (!tables.has(table)) continue
      for (const { filename } of db.prepare(`SELECT filename FROM ${table}`).all()) {
        if (typeof filename !== 'string' || path.basename(filename) !== filename) throw new Error('Некорректный путь файла в базе.')
        await regular(path.join(root, directory, filename))
      }
    }
  } finally { db.close() }
}
async function verifyDirectory(dir) {
  await regular(dir, 'directory')
  await regular(path.join(dir, 'manifest.json'))
  const manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8'))
  if (manifest.format !== 1 || !Array.isArray(manifest.files)) throw new Error('Неизвестный формат копии.')
  const expected = manifest.files.map(item => item.path)
  if (expected.some(file => !validFile(file)) || new Set(expected).size !== expected.length || !expected.includes('cms.db') || !expected.includes('secret')) throw new Error('Некорректный состав копии.')
  const actual = (await files(dir)).filter(file => file !== 'manifest.json')
  if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) throw new Error('Состав файлов копии изменился.')
  for (const item of manifest.files) {
    const result = await digest(path.join(dir, item.path))
    if (result.sha256 !== item.sha256 || result.bytes !== item.bytes) throw new Error('Контрольная сумма копии не совпадает.')
  }
  await inspectDatabase(dir)
  return dir
}
export async function verifyBackup(state, id) {
  await regular(state.backups, 'directory')
  return verifyDirectory(snapshotPath(state, id))
}
export async function backup(state) {
  await inspectDatabase(state.root)
  await privateDirectory(state.backups)
  const id = `backup-${randomUUID()}`
  const stage = path.join(state.backups, `pending-${randomUUID()}`)
  await privateDirectory(stage)
  try {
    const db = new DatabaseSync(path.join(state.root, 'cms.db'), { readOnly: true })
    try { db.prepare('VACUUM INTO ?').run(path.join(stage, 'cms.db')) } finally { db.close() }
    await chmod(path.join(stage, 'cms.db'), 0o600)
    await copyFile(path.join(state.root, 'secret'), path.join(stage, 'secret'))
    await chmod(path.join(stage, 'secret'), 0o600)
    for (const directory of ['media', 'project-files']) {
      await privateDirectory(path.join(stage, directory))
      if (!await exists(path.join(state.root, directory))) continue
      for (const file of await files(path.join(state.root, directory))) {
        const target = path.join(stage, directory, file)
        await privateDirectory(path.dirname(target))
        await copyFile(path.join(state.root, directory, file), target)
        await chmod(target, 0o600)
      }
    }
    const entries = []
    for (const file of await files(stage)) entries.push({ path: file, ...await digest(path.join(stage, file)) })
    await durableJSON(path.join(stage, 'manifest.json'), { format: 1, createdAt: new Date().toISOString(), files: entries })
    await verifyDirectory(stage)
    await rename(stage, snapshotPath(state, id))
    return id
  } catch (error) { await rm(stage, { recursive: true, force: true }); throw error }
}
export async function restore(state, id) {
  const source = await verifyBackup(state, id)
  await regular(state.root, 'directory')
  const token = randomUUID()
  const stage = path.join(state.backups, `restore-${token}`)
  const previous = path.join(state.backups, `previous-${token}`)
  await privateDirectory(stage)
  for (const file of await files(source)) {
    await privateDirectory(path.dirname(path.join(stage, file)))
    await copyFile(path.join(source, file), path.join(stage, file))
    await chmod(path.join(stage, file), 0o600)
  }
  await privateDirectory(path.join(stage, 'media'))
  await privateDirectory(path.join(stage, 'project-files'))
  await verifyDirectory(stage)
  await rm(path.join(stage, 'manifest.json'))
  // A restored database must not revive previously valid login sessions.
  const restoredDB = new DatabaseSync(path.join(stage, 'cms.db'))
  try { restoredDB.exec('BEGIN; DELETE FROM users_sessions; UPDATE users SET reset_password_token = NULL, reset_password_expiration = NULL; COMMIT') } finally { restoredDB.close() }
  await inspectDatabase(stage)
  await durableJSON(state.journal, { format: 1, token, initialized: await exists(path.join(state.root, 'cms.db')) })
  await rename(state.root, previous)
  await rename(stage, state.root)
  await rm(state.journal)
  return path.basename(previous)
}
export async function recover(state) {
  await regular(state.journal)
  const journal = JSON.parse(await readFile(state.journal, 'utf8'))
  if (journal.format !== 1 || !/^[0-9a-f-]{36}$/.test(journal.token)) throw new Error('Некорректный журнал восстановления.')
  await regular(state.backups, 'directory')
  const previous = path.join(state.backups, `previous-${journal.token}`)
  const stage = path.join(state.backups, `restore-${journal.token}`)
  const activeExists = await exists(state.root)
  const previousExists = await exists(previous)
  const stageExists = await exists(stage)
  const shape = `${Number(activeExists)}${Number(previousExists)}${Number(stageExists)}`
  if (!['101', '011', '110'].includes(shape)) throw new Error('Неоднозначное состояние восстановления. Файлы сохранены; требуется проверка.')
  if (!activeExists) {
    await regular(previous, 'directory')
    await rename(previous, state.root)
  } else await regular(state.root, 'directory')
  if (shape === '110' || journal.initialized !== false || await exists(path.join(state.root, 'cms.db'))) await inspectDatabase(state.root)
  // Keep the staged folder for diagnosis; never discard the prior active state.
  if (stageExists) await regular(stage, 'directory')
  await rm(state.journal)
}
export async function main(args = process.argv.slice(2)) {
  const state = locations()
  const [command, id] = args
  if (command === 'unlock') { await unlock(state); console.log('Оставшаяся блокировка снята.'); return }
  if (!['backup', 'list', 'verify', 'restore', 'recover'].includes(command)) throw new Error('Команды: backup, list, verify <id>, restore <id> --confirm, recover, unlock. Сначала остановите админку.')
  const lock = await acquire(state, { allowJournal: command === 'recover' })
  try {
    if (command === 'backup') console.log(`Копия создана: ${await backup(state)}`)
    if (command === 'list') {
      if (!await exists(state.backups)) { console.log('Копий пока нет.'); return }
      await regular(state.backups, 'directory')
      console.log((await readdir(state.backups)).filter(name => /^backup-[0-9a-f-]{36}$/.test(name)).join('\n') || 'Копий пока нет.')
    }
    if (command === 'verify') { await verifyBackup(state, id); console.log('Копия прошла проверку.'); }
    if (command === 'restore') {
      if (args[2] !== '--confirm') throw new Error('Восстановление заменит активное локальное состояние. Добавьте --confirm; прежнее состояние будет сохранено.')
      console.log(`Восстановлено. Прежнее состояние сохранено: ${await restore(state, id)}`)
    }
    if (command === 'recover') { await recover(state); console.log('Прерванное восстановление завершено.'); }
  } finally { await lock.release() }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
