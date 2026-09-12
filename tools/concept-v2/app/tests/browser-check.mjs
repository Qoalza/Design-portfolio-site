import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const dist=path.resolve(import.meta.dirname,'../dist');
const server=createServer(async(request,response)=>{
  try{
    const pathname=new URL(request.url,'http://127.0.0.1').pathname;
    const relative=pathname==='/'?'index.html':pathname.slice(1);
    if(relative.includes('..'))throw new Error('invalid path');
    const body=await readFile(path.join(dist,relative));
    response.writeHead(200);
    response.end(body);
  }catch{
    response.writeHead(404);
    response.end();
  }
});

try{
  await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',resolve).once('error',reject));
  const address=server.address();
  assert.equal(typeof address,'object');
  const base=`http://127.0.0.1:${address.port}`;
  const response=await fetch(base);
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/id="root"/);
  const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match=>match[1]);
  assert.ok(assets.some(asset=>asset.endsWith('.js')));
  assert.ok(assets.some(asset=>asset.endsWith('.css')));
  for(const asset of assets){
    const assetResponse=await fetch(base+asset);
    assert.equal(assetResponse.status,200,asset);
    assert.ok((await assetResponse.arrayBuffer()).byteLength>0,asset);
  }
  console.log(`Built runtime smoke passed at ${base}.`);
}finally{
  await new Promise(resolve=>server.close(resolve));
}
