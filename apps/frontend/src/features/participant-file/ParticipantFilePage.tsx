import {
  Alert,
  Avatar,
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { PAYMENT_CONDITION_LABELS, PAYMENT_METHOD_LABELS } from "@minibox/shared";
import type { OrderDto } from "@minibox/shared";
import { IconAlertCircle, IconClipboardList, IconReceipt, IconTrash } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../api/client";
import { StatTile } from "../../components/StatTile";
import { useCancelOrderMutation } from "../orders/useOrders";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { useParticipantMutations } from "../teams-participants/useParticipants";
import { SettlementForm } from "./SettlementForm";
import { useParticipantFileQuery } from "./useParticipantFile";

function OrderTableRow({ order }: { order: OrderDto }) {
  const cancelOrder = useCancelOrderMutation();

  function handleDeleteOrder() {
    modals.openConfirmModal({
      title: "Excluir pedido",
      children: (
        <Text size="sm">
          Tem certeza que deseja excluir este pedido de <strong>{formatCurrency(order.totalAmount)}</strong>? O
          estoque dos itens será devolvido.
        </Text>
      ),
      labels: { confirm: "Excluir", cancel: "Voltar" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        cancelOrder.mutate(order.id, {
          onError: (error) =>
            notifications.show({ color: "red", title: "Não foi possível excluir", message: getApiErrorMessage(error) }),
        });
      },
    });
  }

  return (
    <Table.Tr>
      <Table.Td>{formatDateTime(order.dateTime)}</Table.Td>
      <Table.Td>{order.items.map((item) => `${item.quantity}x ${item.description}`).join(", ")}</Table.Td>
      <Table.Td>{formatCurrency(order.totalAmount)}</Table.Td>
      <Table.Td>
        <Badge variant="light" color={order.condition === "ON_CREDIT" ? "orange" : "brand"}>
          {PAYMENT_CONDITION_LABELS[order.condition]}
        </Badge>
      </Table.Td>
      <Table.Td>{order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : "—"}</Table.Td>
      <Table.Td>
        <Badge variant="light" color={order.status === "CANCELLED" ? "gray" : "green"}>
          {order.status === "CANCELLED" ? "Cancelado" : "Ativo"}
        </Badge>
      </Table.Td>
      <Table.Td>
        {order.status === "ACTIVE" && (
          <Button size="xs" variant="subtle" color="red" onClick={handleDeleteOrder} loading={cancelOrder.isPending}>
            Excluir pedido
          </Button>
        )}
      </Table.Td>
    </Table.Tr>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ParticipantFilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: file, isLoading, isError } = useParticipantFileQuery(id ?? "");
  const { remove } = useParticipantMutations();

  if (isLoading) {
    return <Text>Carregando ficha do participante…</Text>;
  }

  if (isError || !file) {
    return (
      <Alert color="red" icon={<IconAlertCircle size={18} />}>
        Não foi possível carregar a ficha do participante.
      </Alert>
    );
  }

  const { participant } = file;

  function handleDelete() {
    modals.openConfirmModal({
      title: "Excluir participante",
      children: (
        <Text size="sm">
          Tem certeza que deseja excluir <strong>{participant.name}</strong>? Essa ação não pode ser desfeita.
        </Text>
      ),
      labels: { confirm: "Excluir", cancel: "Cancelar" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        remove.mutate(participant.id, {
          onSuccess: () => navigate("/participantes"),
          onError: (error) =>
            notifications.show({ color: "red", title: "Não foi possível excluir", message: getApiErrorMessage(error) }),
        });
      },
    });
  }

  return (
    <Stack gap="lg">
      <Paper withBorder radius="md" p="lg">
        <Group justify="space-between" align="flex-start">
          <Group>
            <Avatar radius="xl" size="lg" color="brand">
              {getInitials(participant.name)}
            </Avatar>
            <div>
              <Title order={1}>{participant.name}</Title>
              <Group gap="xs" mt={4}>
                <Badge variant="light" color="brand">
                  {participant.teamName}
                </Badge>
                <Text size="sm" c="dimmed">
                  {participant.phone ?? "Celular não informado"}
                </Text>
              </Group>
            </div>
          </Group>
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={handleDelete}
          >
            Excluir participante
          </Button>
        </Group>
      </Paper>

      <Group grow>
        <StatTile label="Total consumido" value={formatCurrency(file.totalConsumed)} />
        <StatTile label="Total já pago" value={formatCurrency(file.totalPaid)} tone="success" />
        <StatTile
          label="Total em aberto"
          value={formatCurrency(file.outstandingBalance)}
          tone={file.outstandingBalance > 0 ? "danger" : "success"}
        />
      </Group>

      <Paper withBorder radius="md" p="lg">
        <Title order={2} mb="md">
          Quitar dívida
        </Title>
        <SettlementForm participantId={participant.id} outstandingBalance={file.outstandingBalance} />
      </Paper>

      <Paper withBorder radius="md" p="lg">
        <Tabs defaultValue="pedidos">
          <Tabs.List>
            <Tabs.Tab value="pedidos" leftSection={<IconClipboardList size={16} />}>
              Pedidos ({file.orders.length})
            </Tabs.Tab>
            <Tabs.Tab value="quitacoes" leftSection={<IconReceipt size={16} />}>
              Quitações ({file.settlements.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pedidos" pt="md">
            {file.orders.length === 0 ? (
              <Text c="dimmed">Nenhum pedido registrado.</Text>
            ) : (
              <Table verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Data/hora</Table.Th>
                    <Table.Th>Itens</Table.Th>
                    <Table.Th>Valor</Table.Th>
                    <Table.Th>Condição</Table.Th>
                    <Table.Th>Forma de pagamento</Table.Th>
                    <Table.Th>Situação</Table.Th>
                    <Table.Th>Ações</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {file.orders.map((order) => (
                    <OrderTableRow key={order.id} order={order} />
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="quitacoes" pt="md">
            {file.settlements.length === 0 ? (
              <Text c="dimmed">Nenhuma quitação registrada.</Text>
            ) : (
              <Table verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Data/hora</Table.Th>
                    <Table.Th>Valor</Table.Th>
                    <Table.Th>Forma de pagamento</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {file.settlements.map((settlement) => (
                    <Table.Tr key={settlement.id}>
                      <Table.Td>{formatDateTime(settlement.dateTime)}</Table.Td>
                      <Table.Td>{formatCurrency(settlement.amount)}</Table.Td>
                      <Table.Td>{PAYMENT_METHOD_LABELS[settlement.paymentMethod]}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Stack>
  );
}
