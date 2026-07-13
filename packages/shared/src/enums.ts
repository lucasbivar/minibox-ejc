export const PaymentCondition = {
  ON_CREDIT: "ON_CREDIT",
  IMMEDIATE: "IMMEDIATE",
} as const;
export type PaymentCondition = (typeof PaymentCondition)[keyof typeof PaymentCondition];

export const PaymentMethod = {
  CASH: "CASH",
  PIX: "PIX",
  CARD: "CARD",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const OrderStatus = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PAYMENT_CONDITION_LABELS: Record<PaymentCondition, string> = {
  ON_CREDIT: "Fiado",
  IMMEDIATE: "Imediato",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CARD: "Cartão",
};
