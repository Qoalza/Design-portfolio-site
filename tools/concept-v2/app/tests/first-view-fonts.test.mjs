import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshFailedFontSources} from '../src/first-view-fonts.mjs';
function fixture(){
 const rules=['Onest','Google Sans','Source Code Pro'].map(family=>{const values={'font-family':`"${family}"`,src:`url('/fonts/${family.replaceAll(' ','-')}.woff2') format('woff2')`};return {style:{getPropertyValue:key=>values[key]??'',setProperty:(key,value)=>{values[key]=value;}}};});
 return {rules,document:{fonts:{forEach:callback=>[{family:'Onest',status:'error'},{family:'Google Sans',status:'loaded'},{family:'Source Code Pro',status:'error'}].forEach(callback)},styleSheets:[{get cssRules(){throw new Error('cross-origin');}},{cssRules:rules}]}};
}
test('retry renews only failed critical font sources, preserving CSS descriptors',()=>{
 const {document,rules}=fixture();const original=rules.map(rule=>rule.style.getPropertyValue('src'));
 assert.equal(refreshFailedFontSources(document,'https://art-des.ru/'),1);
 const source=rules[0].style.getPropertyValue('src');assert.match(source,/https:\/\/art-des.ru\/fonts\/Onest.woff2\?preloader-retry=\d+/);assert.match(source,/format\('woff2'\)/);
 assert.equal(rules[1].style.getPropertyValue('src'),original[1]);assert.equal(rules[2].style.getPropertyValue('src'),original[2]);
 refreshFailedFontSources(document,'https://art-des.ru/');assert.notEqual(rules[0].style.getPropertyValue('src'),source);
});
test('successful font set stays unchanged on retry',()=>{
 const {document,rules}=fixture();document.fonts.forEach=callback=>callback({family:'Onest',status:'loaded'});const sources=rules.map(rule=>rule.style.getPropertyValue('src'));assert.equal(refreshFailedFontSources(document,'https://art-des.ru/'),0);assert.deepEqual(rules.map(rule=>rule.style.getPropertyValue('src')),sources);
});
