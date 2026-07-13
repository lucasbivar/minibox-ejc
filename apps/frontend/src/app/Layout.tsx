import { ActionIcon, AppShell, Badge, Button, Group, Indicator, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAlertTriangle,
  IconChartBar,
  IconChevronLeft,
  IconChevronRight,
  IconClipboardList,
  IconLogout,
  IconReceipt,
  IconReportMoney,
  IconShoppingCart,
  IconUsersGroup,
  IconUser,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logout as logoutRequest } from "../api/auth";
import { PageTransition } from "../components/PageTransition";
import { useStockAlerts } from "../features/stock-alerts/useStockAlerts";
import { useAuthStore } from "../stores/authStore";
import { NavItem } from "./NavItem";

const NAV_ITEMS = [
  { to: "/caixa", label: "Caixa", icon: IconShoppingCart },
  { to: "/cardapio", label: "Cardápio", icon: IconClipboardList },
  { to: "/equipes", label: "Equipes", icon: IconUsersGroup },
  { to: "/participantes", label: "Participantes", icon: IconUser },
  { to: "/pedidos", label: "Pedidos", icon: IconReceipt },
  { to: "/devedores", label: "Devedores", icon: IconReportMoney },
  { to: "/dashboard", label: "Dashboard", icon: IconChartBar },
  { to: "/alerta-estoque", label: "Alerta de Estoque", icon: IconAlertTriangle },
];

const NAVBAR_WIDTH_EXPANDED = 260;
const NAVBAR_WIDTH_COLLAPSED = 80;

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { data: stockAlerts } = useStockAlerts();
  const [sidebarOpened, { toggle: toggleSidebar }] = useDisclosure(true);

  async function handleLogout() {
    try {
      await logoutRequest();
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  }

  return (
    <AppShell
      navbar={{ width: sidebarOpened ? NAVBAR_WIDTH_EXPANDED : NAVBAR_WIDTH_COLLAPSED, breakpoint: "sm" }}
      padding="lg"
    >
      <AppShell.Navbar p="md">
        <AnimatePresence mode="wait" initial={false}>
          {sidebarOpened ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Group justify="space-between" mb="lg" wrap="nowrap">
                <Text fw={800} c="brand.6" size="lg" style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
                  MINIBOX EJC
                </Text>
                <ActionIcon variant="subtle" color="gray" onClick={toggleSidebar} aria-label="Alternar menu lateral">
                  <IconChevronLeft size={18} />
                </ActionIcon>
              </Group>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Group justify="center" mb="lg">
                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="lg"
                    onClick={toggleSidebar}
                    aria-label="Alternar menu lateral"
                  >
                    <IconChevronRight size={18} />
                  </ActionIcon>
                </motion.div>
              </Group>
            </motion.div>
          )}
        </AnimatePresence>

        <Stack gap={4} style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            const showBadge = item.to === "/alerta-estoque" && Boolean(stockAlerts?.criticalCount);

            const icon = sidebarOpened ? (
              <item.icon size={18} stroke={1.75} />
            ) : (
              <Indicator
                color="red"
                disabled={!showBadge}
                size={8}
                offset={2}
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <item.icon size={18} stroke={1.75} />
              </Indicator>
            );

            return (
              <NavItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={icon}
                active={isActive}
                collapsed={!sidebarOpened}
                rightSection={
                  sidebarOpened && showBadge ? (
                    <Badge color="red" size="sm" circle>
                      {stockAlerts?.criticalCount}
                    </Badge>
                  ) : undefined
                }
              />
            );
          })}
        </Stack>

        <Stack
          gap="xs"
          mt="auto"
          pt="md"
          align={sidebarOpened ? "stretch" : "center"}
          style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}
        >
          {sidebarOpened ? (
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <Text size="sm" c="dimmed" truncate style={{ flex: 1, minWidth: 0 }}>
                {user?.name}
              </Text>
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                leftSection={<IconLogout size={16} />}
                onClick={handleLogout}
                style={{ flexShrink: 0 }}
              >
                Sair
              </Button>
            </Group>
          ) : (
            <Tooltip label="Sair" position="right" withArrow>
              <ActionIcon variant="subtle" color="gray" size="lg" onClick={handleLogout} aria-label="Sair">
                <IconLogout size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main style={{ display: "flex", flexDirection: "column" }}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </AppShell.Main>
    </AppShell>
  );
}
