import path from 'node:path';

// Fresh identities recover cached evaluation failures. Lazy imports stay lazy.
export function startupModulePlugin({release=false}={}){
 let building=false;
 const source=path.resolve(import.meta.dirname,'src')+'/',entry=source+(release?'main-release.jsx':'main.jsx');
 return {name:'retriable-application-entry',enforce:'post',
  config(){return {build:{rollupOptions:{output:{manualChunks:startupManualChunks,minifyInternalExports:false}}}};},
  configResolved(config){building=config.command==='build';},
  buildStart(){if(building)this.emitFile({type:'chunk',id:entry,preserveSignature:'strict'});},
  resolveId(id){if(id==='\0lazy-player-helpers')return id;},
  generateBundle(_options,bundle){assertStartupIsolation(bundle);},
  async load(id){
   if(id==='\0lazy-player-helpers'){
    const helpers=await this.load({id:'\0commonjsHelpers.js'});
    return helpers.code;
   }
  },
  async transform(code,id){
   if(building&&id.includes('/lottie-web/')){
    const ast=this.parse(code),edits=ast.body.filter(statement=>statement.type==='ImportDeclaration'&&statement.source.value==='\0commonjsHelpers.js');
    for(const statement of edits.reverse())code=code.slice(0,statement.source.start)+JSON.stringify('\0lazy-player-helpers')+code.slice(statement.source.end);
    if(edits.length)return {code,map:null};
   }
   const attempt=new URLSearchParams(id.split('?')[1]).get('preloader-attempt');
   if(!attempt||!id.startsWith(source)||!/[.](mjs|jsx|js)(?:\?|$)/.test(id))return;
   const ast=this.parse(code),edits=[];
   for(const statement of ast.body){
    if(!['ImportDeclaration','ExportNamedDeclaration','ExportAllDeclaration'].includes(statement.type)||!statement.source)continue;
    const specifier=statement.source.value;
    if(!specifier.startsWith('.'))continue;
    const resolved=await this.resolve(specifier,id,{skipSelf:true});
    if(!resolved||!resolved.id.startsWith(source)||!/[.](mjs|jsx|js|css)(?:\?|$)/.test(resolved.id))continue;
    edits.push({start:statement.source.start,end:statement.source.end,value:JSON.stringify(specifier+(specifier.includes('?')?'&':'?')+'preloader-attempt='+attempt)});
   }
   for(const edit of edits.reverse())code=code.slice(0,edit.start)+edit.value+code.slice(edit.end);
   return edits.length?{code,map:null}:null;
  },
 };
}

export function startupManualChunks(id,{getModuleInfo,getModuleIds}){
 const entries=[...getModuleIds()].filter(module=>/\/src\/main(?:-release)?\.jsx$/.test(module));
 const visited=new Set();
 const visit=module=>{if(visited.has(module))return;visited.add(module);for(const dependency of getModuleInfo(module)?.importedIds??[])visit(dependency);};
 for(const entry of entries)visit(entry);
 return visited.has(id)?'application-startup':undefined;
}

export function assertStartupIsolation(bundle){
 const chunks=Object.values(bundle).filter(item=>item.type==='chunk');
 const startupFiles=new Set(chunks.filter(chunk=>Object.keys(chunk.modules).some(id=>/\/src\/main(?:-release)?\.jsx$/.test(id))).map(chunk=>chunk.fileName));
 for(const chunk of chunks)if(Object.keys(chunk.modules).some(id=>id.includes('/lottie-web/'))&&chunk.imports.some(file=>startupFiles.has(file)))throw new Error('Lazy player must not depend on a failed startup module');
}
