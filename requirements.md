# Sistema de Vendas — Minibox EJC
## Especificação de Requisitos de Software (ERS)

**Projeto:** Controle de consumação e vendas do Minibox
**Contexto:** Encontro de Jovens com Cristo (EJC)
**Natureza:** Sistema de controle interno (sem integração com meios de pagamento reais)
**Stack:** React (front-end) · TypeScript (back-end) · PostgreSQL (banco de dados)

---

## 1. Visão Geral

O **Minibox** é o ponto de venda interno do encontro, onde participantes consomem itens (lanches, bebidas etc.). O objetivo deste sistema é **substituir o controle manual** por um registro digital confiável de tudo o que é consumido, por quem, quando, e sob qual condição de pagamento (**pago na hora** ou **fiado**).

O sistema **não processa pagamentos**. Ele é uma ferramenta de **registro e conferência**: o dinheiro/Pix/cartão continua sendo tratado fisicamente pela equipe de caixa; o sistema apenas anota o que aconteceu para que, ao final, seja possível saber quanto entrou, quanto ficou pendente e quem deve o quê.

---

## 2. Objetivos

- Registrar cada compra com **item, quantidade, valor, participante, horário e forma de pagamento**.
- Manter um **cadastro de participantes** organizado por **equipe de serviço**, com foto opcional capturada por webcam.
- Controlar o **estoque do cardápio**, descontando itens vendidos, **sem bloquear** a venda quando o estoque estiver zerado ou negativo.
- Oferecer um **dashboard gerencial** com a saúde financeira do Minibox: devedores, valores em aberto, top pagadores e insights de consumo.
- Ser **rápido de operar no caixa**, com cadastro ágil de participantes que não estejam previamente registrados.

---

## 3. Escopo

**Está no escopo:**

- Cadastro e manutenção do **cardápio** (itens, estoque, preço).
- Cadastro e manutenção de **participantes** e **equipes de serviço**.
- **Tela de caixa/venda** com todo o fluxo de consumação.
- Registro de **fiado** e posterior **quitação** de dívidas.
- **Dashboard** de indicadores.
- Captura de **foto por webcam** no cadastro.

**Está fora do escopo:**

- Integração com adquirentes, maquininhas, gateways de Pix ou qualquer processamento financeiro real.
- Emissão de nota fiscal ou documento fiscal.
- Controle de fluxo de caixa contábil (sangria, troco, fechamento formal de caixa) — pode ser evolução futura.

---

## 4. Premissas e Decisões de Projeto

> **DP-01 — Preço do item (confirmado: preço fixo).** Cada item do cardápio possui um campo **`preco`** com **valor fixo**, definido no cadastro. Esse preço é usado em todas as vendas e nos relatórios financeiros do dashboard, e é congelado no pedido no momento da venda (ver DP-06).

- **DP-02 — "Número" do item.** Interpretado como um **código curto de referência** do item no cardápio (ex.: item nº 5), útil para lançamento rápido no caixa. É **único** dentro do cardápio.
- **DP-03 — Identificação do participante (confirmado: nome completo).** O participante é identificado pelo **nome completo**, cadastrado por extenso, que é a referência usada para localizar a pessoa no caixa. Adicionalmente, pode-se registrar um **celular opcional** (formato brasileiro com código do país e DDD), que **não** é identificador único e serve apenas como contato.
- **DP-04 — Estoque não-bloqueante.** A ausência de estoque **nunca** impede a finalização do pedido. O estoque pode ficar **negativo**, servindo apenas como sinal de alerta interno.
- **DP-05 — Forma de pagamento.** Só se aplica quando o pagamento é **imediato**. Para imediato, a escolha entre **dinheiro / Pix / cartão** é **opcional** (pode ficar em branco). Para **fiado**, não há forma de pagamento no momento da venda.
- **DP-06 — Snapshot de preço.** O preço praticado é **congelado** no item do pedido no momento da venda. Alterações futuras de preço no cardápio **não** afetam pedidos já registrados.

---

## 5. Stack Tecnológica

