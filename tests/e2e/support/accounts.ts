function luhnCheckDigit(partial: string): number {
  let sum = 0;
  for (let index = 0; index < partial.length; index += 1) {
    let digit = Number(partial[partial.length - 1 - index]);
    if (index % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return (10 - (sum % 10)) % 10;
}

// Tarjeta ficticia válida y única por prueba: el servidor rechaza duplicados y las pruebas corren en paralelo.
export function uniqueCardNumber(): string {
  const partial = `4${String(Date.now()).slice(-9)}${String(Math.floor(Math.random() * 1e5)).padStart(5, "0")}`;
  return `${partial}${luhnCheckDigit(partial)}`;
}

export function formatCard(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}
