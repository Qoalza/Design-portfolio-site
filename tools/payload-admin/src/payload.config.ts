import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { lstatSync, mkdirSync } from 'node:fs'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import { buildConfig } from 'payload'
import { Projects, Media, Users, ProjectFiles } from './collections'

const directory = path.dirname(fileURLToPath(import.meta.url))
const localRoot = path.resolve(directory, '../.local')
const dataRoot = path.resolve(/*turbopackIgnore: true*/ process.env.PAYLOAD_LOCAL_ROOT || localRoot)
const testRoot = path.dirname(dataRoot) === path.resolve(os.tmpdir())
  && path.basename(dataRoot).startsWith('des-art-payload-test-')
if (dataRoot !== localRoot && !testRoot) throw new Error('CMS accepts only its local sandbox or a disposable test directory')
if (!process.env.PAYLOAD_SECRET) throw new Error('Start the local CMS using npm run dev/build/start')
if (process.env.PAYLOAD_DROP_DATABASE === 'true') throw new Error('Destructive database environment flag is forbidden in this local CMS')
mkdirSync(dataRoot, { recursive: true, mode: 0o700 })
if (lstatSync(dataRoot).isSymbolicLink()) throw new Error('Local state cannot be a symbolic link')
mkdirSync(path.join(dataRoot, 'project-files'), { recursive: true, mode: 0o700 })
if (lstatSync(path.join(dataRoot, 'project-files')).isSymbolicLink()) throw new Error('Local project files cannot be a symbolic link')
mkdirSync(path.join(dataRoot, 'media'), { recursive: true, mode: 0o700 })
if (lstatSync(path.join(dataRoot, 'media')).isSymbolicLink()) throw new Error('Local media cannot be a symbolic link')

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  serverURL: `http://127.0.0.1:${testRoot ? 41741 : 41740}`,
  telemetry: false,
  email: () => ({
    name: 'local-disabled', defaultFromAddress: 'local@example.test', defaultFromName: 'Des-art Local',
    sendEmail: async () => { throw new Error('Отправка писем в локальной версии отключена.') },
  }),
  admin: {
    user: 'users',
    importMap: { baseDir: directory },
    components: {
      beforeDashboard: ['/components/LocalNotice#LocalNotice'],
      beforeLogin: ['/components/LocalNotice#LocalNotice'],
    },
    meta: { titleSuffix: '— Des-art Local' },
  },
  i18n: { fallbackLanguage: 'ru', supportedLanguages: { ru } },
  editor: lexicalEditor(),
  collections: [Users, { ...Media, upload: { staticDir: path.join(dataRoot, 'media'), mimeTypes: ['image/png', 'image/jpeg', 'image/webp'], } }, { ...ProjectFiles, upload: { staticDir: path.join(dataRoot, 'project-files'), mimeTypes: ['text/html', 'text/css', 'text/javascript', 'application/javascript', 'application/json', 'image/svg+xml', 'image/avif', 'font/woff', 'font/woff2', 'font/ttf', 'font/otf', 'application/wasm'] } }, Projects],
  db: sqliteAdapter({
    client: { url: `file:${path.join(dataRoot, 'cms.db')}` },
    push: testRoot && process.env.PAYLOAD_TEST_PUSH === '1',
    migrationDir: path.join(directory, 'migrations'),
  }),
  // Store originals and verified candidates byte-for-byte; image ingest owns preparation.
  upload: { limits: { fileSize: 20 * 1024 * 1024 } },
  typescript: { outputFile: path.join(directory, 'payload-types.ts') },
})
