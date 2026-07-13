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

describe("POST /participants", () => {
  it("cadastra um participante com celular no formato BR", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const team = await createTestTeam();

    const response = await request(app)
      .post("/participants")
      .set("Authorization", authHeader)
      .send({ name: "Maria da Silva", teamId: team.id, phone: "+55 (11) 91234-5678" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: "Maria da Silva",
      teamId: team.id,
      teamName: team.name,
      phone: "+55 (11) 91234-5678",
    });
  });

  it("cadastra participante sem celular (campo opcional)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const team = await createTestTeam();

    const response = await request(app)
      .post("/participants")
      .set("Authorization", authHeader)
      .send({ name: "João Souza", teamId: team.id });

    expect(response.status).toBe(201);
    expect(response.body.phone).toBeNull();
  });

  it("rejeita celular fora do formato brasileiro", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const team = await createTestTeam();

    const response = await request(app)
      .post("/participants")
      .set("Authorization", authHeader)
      .send({ name: "Carlos", teamId: team.id, phone: "11912345678" });

    expect(response.status).toBe(400);
  });

  it("rejeita equipe inexistente", async () => {
    const { authHeader } = await createAuthenticatedUser();

    const response = await request(app)
      .post("/participants")
      .set("Authorization", authHeader)
      .send({ name: "Carlos", teamId: "00000000-0000-0000-0000-000000000000" });

    expect(response.status).toBe(404);
  });
});

describe("GET /participants", () => {
  it("busca por nome (parcial, case-insensitive)", async () => {
    const { authHeader } = await createAuthenticatedUser();
    await createTestParticipant({ name: "Ana Paula" });
    await createTestParticipant({ name: "Beatriz" });

    const response = await request(app)
      .get("/participants")
      .query({ search: "ana" })
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].name).toBe("Ana Paula");
  });

  it("filtra por equipe", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const teamA = await createTestTeam();
    const teamB = await createTestTeam();
    await createTestParticipant({ name: "Da Equipe A", teamId: teamA.id });
    await createTestParticipant({ name: "Da Equipe B", teamId: teamB.id });

    const response = await request(app)
      .get("/participants")
      .query({ teamId: teamA.id })
      .set("Authorization", authHeader);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].name).toBe("Da Equipe A");
  });

  it("pagina os resultados", async () => {
    const { authHeader } = await createAuthenticatedUser();
    await createTestParticipant({ name: "Ana" });
    await createTestParticipant({ name: "Bruno" });
    await createTestParticipant({ name: "Carla" });

    const response = await request(app)
      .get("/participants")
      .query({ page: 2, pageSize: 2 })
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(3);
    expect(response.body.page).toBe(2);
    expect(response.body.pageSize).toBe(2);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].name).toBe("Carla");
  });
});

describe("PATCH /participants/:id", () => {
  it("edita os dados do participante", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant({ name: "Nome Antigo" });

    const response = await request(app)
      .patch(`/participants/${participant.id}`)
      .set("Authorization", authHeader)
      .send({ name: "Nome Novo" });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Nome Novo");
  });

  it("retorna 404 para participante inexistente", async () => {
    const { authHeader } = await createAuthenticatedUser();

    const response = await request(app)
      .patch("/participants/00000000-0000-0000-0000-000000000000")
      .set("Authorization", authHeader)
      .send({ name: "Qualquer" });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /participants/:id", () => {
  it("exclui um participante sem histórico de pedidos ou quitações", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();

    const response = await request(app).delete(`/participants/${participant.id}`).set("Authorization", authHeader);
    expect(response.status).toBe(204);

    const getResponse = await request(app).get(`/participants/${participant.id}`).set("Authorization", authHeader);
    expect(getResponse.status).toBe(404);
  });

  it("rejeita exclusão de participante com pedidos registrados", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant();
    const item = await createTestMenuItem();

    await request(app)
      .post("/orders")
      .set("Authorization", authHeader)
      .send({ participantId: participant.id, condition: "IMMEDIATE", items: [{ menuItemId: item.id, quantity: 1 }] });

    const response = await request(app).delete(`/participants/${participant.id}`).set("Authorization", authHeader);

    expect(response.status).toBe(409);
  });

  it("retorna 404 para participante inexistente", async () => {
    const { authHeader } = await createAuthenticatedUser();

    const response = await request(app)
      .delete("/participants/00000000-0000-0000-0000-000000000000")
      .set("Authorization", authHeader);

    expect(response.status).toBe(404);
  });

  it("rejeita exclusão de participante já excluído", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const participant = await createTestParticipant({ deletedAt: new Date() });

    const response = await request(app).delete(`/participants/${participant.id}`).set("Authorization", authHeader);

    expect(response.status).toBe(409);
  });
});
