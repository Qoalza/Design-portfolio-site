import assert from 'node:assert/strict'
import {test} from 'node:test'
import {appendCopy,removeCopy,setOptionalCopy,copyKinds} from '../src/authoring/copy'
import type {Value} from '../src/authoring/model'
test('copy CRUD preserves geometry and fixed template slots; empty draft arrays remain editable',()=>{
 const source:Value={redesign:{hero:{kind:'layout',scenes:[{id:'fixed'}]},page:{summary:[],sections:[{id:'system',blocks:[{type:'notice',variant:'system',title:'Keep',body:'Keep'}]}]}}}
 const changed=appendCopy(source,['redesign','page','summary'],'paragraph')
 assert.deepEqual(copyKinds(changed,['redesign','page','summary',0]),['text','link'])
 const link=appendCopy(changed,['redesign','page','summary',0],'link')
 assert.deepEqual(removeCopy(link,['redesign','page','summary',0],1),changed)
 assert.deepEqual((changed as Record<string,Value>).redesign && JSON.parse(JSON.stringify(changed)).redesign.hero,JSON.parse(JSON.stringify(source)).redesign.hero)
 assert.deepEqual(JSON.parse(JSON.stringify(source)).redesign.page.summary,[])
 assert.throws(()=>appendCopy(source,['redesign','hero','scenes'],'paragraph'))
 assert.throws(()=>removeCopy(source,['redesign','page','sections'],0))
 assert.throws(()=>removeCopy(source,['redesign','page','sections',0,'blocks'],0))
})
test('optional authoring fields can be added and removed without arbitrary contract mutation',()=>{
 const source:Value={materials:{projectState:'completed',fileState:'absent'},redesign:{page:{summary:[[{type:'text',text:'Keep'}]]}}}
 const edited=setOptionalCopy(source,['redesign','page','summary',0,0],'marks',['strong'])
 assert.deepEqual(setOptionalCopy(edited,['redesign','page','summary',0,0],'marks',undefined),source)
 assert.throws(()=>setOptionalCopy(source,[],'slug','changed'))
 assert.throws(()=>setOptionalCopy(source,['materials'],'__proto__',{}))
})