| Camada | Tecnologia | Observações |
|---|---|---|
| Front-end | **React** + **TypeScript** | SPA responsiva; foco em uso em desktop/tablet no caixa |
| Back-end | **Node.js** + **TypeScript** | API REST (sugestão: Express ou Fastify) |
| Banco de dados | **PostgreSQL** | Modelo relacional descrito na seção 9 |
| ORM (sugestão) | Prisma ou TypeORM | Tipagem forte alinhada ao TypeScript |
| Captura de foto | **API MediaDevices** (`getUserMedia`) | Nativa do navegador, sem dependência extra |
| Autenticação | **JWT** ou sessão simples | Login obrigatório; perfil único (admin), sem controle de papéis |

---

## 6. Atores e Perfis

O sistema possui **um único perfil de acesso (admin)** — todos os usuários autenticados têm acesso total, sem distinção de permissões (ver RF-33). Em termos de uso, dois papéis coexistem na prática, mas com os mesmos direitos:

- **Operador de Caixa:** opera a tela de vendas, cadastra participantes rapidamente e registra pedidos.
- **Administrador:** gerencia cardápio, estoque, equipes, participantes e consulta o dashboard.

Ambos usam as mesmas credenciais de nível admin; a separação acima é apenas descritiva do fluxo de trabalho.

---

## 7. Requisitos Funcionais

### 7.1 Módulo Cardápio

- **RF-01** O sistema deve permitir **cadastrar** um item de cardápio com: **número** (código único), **descrição**, **quantidade em estoque** e **preço** (ver DP-01).
- **RF-02** O sistema deve permitir **editar** e **inativar** itens do cardápio (inativar em vez de excluir, para preservar histórico de vendas).
- **RF-03** O sistema deve permitir **repor estoque** (ajuste manual de quantidade), registrando o ajuste.
- **RF-04** O sistema deve **listar** os itens com seu estoque atual, destacando visualmente itens com estoque **baixo ou negativo**.

### 7.2 Módulo Participantes e Equipes

- **RF-05** O sistema deve permitir **cadastrar equipes de serviço** (nome da equipe).
- **RF-06** O sistema deve permitir **cadastrar participantes** com: **nome completo** (identificação — ver DP-03), **equipe de serviço** e, **opcionalmente**, **celular**. O campo de celular deve aplicar **máscara brasileira** com código do país e DDD, no formato `+55 (00) 00000-0000` (ex.: +55 (11) 91234-5678). O celular **não é obrigatório** e **não é identificador único**.
- **RF-07** O sistema deve permitir associar ao participante uma **foto capturada por webcam**, com opção de **tirar**, **refazer** e **remover** a foto (a foto é **opcional**).
- **RF-08** O sistema deve oferecer, **dentro da tela de vendas**, um atalho de **cadastro rápido** de novo participante (nome completo e equipe, com celular **opcional**), sem que o operador precise sair do fluxo do pedido. Após salvar, o participante já fica selecionado no pedido em andamento.
- **RF-09** O sistema deve permitir **editar** os dados de um participante.

### 7.3 Módulo de Vendas / Caixa

Fluxo obrigatório da tela de vendas:

- **RF-10** O operador deve primeiro **selecionar a equipe** do participante.
- **RF-11** Após a equipe, o operador deve **selecionar o participante** dentro daquela equipe. (Deve haver busca por nome para agilizar.)
- **RF-12** O operador deve **adicionar itens** ao pedido, informando **quantidade** de cada um. A adição pode ser por **número do item** (lançamento rápido) ou por seleção na lista.
- **RF-13** O sistema deve exibir em tempo real o **valor total** do pedido conforme os itens são adicionados.
- **RF-14** O operador deve escolher a **condição de pagamento**: **Fiado** (pagar depois) ou **Imediato**.
- **RF-15** Quando **Imediato**, o operador **pode opcionalmente** indicar a **forma de pagamento**: **Dinheiro**, **Pix** ou **Cartão**.
- **RF-16** Ao **finalizar o pedido**, o sistema deve:
  - **(a)** Persistir o **pedido** com participante, equipe, data/hora, condição e forma de pagamento e valor total.
  - **(b)** Persistir **cada item** do pedido com quantidade, **preço unitário congelado**, subtotal e **horário** da compra.
  - **(c)** **Descontar o estoque** de cada item vendido.
