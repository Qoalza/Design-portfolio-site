import test from 'node:test'
import assert from 'node:assert/strict'
import {previewProjection} from '../src/preview-projection'
import {withPublicAssetAliases} from '../src/asset-alias'
import {fixture} from '../../../tests/fixtures/portfolio-delivery.mjs'
import {createDeliveryGeneration,DELIVERY_CAPABILITIES} from '../../portfolio-delivery/contract.mjs'
import type {createPublicationCoordinator} from '../../portfolio-delivery/coordinator.mjs'
const renderer={rendererId:'a'.repeat(64),contractVersion:'public-delivery-v1' as const,capabilities:DELIVERY_CAPABILITIES}
type Active=Awaited<ReturnType<ReturnType<typeof createPublicationCoordinator>['active']>>
function activeFixture(empty=false):Active {
 const source=fixture(),generation=createDeliveryGeneration(empty?{projects:[],assets:[]}:source,renderer)
 const descriptor={contractVersion:generation.contractVersion,contentId:generation.contentId,rendererId:renderer.rendererId,activationSeq:10}
 return {generation,descriptor,state:{descriptor,latest:{},projects:empty?[]:generation.projects.map((project,index)=>({target:String(index+1),slug:project.slug,externalDependencies:[]}))},readAsset:async path=>source.assets.find(asset=>asset.publicPath===path)?.bytes??null}
}
test('saved draft replaces only its stable target; renamed slug removes old project and keeps other active bytes',async()=>{
 const active=activeFixture(),draft=fixture(),slug='renamed-fixture'
 const selected={projects:[{...withPublicAssetAliases(slug,draft.projects[0]) as typeof active.generation.projects[number],slug,title:'Private draft'}],assets:draft.assets.filter(asset=>asset.publicPath.startsWith('/assets/projects/fixture-one/')).map(asset=>({...asset,publicPath:asset.publicPath.replace('/fixture-one/','/'+slug+'/')})),externalDependencies:[]}
 const source={projectId:1,slug,mode:'draft' as const,authorStatus:'draft' as const,updatedAt:'saved-1'}
 const result=(await previewProjection({active,renderer,source,selected}))!
 assert.equal(result.projects.length,2)
 assert.equal(result.projects.some(project=>project.slug==='fixture-one'),false)
 assert.equal(result.projects.find(project=>project.slug===slug)!.title,'Private draft')
 assert.deepEqual(result.projects.find(project=>project.slug==='fixture-two'),active.generation.projects[1])
 for(const asset of result.assets.filter(asset=>asset.publicPath.startsWith('/assets/projects/fixture-two/')))assert.deepEqual(asset.bytes,await active.readAsset(asset.publicPath))
 assert.deepEqual(active.generation.projects.map(project=>project.slug),['fixture-one','fixture-two'])
 const published=(await previewProjection({active,renderer,source:{...source,mode:'published'},selected}))!
 assert.deepEqual(published.projects,active.generation.projects)
 assert.equal(published.source.slug,'fixture-one')
 assert.equal(published.source.authorStatus,'published')
 const changed=(await previewProjection({active,renderer:{...renderer,rendererId:'b'.repeat(64)},source,selected}))!
 assert.notEqual(changed.revision,result.revision)
})
test('empty delivery allows a new private draft but has no confirmed published preview',async()=>{
 const active=activeFixture(true),fixtureSource=fixture(),selected={...fixtureSource,projects:createDeliveryGeneration(fixtureSource,renderer).projects},source={projectId:9,slug:'fixture-one',mode:'draft' as const,authorStatus:'draft' as const,updatedAt:'saved-2'}
 selected.projects=selected.projects.slice(0,1);selected.assets=selected.assets.filter(asset=>asset.publicPath.startsWith('/assets/projects/fixture-one/'))
 assert.equal((await previewProjection({active,renderer,source,selected}))!.projects.length,1)
 assert.equal(await previewProjection({active,renderer,source:{...source,mode:'published'},selected}),null)
})
