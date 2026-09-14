import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const figma=file=>path.join(root,'public/figma',file);
const asset=file=>path.join(root,'public/assets',file);

test('interactive controls use exported Medium icon assets',async()=>{
 const assets={
  'imgColor.svg':'1461328da805aa818561dc066a36d95908f555c68c181156f6bcd7c77079000f',
  'imgColor1.svg':'089041daba456838c4feabab9b9409ee48215acbd11afdf2a94cf5f1cbedd46f',
  'imgColor2.svg':'52044d1cea0e6456afd67cfcb7f7664bf5a9b8e13087f9bd081bb6c121083314',
  'imgColor3.svg':'b1625cfe2d73b6ba428c087580ce6e8838e747243bc45752e3a05c6bae8a2477',
  'imgColor4.svg':'6194bfaf0478e6ba34b673466d125aa3626396071ba0280a3632564b1329a7f9',
  'imgColor6.svg':'231c44b9a42ec4a3507fb7abb3833a316f17563fe9e34563e7c50f708081706d',
  'imgColor7.svg':'7caf4758b0cad3c6dadb113cc381aa99bec5bb91368129cc7fd93eac7baefedf',
  'about-chevron-left.svg':'bdd2dbbfa86114c014358c93307a52ace51a2ebe5ea402210529d1d20032d15f',
  'about-chevron-right.svg':'231c44b9a42ec4a3507fb7abb3833a316f17563fe9e34563e7c50f708081706d',
  'about-x.svg':'7080405365a338637c8d85e90402a273d64db7b7c6b51fc6f3b6e4042012b415',
  'about-search-scale.svg':'17be1be89022b8768ea1e71df5bb9d71c1a875ee240554d15723f9fcc063189a',
 };
 for(const [file,hash] of Object.entries(assets)){
  const source=await readFile(figma(file),'utf8');
  assert.doesNotMatch(source,/Light\s*\//,file);
  assert.equal(createHash('sha256').update(source).digest('hex'),hash,file);
 }
 const app=await readFile(path.join(root,'src/App.jsx'),'utf8');
 const about=await readFile(path.join(root,'src/About.jsx'),'utf8');
 assert.match(app,/icon="imgColor"/);
 assert.match(app,/iconRight="imgColor2"/);
 assert.match(app,/iconRight="imgColor3"/);
 assert.match(app,/iconRight="imgColor6"/);
 assert.match(app,/iconRight="imgColor7"/);
 assert.match(about,/iconRight="about-x"/);
 assert.match(about,/name="about-search-scale"/);
});

test('all changing Hero caption glyphs render at the Medium 1.3px line weight',async()=>{
 for(const file of ['document.svg','analytics.svg','flow.svg','design.svg','code.svg','check.svg','launch.svg']){
  const source=await readFile(asset(file),'utf8');
  assert.match(source,/stroke-width="1\.3"/,file);
 }
});
