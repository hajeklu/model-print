import { timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";

export function extractApiKey(request: FastifyRequest): string | undefined {
  const raw = request.headers["x-api-key"];
  if (typeof raw === "string" && raw.length > 0) {
    return raw;
  }
  const auth = request.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || undefined;
  }
  return undefined;
}

export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return nodeTimingSafeEqual(bufA, bufB);
}
