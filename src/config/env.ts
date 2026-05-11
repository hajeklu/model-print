import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  API_KEY: z.string().min(16, "API_KEY must be at least 16 characters"),
  CORS_ORIGIN: z
    .string()
    .min(1)
    .transform((s) =>
      s
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    ),
  MAX_FILE_MB: z.coerce.number().positive().default(50),
  ALLOWED_EXTENSIONS: z
    .string()
    .default("stl,obj,3mf,step,stp,ply,amf")
    .transform((s) =>
      s
        .split(",")
        .map((e) => e.trim().toLowerCase().replace(/^\./, ""))
        .filter(Boolean),
    ),
  UPLOAD_PENDING_TTL_HOURS: z.coerce.number().positive().default(24),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(msg)}`);
  }
  return parsed.data;
}

export const env = loadEnv();

export function maxFileBytes(): number {
  return env.MAX_FILE_MB * 1024 * 1024;
}
