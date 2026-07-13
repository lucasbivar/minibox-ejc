import { Alert, Button, Group, NumberInput, Paper, TextInput, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { type FormEvent, useState } from "react";
import { getApiErrorMessage } from "../../api/client";
import { useMenuItemMutations } from "./useMenuItems";

export function CreateMenuItemForm() {
  const { create } = useMenuItemMutations();
  const [number, setNumber] = useState<number | string>("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [stock, setStock] = useState<number | string>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    create.mutate(
      {
        number: Number(number),
        description,
        price: Number(price),
        stock: Number(stock),
      },
      {
        onSuccess: () => {
          setNumber("");
          setDescription("");
          setPrice("");
          setStock(0);
        },
        onError: (error) => setErrorMessage(getApiErrorMessage(error, "Não foi possível cadastrar o item.")),
      },
    );
  }

  return (
    <Paper component="form" withBorder radius="md" p="lg" onSubmit={handleSubmit} aria-label="Novo item do cardápio">
      <Title order={2} mb="md">
        Novo item do cardápio
      </Title>
      {errorMessage && (
        <Alert color="red" icon={<IconAlertCircle size={18} />} mb="md" role="alert">
          {errorMessage}
        </Alert>
      )}
      <Group align="end">
        <NumberInput
          id="new-item-number"
          label="Número"
          min={1}
          required
          value={number}
          onChange={setNumber}
          w={100}
        />
        <TextInput
          id="new-item-description"
          label="Descrição"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          style={{ flex: 1 }}
        />
        <NumberInput
          id="new-item-price"
          label="Preço (R$)"
          min={0.01}
          decimalScale={2}
          fixedDecimalScale
          required
          value={price}
          onChange={setPrice}
          w={130}
        />
        <NumberInput
          id="new-item-stock"
          label="Estoque inicial"
          min={0}
          required
          value={stock}
          onChange={setStock}
          w={130}
        />
        <Button type="submit" loading={create.isPending}>
          Adicionar
        </Button>
      </Group>
    </Paper>
  );
}
