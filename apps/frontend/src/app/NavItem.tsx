import { NavLink, Tooltip, UnstyledButton } from "@mantine/core";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface NavItemProps {
  to: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  collapsed: boolean;
  rightSection?: ReactNode;
}

export function NavItem({ to, label, icon, active, collapsed, rightSection }: NavItemProps) {
  if (collapsed) {
    return (
      <Tooltip label={label} position="right" withArrow openDelay={200}>
        <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
          <UnstyledButton
            component={Link}
            to={to}
            aria-label={label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              margin: "0 auto",
              borderRadius: 8,
              color: active ? "var(--mantine-primary-color-contrast)" : "var(--mantine-color-gray-7)",
              backgroundColor: active ? "var(--mantine-primary-color-filled)" : "transparent",
            }}
          >
            {icon}
          </UnstyledButton>
        </motion.div>
      </Tooltip>
    );
  }

  return (
    <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}>
      <NavLink
        component={Link}
        to={to}
        label={label}
        leftSection={icon}
        rightSection={rightSection}
        active={active}
        variant="filled"
        style={{ borderRadius: 8 }}
      />
    </motion.div>
  );
}
