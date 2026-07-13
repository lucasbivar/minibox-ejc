import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateQuery } from "../../middleware/validate";
import { asyncHandler } from "../../shared/asyncHandler";
import { listDebtorsQuerySchema, type ListDebtorsQuerySchema } from "./dashboard.schema";
import {
  getDashboardInsights,
  getDashboardSummary,
  getDebtors,
  getTopDebtorsRanking,
  getTopOrdersRanking,
  getTopPayersRanking,
} from "./dashboard.service";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/debtors",
  validateQuery(listDebtorsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListDebtorsQuerySchema;
    res.json(await getDebtors(query));
  }),
);

dashboardRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    res.json(await getDashboardSummary());
  }),
);

dashboardRouter.get(
  "/top-debtors",
  asyncHandler(async (_req, res) => {
    res.json(await getTopDebtorsRanking());
  }),
);

dashboardRouter.get(
  "/top-payers",
  asyncHandler(async (_req, res) => {
    res.json(await getTopPayersRanking());
  }),
);

dashboardRouter.get(
  "/top-orders",
  asyncHandler(async (_req, res) => {
    res.json(await getTopOrdersRanking());
  }),
);

dashboardRouter.get(
  "/insights",
  asyncHandler(async (_req, res) => {
    res.json(await getDashboardInsights());
  }),
);
