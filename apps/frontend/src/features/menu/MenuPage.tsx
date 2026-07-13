import { Alert, Group, Loader, Paper, Stack, Table, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { CreateMenuItemForm } from "./CreateMenuItemForm";
import { MenuItemRow } from "./MenuItemRow";
import { useMenuItemsQuery } from "./useMenuItems";

export function MenuPage() {
  const { data: items, isLoading, isError } = useMenuItemsQuery();

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Cardápio</Title>
        <Text c="dimmed">Cadastre itens, reponha estoque e acompanhe o que está acabando.</Text>
      </div>

      <CreateMenuItemForm />

      <Paper withBorder radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Title order={2} m={0}>
            Itens cadastrados
          </Title>
        </Group>

        {isLoading && <Loader size="sm" />}
        {isError && (
          <Alert color="red" icon={<IconAlertCircle size={18} />} role="alert">
            Não foi possível carregar o cardápio.
          </Alert>
        )}

        {items && items.length === 0 && <Text c="dimmed">Nenhum item cadastrado ainda.</Text>}

        {items && items.length > 0 && (
          <Table verticalSpacing="xs" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Número</Table.Th>
                <Table.Th>Descrição</Table.Th>
                <Table.Th>Preço</Table.Th>
                <Table.Th>Estoque</Table.Th>
                <Table.Th>Disponibilidade</Table.Th>
                <Table.Th>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((item) => (
                <MenuItemRow key={item.id} item={item} />
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}
