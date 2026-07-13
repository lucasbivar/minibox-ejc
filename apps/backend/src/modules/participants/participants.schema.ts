import { BRAZIL_PHONE_REGEX } from "@minibox/shared";
import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(BRAZIL_PHONE_REGEX, "Celular inválido. Use o formato +55 (00) 00000-0000.")
  .nullish();

export const createParticipantSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome completo do participante."),
  teamId: z.string().uuid("Selecione uma equipe válida."),
  phone: phoneSchema,
});

export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;

export const updateParticipantSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    teamId: z.string().uuid().optional(),
    phone: phoneSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Informe ao menos um campo para atualizar." });

export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;

const numericQueryParam = z
  .string()
  .regex(/^\d+$/, "Deve ser um número.")
  .transform((value) => Number(value));

export const listParticipantsQuerySchema = z.object({
  teamId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  page: numericQueryParam.optional(),
  pageSize: numericQueryParam.optional(),
});

export type ListParticipantsQuery = z.infer<typeof listParticipantsQuerySchema>;
