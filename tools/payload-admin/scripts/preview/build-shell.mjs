import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';
import {exportApprovedRedesign} from '../../../concept-v2/export-approved-content.mjs';
import {compilePreview} from './compiler.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..');
const temporary=await mkdtemp(path.join(os.tmpdir(),'des-art-payload-preview-shell-'));
try{
 const prepared=await exportApprovedRedesign({repoRoot:root}),inputFile=path.join(temporary,'input.json');
 await writeFile(inputFile,JSON.stringify({version:1,revision:prepared.provenance.sourceSha,source:{mode:'draft'},projects:prepared.projects,assets:prepared.assets.map(asset=>({publicPath:asset.publicPath,sha256:asset.sha256,base64:asset.bytes.toString('base64')}))}));
 await compilePreview({inputFile,output:path.join(root,'.portfolio-release/preview'),base:'/api/preview-artifacts/'+'0'.repeat(64)+'/'});
 console.log('Prebuilt private preview renderer; content edits do not compile it');
}finally{await rm(temporary,{recursive:true,force:true});}
