import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {transformWithEsbuild} from 'vite';

const root=path.resolve(import.meta.dirname,'..');
const source=path.join(root,'src');

async function filesIn(directory){
  const entries=await readdir(directory,{withFileTypes:true});
  const nested=await Promise.all(entries.map(entry=>entry.isDirectory()?filesIn(path.join(directory,entry.name)):[path.join(directory,entry.name)]));
  return nested.flat();
}

const files=(await filesIn(source)).filter(file=>/\.(?:jsx?|mjs|css)$/.test(file));
const failures=[];
for(const file of files){
  const code=await readFile(file,'utf8');
  const relative=path.relative(root,file);
  if(/[ \t]+$/m.test(code))failures.push(`${relative}: trailing whitespace`);
  if(file.endsWith('.css'))continue;
  try{await transformWithEsbuild(code,relative,{loader:file.endsWith('.jsx')?'jsx':'js',jsx:'automatic'});}
  catch(error){failures.push(`${relative}: ${error.message}`);}
}
if(failures.length)throw new Error(failures.join('\n'));
console.log(`Checked ${files.length} source files.`);
