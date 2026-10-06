import {spawn} from 'node:child_process';
import {realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import os from 'node:os';

// Both historical entry points now exercise extracted independent artifacts.
// The harness owns all temporary data and never inherits production settings.
export async function runSeparatedProof() {
 if (process.argv.length !== 2) throw new Error('Separated proof accepts no arguments; build both artifacts first. Retaining sandbox exports is not supported.');
 const entry=fileURLToPath(new URL('../../../tests/payload-packaged-runtime.test.mjs',import.meta.url));
 const child=spawn(process.execPath,['--experimental-strip-types',entry],{
  env:{PATH:process.env.PATH,TMPDIR:await realpath(os.tmpdir())},stdio:'inherit',
 });
 const stop=()=>child.kill('SIGTERM');
 process.once('SIGINT',stop);process.once('SIGTERM',stop);
 try {
  process.exitCode=await new Promise((resolve,reject)=>{
   child.once('error',reject);child.once('exit',code=>resolve(code??1));
  });
 } finally {
  process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);
 }
}
