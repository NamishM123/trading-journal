import { promises as fs } from "fs";
import path from "path";

const LOCAL_DIR = path.join(process.cwd(), ".data", "uploads");

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

/**
 * Stores a screenshot and returns its public URL.
 * Production (BLOB_READ_WRITE_TOKEN set): Vercel Blob.
 * Local dev: filesystem under .data/uploads, served via /api/uploads.
 */
export async function saveFile(file: File): Promise<string> {
  const name = `${crypto.randomUUID()}-${sanitizeName(file.name || "image.png")}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`screenshots/${name}`, file, { access: "public" });
    return blob.url;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(LOCAL_DIR, name), buf);
  return `/api/uploads/${name}`;
}

export async function deleteFile(url: string): Promise<void> {
  try {
    if (url.startsWith("/api/uploads/")) {
      const name = sanitizeName(path.basename(url));
      await fs.unlink(path.join(LOCAL_DIR, name));
    } else if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { del } = await import("@vercel/blob");
      await del(url);
    }
  } catch {
    // A missing file should never block deleting the trade record.
  }
}

export async function readLocalFile(name: string): Promise<Buffer | null> {
  try {
    const safe = sanitizeName(path.basename(name));
    return await fs.readFile(path.join(LOCAL_DIR, safe));
  } catch {
    return null;
  }
}
