import { z } from "zod";

export const createMenuItemSchema = z.object({
  number: z.number().int("O número do item deve ser inteiro.").positive("O número do item deve ser positivo."),
  description: z.string().trim().min(1, "Informe a descrição do item."),
  price: z.number().positive("O preço deve ser maior que zero."),
  stock: z.number().int("O estoque inicial deve ser um número inteiro.").min(0, "O estoque inicial não pode ser negativo.").default(0),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

export const updateMenuItemSchema = z
  .object({
    number: z.number().int().positive().optional(),
    description: z.string().trim().min(1).optional(),
    price: z.number().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Informe ao menos um campo para atualizar." });

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
