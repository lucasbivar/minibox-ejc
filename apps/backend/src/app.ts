import cors from "cors";
import express, { type Express } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { menuItemsRouter } from "./modules/menu-items/menuItems.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { participantsRouter } from "./modules/participants/participants.routes";
import { teamsRouter } from "./modules/teams/teams.routes";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/teams", teamsRouter);
  app.use("/menu-items", menuItemsRouter);
  app.use("/participants", participantsRouter);
  app.use("/orders", ordersRouter);
  app.use("/dashboard", dashboardRouter);

  app.use(errorHandler);

  return app;
}