- **RF-17** A finalização **não deve ser bloqueada** por falta de estoque. Se um item não tiver saldo, a venda ocorre normalmente e o estoque pode ficar **negativo** (apenas alerta visual).
- **RF-18** O sistema deve permitir **cancelar/estornar** um pedido registrado por engano, devolvendo o estoque e removendo o impacto financeiro (recomendado registrar o cancelamento em vez de apagar).

### 7.4 Módulo Fiado e Quitação

- **RF-19** O sistema deve manter o **saldo devedor** de cada participante, somando os pedidos **fiados** ainda não quitados.
- **RF-20** O sistema deve permitir **quitar** (total ou parcialmente) a dívida de um participante, registrando **data/hora, valor pago e forma de pagamento** da quitação.
- **RF-21** O histórico de fiado e quitações deve ficar **rastreável** por participante.

### 7.5 Módulo Dashboard

O dashboard deve consolidar a operação e **atualizar-se automaticamente** (ver RF-27, polling). Indicadores esperados:

- **RF-22 — Totais gerais:** total **arrecadado** (pagamentos imediatos + quitações) vs. total **em aberto** (fiado pendente); ticket médio; nº total de pedidos.
- **RF-23 — Top devedores:** ranking de participantes **com maior saldo devedor**, mostrando **quanto cada um deve**, do maior para o menor.
- **RF-24 — Top pagantes:** ranking de participantes que **mais pagaram** (soma de pagamentos imediatos + quitações), do maior para o menor.
- **RF-25 — Top pedidos:** ranking de participantes que **fizeram mais pedidos** (mais passagens pelo caixa), independente de valor.
- **RF-26 — Insights extras (criatividade):**
  - **Maiores consumidores no total** (fiado + pago somados — quem mais consumiu o Minibox).
  - **Itens mais vendidos** (por quantidade e por receita) e o **item campeão** do encontro.
  - **Consumo por equipe** (qual equipe mais consome e qual mais deve — um "ranking de equipes").
  - **Distribuição por forma de pagamento** (dinheiro × Pix × cartão).
  - **Vendas ao longo do tempo** (por hora/dia — identifica **horários de pico** do caixa).
  - **Taxa de conversão fiado → pago** (quanto do total fiado já foi quitado).
  - **Devedores "zerados"** (participantes com fiado 100% em aberto, que ainda não pagaram nada) — bom para cobrança.
  - **Maiores quitadores** (quem mais pagou dívidas até agora).
  - **Alertas de estoque** (itens zerados ou negativos — atalho para a tela de alerta).
- **RF-27 — Atualização por polling:** o dashboard deve se **atualizar automaticamente** consultando o back-end em **intervalos regulares** (*polling*), sem que o operador precise recarregar a página. As consultas são **recalculadas no back-end** a cada requisição, refletindo as vendas mais recentes em quase tempo real. Deve haver indicação visual do **horário da última atualização**.

> **DP-07 — Intervalo de polling (a confirmar).** Sugere-se um intervalo padrão de **15 a 30 segundos**. Intervalos muito curtos aumentam a carga do back-end sem ganho prático para o Minibox; o valor pode ser ajustado conforme o volume de vendas e o desempenho observado.

### 7.6 Módulo de Alerta de Estoque

Tela **dedicada** e separada do dashboard, focada em antecipar reposição dos itens que estão acabando **segundo o controle de vendas** — sem depender de nenhum limiar cadastrado.

- **RF-28 — Ordenação por menor quantidade:** a tela deve listar os itens do cardápio **ordenados pela quantidade em estoque em ordem crescente** (os que têm menos unidades aparecem primeiro), de modo que os itens perto de acabar fiquem sempre no topo.
- **RF-29 — Destaque de severidade:** itens **zerados** ou **negativos** devem ser destacados como **críticos** (ex.: cor de alerta), e os demais devem ter destaque visual proporcional a quão baixo está o estoque, sem necessidade de configuração por item.
- **RF-30 — Ações rápidas:** a partir da tela de alerta, o operador deve conseguir **repor estoque** (RF-03) diretamente, sem navegar para outra tela.
- **RF-31 — Indicador global:** deve haver um **contador/badge** visível na navegação principal indicando quantos itens estão zerados/negativos, para chamar atenção mesmo quando a tela não estiver aberta.

