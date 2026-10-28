import { z } from "zod";
import { ACCOUNT_TYPES, BANKS, type Contact } from "@/domain/models/contact";

export const contactSchema: z.ZodType<Contact> = z.object({
  id: z.string(),
  name: z.string(),
  bank: z.enum(BANKS),
  accountType: z.enum(ACCOUNT_TYPES),
  maskedAccount: z.string(),
});

export const contactListResponseSchema = z.object({ contacts: z.array(contactSchema) });
export const contactCreatedResponseSchema = z.object({ contact: contactSchema });

export type ContactListResponse = z.infer<typeof contactListResponseSchema>;
export type ContactCreatedResponse = z.infer<typeof contactCreatedResponseSchema>;
