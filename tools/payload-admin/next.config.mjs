import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(appRoot, '../..')
const codeBuildDir=process.env.PAYLOAD_CODE_BUILD_DIR||'.next'
if(codeBuildDir!=='.next'&&!/^\.cms-builds\/[a-f0-9-]{36}$/.test(codeBuildDir))throw new Error('Invalid CMS code build directory')
const codeTsconfig=process.env.PAYLOAD_CODE_TSCONFIG||'tsconfig.json'
if(codeTsconfig!=='tsconfig.json'&&!/^\.cms-build-[a-f0-9-]{36}\.tsconfig\.json$/.test(codeTsconfig))throw new Error('Invalid CMS build TypeScript config')
export default withPayload({
  typescript:{tsconfigPath:codeTsconfig},
  distDir:codeBuildDir,
  output:'standalone',
  outputFileTracingRoot: root,
  outputFileTracingExcludes: { '/*': ['./.local/**/*', './.local-backups/**/*', './.local-lock/**/*', './.local-restore.json'] },
  agentRules: false,
  turbopack: { root },
  poweredByHeader: false,
  logging: { incomingRequests: false },
})
