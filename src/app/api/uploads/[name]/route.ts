import { NextResponse, type NextRequest } from "next/server";
import { readLocalFile } from "@/lib/storage";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const buf = await readLocalFile(name);
  if (!buf) return new NextResponse("Not found", { status: 404 });
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
