import {
  Badge,
  Button,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { PAYMENT_CONDITION_LABELS, PAYMENT_METHOD_LABELS } from "@minibox/shared";
import type { OrderDto, OrderStatus, PaymentCondition } from "@minibox/shared";
import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { getApiErrorMessage } from "../../api/client";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { accentInsensitiveFilter } from "../../lib/selectFilter";
import { useTeamsQuery } from "../teams-participants/useTeams";
import { useCancelOrderMutation, useOrdersQuery } from "./useOrders";

const PAGE_SIZE = 10;

const CONDITION_OPTIONS = [
  { value: "ON_CREDIT", label: "Fiado" },
  { value: "IMMEDIATE", label: "Imediato" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "CANCELLED", label: "Cancelado" },
];

function OrderRow({ order }: { order: OrderDto }) {
  const cancelOrder = useCancelOrderMutation();

  function handleCancel() {
    modals.openConfirmModal({
      title: "Excluir pedido",
      children: (
        <Text size="sm">
          Tem certeza que deseja excluir o pedido de <strong>{order.participantName}</strong>, no valor de{" "}
          <strong>{formatCurrency(order.totalAmount)}</strong>? O estoque dos itens será devolvido.
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
      <Table.Td>{order.participantName}</Table.Td>
      <Table.Td>{order.teamName}</Table.Td>
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
          <Button size="xs" variant="subtle" color="red" onClick={handleCancel} loading={cancelOrder.isPending}>
            Excluir pedido
          </Button>
        )}
      </Table.Td>
    </Table.Tr>
  );
}

export function OrdersPage() {
  const { data: teams } = useTeamsQuery();
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrdersQuery({
    teamId: teamFilter ?? undefined,
    search: search || undefined,
    condition: (condition as PaymentCondition) ?? undefined,
    status: (status as OrderStatus) ?? undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const teamOptions = (teams ?? []).map((team) => ({ value: team.id, label: team.name }));
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  function resetPageAnd<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Pedidos</Title>
        <Text c="dimmed">Todos os pedidos registrados no Minibox, do mais recente para o mais antigo.</Text>
      </div>

      <Paper withBorder radius="md" p="lg">
        <Group grow mb="md">
          <TextInput
            label="Buscar por participante"
            placeholder="Digite o nome…"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(event) => resetPageAnd(setSearch)(event.target.value)}
          />
          <Select
            label="Equipe"
            placeholder="Todas as equipes"
            searchable
            clearable
            filter={accentInsensitiveFilter}
            data={teamOptions}
            value={teamFilter}
            onChange={resetPageAnd(setTeamFilter)}
          />
          <Select
            label="Condição"
            placeholder="Todas"
            clearable
            data={CONDITION_OPTIONS}
            value={condition}
            onChange={resetPageAnd(setCondition)}
          />
          <Select
            label="Status"
            placeholder="Todos"
            clearable
            data={STATUS_OPTIONS}
            value={status}
            onChange={resetPageAnd(setStatus)}
          />
        </Group>

        {isLoading && <Loader size="sm" />}
        {data && data.items.length === 0 && <Text c="dimmed">Nenhum pedido encontrado.</Text>}
        {data && data.items.length > 0 && (
          <>
            <Table verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Data/hora</Table.Th>
                  <Table.Th>Participante</Table.Th>
                  <Table.Th>Equipe</Table.Th>
                  <Table.Th>Itens</Table.Th>
                  <Table.Th>Valor</Table.Th>
                  <Table.Th>Condição</Table.Th>
                  <Table.Th>Forma de pagamento</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.items.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </Table.Tbody>
            </Table>
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">
                {data.total} pedido(s) no total
              </Text>
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Group>
          </>
        )}
      </Paper>
    </Stack>
  );
}
