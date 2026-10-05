import type { Payload } from 'payload'
import type { User } from './payload-types'
import { createHash } from 'node:crypto'
import { prepareReleaseRecords,readReleaseProjects } from './release-export'

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
 const selected=await readPreviewProject(payload,user,id,mode)
 if(!selected?.releaseContent) return null
 const published=await readReleaseProjects(payload,user,'published')
 const records=published.filter(project=>project.id!==selected.id)
 records.push(selected)
 records.sort((a,b)=>a.slug.localeCompare(b.slug))
 const core=await prepareReleaseRecords({payload,user,dataRoot,records})
 const source={projectId:selected.id,slug:selected.slug,mode,authorStatus:selected._status,updatedAt:selected.updatedAt}
 const revision=createHash('sha256').update(JSON.stringify({source,projects:core.projects,assets:core.assets.map(asset=>[asset.publicPath,asset.sha256,asset.bytes.length])})).digest('hex')
 return {version:1 as const,source,revision,...core,externalDependencies:[...new Set(records.flatMap(record=>record.releaseExternalDependencies?.map(item=>item.url)??[]))]}
}
