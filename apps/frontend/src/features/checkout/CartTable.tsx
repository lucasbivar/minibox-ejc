import { ActionIcon, NumberInput, Paper, Table, Text, Title } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { formatCurrency } from "../../lib/format";
import { getCartTotal, useCartStore } from "../../stores/cartStore";

export function CartTable() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const total = getCartTotal(items);

  return (
    <Paper withBorder radius="md" p="lg">
      <Title order={2} mb="md">
        3. Resumo do pedido
      </Title>

      {items.length === 0 ? (
        <Text c="dimmed">Nenhum item adicionado ainda.</Text>
      ) : (
        <Table verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th>Qtd.</Table.Th>
              <Table.Th>Preço</Table.Th>
              <Table.Th>Subtotal</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((item) => (
              <Table.Tr key={item.menuItemId}>
                <Table.Td>{item.description}</Table.Td>
                <Table.Td>
                  <NumberInput
                    min={1}
                    value={item.quantity}
                    w={80}
                    hideControls
                    aria-label={`Quantidade de ${item.description}`}
                    onChange={(value) => updateQuantity(item.menuItemId, Number(value) || 1)}
                  />
                </Table.Td>
                <Table.Td>{formatCurrency(item.price)}</Table.Td>
                <Table.Td>{formatCurrency(item.price * item.quantity)}</Table.Td>
                <Table.Td>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={`Remover ${item.description}`}
                    onClick={() => removeItem(item.menuItemId)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Text size="xl" fw={800} ta="right" mt="md">
        Total: {formatCurrency(total)}
      </Text>
    </Paper>
  );
}
