import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { server } from "../../test/mswServer";
import { renderWithProviders } from "../../test/renderWithProviders";
import { useAuthStore } from "../../stores/authStore";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("autentica com sucesso e guarda a sessão", async () => {
    server.use(
      http.post("*/auth/login", async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string };
        expect(body).toEqual({ email: "admin@minibox.local", password: "minibox123" });
        return HttpResponse.json({
          token: "fake-token",
          user: { id: "1", name: "Administrador", email: "admin@minibox.local" },
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    await user.type(screen.getByLabelText(/e-mail/i), "admin@minibox.local");
    await user.type(screen.getByLabelText(/senha/i), "minibox123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(useAuthStore.getState().user?.name).toBe("Administrador");
  });

  it("exibe mensagem de erro para credenciais inválidas", async () => {
    server.use(
      http.post("*/auth/login", () => HttpResponse.json({ message: "E-mail ou senha incorretos." }, { status: 401 })),
    );

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    await user.type(screen.getByLabelText(/e-mail/i), "admin@minibox.local");
    await user.type(screen.getByLabelText(/senha/i), "errada");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
