import assert from 'node:assert/strict'
import {test} from 'node:test'
import {bindImage, appendRaster, materialRecords, usesMaterialFile, imageSlot, type Material} from '../src/authoring/materials'
import {switchHero} from '../src/authoring/hero'
const hash='a'.repeat(64), publicPath=`/assets/projects/example/uploads/${hash}.png`
const info={format:'png' as const,width:4096,height:2958,bytes:128,sha256:hash}
const material:Material={publicPath,original:{relationTo:'media',value:1},prepared:{relationTo:'media',value:2},image:{src:publicPath,alt:'Новый экран',width:4096,height:2958},report:{version:1,context:'screen',mode:'original',reason:'original-not-smaller',original:info,prepared:info}}
test('replacement preserves original input, alt, report, originals and prepared links',()=>{
 const original={redesign:{card:{preview:{front:{src:'/assets/old.png',alt:'Согласованная подпись',width:128,height:128}}},hero:{kind:'raster',initialSlideId:'',slides:[]}}}
 const replaced=bindImage(original,['redesign','card','preview','front'],material)
 assert.equal((replaced as typeof original).redesign.card.preview.front.alt,'Согласованная подпись')
 assert.equal(original.redesign.card.preview.front.src,'/assets/old.png')
 assert.deepEqual(materialRecords(replaced),[material])
 assert.ok(usesMaterialFile(replaced,'media','1'));assert.ok(usesMaterialFile(replaced,'media','2'));assert.equal(usesMaterialFile(replaced,'media','3'),false)
 assert.equal(materialRecords(switchHero(replaced,'layout')).length,1)
 assert.throws(()=>bindImage(original,['redesign','hero'],material))
})
test('raster append retains ids and initial choice; repeated bitmap gets unique slide ids',()=>{
 const original={redesign:{hero:{kind:'raster',initialSlideId:'',slides:[]}}}
 const one=appendRaster(original,material),two=appendRaster(one,material)
 const hero=(two as {redesign:{hero:{initialSlideId:string;slides:{id:string}[]}}}).redesign.hero
 assert.equal(hero.slides.length,2);assert.notEqual(hero.slides[0].id,hero.slides[1].id);assert.equal(hero.initialSlideId,hero.slides[0].id)
 assert.equal(materialRecords(two).length,1);assert.equal(original.redesign.hero.slides.length,0)
 let full=two
 for(let n=2;n<9;n++) full=appendRaster(full,material)
 assert.throws(()=>appendRaster(full,material))
})
test('technical paths and fake material paths cannot be bound as project images',()=>{
 assert.ok(imageSlot(['redesign','hero','slides',0,'image']))
 assert.equal(imageSlot(['redesign','hero','slides','0','image']),false)
 assert.equal(imageSlot(['redesign','hero','source']),false)
 for(const value of [{...material,publicPath:'/private/secret'}, {...material,prepared:{relationTo:'media',value:-1}}, {...material,image:{...material.image,width:1}}]) {
  assert.throws(()=>materialRecords({_payloadEditor:{version:1,heroes:{},materials:[value]}}))
 }
})
