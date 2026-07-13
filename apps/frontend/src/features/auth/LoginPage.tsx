import { Alert, Button, Center, Paper, PasswordInput, Stack, Text, Title, TextInput } from "@mantine/core";
import { IconAlertCircle, IconLockSquareRounded, IconMail } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { type FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { login } from "../../api/auth";
import { getApiErrorMessage } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data);
      const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/caixa";
      navigate(redirectTo, { replace: true });
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Não foi possível entrar. Verifique suas credenciais."));
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/caixa" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    mutation.mutate({ email, password });
  }

  return (
    <Center mih="100vh" bg="gray.0">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ width: 380 }}
      >
        <Paper component="form" onSubmit={handleSubmit} withBorder shadow="md" radius="lg" p="xl">
          <Stack gap="xs" mb="lg">
            <Title order={2} c="brand.6">
              Minibox EJC
            </Title>
            <Text size="sm" c="dimmed">
              Entre com suas credenciais para acessar o sistema.
            </Text>
          </Stack>

          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Alert color="red" icon={<IconAlertCircle size={18} />} mb="md" role="alert">
                  {errorMessage}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <Stack gap="md">
          <TextInput
            label="E-mail"
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            required
            leftSection={<IconMail size={16} />}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <PasswordInput
            label="Senha"
            id="password"
            name="password"
            autoComplete="current-password"
            required
            leftSection={<IconLockSquareRounded size={16} />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button type="submit" loading={mutation.isPending} fullWidth mt="xs">
            {mutation.isPending ? "Entrando…" : "Entrar"}
          </Button>
        </Stack>
      </Paper>
      </motion.div>
    </Center>
  );
}
