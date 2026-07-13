import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import {
  createAuthenticatedUser,
  createTestMenuItem,
  createTestParticipant,
} from "../../test/factories";

const app = createApp();

async function createOrder(
  authHeader: string,
  participantId: string,
  condition: "ON_CREDIT" | "IMMEDIATE",
  amount: number,
) {
  const item = await createTestMenuItem({ price: amount, stock: 100 });
  return request(app)
    .post("/orders")
    .set("Authorization", authHeader)
    .send({
      participantId,
      condition,
      items: [{ menuItemId: item.id, quantity: 1 }],
    });
}

describe("GET /participants/:id/balance", () => {
  it("soma pedidos fiado ativos e ignora pedidos imediatos", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();

    await createOrder(authHeader, participant.id, "ON_CREDIT", 30);
    await createOrder(authHeader, participant.id, "IMMEDIATE", 50);

    const response = await request(app)
      .get(`/participants/${participant.id}/balance`)
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.outstandingBalance).toBe(30);
  });

  it("abate quitações do saldo devedor (RN-05)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();

    await createOrder(authHeader, participant.id, "ON_CREDIT", 100);
    await request(app)
      .post(`/participants/${participant.id}/settlements`)
      .set("Authorization", authHeader)
      .send({ amount: 40, paymentMethod: "PIX" });

    const response = await request(app)
      .get(`/participants/${participant.id}/balance`)
      .set("Authorization", authHeader);

    expect(response.body.outstandingBalance).toBe(60);
  });

  it("desconsidera pedidos fiado cancelados no saldo (RN-06)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();

    const orderResponse = await createOrder(authHeader, participant.id, "ON_CREDIT", 25);
    await request(app).post(`/orders/${orderResponse.body.id}/cancel`).set("Authorization", authHeader);

    const response = await request(app)
      .get(`/participants/${participant.id}/balance`)
      .set("Authorization", authHeader);

    expect(response.body.outstandingBalance).toBe(0);
  });
});

describe("POST /participants/:id/settlements", () => {
  it("registra quitação total ou parcial (RF-20)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    await createOrder(authHeader, participant.id, "ON_CREDIT", 80);

    const response = await request(app)
      .post(`/participants/${participant.id}/settlements`)
      .set("Authorization", authHeader)
      .send({ amount: 30, paymentMethod: "CASH" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ amount: 30, paymentMethod: "CASH", participantId: participant.id });
  });

  it("rejeita valor não positivo", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();

    const response = await request(app)
      .post(`/participants/${participant.id}/settlements`)
      .set("Authorization", authHeader)
      .send({ amount: 0, paymentMethod: "CASH" });

    expect(response.status).toBe(400);
  });
});

describe("GET /participants/:id/file", () => {
  it("consolida dados cadastrais, situação financeira e históricos (RF-36 a RF-39)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant({ name: "Ficha de Teste" });

    await createOrder(authHeader, participant.id, "ON_CREDIT", 40);
    await createOrder(authHeader, participant.id, "IMMEDIATE", 20);
    await request(app)
      .post(`/participants/${participant.id}/settlements`)
      .set("Authorization", authHeader)
      .send({ amount: 15, paymentMethod: "PIX" });

    const response = await request(app)
      .get(`/participants/${participant.id}/file`)
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.participant.name).toBe("Ficha de Teste");
    expect(response.body.totalConsumed).toBe(60);
    expect(response.body.totalPaid).toBe(35);
    expect(response.body.outstandingBalance).toBe(25);
    expect(response.body.orders).toHaveLength(2);
    expect(response.body.settlements).toHaveLength(1);
  });
});
