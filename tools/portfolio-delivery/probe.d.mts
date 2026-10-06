import type { ProbeRequest } from './coordinator.mjs';
export function createLoopbackProbe(origin:string,options?:{timeoutMs?:number;portfolioBuildId?:{sourceSha:string;artifactSha256:string}}):(request:ProbeRequest)=>Promise<void>;
