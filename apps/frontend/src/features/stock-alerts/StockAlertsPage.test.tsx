import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../test/mswServer";
import { renderWithProviders } from "../../test/renderWithProviders";
import { StockAlertsPage } from "./StockAlertsPage";

const ALERTS = {
  items: [
    { id: "1", number: 2, description: "Refrigerante", price: 5, stock: -3, available: true, createdAt: new Date().toISOString(), severity: "critical" },
    { id: "2", number: 3, description: "Suco", price: 4, stock: 5, available: true, createdAt: new Date().toISOString(), severity: "warning" },
    { id: "3", number: 1, description: "Água", price: 3, stock: 50, available: true, createdAt: new Date().toISOString(), severity: "ok" },
  ],
  criticalCount: 1,
};

describe("StockAlertsPage", () => {
  it("lista itens ordenados por menor estoque com destaque de severidade (RF-28, RF-29)", async () => {
    server.use(http.get("*/menu-items/alerts", () => HttpResponse.json(ALERTS)));
    renderWithProviders(<StockAlertsPage />);

    expect(await screen.findByText("1 item(ns) com estoque zerado ou negativo.")).toBeInTheDocument();

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("Refrigerante")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Suco")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Água")).toBeInTheDocument();
  });

  it("permite repor estoque diretamente na tela de alerta (RF-30)", async () => {
    server.use(
      http.get("*/menu-items/alerts", () => HttpResponse.json(ALERTS)),
      http.post("*/menu-items/1/restock", async ({ request }) => {
        const body = (await request.json()) as { quantityDelta: number };
        expect(body.quantityDelta).toBe(15);
        return HttpResponse.json({ ...ALERTS.items[0], stock: 12 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<StockAlertsPage />);

    const refrigeranteRow = (await screen.findByText("Refrigerante")).closest("tr")!;
    await user.click(within(refrigeranteRow).getByRole("button", { name: /repor estoque/i }));
    const stockInput = within(refrigeranteRow).getByLabelText(/repor estoque de refrigerante/i);
    expect(stockInput).toHaveValue("-3");
    await user.clear(stockInput);
    await user.type(stockInput, "12");
    await user.click(within(refrigeranteRow).getByRole("button", { name: /confirmar/i }));

    await waitFor(() => expect(within(refrigeranteRow).queryByRole("button", { name: /confirmar/i })).not.toBeInTheDocument());
  });
});
