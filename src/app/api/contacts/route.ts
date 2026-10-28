import { NextResponse } from "next/server";
import type { ContactCreatedResponse, ContactListResponse } from "@/domain/contracts/contacts";
import { CONTACT_MESSAGES, contactInputSchema } from "@/domain/schemas/contact.schema";
import { getCurrentSession } from "@/server/auth/currentSession";
import { createContact, listContacts } from "@/server/contacts/contactService";
import { apiError, readJsonBody, validationError } from "@/server/http/responses";

function unauthorized() {
  return apiError(401, "UNAUTHORIZED", "Tu sesión expiró. Inicia sesión de nuevo.");
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return unauthorized();

  return NextResponse.json<ContactListResponse>({ contacts: await listContacts(session.userId) });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return unauthorized();

  const parsed = contactInputSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return validationError(parsed.error);

  const result = await createContact(session.userId, parsed.data);
  if (!result.ok) {
    return apiError(409, "CONTACT_ALREADY_EXISTS", CONTACT_MESSAGES.duplicate, {
      account: [CONTACT_MESSAGES.duplicate],
    });
  }
  return NextResponse.json<ContactCreatedResponse>({ contact: result.contact }, { status: 201 });
}
