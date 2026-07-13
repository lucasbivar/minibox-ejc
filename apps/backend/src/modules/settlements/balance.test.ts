import { describe, expect, it } from "vitest";
import { calculateOutstandingBalance } from "./balance";

describe("calculateOutstandingBalance (RN-05)", () => {
  it("é igual ao total fiado quando nada foi quitado", () => {
    expect(calculateOutstandingBalance(100, 0)).toBe(100);
  });

  it("abate quitações do saldo global, sem vínculo com pedido específico", () => {
    expect(calculateOutstandingBalance(100, 40)).toBe(60);
  });

  it("chega a zero quando o total quitado cobre o total fiado", () => {
    expect(calculateOutstandingBalance(50, 50)).toBe(0);
  });

  it("arredonda para duas casas decimais", () => {
    expect(calculateOutstandingBalance(10.005, 0)).toBe(10.01);
  });
});
