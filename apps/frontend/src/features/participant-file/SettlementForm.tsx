import { Alert, Button, Group, NumberInput, Select, Text } from "@mantine/core";
import { PAYMENT_METHOD_LABELS, PaymentMethod } from "@minibox/shared";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { type FormEvent, useState } from "react";
import { getApiErrorMessage } from "../../api/client";
import { useCreateSettlementMutation } from "./useParticipantFile";

const PAYMENT_METHOD_OPTIONS = Object.values(PaymentMethod).map((method) => ({
  value: method,
  label: PAYMENT_METHOD_LABELS[method],
}));

export function SettlementForm({ participantId, outstandingBalance }: { participantId: string; outstandingBalance: number }) {
  const createSettlement = useCreateSettlementMutation(participantId);
  const [amount, setAmount] = useState<number | string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function submitAmount(value: number) {
    setErrorMessage(null);
    setSuccessMessage(null);
    createSettlement.mutate(
      { amount: value, paymentMethod },
      {
        onSuccess: () => {
          setAmount("");
          setSuccessMessage("Quitação registrada com sucesso.");
        },
        onError: (error) => setErrorMessage(getApiErrorMessage(error, "Não foi possível registrar a quitação.")),
      },
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitAmount(Number(amount));
  }

  if (outstandingBalance <= 0) {
    return <Text c="dimmed">Este participante não possui saldo em aberto.</Text>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {errorMessage && (
        <Alert color="red" icon={<IconAlertCircle size={18} />} mb="md" role="alert">
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert color="green" icon={<IconCheck size={18} />} mb="md">
          {successMessage}
        </Alert>
      )}

      <Group align="end">
        <NumberInput
          id="settlement-amount"
          label="Valor a quitar"
          min={0.01}
          decimalScale={2}
          fixedDecimalScale
          required
          value={amount}
          onChange={setAmount}
          w={160}
        />
        <Select
          id="settlement-payment-method"
          label="Forma de pagamento"
          searchable
          data={PAYMENT_METHOD_OPTIONS}
          value={paymentMethod}
          onChange={(value) => setPaymentMethod((value as PaymentMethod) ?? PaymentMethod.CASH)}
          w={180}
        />
        <Button type="submit" loading={createSettlement.isPending}>
          Quitar parcial
        </Button>
        <Button
          type="button"
          variant="default"
          disabled={createSettlement.isPending}
          onClick={() => submitAmount(outstandingBalance)}
        >
          Quitar tudo ({outstandingBalance.toFixed(2)})
        </Button>
      </Group>
    </form>
  );
}
