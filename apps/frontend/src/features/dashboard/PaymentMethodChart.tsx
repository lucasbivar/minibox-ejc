import { Title } from "@mantine/core";
import { PAYMENT_METHOD_LABELS, PaymentMethod, type PaymentMethodDistributionDto } from "@minibox/shared";
import { formatCurrency } from "../../lib/format";

const COLOR_BY_METHOD: Record<PaymentMethod, string> = {
  CASH: "var(--viz-cat-1)",
  PIX: "var(--viz-cat-2)",
  CARD: "var(--viz-cat-3)",
};

export function PaymentMethodChart({ distribution }: { distribution: PaymentMethodDistributionDto[] }) {
  const total = distribution.reduce((sum, entry) => sum + entry.totalAmount, 0);

  return (
    <div>
      <Title order={2} mb="sm">
        Distribuição por forma de pagamento
      </Title>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {distribution.map((entry) => (
          <span key={entry.method} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem" }}>
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: COLOR_BY_METHOD[entry.method],
                display: "inline-block",
              }}
            />
            {PAYMENT_METHOD_LABELS[entry.method]}: <strong>{formatCurrency(entry.totalAmount)}</strong> ({entry.count})
          </span>
        ))}
      </div>

      <div style={{ display: "flex", height: 20, borderRadius: 999, overflow: "hidden" }}>
        {total === 0 ? (
          <div style={{ width: "100%", backgroundColor: "var(--viz-sequential-track)" }} />
        ) : (
          distribution
            .filter((entry) => entry.totalAmount > 0)
            .map((entry) => (
              <div
                key={entry.method}
                title={`${PAYMENT_METHOD_LABELS[entry.method]}: ${formatCurrency(entry.totalAmount)}`}
                style={{
                  width: `${(entry.totalAmount / total) * 100}%`,
                  backgroundColor: COLOR_BY_METHOD[entry.method],
                }}
              />
            ))
        )}
      </div>
    </div>
  );
}
