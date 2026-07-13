import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { CheckoutPage } from "../features/checkout/CheckoutPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { DebtorsPage } from "../features/debtors/DebtorsPage";
import { MenuPage } from "../features/menu/MenuPage";
import { OrdersPage } from "../features/orders/OrdersPage";
import { ParticipantFilePage } from "../features/participant-file/ParticipantFilePage";
import { StockAlertsPage } from "../features/stock-alerts/StockAlertsPage";
import { EquipesPage } from "../features/teams-participants/EquipesPage";
import { ParticipantsPage } from "../features/teams-participants/ParticipantsPage";
import { Layout } from "./Layout";
import { ProtectedRoute } from "./ProtectedRoute";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/caixa" element={<CheckoutPage />} />
        <Route path="/cardapio" element={<MenuPage />} />
        <Route path="/equipes" element={<EquipesPage />} />
        <Route path="/participantes" element={<ParticipantsPage />} />
        <Route path="/participantes/:id" element={<ParticipantFilePage />} />
        <Route path="/pedidos" element={<OrdersPage />} />
        <Route path="/devedores" element={<DebtorsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/alerta-estoque" element={<StockAlertsPage />} />
        <Route path="/" element={<Navigate to="/caixa" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/caixa" replace />} />
    </Routes>
  );
}
