import { DEFAULT_CRITICAL_STOCK_THRESHOLD, LOW_STOCK_WARNING_THRESHOLD } from "@minibox/shared";
import { z } from "zod";

export const createMenuItemSchema = z
  .object({
    number: z.number().int("O número do item deve ser inteiro.").positive("O número do item deve ser positivo."),
    description: z.string().trim().min(1, "Informe a descrição do item."),
    price: z.number().positive("O preço deve ser maior que zero."),
    stock: z.number().int("O estoque inicial deve ser um número inteiro.").min(0, "O estoque inicial não pode ser negativo.").default(0),
    warningThreshold: z.number().int("O limite de alerta deve ser um número inteiro.").default(LOW_STOCK_WARNING_THRESHOLD),
    criticalThreshold: z.number().int("O limite crítico deve ser um número inteiro.").default(DEFAULT_CRITICAL_STOCK_THRESHOLD),
  })
  .refine((data) => data.criticalThreshold < data.warningThreshold, {
    message: "O limite crítico (vermelho) deve ser menor que o limite de alerta (amarelo).",
    path: ["criticalThreshold"],
  });

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

export const updateMenuItemSchema = z
  .object({
    number: z.number().int().positive().optional(),
    description: z.string().trim().min(1).optional(),
    price: z.number().positive().optional(),
    warningThreshold: z.number().int("O limite de alerta deve ser um número inteiro.").optional(),
    criticalThreshold: z.number().int("O limite crítico deve ser um número inteiro.").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Informe ao menos um campo para atualizar." })
  .refine(
    (data) =>
      data.warningThreshold === undefined ||
      data.criticalThreshold === undefined ||
      data.criticalThreshold < data.warningThreshold,
    {
      message: "O limite crítico (vermelho) deve ser menor que o limite de alerta (amarelo).",
      path: ["criticalThreshold"],
    },
  );

export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;

export const restockMenuItemSchema = z.object({
  quantityDelta: z.number().int("O ajuste deve ser um número inteiro.").refine((value) => value !== 0, {
    message: "Informe uma quantidade diferente de zero.",
  }),
  reason: z.string().trim().max(280).optional(),
});

export type RestockMenuItemInput = z.infer<typeof restockMenuItemSchema>;

export const setMenuItemAvailabilitySchema = z.object({
  available: z.boolean(),
});

export type SetMenuItemAvailabilityInput = z.infer<typeof setMenuItemAvailabilitySchema>;
