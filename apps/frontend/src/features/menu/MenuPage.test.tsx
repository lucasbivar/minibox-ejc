import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../test/mswServer";
import { renderWithProviders } from "../../test/renderWithProviders";
import { MenuPage } from "./MenuPage";

const BASE_ITEMS = [
  {
    id: "1",
    number: 1,
    description: "Coxinha",
    price: 6,
    stock: 50,
    available: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    number: 2,
    description: "Refrigerante",
    price: 5,
    stock: 0,
    available: true,
    createdAt: new Date().toISOString(),
  },
];

describe("MenuPage", () => {
  it("lista os itens do cardápio com destaque de estoque baixo/zerado", async () => {
    server.use(http.get("*/menu-items", () => HttpResponse.json(BASE_ITEMS)));

    renderWithProviders(<MenuPage />);

    expect(await screen.findByText("Coxinha")).toBeInTheDocument();
    const refrigeranteRow = screen.getByText("Refrigerante").closest("tr")!;
    expect(within(refrigeranteRow).getByText("0")).toBeInTheDocument();
  });

  it("cadastra um novo item de cardápio (RF-01)", async () => {
    server.use(
      http.get("*/menu-items", () => HttpResponse.json(BASE_ITEMS)),
      http.post("*/menu-items", async ({ request }) => {
        const body = (await request.json()) as { number: number; description: string; price: number; stock: number };
        expect(body).toEqual({ number: 3, description: "Água", price: 4, stock: 30 });
        return HttpResponse.json({ id: "3", ...body, available: true, createdAt: new Date().toISOString() }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MenuPage />);
    await screen.findByText("Coxinha");

    await user.type(screen.getByLabelText(/^número/i), "3");
    await user.type(screen.getByLabelText(/^descrição/i), "Água");
    await user.type(screen.getByLabelText(/^preço/i), "4");
    await user.clear(screen.getByLabelText(/^estoque inicial/i));
    await user.type(screen.getByLabelText(/^estoque inicial/i), "30");
    await user.click(screen.getByRole("button", { name: /^adicionar$/i }));

    await waitFor(() => expect(screen.getByLabelText(/^número/i)).toHaveValue(""));
  });

  it("repõe estoque de um item (RF-03)", async () => {
    server.use(
      http.get("*/menu-items", () => HttpResponse.json(BASE_ITEMS)),
      http.post("*/menu-items/2/restock", async ({ request }) => {
        const body = (await request.json()) as { quantityDelta: number };
        expect(body.quantityDelta).toBe(20);
        return HttpResponse.json({ ...BASE_ITEMS[1], stock: 20 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MenuPage />);
    const refrigeranteRow = (await screen.findByText("Refrigerante")).closest("tr")!;

    await user.click(within(refrigeranteRow).getByRole("button", { name: /repor estoque/i }));
    const stockInput = screen.getByLabelText("Novo valor do estoque");
    expect(stockInput).toHaveValue("0");
    await user.clear(stockInput);
    await user.type(stockInput, "20");
    await user.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => expect(screen.queryByLabelText("Novo valor do estoque")).not.toBeInTheDocument());
  });

  it("marca um item como indisponível", async () => {
    const items = BASE_ITEMS.map((item) => ({ ...item }));
    server.use(
      http.get("*/menu-items", () => HttpResponse.json(items)),
      http.patch("*/menu-items/1/availability", async ({ request }) => {
        const body = (await request.json()) as { available: boolean };
        expect(body.available).toBe(false);
        items[0] = { ...items[0], available: false };
        return HttpResponse.json(items[0]);
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MenuPage />);
    const coxinhaRow = (await screen.findByText("Coxinha")).closest("tr")!;
    const availabilitySwitch = within(coxinhaRow).getByRole("switch");

    await user.click(availabilitySwitch);

    await waitFor(() => expect(availabilitySwitch).not.toBeChecked());
  });

  it("exclui um item do cardápio", async () => {
    let items = BASE_ITEMS.map((item) => ({ ...item }));
    server.use(
      http.get("*/menu-items", () => HttpResponse.json(items)),
      http.delete("*/menu-items/1", () => {
        items = items.filter((item) => item.id !== "1");
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MenuPage />);
    await screen.findByText("Coxinha");

    await user.click(screen.getByRole("button", { name: /excluir coxinha/i }));
    await user.click(await screen.findByRole("button", { name: /^excluir$/i }));

    await waitFor(() => expect(screen.queryByText("Coxinha")).not.toBeInTheDocument());
  });
});
