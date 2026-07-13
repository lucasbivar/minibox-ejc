import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { selectMantineOption } from "../../test/mantineSelect";
import { server } from "../../test/mswServer";
import { renderWithProviders } from "../../test/renderWithProviders";
import { DebtorsPage } from "./DebtorsPage";

const TEAMS = [
  { id: "t1", name: "Bandinha", createdAt: new Date().toISOString() },
  { id: "t2", name: "Ordem", createdAt: new Date().toISOString() },
];

const DEBTORS = [
  { participantId: "p1", participantName: "Zeca Devedor", teamId: "t1", teamName: "Bandinha", phone: "+55 (11) 91234-5678", outstandingBalance: 100 },
  { participantId: "p2", participantName: "Ana Devedora", teamId: "t2", teamName: "Ordem", phone: null, outstandingBalance: 40 },
];

function mockBaseHandlers(items = DEBTORS) {
  server.use(
    http.get("*/teams", () => HttpResponse.json(TEAMS)),
    http.get("*/dashboard/debtors", () => HttpResponse.json({ items, total: items.length, page: 1, pageSize: 20 })),
  );
}

describe("DebtorsPage", () => {
  it("lista devedores com nome, equipe, celular e valor devido", async () => {
    mockBaseHandlers();
    renderWithProviders(<DebtorsPage />);

    const zecaRow = (await screen.findByText("Zeca Devedor")).closest("tr")!;
    expect(within(zecaRow).getByText("Bandinha")).toBeInTheDocument();
    expect(within(zecaRow).getByText("+55 (11) 91234-5678")).toBeInTheDocument();
    expect(within(zecaRow).getByText("R$ 100,00")).toBeInTheDocument();
    expect(screen.getByText("2 devedor(es) no total")).toBeInTheDocument();
  });

  it("busca devedores por nome", async () => {
    mockBaseHandlers();
    const user = userEvent.setup();
    renderWithProviders(<DebtorsPage />);
    await screen.findByText("Zeca Devedor");

    server.use(http.get("*/dashboard/debtors", () => HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 })));
    await user.type(screen.getByLabelText("Buscar por nome"), "Zzz");

    await waitFor(() =>
      expect(screen.getByText("Nenhum devedor encontrado para os filtros selecionados.")).toBeInTheDocument(),
    );
  });

  it("envia o critério de ordenação ao clicar no cabeçalho da coluna", async () => {
    mockBaseHandlers();
    const user = userEvent.setup();

    let lastQuery: URLSearchParams | null = null;
    server.use(
      http.get("*/teams", () => HttpResponse.json(TEAMS)),
      http.get("*/dashboard/debtors", ({ request }) => {
        lastQuery = new URL(request.url).searchParams;
        return HttpResponse.json({ items: DEBTORS, total: DEBTORS.length, page: 1, pageSize: 20 });
      }),
    );

    renderWithProviders(<DebtorsPage />);
    await screen.findByText("Zeca Devedor");

    await user.click(screen.getByRole("button", { name: /^nome$/i }));

    await waitFor(() => expect(lastQuery?.get("sortBy")).toBe("name"));
    expect(lastQuery?.get("sortDir")).toBe("asc");
  });

  it("filtra por equipe", async () => {
    mockBaseHandlers();
    const user = userEvent.setup();

    let lastQuery: URLSearchParams | null = null;
    server.use(
      http.get("*/teams", () => HttpResponse.json(TEAMS)),
      http.get("*/dashboard/debtors", ({ request }) => {
        lastQuery = new URL(request.url).searchParams;
        return HttpResponse.json({ items: [DEBTORS[0]], total: 1, page: 1, pageSize: 20 });
      }),
    );

    renderWithProviders(<DebtorsPage />);
    await screen.findByText("Zeca Devedor");

    await selectMantineOption(user, /filtrar por equipe/i, "Bandinha");

    await waitFor(() => expect(lastQuery?.get("teamId")).toBe("t1"));
  });
});
