import path from 'node:path'
import {getPayload} from 'payload'
import config from '@payload-config'
import {createReleaseHandler} from '../../../../../portfolio-release/release-host.mjs'
import {readPublishedSiteContent} from '../../../site/read-content'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const serve=createReleaseHandler({
 root:path.resolve(/*turbopackIgnore: true*/ process.env.PORTFOLIO_SITE_ROOT||path.resolve(process.cwd(),'../../.portfolio-release/site')),
 readContent:async()=>readPublishedSiteContent(await getPayload({config})),
})
export async function GET(request:Request){return serve(request)}
export async function HEAD(request:Request){return serve(request)}
