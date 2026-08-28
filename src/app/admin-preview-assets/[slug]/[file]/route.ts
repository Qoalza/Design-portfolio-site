import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { resolveProjectAssetPath } from "../../../../lib/project-contract";

const contentTypes = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; file: string }> },
) {
  if (process.env.DES_ART_ADMIN_PREVIEW !== "1" || !process.env.DES_ART_ADMIN_DRAFT_ASSET_ROOT) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const { slug, file } = await params;
    const source = resolveProjectAssetPath(process.env.DES_ART_ADMIN_DRAFT_ASSET_ROOT, slug, file);
    const extension = path.extname(file).toLowerCase();
    const contentType = contentTypes.get(extension);
    if (!contentType) return new NextResponse(null, { status: 415 });
    return new NextResponse(await readFile(source), {
      headers: { "cache-control": "no-store", "content-type": contentType },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
