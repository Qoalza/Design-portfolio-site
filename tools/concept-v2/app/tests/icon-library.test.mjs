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
  'imgColor.svg':'5362ca8a4dc22275b3063a294de78f96a94a6913eb6cb261956f9a033199096a',
  'imgColor1.svg':'4e7843f21698e5651583de37711804c83a9b0e870c017da7f6f0da21233b5dd3',
  'imgColor2.svg':'7ffa97f99836afde738d052c6c1a488ae3cf928a2880608f08cceca1150c314b',
  'imgColor3.svg':'e580a3d48e66564a7cfaa3ff634f7f1a09533c716e935550578653bc18ceebba',
  'imgColor4.svg':'e77914ec449c3d4ddb653882fa463b09331e6327f955cb298b7733d3832ab21f',
  'imgColor5.svg':'75a90f53b9b118fd8d32ef244c7212cfaf57df1c2196b5e3b2e7d4b5c22cf306',
  'imgColor6.svg':'8ceaffcad66b56648d80ea31491c5c41ab25309873d045e45ff67ae4e09820c1',
  'imgColor7.svg':'9c4dc49149eb8b345dccdc410408d1f8fd832dca7050c8b077bfc0adfc1fd228',
  'about-chevron-left.svg':'02262b07d3d392e29ffb74cadfcce79f889d9516ef1e664d61007da396420771',
  'about-chevron-right.svg':'8ceaffcad66b56648d80ea31491c5c41ab25309873d045e45ff67ae4e09820c1',
  'about-x.svg':'3462ec43b58181d02d549024be45911e8d795d7160c81b125668bd0416cad8fb',
  'about-search-scale.svg':'0796472b7d26d127d9a3bb3ab5a7b7e5943c86c107fd83ff7c089a454bcb0e20',
 };
 for(const [file,hash] of Object.entries(assets)){
  const source=await readFile(figma(file),'utf8');
  assert.doesNotMatch(source,/Light\s*\//,file);
  assert.match(source,/width="24" height="24" viewBox="0 0 24 24"/,`${file} must retain the full icon frame`);
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

test('control icon frames preserve the Medium vector stroke instead of scaling it into the 16px control slot',async()=>{
 const css=await readFile(path.join(root,'src/style.css'),'utf8');
 assert.match(css,/\.icon\{[^}]*mask-size:24px 24px[^}]*-webkit-mask-size:24px 24px/);
 assert.ok(css.lastIndexOf('.icon{mask-size:24px 24px')>css.lastIndexOf('.icon{display:inline-block'), 'the native vector canvas must win the CSS cascade');
});
