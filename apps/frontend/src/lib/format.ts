const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { timeStyle: "medium" });

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatTime(value: string | number | Date): string {
  return timeFormatter.format(new Date(value));
}
