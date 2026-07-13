import { LOW_STOCK_WARNING_THRESHOLD, type StockSeverity } from "@minibox/shared";

export function computeStockSeverity(stock: number): StockSeverity {
  if (stock <= 0) {
    return "critical";
  }
  if (stock <= LOW_STOCK_WARNING_THRESHOLD) {
    return "warning";
  }
  return "ok";
}
