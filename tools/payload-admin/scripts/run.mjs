import { lstat, mkdir, readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { locations, acquire, appRoot, exists } from './state.mjs'
import { requireCurrentSchema } from './schema.mjs'

import {cmsSourceHash as sourceHash} from './source-hash.mjs'
import {buildCMS} from './build.mjs'

async function main() {
  const mode = process.argv[2]
  if (!['dev', 'build', 'start', 'generate'].includes(mode)) throw new Error('Unknown local CMS command')
  if(mode==='build'||mode==='generate'){await buildCMS({mode});return}
  const state = locations()
  const lock = await acquire(state)
  try {
    if (mode === 'dev' || mode === 'start') {
      if (!await exists(path.join(state.root, 'cms.db'))) throw new Error('Сначала подготовьте базу: npm run db:prepare')
      await requireCurrentSchema(state.root)
    }
    let codeBuildDir
    if (mode === 'start') {
      const candidate=JSON.parse(await readFile(path.join(appRoot,'.cms-builds/candidate.json'),'utf8'))
      if(candidate.version!==1||typeof candidate.buildDir!=='string'||!/^\.cms-builds\/[a-f0-9-]{36}$/.test(candidate.buildDir))throw new Error('Invalid CMS build candidate')
      codeBuildDir=candidate.buildDir
      const stamp = path.join(appRoot,codeBuildDir,'local-source-hash')
      if (!await exists(stamp) || await readFile(stamp, 'utf8') !== await sourceHash()) throw new Error('Нужна актуальная сборка: npm run build')
    }
    await mkdir(state.root, { recursive: true, mode: 0o700 })
    if ((await lstat(state.root)).isSymbolicLink()) throw new Error('Local state cannot be a symbolic link')
    const secretFile = path.join(state.root, 'secret')
    let secret
    if (mode === 'dev' || mode === 'start') {
      if (!(await lstat(secretFile)).isFile()) throw new Error('Local secret must be a regular file')
      secret = await readFile(secretFile, 'utf8')
      if (!/^[0-9a-f]{96}$/.test(secret)) throw new Error('Локальный секрет повреждён. Восстановите проверенную копию.')
    }
    const env = { ...process.env, PAYLOAD_SECRET: secret,PAYLOAD_WRITER_TOKEN:lock.token,PAYLOAD_CODE_BUILD_DIR:codeBuildDir??'.next', ...(state.server?{PAYLOAD_DATA_ROOT:state.root,PAYLOAD_LOCAL_ROOT:''}:{PAYLOAD_RUNTIME_MODE:state.fixture?'fixture':'development',PAYLOAD_LOCAL_ROOT:state.root}), PAYLOAD_TEST_PUSH: '', NEXT_TELEMETRY_DISABLED: '1', PAYLOAD_TELEMETRY_DISABLED: '1' }
    const commands=[['node_modules/next/dist/bin/next',mode,'--hostname','127.0.0.1','--port',String(state.port)]]
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
  } finally { await lock.release() }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
