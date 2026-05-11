import { randomUUID } from "node:crypto";
import { open, unlink } from "node:fs/promises";
import path from "node:path";
import multipart from "@fastify/multipart";
import type { FastifyPluginAsync } from "fastify";
import { env, maxFileBytes } from "../config/env.js";
import {
  getExtension,
  isExtensionAllowed,
  mimeAllowedForExtension,
  sanitizeFilename,
  streamToFileWithSha256,
  validateFileMagic,
} from "../lib/fileValidation.js";
import { prisma } from "../lib/db.js";
import { pendingUploadDir, relativeStoredPath } from "../lib/paths.js";

async function readFileHead(filePath: string, maxBytes: number): Promise<Buffer> {
  const file = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(maxBytes);
    const { bytesRead } = await file.read(buffer, 0, maxBytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await file.close();
  }
}

export const uploadsRoutes: FastifyPluginAsync = async (app) => {
  await app.register(multipart, {
    limits: {
      fileSize: maxFileBytes(),
      files: 1,
    },
  });

  app.post("/uploads", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: "Missing file field", code: "FILE_REQUIRED" });
    }

    if (data.fieldname !== "file") {
      return reply
        .code(400)
        .send({ error: 'Expected field name "file"', code: "INVALID_FIELD" });
    }

    const originalFilename = data.filename ?? "model.bin";
    const safeName = sanitizeFilename(originalFilename);
    const ext = getExtension(safeName);

    if (!isExtensionAllowed(ext, env.ALLOWED_EXTENSIONS)) {
      return reply.code(415).send({
        error: "Unsupported file type",
        code: "UNSUPPORTED_TYPE",
        allowed: env.ALLOWED_EXTENSIONS,
      });
    }

    if (!mimeAllowedForExtension(ext, data.mimetype)) {
      return reply.code(415).send({
        error: "MIME type not allowed for this extension",
        code: "UNSUPPORTED_MIME",
      });
    }

    const uploadId = randomUUID();
    const dir = pendingUploadDir(uploadId);
    const destAbs = path.join(dir, safeName);

    let streamed: { sizeBytes: number; sha256: string };
    try {
      streamed = await streamToFileWithSha256(data.file, destAbs, maxFileBytes());
    } catch (err) {
      await unlink(destAbs).catch(() => undefined);
      if (err instanceof Error && err.message === "FILE_TOO_LARGE") {
        return reply.code(413).send({ error: "File too large", code: "FILE_TOO_LARGE" });
      }
      request.log.error(err);
      return reply.code(500).send({ error: "Upload failed", code: "UPLOAD_FAILED" });
    }

    const head = await readFileHead(destAbs, 8192).catch(() => Buffer.alloc(0));
    const magic = await validateFileMagic(ext, head);
    if (!magic.ok) {
      await unlink(destAbs).catch(() => undefined);
      return reply.code(415).send({
        error: magic.reason,
        code: "INVALID_FILE_CONTENT",
      });
    }

    const storedPath = relativeStoredPath(destAbs);
    try {
      await prisma.pendingUpload.create({
        data: {
          id: uploadId,
          storedPath,
          originalFilename: safeName,
          mimeType: data.mimetype ?? null,
          sizeBytes: streamed.sizeBytes,
          sha256: streamed.sha256,
        },
      });
    } catch (err) {
      await unlink(destAbs).catch(() => undefined);
      request.log.error(err);
      return reply.code(500).send({ error: "Failed to persist upload", code: "DB_ERROR" });
    }

    return reply.code(201).send({
      uploadId,
      originalFilename: safeName,
      sizeBytes: streamed.sizeBytes,
      sha256: streamed.sha256,
    });
  });
};
