import path from "node:path";

export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export function pendingUploadDir(uploadId: string): string {
  return path.join(UPLOADS_DIR, "pending", uploadId);
}

export function orderUploadDir(orderId: string): string {
  return path.join(UPLOADS_DIR, "orders", orderId);
}

/** Relative to project root (for DB / portability). */
export function relativeStoredPath(absolutePath: string): string {
  const root = path.join(process.cwd(), path.sep);
  if (absolutePath.startsWith(root)) {
    return absolutePath.slice(root.length).replace(/\\/g, "/");
  }
  return absolutePath.replace(/\\/g, "/");
}
