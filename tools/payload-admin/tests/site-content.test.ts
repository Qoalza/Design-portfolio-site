import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import type {Payload} from 'payload'
import type {Project} from '../src/payload-types'
import {readPublishedSiteContent} from '../src/site/read-content'
import {exportApprovedRedesign} from '../../concept-v2/export-approved-content.mjs'

test('public reader uses native published records on each request and strips editor/private state',async()=>{
 const {projects}=await exportApprovedRedesign({repoRoot:path.resolve(import.meta.dirname,'../../..')})
 const record={id:1,title:projects[0].title,slug:projects[0].slug,_status:'published',releaseContent:{...projects[0],_payloadEditor:{private:'must not leak'}},releaseAssets:[{file:{value:99}}]} as unknown as Project
 const calls:unknown[]=[]
 const payload={find:async(options:unknown)=>{calls.push(options);return {docs:[record],hasNextPage:false}}} as unknown as Pick<Payload,'find'>
 const first=await readPublishedSiteContent(payload)
 assert.equal(first.projects[0].title,record.title)
 assert.ok(!JSON.stringify(first).includes('must not leak'))
 assert.ok(!JSON.stringify(first).includes('releaseAssets'))
 assert.deepEqual(calls[0],{collection:'projects',overrideAccess:true,draft:false,depth:0,limit:100,page:1,sort:'slug',where:{and:[{_status:{equals:'published'}},{releaseContent:{exists:true}}]}})
 record.title='Применённое изменение'
 const second=await readPublishedSiteContent(payload)
 assert.equal(second.projects[0].title,record.title)
 assert.notEqual(second.revision,first.revision)
 record._status='draft'
 await assert.rejects(readPublishedSiteContent(payload),/unpublished/)
})
