import { z } from "zod";
import { paymentMethodSchema } from "../orders/orders.schema";

export const createSettlementSchema = z.object({
  amount: z.number().positive("O valor da quitação deve ser maior que zero."),
  paymentMethod: paymentMethodSchema,
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
