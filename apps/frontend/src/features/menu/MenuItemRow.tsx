import { ActionIcon, Alert, Badge, Button, Group, NumberInput, Paper, Switch, Table, TextInput, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import type { MenuItemDto, StockSeverity } from "@minibox/shared";
import { IconAlertCircle, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { getApiErrorMessage } from "../../api/client";
import { formatCurrency } from "../../lib/format";
import { useMenuItemMutations } from "./useMenuItems";

type Mode = "view" | "edit" | "restock";

const SEVERITY_BADGE_COLOR: Record<StockSeverity, string> = {
  critical: "red",
  warning: "yellow",
  ok: "green",
};

export function MenuItemRow({ item }: { item: MenuItemDto }) {
  const { update, restock, setAvailability, deleteItem } = useMenuItemMutations();
  const [mode, setMode] = useState<Mode>("view");
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState<number | string>(item.price);
  const [warningThreshold, setWarningThreshold] = useState<number | string>(item.warningThreshold);
  const [criticalThreshold, setCriticalThreshold] = useState<number | string>(item.criticalThreshold);
  const [newStock, setNewStock] = useState<number | string>(item.stock);
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetAndClose() {
    setMode("view");
    setErrorMessage(null);
    setDescription(item.description);
    setPrice(item.price);
    setWarningThreshold(item.warningThreshold);
    setCriticalThreshold(item.criticalThreshold);
  }

  function handleSaveEdit() {
    setErrorMessage(null);
    update.mutate(
      {
        id: item.id,
        input: {
          description,
          price: Number(price),
          warningThreshold: Number(warningThreshold),
          criticalThreshold: Number(criticalThreshold),
        },
      },
      { onSuccess: resetAndClose, onError: (error) => setErrorMessage(getApiErrorMessage(error)) },
    );
  }

  function handleOpenRestock() {
    setNewStock(item.stock);
    setMode("restock");
  }

  function handleRestock() {
    setErrorMessage(null);
    const delta = Number(newStock) - item.stock;
    if (!delta) {
      setErrorMessage("Informe um valor diferente do estoque atual.");
      return;
    }
    restock.mutate(
      { id: item.id, input: { quantityDelta: delta, reason: reason || undefined } },
      {
        onSuccess: () => {
          setReason("");
          resetAndClose();
        },
        onError: (error) => setErrorMessage(getApiErrorMessage(error)),
      },
    );
  }

  function handleDelete() {
    modals.openConfirmModal({
      title: "Excluir item",
      children: (
        <Text size="sm">
          Tem certeza que deseja excluir <strong>{item.description}</strong>? O histórico de vendas será preservado.
        </Text>
      ),
      labels: { confirm: "Excluir", cancel: "Cancelar" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteItem.mutate(item.id, {
          onError: (error) =>
            notifications.show({
              color: "red",
              title: "Não foi possível excluir",
              message: getApiErrorMessage(error),
            }),
        });
      },
    });
  }

  return (
    <>
      <Table.Tr>
        <Table.Td>{item.number}</Table.Td>
        <Table.Td>
          {mode === "edit" ? (
            <TextInput value={description} onChange={(event) => setDescription(event.target.value)} />
          ) : (
            item.description
          )}
        </Table.Td>
        <Table.Td>
          {mode === "edit" ? (
            <NumberInput min={0.01} decimalScale={2} value={price} onChange={setPrice} w={110} />
          ) : (
            formatCurrency(item.price)
          )}
        </Table.Td>
        <Table.Td>
          <Badge color={SEVERITY_BADGE_COLOR[item.severity]}>{item.stock}</Badge>
        </Table.Td>
        <Table.Td>
          {mode === "edit" ? (
            <NumberInput
              aria-label={`Limite amarelo de ${item.description}`}
              min={0}
              value={warningThreshold}
              onChange={setWarningThreshold}
              w={100}
            />
          ) : (
            <Badge color="yellow" variant="light">
              {item.warningThreshold}
            </Badge>
          )}
        </Table.Td>
        <Table.Td>
          {mode === "edit" ? (
            <NumberInput
              aria-label={`Limite vermelho de ${item.description}`}
              min={0}
              value={criticalThreshold}
              onChange={setCriticalThreshold}
              w={100}
            />
          ) : (
            <Badge color="red" variant="light">
              {item.criticalThreshold}
            </Badge>
          )}
        </Table.Td>
        <Table.Td>
          <Switch
            checked={item.available}
            onChange={(event) =>
              setAvailability.mutate({ id: item.id, available: event.currentTarget.checked })
            }
            label={item.available ? "Disponível" : "Indisponível"}
            aria-label={`Disponibilidade de ${item.description}`}
          />
        </Table.Td>
        <Table.Td>
          <Group gap="xs" wrap="wrap">
            {mode === "edit" ? (
              <>
                <Button size="xs" onClick={handleSaveEdit} loading={update.isPending}>
                  Salvar
                </Button>
                <Button size="xs" variant="default" onClick={resetAndClose}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button size="xs" variant="default" onClick={() => setMode("edit")}>
                  Editar
                </Button>
                <Button size="xs" variant="default" onClick={handleOpenRestock}>
                  Repor estoque
                </Button>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={handleDelete}
                  aria-label={`Excluir ${item.description}`}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
      {mode === "restock" && (
        <Table.Tr>
          <Table.Td colSpan={8}>
            <Paper withBorder p="md" radius="md">
              <Group align="end">
                <NumberInput
                  label="Novo valor do estoque"
                  value={newStock}
                  onChange={setNewStock}
                  w={160}
                />
                <TextInput
                  label="Motivo (opcional)"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <Button onClick={handleRestock} loading={restock.isPending}>
                  Confirmar
                </Button>
                <Button variant="default" onClick={resetAndClose}>
                  Cancelar
                </Button>
              </Group>
            </Paper>
          </Table.Td>
        </Table.Tr>
      )}
      {errorMessage && mode !== "view" && (
        <Table.Tr>
          <Table.Td colSpan={8}>
            <Alert color="red" icon={<IconAlertCircle size={18} />} role="alert">
              {errorMessage}
            </Alert>
          </Table.Td>
        </Table.Tr>
      )}
    </>
  );
}
