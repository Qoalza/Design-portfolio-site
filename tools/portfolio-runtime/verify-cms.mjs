import path from 'node:path';import {verifyCMSArtifact} from '../payload-admin/scripts/artifact.mjs';
const args=process.argv.slice(2);
if(!args[0]||args.length>2||(args[1]&&args[1]!=='--fixture'))throw new Error('Usage: cms:verify <artifact root> [--fixture]');
verifyCMSArtifact(path.resolve(args[0]),{fixture:args.includes('--fixture')}).then(({cmsBuildId,runtime,schemaHash,producer})=>console.log(JSON.stringify({cmsBuildId,runtime,schemaHash,producer}))).catch(error=>{console.error(error.message);process.exitCode=1;});
