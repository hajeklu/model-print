import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "./config/env.js";
import { extractApiKey, timingSafeEqual } from "./lib/apiKey.js";
import { healthRoutes } from "./routes/health.js";
import { ordersRoutes } from "./routes/orders.js";
import { uploadsRoutes } from "./routes/uploads.js";

async function verifyApiKey(request: FastifyRequest, reply: FastifyReply) {
  const key = extractApiKey(request);
  if (!key || !timingSafeEqual(key, env.API_KEY)) {
    return reply.code(401).send({ error: "Unauthorized", code: "INVALID_API_KEY" });
  }
}

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === "development",
  });

  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === "production",
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (env.CORS_ORIGIN.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 200,
    timeWindow: "1 minute",
  });

  await app.register(healthRoutes);

  await app.register(
    async (v1) => {
      v1.addHook("preHandler", verifyApiKey);
      await v1.register(uploadsRoutes);
      await v1.register(ordersRoutes);
    },
    { prefix: "/v1" },
  );

  return app;
}
