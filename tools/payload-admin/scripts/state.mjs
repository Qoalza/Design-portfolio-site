import { mkdir, lstat, readFile, writeFile, rm, access } from 'node:fs/promises'
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
export async function acquire(state, { allowJournal = false } = {}) {
  await mkdir(state.lock, { mode: 0o700 }).catch(error => {
    if (error.code === 'EEXIST') throw new Error('Хранилище занято. Остановите админку; после аварийного завершения используйте npm run storage -- unlock.')
    throw error
  })
  const token = randomUUID()
  const ownerFile = path.join(state.lock, 'owner.json')
  let childPID = null
  await writeFile(ownerFile, JSON.stringify({ pid: process.pid, token, childPID }), { mode: 0o600, flag: 'wx' })
  const release = async () => {
    const owner = JSON.parse(await readFile(ownerFile, 'utf8'))
    if (owner.token !== token || (childPID && alive(childPID))) throw new Error('Блокировка остаётся: дочерний процесс ещё работает.')
    await rm(state.lock, { recursive: true })
  }
  try {
    if (await serverListening(state.port)) throw new Error('Сначала остановите локальную админку. Во время её работы обслуживание запрещено.')
    if (!allowJournal && await exists(state.journal)) throw new Error('Восстановление было прервано. Выполните npm run storage -- recover.')
  } catch (error) { await release(); throw error }
  return {
    release,
    async child(pid) {
      childPID = pid
      await writeFile(ownerFile, JSON.stringify({ pid: process.pid, token, childPID }), { mode: 0o600 })
    },
  }
}
export async function unlock(state) {
  await regular(state.lock, 'directory')
  await regular(path.join(state.lock, 'owner.json'))
  const owner = JSON.parse(await readFile(path.join(state.lock, 'owner.json'), 'utf8'))
  if (alive(owner.pid) || (owner.childPID && alive(owner.childPID)) || await serverListening(state.port)) throw new Error('Процесс ещё работает. Блокировка сохранена.')
  await rm(state.lock, { recursive: true })
}
