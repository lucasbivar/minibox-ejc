import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { selectMantineOption } from "../../test/mantineSelect";
import { server } from "../../test/mswServer";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ParticipantsPage } from "./ParticipantsPage";

const TEAMS = [
  { id: "t1", name: "Bandinha", createdAt: new Date().toISOString() },
  { id: "t2", name: "Ordem", createdAt: new Date().toISOString() },
];

const PARTICIPANTS = [
  {
    id: "p1",
    name: "Maria Silva",
    phone: "+55 (11) 91234-5678",
    teamId: "t1",
    teamName: "Bandinha",
    photoUrl: null,
    createdAt: new Date().toISOString(),
  },
];

function mockBaseHandlers(items = PARTICIPANTS) {
  server.use(
    http.get("*/teams", () => HttpResponse.json(TEAMS)),
    http.get("*/participants", () => HttpResponse.json({ items, total: items.length, page: 1, pageSize: 10 })),
  );
}

describe("ParticipantsPage", () => {
  it("lista participantes cadastrados", async () => {
    mockBaseHandlers();
    renderWithProviders(<ParticipantsPage />);

    expect(await screen.findByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("1 participante(s) no total")).toBeInTheDocument();
  });

  it("cadastra um novo participante com celular no formato BR (RF-06)", async () => {
    mockBaseHandlers();
    server.use(
      http.post("*/participants", async ({ request }) => {
        const body = (await request.json()) as { name: string; teamId: string; phone: string | null };
        expect(body).toEqual({ name: "João Souza", teamId: "t2", phone: "+55 (11) 99876-5432" });
        return HttpResponse.json(
          { id: "p2", ...body, teamName: "Ordem", photoUrl: null, createdAt: new Date().toISOString() },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ParticipantsPage />);
    await screen.findByText("Maria Silva");

    await user.click(screen.getByRole("button", { name: /novo participante/i }));
    await user.type(screen.getByLabelText(/^nome completo/i), "João Souza");
    await selectMantineOption(user, /^equipe de serviço/i, "Ordem");

    const phoneInput = screen.getByLabelText(/celular/i);
    await user.clear(phoneInput);
    await user.type(phoneInput, "11998765432");
    await user.click(screen.getByRole("button", { name: /^cadastrar$/i }));

    await waitFor(() => expect(screen.queryByLabelText(/^nome completo/i)).not.toBeInTheDocument());
  });

  it("exclui um participante", async () => {
    const items = [...PARTICIPANTS];
    server.use(
      http.get("*/teams", () => HttpResponse.json(TEAMS)),
      http.get("*/participants", () => HttpResponse.json({ items, total: items.length, page: 1, pageSize: 10 })),
      http.delete("*/participants/p1", () => {
        items.splice(0, 1);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ParticipantsPage />);
    await screen.findByText("Maria Silva");

    await user.click(screen.getByRole("button", { name: /excluir maria silva/i }));
    await user.click(await screen.findByRole("button", { name: /^excluir$/i }));

    await waitFor(() => expect(screen.queryByText("Maria Silva")).not.toBeInTheDocument());
  });

  it("busca participantes por nome", async () => {
    mockBaseHandlers();
    const user = userEvent.setup();
    renderWithProviders(<ParticipantsPage />);
    await screen.findByText("Maria Silva");

    server.use(http.get("*/participants", () => HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 10 })));
    await user.type(screen.getByLabelText("Buscar por nome"), "Zzz");

    await waitFor(() => expect(screen.getByText("Nenhum participante encontrado.")).toBeInTheDocument());
  });

  it("exibe paginação quando há mais de uma página", async () => {
    const manyItems = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      name: `Participante ${i}`,
      phone: null,
      teamId: "t1",
      teamName: "Bandinha",
      photoUrl: null,
      createdAt: new Date().toISOString(),
    }));
    server.use(
      http.get("*/teams", () => HttpResponse.json(TEAMS)),
      http.get("*/participants", () => HttpResponse.json({ items: manyItems, total: 25, page: 1, pageSize: 10 })),
    );

    renderWithProviders(<ParticipantsPage />);
    await screen.findByText("Participante 0");

    expect(screen.getByText("25 participante(s) no total")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
  });
});
