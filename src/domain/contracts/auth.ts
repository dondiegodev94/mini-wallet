import { z } from "zod";

export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
