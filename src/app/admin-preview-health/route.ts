import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  if (process.env.DES_ART_ADMIN_PREVIEW !== "1") return new NextResponse(null, { status: 404 });
  return NextResponse.json({
    preview: true,
    protocol: Number(process.env.DES_ART_PREVIEW_PROTOCOL),
    repoRoot: process.env.DES_ART_PREVIEW_REPO_ROOT ?? null,
    fingerprint: process.env.DES_ART_PREVIEW_FINGERPRINT ?? null,
    gitSha: process.env.DES_ART_PREVIEW_GIT_SHA ?? null,
  }, { headers: { "cache-control": "no-store" } });
}
