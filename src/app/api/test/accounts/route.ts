import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/server/config/env";
import { readJsonBody, validationError } from "@/server/http/responses";
import { TEST_ACCOUNT_TEMPLATES, createTestAccount } from "@/server/testing/testAccounts";

const testAccountRequestSchema = z.strictObject({ template: z.enum(TEST_ACCOUNT_TEMPLATES) });

export async function POST(request: Request) {
  // Fuera del entorno de pruebas la ruta no existe.
  if (!getServerEnv().ENABLE_TEST_SCENARIOS) return new NextResponse(null, { status: 404 });

  const parsed = testAccountRequestSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return validationError(parsed.error);

  return NextResponse.json(await createTestAccount(parsed.data.template), { status: 201 });
}
