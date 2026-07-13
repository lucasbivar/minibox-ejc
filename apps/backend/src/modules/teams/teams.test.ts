import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { createAuthenticatedUser, createTestParticipant, createTestTeam } from "../../test/factories";

const app = createApp();

describe("GET /teams", () => {
  it("exige autenticação", async () => {
    const response = await request(app).get("/teams");
    expect(response.status).toBe(401);
  });

  it("lista as equipes cadastradas em ordem alfabética", async () => {
    const { authHeader } = await createAuthenticatedUser();
    await createTestTeam({ name: "Zeladoria" });
    await createTestTeam({ name: "Bandinha" });

    const response = await request(app).get("/teams").set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.map((t: { name: string }) => t.name)).toEqual(["Bandinha", "Zeladoria"]);
  });
});

describe("POST /teams", () => {
  it("cria uma nova equipe", async () => {
    const { authHeader } = await createAuthenticatedUser();

    const response = await request(app).post("/teams").set("Authorization", authHeader).send({ name: "Ordem" });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Ordem");
  });

  it("rejeita nome duplicado", async () => {
    const { authHeader } = await createAuthenticatedUser();
    await createTestTeam({ name: "Ordem" });

    const response = await request(app).post("/teams").set("Authorization", authHeader).send({ name: "Ordem" });

    expect(response.status).toBe(409);
  });

  it("rejeita nome vazio", async () => {
    const { authHeader } = await createAuthenticatedUser();

    const response = await request(app).post("/teams").set("Authorization", authHeader).send({ name: "  " });

    expect(response.status).toBe(400);
  });
});

describe("DELETE /teams/:id", () => {
  it("exclui uma equipe sem participantes vinculados", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const team = await createTestTeam({ name: "Equipe Vazia" });

    const response = await request(app).delete(`/teams/${team.id}`).set("Authorization", authHeader);
    expect(response.status).toBe(204);

    const listResponse = await request(app).get("/teams").set("Authorization", authHeader);
    expect(listResponse.body.map((t: { id: string }) => t.id)).not.toContain(team.id);
  });

  it("rejeita exclusão de equipe com participantes vinculados", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const team = await createTestTeam({ name: "Equipe Com Gente" });
    await createTestParticipant({ teamId: team.id });

    const response = await request(app).delete(`/teams/${team.id}`).set("Authorization", authHeader);

    expect(response.status).toBe(409);
  });

  it("retorna 404 para equipe inexistente", async () => {
    const { authHeader } = await createAuthenticatedUser();

    const response = await request(app)
      .delete("/teams/00000000-0000-0000-0000-000000000000")
      .set("Authorization", authHeader);

    expect(response.status).toBe(404);
  });

  it("rejeita exclusão de equipe já excluída", async () => {
    const { authHeader } = await createAuthenticatedUser();
    const team = await createTestTeam({ name: "Equipe Já Excluída", deletedAt: new Date() });

    const response = await request(app).delete(`/teams/${team.id}`).set("Authorization", authHeader);

    expect(response.status).toBe(409);
  });
});
