import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {transformWithEsbuild} from 'vite';

const source=await readFile(new URL('../src/HeroFacts.jsx',import.meta.url),'utf8');
const {code}=await transformWithEsbuild(source.replace("import './hero-facts.css';",'').replace("import factDot from './figma/hero-fact-dot.svg';",'const factDot="data:image/svg+xml,test-dot";').replace("from './process-fill.mjs'","from '../src/process-fill.mjs'"),'HeroFacts.jsx',{loader:'jsx',jsx:'automatic',format:'cjs'});
const module={exports:{}};
new Function('module','exports','require',code)(module,module.exports,createRequire(import.meta.url));
const {HeroFacts}=module.exports;

test('Hero facts expose three facts and one real external Dribbble link',()=>{
 const html=renderToStaticMarkup(createElement(HeroFacts));
 assert.match(html,/<span>29 лет<\/span>/);
 assert.match(html,/<span>Екатеринбург<\/span>/);
 assert.match(html,/<span>Middle\+ \/ Senior<\/span>/);
 assert.equal((html.match(/class="hero-fact-dot"/g)||[]).length,2);
 assert.equal((html.match(/<a /g)||[]).length,1);
 assert.match(html,/href="https:\/\/dribbble.com\/art-des" target="_blank" rel="noopener noreferrer"/);
 assert.match(html,/class="hero-dribbble-fill" aria-hidden="true"/);
 assert.doesNotMatch(html,/<button|disabled|tabindex="-1"/);
});

test('custom Hero assets retain the exact authored icon and dot frame sizes',async()=>{
 for(const [file,width,height] of [['hero-dribbble-icon.svg',16,16],['hero-dribbble-glow-hover.svg',16,16],['hero-fact-dot.svg',4,4]]){
  const svg=await readFile(new URL('../src/figma/'+file,import.meta.url),'utf8');
  assert.equal(svg,await readFile(new URL('../public/figma/'+file,import.meta.url),'utf8'));
  assert.match(svg,new RegExp('<svg[^>]*width="'+width+'"[^>]*height="'+height+'"'));
 }
});
