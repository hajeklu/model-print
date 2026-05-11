import { access, copyFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../lib/db.js";
import { orderUploadDir, relativeStoredPath } from "../lib/paths.js";
import {
  buildCheckoutSnapshot,
  type CreateOrderBody,
} from "../schemas/order.js";

export class OrderServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "OrderServiceError";
  }
}

function absoluteFromStored(storedPath: string): string {
  return path.isAbsolute(storedPath)
    ? storedPath
    : path.join(process.cwd(), storedPath);
}

export async function createOrderFromUpload(
  body: CreateOrderBody,
): Promise<{ orderId: string }> {
  const pending = await prisma.pendingUpload.findFirst({
    where: { id: body.uploadId, consumedAt: null },
  });

  if (!pending) {
    throw new OrderServiceError("Upload not found or already used", "UPLOAD_NOT_FOUND", 404);
  }

  const maxAgeMs = env.UPLOAD_PENDING_TTL_HOURS * 3600 * 1000;
  if (Date.now() - pending.createdAt.getTime() > maxAgeMs) {
    throw new OrderServiceError("Upload session expired", "UPLOAD_EXPIRED", 410);
  }

  const sourceAbs = absoluteFromStored(pending.storedPath);
  try {
    await access(sourceAbs);
  } catch {
    throw new OrderServiceError("Upload file missing on disk", "UPLOAD_FILE_MISSING", 404);
  }

  const checkout = buildCheckoutSnapshot(body);

  const order = await prisma.order.create({
    data: {
      checkout: checkout as Prisma.InputJsonValue,
      status: "pending",
    },
  });

  const orderDir = orderUploadDir(order.id);
  await mkdir(orderDir, { recursive: true });
  const destName = path.basename(pending.storedPath);
  const destAbs = path.join(orderDir, destName);
  const storedRelative = relativeStoredPath(destAbs);

  try {
    await copyFile(sourceAbs, destAbs);
    await prisma.modelFile.create({
      data: {
        orderId: order.id,
        storedPath: storedRelative,
        originalFilename: pending.originalFilename,
        mimeType: pending.mimeType,
        sizeBytes: pending.sizeBytes,
        sha256: pending.sha256,
      },
    });
    await prisma.pendingUpload.update({
      where: { id: pending.id },
      data: { consumedAt: new Date() },
    });
    await unlink(sourceAbs).catch(() => undefined);
  } catch (err) {
    await prisma.modelFile.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } }).catch(() => undefined);
    await unlink(destAbs).catch(() => undefined);
    throw err;
  }

  return { orderId: order.id };
}

export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { modelFile: true },
  });
}
