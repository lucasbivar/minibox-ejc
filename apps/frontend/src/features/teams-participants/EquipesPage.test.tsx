import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../test/mswServer";
import { renderWithProviders } from "../../test/renderWithProviders";
import { EquipesPage } from "./EquipesPage";

const TEAMS = [
  { id: "t1", name: "Bandinha", createdAt: new Date().toISOString() },
  { id: "t2", name: "Ordem", createdAt: new Date().toISOString() },
];

describe("EquipesPage", () => {
  it("lista as equipes cadastradas", async () => {
    server.use(http.get("*/teams", () => HttpResponse.json(TEAMS)));
    renderWithProviders(<EquipesPage />);

    expect(await screen.findByText("Bandinha")).toBeInTheDocument();
    expect(screen.getByText("Ordem")).toBeInTheDocument();
  });

  it("cadastra uma nova equipe (RF-05)", async () => {
    server.use(
      http.get("*/teams", () => HttpResponse.json(TEAMS)),
      http.post("*/teams", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        return HttpResponse.json({ id: "t3", name: body.name, createdAt: new Date().toISOString() }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<EquipesPage />);
    await screen.findByText("Bandinha");

    await user.type(screen.getByLabelText(/^nova equipe de serviço/i), "Liturgia");
    await user.click(screen.getByRole("button", { name: /adicionar equipe/i }));

    await waitFor(() => expect(screen.getByLabelText(/^nova equipe de serviço/i)).toHaveValue(""));
  });

  it("exclui uma equipe", async () => {
    const teams = [...TEAMS];
    server.use(
      http.get("*/teams", () => HttpResponse.json(teams)),
      http.delete("*/teams/t2", () => {
        teams.splice(
          teams.findIndex((t) => t.id === "t2"),
          1,
        );
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<EquipesPage />);
    await screen.findByText("Bandinha");

    await user.click(screen.getByRole("button", { name: /excluir equipe ordem/i }));
    await user.click(await screen.findByRole("button", { name: /^excluir$/i }));

    await waitFor(() => expect(screen.queryByText("Ordem")).not.toBeInTheDocument());
  });
});
