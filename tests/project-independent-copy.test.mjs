import assert from 'node:assert/strict';
import test from 'node:test';
import {independentProjectCopy} from '../src/lib/project-copy.ts';
import {validateProjectDocument} from '../src/lib/project-contract.ts';
import {exportApprovedRedesign} from '../tools/concept-v2/export-approved-content.mjs';
const {projects}=await exportApprovedRedesign({repoRoot:process.cwd()});
for(const project of projects) test(`${project.slug}: legacy copy is preserved once and edits remain independent through validation/serialization`,()=>{
 const legacy=structuredClone(project);delete legacy.redesign.page.copyVersion;
 // Approved export is normalized by the validator; reconstruct the legacy Corvo shape.
 if(project.slug==='corvo'&&project.redesign.page.copyVersion===1)legacy.redesign.page.summary.shift();
 const before=structuredClone(legacy);
 const prepared=independentProjectCopy(legacy);
 const expected=project.slug==='corvo'?[[{type:'text',text:legacy.description}],...legacy.redesign.page.summary]:legacy.redesign.page.summary;
 assert.deepEqual(prepared.redesign.page.summary,expected);
 assert.deepEqual(legacy,before);
 assert.equal(prepared.redesign.page.copyVersion,1);
 assert.strictEqual(independentProjectCopy(prepared),prepared);
 prepared.description='Короткая карточка';
 const saved=validateProjectDocument(JSON.parse(JSON.stringify(prepared)));
 assert.deepEqual(saved.redesign.page.summary,expected);
 saved.redesign.page.summary=[[{type:'text',text:'Только страница',marks:['strong']}]];
 const reopened=validateProjectDocument(JSON.parse(JSON.stringify(saved)));
 assert.equal(reopened.description,'Короткая карточка');
 assert.deepEqual(reopened.redesign.page.summary,saved.redesign.page.summary);
 assert.deepEqual(reopened.redesign.hero,project.redesign.hero);
 const invalid=structuredClone(reopened);invalid.redesign.page.copyVersion=2;
 assert.throws(()=>validateProjectDocument(invalid),/copyVersion/);
});
test('ordinary projects have no implicit introduction or new fields',()=>{
 const value={description:'Без редизайна'};assert.strictEqual(independentProjectCopy(value),value);
});
