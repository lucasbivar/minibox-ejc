import { z } from "zod";

const numericQueryParam = z
  .string()
  .regex(/^\d+$/, "Deve ser um número.")
  .transform((value) => Number(value));

export const listDebtorsQuerySchema = z.object({
  teamId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(["name", "team", "value"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: numericQueryParam.optional(),
  pageSize: numericQueryParam.optional(),
});

export type ListDebtorsQuerySchema = z.infer<typeof listDebtorsQuerySchema>;
