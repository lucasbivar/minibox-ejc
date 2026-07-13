# Minibox EJC — Sistema de Vendas

Sistema de controle de consumação e vendas do Minibox (ponto de venda interno do Encontro de Jovens com Cristo). Especificação completa em [`requirements.md`](./requirements.md).

Escopo implementado: todo o documento de requisitos (cardápio, caixa, fiado/quitação, ficha do participante, dashboard com insights, alerta de estoque, autenticação), **exceto a captura de foto por webcam (RF-07)**, deixada para uma evolução futura.

## Stack

- **Backend:** Node.js + TypeScript + Express + Prisma + PostgreSQL, JWT para autenticação.
- **Frontend:** React + TypeScript + Vite, [Mantine](https://mantine.dev) (UI, modo claro fixo, selects pesquisáveis, modais de confirmação, notificações, carrossel do dashboard), React Router, React Query (polling do dashboard), Zustand.
- **Monorepo:** npm workspaces (`apps/backend`, `apps/frontend`, `packages/shared`).

## Como rodar

### 1. Banco de dados

```bash
docker compose up -d
```

Sobe um Postgres na porta `5433` com dois bancos: `minibox` (desenvolvimento) e `minibox_test` (testes automatizados).

### 2. Instalar dependências

```bash
npm install
npm run build --workspace packages/shared
```

### 3. Configurar variáveis de ambiente

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

### 4. Migrar e popular o banco

```bash
cd apps/backend
npx prisma migrate dev
npm run prisma:seed
```

O seed cria as 17 equipes canônicas (Apêndice A do ERS, incluindo a equipe "Minibox") e um usuário administrador inicial — credenciais em `apps/backend/.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`, padrão `admin@minibox.local` / `minibox123`).

### 5. Subir a aplicação

```bash
npm run dev:backend   # API em http://localhost:3333
npm run dev:frontend  # SPA em http://localhost:5173
```

## Testes

```bash
npm run test:backend   # Vitest + Supertest, contra o banco minibox_test
npm run test:frontend  # Vitest + React Testing Library + MSW
```

O banco de testes precisa estar migrado (`DATABASE_URL=... npx prisma migrate deploy` apontando para `minibox_test`, ou repita o passo 4 trocando a URL).

## Estrutura

```
apps/backend/src/modules/    # auth, teams, menu-items, participants, orders, settlements, dashboard
apps/frontend/src/features/  # uma pasta por tela (caixa, cardápio, equipes, participantes, pedidos, dashboard...)
packages/shared/src/         # enums, tipos de API e constantes compartilhados entre backend e frontend
```

## Telas

Caixa · Cardápio (com disponibilidade de item) · Equipes · Participantes (paginado) · Pedidos (filtros, paginação, exclusão) · Ficha do Participante · Dashboard (carrossel automático) · Alerta de Estoque.
# minibox-ejc
