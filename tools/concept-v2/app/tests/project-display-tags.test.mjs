import test from 'node:test';
import assert from 'node:assert/strict';
import * as views from '../src/project-page/project-view-model.mjs';
function project(slug,tags,detailTags=tags){return {slug,title:slug,description:'copy',visibility:'published',detailAvailable:true,designProfile:slug==='corvo'?'corvo-v1':'sarafan-v1',tags,detailTags,materials:{fileState:'unavailable'},redesign:{card:{preview:{back:{src:'/back.png'},front:{src:'/front.png',alt:'Front'}}}}};}
test('live uppercase tags use approved authored display case without mutating published data',()=>{
 const p=project('corvo',['B2B','SAAS','PARTNER PLATFORM']),before=structuredClone(p);
 assert.deepEqual(views.projectCardView(p).categories,['B2B','SaaS','Partner Platform']);
 assert.deepEqual(views.projectDetailDocument([p],'corvo').detailTags,['B2B','SaaS','Partner Platform']);
 assert.deepEqual(p,before);
});
test('Sarafan retains Cyrillic card tag, Latin detail tag and authored Event spelling',()=>{
 const p=project('sarafan-radio',['B2B2С','EVENT'],['B2B2C','EVENT']);
 assert.deepEqual(views.projectCardView(p).categories,['B2B2С','Event']);
 assert.deepEqual(views.projectDetailDocument([p],p.slug).detailTags,['B2B2C','Event']);
});
test('unrelated projects and unrecognised authored labels keep their exact case',()=>{
 const p=project('another-project',['SAAS','MY CAPS','My label']);
 assert.deepEqual(views.projectCardView(p).categories,p.tags);
 assert.deepEqual(views.projectDetailDocument([p],p.slug).detailTags,p.detailTags);
 const known=project('corvo',['B2B','MY CAPS','My label']);
 assert.deepEqual(views.projectCardView(known).categories,known.tags);
});
