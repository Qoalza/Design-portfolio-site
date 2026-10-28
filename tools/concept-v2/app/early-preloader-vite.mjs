import {INITIAL_MESSAGES} from './src/preloader-copy.mjs';
import {preloaderMorphMarkup} from './src/preloader-morph-markup.mjs';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {preloaderSymbolMarkup} from './src/preloader-symbol.mjs';

export function earlyPreloaderPlugin(){
 return {name:'early-html-preloader',transformIndexHtml:{order:'post',async handler(html,context){
  const result=await build({stdin:{contents:"import {startEarlyPreloader} from './src/early-preloader.mjs';startEarlyPreloader();",resolveDir:import.meta.dirname},bundle:true,write:false,format:'iife',minify:true,target:'es2020'});
  const css=await readFile(new URL('./src/preloader.css',import.meta.url),'utf8');
  const appCss=await readFile(new URL('./src/style.css',import.meta.url),'utf8');
  // Reuse the approved control rules and tokens, scoped to the native shell.
  const rules=[...appCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const variables=rules.find(([,selector])=>selector.trim()===':root')[2].split(';').filter(value=>value.startsWith('--')).join(';');
  const controls=rules.filter(([,selector])=>['.control,.nav-tab','.control','.control-label','.control.accent','.control.accent:hover','.control.accent:active'].includes(selector.trim())).map(([,selector,body])=>`${selector.trim().split(',').filter(value=>value!=='.nav-tab').map(value=>`#early-preloader ${value}`).join(',')}{${body}}`).join('');
  const refresh=(await readFile(new URL('./public/figma/preloader-refresh.svg',import.meta.url),'utf8')).replace(/id="[^"]*"/g,'').replace('stroke="#E2E2EC"','stroke="currentColor" vector-effect="non-scaling-stroke"');
  const critical=`html,body{margin:0;background:#17191a}html[data-early-loading]{overflow:hidden}#early-preloader{${variables};color:#99a1a6;font-family:Onest,system-ui,sans-serif}#early-preloader [hidden]{display:none!important}#early-preloader h1,#early-preloader p{margin:0}#early-preloader .control{box-sizing:border-box}#early-preloader .control-label{padding:0 4px}#early-preloader .icon{position:relative;display:inline-grid;place-items:center;flex-shrink:0;width:16px;height:16px;background:none;mask:none!important;-webkit-mask:none!important}#early-preloader .icon>svg{position:absolute;inset:0;display:block;width:100%!important;height:100%!important;overflow:visible}#early-preloader .control:focus-visible{outline:2px solid #43a2ee;outline-offset:4px}${controls}`;
  const shell=`<main id="early-preloader" class="preloader-page is-overlay" data-state="normal" aria-label="Прелоадер"><div class="preloader-content"><div class="preloader-symbol-slot"><svg class="preloader-symbol" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${preloaderSymbolMarkup}</svg>${preloaderMorphMarkup}</div><p class="preloader-caption" role="status"><span class="preloader-caption-content is-incoming">${INITIAL_MESSAGES[0]}</span></p><div class="preloader-status" hidden><div class="preloader-status-copy"><h1></h1><p></p></div><button type="button" class="control accent"><span class="control-label">Повторить</span><span class="icon" data-icon="preloader-refresh" aria-hidden="true">${refresh}</span></button></div></div></main>`;
  const entry=[...html.matchAll(/<script\b[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)].find(match=>!match[1].includes('/@vite/client'));
  if(!entry)throw new Error('Application module entry missing');
  const startup=Object.values(context?.bundle??{}).find(item=>item.type==='chunk'&&item.exports.includes('mountApplication')&&(item.imports??[]).length===0);
  if(context?.bundle&&!startup)throw new Error('Retriable startup chunk missing');
  const entryUrl=startup?entry[1].replace(/[^/]+$/,startup.fileName.split('/').at(-1)):entry[1];
  html=html.replace(entry[0],'').replace(/<link[^>]*rel="modulepreload"[^>]*>/g,'').replace('</head>',`<meta name="portfolio-app-entry" content="${entryUrl}"></head>`);
  // Inline before external module loading, also in the release and private preview builds.
  return html.replace(/<link([^>]*rel="stylesheet"[^>]*)>/g,'<link$1 data-app-style media="print" onload="this.media=\'all\'">').replace('<html lang="ru">','<html lang="ru" data-early-loading>')
   .replace('</head>',`<style>${critical}\n${css}</style></head>`)
   .replace('<body>',`<body>${shell}<script>${result.outputFiles[0].text.replaceAll('</script','<\\/script')}</script>`);
 }}};
}
