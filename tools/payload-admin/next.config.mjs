import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(appRoot, '../..')
export default withPayload({
  outputFileTracingRoot: root,
  outputFileTracingExcludes: { '/*': ['./.local/**/*', './.local-backups/**/*', './.local-lock/**/*', './.local-restore.json'] },
  agentRules: false,
  turbopack: { root },
  // Next reserves /404 before the public catch-all, as in the original release host.
  async rewrites() {
    return {beforeFiles: [{source: '/404', destination: '/release-not-found'}], afterFiles: [], fallback: []}
  },
  poweredByHeader: false,
  logging: { incomingRequests: false },
})
