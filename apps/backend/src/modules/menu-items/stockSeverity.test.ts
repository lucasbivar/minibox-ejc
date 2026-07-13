import { describe, expect, it } from "vitest";
import { computeStockSeverity } from "./stockSeverity";

describe("computeStockSeverity", () => {
  it("marca estoque zerado como crítico", () => {
    expect(computeStockSeverity(0)).toBe("critical");
  });

  it("marca estoque negativo como crítico", () => {
    expect(computeStockSeverity(-5)).toBe("critical");
  });

  it("marca estoque baixo (mas positivo) como alerta", () => {
    expect(computeStockSeverity(1)).toBe("warning");
    expect(computeStockSeverity(10)).toBe("warning");
  });

  it("marca estoque confortável como ok", () => {
    expect(computeStockSeverity(11)).toBe("ok");
    expect(computeStockSeverity(500)).toBe("ok");
  });
});