### 7.7 Módulo de Autenticação / Acesso

- **RF-32 — Login obrigatório:** o acesso à plataforma deve exigir **autenticação** (login com e-mail/usuário e senha). Todas as telas ficam protegidas atrás do login.
- **RF-33 — Perfil único (admin):** **não há distinção de permissões ou tipos de usuário** — todos os usuários autenticados têm acesso total (perfil admin). Não é necessário controle de papéis.
- **RF-34 — Logout:** o usuário deve conseguir **encerrar a sessão** a qualquer momento.
- **RF-35 — Cadastro de usuários do sistema:** deve haver uma forma de **criar credenciais de acesso** para novos operadores (pode ser uma tela simples de cadastro ou seed inicial), armazenando a senha de forma segura (**hash**, nunca em texto puro).

> **DP-08 — Escopo de segurança.** Como todos os usuários são admin e o uso é interno ao encontro, a autenticação pode ser **simples** (sessão ou JWT). O foco é impedir acesso casual de terceiros, não implementar controle de acesso granular.

### 7.8 Módulo de Ficha do Participante

Tela **dedicada** que consolida tudo sobre uma pessoa, servindo como o local central para consulta e quitação.

- **RF-36 — Dados cadastrais:** exibir **nome completo**, **celular** (se houver), **equipe** e **foto** do participante.
- **RF-37 — Situação financeira:** exibir de forma clara **total consumido**, **total já pago** (pagamentos imediatos + quitações) e **total em aberto** (saldo devedor atual — ver RN-05).
- **RF-38 — Histórico de pedidos:** listar todos os **pedidos** do participante com **data/hora**, **itens comprados** (descrição e quantidade), **valor**, **condição** (fiado ou imediato) e, quando imediato, a **forma de pagamento**.
- **RF-39 — Histórico de quitações:** listar todas as **quitações** já registradas (data/hora, valor e forma de pagamento).
- **RF-40 — Quitação pela ficha:** permitir registrar uma **quitação** diretamente na tela, tanto **total** (paga todo o saldo devedor) quanto **parcial** (paga parte do valor), atualizando o saldo em seguida (reaproveita RF-20 / RN-05).

---

## 8. Requisitos Não Funcionais

- **RNF-01 — Usabilidade:** a tela de caixa deve ser **rápida e à prova de erro**, com poucos cliques por venda e **busca por nome**. Prioridade para uso em **tablet ou notebook**.
- **RNF-02 — Responsividade:** interface adaptável a telas de desktop e tablet.
- **RNF-03 — Operação online.** O sistema opera **online**, com o back-end e o banco acessíveis durante o uso. **Não há requisito de funcionamento offline** — pressupõe-se conexão disponível no local do caixa.
- **RNF-04 — Integridade:** operações de finalização de pedido devem ser **transacionais** (pedido, itens e baixa de estoque no mesmo commit).
- **RNF-05 — Privacidade:** fotos e dados de participantes são de **uso interno** do encontro; devem ser tratados com cuidado e removíveis.
- **RNF-06 — Auditabilidade:** registros de venda, cancelamento e quitação não devem ser apagados silenciosamente; preferir **inativação/estorno** rastreável.

---

## 9. Modelo de Dados (PostgreSQL)

Descrição das entidades e relacionamentos principais.

### Entidades

**`equipes`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID / serial (PK) | |
| nome | text | Nome da equipe de serviço |
| criado_em | timestamptz | |

**`participantes`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID / serial (PK) | |
| nome | text | **Nome completo** — identificação da pessoa (DP-03) |
| celular | text (nullable) | Opcional; formato BR `+55 (00) 00000-0000`; não é único |
| equipe_id | FK → equipes.id | |
| foto_url | text (nullable) | Caminho/URL da foto da webcam |
| criado_em | timestamptz | |

