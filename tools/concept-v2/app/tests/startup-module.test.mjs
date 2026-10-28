import test from 'node:test';
import assert from 'node:assert/strict';
import {startupManualChunks,assertStartupIsolation,startupModulePlugin} from '../startup-module-vite.mjs';
import {earlyPreloaderPlugin} from '../early-preloader-vite.mjs';

test('built retry entry owns its full eager graph without pulling lazy work into startup',()=>{
 const graph=new Map([
 ['/src/main.jsx',{importedIds:['/src/App.jsx','/src/style.css'],dynamicallyImportedIds:['/lazy-player.js']}],
 ['/src/App.jsx',{importedIds:['/react.js']}],['/react.js',{importedIds:[]}],['/src/style.css',{importedIds:[]}],['/lazy-player.js',{importedIds:[]}],
 ]);
 const api={getModuleIds:()=>graph.keys(),getModuleInfo:id=>graph.get(id)};
 for(const id of ['/src/main.jsx','/src/App.jsx','/react.js'])assert.equal(startupManualChunks(id,api),'application-startup');
 assert.equal(startupManualChunks('/lazy-player.js',api),undefined);
});
test('dev HTML retains Vite client but imports the real application through the shell',async()=>{
 const input='<html lang="ru"><head><script type="module" src="/@vite/client"></script></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>';
 const html=await earlyPreloaderPlugin().transformIndexHtml.handler(input);
 assert.match(html,/<script type="module" src="\/@vite\/client"><\/script>/);
 assert.match(html,/name="portfolio-app-entry" content="\/src\/main.jsx"/);
 assert.doesNotMatch(html,/<script type="module" src="\/src\/main.jsx"/);
});
test('built HTML uses the eager startup chunk itself, never a facade with cached dependencies',async()=>{
 const input='<html lang="ru"><head></head><body><div id="root"></div><script type="module" src="/portfolio/assets/index.js"></script></body></html>';
 const bundle={startup:{type:'chunk',name:'application-startup',fileName:'assets/application-startup.js',exports:['mountApplication']},facade:{type:'chunk',name:'main',fileName:'assets/main.js',exports:['mountApplication'],imports:['assets/application-startup.js']}};
 const html=await earlyPreloaderPlugin().transformIndexHtml.handler(input,{bundle});
 assert.match(html,/name="portfolio-app-entry" content="\/portfolio\/assets\/application-startup.js"/);
 await assert.rejects(earlyPreloaderPlugin().transformIndexHtml.handler(input,{bundle:{}}),/startup chunk missing/);
});

test('build rejects a lazy player that depends on the original possibly-failed startup identity',()=>{
 const startup={type:'chunk',fileName:'startup.js',modules:{'/src/main.jsx':{}},imports:[]};
 const player={type:'chunk',fileName:'player.js',modules:{'/node_modules/lottie-web/player.js':{}},imports:['startup.js']};
 assert.throws(()=>assertStartupIsolation({startup,player}),/Lazy player/);
 assert.doesNotThrow(()=>assertStartupIsolation({startup,player:{...player,imports:[]}}));
});

test('startup output policy survives host callers replacing the top-level build options',()=>{
 const policy=startupModulePlugin().config();
 assert.equal(policy.build.rollupOptions.output.manualChunks,startupManualChunks);
 assert.equal(policy.build.rollupOptions.output.minifyInternalExports,false);
});
