import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {build} from 'esbuild';

const root=path.resolve(import.meta.dirname,'..');
test('optional project logo renders absent, image and layered states without losing existing markup',async()=>{
 const temporary=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-test-logo-render-'));
 try{
  const outfile=path.join(temporary,'render.cjs');
  await build({absWorkingDir:root,stdin:{contents:`import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {RadioProjectSymbol} from './src/project-page/ProjectContent.jsx';
import {ProjectIntro,SiteHeader} from './src/project-page/CorvoProjectPage.jsx';
import {ProjectCard} from './src/App.jsx';
export function renderLogo(logo){return renderToStaticMarkup(createElement(RadioProjectSymbol,{logo,size:16}));}
export function renderCorvo(logo){const project={title:'Corvo without required logo',subtitle:'Fixture',detailTags:[],materials:{projectState:'completed',fileState:'absent'},logo};return renderToStaticMarkup(createElement(ProjectIntro,{project}))+renderToStaticMarkup(createElement(SiteHeader,{project}));}
export function renderCard(logoData){const project={id:'test',title:'Catalog without required logo',description:'Fixture',categories:[],logo:'corvo',logoData,preview:{ariaLabel:'Fixture',back:{src:'/back.png',sources:[]},front:{src:'/front.png',sources:[]},frontAlt:'Fixture'},actions:{details:{},figma:{}}};return renderToStaticMarkup(createElement(ProjectCard,{project}));}`,
   resolveDir:root,loader:'jsx'},outfile,bundle:true,platform:'node',format:'cjs',jsx:'automatic',
   loader:{'.css':'empty'},define:{'import.meta.env.BASE_URL':'"/"'},
   plugins:[{name:'test-private-consumers',setup(builder){
    builder.onLoad({filter:/\.css$/},()=>({contents:'export default {};',loader:'js'}));
    builder.onLoad({filter:/\/(?:App|CorvoProjectPage)\.jsx$/},async args=>({contents:await readFile(args.path,'utf8')+(args.path.endsWith('/App.jsx')?'\nexport {ProjectCard};':'\nexport {SiteHeader,ProjectIntro};'),loader:'jsx'}));
    builder.onResolve({filter:/\.svg\?raw$/},args=>({path:path.resolve(path.dirname(args.importer),args.path.slice(0,-4)),namespace:'test-svg'}));
    builder.onLoad({filter:/.*/,namespace:'test-svg'},async args=>({contents:await readFile(args.path,'utf8'),loader:'text'}));
   }}]});
  // Compile actual components and imports; expose private consumers only in this temporary test bundle.
  const {renderLogo,renderCorvo,renderCard}=createRequire(import.meta.url)(outfile);
  assert.equal(renderLogo(undefined),'');
  assert.match(renderCorvo(undefined),/<h1>Corvo without required logo<\/h1>/);
  assert.match(renderCard(undefined),/<h3>Catalog without required logo<\/h3>/);
  assert.match(renderCorvo({type:'image',src:'/corvo-logo.png'}),/src="\/corvo-logo.png" width="44" height="44"/);
  assert.match(renderCard({type:'image',src:'/corvo-logo.png'}),/src="\/corvo-logo.png" width="28" height="28"/);
  const image=renderLogo({type:'image',src:'/assets/projects/test/logo.png'});
  assert.match(image,/<img[^>]+src="\/assets\/projects\/test\/logo.png"[^>]+width="16"[^>]+height="16"[^>]+alt=""/);
  const layered=renderLogo({type:'layered',layers:[{slot:'a',src:'/assets/projects/test/radio-logo-a.svg'},{slot:'d',src:'/assets/projects/test/radio-logo-d.svg'}]});
  assert.match(layered,/class="radio-symbol"[^>]+aria-hidden="true"/);
  assert.match(layered,/radio-logo-mask-a\.svg/);
  assert.doesNotMatch(layered,/radio-logo-mask-d\.svg/);
  assert.match(layered,/class="radio-logo-d"/);
 }finally{await rm(temporary,{recursive:true,force:true});}
});