**`itens_cardapio`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID / serial (PK) | |
| numero | int (unique) | Código de referência (ver DP-02) |
| descricao | text | |
| preco | numeric(10,2) | Ver DP-01 |
| estoque | int | Pode ficar negativo (DP-04) |
| ativo | boolean | Inativação em vez de exclusão |
| criado_em | timestamptz | |

**`pedidos`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID / serial (PK) | |
| participante_id | FK → participantes.id | |
| equipe_id | FK → equipes.id | Denormalizado p/ relatório por equipe |
| data_hora | timestamptz | Horário do pedido |
| condicao_pagamento | enum (`fiado`, `imediato`) | |
| forma_pagamento | enum (`dinheiro`, `pix`, `cartao`) nullable | Só p/ imediato e opcional (DP-05) |
| valor_total | numeric(10,2) | |
| status | enum (`ativo`, `cancelado`) | Estorno rastreável (RF-18) |
| operador_id | FK (nullable) | Quem estava no caixa (opcional) |

**`itens_pedido`**
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID / serial (PK) | |
| pedido_id | FK → pedidos.id | |
| item_cardapio_id | FK → itens_cardapio.id | |
| quantidade | int | |
| preco_unitario | numeric(10,2) | **Snapshot** do preço (DP-06) |
| subtotal | numeric(10,2) | quantidade × preço_unitario |
| data_hora | timestamptz | Horário do item (RF-16b) |

**`quitacoes`** (pagamentos de fiado feitos depois)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID / serial (PK) | |
| participante_id | FK → participantes.id | |
| valor | numeric(10,2) | Total ou parcial |
| forma_pagamento | enum (`dinheiro`, `pix`, `cartao`) | |
| data_hora | timestamptz | |

**`usuarios_sistema`** (credenciais de login — todos admin)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID / serial (PK) | |
| nome | text | |
| email | text (unique) | Usado no login |
| senha_hash | text | Senha com **hash** (ex.: bcrypt); nunca em texto puro |
| criado_em | timestamptz | |

### Relacionamentos

- Uma **equipe** tem muitos **participantes**.
- Um **participante** tem muitos **pedidos** e muitas **quitações**.
- Um **pedido** tem muitos **itens_pedido**.
- Um **item_cardapio** aparece em muitos **itens_pedido**.

### Cálculo do saldo devedor

```
saldo_devedor(participante) =
    SUM(valor_total de pedidos WHERE condicao = 'fiado' AND status = 'ativo')
  − SUM(valor de quitacoes do participante)
```

---

## 10. Contrato de API (Back-end TypeScript)

Sugestão de endpoints REST (nomes ilustrativos):

**Autenticação**
- `POST /auth/login` — autentica (e-mail + senha) e retorna token/sessão
- `POST /auth/logout` — encerra a sessão
- `POST /auth/usuarios` — cria credencial de acesso (novo usuário admin)

**Cardápio**
- `GET /itens` — lista itens (com filtro de estoque baixo)
- `POST /itens` — cria item
- `PATCH /itens/:id` — edita item / repõe estoque
- `PATCH /itens/:id/inativar`
- `GET /itens/alertas` — itens ordenados por menor quantidade em estoque, com marcação de zerados/negativos (RF-28, RF-29)

**Equipes e participantes**
- `GET /equipes`
- `POST /equipes`
- `GET /participantes?equipeId=` — lista por equipe (com busca por **nome completo**)
- `GET /participantes/:id/ficha` — ficha completa: dados, pedidos, itens, pagamentos, quitações e saldo (RF-36 a RF-39)
- `POST /participantes` — cadastro (usado também pelo cadastro rápido do caixa)
- `PATCH /participantes/:id`
- `POST /participantes/:id/foto` — upload da imagem capturada

**Vendas**
- `POST /pedidos` — cria pedido completo (itens + condição + forma), **transacional**, com baixa de estoque
- `POST /pedidos/:id/cancelar` — estorna pedido e devolve estoque

