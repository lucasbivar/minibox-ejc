import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { createAuthenticatedUser, createTestMenuItem } from "../../test/factories";

const app = createApp();

describe("POST /menu-items", () => {
  it("cria um item de cardápio", async () => {
    const { authHeader } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/menu-items")
      .set("Authorization", authHeader)
      .send({ number: 5, description: "Coxinha", price: 6.5, stock: 50 });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ number: 5, description: "Coxinha", price: 6.5, stock: 50 });
  });

  it("rejeita número duplicado", async () => {
    const { authHeader } = await createAuthenticatedUser();
    await createTestMenuItem({ number: 7 });

    const response = await request(app)
      .post("/menu-items")
      .set("Authorization", authHeader)
      .send({ number: 7, description: "Refrigerante", price: 5, stock: 10 });

    expect(response.status).toBe(409);
  });

  it("rejeita preço não positivo", async () => {
    const { authHeader } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/menu-items")
      .set("Authorization", authHeader)
      .send({ number: 8, description: "Água", price: 0, stock: 10 });

    expect(response.status).toBe(400);
  });

  it("usa limiares padrão (10 e 0) quando não informados", async () => {
    const { authHeader } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/menu-items")
      .set("Authorization", authHeader)
      .send({ number: 9, description: "Coxinha", price: 6, stock: 5 });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ warningThreshold: 10, criticalThreshold: 0, severity: "warning" });
  });

  it("permite customizar os limiares de alerta (amarelo) e crítico (vermelho)", async () => {
    const { authHeader } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/menu-items")
      .set("Authorization", authHeader)
      .send({ number: 10, description: "Água", price: 3, stock: 8, warningThreshold: 20, criticalThreshold: 5 });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ warningThreshold: 20, criticalThreshold: 5, severity: "warning" });
  });

  it("rejeita limite crítico maior ou igual ao limite de alerta", async () => {
    const { authHeader } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/menu-items")
      .set("Authorization", authHeader)
      .send({ number: 11, description: "Suco", price: 4, stock: 8, warningThreshold: 5, criticalThreshold: 5 });

    expect(response.status).toBe(400);
  });
});

describe("GET /menu-items", () => {
  it("lista todos os itens cadastrados", async () => {
    const { authHeader } = await createAuthenticatedUser();
    await createTestMenuItem({ number: 1 });
    await createTestMenuItem({ number: 2 });

    const response = await request(app).get("/menu-items").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it("não lista itens excluídos (soft delete)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    await createTestMenuItem({ number: 1 });
    await createTestMenuItem({ number: 2, deletedAt: new Date() });

    const response = await request(app).get("/menu-items").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].number).toBe(1);
  });
});

describe("DELETE /menu-items/:id", () => {
  it("exclui um item do cardápio (soft delete)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const item = await createTestMenuItem({ number: 1 });

    const response = await request(app).delete(`/menu-items/${item.id}`).set("Authorization", authHeader);
    expect(response.status).toBe(204);

    const listResponse = await request(app).get("/menu-items").set("Authorization", authHeader);
    expect(listResponse.body.map((i: { id: string }) => i.id)).not.toContain(item.id);
  });

  it("rejeita exclusão de item já excluído", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const item = await createTestMenuItem({ deletedAt: new Date() });

    const response = await request(app).delete(`/menu-items/${item.id}`).set("Authorization", authHeader);

    expect(response.status).toBe(409);
  });

  it("retorna 404 para item inexistente", async () => {
    const { authHeader } = await createAuthenticatedUser();

    const response = await request(app)
      .delete("/menu-items/00000000-0000-0000-0000-000000000000")
      .set("Authorization", authHeader);

    expect(response.status).toBe(404);
  });
});

