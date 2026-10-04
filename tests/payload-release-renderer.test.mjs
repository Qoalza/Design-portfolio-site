import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {build} from 'esbuild';
import {readSnapshotDirectory} from '../tools/portfolio-release/snapshot-directory.mjs';
import {projectCardView} from '../tools/concept-v2/app/src/project-page/project-view-model.mjs';
const source=process.env.PORTFOLIO_PROJECT_SNAPSHOT;
if(!source)throw new Error('Run via the disposable Payload release proof; a real exported snapshot is required.');
const prepared=await readSnapshotDirectory(source),repoRoot=fileURLToPath(new URL('..',import.meta.url)),appRoot=path.join(repoRoot,'tools/concept-v2/app');
const temp=await mkdtemp(path.join(tmpdir(),'payload-release-render-'));
try{
 const file=path.join(temp,'render.cjs');
 await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {CorvoProjectPage} from './src/project-page/CorvoProjectPage.jsx';import {SarafanProjectPage} from './src/project-page/SarafanProjectPage.jsx';export function render(p){return renderToStaticMarkup(React.createElement(p.slug==='corvo'?CorvoProjectPage:SarafanProjectPage,{project:p}));}`,resolveDir:appRoot,loader:'jsx'},bundle:true,jsx:'automatic',loader:{'.svg':'text'},platform:'node',format:'cjs',outfile:file,define:{'import.meta.env.BASE_URL':'"/"'},plugins:[{name:'css-proof',setup(b){b.onLoad({filter:/\.css$/},()=>({contents:'export default new Proxy({}, {get:(_,key)=>key});',loader:'js'}));}}]});
 const {render}=createRequire(import.meta.url)(file);
 const radio=prepared.projects.find(p=>p.slug==='sarafan-radio'),corvo=prepared.projects.find(p=>p.slug==='corvo');
 const radioHtml=render(radio),corvoHtml=render(corvo);
 for(const text of ['Payload proof title','https://example.com/payload-proof','Payload proof initial screen','/assets/projects/sarafan-radio/redesign/payload-proof.png'])assert.ok(radioHtml.includes(text),text);
 assert.equal(projectCardView(radio).description,'Payload proof description');
 assert.ok(corvoHtml.includes('Payload proof layout source — проект'));
 assert.ok(corvoHtml.includes('/authorization/index.html'));
 assert.ok(corvoHtml.includes('sandbox="allow-scripts"'));
 const mobile=corvoHtml.match(/<button[^>]*aria-label="Mobile [^"]*"[^>]*>/)?.[0];assert.ok(mobile?.includes('disabled=""'));
 assert.ok(!radioHtml.includes('Draft must not publish'));
 console.log('PASS: unchanged actual renderer displays native Payload content/image/raster order/layout metadata after CMS shutdown');
}finally{await rm(temp,{recursive:true,force:true});}
