import type { Payload } from 'payload'
import type { User } from './payload-types'
import { prepareReleaseRecords } from './release-export'
import {publicationRuntime} from './publication/runtime'
import {previewProjection} from './preview-projection'

export async function readPreviewProject(payload: Payload, user: User | null, id: string, mode: string) {
  if (!user) throw new Error('Preview requires authentication')
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return null
  const result = await payload.find({
    collection: 'projects', user, overrideAccess: false,
    draft: mode !== 'published', depth: 1, limit: 1,
    where: mode === 'published'
      ? { and: [{ id: { equals: Number(id) } }, { _status: { equals: 'published' } }] }
      : { id: { equals: Number(id) } },
  })
  return result.docs[0] ?? null
}

// Private renderer input. This is intentionally not a publication snapshot/provenance.
// Selected saved draft replaces only its own published revision; other projects stay published.
export async function preparePreviewRelease({payload,user,id,mode,dataRoot}:{payload:Payload;user:User|null;id:string;mode:'draft'|'published';dataRoot:string}) {
 if(!user) throw new Error('Preview requires authentication')
 if(!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id)))return null
 const {coordinator,release}=await publicationRuntime(payload,user)
 const active=await coordinator.active()
 // Published preview is delivery state. Native published rows can be ahead of
 // the site while a publication is pending and must not serve as its baseline.
 if(mode==='published'){
  const mapping=active.state.projects.find(item=>item.target===id),project=mapping?active.generation.projects.find(item=>item.slug===mapping.slug):null
  if(!project)return null
  const source={projectId:Number(id),slug:project.slug,mode,authorStatus:'published' as const,updatedAt:active.descriptor.contentId}
  const projection=await previewProjection({active,renderer:release.renderer,source})
  return projection?{...projection,rendererId:release.renderer.rendererId,previewRoot:release.previewRoot}:null
 }
 const selected=await readPreviewProject(payload,user,id,'draft')
 if(!selected)return null
 if(mode==='draft'&&!selected.releaseContent)return null
 const core=mode==='draft'?await prepareReleaseRecords({payload,user,dataRoot,records:[selected]}):undefined
 const source={projectId:selected.id,slug:selected.slug,mode,authorStatus:selected._status,updatedAt:selected.updatedAt}
 const projection=await previewProjection({active,renderer:release.renderer,source,selected:core?{...core,externalDependencies:[...new Set(selected.releaseExternalDependencies?.map(item=>item.url)??[])]}:undefined})
 return projection?{...projection,rendererId:release.renderer.rendererId,previewRoot:release.previewRoot}:null
}
