import assert from 'node:assert/strict';
import test from 'node:test';
import {createLayoutGeometry,layoutHeroDefinition} from '../src/project-hero/layout-document-adapter.mjs';
import * as width from '../src/project-hero/width.mjs';
import {getMagneticPreset} from '../src/project-hero/motion.mjs';
import {corvoResponsiveHero} from '../src/project-hero/definition.mjs';
const ranges=[{id:'mobile',minWidth:360,maxWidth:600,presetWidth:595.256245,height:640},{id:'tablet',minWidth:600,maxWidth:1280,presetWidth:1279,height:1100},{id:'desktop',minWidth:1280,maxWidth:1160/.6,presetWidth:1599,height:960}];
const hero=(enabled=['mobile','tablet','desktop'])=>({kind:'layout',chromeProfile:'layout-four-scenes-v1',initialSceneId:'statistics',adaptives:{enabled},scenes:corvoResponsiveHero.scenes.map(s=>({id:s.id,title:s.label,source:{kind:'url',url:`https://example.com/${s.id}`},adaptives:structuredClone(ranges)}))});
test('current Corvo geometry, preset and magnetic outputs remain exact across fractional widths',()=>{
 const adapter=createLayoutGeometry(hero()),scene='statistics';
 for(let display=216;display<=1160;display+=.125){const logical=width.getLogicalWidth(display),g=adapter.resolveGeometry(scene,logical);assert.ok(Math.abs(g.displayWidth-display)<1e-9);assert.equal(g.logicalWidth,logical);assert.equal(g.iframeWidth,width.getIframeLogicalWidth(display));assert.equal(g.productHeight,width.getProductHeightForDisplayWidth(display));assert.equal(g.iframeHeight,width.getIframeLogicalHeight(display));assert.equal(g.range,width.getAdaptiveRange(logical));assert.equal(adapter.exactPreset(scene,display),width.getExactAdaptivePreset(display));assert.equal(adapter.magneticPreset(scene,display),getMagneticPreset(display));}
 for(const [id,preset] of Object.entries(width.ADAPTIVE_PRESETS))assert.deepEqual(adapter.resolvePreset(scene,id),preset);
});
test('one/two/three enabled adaptives control targets and presets without inventing versions',()=>{
 for(const enabled of [['desktop'],['mobile','desktop'],['mobile','tablet','desktop']]){const a=createLayoutGeometry(hero(enabled));assert.deepEqual(a.getEnabledPresets('statistics'),['min',...enabled,'max']);for(const id of ['mobile','tablet','desktop'])assert.equal(a.resolvePreset('statistics',id)===null,!enabled.includes(id));}
 const a=createLayoutGeometry(hero(['desktop']));assert.equal(a.constrainTarget('statistics',360),1280);assert.equal(a.resolvePreset('statistics','min').logicalWidth,1280);assert.equal(a.resolveGeometry('statistics',360).productHeight,576);
});
test('gap tie follows previous allowed side; scene metadata owns height and target',()=>{
 const h=hero(['mobile','desktop']);h.scenes[1].adaptives[2]={id:'desktop',minWidth:1400,maxWidth:1800,presetWidth:1500,height:1200};const a=createLayoutGeometry(h);assert.equal(a.constrainTarget('statistics',999.5,500),599);assert.equal(a.constrainTarget('statistics',999.5,1600),1400);assert.equal(a.resolveGeometry('statistics',1500).productHeight,720);assert.equal(a.resolveGeometry('media-campaigns',1500).productHeight,576);assert.equal(a.resolvePreset('statistics','max').logicalWidth,1799);
});
test('touching adaptive boundary follows actual integer iframe viewport height',()=>{
 const a=createLayoutGeometry(hero());assert.equal(a.resolveGeometry('statistics',599).productHeight,384);assert.equal(a.resolveGeometry('statistics',599.25).productHeight,660);assert.equal(a.resolveGeometry('statistics',1279.25).productHeight,576);
});
test('definition takes supplied URLs/package entries/titles; chrome stays in fixed registry',()=>{
 const h=hero();h.scenes[0].title='Новый сценарий';h.scenes[1].source={kind:'package',assetBase:'/assets/projects/test/hero-layout/hash/',entry:'statistics/index.html'};const d=layoutHeroDefinition({redesign:{hero:h}});assert.equal(d.initialSceneId,'statistics');assert.equal(d.scenes[0].label,'Новый сценарий');assert.equal(d.scenes[0].src,'https://example.com/media-campaigns');assert.equal(d.scenes[1].src,'/assets/projects/test/hero-layout/hash/statistics/index.html');for(let i=0;i<4;i++){assert.equal(d.scenes[i].icon,corvoResponsiveHero.scenes[i].icon);assert.equal(d.scenes[i].tabWidth,corvoResponsiveHero.scenes[i].tabWidth);}assert.equal(d.chromeAssetRoot,corvoResponsiveHero.chromeAssetRoot);
});

test('disabled successor cannot be entered by fractional iframe overscan',()=>{
 for(const id of ['mobile','tablet']){const a=createLayoutGeometry(hero([id])),r=ranges.find(r=>r.id===id),g=a.resolveGeometry('statistics',r.maxWidth-.25);assert.equal(g.iframeWidth,r.maxWidth-1);assert.equal(a.resolvePreset('statistics','max').logicalWidth,r.maxWidth-1);assert.equal(g.productHeight,r.height*.6);}
});

test('geometry construction explicitly rejects a range without an integer iframe viewport',()=>{
 for(const [minWidth,maxWidth,presetWidth] of [[600.25,600.75,600.5],[600,600,600]]){const h=hero(['tablet']);for(const scene of h.scenes)scene.adaptives[1]={id:'tablet',minWidth,maxWidth,presetWidth,height:640};assert.throws(()=>createLayoutGeometry(h),/integer iframe/);}
});
