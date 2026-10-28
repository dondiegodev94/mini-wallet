import type { Contact } from "@/domain/models/contact";
import { mergeContacts, sortContactsByName } from "./contacts";

function contact(id: string, name: string): Contact {
  return { id, name, bank: "BBVA", accountType: "CARD", maskedAccount: "•••• 0000" };
}

describe("[SPEC-CT-R10] orden alfabético", () => {
  it("ordena sin distinguir mayúsculas ni acentos", () => {
    const sorted = sortContactsByName([
      contact("1", "zoe"),
      contact("2", "Álvaro"),
      contact("3", "beto"),
      contact("4", "Ana"),
    ]);
    expect(sorted.map((item) => item.name)).toEqual(["Álvaro", "Ana", "beto", "zoe"]);
  });

  it("no modifica la lista original", () => {
    const original = [contact("1", "b"), contact("2", "a")];
    sortContactsByName(original);
    expect(original.map((item) => item.id)).toEqual(["1", "2"]);
  });
});

describe("[SPEC-CT-R09] mergeContacts", () => {
  it("agrega los contactos nuevos sin duplicar los que ya llegaron del servidor", () => {
    const merged = mergeContacts(
      [contact("1", "Carlos"), contact("2", "Mariana")],
      [contact("3", "Beatriz"), contact("2", "Mariana")],
    );
    expect(merged.map((item) => item.name)).toEqual(["Beatriz", "Carlos", "Mariana"]);
  });
});
