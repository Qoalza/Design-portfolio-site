import config from '@payload-config'
import { REST_GET, REST_POST, REST_DELETE, REST_PATCH, REST_PUT, REST_OPTIONS } from '@payloadcms/next/routes'

import {serverWriteDenial} from '../../../../server-request'
import { protectProjectFileResponse } from '../../../../materials/file-response'

const read = REST_GET(config)
export const GET: typeof read = async (request, args) => {
  const slug = (await args.params).slug
  const fileHead = request.method === 'HEAD' && slug?.[0] === 'project-files' && slug[1] === 'file'
  const response = await read(fileHead ? new Request(request.url, {method:'GET', headers:request.headers}) : request, args)
  const secured = protectProjectFileResponse(response, slug)
  if (!fileHead) return secured
  await secured.body?.cancel()
  return new Response(null, {status:secured.status, statusText:secured.statusText, headers:secured.headers})
}
export const HEAD = GET
function protectWrite(handler:ReturnType<typeof REST_POST>):typeof handler{
 return async(request,args)=>serverWriteDenial(request,(await args.params).slug)??handler(request,args)
}
export const POST = protectWrite(REST_POST(config))
export const DELETE = protectWrite(REST_DELETE(config))
export const PATCH = protectWrite(REST_PATCH(config))
export const PUT = protectWrite(REST_PUT(config))
export const OPTIONS = REST_OPTIONS(config)