**Fiado**
- `GET /participantes/:id/saldo` — saldo devedor atual
- `POST /participantes/:id/quitacoes` — registra quitação total/parcial

**Dashboard** *(consultados por polling — RF-27; recalculados no back-end a cada chamada)*
- `GET /dashboard/resumo` — totais gerais (arrecadado, em aberto, ticket médio, nº de pedidos)
- `GET /dashboard/top-devedores` — ranking por maior saldo devedor (RF-23)
- `GET /dashboard/top-pagantes` — ranking por maior valor pago (RF-24)
- `GET /dashboard/top-pedidos` — ranking por nº de pedidos (RF-25)
- `GET /dashboard/insights` — maiores consumidores, itens mais vendidos, consumo por equipe, formas de pagamento, série temporal, conversão fiado→pago, devedores zerados, maiores quitadores (RF-26)

> **Observação sobre polling:** o front-end consulta esses endpoints em intervalo regular (ver DP-07) e exibe o horário da última atualização. Alternativamente, um único `GET /dashboard` pode agregar tudo numa resposta para reduzir o número de requisições por ciclo.

> **Payload de exemplo — criar pedido**
> ```json
> {
>   "participanteId": "…",
>   "condicaoPagamento": "imediato",
>   "formaPagamento": "pix",
>   "itens": [
>     { "itemCardapioId": "…", "quantidade": 2 },
>     { "itemCardapioId": "…", "quantidade": 1 }
>   ]
> }
> ```
> O back-end calcula `preco_unitario`, `subtotal` e `valor_total` a partir do cardápio no momento da requisição (não confiar em valores enviados pelo front).

---

## 11. Regras de Negócio

- **RN-01** O valor do pedido é sempre calculado no **back-end**, a partir do preço vigente do item no momento da venda.
- **RN-02** Estoque é descontado na finalização; **falta de estoque não bloqueia** (DP-04) e pode gerar saldo negativo.
- **RN-03** `forma_pagamento` só é válida quando `condicao_pagamento = imediato`; para `fiado` deve ser nula.
- **RN-04** Pedidos **fiados** entram no **saldo devedor**; pedidos **imediatos** entram no total arrecadado.
- **RN-05** Uma **quitação** abate o **saldo global** do participante (confirmado), **não** sendo atrelada a nenhum pedido específico. O saldo devedor é sempre o total de fiado menos o total já quitado.
- **RN-06** Cancelar um pedido **ativo** devolve o estoque e retira o valor dos relatórios.

---

## 12. Fluxos Principais

**Fluxo de venda (caso de uso central):**
1. Usuário faz **login** (perfil admin).
2. Operador abre a **tela de caixa**.
3. Seleciona a **equipe** → seleciona o **participante** pelo **nome completo** (ou usa o **cadastro rápido** se a pessoa não existir).
4. Adiciona **itens** com quantidade (por número do item ou busca).
5. Confere o **valor total**.
6. Escolhe **fiado** ou **imediato** (e, se imediato, opcionalmente **dinheiro/Pix/cartão**).
7. **Finaliza** → sistema grava pedido, itens com horário, baixa estoque.
8. Confirmação na tela; caixa pronto para o próximo.

**Fluxo de cadastro com foto:**
1. No cadastro do participante, operador clica em **"Tirar foto"**.
2. Navegador solicita permissão da **webcam** (`getUserMedia`).
3. Preview ao vivo → **capturar** → **refazer** se necessário.
4. Imagem é salva e associada ao participante.

**Fluxo de quitação de fiado:**
1. Na **ficha do participante** (ou no dashboard de devedores), operador vê o **saldo devedor** e o histórico.
2. Registra uma **quitação total ou parcial** (valor + forma de pagamento).
3. Saldo é recalculado e refletido na ficha.

---

## 13. Considerações de Front-end (React)

