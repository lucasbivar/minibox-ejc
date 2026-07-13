import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { signAuthToken } from "../../config/jwt";
import { createTestUser } from "../../test/factories";

const app = createApp();

describe("POST /auth/login", () => {
  it("autentica com credenciais válidas e retorna token", async () => {
    const { user, password } = await createTestUser({ email: "operador@minibox.local", password: "senha123" });

    const response = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toEqual({ id: user.id, name: user.name, email: user.email });
  });

  it("rejeita senha incorreta", async () => {
    const { user } = await createTestUser({ email: "operador2@minibox.local", password: "senha123" });

    const response = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password: "senha-errada" });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/incorretos/i);
  });

  it("rejeita e-mail não cadastrado", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ email: "nao-existe@minibox.local", password: "qualquer" });

    expect(response.status).toBe(401);
  });

  it("valida payload obrigatório", async () => {
    const response = await request(app).post("/auth/login").send({ email: "" });
    expect(response.status).toBe(400);
  });
});

describe("POST /auth/usuarios", () => {
  it("exige autenticação", async () => {
    const response = await request(app)
      .post("/auth/usuarios")
      .send({ name: "Novo Operador", email: "novo@minibox.local", password: "senha123" });

    expect(response.status).toBe(401);
  });

  it("cria um novo usuário quando autenticado", async () => {
    const { user, password } = await createTestUser();
    const loginResponse = await request(app).post("/auth/login").send({ email: user.email, password });
    const token = loginResponse.body.token as string;

    const response = await request(app)
      .post("/auth/usuarios")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Novo Operador", email: "novo@minibox.local", password: "senha123" });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe("novo@minibox.local");
  });

  it("impede e-mail duplicado", async () => {
    const { user, password } = await createTestUser();
    const loginResponse = await request(app).post("/auth/login").send({ email: user.email, password });
    const token = loginResponse.body.token as string;

    const response = await request(app)
      .post("/auth/usuarios")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Duplicado", email: user.email, password: "senha123" });

    expect(response.status).toBe(409);
  });
});

describe("POST /auth/logout", () => {
  it("exige autenticação", async () => {
    const response = await request(app).post("/auth/logout");
    expect(response.status).toBe(401);
  });

  it("encerra a sessão quando autenticado", async () => {
    const { user, password } = await createTestUser();
    const loginResponse = await request(app).post("/auth/login").send({ email: user.email, password });
    const token = loginResponse.body.token as string;

    const response = await request(app).post("/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(204);
  });
});

describe("requireAuth com usuário removido do banco", () => {
  it("rejeita um token válido cujo usuário não existe mais (evita erro de FK em operações posteriores)", async () => {
    const token = signAuthToken({ userId: "00000000-0000-0000-0000-000000000000" });

    const response = await request(app).get("/teams").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/sessão inválida/i);
  });
});
