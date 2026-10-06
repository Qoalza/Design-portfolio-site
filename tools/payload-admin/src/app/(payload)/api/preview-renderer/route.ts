import {authenticatedPublication,publicationFailure} from '../../../../publication/http'
import {readPortfolioRelease} from '../../../../../../portfolio-runtime/active-release.mjs'
export const dynamic='force-dynamic'
export async function GET(request:Request) {
 try {
  const {settings}=await authenticatedPublication(request)
  const release=await readPortfolioRelease(process.env.PORTFOLIO_ACTIVE_RELEASE!,{requireClean:settings.server})
  return Response.json({rendererId:release.renderer.rendererId},{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex'}})
 }catch(error){return publicationFailure(error)}
}