- **Telas principais:** (1) Login, (2) Caixa/Venda, (3) Cardápio, (4) Participantes & Equipes, (5) Ficha do Participante, (6) Dashboard, (7) Alerta de Estoque.
- **Ficha do Participante:** acessível a partir da lista de participantes e do dashboard de devedores; reúne dados cadastrais, histórico de pedidos/itens, situação financeira e a ação de **quitação total ou parcial**.
- **Login:** tela de entrada que protege todo o restante da aplicação; após autenticar, o usuário navega livremente (perfil único admin). Rotas privadas redirecionam para o login quando não há sessão válida.
- **Tela de Caixa** é a mais crítica: fluxo linear (equipe → pessoa → itens → pagamento → finalizar), com **busca instantânea**, **lançamento por número** e **botão de cadastro rápido** sempre visível.
- **Webcam:** componente isolado usando `navigator.mediaDevices.getUserMedia({ video: true })`, renderizando o stream em `<video>` e capturando o frame em `<canvas>` para gerar a imagem (base64/blob) enviada ao back-end.
- **Estado:** recomendável um gerenciador leve (Context/Zustand) para o carrinho do pedido em andamento.
- **Feedback visual:** destaque para itens sem estoque (sem bloquear), confirmação clara ao finalizar, e badges de "fiado" vs "pago".
- **Dashboard:** gráficos para série temporal, distribuição por forma de pagamento e rankings (barras) — top devedores, top pagantes, top pedidos. Deve **atualizar via polling** (ver DP-07), buscando os dados do back-end em intervalo regular e exibindo o **horário da última atualização**; usar um hook de intervalo (ex.: `setInterval`/`useEffect`) ou uma lib de data-fetching com *refetch* automático (ex.: React Query com `refetchInterval`).

---

## 14. Decisões Confirmadas

Os pontos que estavam em aberto foram decididos:

1. **Preço no cardápio (DP-01):** cada item tem **preço fixo** definido no cadastro.
2. **Quitação (RN-05):** abate o **saldo global** do participante, sem amarrar a pedidos específicos.
3. **Identificação do participante (DP-03):** feita por **nome completo**. O **celular** é um campo **opcional** (máscara BR `+55 (00) 00000-0000`), sem ser identificador único.
4. **Operação offline (RNF-03):** **não é necessária** — o sistema opera online.
5. **Projeção de esgotamento:** **removida**. A tela de alerta usa apenas a **ordenação por menor quantidade** (RF-28), que já resolve o objetivo de identificar o que está acabando.

Nenhum ponto pendente de decisão para o início da implementação.

---

## 15. Sugestão de Priorização (MVP)

**MVP (essencial para operar no encontro):**
- Login (RF-32 a RF-35)
- Cardápio (RF-01 a RF-04)
- Equipes e participantes + cadastro rápido (RF-05, RF-06, RF-08)
- Tela de vendas completa (RF-10 a RF-17)
- Saldo devedor e quitação (RF-19 a RF-21)
- Ficha do participante (RF-36 a RF-40)
- Dashboard: totais, rankings (top devedores, top pagantes, top pedidos) e atualização por polling (RF-22 a RF-25, RF-27)
- Tela de alerta de estoque por ordenação de quantidade (RF-28 a RF-31)

**Segunda onda:**
- Foto por webcam (RF-07)
- Insights extras do dashboard (RF-26)
- Cancelamento/estorno (RF-18)

**Evolução futura:**
- Controle de caixa (sangria, fechamento)

---

## 16. Apêndice A — Dados Iniciais: Equipes

Lista canônica de equipes a serem cadastradas no banco (`equipes`). São **15 equipes de serviço** mais a categoria **"Visitante no Encontro"**, usada para associar participantes que não integram nenhuma equipe de serviço, além da equipe **"Minibox"** (própria equipe de operação do ponto de venda).

1. Boa Vontade
2. Imprensaria
3. Recepção aos Palestrantes
4. Recepção aos Visitantes
5. Correios
6. Trânsito
7. Bandinha
8. Ordem
9. Som e Iluminação
10. Círculos
11. J7
12. Vigília
13. Liturgia
14. Apresentadores
15. Externa
16. Visitante no Encontro
17. Minibox

> O seed correspondente está no arquivo **`seed_equipes.sql`** (PostgreSQL), idempotente e pronto para execução.

---

*Documento de requisitos — todas as decisões da Seção 14 confirmadas; pronto para iniciar a implementação.*