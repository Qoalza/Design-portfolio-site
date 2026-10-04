import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

/** Check the real Next routing boundary, including its reserved /404 address. */
export async function verifyRuntime({origin,sha}) {
 assert.match(sha,/^[a-f0-9]{40}$/);
 const routes=[['/',200,'Артур — Product Designer'],['/projects/corvo',200,'Corvo — Product Designer'],['/projects/sarafan-radio',200,'Сараффан.Радио — Product Designer'],...['/404','/unknown-release-check','/projects/old','/concept-v2','/navigation-lab','/admin'].map(route=>[route,404,'Страница не найдена — Product Designer'])];
 const results=[];
 for(const [route,status,title] of routes){
  const response=await fetch(new URL(route,origin),{redirect:'manual'});
  const html=await response.text();
  assert.equal(response.status,status,route);
  assert.ok(html.includes(`<title>${title}</title>`),`${route}: release title`);
  assert.ok(html.includes(`data-build-sha="${sha}"`),`${route}: exact release SHA`);
  assert.doesNotMatch(html,/This page could not be found|localhost:|127\.0\.0\.1:/);
  if(status===404){assert.equal(response.headers.get('x-robots-tag'),'noindex');assert.match(html,/<meta name="robots" content="noindex"/);}
  const head=await fetch(new URL(route,origin),{method:'HEAD',redirect:'manual'});
  assert.equal(head.status,status,`${route}: HEAD`);assert.equal(await head.text(),'');
  results.push({route,status});
 }
 const redirect=await fetch(new URL('/projects',origin),{redirect:'manual'});
 assert.equal(redirect.status,307);assert.equal(redirect.headers.get('location'),'/#projects');
 return {sha,routes:results,projectsRedirect:'/#projects'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 console.log(JSON.stringify(await verifyRuntime({origin:process.argv[2],sha:process.argv[3]}),null,2));
}
