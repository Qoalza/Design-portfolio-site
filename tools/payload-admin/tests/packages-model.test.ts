import assert from 'node:assert/strict'
import {test} from 'node:test'
import {bindPackage,bindSceneUrl,packageRecords,usesPackageFile,layoutSelection,type PackageMaterial} from '../src/authoring/packages'
import {switchHero,withoutEditorState} from '../src/authoring/hero'
import {prepareLayoutPackage} from '../src/materials/layout-package'
import type {Value} from '../src/authoring/model'
test('native scene bindings and originals survive Hero/URL choices without changing scenes or adaptives',async()=>{
 const prepared=await prepareLayoutPackage('sample','index.html',[{path:'index.html',bytes:Buffer.from('<p>Layout</p>')}])
 const material:PackageMaterial={source:prepared.source,bindings:prepared.files.map((file,index)=>({publicPath:prepared.source.assetBase+file.path,file:{relationTo:'project-files',value:index+1}})),externalDependencies:prepared.externalDependencies}
 const original:Value={redesign:{hero:{kind:'layout',scenes:[{id:'fixed',adaptives:[{id:'desktop',height:960}],source:{kind:'url',url:'https://public.example/page'}}]}}}
 const bound=bindPackage(original,['redesign','hero','scenes',0,'source'],material)
 assert.equal(packageRecords(bound)[0].source.assetBase,material.source.assetBase)
 assert.ok(usesPackageFile(bound,'project-files','1'))
 const url=bindSceneUrl(bound,['redesign','hero','scenes',0,'source'],'https://public.example/other')
 assert.deepEqual(packageRecords(url),packageRecords(bound))
 assert.deepEqual(packageRecords(switchHero(url,'raster')),packageRecords(bound))
 assert.equal('_payloadEditor' in withoutEditorState(bound),false)
 assert.deepEqual(JSON.parse(JSON.stringify(original)).redesign.hero.scenes[0].source,{kind:'url',url:'https://public.example/page'})
 assert.deepEqual(JSON.parse(JSON.stringify(bound)).redesign.hero.scenes[0].adaptives,[{id:'desktop',height:960}])
 assert.throws(()=>bindPackage(original,['redesign','hero'],material))
 assert.throws(()=>packageRecords({_payloadEditor:{version:1,heroes:{},packages:[{...material,bindings:[]}]}}))
})

test('directory selection ignores only its external folder name and preserves nested resource paths',()=>{
 assert.deepEqual(layoutSelection([{name:'index.html',webkitRelativePath:'My selected folder/scene/index.html'},{name:'main.css',webkitRelativePath:'My selected folder/styles/main.css'}]),{paths:['scene/index.html','styles/main.css'],entry:'scene/index.html'})
 assert.deepEqual(layoutSelection([{name:'other.html',webkitRelativePath:''},{name:'index.html',webkitRelativePath:''}]),{paths:['other.html','index.html'],entry:'index.html'})
 assert.deepEqual(layoutSelection([]),{paths:[],entry:''})
})
