import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import {locations} from './state.mjs'
import { resetLocalAccount } from './reset-account'

async function main() {
  let input = ''
  for await (const chunk of process.stdin) {
    input += chunk.toString()
    if (input.length > 2048) throw new Error('Invalid input')
  }
  const owner = JSON.parse(await readFile(path.join(locations().lock, 'owner.json'), 'utf8'))
  if (owner.pid !== process.ppid || owner.childPID !== process.pid) throw new Error('Maintenance lock is required')
  const { email, password } = JSON.parse(input)
  const payload = await getPayload({ config })
  try { await resetLocalAccount(payload, email, password) } finally { await payload.destroy() }
}
// Never print credentials, tokens, or raw authentication errors.
main().catch(() => { process.exitCode = 1 })
