import { Alert, Loader, Paper, Stack, Table, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { StockAlertRow } from "./StockAlertRow";
import { useStockAlerts } from "./useStockAlerts";

export function StockAlertsPage() {
  const { data, isLoading, isError } = useStockAlerts();

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Alerta de Estoque</Title>
        <Text c="dimmed">Itens ordenados do menor para o maior estoque, para antecipar reposições.</Text>
      </div>

      <Paper withBorder radius="md" p="lg">
        {isLoading && <Loader size="sm" />}
        {isError && (
          <Alert color="red" icon={<IconAlertCircle size={18} />} role="alert">
            Não foi possível carregar os alertas de estoque.
          </Alert>
        )}
        {data && (
          <>
            {data.criticalCount > 0 && (
              <Alert color="red" icon={<IconAlertCircle size={18} />} mb="md" role="alert">
                {data.criticalCount} item(ns) com estoque zerado ou negativo.
              </Alert>
            )}
            {data.items.length === 0 ? (
              <Text c="dimmed">Nenhum item ativo cadastrado.</Text>
            ) : (
              <Table verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Número</Table.Th>
                    <Table.Th>Descrição</Table.Th>
                    <Table.Th>Estoque</Table.Th>
                    <Table.Th>Severidade</Table.Th>
                    <Table.Th>Ações</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.items.map((item) => (
                    <StockAlertRow key={item.id} item={item} />
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </>
        )}
      </Paper>
    </Stack>
  );
}
