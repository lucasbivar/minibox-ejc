import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../test/mswServer";
import { renderWithProviders } from "../../test/renderWithProviders";
import { DashboardPage } from "./DashboardPage";

const SUMMARY = { totalCollected: 500, totalOutstanding: 120, averageTicket: 25, totalOrders: 20 };
const TOP_DEBTORS = [{ participantId: "p1", participantName: "Maria", teamName: "Bandinha", value: 60 }];
const TOP_PAYERS = [{ participantId: "p2", participantName: "João", teamName: "Ordem", value: 90 }];
const TOP_ORDERS = [{ participantId: "p3", participantName: "Ana", teamName: "Ordem", value: 5 }];
const INSIGHTS = {
  topConsumers: [],
  bestSellingItemsByQuantity: [{ menuItemId: "m1", description: "Coxinha", quantitySold: 10, revenue: 60 }],
  bestSellingItemsByRevenue: [{ menuItemId: "m1", description: "Coxinha", quantitySold: 10, revenue: 60 }],
  championItem: { menuItemId: "m1", description: "Coxinha", quantitySold: 10, revenue: 60 },
  teamConsumption: [{ teamId: "t1", teamName: "Bandinha", totalConsumed: 100, totalOutstanding: 60 }],
  paymentMethodDistribution: [
    { method: "CASH", totalAmount: 100, count: 4 },
    { method: "PIX", totalAmount: 300, count: 6 },
    { method: "CARD", totalAmount: 0, count: 0 },
  ],
  salesByPeriod: [{ day: new Date().toISOString().slice(0, 10), period: "TARDE", hour: 14, totalAmount: 60, orderCount: 3 }],
  creditToPaidConversionRate: 0.42,
  zeroedDebtors: [],
  topSettlers: [],
};

function mockDashboardHandlers() {
  server.use(
    http.get("*/dashboard/summary", () => HttpResponse.json(SUMMARY)),
    http.get("*/dashboard/top-debtors", () => HttpResponse.json(TOP_DEBTORS)),
    http.get("*/dashboard/top-payers", () => HttpResponse.json(TOP_PAYERS)),
    http.get("*/dashboard/top-orders", () => HttpResponse.json(TOP_ORDERS)),
    http.get("*/dashboard/insights", () => HttpResponse.json(INSIGHTS)),
  );
}

describe("DashboardPage", () => {
  it("exibe totais gerais e horário da última atualização (RF-22, RF-27)", async () => {
    mockDashboardHandlers();
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText(/última atualização/i)).toBeInTheDocument();
    expect(screen.getByText("Total arrecadado")).toBeInTheDocument();
  });

  it("exibe rankings de devedores, pagantes e pedidos (RF-23 a RF-25)", async () => {
    mockDashboardHandlers();
    renderWithProviders(<DashboardPage />);

    // "Maria" aparece duas vezes: no novo resumo (sem valor) e no ranking detalhado de devedores.
    expect((await screen.findAllByText("Maria")).length).toBeGreaterThan(0);
    expect(screen.getByText("João")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  it("exibe item campeão e taxa de conversão fiado->pago (RF-26)", async () => {
    mockDashboardHandlers();
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText(/item campeão do encontro/i)).toHaveTextContent("Coxinha");
    expect(screen.getByText(/42% do total fiado já foi quitado/)).toBeInTheDocument();
  });
});
