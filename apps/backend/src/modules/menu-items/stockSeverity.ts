import type { StockSeverity } from "@minibox/shared";

export function computeStockSeverity(
  stock: number,
  warningThreshold: number,
  criticalThreshold: number,
): StockSeverity {
  if (stock <= criticalThreshold) {
    return "critical";
  }
  if (stock <= warningThreshold) {
    return "warning";
  }
  return "ok";
}
