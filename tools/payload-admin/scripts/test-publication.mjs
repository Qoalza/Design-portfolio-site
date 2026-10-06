import {mkdtemp,rm,realpath} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
const root=await mkdtemp(path.join(await realpath(os.tmpdir()),'des-art-payload-test-publication-'));
try {
 const child=spawn(process.execPath,['--import','tsx','tests/publication-native-session.ts'],{cwd:path.resolve(import.meta.dirname,'..'),stdio:'inherit',env:{PATH:process.env.PATH,TMPDIR:path.dirname(root),NODE_ENV:'test',PAYLOAD_RUNTIME_MODE:'fixture',PAYLOAD_LOCAL_ROOT:root,PAYLOAD_SECRET:randomBytes(48).toString('hex'),PAYLOAD_TEST_PUSH:'1',PAYLOAD_TELEMETRY_DISABLED:'1'}});
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',value=>resolve(value??1));});process.exitCode=code;
}finally{await rm(root,{recursive:true,force:true});await rm(root+'-lock',{recursive:true,force:true});}
