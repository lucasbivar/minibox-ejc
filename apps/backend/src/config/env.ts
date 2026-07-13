import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3333),
  databaseUrl:
    process.env.NODE_ENV === "test"
      ? (process.env.TEST_DATABASE_URL ?? requireEnv("DATABASE_URL"))
      : requireEnv("DATABASE_URL"),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-nao-use-em-producao",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
  admin: {
    name: process.env.ADMIN_NAME ?? "Administrador",
    email: process.env.ADMIN_EMAIL ?? "admin@minibox.local",
    password: process.env.ADMIN_PASSWORD ?? "minibox123",
  },
};
