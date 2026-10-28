const SIGNIFICANT = /[\d.]/;

export type MaskedEdit = {
  raw: string;
  caret: number;
  inputType: string;
};

export type MaskedChange = {
  // Valor canónico resultante, o `null` si el cambio se descarta.
  value: string | null;
  // Posición del cursor en el texto formateado que se mostrará.
  caret: number;
};

function isSignificant(char: string | undefined): boolean {
  return char !== undefined && SIGNIFICANT.test(char);
}

function countSignificant(text: string): number {
  let count = 0;
  for (const char of text) if (isSignificant(char)) count += 1;
  return count;
}

function caretAfterSignificant(formatted: string, significantBefore: number): number {
  if (significantBefore <= 0) return 0;
  let count = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (isSignificant(formatted[index])) count += 1;
    if (count === significantBefore) return index + 1;
  }
  return formatted.length;
}

// Si el usuario borró solo un separador, se borra el dígito contiguo para que la tecla tenga efecto.
function expandSeparatorDeletion({ raw, caret, inputType }: MaskedEdit): MaskedEdit {
  if (inputType === "deleteContentBackward") {
    for (let index = caret - 1; index >= 0; index -= 1) {
      if (isSignificant(raw[index])) {
        return { raw: raw.slice(0, index) + raw.slice(index + 1), caret: index, inputType };
      }
    }
  }
  if (inputType === "deleteContentForward") {
    for (let index = caret; index < raw.length; index += 1) {
      if (isSignificant(raw[index])) {
        return { raw: raw.slice(0, index) + raw.slice(index + 1), caret, inputType };
      }
    }
  }
  return { raw, caret, inputType };
}

export function applyMaskedEdit(
  edit: MaskedEdit,
  current: string,
  sanitize: (raw: string) => string | null,
  format: (value: string) => string,
): MaskedChange {
  let effective = edit;
  let value = sanitize(edit.raw);

  const isDeletion = edit.inputType.startsWith("delete");
  if (isDeletion && value === current) {
    effective = expandSeparatorDeletion(edit);
    value = sanitize(effective.raw);
  }

  // Contar desde la derecha evita saltos cuando el formato agrega separadores o quita ceros a la izquierda.
  const significantAfter = countSignificant(effective.raw.slice(effective.caret));
  const formatted = format(value ?? current);
  const significantBefore = countSignificant(formatted) - significantAfter;

  return { value, caret: caretAfterSignificant(formatted, significantBefore) };
}
