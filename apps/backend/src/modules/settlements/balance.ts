import { roundCurrency } from "../../shared/decimal";

export function calculateOutstandingBalance(totalOnCreditActive: number, totalSettled: number): number {
  return roundCurrency(totalOnCreditActive - totalSettled);
}
