import test from 'node:test';
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {featuredProjectCards} from '../src/featured-project-cards.mjs';

test('featured projects are exactly Corvo, B.Off and Sarafan without duplicates or demos',()=>{
 const corvo={id:'corvo',title:'Corvo'},sarafan={id:'sarafan-radio',title:'Сараффан.Радио'};
 const originals=[sarafan,{id:'other'},corvo,{id:'boff',title:'Old B.Off'}];
 const before=structuredClone(originals);
 const cards=featuredProjectCards(originals);
 assert.deepEqual(cards.map(card=>card.id),['corvo','boff','sarafan-radio']);
 assert.equal(cards[0],corvo);assert.equal(cards[2],sarafan);
 assert.equal(cards[1].title,'B.Off');assert.equal(cards[1].logoData,undefined);
 assert.deepEqual(cards[1].categories,['B2B','FinTech','Back Office']);
 assert.equal(cards[1].actions.details.href,'/projects/boff');
 assert.equal(cards[1].actions.figma.href,'https://www.figma.com/design/7f7MEKuvpWgesCNFpoeZpL/B.off---Design-pres?node-id=21-25057&t=0yLhUqKjzPIoovfx-4');
 assert.equal(featuredProjectCards(originals,'/preview/')[1].actions.details.href,'/preview/projects/boff');
 assert.deepEqual(originals,before);
});

test('B.Off front and back resolve to the exact existing local Figma exports',async()=>{
 const {preview}=featuredProjectCards([])[0];
 assert.equal(preview.front.fallback,'/figma/project-boff/account.png');
 assert.equal(preview.back.fallback,'/figma/project-boff/transactions.png');
 for(const source of [preview.front,preview.back])assert.ok((await stat(new URL('../public'+source.fallback,import.meta.url))).size>0);
});
