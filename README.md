# WareSync

Sistema web de gestão empresarial com foco em **controle de estoque, produtos, vendas, clientes, financeiro e operações relacionadas**, desenvolvido com **React, Node.js, Express, TypeScript, PostgreSQL e Prisma ORM**.

O projeto está passando por uma modernização estrutural: o frontend legado em HTML/CSS/JavaScript está sendo migrado para **React + Vite**, enquanto o backend existente está sendo gradualmente migrado de SQL manual com `pg` para **Prisma ORM**.

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Objetivo](#objetivo)
- [Status atual](#status-atual)
- [Principais funcionalidades](#principais-funcionalidades)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Arquitetura](#arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Frontend](#frontend)
- [Backend](#backend)
- [Banco de dados](#banco-de-dados)
- [Prisma ORM](#prisma-orm)
- [Autenticação](#autenticação)
- [Módulo de produtos](#módulo-de-produtos)
- [Instalação](#instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Executando o projeto](#executando-o-projeto)
- [Credenciais de desenvolvimento](#credenciais-de-desenvolvimento)
- [Rotas principais](#rotas-principais)
- [Scripts úteis](#scripts-úteis)
- [Documentação complementar](#documentação-complementar)
- [Roadmap](#roadmap)
- [Boas práticas do projeto](#boas-práticas-do-projeto)
- [Licença](#licença)
- [Autor](#autor)

---

## Sobre o projeto

O **WareSync** é um sistema de gestão que centraliza operações importantes de uma empresa em uma única aplicação.

A aplicação foi projetada para oferecer recursos relacionados a:

- controle de produtos;
- estoque;
- movimentações de estoque;
- clientes;
- vendas;
- financeiro;
- caixa;
- fornecedores;
- inventários;
- transferências;
- documentos fiscais;
- relatórios;
- usuários e autenticação.

O projeto já possuía uma base funcional com frontend em HTML/CSS/JavaScript, backend em Node.js/Express/TypeScript e banco PostgreSQL.

A arquitetura está sendo modernizada para:

```text
React
   ↓
React Router
   ↓
Services / API
   ↓
Node.js + Express + TypeScript
   ↓
Prisma ORM
   ↓
PostgreSQL
```

Durante essa transição, módulos ainda não migrados continuam utilizando `pg` e SQL manual.

---

## Objetivo

O objetivo do WareSync é oferecer uma aplicação organizada, escalável e de fácil manutenção para gerenciamento de operações empresariais.

A modernização atual busca:

- migrar o frontend para React;
- componentizar interfaces reutilizáveis;
- reduzir manipulações diretas de DOM;
- centralizar chamadas HTTP;
- utilizar roteamento no frontend;
- fortalecer autenticação e proteção de rotas;
- migrar gradualmente o acesso ao banco para Prisma;
- preservar o banco PostgreSQL existente;
- melhorar legibilidade e manutenção do backend;
- manter histórico de alterações e documentação do projeto.

---

## Status atual

O projeto está em **desenvolvimento ativo**.

### Concluído

- [x] Novo frontend em React + Vite
- [x] React Router
- [x] Layout principal com Sidebar e Topbar
- [x] Dashboard React integrado ao backend
- [x] Login em React
- [x] Sessão via Express
- [x] Rotas protegidas
- [x] Logout
- [x] Exibição do usuário autenticado
- [x] PostgreSQL integrado
- [x] Prisma ORM 7.10.0 configurado
- [x] Introspecção do banco existente
- [x] Prisma Client gerado
- [x] Módulo de Produtos migrado para Prisma
- [x] Listagem de produtos no React
- [x] Busca por produtos
- [x] Cadastro de produtos
- [x] Movimentação de estoque
- [x] Entrada, saída e ajuste de estoque
- [x] Validação de estoque insuficiente
- [x] Atualização automática da tabela após movimentação

### Em andamento

- [ ] Edição de produtos no frontend React
- [ ] Inativação de produtos pelo frontend
- [ ] Histórico de movimentações no frontend
- [ ] Migração das demais páginas legadas para React
- [ ] Migração dos demais módulos do backend para Prisma

---

## Principais funcionalidades

### Dashboard

O Dashboard apresenta informações gerais do sistema, incluindo:

- total de clientes;
- total de produtos;
- valor total em estoque;
- vendas do dia;
- quantidade de vendas;
- ticket médio;
- vendas recentes;
- produtos com estoque baixo;
- clientes recentes.

---

### Produtos

O módulo de Produtos já possui:

- listagem;
- busca por nome;
- busca por SKU;
- busca por código de barras;
- filtro por categoria no backend;
- cadastro;
- atualização;
- inativação lógica;
- relacionamento com categorias;
- controle de preço;
- dados fiscais;
- estoque mínimo;
- estoque máximo.

---

### Estoque

O controle de estoque suporta:

- entrada;
- saída;
- ajuste;
- histórico de movimentações;
- registro do usuário responsável;
- motivo da movimentação;
- saldo resultante;
- bloqueio de estoque negativo;
- transações no banco.

Produtos novos começam com:

```text
estoque_atual = 0
```

O estoque deve ser alterado através de uma movimentação, garantindo rastreabilidade.

---

### Autenticação

O sistema utiliza autenticação baseada em sessão.

Já estão implementados:

- login;
- verificação de sessão;
- proteção de rotas;
- redirecionamento para `/login`;
- exibição do usuário autenticado;
- cargo do usuário;
- logout;
- cookie de sessão.

---

## Tecnologias utilizadas

### Frontend

- React
- Vite
- React Router
- JavaScript
- CSS
- Fetch API
- ESLint

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM
- Prisma Client
- `@prisma/adapter-pg`
- `pg`
- bcrypt
- Express Session

### Banco

- PostgreSQL

### Desenvolvimento

- Git
- GitHub
- npm
- VS Code
- PowerShell / terminal

---

## Arquitetura

A arquitetura atual é:

```text
┌──────────────────────────────┐
│          React + Vite        │
│                              │
│ Pages                        │
│ Components                   │
│ React Router                 │
│ Services                     │
└──────────────┬───────────────┘
               │ HTTP
               ▼
┌──────────────────────────────┐
│ Node.js + Express + TS       │
│                              │
│ Routes                       │
│ Controllers                  │
│ Services                     │
│ Middlewares                  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Prisma ORM / pg              │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ PostgreSQL                   │
└──────────────────────────────┘
```

O `pg` permanece temporariamente porque a migração para Prisma está sendo feita módulo por módulo.

---

## Estrutura do projeto

Estrutura simplificada:

```text
WareSync/
├── backend/
│   ├── database/
│   │   ├── schema.sql
│   │   ├── 002_estoque.sql
│   │   ├── 003_financeiro.sql
│   │   ├── 004_complementos.sql
│   │   └── 005_fluxograma.sql
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── scripts/
│   │   └── seed-admin.js
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── prisma.ts
│   │   │
│   │   ├── generated/
│   │   │   └── prisma/
│   │   │
│   │   ├── middlewares/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── produtos/
│   │   │   ├── clientes/
│   │   │   ├── vendas/
│   │   │   ├── estoque/
│   │   │   ├── financeiro/
│   │   │   └── ...
│   │   │
│   │   └── app.ts
│   │
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   ├── prisma.config.ts
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   │   └── assets/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   └── layouts/
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Produtos.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── dashboardService.js
│   │   │   └── produtosService.js
│   │   │
│   │   ├── styles/
│   │   │   ├── dashboard.css
│   │   │   ├── login.css
│   │   │   └── variables.css
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── package-lock.json
│
├── frontend-legacy/
│   └── public/
│
├── .gitignore
├── LICENSE
├── UPDATES.md
├── GUIA_INSTALACAO.md
└── README.md
```

---

## Frontend

O frontend atual foi criado com React e Vite.

A versão anterior em HTML/CSS/JavaScript permanece em:

```text
frontend-legacy/
```

Essa pasta serve como referência durante a migração.

### Layout

O layout compartilhado foi convertido para React.

Principais componentes:

```text
AppLayout
├── Sidebar
├── Topbar
└── Outlet
```

A navegação utiliza React Router.

Exemplos de rotas:

```text
/dashboard
/estoque/produtos
/login
```

---

## Backend

O backend utiliza arquitetura modular.

Os módulos são organizados em áreas como:

```text
auth
produtos
clientes
vendas
estoque
financeiro
...
```

O backend é responsável por:

- autenticação;
- validações;
- regras de negócio;
- integração com PostgreSQL;
- acesso via Prisma;
- controle de sessão;
- respostas da API.

---

## Banco de dados

O WareSync utiliza PostgreSQL.

O banco atual possui aproximadamente **20 modelos/tabelas identificados pelo Prisma**, incluindo estruturas relacionadas a:

- usuários;
- clientes;
- categorias;
- produtos;
- vendas;
- itens de venda;
- movimentações de estoque;
- contas a pagar;
- contas a receber;
- sessões de caixa;
- movimentações de caixa;
- fornecedores;
- relações produto-fornecedor;
- devoluções;
- itens de devolução;
- inventários;
- itens de inventário;
- transferências de estoque;
- documentos fiscais.

O banco possui também `CHECK CONSTRAINTS` mantidas diretamente pelo PostgreSQL.

---

## Prisma ORM

O projeto utiliza:

```text
Prisma CLI: 7.10.0
@prisma/client: 7.10.0
@prisma/adapter-pg: 7.10.0
```

O banco já existia antes da integração com Prisma.

Foi utilizada introspecção:

```bash
npx prisma db pull
```

O Prisma identificou 20 modelos existentes.

Depois foi gerado o Prisma Client:

```bash
npx prisma generate
```

O Client é gerado em:

```text
backend/src/generated/prisma/
```

Essa pasta não deve ser editada manualmente.

### Configuração

O projeto utiliza:

```text
backend/prisma.config.ts
```

e:

```text
backend/prisma/schema.prisma
```

O Client está configurado para CommonJS:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}
```

---

## Autenticação

O login utiliza sessão do Express.

Fluxo:

```text
Login React
    ↓
POST /api/auth/login
    ↓
Express
    ↓
Sessão
    ↓
Cookie
    ↓
ProtectedRoute
```

As chamadas autenticadas utilizam:

```javascript
credentials: 'include'
```

A rota de sessão é utilizada para validar o usuário autenticado.

Quando uma sessão não é válida, o frontend redireciona automaticamente para:

```text
/login
```

---

## Módulo de produtos

O módulo de Produtos foi o primeiro módulo completamente migrado de SQL manual para Prisma.

### Operações migradas

```text
listarProdutos()          ✅
buscarProdutoPorId()      ✅
criarProduto()            ✅
atualizarProduto()        ✅
inativarProduto()         ✅
registrarMovimentacao()   ✅
listarMovimentacoes()     ✅
```

### Transação de estoque

A movimentação de estoque utiliza:

```text
prisma.$transaction()
```

com isolamento:

```text
Serializable
```

Também há tratamento para conflito transacional Prisma:

```text
P2034
```

com novas tentativas automáticas.

Isso ajuda a proteger operações simultâneas de estoque.

---

## Instalação

Para instruções detalhadas, consulte:

```text
GUIA_INSTALACAO.md
```

Abaixo está uma versão resumida.

### 1. Clonar

```bash
git clone URL_DO_REPOSITORIO
cd WareSync
```

### 2. Criar banco

```bash
psql -U postgres -c "CREATE DATABASE waresync;"
```

### 3. Executar scripts SQL

```bash
cd backend

psql -U postgres -d waresync -f database/schema.sql
psql -U postgres -d waresync -f database/002_estoque.sql
psql -U postgres -d waresync -f database/003_financeiro.sql
psql -U postgres -d waresync -f database/004_complementos.sql
psql -U postgres -d waresync -f database/005_fluxograma.sql
```

### 4. Instalar backend

```bash
npm install
```

### 5. Configurar `.env`

Crie o `.env` com as configurações do PostgreSQL e demais secrets.

### 6. Gerar Prisma Client

```bash
npx prisma generate
```

### 7. Seed do administrador

```bash
npm run seed
```

### 8. Executar backend

```bash
npm run dev
```

### 9. Instalar frontend

Em outro terminal:

```bash
cd frontend
npm install
```

### 10. Executar frontend

```bash
npm run dev
```

A aplicação deverá estar disponível em:

```text
http://localhost:5173
```

---

## Variáveis de ambiente

Exemplo básico:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waresync
DB_USER=postgres
DB_PASSWORD=SUA_SENHA

DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/waresync?schema=public"
```

O `.env` real não deve ser versionado.

É recomendado manter um:

```text
.env.example
```

sem credenciais reais.

---

## Executando o projeto

Durante o desenvolvimento, utilize dois terminais.

### Backend

```bash
cd backend
npm run dev
```

Servidor:

```text
http://localhost:3000
```

### Frontend

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## Credenciais de desenvolvimento

O seed atual cria ou atualiza um administrador local:

```text
E-mail: admin@waresync.com
Senha: senha123
Cargo: administrador
```

Essas credenciais são destinadas apenas ao ambiente de desenvolvimento.

---

## Rotas principais

### Autenticação

```text
POST /api/auth/login
GET  /api/auth/sessao
POST /api/auth/logout
```

### Dashboard

```text
GET /api/dashboard/resumo
```

### Produtos

```text
GET    /api/produtos
GET    /api/produtos/:id
POST   /api/produtos
PUT    /api/produtos/:id
DELETE /api/produtos/:id
```

### Movimentações

```text
POST /api/produtos/:id/movimentacao
GET  /api/produtos/:id/movimentacoes
```

---

## Scripts úteis

### Backend

Instalar dependências:

```bash
npm install
```

Desenvolvimento:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Seed:

```bash
npm run seed
```

Gerar Prisma Client:

```bash
npx prisma generate
```

Atualizar schema a partir do banco:

```bash
npx prisma db pull
```

> `db pull` deve ser utilizado com cuidado, principalmente após alterações manuais no `schema.prisma`.

### Frontend

Instalar dependências:

```bash
npm install
```

Desenvolvimento:

```bash
npm run dev
```

Build:

```bash
npm run build
```

---

## Documentação complementar

O projeto possui arquivos adicionais de documentação.

### `GUIA_INSTALACAO.md`

Contém instruções completas para preparar o ambiente e executar o projeto.

### `UPDATES.md`

Mantém um histórico cronológico das alterações, correções e funcionalidades implementadas.

Esse arquivo deve continuar sendo atualizado ao longo do desenvolvimento.

### `LICENSE`

Define os termos de utilização e distribuição do projeto.

---

## Roadmap

### Frontend

- [x] Criar React + Vite
- [x] React Router
- [x] Layout compartilhado
- [x] Dashboard
- [x] Login
- [x] Proteção de rotas
- [x] Produtos
- [x] Cadastro de produto
- [x] Movimentação de estoque
- [ ] Editar produto
- [ ] Inativar produto pela interface
- [ ] Histórico de movimentações
- [ ] Categorias
- [ ] Fornecedores
- [ ] Clientes
- [ ] Vendas
- [ ] Estoque completo
- [ ] Financeiro
- [ ] Fiscal
- [ ] Relatórios
- [ ] Configurações

### Backend / Prisma

- [x] Instalar Prisma
- [x] Conectar PostgreSQL
- [x] Introspectar banco existente
- [x] Gerar Prisma Client
- [x] Migrar módulo Produtos
- [ ] Migrar Categorias
- [ ] Migrar Clientes
- [ ] Migrar Estoque
- [ ] Migrar Vendas
- [ ] Migrar Financeiro
- [ ] Migrar demais módulos

### Qualidade

- [ ] Revisar dependências e vulnerabilidades
- [ ] Ampliar testes automatizados
- [ ] Melhorar tratamento global de erros
- [ ] Criar `.env.example`
- [ ] Documentar API
- [ ] Avaliar Swagger / OpenAPI
- [ ] Preparar ambiente de produção
- [ ] Configurar CI/CD

---

## Boas práticas do projeto

### Não versionar

```text
node_modules/
.env
dist/
build/
backend/src/generated/prisma/
```

### Versionar

```text
package.json
package-lock.json
prisma/schema.prisma
prisma.config.ts
README.md
UPDATES.md
GUIA_INSTALACAO.md
LICENSE
.env.example
```

### Prisma

Não editar manualmente:

```text
src/generated/prisma/
```

### Banco

Não utilizar:

```bash
npx prisma migrate dev
```

ou:

```bash
npx prisma db push
```

sem revisar antes a estratégia de evolução do banco.

O banco atual já possui estrutura e scripts SQL próprios.

### Dependências

Evite executar automaticamente:

```bash
npm audit fix
```

sem revisar as alterações sugeridas.

---

## Licença

Este projeto está licenciado sob a **MIT License**.

Consulte:

```text
LICENSE
```

para mais informações.

---

## Autor

**Murilo Costa**

Estudante de Engenharia de Software e desenvolvedor em formação com foco em desenvolvimento Full Stack.

O WareSync faz parte do processo de evolução prática em:

- React;
- Node.js;
- TypeScript;
- APIs REST;
- PostgreSQL;
- Prisma ORM;
- arquitetura de software;
- desenvolvimento Full Stack.

---

## Histórico de desenvolvimento

Para acompanhar tudo que já foi alterado no projeto, consulte:

```text
UPDATES.md
```

Esse arquivo registra a evolução do WareSync etapa por etapa.
