import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import {
  createAuthenticatedUser,
  createTestMenuItem,
  createTestParticipant,
} from "../../test/factories";

const app = createApp();

describe("POST /orders", () => {
  it("cria um pedido imediato, congela o preço e desconta o estoque", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    const item = await createTestMenuItem({ price: 6.5, stock: 20 });

    const response = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({
        participantId: participant.id,
        condition: "IMMEDIATE",
        paymentMethod: "PIX",
        items: [{ menuItemId: item.id, quantity: 3 }],
      });

    expect(response.status).toBe(201);
    expect(response.body.totalAmount).toBe(19.5);
    expect(response.body.condition).toBe("IMMEDIATE");
    expect(response.body.paymentMethod).toBe("PIX");
    expect(response.body.items[0].unitPrice).toBe(6.5);
    expect(response.body.items[0].subtotal).toBe(19.5);

    const menuItemResponse = await request(app).get("/menu-items").set("Authorization", authHeader);
    const updatedItem = menuItemResponse.body.find((i: { id: string }) => i.id === item.id);
    expect(updatedItem.stock).toBe(17);
  });

  it("ignora o preço enviado pelo cliente e usa o preço vigente no cardápio (RN-01/DP-06)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    const item = await createTestMenuItem({ price: 10, stock: 5 });

    const response = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({
        participantId: participant.id,
        condition: "ON_CREDIT",
        items: [{ menuItemId: item.id, quantity: 1, unitPrice: 0.01 }],
      });

    expect(response.status).toBe(201);
    expect(response.body.items[0].unitPrice).toBe(10);
  });

  it("permite finalizar a venda mesmo sem estoque suficiente, deixando o estoque negativo (DP-04)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    const item = await createTestMenuItem({ stock: 2 });

    const response = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({
        participantId: participant.id,
        condition: "ON_CREDIT",
        items: [{ menuItemId: item.id, quantity: 5 }],
      });

    expect(response.status).toBe(201);

    const menuItemResponse = await request(app).get("/menu-items").set("Authorization", authHeader);
    const updatedItem = menuItemResponse.body.find((i: { id: string }) => i.id === item.id);
    expect(updatedItem.stock).toBe(-3);
  });

  it("rejeita forma de pagamento quando o pedido é fiado (RN-03)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    const item = await createTestMenuItem();

    const response = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({
        participantId: participant.id,
        condition: "ON_CREDIT",
        paymentMethod: "CASH",
        items: [{ menuItemId: item.id, quantity: 1 }],
      });

    expect(response.status).toBe(400);
  });

  it("permite pagamento imediato sem forma de pagamento (DP-05, opcional)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    const item = await createTestMenuItem();

    const response = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({
        participantId: participant.id,
        condition: "IMMEDIATE",
        items: [{ menuItemId: item.id, quantity: 1 }],
      });

    expect(response.status).toBe(201);
    expect(response.body.paymentMethod).toBeNull();
  });

  it("rejeita pedido sem itens", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();

    const response = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({ participantId: participant.id, condition: "IMMEDIATE", items: [] });

    expect(response.status).toBe(400);
  });

  it("rejeita item marcado como indisponível", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    const item = await createTestMenuItem({ available: false });

    const response = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({
        participantId: participant.id,
        condition: "IMMEDIATE",
        items: [{ menuItemId: item.id, quantity: 1 }],
      });

    expect(response.status).toBe(409);
  });

  it("rejeita pedido para participante excluído", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant({ deletedAt: new Date() });
    const item = await createTestMenuItem();

    const response = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({
        participantId: participant.id,
        condition: "IMMEDIATE",
        items: [{ menuItemId: item.id, quantity: 1 }],
      });

    expect(response.status).toBe(409);
  });
});

