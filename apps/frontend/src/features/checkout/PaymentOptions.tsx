import { Group, Paper, Radio, Title } from "@mantine/core";
import { PAYMENT_METHOD_LABELS, PaymentMethod } from "@minibox/shared";
import { useCartStore } from "../../stores/cartStore";

const PAYMENT_METHODS = Object.values(PaymentMethod);
const NO_PREFERENCE = "__none__";

export function PaymentOptions() {
  const condition = useCartStore((state) => state.condition);
  const paymentMethod = useCartStore((state) => state.paymentMethod);
  const setCondition = useCartStore((state) => state.setCondition);
  const setPaymentMethod = useCartStore((state) => state.setPaymentMethod);

  return (
    <Paper withBorder radius="md" p="lg">
      <Title order={2} mb="md">
        4. Condição de pagamento
      </Title>

      <Radio.Group
        label="Condição de pagamento"
        value={condition}
        onChange={(value) => setCondition(value as typeof condition)}
        mb={condition === "IMMEDIATE" ? "md" : 0}
      >
        <Group mt="xs">
          <Radio value="IMMEDIATE" label="Imediato" />
          <Radio value="ON_CREDIT" label="Fiado" />
        </Group>
      </Radio.Group>

      {condition === "IMMEDIATE" && (
        <Radio.Group
          label="Forma de pagamento"
          value={paymentMethod ?? NO_PREFERENCE}
          onChange={(value) => setPaymentMethod(value === NO_PREFERENCE ? null : (value as PaymentMethod))}
        >
          <Group mt="xs">
            <Radio value={NO_PREFERENCE} label="Não informar" />
            {PAYMENT_METHODS.map((method) => (
              <Radio key={method} value={method} label={PAYMENT_METHOD_LABELS[method]} />
            ))}
          </Group>
        </Radio.Group>
      )}
    </Paper>
  );
}
