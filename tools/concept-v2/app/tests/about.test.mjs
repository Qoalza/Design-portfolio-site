import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {ABOUT_CARD_ANIMATION_MS,ABOUT_CARD_FRAME,aboutCardFrame,aboutCardSlots,aboutNextCard} from '../src/about-motion.mjs';

const root=path.resolve(import.meta.dirname,'..');

test('about deck preserves the approved cyclic 500ms direction contract',()=>{
 assert.equal(ABOUT_CARD_ANIMATION_MS,500);
 assert.deepEqual(ABOUT_CARD_FRAME,{width:363,height:420,backWidth:217.5,backHeight:296});
 assert.deepEqual(aboutCardSlots(0),{front:0,left:2,right:1});
 assert.equal(aboutNextCard(2,1),0);
 assert.equal(aboutNextCard(0,-1),2);
});

test('about motion keeps a fixed caption stage and separates the handoff at midpoint',()=>{
 const outgoing=aboutCardFrame({role:'outgoing',direction:1,progress:.5});
 const incoming=aboutCardFrame({role:'incoming',direction:1,progress:.5});
 assert.equal(outgoing.contentScale,outgoing.height/420);
 assert.equal(incoming.contentScale,incoming.height/420);
 assert.ok(outgoing.x+outgoing.width<=incoming.x-4);
});

test('about structure maps the complete Figma block with native patterns and component controls',async()=>{
 const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
 const about=await readFile(path.join(root,'src/About.jsx'),'utf8');
 const css=await readFile(path.join(root,'src/style.css'),'utf8');
 assert.match(app,/import \{About\} from '.\/About'/);
 assert.match(app,/<About\/>/);
 assert.match(about,/data-figma-node="3214:124474"/);
 assert.match(about,/data-figma-node="3215:124481"/);
 assert.match(about,/ControlButton/);
 assert.match(about,/Это я ездил с Урала на Юг\.<br\/>Проехал 2500км за 3 дня\./);
 assert.match(css,/\.about-pattern\{[^}]*inset:0[^}]*radial-gradient\(circle,#232526 0 2px,transparent 2\.5px\)[^}]*background-size:16px 16px/);
 assert.match(css,/\.about-dash-horizontal/);
 assert.match(css,/\.about-card-content\{[^}]*width:363px[^}]*height:420px/);
 assert.match(css,/\.about-card-frame\{[^}]*overflow:hidden/);
});
