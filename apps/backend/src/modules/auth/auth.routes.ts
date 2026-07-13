import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../shared/asyncHandler";
import { createSystemUserSchema, loginSchema } from "./auth.schema";
import { createSystemUser, login } from "./auth.service";

export const authRouter = Router();

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await login(req.body);
    res.json(result);
  }),
);

authRouter.post("/logout", requireAuth, (_req, res) => {
  res.status(204).send();
});

authRouter.post(
  "/usuarios",
  requireAuth,
  validateBody(createSystemUserSchema),
  asyncHandler(async (req, res) => {
    const user = await createSystemUser(req.body);
    res.status(201).json(user);
  }),
);
