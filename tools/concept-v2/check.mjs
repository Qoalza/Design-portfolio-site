import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../public/concept-v2");
const base=process.argv[2]||"http://127.0.0.1:4191";
function files(dir){
 return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const file=path.join(dir,entry.name);
  return entry.isDirectory()?files(file):[file];
 });
}
for(const suffix of ["/concept-v2","/concept-v2/","/concept-v2/index.html"]){
 const response=await fetch(new URL(suffix,base));
 assert.equal(response.status,200,suffix);
 assert.match(response.headers.get("x-robots-tag")||"",/noindex/);
 const html=await response.text();
 assert.match(html,/<meta name="robots" content="noindex,nofollow"/);
 assert.ok(html.includes("/concept-v2/assets/"));
 assert.ok(!html.includes("/_next/"),"Prototype must not inherit the main layout");
}
for(const file of files(root)){
 const url=new URL("/concept-v2/"+path.relative(root,file).split(path.sep).join("/"),base);
 const response=await fetch(url);
 assert.equal(response.status,200,url.pathname);
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),readFileSync(file),url.pathname);
}
for(const suffix of ["/","/projects","/projects/corvo"]){
 const response=await fetch(new URL(suffix,base));
 assert.equal(response.status,200,suffix);
 assert.ok(!(response.headers.get("x-robots-tag")||"").includes("noindex"),"Do not deindex "+suffix);
 const html=await response.text();
 assert.ok(!html.includes("/concept-v2/"),"Prototype must not appear in existing pages");
}
console.log("PASS: route variants, noindex isolation, all snapshot bytes, main/project pages.");
