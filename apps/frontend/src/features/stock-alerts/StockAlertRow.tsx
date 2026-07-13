import { Badge, Button, Group, NumberInput, Table, Text } from "@mantine/core";
import type { StockAlertItemDto } from "@minibox/shared";
import { useState } from "react";
import { getApiErrorMessage } from "../../api/client";
import { useMenuItemMutations } from "../menu/useMenuItems";

const SEVERITY_LABEL: Record<StockAlertItemDto["severity"], string> = {
  critical: "Crítico",
  warning: "Alerta",
  ok: "Ok",
};

const SEVERITY_COLOR: Record<StockAlertItemDto["severity"], string> = {
  critical: "red",
  warning: "yellow",
  ok: "green",
};

export function StockAlertRow({ item }: { item: StockAlertItemDto }) {
  const { restock } = useMenuItemMutations();
  const [isRestocking, setIsRestocking] = useState(false);
  const [newStock, setNewStock] = useState<number | string>(item.stock);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleOpenRestock() {
    setNewStock(item.stock);
    setIsRestocking(true);
  }

  function handleConfirm() {
    setErrorMessage(null);
    const delta = Number(newStock) - item.stock;
    if (!delta) {
      setErrorMessage("Informe um valor diferente do estoque atual.");
      return;
    }
    restock.mutate(
      { id: item.id, input: { quantityDelta: delta } },
      {
        onSuccess: () => setIsRestocking(false),
        onError: (error) => setErrorMessage(getApiErrorMessage(error)),
      },
    );
  }

  return (
    <Table.Tr>
      <Table.Td>{item.number}</Table.Td>
      <Table.Td>{item.description}</Table.Td>
      <Table.Td>
        <Badge color={SEVERITY_COLOR[item.severity]}>{item.stock}</Badge>
      </Table.Td>
      <Table.Td>{SEVERITY_LABEL[item.severity]}</Table.Td>
      <Table.Td>
        {isRestocking ? (
          <Group gap="xs">
            <NumberInput
              aria-label={`Repor estoque de ${item.description}`}
              w={100}
              value={newStock}
              onChange={setNewStock}
            />
            <Button size="xs" onClick={handleConfirm} loading={restock.isPending}>
              Confirmar
            </Button>
            <Button size="xs" variant="default" onClick={() => setIsRestocking(false)}>
              Cancelar
            </Button>
          </Group>
        ) : (
          <Button size="xs" variant="default" onClick={handleOpenRestock}>
            Repor estoque
          </Button>
        )}
        {errorMessage && (
          <Text c="red" size="xs" role="alert" mt={4}>
            {errorMessage}
          </Text>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
