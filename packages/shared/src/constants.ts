export const CANONICAL_TEAM_NAMES: readonly string[] = [
  "Boa Vontade",
  "Imprensaria",
  "Recepção aos Palestrantes",
  "Recepção aos Visitantes",
  "Correios",
  "Trânsito",
  "Bandinha",
  "Ordem",
  "Som e Iluminação",
  "Círculos",
  "J7",
  "Vigília",
  "Liturgia",
  "Apresentadores",
  "Externa",
  "Visitante no Encontro",
  "Minibox",
];

export const DASHBOARD_POLLING_INTERVAL_MS = 20_000;

export const BRAZIL_PHONE_REGEX = /^\+55 \(\d{2}\) \d{4,5}-\d{4}$/;

export const LOW_STOCK_WARNING_THRESHOLD = 10;

export const DAY_PERIOD_LABELS: Record<"MANHA" | "TARDE" | "NOITE", string> = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  NOITE: "Noite",
};

export const DAY_PERIOD_ORDER: readonly ("MANHA" | "TARDE" | "NOITE")[] = ["MANHA", "TARDE", "NOITE"];

export const DAY_PERIOD_HOURS: Record<"MANHA" | "TARDE" | "NOITE", readonly number[]> = {
  MANHA: [6, 7, 8, 9, 10, 11],
  TARDE: [12, 13, 14, 15, 16, 17],
  NOITE: [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5],
};
