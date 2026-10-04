import assert from 'node:assert/strict';
import test from 'node:test';
import {sarafanRasterHero} from '../src/project-hero/raster-definition.mjs';
import {rasterHeroDefinition,rasterHeroRevision} from '../src/project-hero/raster-document-adapter.mjs';

const project=count=>({title:'Проект',redesign:{hero:{kind:'raster',initialSlideId:'screen-1',slides:Array.from({length:count},(_,i)=>({id:`screen-${i}`,title:`Экран ${i}`,image:{src:`/assets/projects/test/screen-${i}.webp`,width:4096,height:2958,alt:`Экран ${i}`}}))}}});
test('document preserves initial/order/titles/sources with unavailable Tablet/Mobile',()=>{
 for(const count of [3,5,7,9]){const p=project(count),d=rasterHeroDefinition(p);assert.equal(d.projectName,p.title);assert.equal(d.initialContextId,'desktop');assert.equal(d.contexts[0].initialSlideId,p.redesign.hero.initialSlideId);assert.deepEqual(d.contexts[0].slides,p.redesign.hero.slides.map(s=>({id:s.id,title:s.title,src:s.image.src})));assert.deepEqual(d.contexts.slice(1),sarafanRasterHero.contexts.slice(1));}
});
test('accepted Sarafan document produces the exact existing shell inputs',()=>{
 const old=sarafanRasterHero,p={title:old.projectName,redesign:{hero:{kind:'raster',initialSlideId:old.contexts[0].initialSlideId,slides:old.contexts[0].slides.map(({id,title,src})=>({id,title,image:{src}}))}}};assert.deepEqual(rasterHeroDefinition(p),old);
});
test('replacement, reorder, title, initial and removal invalidate mounted carousel state',()=>{
 const baseline=project(5),revision=rasterHeroRevision(baseline);
 for(const mutate of [p=>p.redesign.hero.slides.reverse(),p=>p.redesign.hero.slides.splice(0,2),p=>p.redesign.hero.initialSlideId='screen-2',p=>p.redesign.hero.slides[0].image.src='/assets/projects/replacement.webp',p=>p.redesign.hero.slides[0].title='Новая подпись']){const p=structuredClone(baseline);mutate(p);assert.notEqual(rasterHeroRevision(p),revision);}
 assert.equal(rasterHeroRevision(structuredClone(baseline)),revision);
});
test('adapter never invents raster content for a layout document',()=>{const p=project(3);p.redesign.hero.kind='layout';assert.throws(()=>rasterHeroDefinition(p),/raster/);});
