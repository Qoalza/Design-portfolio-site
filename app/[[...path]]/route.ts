import { createReleaseHandler } from "../../tools/portfolio-release/release-host.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const serve = createReleaseHandler();
export const GET = (request: Request) => serve(request);
export const HEAD = (request: Request) => serve(request);
