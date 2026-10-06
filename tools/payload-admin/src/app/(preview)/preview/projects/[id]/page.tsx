import {runtimeSettings} from '../../../../../../scripts/runtime-settings.mjs'
import {headers} from 'next/headers'
import {notFound,redirect} from 'next/navigation'
import {getPayload} from 'payload'
import config from '@payload-config'
import {preparePreviewRelease,readPreviewProject} from '../../../../../preview'
import {PreviewRendererStatus} from '../../../../../components/PreviewRendererStatus'
import {LegacyProjectPreview} from '../../../../../components/LegacyProjectPreview'
import {createPreviewArtifact,lastPreviewArtifact} from '../../../../../preview-artifacts'
export const dynamic='force-dynamic'
export default async function Preview({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{mode?:string}>}) {
 const {id}=await params
 const mode=(await searchParams).mode==='published'?'published':'draft'
 const payload=await getPayload({config})
 const {user}=await payload.auth({headers:await headers()})
 if(!user)redirect('/admin/login')
 if(!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id)))notFound()
 const project=mode==='draft'?await readPreviewProject(payload,user,id,'draft'):null
 if(mode==='draft'&&!project)notFound()
 if(mode==='draft'&&project&&!project.releaseContent)return <LegacyProjectPreview project={project} mode={mode}/>
 let artifact=lastPreviewArtifact(user.id,Number(id),mode),failed=false,unpublished=false,title=project?.title??'Проект'
 try {
  const dataRoot=runtimeSettings().root
  const prepared=await preparePreviewRelease({payload,user,id,mode,dataRoot})
  if(!prepared){if(mode!=='published')throw new Error('Missing renderer data');unpublished=true;artifact=null}
  else {title=prepared.projects.find(item=>item.slug===prepared.source.slug)?.title??title
  artifact=await createPreviewArtifact({prepared,dataRoot,owner:user.id})}
 }catch{failed=true}
 if(unpublished)return <main className="preview-shell"><p>У проекта пока нет подтверждённой публикации на сайте.</p><a href="?mode=draft">Открыть сохранённый черновик</a></main>
 return <>
  <nav className="preview-toolbar" aria-label="Предпросмотр">
   <a href={`/admin/collections/projects/${id}`}>← В редактор</a>
   <span>{mode==='published'?'Опубликованная версия':'Сохранённый черновик'}</span>
   <a href="?mode=draft" aria-current={mode==='draft'?'page':undefined}>Черновик</a>
   <a href="?mode=published" aria-current={mode==='published'?'page':undefined}>Опубликованная версия</a>
   {artifact&&<PreviewRendererStatus rendererId={artifact.rendererId}/>}
   <a href={artifact?.base}>Главная в предпросмотре</a>
  </nav>
  {failed?<p role="alert" className="preview-hint">Не удалось открыть текущую версию. Проверьте сохранённые данные и ресурсы.{artifact?' Ниже остаётся предыдущий успешный предпросмотр.':''}</p>:<p className="preview-hint">Показана сохранённая версия. После правок сохраните проект и обновите страницу. Предпросмотр действует 30 минут.</p>}
  {artifact&&<iframe title={`Предпросмотр: ${title}`} sandbox="allow-scripts" referrerPolicy="no-referrer" src={`${artifact.base}projects/${artifact.slug}`} style={{display:'block',width:'100%',height:'calc(100vh - 110px)',border:0}}/>}
 </>
}
