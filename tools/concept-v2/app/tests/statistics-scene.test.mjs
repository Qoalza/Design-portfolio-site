import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root=new URL('../',import.meta.url);
const source=(path)=>readFile(new URL(path,root),'utf8');

const expectedHeaders=[
 'Affiliate &amp; ID','Clicks','Unique Clicks','Registrations','FTD Count','Reg to FTD','Click to Reg','Click to FTD',
 'Repeat Deposits (count)','Repeat Deposits (users)','Repeat Deposits (sum $)','Deposits Sum','Withdrawal Amount ($)',
 'Turnover','GGR','Revshare','CPA','Fixed payment',
];

test('Corvo Statistics includes every Figma table column in the approved order',async()=>{
 const html=await source('public/responsive-scenes/corvo-v1/statistics/index.html');
 const headerRow=/<thead><tr>([\s\S]*?)<\/tr><\/thead>/.exec(html)?.[1]??'';
 const headers=[...headerRow.matchAll(/<th>(.*?)<\/th>/g)].map((match)=>match[1]);
 const bodyRows=[...html.matchAll(/<tr><td>[\s\S]*?<\/tr>/g)];
 assert.deepEqual(headers,expectedHeaders);
 assert.equal((/<colgroup>([\s\S]*?)<\/colgroup>/.exec(html)?.[1].match(/<col\b/g)??[]).length,expectedHeaders.length);
 for(const row of bodyRows) assert.equal((row[0].match(/<td\b/g)??[]).length,expectedHeaders.length);
});

test('Corvo Statistics preserves the Figma fixed column widths at every adaptive',async()=>{
 const css=await source('public/responsive-scenes/corvo-v1/statistics/style.css');
 for(const [column,desktop,tablet,mobile] of [
  ['repeat-users',196,173,140],['repeat-sum',201,177,143],['deposits-sum',156,132,106],
  ['withdrawal',196,170,138],['turnover',180,156,136],['ggr',160,136,116],['revshare',106,94,74],
  ['cpa',180,156,136],['fixed-payment',160,136,116],
 ]){
  assert.match(css,new RegExp(`\\.statistics \\.col-${column} \\{ width: ${desktop}px; \\}`));
  assert.match(css,new RegExp(`@media \\(min-width: 600px\\)[\\s\\S]*?\\.statistics \\.col-${column} \\{ width: ${tablet}px; \\}`));
  assert.match(css,new RegExp(`@media \\(max-width: 599px\\)[\\s\\S]*?\\.statistics \\.col-${column} \\{ width: ${mobile}px; \\}`));
 }
});
