import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../test/mswServer";
import { renderWithProviders } from "../../test/renderWithProviders";
import { OrdersPage } from "./OrdersPage";

const TEAMS = [{ id: "t1", name: "Bandinha", createdAt: new Date().toISOString() }];

const ORDERS = [
  {
    id: "o2",
    participantId: "p1",
    participantName: "Maria Silva",
    teamId: "t1",
    teamName: "Bandinha",
    dateTime: new Date("2026-07-10T12:00:00Z").toISOString(),
    condition: "ON_CREDIT",
    paymentMethod: null,
    totalAmount: 12,
    status: "ACTIVE",
    items: [{ id: "i2", menuItemId: "m1", description: "Coxinha", quantity: 2, unitPrice: 6, subtotal: 12, dateTime: new Date().toISOString() }],
  },
  {
    id: "o1",
    participantId: "p2",
    participantName: "João Souza",
    teamId: "t1",
    teamName: "Bandinha",
    dateTime: new Date("2026-07-10T11:00:00Z").toISOString(),
    condition: "IMMEDIATE",
    paymentMethod: "PIX",
    totalAmount: 6,
    status: "ACTIVE",
    items: [{ id: "i1", menuItemId: "m1", description: "Coxinha", quantity: 1, unitPrice: 6, subtotal: 6, dateTime: new Date().toISOString() }],
  },
];

function mockBaseHandlers(items = ORDERS) {
  server.use(
    http.get("*/teams", () => HttpResponse.json(TEAMS)),
    http.get("*/orders", () => HttpResponse.json({ items, total: items.length, page: 1, pageSize: 10 })),
  );
}

describe("OrdersPage", () => {
  it("lista pedidos com o mais recente primeiro", async () => {
    mockBaseHandlers();
    renderWithProviders(<OrdersPage />);

    await screen.findByText("Maria Silva");
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Maria Silva");
    expect(rows[1]).toHaveTextContent("João Souza");
  });

  it("permite excluir um pedido ativo", async () => {
    const items = [...ORDERS];
    server.use(
      http.get("*/teams", () => HttpResponse.json(TEAMS)),
      http.get("*/orders", () => HttpResponse.json({ items, total: items.length, page: 1, pageSize: 10 })),
      http.post("*/orders/o2/cancel", () => {
        items[0] = { ...items[0], status: "CANCELLED" };
        return HttpResponse.json(items[0]);
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<OrdersPage />);
    await screen.findByText("Maria Silva");

    const row = screen.getByText("Maria Silva").closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /excluir pedido/i }));
    await user.click(await screen.findByRole("button", { name: /^excluir$/i }));

    await waitFor(() => expect(items[0].status).toBe("CANCELLED"));
  });

  it("exibe mensagem quando não há pedidos", async () => {
    mockBaseHandlers([]);
    renderWithProviders(<OrdersPage />);

    expect(await screen.findByText("Nenhum pedido encontrado.")).toBeInTheDocument();
  });
});
