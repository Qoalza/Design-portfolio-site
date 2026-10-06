import {createHash} from 'node:crypto'
import {createDeliveryGeneration,canonicalJSON,type PreparedDeliveryAsset,type RendererManifest} from '../../portfolio-delivery/contract.mjs'
import type {createPublicationCoordinator,PrivateActiveMap} from '../../portfolio-delivery/coordinator.mjs'
import type {ProjectDocument} from '../../../src/lib/project-contract'
type Active=Awaited<ReturnType<ReturnType<typeof createPublicationCoordinator>['active']>>
type Source={projectId:number;slug:string;mode:'draft'|'published';authorStatus:'draft'|'published'|null|undefined;updatedAt:string}
type Selected={projects:ProjectDocument[];assets:PreparedDeliveryAsset[];externalDependencies:string[]}
// Stable native ID determines which public project is replaced, even when the
// selected draft changed its slug. All other data/bytes come from active delivery.
export async function previewProjection({active,renderer,source,selected}:{active:Active;renderer:RendererManifest;source:Source;selected?:Selected}) {
 const mapping=active.state.projects.find(item=>item.target===String(source.projectId))
 if(source.mode==='published'&&!mapping)return null
 const published=mapping?active.generation.projects.find(project=>project.slug===mapping.slug):undefined
 if(mapping&&!published)throw new Error('Preview active ID mapping is inconsistent')
 const projects=source.mode==='published'?[...active.generation.projects]:[...active.generation.projects.filter(project=>project.slug!==mapping?.slug),...(selected?.projects??[])]
 if(source.mode==='draft'&&(!selected||selected.projects.length!==1))throw new Error('Preview requires one exact saved target')
 projects.sort((a,b)=>a.slug.localeCompare(b.slug))
 const retained=source.mode==='published'?active.state.projects:active.state.projects.filter(item=>item.target!==String(source.projectId))
 const retainedSlugs=new Set(retained.map(item=>item.slug)),assets:PreparedDeliveryAsset[]=[]
 for(const asset of active.generation.assets) {
  if(source.mode==='draft'&&!retainedSlugs.has(asset.publicPath.split('/')[3]))continue
  const bytes=await active.readAsset(asset.publicPath);if(!bytes)throw new Error('Preview active asset unavailable')
  assets.push({...asset,bytes})
 }
 if(source.mode==='draft')assets.push(...selected!.assets)
 const externalDependencies=source.mode==='published'?active.generation.externalDependencies:[...new Set([...retained.flatMap((item:PrivateActiveMap['projects'][number])=>item.externalDependencies),...selected!.externalDependencies])]
 const generation=createDeliveryGeneration({projects,assets,externalDependencies},renderer)
 const resolvedSource=source.mode==='published'?{...source,slug:published!.slug,authorStatus:'published' as const}:source
 const revision=createHash('sha256').update(canonicalJSON({source:resolvedSource,active:active.descriptor,rendererId:renderer.rendererId,contentId:generation.contentId})).digest('hex')
 return {version:1 as const,source:resolvedSource,revision,projects:generation.projects,assets,externalDependencies:generation.externalDependencies}
}
