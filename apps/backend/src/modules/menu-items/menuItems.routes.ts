import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  createMenuItemSchema,
  restockMenuItemSchema,
  setMenuItemAvailabilitySchema,
  updateMenuItemSchema,
} from "./menuItems.schema";
import {
  createMenuItem,
  deleteMenuItem,
  getStockAlerts,
  listMenuItems,
  restockMenuItem,
  setMenuItemAvailability,
  updateMenuItem,
} from "./menuItems.service";

export const menuItemsRouter = Router();

menuItemsRouter.use(requireAuth);

menuItemsRouter.get(
  "/alerts",
  asyncHandler(async (_req, res) => {
    const alerts = await getStockAlerts();
    res.json(alerts);
  }),
);

menuItemsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await listMenuItems();
    res.json(items);
  }),
);

menuItemsRouter.post(
  "/",
  validateBody(createMenuItemSchema),
  asyncHandler(async (req, res) => {
    const item = await createMenuItem(req.body);
    res.status(201).json(item);
  }),
);

menuItemsRouter.patch(
  "/:id",
  validateBody(updateMenuItemSchema),
  asyncHandler(async (req, res) => {
    const item = await updateMenuItem(req.params.id, req.body);
    res.json(item);
  }),
);

menuItemsRouter.patch(
  "/:id/availability",
  validateBody(setMenuItemAvailabilitySchema),
  asyncHandler(async (req, res) => {
    const item = await setMenuItemAvailability(req.params.id, req.body);
    res.json(item);
  }),
);

menuItemsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteMenuItem(req.params.id);
    res.status(204).send();
  }),
);

menuItemsRouter.post(
  "/:id/restock",
  validateBody(restockMenuItemSchema),
  asyncHandler(async (req, res) => {
    const item = await restockMenuItem(req.params.id, req.body);
    res.json(item);
  }),
);
