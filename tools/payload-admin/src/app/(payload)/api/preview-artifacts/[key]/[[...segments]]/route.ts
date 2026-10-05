import {previewArtifactResponse} from '../../../../../../preview-artifacts'
export const runtime='nodejs'
export const dynamic='force-dynamic'
type Context={params:Promise<{key:string;segments?:string[]}>}
export async function GET(_request:Request,{params}:Context){const {key,segments=[]}=await params;return previewArtifactResponse(key,segments)}
export async function HEAD(_request:Request,{params}:Context){const {key,segments=[]}=await params;return previewArtifactResponse(key,segments,true)}
