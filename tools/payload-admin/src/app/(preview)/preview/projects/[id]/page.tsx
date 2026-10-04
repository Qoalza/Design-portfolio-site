import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { getPayload } from 'payload'
import { RichText } from '@payloadcms/richtext-lexical/react'
import config from '@payload-config'
import type { Media } from '../../../../../payload-types'
import { readPreviewProject } from '../../../../../preview'
import headerStyles from '../../../../../components/preview-header.module.css'

export const dynamic = 'force-dynamic'

function Picture({ media, hero = false }: { media?: number | Media | null; hero?: boolean }) {
  if (!media || typeof media === 'number' || !media.filename) return null
  return <Image unoptimized src={`/api/media/file/${encodeURIComponent(media.filename)}`} alt={media.alt || ''}
    width={media.width || 1200} height={media.height || 800} className={hero ? 'hero-image' : 'content-image'} />
}

export default async function Preview({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ mode?: string }>
}) {
  const { id } = await params
  const mode = (await searchParams).mode === 'published' ? 'published' : 'draft'
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')
  const project = await readPreviewProject(payload, user, id, mode)
  if (!project) {
    if (mode !== 'published') notFound()
    const draft = await readPreviewProject(payload, user, id, 'draft')
    if (!draft) notFound()
    return <main className="preview-shell"><p>У этого проекта пока нет опубликованной локальной версии.</p><a href={`?mode=draft`}>Открыть сохранённый черновик</a></main>
  }
  const blocks = project.blocks || []
  return <>
    <nav className="preview-toolbar" aria-label="Предпросмотр">
      <a href={`/admin/collections/projects/${project.id}`}>← В редактор</a>
      <span>{mode === 'published' ? 'Опубликовано локально' : 'Сохранённый черновик'}</span>
      <a href="?mode=draft" aria-current={mode === 'draft' ? 'page' : undefined}>Черновик</a>
      <a href="?mode=published" aria-current={mode === 'published' ? 'page' : undefined}>Опубликованная версия</a>
    </nav>
    <main className="preview-shell">
      <p className="preview-hint">Локальный предпросмотр. Чтобы увидеть новые правки, сохраните их в редакторе и обновите эту страницу.</p>
      <header className={`${headerStyles.pageHeader} ${headerStyles.simple} ${headerStyles.projectPage}`}>
        <div className={headerStyles.head}><div className={headerStyles.text}>
          <h1>{project.header?.heading || project.title || 'Без названия'}</h1>
          {project.header?.description && <p>{project.header.description}</p>}
        </div></div>
      </header>
      <div className="hero-preview"><Picture media={project.hero?.image} hero /></div>
      <div className="project-information">
        <nav className="section-navigation" aria-label="Секции кейса">{blocks.map((block, index) =>
          <a key={block.id || index} href={`#block-${index}`}>{block.heading || (block.blockType === 'gallery' ? 'Галерея' : 'Секция')}</a>)}</nav>
        <article>{blocks.map((block, index) => <section className="contentSection" id={`block-${index}`} key={block.id || index}>
          <h2>{block.heading || (block.blockType === 'gallery' ? 'Галерея' : 'Секция')}</h2>
          {block.blockType === 'section' ? <>
            {block.text?.root && <RichText data={block.text} />}
            <Picture media={block.image} />
            {block.note && <aside className="projectNotice"><p>{block.note}</p></aside>}
          </> : <div className="preview-gallery">{block.images?.map((item, i) => <figure key={item.id || i}>
            <Picture media={item.image} />{item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>)}</div>}
          <hr className="contentDivider" />
        </section>)}</article>
      </div>
    </main>
  </>
}
