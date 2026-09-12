import {execFileSync} from "node:child_process";
import {mkdtempSync, realpathSync, readFileSync, readdirSync, writeFileSync, symlinkSync, cpSync, existsSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";

// Standalone snapshot: never reads Admin drafts or canonical project data.
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"../..");
const dependencies=process.argv[2];
if(!dependencies||!path.isAbsolute(dependencies))throw new Error("Pass an absolute path to the prototype node_modules (Vite6.4.2, plugin-react5.0.4, React19.2.0).");
for(const [name,expected] of Object.entries({vite:"6.4.2","@vitejs/plugin-react":"5.0.4",react:"19.2.0","react-dom":"19.2.0"})){
 const installed=JSON.parse(readFileSync(path.join(dependencies,name,"package.json"),"utf8")).version;
 if(installed!==expected)throw new Error(name+" version mismatch: "+installed);
}
const output=path.join(root,"public/concept-v2");
if(existsSync(output))throw new Error("Output already exists; use a fresh checkout to rebuild without overwriting a previous snapshot.");
const stage=realpathSync(mkdtempSync(path.join(tmpdir(),"concept-v2-build-")));
execFileSync("tar",["-xzf",path.join(here,"source.tar.gz"),"-C",stage]);
symlinkSync(dependencies,path.join(stage,"node_modules"),"dir");
const base="/concept-v2/";
for(const name of readdirSync(path.join(stage,"src"))){
 if(!name.endsWith(".jsx"))continue;
 const file=path.join(stage,"src",name);
 const source=readFileSync(file,"utf8");
 writeFileSync(file,source.replace(/(["'`])\/(assets|figma|fonts)\//g,(_,quote,folder)=>quote+base+folder+"/"));
}
const html=path.join(stage,"index.html");
writeFileSync(html,readFileSync(html,"utf8").replace("<head>",'<head><meta name="robots" content="noindex,nofollow"/>'));
execFileSync(process.execPath,[path.join(dependencies,"vite/bin/vite.js"),"build",stage,"--base",base],{cwd:stage,stdio:"inherit"});
cpSync(path.join(stage,"dist"),output,{recursive:true});
const sourceSha="8b39e5e9600e53269d69e373d33d770b6f2ba28a";
writeFileSync(path.join(output,"version.json"),JSON.stringify({
 sourceSha,sourceArchiveSha256:createHash("sha256").update(readFileSync(path.join(here,"source.tar.gz"))).digest("hex")
},null,2)+"\n");
console.log("Built isolated snapshot at "+output);
