import {createHash} from 'node:crypto'
import type {Payload} from 'payload'
import type {Project} from '../payload-types'
import {releaseProjectDocument} from '../release-export'

// This fixed server-side reader exposes only committed, published project DTOs.
// Native REST collections, drafts, versions and upload records stay private.
export async function readPublishedSiteRecords(payload:Pick<Payload,'find'>){
 const records:Project[]=[]
 for(let page=1;;page++){
  const result=await payload.find({collection:'projects',overrideAccess:true,draft:false,
   depth:0,limit:100,page,sort:'slug',
   where:{and:[{_status:{equals:'published'}},{releaseContent:{exists:true}}]},
  })
  for(const record of result.docs){
   if(record._status!=='published')throw new Error('Unexpected unpublished record')
   records.push(record)
  }
  if(!result.hasNextPage)break
 }
 return records
}
export async function readPublishedSiteContent(payload:Pick<Payload,'find'>){
 const projects=(await readPublishedSiteRecords(payload)).map(releaseProjectDocument)
 if(new Set(projects.map(project=>project.slug)).size!==projects.length)throw new Error('Duplicate published project address')
 const revision=createHash('sha256').update(JSON.stringify(projects)).digest('hex')
 return {version:1 as const,revision,projects}
}
