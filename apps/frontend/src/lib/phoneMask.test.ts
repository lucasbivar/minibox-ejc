import { describe, expect, it } from "vitest";
import { formatBrazilPhone } from "./phoneMask";

describe("formatBrazilPhone", () => {
  it("retorna vazio quando não há dígitos", () => {
    expect(formatBrazilPhone("")).toBe("");
  });

  it("formata progressivamente enquanto o usuário digita", () => {
    expect(formatBrazilPhone("11")).toBe("+55 (11)");
    expect(formatBrazilPhone("119123")).toBe("+55 (11) 9123");
  });

  it("formata celular completo (9 dígitos) no padrão +55 (00) 00000-0000", () => {
    expect(formatBrazilPhone("11912345678")).toBe("+55 (11) 91234-5678");
  });

  it("formata telefone fixo (8 dígitos)", () => {
    expect(formatBrazilPhone("1132345678")).toBe("+55 (11) 3234-5678");
  });

  it("ignora caracteres não numéricos e limita a 11 dígitos", () => {
    expect(formatBrazilPhone("+55 (11) 91234-5678999")).toBe("+55 (11) 91234-5678");
  });
});
