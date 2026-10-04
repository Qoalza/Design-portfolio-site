import { randomBytes, createHash } from 'node:crypto'
import { lstat, mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { locations, acquire, appRoot, exists } from './state.mjs'
import { requireCurrentSchema } from './schema.mjs'

async function sourceHash() {
  const hash = createHash('sha256')
  async function walk(dir) {
    for (const entry of (await readdir(path.join(appRoot, dir), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) await walk(file)
      else if (entry.isFile()) { hash.update(file); hash.update(await readFile(path.join(appRoot, file))) }
    }
  }
  for (const dir of ['src', 'scripts', 'public']) await walk(dir)
  for (const file of ['package.json', 'package-lock.json', 'next.config.mjs', 'tsconfig.json']) hash.update(await readFile(path.join(appRoot, file)))
  // Native Payload validation also depends on the shared content contract.
  for (const file of ['project-contract.ts', 'project-redesign-contract.ts', 'project-visual-registry.ts']) hash.update(await readFile(path.resolve(appRoot, '../../src/lib', file)))
  return hash.digest('hex')
}
async function main() {
  const mode = process.argv[2]
  if (!['dev', 'build', 'start', 'generate'].includes(mode)) throw new Error('Unknown local CMS command')
  const state = locations()
  const lock = await acquire(state)
  try {
    const buildSourceHash = mode === 'build' ? await sourceHash() : null
    if (mode === 'dev' || mode === 'start') {
      if (!await exists(path.join(state.root, 'cms.db'))) throw new Error('Сначала подготовьте базу: npm run db:prepare')
      await requireCurrentSchema(state.root)
    }
    if (mode === 'start') {
      const stamp = path.join(appRoot, '.next/local-source-hash')
      if (!await exists(stamp) || await readFile(stamp, 'utf8') !== await sourceHash()) throw new Error('Нужна актуальная сборка: npm run build')
    }
    await mkdir(state.root, { recursive: true, mode: 0o700 })
    if ((await lstat(state.root)).isSymbolicLink()) throw new Error('Local state cannot be a symbolic link')
    const secretFile = path.join(state.root, 'secret')
    // Build/generate do not need the user's authentication secret.
    let secret = randomBytes(48).toString('hex')
    if (mode === 'dev' || mode === 'start') {
      if (!(await lstat(secretFile)).isFile()) throw new Error('Local secret must be a regular file')
      secret = await readFile(secretFile, 'utf8')
      if (!/^[0-9a-f]{96}$/.test(secret)) throw new Error('Локальный секрет повреждён. Восстановите проверенную копию.')
    }
    const env = { ...process.env, PAYLOAD_SECRET: secret, PAYLOAD_LOCAL_ROOT: state.root, PAYLOAD_TEST_PUSH: '', NEXT_TELEMETRY_DISABLED: '1', PAYLOAD_TELEMETRY_DISABLED: '1' }
    const commands = mode === 'generate'
      ? [['--import', 'tsx', 'node_modules/payload/bin.js', '--disable-transpile', 'generate:importmap'], ['--import', 'tsx', 'node_modules/payload/bin.js', '--disable-transpile', 'generate:types']]
      : [['node_modules/next/dist/bin/next', mode, ...(mode === 'build' ? [] : ['--hostname', '127.0.0.1', '--port', String(state.port)])]]
    for (const args of commands) {
      const child = spawn(process.execPath, args, { cwd: appRoot, env, stdio: 'inherit' })
      const completion = new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)) })
      const stop = () => child.kill('SIGTERM')
      process.once('SIGINT', stop)
      process.once('SIGTERM', stop)
      await lock.child(child.pid)
      const code = await completion
      process.removeListener('SIGINT', stop)
      process.removeListener('SIGTERM', stop)
      await lock.child(null)
      if (code !== 0) { process.exitCode = code; return }
    }
    if (mode === 'build') {
      if (await sourceHash() !== buildSourceHash) throw new Error('Код изменился во время сборки. Повторите npm run build.')
      await writeFile(path.join(appRoot, '.next/local-source-hash'), buildSourceHash)
    }
  } finally { await lock.release() }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
