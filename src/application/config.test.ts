import { readTimeoutMs } from "./config";

describe("[SPEC-CONF-R13] tiempo límite configurable", () => {
  it("usa el valor configurado", () => {
    expect(readTimeoutMs("3000", 15_000)).toBe(3000);
  });

  it.each([undefined, "", "abc", "0", "-5"])("con %p usa el valor por defecto", (raw) => {
    expect(readTimeoutMs(raw, 15_000)).toBe(15_000);
  });
});
