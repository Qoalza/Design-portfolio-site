import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export default async function PreviewIndex() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')
  const projects = await payload.find({ collection: 'projects', user, overrideAccess: false, draft: true, depth: 0, limit: 100, sort: '-updatedAt' })
  return <main className="preview-shell">
    <p><Link href="/admin/collections/projects">← В редактор</Link></p>
    <h1>Локальный предпросмотр</h1>
    {projects.docs.length ? <ul>{projects.docs.map(project => <li key={project.id}>
      <a href={`/preview/projects/${project.id}?mode=draft`}>{project.title || 'Без названия'}</a>
      {' · '}<a href={`/preview/projects/${project.id}?mode=published`}>Опубликованная версия</a>
    </li>)}</ul> : <p>Сначала сохраните проект в редакторе.</p>}
    {projects.hasNextPage && <p>Здесь показаны последние 100 проектов. Остальные можно открыть кнопкой предпросмотра в редакторе.</p>}
  </main>
}
