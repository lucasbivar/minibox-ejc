import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import {
  createAuthenticatedUser,
  createTestMenuItem,
  createTestParticipant,
  createTestTeam,
} from "../../test/factories";

const app = createApp();

async function placeOrder(
  authHeader: string,
  participantId: string,
  condition: "ON_CREDIT" | "IMMEDIATE",
  price: number,
  paymentMethod?: "CASH" | "PIX" | "CARD",
) {
  const item = await createTestMenuItem({ price, stock: 1000 });
  return request(app)
    .post("/orders")
    .set("Authorization", authHeader)
    .send({ participantId, condition, paymentMethod, items: [{ menuItemId: item.id, quantity: 1 }] });
}

describe("GET /dashboard/summary", () => {
  it("consolida arrecadado, em aberto, ticket médio e nº de pedidos (RF-22)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();

    await placeOrder(authHeader, participant.id, "IMMEDIATE", 30, "PIX");
    await placeOrder(authHeader, participant.id, "ON_CREDIT", 20);

    const response = await request(app).get("/dashboard/summary").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalCollected: 30,
      totalOutstanding: 20,
      averageTicket: 25,
      totalOrders: 2,
    });
  });
});

describe("GET /dashboard/top-debtors e top-payers", () => {
  it("classifica participantes por saldo devedor e por total pago", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const alice = await createTestParticipant({ name: "Alice" });
    const bob = await createTestParticipant({ name: "Bob" });

    await placeOrder(authHeader, alice.id, "ON_CREDIT", 100);
    await placeOrder(authHeader, bob.id, "IMMEDIATE", 50, "CASH");

    const debtorsResponse = await request(app).get("/dashboard/top-debtors").set("Authorization", authHeader);
    expect(debtorsResponse.body[0]).toMatchObject({ participantName: "Alice", value: 100 });

    const payersResponse = await request(app).get("/dashboard/top-payers").set("Authorization", authHeader);
    expect(payersResponse.body[0]).toMatchObject({ participantName: "Bob", value: 50 });
  });
});

describe("GET /dashboard/insights", () => {
  it("traz item campeão, distribuição por forma de pagamento e conversão fiado->pago (RF-26)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const emptyTeam = await createTestTeam({ name: "Equipe Sem Pedidos" });
    const participant = await createTestParticipant();
    const item = await createTestMenuItem({ description: "Coxinha", price: 5, stock: 1000 });

    await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({
        participantId: participant.id,
        condition: "IMMEDIATE",
        paymentMethod: "PIX",
        items: [{ menuItemId: item.id, quantity: 4 }],
      });

    await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({
        participantId: participant.id,
        condition: "ON_CREDIT",
        items: [{ menuItemId: item.id, quantity: 2 }],
      });

    await request(app)
      .post(`/participants/${participant.id}/settlements`)
      .set("Authorization", authHeader)
      .send({ amount: 5, paymentMethod: "CASH" });

    const response = await request(app).get("/dashboard/insights").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.championItem).toMatchObject({ description: "Coxinha", quantitySold: 6 });
    expect(response.body.paymentMethodDistribution).toEqual(
      expect.arrayContaining([{ method: "PIX", totalAmount: 20, count: 1 }]),
    );
    expect(response.body.creditToPaidConversionRate).toBe(0.5);
    expect(response.body.teamConsumption[0].totalConsumed).toBe(30);
    expect(response.body.topConsumingTeams[0].totalConsumed).toBe(30);
    expect(response.body.leastConsumingTeams.map((t: { teamId: string }) => t.teamId)).toContain(emptyTeam.id);
    expect(response.body.leastConsumingTeams.find((t: { teamId: string }) => t.teamId === emptyTeam.id)).toMatchObject(
      { totalConsumed: 0 },
    );
    expect(response.body.salesByPeriod.length).toBeGreaterThan(0);
    expect(response.body.salesByPeriod[0]).toMatchObject({
      day: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      period: expect.stringMatching(/^(MANHA|TARDE|NOITE)$/),
    });
    const totalFromPeriods = response.body.salesByPeriod.reduce(
      (sum: number, entry: { totalAmount: number }) => sum + entry.totalAmount,
      0,
    );
    expect(totalFromPeriods).toBe(30);
  });
});

describe("GET /dashboard/debtors", () => {
  it("lista apenas participantes com saldo devedor, ordenado por maior valor por padrão", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const team = await createTestTeam({ name: "Equipe Devedores" });
    const bigDebtor = await createTestParticipant({ name: "Zeca Grande Devedor", teamId: team.id });
    const smallDebtor = await createTestParticipant({ name: "Ana Pequena Devedora", teamId: team.id });
    const noDebt = await createTestParticipant({ name: "Bia Sem Dívida", teamId: team.id });

    await placeOrder(authHeader, bigDebtor.id, "ON_CREDIT", 100);
    await placeOrder(authHeader, smallDebtor.id, "ON_CREDIT", 20);
    await placeOrder(authHeader, noDebt.id, "IMMEDIATE", 15, "CASH");

    const response = await request(app).get("/dashboard/debtors").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.items.map((i: { participantName: string }) => i.participantName)).toEqual([
      "Zeca Grande Devedor",
      "Ana Pequena Devedora",
    ]);
    expect(response.body.items[0].outstandingBalance).toBe(100);
    expect(response.body.total).toBe(2);
  });

  it("filtra por equipe", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const teamA = await createTestTeam({ name: "Equipe A" });
    const teamB = await createTestTeam({ name: "Equipe B" });
    const participantA = await createTestParticipant({ name: "Devedor A", teamId: teamA.id });
    const participantB = await createTestParticipant({ name: "Devedor B", teamId: teamB.id });

    await placeOrder(authHeader, participantA.id, "ON_CREDIT", 50);
    await placeOrder(authHeader, participantB.id, "ON_CREDIT", 60);

    const response = await request(app)
      .get("/dashboard/debtors")
      .query({ teamId: teamA.id })
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].participantName).toBe("Devedor A");
  });

  it("busca por nome", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant({ name: "Fulano Buscável" });
    const other = await createTestParticipant({ name: "Outro Devedor" });

    await placeOrder(authHeader, participant.id, "ON_CREDIT", 30);
    await placeOrder(authHeader, other.id, "ON_CREDIT", 40);

    const response = await request(app)
      .get("/dashboard/debtors")
      .query({ search: "Buscável" })
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].participantName).toBe("Fulano Buscável");
  });

  it("ordena por nome quando solicitado", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participantZ = await createTestParticipant({ name: "Zeca" });
    const participantA = await createTestParticipant({ name: "Ana" });

    await placeOrder(authHeader, participantZ.id, "ON_CREDIT", 10);
    await placeOrder(authHeader, participantA.id, "ON_CREDIT", 10);

    const response = await request(app)
      .get("/dashboard/debtors")
      .query({ sortBy: "name", sortDir: "asc" })
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.items.map((i: { participantName: string }) => i.participantName)).toEqual([
      "Ana",
      "Zeca",
    ]);
  });
});
