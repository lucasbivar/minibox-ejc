import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { theme } from "../mantineTheme";

export function renderWithProviders(ui: ReactElement, options: { route?: string; path?: string } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const routedUi = options.path ? (
    <Routes>
      <Route path={options.path} element={ui} />
    </Routes>
  ) : (
    ui
  );

  return render(
    <MantineProvider theme={theme} forceColorScheme="light">
      <ModalsProvider modalProps={{ centered: true }}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[options.route ?? "/"]}>{routedUi}</MemoryRouter>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>,
  );
}
