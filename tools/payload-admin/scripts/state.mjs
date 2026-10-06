import { mkdir, lstat, rm, access, rename, open, constants } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import { hostname } from 'node:os'
import { randomUUID } from 'node:crypto'
import { createConnection } from 'node:net'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {runtimeSettings} from './runtime-settings.mjs'

export const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export function locations(root) {
  const env=root===undefined?process.env:{...process.env,PAYLOAD_RUNTIME_MODE:'fixture',PAYLOAD_LOCAL_ROOT:root,PAYLOAD_DATA_ROOT:'',PAYLOAD_PUBLIC_URL:'',PAYLOAD_PORT:''}
  const settings=runtimeSettings({env,appRoot})
  return { ...settings, backups: `${settings.root}-backups`, lock: `${settings.root}-lock`, journal: `${settings.root}-restore.json` }
}
export async function exists(file) {
  try { await access(file); return true } catch (error) { if (error.code === 'ENOENT') return false; throw error }
}
export async function regular(file, kind = 'file') {
  const stat = await lstat(file)
  if (stat.isSymbolicLink() || (kind === 'file' ? !stat.isFile() : !stat.isDirectory())) throw new Error('Ожидался обычный файл/каталог без символических ссылок.')
  return stat
}
export async function privateDirectory(dir) {
  await mkdir(dir, { recursive: true, mode: 0o700 })
  await regular(dir, 'directory')
}
export async function serverListening(port) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    socket.setTimeout(1500)
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('timeout', () => { socket.destroy(); reject(new Error('Не удалось проверить, остановлена ли админка.')) })
    socket.once('error', error => error.code === 'ECONNREFUSED' ? resolve(false) : reject(error))
  })
}
function alive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return true
  try { process.kill(pid, 0); return true } catch (error) { return error.code !== 'ESRCH' }
}
// A visible lock always contains a durable owner. SQLite serializes short lifecycle
// transitions only; it is a separate empty coordination DB, never the authoring DB.
// OS locks disappear on process death, so recovery cannot strand another claim.
//
// neither release nor unlock recursively removes a newly acquired replacement.
async function syncDirectory(directory) {
  const fd = await open(directory, constants.O_RDONLY)
  try { await fd.sync() } finally { await fd.close() }
}
async function ownerRead(directory) {
  await regular(directory, 'directory')
  const fd = await open(path.join(directory, 'owner.json'), constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const info = await fd.stat()
    if (!info.isFile() || info.size > 4096) throw new Error('Неизвестный владелец блокировки.')
    const owner = JSON.parse(await fd.readFile('utf8'))
    if (owner.host !== hostname() || !Number.isSafeInteger(owner.pid) || owner.pid < 1 ||
      !/^[a-f0-9-]{36}$/.test(owner.token) || (owner.childPID !== null && (!Number.isSafeInteger(owner.childPID) || owner.childPID < 1))) throw new Error('Неизвестный владелец блокировки.')
    return owner
  } finally { await fd.close() }
}
async function ownerWrite(directory, owner) {
  const file = path.join(directory, randomUUID()+'.tmp')
  const fd = await open(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  try { await fd.writeFile(JSON.stringify(owner)); await fd.sync() } finally { await fd.close() }
  try { await rename(file, path.join(directory, 'owner.json')); await syncDirectory(directory) }
  finally { await rm(file, {force:true}) }
}
async function installLock(directory, owner) {
  const prepared = directory+'.'+owner.token+'.prepared'
  await mkdir(prepared, {mode:0o700})
  try { await ownerWrite(prepared, owner); await rename(prepared, directory); await syncDirectory(path.dirname(directory)) }
  finally { await rm(prepared, {recursive:true, force:true}) }
}
async function retireLock(directory, token) {
  if ((await ownerRead(directory)).token !== token) throw new Error('Владелец блокировки изменился.')
  const tomb = directory+'.'+token+'.released'
  await rename(directory, tomb); await syncDirectory(path.dirname(directory)); await rm(tomb, {recursive:true})
}
export async function lifecycleTransition(state, task) {
  const file = state.lock+'.maintenance.db'
  const fd = await open(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600).catch(error=>{if(error.code!=='EEXIST')throw error;return null;})
  if (fd) await fd.close()
  await regular(file)
  const db = new DatabaseSync(file)
  let begun=false
  try {
    try { db.exec('BEGIN IMMEDIATE'); begun=true } catch { throw new Error('Обслуживание блокировки занято.') }
    return await task()
  } finally { if(begun)db.exec('ROLLBACK');db.close() }
}
export async function acquire(state, { allowJournal = false } = {}) {
  const token = randomUUID(), owner = {pid:process.pid, host:hostname(), token, childPID:null}
  await lifecycleTransition(state,()=>installLock(state.lock, owner)).catch(error => {
    if (['EEXIST','ENOTEMPTY'].includes(error.code)) throw new Error('Хранилище занято. Остановите админку; после аварийного завершения используйте npm run storage -- unlock.')
    throw error
  })
  const release = () => lifecycleTransition(state, async () => {
    const observed = await ownerRead(state.lock)
    if (observed.token !== token || (observed.childPID && alive(observed.childPID))) throw new Error('Блокировка остаётся: дочерний процесс ещё работает.')
    await retireLock(state.lock, token)
  })
  try {
    if (await serverListening(state.port)) throw new Error('Сначала остановите локальную админку. Во время её работы обслуживание запрещено.')
    if (!allowJournal && await exists(state.journal)) throw new Error('Восстановление было прервано. Выполните npm run storage -- recover.')
  } catch (error) { await release(); throw error }
  return {
    token, ownerFile:path.join(state.lock,'owner.json'), release,
    child:pid=>lifecycleTransition(state,async()=>{
      if (pid !== null && (!Number.isSafeInteger(pid) || pid < 1)) throw new Error('Invalid child PID')
      if ((await ownerRead(state.lock)).token !== token) throw new Error('Владелец блокировки изменился.')
      await ownerWrite(state.lock, {...owner, childPID:pid})
    }),
  }
}
export async function unlock(state) {
  return lifecycleTransition(state,async()=>{
    const owner = await ownerRead(state.lock)
    if (alive(owner.pid) || (owner.childPID && alive(owner.childPID)) || await serverListening(state.port)) throw new Error('Процесс ещё работает. Блокировка сохранена.')
    await retireLock(state.lock, owner.token)
  })
}
