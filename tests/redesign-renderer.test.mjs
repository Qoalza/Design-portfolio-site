import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import test from 'node:test';
import {build} from 'esbuild';
import {projectCardView,projectDetailDocument,projectImageSource} from '../tools/concept-v2/app/src/project-page/project-view-model.mjs';
import {exportApprovedRedesign} from '../tools/concept-v2/export-approved-content.mjs';
const repoRoot=fileURLToPath(new URL('..',import.meta.url));
const appRoot=path.join(repoRoot,'tools/concept-v2/app');
const {projects}=await exportApprovedRedesign({repoRoot});
const folder=await mkdtemp(path.join(tmpdir(),'redesign-renderer-'));
const file=path.join(folder,'render.cjs');
await build({stdin:{contents:`import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {CorvoProjectPage} from './src/project-page/CorvoProjectPage.jsx'; import {SarafanProjectPage} from './src/project-page/SarafanProjectPage.jsx'; export function render(project){return renderToStaticMarkup(React.createElement(project.slug==='corvo'?CorvoProjectPage:SarafanProjectPage,{project}));}`,resolveDir:appRoot,sourcefile:'renderer-test.jsx',loader:'jsx'},bundle:true,jsx:'automatic',loader:{'.svg':'text'},platform:'node',format:'cjs',outfile:file,define:{'import.meta.env.BASE_URL':'"/"'},plugins:[{name:'css-test-names',setup(b){b.onLoad({filter:/\.css$/},args=>({contents:`export default new Proxy({}, {get:(_,key)=>${JSON.stringify(path.basename(args.path))}+'__'+key});`,loader:'js'}));}}]});
const {render}=createRequire(import.meta.url)(file);

test('project title, subtitle, tags and material link are consumed from the document',()=>{
 for(const baseline of projects){const p=structuredClone(baseline);p.title='Проверка имени';p.subtitle='Проверка подзаголовка';p.detailTags=['Проверка тегов'];p.materials.figmaUrl='https://example.com/changed';const html=render(p);for(const value of [p.title,p.subtitle,p.detailTags[0],p.materials.figmaUrl])assert.ok(html.includes(value),value);}
});
test('every page copy group and action reads new values, not JSX constants',()=>{
 for(const baseline of projects){const p=structuredClone(baseline),page=p.redesign.page;page.summary=[[{type:'strong',text:'Проверка summary'}]];page.notice={title:'Проверка notice',body:'Проверка body'};
 if(p.slug==='corvo'){page.metrics.heading='Проверка metrics';page.metrics.items[1].action.href='https://example.com/library';page.sections[0].blocks=[{type:'paragraph',content:[{type:'text',text:'Проверка section'}]}];page.showcase.title='Проверка showcase';}
 else{page.flow.title='Проверка flow';page.flow.action.href='https://example.com/flow';page.sections[0].paragraphs=[[{type:'text',text:'Проверка receiving'}]];page.result.paragraphs=[[{type:'text',text:'Проверка result'}]];}
 const html=render(p);for(const value of ['Проверка summary','Проверка notice','Проверка body',...(p.slug==='corvo'?['Проверка metrics','https://example.com/library','Проверка section','Проверка showcase']:['Проверка flow','https://example.com/flow','Проверка receiving','Проверка result'])])assert.ok(html.includes(value),value);
 }
});
test('text is escaped and rich-text marks are rendered without raw HTML',()=>{const p=structuredClone(projects[0]);p.redesign.page.summary=[[{type:'text',text:'<script>bad</script>',marks:['strong','emphasis','underline']}]];const html=render(p);assert.ok(html.includes('&lt;script&gt;bad&lt;/script&gt;'));assert.ok(html.includes('<strong>'));assert.ok(html.includes('<em>'));assert.ok(html.includes('<u>'));});
test('content image replacement preserves fixed display dimensions and reads alt/src',()=>{for(const baseline of projects){const p=structuredClone(baseline);const image=p.redesign.page.showcase?.image??p.redesign.page.flow.image;image.src='/assets/projects/changed.png';image.alt='Новый alt';image.width=8000;const html=render(p);assert.ok(html.includes('src="/assets/projects/changed.png"'));assert.ok(html.includes('alt="Новый alt"'));assert.ok(html.includes(p.slug==='corvo'?'width="1015" height="902"':'width="1047" height="860"'));}});

