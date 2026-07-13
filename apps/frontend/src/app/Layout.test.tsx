import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "../test/mswServer";
import { renderWithProviders } from "../test/renderWithProviders";
import { useAuthStore } from "../stores/authStore";
import { Layout } from "./Layout";

describe("Layout", () => {
  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("exibe um contador de itens críticos na navegação (RF-31)", async () => {
    useAuthStore.getState().setSession({ token: "t", user: { id: "1", name: "Admin", email: "a@a.com" } });
    server.use(
      http.get("*/menu-items/alerts", () => HttpResponse.json({ items: [], criticalCount: 3 })),
      http.post("*/auth/logout", () => HttpResponse.json({}, { status: 204 })),
    );

    renderWithProviders(<Layout />);

    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("permite encerrar a sessão (RF-34)", async () => {
    useAuthStore.getState().setSession({ token: "t", user: { id: "1", name: "Admin", email: "a@a.com" } });
    server.use(
      http.get("*/menu-items/alerts", () => HttpResponse.json({ items: [], criticalCount: 0 })),
      http.post("*/auth/logout", () => HttpResponse.json({}, { status: 204 })),
    );

    const user = userEvent.setup();
    renderWithProviders(<Layout />);

    await user.click(await screen.findByRole("button", { name: /sair/i }));

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("exibe MINIBOX EJC em caixa alta e permite fechar/abrir a sidebar", async () => {
    useAuthStore.getState().setSession({ token: "t", user: { id: "1", name: "Admin", email: "a@a.com" } });
    server.use(
      http.get("*/menu-items/alerts", () => HttpResponse.json({ items: [], criticalCount: 0 })),
      http.post("*/auth/logout", () => HttpResponse.json({}, { status: 204 })),
    );

    const user = userEvent.setup();
    renderWithProviders(<Layout />);

    expect(await screen.findByText("MINIBOX EJC")).toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: /alternar menu lateral/i });
    expect(screen.getByRole("link", { name: /caixa/i })).toBeVisible();

    await user.click(toggle);
    await user.click(toggle);
    expect(screen.getByRole("link", { name: /caixa/i })).toBeVisible();
  });

  it("ao colapsar, esconde o texto completo e mostra apenas ícones e o botão de abrir", async () => {
    useAuthStore.getState().setSession({ token: "t", user: { id: "1", name: "Admin", email: "a@a.com" } });
    server.use(
      http.get("*/menu-items/alerts", () => HttpResponse.json({ items: [], criticalCount: 0 })),
      http.post("*/auth/logout", () => HttpResponse.json({}, { status: 204 })),
    );

    const user = userEvent.setup();
    renderWithProviders(<Layout />);

    expect(await screen.findByText("MINIBOX EJC")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /alternar menu lateral/i }));

    await waitFor(() => expect(screen.queryByText("MINIBOX EJC")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: /alternar menu lateral/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^caixa$/i })).toBeVisible();
  });

  it("mostra os itens de navegação Equipes, Participantes e Pedidos separadamente", async () => {
    useAuthStore.getState().setSession({ token: "t", user: { id: "1", name: "Admin", email: "a@a.com" } });
    server.use(
      http.get("*/menu-items/alerts", () => HttpResponse.json({ items: [], criticalCount: 0 })),
      http.post("*/auth/logout", () => HttpResponse.json({}, { status: 204 })),
    );

    renderWithProviders(<Layout />);

    expect(await screen.findByRole("link", { name: /^equipes$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^participantes$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^pedidos$/i })).toBeInTheDocument();
  });
});
