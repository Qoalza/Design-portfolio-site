import assert from 'node:assert/strict'
import { test } from 'node:test'
import { switchHero, withoutEditorState, withEditorState, editorState } from '../src/authoring/hero.ts'
import { replaceValue, moveItem, removeSlide } from '../src/authoring/model.ts'

test('editing nested copy preserves source metadata and original versions', () => {
 const original = {redesign:{hero:{kind:'layout',source:{entry:'index.html',files:[{sha256:'keep'}]}},page:{summary:[[{type:'text',text:'Before',marks:['strong']}]]}}}
 const changed = replaceValue(original,['redesign','page','summary',0,0,'text'],'After')
 assert.equal(changed.redesign.page.summary[0][0].text,'After')
 assert.equal(original.redesign.page.summary[0][0].text,'Before')
 assert.deepEqual(changed.redesign.hero,original.redesign.hero)
 assert.deepEqual(changed.redesign.page.summary[0][0].marks,['strong'])
})
test('invalid paths cannot silently add fields or modify object prototypes', () => {
 for (const key of ['__proto__','constructor','prototype','missing']) assert.throws(()=>replaceValue({text:'old'},[key],'bad'))
 assert.throws(()=>replaceValue({items:['a']},['items',-1],'bad'))
 assert.throws(()=>replaceValue({items:['a']},['items',1],'bad'))
 assert.throws(()=>replaceValue({items:['a']},['items','0'],'bad'))
 assert.throws(()=>replaceValue({text:'old'},['text','child'],'bad'))
})
test('reordering retains ids and initial selection, and does not mutate the version',()=>{
 const original={slides:[{id:'a'},{id:'b'},{id:'c'}],initialSlideId:'b'}
 const changed=moveItem(original,['slides'],0,2)
 assert.deepEqual(changed.slides.map(s=>s.id),['b','c','a'])
 assert.equal(changed.initialSlideId,'b')
 assert.deepEqual(original.slides.map(s=>s.id),['a','b','c'])
 assert.throws(()=>moveItem(original,['slides'],0,3))
})
test('removing the initial slide chooses the adjacent remaining screen',()=>{
 const hero={kind:'raster',initialSlideId:'b',slides:[{id:'a'},{id:'b'},{id:'c'}]}
 const changed=removeSlide(hero,1)
 assert.equal(changed.initialSlideId,'c')
 assert.equal(hero.slides.length,3)
 assert.equal(removeSlide(hero,0).initialSlideId,'b')
 assert.throws(()=>removeSlide({kind:'raster',initialSlideId:'a',slides:[{id:'a'}]},0))
})

test('Hero choice retains edited variants across native JSON serialization and excludes authoring state from public data', () => {
 const layout = { kind:'layout', initialSceneId:'statistics', scenes:[{id:'statistics', source:{kind:'package', entry:'index.html', files:[{sha256:'original'}]}}] }
 const original = {redesign:{hero:layout}}
 const raster = switchHero(original, 'raster')
 const updated = replaceValue(raster, ['redesign','hero','slides'], [{id:'my-screen',title:'Saved screen'}])
 const reopened = JSON.parse(JSON.stringify(updated))
 const back = switchHero(reopened, 'layout')
 assert.deepEqual((back as typeof original).redesign.hero, layout)
 const again = switchHero(back,'raster') as {redesign:{hero:{slides:{id:string}[]}}}
 assert.equal(again.redesign.hero.slides[0].id,'my-screen')
 assert.equal('_payloadEditor' in withoutEditorState(again),false)
 assert.deepEqual(editorState(withEditorState(withoutEditorState(again),again)),editorState(again))
 assert.equal('_payloadEditor' in original,false)
})
test('corrupt editor metadata cannot be silently persisted by publication', () => {
 assert.throws(()=>editorState({_payloadEditor:{version:2,heroes:{}}}))
 assert.throws(()=>editorState({_payloadEditor:{version:1,heroes:{raster:{kind:'layout'}}}}))
 assert.throws(()=>editorState({_payloadEditor:{version:1,heroes:{unexpected:{kind:'unexpected'}}}}))
 assert.throws(()=>editorState({_payloadEditor:{version:1,heroes:{},unsafe:'extra'}}))
})
