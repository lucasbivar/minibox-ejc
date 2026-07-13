import { Alert, Button, Group, NumberInput, Paper, ScrollArea, Text, TextInput, Title } from "@mantine/core";
import { IconAlertCircle, IconPlus, IconSearch } from "@tabler/icons-react";
import { type FormEvent, useMemo, useState } from "react";
import { formatCurrency } from "../../lib/format";
import { useCartStore } from "../../stores/cartStore";
import { useMenuItemsQuery } from "../menu/useMenuItems";

export function ItemPicker() {
  const { data: menuItems } = useMenuItemsQuery();
  const addItem = useCartStore((state) => state.addItem);
  const [quickNumber, setQuickNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const items = useMemo(() => menuItems?.filter((item) => item.available), [menuItems]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) => item.description.toLowerCase().includes(term) || String(item.number).includes(term),
    );
  }, [items, search]);

  function handleQuickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const item = items?.find((candidate) => candidate.number === Number(quickNumber));
    if (!item) {
      setErrorMessage(`Nenhum item com o número ${quickNumber} foi encontrado.`);
      return;
    }
    addItem({ menuItemId: item.id, number: item.number, description: item.description, price: item.price }, 1);
    setQuickNumber("");
  }

  function handleAddFromList(itemId: string, number: number, description: string, price: number) {
    const quantity = quantities[itemId] || 1;
    addItem({ menuItemId: itemId, number, description, price }, quantity);
    setQuantities((current) => ({ ...current, [itemId]: 1 }));
  }

  return (
    <Paper withBorder radius="md" p="lg">
      <Title order={2} mb="md">
        2. Itens do pedido
      </Title>

      <Group align="end" mb="md">
        <form onSubmit={handleQuickAdd} style={{ display: "flex", gap: "0.6rem", alignItems: "end" }}>
          <NumberInput
            id="quick-item-number"
            label="Lançamento rápido por número"
            placeholder="Nº do item"
            value={quickNumber}
            onChange={(value) => setQuickNumber(String(value))}
            hideControls
            w={160}
            autoFocus
          />
          <Button type="submit">Adicionar rápido</Button>
        </form>
      </Group>

      {errorMessage && (
        <Alert color="red" icon={<IconAlertCircle size={18} />} mb="md" role="alert">
          {errorMessage}
        </Alert>
      )}

      <TextInput
        label="Buscar item por nome ou número"
        placeholder="Digite para filtrar o cardápio…"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        mb="sm"
      />

      <ScrollArea.Autosize mah={320}>
        {filteredItems.length === 0 && <Text c="dimmed">Nenhum item encontrado.</Text>}
        {filteredItems.map((item) => (
          <Group
            key={item.id}
            justify="space-between"
            py="xs"
            style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}
            wrap="nowrap"
          >
            <div>
              <Text fw={600} size="sm">
                #{item.number} — {item.description}
              </Text>
              <Text size="xs" c="dimmed">
                {formatCurrency(item.price)} · estoque: {item.stock}
              </Text>
            </div>
            <Group gap="xs" wrap="nowrap">
              <NumberInput
                aria-label={`Quantidade de ${item.description}`}
                min={1}
                value={quantities[item.id] ?? 1}
                onChange={(value) => setQuantities((current) => ({ ...current, [item.id]: Number(value) || 1 }))}
                w={72}
                hideControls
              />
              <Button
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={() => handleAddFromList(item.id, item.number, item.description, item.price)}
              >
                Adicionar
              </Button>
            </Group>
          </Group>
        ))}
      </ScrollArea.Autosize>
    </Paper>
  );
}
