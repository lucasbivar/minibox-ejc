import { Alert, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconAlertCircle, IconCheck, IconRefresh } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { getApiErrorMessage } from "../../api/client";
import { createOrder } from "../../api/orders";
import { formatCurrency } from "../../lib/format";
import { getCartTotal, useCartStore } from "../../stores/cartStore";
import { CartTable } from "./CartTable";
import { ItemPicker } from "./ItemPicker";
import { ParticipantPicker } from "./ParticipantPicker";
import { PaymentOptions } from "./PaymentOptions";

export function CheckoutPage() {
  const queryClient = useQueryClient();
  const team = useCartStore((state) => state.team);
  const participant = useCartStore((state) => state.participant);
  const items = useCartStore((state) => state.items);
  const condition = useCartStore((state) => state.condition);
  const paymentMethod = useCartStore((state) => state.paymentMethod);
  const reset = useCartStore((state) => state.reset);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const finalizeMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      setErrorMessage(null);
      setConfirmationMessage(
        `Pedido registrado para ${order.participantName}. Total: ${formatCurrency(order.totalAmount)}.`,
      );
      reset();
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
    },
    onError: (error) => {
      setConfirmationMessage(null);
      setErrorMessage(getApiErrorMessage(error, "Não foi possível finalizar o pedido."));
    },
  });

  const canFinalize = Boolean(participant) && items.length > 0 && !finalizeMutation.isPending;

  function finalizeOrder() {
    if (!participant) {
      return;
    }
    setConfirmationMessage(null);
    finalizeMutation.mutate({
      participantId: participant.id,
      condition,
      paymentMethod: condition === "IMMEDIATE" ? paymentMethod : null,
      items: items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
    });
  }

  function handleFinalizeClick() {
    modals.openConfirmModal({
      title: "Finalizar pedido",
      children: (
        <Text size="sm">
          Tem certeza que deseja finalizar o pedido de <strong>{participant?.name}</strong>, no valor de{" "}
          <strong>{formatCurrency(getCartTotal(items))}</strong>?
        </Text>
      ),
      labels: { confirm: "Sim, finalizar", cancel: "Voltar" },
      confirmProps: { color: "brand" },
      onConfirm: finalizeOrder,
    });
  }

  function handleRestartClick() {
    modals.openConfirmModal({
      title: "Reiniciar pedido",
      children: (
        <Text size="sm">
          Tem certeza que deseja reiniciar o pedido em andamento? A equipe, o participante e os itens selecionados
          serão descartados.
        </Text>
      ),
      labels: { confirm: "Reiniciar", cancel: "Cancelar" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        reset();
        setErrorMessage(null);
        setConfirmationMessage(null);
      },
    });
  }

  const hasOrderInProgress = Boolean(team) || Boolean(participant) || items.length > 0;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={1}>Caixa</Title>
          <Text c="dimmed">Registre a consumação do participante no Minibox.</Text>
        </div>
        {hasOrderInProgress && (
          <Button variant="subtle" color="gray" leftSection={<IconRefresh size={16} />} onClick={handleRestartClick}>
            Reiniciar pedido
          </Button>
        )}
      </Group>

      <AnimatePresence>
        {confirmationMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Alert color="green" icon={<IconCheck size={18} />}>
              {confirmationMessage}
            </Alert>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Alert color="red" icon={<IconAlertCircle size={18} />}>
              {errorMessage}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <ParticipantPicker />

      <AnimatePresence>
        {team && participant && (
          <motion.div
            key="order-form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Stack gap="lg">
              <ItemPicker />
              <CartTable />
              <PaymentOptions />

              <Paper withBorder radius="md" p="lg">
                <Group justify="space-between">
                  <Text size="lg" fw={700}>
                    Total: {formatCurrency(getCartTotal(items))}
                  </Text>
                  <Button onClick={handleFinalizeClick} disabled={!canFinalize} loading={finalizeMutation.isPending}>
                    Finalizar pedido
                  </Button>
                </Group>
              </Paper>
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Stack>
  );
}
