import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Python's standard PTY support is used only by this macOS integration test.
if (process.platform !== 'darwin') {
  console.log('SKIP: interactive terminal smoke is configured for macOS')
} else {
  const nonInteractive = spawnSync(process.execPath, ['scripts/account.mjs'], { encoding: 'utf8' })
  assert.notEqual(nonInteractive.status, 0)
  assert.match(nonInteractive.stderr, /терминале/)
  const password = randomBytes(32).toString('hex')
  const result = spawnSync('python3', ['tests/terminal-driver.py', process.execPath, 'scripts/account.mjs'], {
    encoding: 'utf8', input: JSON.stringify({ email: 'recovery@example.test', password }), timeout: 40000,
  })
  assert.equal(result.status, 0, 'Terminal driver failed')
  const outcome = JSON.parse(result.stdout)
  assert.equal(outcome.code, 0, 'Interactive recovery command failed')
  assert.equal(outcome.step, 3)
  assert.equal(outcome.completed, true)
  assert.equal(outcome.echoed, false, 'Hidden password appeared in terminal output')
  const payload = await getPayload({ config })
  try {
    assert.ok((await payload.login({ collection: 'users', data: { email: 'recovery@example.test', password } })).token)
  } finally { await payload.destroy() }
  console.log('PASS: interactive CLI changes fixture password without echo; non-interactive input is refused')
}
