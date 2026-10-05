import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'

const root = await mkdtemp(path.join(os.tmpdir(), 'des-art-payload-test-'))
try {
  const secret = randomBytes(48).toString('hex')
  await writeFile(path.join(root, 'secret'), secret, { mode: 0o600 })
  for (const test of ['tests/authoring-model.test.ts', 'tests/copy-model.test.ts', 'tests/image-quality.test.ts', 'tests/materials-model.test.ts', 'tests/material-request.test.ts', 'tests/file-response.test.ts', 'tests/layout-package.test.ts', 'tests/packages-model.test.ts', 'tests/preview-compiler.test.ts', 'tests/publication-operations.test.ts', 'tests/publication-request.test.ts', 'tests/publication-setup.test.ts', 'tests/database.test.mjs', 'tests/content.test.ts', 'tests/media.test.ts', 'tests/account.test.ts', 'tests/account-cli.test.ts', 'tests/storage.test.mjs', 'tests/persistence.test.ts']) {
    const child = spawn(process.execPath, ['--import', 'tsx', test], {
      stdio: 'inherit',
      env: { ...process.env, PAYLOAD_LOCAL_ROOT: root, PAYLOAD_SECRET: secret, PAYLOAD_TELEMETRY_DISABLED: '1' },
    })
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject)
      child.once('exit', (value) => resolve(value ?? 1))
    })
    process.exitCode = code
    if (code !== 0) break
  }
} finally {
  await rm(root, { recursive: true, force: true })
  await rm(`${root}-backups`, { recursive: true, force: true })
  await rm(`${root}-lock`, { recursive: true, force: true })
  await rm(`${root}-restore.json`, { force: true })
}