describe("PATCH /menu-items/:id", () => {
  it("edita descrição e preço", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const item = await createTestMenuItem({ description: "Antigo", price: 5 });

    const response = await request(app)
      .patch(`/menu-items/${item.id}`)
      .set("Authorization", authHeader)
      .send({ description: "Novo", price: 7.5 });

    expect(response.status).toBe(200);
    expect(response.body.description).toBe("Novo");
    expect(response.body.price).toBe(7.5);
  });

  it("permite customizar os limiares de amarelo e vermelho de um item existente", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const item = await createTestMenuItem({ stock: 8, warningThreshold: 10, criticalThreshold: 0 });

    const response = await request(app)
      .patch(`/menu-items/${item.id}`)
      .set("Authorization", authHeader)
      .send({ warningThreshold: 15, criticalThreshold: 6 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ warningThreshold: 15, criticalThreshold: 6, severity: "warning" });
  });

  it("rejeita atualização que deixaria o limite crítico maior ou igual ao de alerta", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const item = await createTestMenuItem({ warningThreshold: 10, criticalThreshold: 0 });

    const response = await request(app)
      .patch(`/menu-items/${item.id}`)
      .set("Authorization", authHeader)
      .send({ criticalThreshold: 10 });

    expect(response.status).toBe(400);
  });
});

describe("POST /menu-items/:id/restock", () => {
  it("repõe estoque e registra o ajuste", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const item = await createTestMenuItem({ stock: 10 });

    const response = await request(app)
      .post(`/menu-items/${item.id}/restock`)
      .set("Authorization", authHeader)
      .send({ quantityDelta: 20, reason: "Compra semanal" });

    expect(response.status).toBe(200);
    expect(response.body.stock).toBe(30);
  });

  it("permite que o estoque fique negativo (DP-04) sem bloquear o ajuste", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const item = await createTestMenuItem({ stock: 5 });

    const response = await request(app)
      .post(`/menu-items/${item.id}/restock`)
      .set("Authorization", authHeader)
      .send({ quantityDelta: -8 });

    expect(response.status).toBe(200);
    expect(response.body.stock).toBe(-3);
  });
});

describe("GET /menu-items/alerts", () => {
  it("ordena por menor estoque e marca severidade", async () => {
    const { authHeader } = await createAuthenticatedUser();
    await createTestMenuItem({ number: 1, stock: 50 });
    await createTestMenuItem({ number: 2, stock: -3 });
    await createTestMenuItem({ number: 3, stock: 5 });

    const response = await request(app).get("/menu-items/alerts").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.items.map((i: { number: number }) => i.number)).toEqual([2, 3, 1]);
    expect(response.body.items[0].severity).toBe("critical");
    expect(response.body.items[1].severity).toBe("warning");
    expect(response.body.items[2].severity).toBe("ok");
    expect(response.body.criticalCount).toBe(1);
    expect(response.body.warningCount).toBe(1);
  });

  it("respeita limiares customizados por item ao calcular a severidade", async () => {
    const { authHeader } = await createAuthenticatedUser();
    // Estoque de 8 seria "ok" com os limiares padrão, mas este item usa limiares mais altos.
    await createTestMenuItem({ number: 4, stock: 8, warningThreshold: 20, criticalThreshold: 10 });

    const response = await request(app).get("/menu-items/alerts").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.items[0]).toMatchObject({ number: 4, severity: "critical" });
    expect(response.body.criticalCount).toBe(1);
  });
});

describe("PATCH /menu-items/:id/availability", () => {
  it("marca um item como indisponível", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const item = await createTestMenuItem({ available: true });

    const response = await request(app)
      .patch(`/menu-items/${item.id}/availability`)
      .set("Authorization", authHeader)
      .send({ available: false });

    expect(response.status).toBe(200);
    expect(response.body.available).toBe(false);
  });

  it("marca um item como disponível novamente", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const item = await createTestMenuItem({ available: false });

    const response = await request(app)
      .patch(`/menu-items/${item.id}/availability`)
      .set("Authorization", authHeader)
      .send({ available: true });

    expect(response.status).toBe(200);
    expect(response.body.available).toBe(true);
  });
});
