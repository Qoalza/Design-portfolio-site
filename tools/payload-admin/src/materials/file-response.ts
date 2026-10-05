// Native downloads are authoring resources, never executable pages in the CMS origin.
// Use decoded route segments so encoded collection names cannot bypass the policy.
export function protectProjectFileResponse(response:Response,slug:readonly string[]|undefined):Response {
 if(slug?.[0]!=='project-files'||slug[1]!=='file') return response
 const headers=new Headers(response.headers)
 headers.set('Content-Disposition','attachment')
 headers.set('Content-Security-Policy',"sandbox; default-src 'none'; base-uri 'none'; form-action 'none'")
 headers.set('X-Content-Type-Options','nosniff')
 headers.set('Cache-Control','private, no-store')
 headers.set('X-Robots-Tag','noindex')
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers})
}
