import { act, renderHook } from "@testing-library/react";
import type { Contact } from "@/domain/models/contact";
import { useRecipientPicker } from "./useRecipientPicker";

const CARLOS: Contact = {
  id: "ct_carlos",
  name: "Carlos Núñez",
  bank: "Banorte",
  accountType: "CARD",
  maskedAccount: "•••• 5675",
};
const BEATRIZ: Contact = { ...CARLOS, id: "ct_beatriz", name: "Beatriz Ríos" };
const NO_CONTACTS: Contact[] = [];
const SOME_CONTACTS = [CARLOS];

describe("useRecipientPicker", () => {
  it("[SPEC-CT-AC02] sin contactos el formulario está abierto y no se puede cerrar", () => {
    const { result } = renderHook(() => useRecipientPicker(NO_CONTACTS, jest.fn()));

    expect(result.current.isFormOpen).toBe(true);
    expect(result.current.canCloseForm).toBe(false);
  });

  it("con contactos el formulario se abre y se cierra a petición", () => {
    const { result } = renderHook(() => useRecipientPicker(SOME_CONTACTS, jest.fn()));
    expect(result.current.isFormOpen).toBe(false);

    act(() => result.current.openForm());
    expect(result.current.isFormOpen).toBe(true);

    act(() => result.current.closeForm());
    expect(result.current.isFormOpen).toBe(false);
  });

  it("[SPEC-CT-R09][SPEC-CT-R10] un contacto nuevo se agrega en orden, cierra el formulario y queda seleccionado", () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useRecipientPicker(SOME_CONTACTS, onSelect));
    act(() => result.current.openForm());

    act(() => result.current.addContact(BEATRIZ));

    expect(result.current.contacts.map((contact) => contact.name)).toEqual([
      "Beatriz Ríos",
      "Carlos Núñez",
    ]);
    expect(result.current.isFormOpen).toBe(false);
    expect(onSelect).toHaveBeenCalledWith(BEATRIZ);
  });
});
