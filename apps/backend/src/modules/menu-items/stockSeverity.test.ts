import { describe, expect, it } from "vitest";
import { computeStockSeverity } from "./stockSeverity";

describe("computeStockSeverity", () => {
  it("marca estoque no limite crítico (ou abaixo) como crítico", () => {
    expect(computeStockSeverity(0, 10, 0)).toBe("critical");
    expect(computeStockSeverity(-5, 10, 0)).toBe("critical");
  });

  it("marca estoque acima do crítico mas até o limite de alerta como aviso", () => {
    expect(computeStockSeverity(1, 10, 0)).toBe("warning");
    expect(computeStockSeverity(10, 10, 0)).toBe("warning");
  });

  it("marca estoque acima do limite de alerta como ok", () => {
    expect(computeStockSeverity(11, 10, 0)).toBe("ok");
    expect(computeStockSeverity(500, 10, 0)).toBe("ok");
  });

  it("respeita limiares customizados por item", () => {
    expect(computeStockSeverity(5, 20, 5)).toBe("critical");
    expect(computeStockSeverity(6, 20, 5)).toBe("warning");
    expect(computeStockSeverity(21, 20, 5)).toBe("ok");
  });
});
