import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { lstatSync, mkdirSync } from 'node:fs'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import { buildConfig } from 'payload'
import { Projects, Media, Users, ProjectFiles } from './collections'
import {runtimeSettings} from '../scripts/runtime-settings.mjs'

const directory = path.dirname(fileURLToPath(import.meta.url))
const settings=runtimeSettings({appRoot:path.resolve(directory,'..')})
const dataRoot=settings.root,testRoot=settings.fixture
if (!process.env.PAYLOAD_SECRET||process.env.PAYLOAD_SECRET.length<32) throw new Error('Payload requires a protected authentication secret')
if (process.env.PAYLOAD_DROP_DATABASE === 'true') throw new Error('Destructive database environment flag is forbidden in this local CMS')
mkdirSync(dataRoot, { recursive: true, mode: 0o700 })
if (lstatSync(dataRoot).isSymbolicLink()) throw new Error('Local state cannot be a symbolic link')
mkdirSync(path.join(dataRoot, 'project-files'), { recursive: true, mode: 0o700 })
if (lstatSync(path.join(dataRoot, 'project-files')).isSymbolicLink()) throw new Error('Local project files cannot be a symbolic link')
mkdirSync(path.join(dataRoot, 'media'), { recursive: true, mode: 0o700 })
if (lstatSync(path.join(dataRoot, 'media')).isSymbolicLink()) throw new Error('Local media cannot be a symbolic link')

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  serverURL: settings.origin,
  csrf:[settings.origin],
  cors:[settings.origin],
  telemetry: false,
  email: () => ({
    name: 'email-disabled', defaultFromAddress: 'noreply@art-des.ru', defaultFromName: 'Des-art Payload',
    sendEmail: async () => { throw new Error('Отправка писем не настроена. Восстановление доступа доступно через защищённую серверную консоль.') },
  }),
  admin: {
    user: 'users',
    importMap: { baseDir: directory },
    components: {
      beforeDashboard: ['/components/LocalNotice#LocalNotice'],
      beforeLogin: ['/components/LocalNotice#LocalNotice'],
    },
    meta: { titleSuffix: '— Des-art Payload' },
  },
  i18n: { fallbackLanguage: 'ru', supportedLanguages: { ru } },
  editor: lexicalEditor(),
  collections: [{...Users,auth:{cookies:{secure:settings.server,sameSite:'Lax'}}}, { ...Media, upload: { staticDir: path.join(dataRoot, 'media'), mimeTypes: ['image/png', 'image/jpeg', 'image/webp'], } }, { ...ProjectFiles, upload: { staticDir: path.join(dataRoot, 'project-files'), mimeTypes: ['text/html', 'text/css', 'text/javascript', 'application/javascript', 'application/json', 'image/svg+xml', 'image/avif', 'font/woff', 'font/woff2', 'font/ttf', 'font/otf', 'application/wasm'] } }, Projects],
  db: sqliteAdapter({
    client: { url: `file:${path.join(dataRoot, 'cms.db')}` },
    push: testRoot && process.env.PAYLOAD_TEST_PUSH === '1',
    migrationDir: path.join(directory, 'migrations'),
  }),
  // Store originals and verified candidates byte-for-byte; image ingest owns preparation.
  upload: { limits: { fileSize: 20 * 1024 * 1024 } },
  typescript: { outputFile: path.join(directory, 'payload-types.ts') },
})