test('card data uses the document and never invents renditions for replacement assets',()=>{
 for(const baseline of projects){const p=structuredClone(baseline);p.title='Новое название';p.description='Новое описание';p.tags=['НОВЫЙ'];p.redesign.card.preview.front.src='/assets/projects/new.png';const card=projectCardView(p,'/preview/');assert.equal(card.title,p.title);assert.equal(card.description,p.description);assert.deepEqual(card.categories,p.tags);assert.equal(card.preview.front.fallback,p.redesign.card.preview.front.src);assert.deepEqual(card.preview.front.sources,[]);assert.equal(card.actions.details.href,`/preview/projects/${p.slug}`);assert.equal(card.actions.figma.href,p.materials.figmaUrl);}
 assert.equal(projectImageSource({src:'/assets/projects/corvo/redesign/imgDesktop3.png'}).sources.length,1);
});
test('public detail resolution rejects missing, hidden and unavailable documents',()=>{
 assert.equal(projectDetailDocument(projects,'missing'),undefined);
 for(const baseline of projects){assert.equal(projectDetailDocument(projects,baseline.slug),baseline);for(const changes of [{visibility:'draft'},{visibility:'deleted'},{detailAvailable:false}]){const p={...baseline,...changes};assert.equal(projectDetailDocument([p],p.slug),undefined);}}
});
test('unavailable material link is disabled rather than an inert enabled action',()=>{
 for(const baseline of projects){const p=structuredClone(baseline);p.detailAvailable=false;p.materials.fileState='unavailable';const card=projectCardView(p);assert.equal(card.actions.details.href,undefined);assert.equal(card.actions.figma.href,undefined);const html=render(p);assert.match(html,/<button[^>]*disabled[^>]*>[\s\S]*?Figma/);}
});

test('every editable page text, notice, metric and action has a runtime consumer',()=>{
 let count=0;
 function visit(value,trail=[]){
  if(typeof value==='string')return [trail];
  if(!value||typeof value!=='object')return [];
  return Object.entries(value).flatMap(([key,child])=>visit(child,[...trail,key]));
 }
 for(const baseline of projects){
  for(const trail of visit(baseline.redesign.page)){
   const key=trail.at(-1);
   if(['id','template','templateId','variant','type','style','src','alt','marks'].includes(key)||trail.includes('marks')||trail.includes('image'))continue;
   const p=structuredClone(baseline),parent=trail.slice(0,-1).reduce((value,key)=>value[key],p.redesign.page);
   const token=key==='href'?`https://example.com/edited-${count}`:`ИзмененоПоле${count}`;
   parent[key]=token;assert.ok(render(p).includes(token),`${p.slug}: ${trail.join('.')}`);count++;
  }
 }
 assert.equal(count,83,'Approved page inventory contains 83 editable text/link values');
});

test('actual Sarafan page displays the document raster slides and initial screen',()=>{
 const baseline=projects.find(p=>p.slug==='sarafan-radio');
 for(const count of [3,5,7,9]){const p=structuredClone(baseline),image=p.redesign.hero.slides[0].image;p.redesign.hero.slides=Array.from({length:count},(_,i)=>({id:`fixture-${i}`,title:`Экран ${i}`,image:{...image,src:`/assets/projects/test-${i}.webp`}}));p.redesign.hero.initialSlideId=`fixture-${count-1}`;const html=render(p);assert.match(html,new RegExp(`aria-live="polite">Экран ${count-1}`));assert.ok(html.includes(`src="/assets/projects/test-${count-1}.webp"`));assert.equal((html.match(/data-slot="/g)??[]).length,count===3?5:7);assert.ok(html.includes('Desktop'));assert.ok(html.includes('Tablet'));assert.ok(html.includes('Mobile'));}
});

test('layout page uses supplied source, title and initial scene in an isolated iframe',()=>{
 const p=structuredClone(projects[0]);p.redesign.hero.initialSceneId='statistics';p.redesign.hero.scenes[1].title='Сценарий из документа';p.redesign.hero.scenes[1].source={kind:'url',url:'https://example.com/supplied.html'};
 const html=render(p);assert.ok(html.includes('src="https://example.com/supplied.html"'));assert.ok(html.includes('title="Сценарий из документа — проект"'));assert.ok(html.includes('sandbox="allow-scripts"'));assert.ok(html.includes('referrerPolicy="no-referrer"'));
});
test('one/two/three enabled layout adaptives control actual ruler buttons and slider bounds',()=>{
 for(const enabled of [['desktop'],['mobile','desktop'],['mobile','tablet','desktop']]){
  const p=structuredClone(projects[0]);p.redesign.hero.adaptives.enabled=enabled;const html=render(p);
  for(const [id,label] of [['mobile','Mobile'],['tablet','Tablet'],['desktop','Desktop']]){const button=html.match(new RegExp(`<button[^>]*aria-label="${label} [^"]*"[^>]*>`))?.[0];assert.ok(button,label);assert.equal(button.includes('disabled=""'),!enabled.includes(id),label);}
  assert.ok(html.includes(`aria-valuemin="${enabled.includes('mobile')?360:1280}"`));assert.ok(html.includes('aria-valuemax="1933"'));
 }
});
test('both project templates choose layout/raster from the document independently',()=>{
 const corvo=structuredClone(projects[0]);corvo.redesign.hero=structuredClone(projects[1].redesign.hero);assert.ok(render(corvo).includes('aria-label="Экраны проекта"'));
 const radio=structuredClone(projects[1]);radio.redesign.hero=structuredClone(projects[0].redesign.hero);assert.ok(render(radio).includes('aria-label="Адаптивный экран проекта"'));
});