describe("POST /orders/:id/cancel", () => {
  it("cancela um pedido ativo, devolve o estoque e preserva o registro (RF-18/RN-06)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    const item = await createTestMenuItem({ stock: 10 });

    const createResponse = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({
        participantId: participant.id,
        condition: "ON_CREDIT",
        items: [{ menuItemId: item.id, quantity: 4 }],
      });

    const orderId = createResponse.body.id;

    const cancelResponse = await request(app)
      .post(`/orders/${orderId}/cancel`)
      .set("Authorization", authHeader);

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.status).toBe("CANCELLED");

    const menuItemResponse = await request(app).get("/menu-items").set("Authorization", authHeader);
    const updatedItem = menuItemResponse.body.find((i: { id: string }) => i.id === item.id);
    expect(updatedItem.stock).toBe(10);

    const orderResponse = await request(app).get(`/orders/${orderId}`).set("Authorization", authHeader);
    expect(orderResponse.status).toBe(200);
    expect(orderResponse.body.status).toBe("CANCELLED");
  });

  it("rejeita cancelar um pedido já cancelado", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    const item = await createTestMenuItem();

    const createResponse = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({
        participantId: participant.id,
        condition: "IMMEDIATE",
        items: [{ menuItemId: item.id, quantity: 1 }],
      });

    const orderId = createResponse.body.id;
    await request(app).post(`/orders/${orderId}/cancel`).set("Authorization", authHeader);

    const secondCancel = await request(app).post(`/orders/${orderId}/cancel`).set("Authorization", authHeader);
    expect(secondCancel.status).toBe(409);
  });
});

describe("GET /orders", () => {
  it("lista pedidos com o mais recente primeiro e envelope de paginação", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    const item = await createTestMenuItem();

    const firstOrder = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({ participantId: participant.id, condition: "IMMEDIATE", items: [{ menuItemId: item.id, quantity: 1 }] });
    const secondOrder = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({ participantId: participant.id, condition: "ON_CREDIT", items: [{ menuItemId: item.id, quantity: 1 }] });

    const response = await request(app).get("/orders").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.page).toBe(1);
    expect(response.body.items[0].id).toBe(secondOrder.body.id);
    expect(response.body.items[1].id).toBe(firstOrder.body.id);
  });

  it("pagina os resultados", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    const item = await createTestMenuItem();

    for (let i = 0; i < 3; i += 1) {
      await request(app)
        .post("/orders")
        .set("Authorization", authHeader)
        .send({ participantId: participant.id, condition: "IMMEDIATE", items: [{ menuItemId: item.id, quantity: 1 }] });
    }

    const response = await request(app)
      .get("/orders")
      .query({ page: 2, pageSize: 2 })
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.page).toBe(2);
    expect(response.body.pageSize).toBe(2);
  });

  it("filtra por status e condição", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    const item = await createTestMenuItem();

    const creditOrder = await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({ participantId: participant.id, condition: "ON_CREDIT", items: [{ menuItemId: item.id, quantity: 1 }] });
    await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({ participantId: participant.id, condition: "IMMEDIATE", items: [{ menuItemId: item.id, quantity: 1 }] });
    await request(app).post(`/orders/${creditOrder.body.id}/cancel`).set("Authorization", authHeader);

    const cancelledResponse = await request(app)
      .get("/orders")
      .query({ status: "CANCELLED" })
      .set("Authorization", authHeader);
    expect(cancelledResponse.body.items).toHaveLength(1);
    expect(cancelledResponse.body.items[0].status).toBe("CANCELLED");

    const immediateResponse = await request(app)
      .get("/orders")
      .query({ condition: "IMMEDIATE" })
      .set("Authorization", authHeader);
    expect(immediateResponse.body.items).toHaveLength(1);
    expect(immediateResponse.body.items[0].condition).toBe("IMMEDIATE");
  });

  it("filtra por participante via busca por nome", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participantA = await createTestParticipant({ name: "Alice" });
    const participantB = await createTestParticipant({ name: "Bruno" });
    const item = await createTestMenuItem();

    await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({ participantId: participantA.id, condition: "IMMEDIATE", items: [{ menuItemId: item.id, quantity: 1 }] });
    await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({ participantId: participantB.id, condition: "IMMEDIATE", items: [{ menuItemId: item.id, quantity: 1 }] });

    const response = await request(app).get("/orders").query({ search: "alice" }).set("Authorization", authHeader);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].participantName).toBe("Alice");
  });
});
