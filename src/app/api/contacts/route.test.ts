/** @jest-environment node */
import { GET, POST } from "./route";
import { SESSION_COOKIE, createSessionToken } from "@/server/auth/session";
import { contactCreatedResponseSchema, contactListResponseSchema } from "@/domain/contracts/contacts";
import { CONTACT_MESSAGES } from "@/domain/schemas/contact.schema";
import { contactRepository } from "@/server/contacts/contactRepository";

const SECRET = "test-secret-with-at-least-32-characters";
let sessionToken: string | undefined;

jest.mock("@/server/mock/latency", () => ({ simulateLatency: () => Promise.resolve() }));
jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  connection: async () => undefined,
}));
jest.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === SESSION_COOKIE && sessionToken ? { name, value: sessionToken } : undefined,
  }),
}));

const NEW_CONTACT = {
  name: "Beatriz  Ríos",
  accountType: "CARD",
  account: "4027660012987659",
  bank: "HSBC",
};

function loginAs(userId: string) {
  sessionToken = createSessionToken(userId, SECRET).token;
}

function postContact(body: unknown) {
  return POST(
    new Request("http://localhost/api/contacts", { method: "POST", body: JSON.stringify(body) }),
  );
}

async function listNames() {
  const body = contactListResponseSchema.parse(await (await GET()).json());
  return body.contacts.map((contact) => contact.name);
}

beforeEach(() => {
  process.env.SESSION_SECRET = SECRET;
  sessionToken = undefined;
  contactRepository.reset();
});

describe("GET /api/contacts", () => {
  it("[SPEC-CT-R08] sin sesión responde 401", async () => {
    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  it("[SPEC-CT-R10][SPEC-CT-R07] lista los contactos del usuario en orden y enmascarados", async () => {
    loginAs("usr_ana");
    const response = await GET();
    const body = contactListResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(body.contacts.map((contact) => contact.name)).toEqual([
      "Carlos Núñez",
      "Luis Pérez",
      "Mariana Soto",
    ]);
    expect(body.contacts[2]).toEqual({
      id: "ct_mariana",
      name: "Mariana Soto",
      bank: "BBVA",
      accountType: "CLABE",
      maskedAccount: "•••• 7899",
    });
    expect(JSON.stringify(body)).not.toContain("012180001234567899");
  });

  it("[SPEC-CT-AC02] un usuario sin contactos recibe una lista vacía", async () => {
    loginAs("usr_luis");
    expect(await listNames()).toEqual([]);
  });
});

describe("POST /api/contacts", () => {
  it("[SPEC-CT-R08] sin sesión responde 401 y no guarda", async () => {
    expect((await postContact(NEW_CONTACT)).status).toBe(401);
    loginAs("usr_ana");
    expect(await listNames()).not.toContain("Beatriz Ríos");
  });

  it("[SPEC-CT-AC03] crea el contacto normalizado y enmascarado", async () => {
    loginAs("usr_ana");
    const response = await postContact(NEW_CONTACT);
    const body = contactCreatedResponseSchema.parse(await response.json());

    expect(response.status).toBe(201);
    expect(body.contact).toMatchObject({
      name: "Beatriz Ríos",
      bank: "HSBC",
      accountType: "CARD",
      maskedAccount: "•••• 7659",
    });
    expect(await listNames()).toEqual(["Beatriz Ríos", "Carlos Núñez", "Luis Pérez", "Mariana Soto"]);
  });

  it.each([
    [{ ...NEW_CONTACT, name: "" }, "name"],
    [{ ...NEW_CONTACT, account: "4027-6600-1298-7659" }, "account"],
    [{ ...NEW_CONTACT, accountType: "CLABE" }, "account"],
    [{ ...NEW_CONTACT, account: "4027660012987650" }, "account"],
    [{ ...NEW_CONTACT, bank: "Banco Patito" }, "bank"],
    [{ ...NEW_CONTACT, accountType: "IBAN" }, "accountType"],
  ])("[SPEC-CT-AC08] rechaza %p con 400 en el campo %p", async (body, field) => {
    loginAs("usr_ana");
    const response = await postContact(body);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(payload.error.fieldErrors[field]).toBeDefined();
    expect(await listNames()).toHaveLength(3);
  });

  it("rechaza un cuerpo que no es JSON", async () => {
    loginAs("usr_ana");
    const response = await POST(
      new Request("http://localhost/api/contacts", { method: "POST", body: "nope" }),
    );
    expect(response.status).toBe(400);
  });

  it("[SPEC-CT-R06] rechaza un duplicado con 409", async () => {
    loginAs("usr_ana");
    const response = await postContact({
      name: "Otra Mariana",
      accountType: "CLABE",
      account: "012180001234567899",
      bank: "BBVA",
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: {
        code: "CONTACT_ALREADY_EXISTS",
        fieldErrors: { account: [CONTACT_MESSAGES.duplicate] },
      },
    });
    expect(await listNames()).toHaveLength(3);
  });

  it("[SPEC-CT-R06][SPEC-CT-AC07] cada usuario tiene su propia lista", async () => {
    loginAs("usr_luis");
    expect((await postContact({ ...NEW_CONTACT, account: "4915600212345675" })).status).toBe(201);
    expect(await listNames()).toEqual(["Beatriz Ríos"]);

    loginAs("usr_ana");
    expect(await listNames()).not.toContain("Beatriz Ríos");
  });
});
