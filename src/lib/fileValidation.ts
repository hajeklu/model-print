import { createHash } from "node:crypto";
import type { Readable } from "node:stream";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const EXTENSION_TO_MIME: Record<string, string[]> = {
  stl: ["model/stl", "application/sla", "application/octet-stream"],
  obj: ["model/obj", "text/plain", "application/octet-stream"],
  "3mf": ["model/3mf", "application/octet-stream"],
  step: ["model/step", "application/step", "text/plain", "application/octet-stream"],
  stp: ["model/step", "application/step", "text/plain", "application/octet-stream"],
  ply: ["application/octet-stream", "text/plain", "model/ply"],
  amf: ["application/amf", "application/octet-stream", "text/xml", "application/xml"],
};

export function getExtension(filename: string): string {
  const base = path.basename(filename).toLowerCase();
  const dot = base.lastIndexOf(".");
  if (dot === -1) return "";
  return base.slice(dot + 1);
}

export function isExtensionAllowed(ext: string, allowed: readonly string[]): boolean {
  const e = ext.toLowerCase().replace(/^\./, "");
  return allowed.includes(e);
}

export function mimeAllowedForExtension(ext: string, mime: string | undefined): boolean {
  const e = ext.toLowerCase();
  const m = (mime ?? "").toLowerCase();
  const allowed = EXTENSION_TO_MIME[e];
  if (!allowed) return false;
  if (!m) return true;
  return allowed.includes(m) || m === "application/octet-stream";
}

const BINARY_STL_HEADER_SIZE = 84;
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export async function validateFileMagic(
  ext: string,
  head: Buffer,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const e = ext.toLowerCase();
  if (head.length === 0) {
    return { ok: false, reason: "Empty file" };
  }

  if (e === "stl") {
    const prefix = head.subarray(0, Math.min(5, head.length)).toString("ascii");
    if (prefix.toLowerCase().startsWith("solid")) {
      return { ok: true };
    }
    if (head.length >= BINARY_STL_HEADER_SIZE) {
      return { ok: true };
    }
    return { ok: false, reason: "STL must be ASCII (solid…) or binary with full header" };
  }

  if (e === "obj") {
    const text = head.subarray(0, Math.min(4096, head.length)).toString("utf8");
    if (/^(v |vt |vn |f |#|\s)/m.test(text) || text.includes("\nv ")) {
      return { ok: true };
    }
    return { ok: false, reason: "OBJ does not look like valid geometry text" };
  }

  if (e === "3mf") {
    if (head.length >= 4 && head.subarray(0, 4).equals(ZIP_MAGIC)) {
      return { ok: true };
    }
    return { ok: false, reason: "3MF must be a ZIP archive (PK header)" };
  }

  if (e === "step" || e === "stp") {
    const text = head.subarray(0, Math.min(2048, head.length)).toString("ascii");
    if (text.includes("ISO-10303-21") || text.includes("STEP") || text.startsWith("HEADER")) {
      return { ok: true };
    }
    return { ok: false, reason: "STEP file missing ISO-10303-21 header" };
  }

  if (e === "ply") {
    const text = head.subarray(0, Math.min(32, head.length)).toString("ascii");
    if (text.startsWith("ply")) {
      return { ok: true };
    }
    return { ok: false, reason: "PLY must start with 'ply'" };
  }

  if (e === "amf") {
    const text = head.subarray(0, Math.min(256, head.length)).toString("utf8").toLowerCase();
    if (text.includes("<amf") || text.includes("<?xml")) {
      return { ok: true };
    }
    return { ok: false, reason: "AMF must contain AMF/XML markup" };
  }

  return { ok: true };
}

export async function streamToFileWithSha256(
  stream: Readable,
  destPath: string,
  maxBytes: number,
): Promise<{ sizeBytes: number; sha256: string }> {
  await mkdir(path.dirname(destPath), { recursive: true });
  const hash = createHash("sha256");
  let size = 0;
  const out = createWriteStream(destPath);
  try {
    for await (const chunk of stream) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buf.length;
      if (size > maxBytes) {
        throw new Error("FILE_TOO_LARGE");
      }
      hash.update(buf);
      if (!out.write(buf)) {
        await new Promise<void>((resolve, reject) => {
          out.once("drain", resolve);
          out.once("error", reject);
        });
      }
    }
    out.end();
    await new Promise<void>((resolve, reject) => {
      out.once("finish", () => resolve());
      out.once("error", reject);
    });
  } catch (e) {
    out.destroy();
    throw e;
  }
  return { sizeBytes: size, sha256: hash.digest("hex") };
}

export function sanitizeFilename(original: string): string {
  const base = path.basename(original).replace(/[^\w.\-()+ ]/g, "_");
  return base.slice(0, 200) || "model.bin";
}
