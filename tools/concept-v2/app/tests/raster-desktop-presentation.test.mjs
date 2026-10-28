import assert from 'node:assert/strict';
import test from 'node:test';
import {desktopRasterSlides,sarafanDesktopCaptions} from '../src/project-hero/raster-desktop-presentation.mjs';
import {sarafanRasterHero} from '../src/project-hero/raster-definition.mjs';
import {rasterHeroDefinition} from '../src/project-hero/raster-document-adapter.mjs';
import {rasterVariantDefinition} from '../src/project-hero/raster-variants.mjs';

test('desktop captions follow stable image ids without changing compact source titles',()=>{
 const definition=structuredClone(sarafanRasterHero),before=structuredClone(definition),context=definition.contexts[0];
 const slides=desktopRasterSlides(definition,context);
 assert.deepEqual(slides.map(({id,title,description})=>({id,title,description})),[
  {id:'delivery',title:'Выбранный заказ',description:'Настройка выбранного товара'},
  {id:'home',title:'Оформление заказа',description:'Список товаров и сводка заказа'},
  {id:'variant',title:'Выбранный вариант',description:'Настройка конкретного варианта товара'},
 ]);
 assert.deepEqual(definition,before);
 assert.equal(context.slides[1].title,'Главная страница');
 assert.deepEqual(slides.map(s=>s.src),context.slides.map(s=>s.src));
});
test('portfolio adapter supplies desktop-only captions for Sarafan without changing source',()=>{
 const project={slug:'sarafan-radio',title:'Сарафан',redesign:{hero:{kind:'raster',initialSlideId:'home',slides:sarafanRasterHero.contexts[0].slides.map(({id,title,src})=>({id,title,image:{src}}))}}};
 const before=structuredClone(project),definition=rasterHeroDefinition(project);
 assert.deepEqual(definition.desktopCaptions,sarafanDesktopCaptions);
 assert.deepEqual(project,before);
 assert.equal(definition.contexts[0].slides[1].title,'Главная страница');
 const other=rasterHeroDefinition({...project,slug:'other'});
 assert.equal(other.desktopCaptions,undefined);
 assert.equal(desktopRasterSlides(other,other.contexts[0]),other.contexts[0].slides);
});
test('every preview keeps caption identity after demo ids change',()=>{
 const three=rasterVariantDefinition(sarafanRasterHero,'3');
 assert.deepEqual(desktopRasterSlides(three,three.contexts[0]).map(s=>s.description),Object.values(sarafanDesktopCaptions).map(s=>s.description));
 for(const variant of ['5','5+']){
  const definition=rasterVariantDefinition(sarafanRasterHero,variant);
  const enriched=desktopRasterSlides(definition,definition.contexts[0]);
  assert.deepEqual(enriched.map(s=>s.description),definition.contexts[0].slides.map(s=>{
   const source=s.src.split('/').pop();
   return source==='main.webp'?sarafanDesktopCaptions.home.description:source==='delivery.webp'?sarafanDesktopCaptions.delivery.description:sarafanDesktopCaptions.variant.description;
  }));
 }
});
