// Public URL aliases follow the current project slug. Native originals/relations
// and authoring history retain their immutable paths; no files move or overwrite.
export function publicAssetAlias(slug:string,value:string){
 return value.replace(/^\/assets\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*\//,`/assets/projects/${slug}/`)
}
export function withPublicAssetAliases(slug:string,value:unknown):unknown{
 if(typeof value==='string')return publicAssetAlias(slug,value)
 if(Array.isArray(value))return value.map(item=>withPublicAssetAliases(slug,item))
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,withPublicAssetAliases(slug,item)]))
 return value
}
