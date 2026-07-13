import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateBody, validateQuery } from "../../middleware/validate";
import { asyncHandler } from "../../shared/asyncHandler";
import { createOrderSchema, listOrdersQuerySchema, type ListOrdersQuery } from "./orders.schema";
import { cancelOrder, createOrder, getOrderById, listOrders } from "./orders.service";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

ordersRouter.get(
  "/",
  validateQuery(listOrdersQuerySchema),
  asyncHandler(async (req, res) => {
    const result = await listOrders(req.query as unknown as ListOrdersQuery);
    res.json(result);
  }),
);

ordersRouter.post(
  "/",
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    const order = await createOrder(req.body, req.userId);
    res.status(201).json(order);
  }),
);

ordersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await getOrderById(req.params.id);
    res.json(order);
  }),
);

ordersRouter.post(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const order = await cancelOrder(req.params.id);
    res.json(order);
  }),
);
