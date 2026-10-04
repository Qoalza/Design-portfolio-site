import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// This worker only opens a disposable staging database; never personal .local.
const root = path.resolve(process.env.PAYLOAD_LOCAL_ROOT || '')
assert.equal(path.dirname(root), path.resolve(os.tmpdir()))
assert.ok(path.basename(root).startsWith('des-art-payload-test-'))
const payload = await getPayload({ config })
try { await payload.db.migrate() } finally { await payload.destroy() }
