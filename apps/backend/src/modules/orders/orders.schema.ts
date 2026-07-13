import { OrderStatus, PaymentCondition, PaymentMethod } from "@minibox/shared";
import { z } from "zod";

export const paymentConditionSchema = z.enum([PaymentCondition.ON_CREDIT, PaymentCondition.IMMEDIATE]);
export const paymentMethodSchema = z.enum([PaymentMethod.CASH, PaymentMethod.PIX, PaymentMethod.CARD]);
const orderStatusSchema = z.enum([OrderStatus.ACTIVE, OrderStatus.CANCELLED]);

const orderItemInputSchema = z.object({
  menuItemId: z.string().uuid("Item de cardápio inválido."),
  quantity: z.number().int("A quantidade deve ser inteira.").positive("A quantidade deve ser maior que zero."),
});

export const createOrderSchema = z
  .object({
    participantId: z.string().uuid("Selecione um participante válido."),
    condition: paymentConditionSchema,
    paymentMethod: paymentMethodSchema.nullish(),
    items: z.array(orderItemInputSchema).min(1, "Adicione ao menos um item ao pedido."),
  })
  .superRefine((data, ctx) => {
    if (data.condition === PaymentCondition.ON_CREDIT && data.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Forma de pagamento não se aplica a pedidos fiado (RN-03).",
        path: ["paymentMethod"],
      });
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

const numericQueryParam = z
  .string()
  .regex(/^\d+$/, "Deve ser um número.")
  .transform((value) => Number(value));

export const listOrdersQuerySchema = z.object({
  page: numericQueryParam.optional(),
  pageSize: numericQueryParam.optional(),
  teamId: z.string().uuid().optional(),
  participantId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  condition: paymentConditionSchema.optional(),
  status: orderStatusSchema.optional(),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
