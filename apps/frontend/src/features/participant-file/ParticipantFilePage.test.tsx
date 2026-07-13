import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../test/mswServer";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ParticipantFilePage } from "./ParticipantFilePage";

const FILE = {
  participant: {
    id: "p1",
    name: "Maria Silva",
    phone: "+55 (11) 91234-5678",
    teamId: "t1",
    teamName: "Bandinha",
    photoUrl: null,
    createdAt: new Date().toISOString(),
  },
  totalConsumed: 100,
  totalPaid: 40,
  outstandingBalance: 60,
  orders: [
    {
      id: "o1",
      participantId: "p1",
      participantName: "Maria Silva",
      teamId: "t1",
      teamName: "Bandinha",
      dateTime: new Date().toISOString(),
      condition: "ON_CREDIT",
      paymentMethod: null,
      totalAmount: 60,
      status: "ACTIVE",
      items: [{ id: "oi1", menuItemId: "m1", description: "Coxinha", quantity: 2, unitPrice: 30, subtotal: 60, dateTime: new Date().toISOString() }],
    },
  ],
  settlements: [
    { id: "s1", participantId: "p1", amount: 40, paymentMethod: "PIX", dateTime: new Date().toISOString() },
  ],
};

describe("ParticipantFilePage", () => {
  it("exibe dados cadastrais, situação financeira e históricos (RF-36 a RF-39)", async () => {
    server.use(http.get("*/participants/p1/file", () => HttpResponse.json(FILE)));

    renderWithProviders(<ParticipantFilePage />, { route: "/participantes/p1", path: "/participantes/:id" });

    expect(await screen.findByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("Bandinha")).toBeInTheDocument();
    expect(screen.getByText(/2x Coxinha/)).toBeInTheDocument();
    expect(screen.getAllByText(/pix/i).length).toBeGreaterThan(0);
  });

  it("registra quitação total (RF-40)", async () => {
    server.use(
      http.get("*/participants/p1/file", () => HttpResponse.json(FILE)),
      http.post("*/participants/p1/settlements", async ({ request }) => {
        const body = (await request.json()) as { amount: number; paymentMethod: string };
        expect(body).toEqual({ amount: 60, paymentMethod: "CASH" });
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ParticipantFilePage />, { route: "/participantes/p1", path: "/participantes/:id" });

    await screen.findByText("Maria Silva");
    await user.click(screen.getByRole("button", { name: /quitar tudo/i }));

    expect(await screen.findByText("Quitação registrada com sucesso.")).toBeInTheDocument();
  });

  it("registra quitação parcial com valor informado", async () => {
    server.use(
      http.get("*/participants/p1/file", () => HttpResponse.json(FILE)),
      http.post("*/participants/p1/settlements", async ({ request }) => {
        const body = (await request.json()) as { amount: number; paymentMethod: string };
        expect(body).toEqual({ amount: 20, paymentMethod: "CASH" });
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ParticipantFilePage />, { route: "/participantes/p1", path: "/participantes/:id" });

    await screen.findByText("Maria Silva");
    await user.type(screen.getByLabelText(/^valor a quitar/i), "20");
    await user.click(screen.getByRole("button", { name: /quitar parcial/i }));

    await waitFor(() => expect(screen.getByLabelText(/^valor a quitar/i)).toHaveValue(""));
  });

  it("permite excluir o participante pela ficha", async () => {
    server.use(
      http.get("*/participants/p1/file", () => HttpResponse.json(FILE)),
      http.delete("*/participants/p1", () => new HttpResponse(null, { status: 204 })),
    );

    const user = userEvent.setup();
    renderWithProviders(<ParticipantFilePage />, { route: "/participantes/p1", path: "/participantes/:id" });

    await screen.findByText("Maria Silva");
    await user.click(screen.getByRole("button", { name: /excluir participante/i }));
    await user.click(await screen.findByRole("button", { name: /^excluir$/i }));

    await waitFor(() => expect(screen.queryByText(/tem certeza que deseja excluir/i)).not.toBeInTheDocument());
  });

  it("permite excluir um pedido ativo na aba de pedidos", async () => {
    server.use(
      http.get("*/participants/p1/file", () => HttpResponse.json(FILE)),
      http.post("*/orders/o1/cancel", () => HttpResponse.json({ ...FILE.orders[0], status: "CANCELLED" })),
    );

    const user = userEvent.setup();
    renderWithProviders(<ParticipantFilePage />, { route: "/participantes/p1", path: "/participantes/:id" });

    await screen.findByText("Maria Silva");
    await user.click(screen.getByRole("button", { name: /excluir pedido/i }));
    await user.click(await screen.findByRole("button", { name: /^excluir$/i }));

    await waitFor(() =>
      expect(screen.queryByText(/tem certeza que deseja excluir este pedido/i)).not.toBeInTheDocument(),
    );
  });
});
