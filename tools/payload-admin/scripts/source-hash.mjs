import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const appRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function cmsSourceHash() {
 const hash=createHash('sha256');
 async function walk(dir) {
  for(const entry of (await readdir(path.join(appRoot,dir),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
   const file=path.join(dir,entry.name);
   if(entry.isDirectory())await walk(file);
   else if(entry.isFile()){hash.update(file);hash.update(await readFile(path.join(appRoot,file)));}
   else throw new Error('CMS source cannot contain symlinks');
  }
 }
 for(const dir of ['src','scripts','public','../portfolio-delivery'])await walk(dir);
 for(const file of ['package.json','package-lock.json','next.config.mjs','tsconfig.json','../portfolio-runtime/active-release.mjs','../portfolio-runtime/active-release.d.mts','../portfolio-runtime/code-state.mjs','../portfolio-runtime/code-state.d.mts','../portfolio-runtime/artifact.mjs','../portfolio-runtime/cms-release.mjs','../portfolio-runtime/code-selection.mjs','../portfolio-release/project-snapshot.mjs','../portfolio-release/layout-package-policy.mjs','../../src/lib/project-contract.ts','../../src/lib/project-redesign-contract.ts','../../src/lib/project-visual-registry.ts','../../src/lib/project-image-source.mjs']){hash.update(file);hash.update(await readFile(path.join(appRoot,file)));}
 return hash.digest('hex');
}
