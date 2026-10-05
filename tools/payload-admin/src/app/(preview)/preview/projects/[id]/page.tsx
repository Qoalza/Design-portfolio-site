import {runtimeSettings} from '../../../../../../scripts/runtime-settings.mjs'
import {headers} from 'next/headers'
import {notFound,redirect} from 'next/navigation'
import {getPayload} from 'payload'
import config from '@payload-config'
import {preparePreviewRelease,readPreviewProject} from '../../../../../preview'
import {LegacyProjectPreview} from '../../../../../components/LegacyProjectPreview'
import {createPreviewArtifact,lastPreviewArtifact} from '../../../../../preview-artifacts'
export const dynamic='force-dynamic'
export default async function Preview({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{mode?:string}>}) {
 const {id}=await params
 const mode=(await searchParams).mode==='published'?'published':'draft'
 const payload=await getPayload({config})
 const {user}=await payload.auth({headers:await headers()})
 if(!user)redirect('/admin/login')
 const project=await readPreviewProject(payload,user,id,mode)
 if(!project){
  if(mode==='draft'||!await readPreviewProject(payload,user,id,'draft'))notFound()
  return <main className="preview-shell"><p>У проекта пока нет опубликованной версии.</p><a href="?mode=draft">Открыть сохранённый черновик</a></main>
 }
 if(!project.releaseContent)return <LegacyProjectPreview project={project} mode={mode}/>
 let artifact=lastPreviewArtifact(user.id,project.id,mode),failed=false
 try {
  const dataRoot=runtimeSettings().root
  const prepared=await preparePreviewRelease({payload,user,id,mode,dataRoot})
  if(!prepared)throw new Error('Missing renderer data')
  artifact=await createPreviewArtifact({prepared,dataRoot,owner:user.id})
 }catch{failed=true}
 return <>
  <nav className="preview-toolbar" aria-label="Предпросмотр">
   <a href={`/admin/collections/projects/${project.id}`}>← В редактор</a>
   <span>{mode==='published'?'Опубликованная версия':'Сохранённый черновик'}</span>
   <a href="?mode=draft" aria-current={mode==='draft'?'page':undefined}>Черновик</a>
   <a href="?mode=published" aria-current={mode==='published'?'page':undefined}>Опубликованная версия</a>
   <a href={artifact?.base}>Главная в предпросмотре</a>
  </nav>
  {failed?<p role="alert" className="preview-hint">Не удалось открыть текущую версию. Проверьте сохранённые данные и ресурсы.{artifact?' Ниже остаётся предыдущий успешный предпросмотр.':''}</p>:<p className="preview-hint">Показана сохранённая версия. После правок сохраните проект и обновите страницу. Предпросмотр действует 30 минут.</p>}
  {artifact&&<iframe title={`Предпросмотр: ${project.title}`} sandbox="allow-scripts" referrerPolicy="no-referrer" src={`${artifact.base}projects/${artifact.slug}`} style={{display:'block',width:'100%',height:'calc(100vh - 110px)',border:0}}/>}
 </>
}
