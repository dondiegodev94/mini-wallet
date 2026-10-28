import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SESSION_SECRET: z
    .string({ error: "SESSION_SECRET no está configurado. Copia .env.example a .env.local." })
    .min(32, "SESSION_SECRET debe tener al menos 32 caracteres."),
  ENABLE_TEST_SCENARIOS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type ServerEnv = z.output<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Configuración del servidor inválida:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
