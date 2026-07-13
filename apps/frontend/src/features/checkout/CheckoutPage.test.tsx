import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { selectMantineOption } from "../../test/mantineSelect";
import { server } from "../../test/mswServer";
import { renderWithProviders } from "../../test/renderWithProviders";
import { useCartStore } from "../../stores/cartStore";
import { CheckoutPage } from "./CheckoutPage";

const TEAMS = [{ id: "t1", name: "Bandinha", createdAt: new Date().toISOString() }];
const PARTICIPANTS = [
  {
    id: "p1",
    name: "Maria Silva",
    phone: null,
    teamId: "t1",
    teamName: "Bandinha",
    photoUrl: null,
    createdAt: new Date().toISOString(),
  },
];
const MENU_ITEMS = [
  {
    id: "m1",
    number: 5,
    description: "Coxinha",
    price: 6,
    stock: 20,
    available: true,
    createdAt: new Date().toISOString(),
  },
];

function mockBaseHandlers() {
  server.use(
    http.get("*/teams", () => HttpResponse.json(TEAMS)),
    http.get("*/participants", () =>
      HttpResponse.json({ items: PARTICIPANTS, total: PARTICIPANTS.length, page: 1, pageSize: 200 }),
    ),
    http.get("*/menu-items", () => HttpResponse.json(MENU_ITEMS)),
  );
}

async function selectTeamAndParticipant(user: ReturnType<typeof userEvent.setup>) {
  await selectMantineOption(user, /^equipe de serviço/i, "Bandinha");
  await selectMantineOption(user, /^participante/i, "Maria Silva");
  await screen.findByText(/selecionado/i);
}

describe("CheckoutPage", () => {
  beforeEach(() => {
    useCartStore.getState().reset();
  });

  afterEach(() => {
    useCartStore.getState().reset();
  });

  it("completa o fluxo de venda: equipe -> participante -> busca de item -> pagamento -> confirmação -> finalizar", async () => {
    mockBaseHandlers();
    server.use(
      http.post("*/orders", async ({ request }) => {
        const body = (await request.json()) as {
          participantId: string;
          condition: string;
          paymentMethod: string | null;
          items: { menuItemId: string; quantity: number }[];
        };
        expect(body).toEqual({
          participantId: "p1",
          condition: "IMMEDIATE",
          paymentMethod: "PIX",
          items: [{ menuItemId: "m1", quantity: 2 }],
        });
        return HttpResponse.json(
          {
            id: "o1",
            participantId: "p1",
            participantName: "Maria Silva",
            teamId: "t1",
            teamName: "Bandinha",
            dateTime: new Date().toISOString(),
            condition: "IMMEDIATE",
            paymentMethod: "PIX",
            totalAmount: 12,
            status: "ACTIVE",
            items: [],
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    await selectTeamAndParticipant(user);

    await user.type(screen.getByLabelText(/buscar item por nome ou número/i), "Coxinha");
    const quantityInput = await screen.findByLabelText("Quantidade de Coxinha");
    await user.clear(quantityInput);
    await user.type(quantityInput, "2");
    await user.click(screen.getByRole("button", { name: /^adicionar$/i }));

    expect(await screen.findAllByText(/total:\s*r\$\s*12,00/i)).toHaveLength(2);

    await user.click(screen.getByLabelText("Pix"));
    await user.click(screen.getByRole("button", { name: /finalizar pedido/i }));
    await user.click(await screen.findByRole("button", { name: /sim, finalizar/i }));

    expect(await screen.findByText(/pedido registrado para maria silva/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Coxinha")).not.toBeInTheDocument());
  });

  it("não exibe o botão de finalizar antes de selecionar um participante", async () => {
    mockBaseHandlers();
    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    await selectMantineOption(user, /^equipe de serviço/i, "Bandinha");
    await screen.findByRole("textbox", { name: /^participante/i });

    expect(screen.queryByRole("button", { name: /finalizar pedido/i })).not.toBeInTheDocument();
  });

  it("pede confirmação antes de finalizar e permite cancelar", async () => {
    mockBaseHandlers();
    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    await selectTeamAndParticipant(user);

    const quantityInput = await screen.findByLabelText("Quantidade de Coxinha");
    await user.click(quantityInput);
    await user.click(screen.getByRole("button", { name: /^adicionar$/i }));

    await user.click(screen.getByRole("button", { name: /finalizar pedido/i }));
    expect(await screen.findByText(/tem certeza que deseja finalizar o pedido/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^voltar$/i }));
    await waitFor(() =>
      expect(screen.queryByText(/tem certeza que deseja finalizar o pedido/i)).not.toBeInTheDocument(),
    );
  });

  it("não exibe itens marcados como indisponíveis na busca do caixa", async () => {
    server.use(
      http.get("*/teams", () => HttpResponse.json(TEAMS)),
      http.get("*/participants", () =>
        HttpResponse.json({ items: PARTICIPANTS, total: PARTICIPANTS.length, page: 1, pageSize: 200 }),
      ),
      http.get("*/menu-items", () =>
        HttpResponse.json([
          { ...MENU_ITEMS[0], id: "m1", number: 5, description: "Coxinha", available: true },
          { ...MENU_ITEMS[0], id: "m2", number: 6, description: "Suco Esgotado", available: false },
        ]),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);
    await selectTeamAndParticipant(user);

    await screen.findByText(/#5 — Coxinha/);
    expect(screen.queryByText(/Suco Esgotado/)).not.toBeInTheDocument();
  });

  it("permite reiniciar o pedido em andamento", async () => {
    mockBaseHandlers();
    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    expect(screen.queryByRole("button", { name: /reiniciar pedido/i })).not.toBeInTheDocument();

    await selectTeamAndParticipant(user);
    expect(screen.getByRole("button", { name: /reiniciar pedido/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reiniciar pedido/i }));
    await user.click(await screen.findByRole("button", { name: /^reiniciar$/i }));

    await waitFor(() => expect(screen.queryByText(/selecionado/i)).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /reiniciar pedido/i })).not.toBeInTheDocument();
  });
});
