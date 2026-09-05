# UPDATES — WareSync

Este arquivo registra as principais alterações, correções, integrações e melhorias realizadas no projeto **WareSync**.

> Este documento deve continuar sendo atualizado conforme o desenvolvimento avança.

---

# 04/09/2026

## Estrutura geral do projeto

- Iniciada a migração do frontend legado em HTML/CSS/JavaScript para **React**.
- O frontend antigo foi preservado em `frontend-legacy/`.
- Criado um novo frontend em `frontend/`.
- O backend existente foi mantido em `backend/`.
- Mantida a arquitetura com Node.js, Express, TypeScript e PostgreSQL.

---

## Frontend — React

- Criado o novo frontend utilizando **React + Vite**.
- Configurado ESLint.
- Instalado e configurado React Router.
- Criada estrutura com `components`, `pages`, `services` e `styles`.
- Reaproveitados estilos, logos e assets do frontend legado.

---

## Layout principal

- Criado `src/components/layouts/AppLayout.jsx`.
- Migrado o antigo `shell.js` para React.
- Criadas Sidebar e Topbar.
- Implementados grupos e submenus de navegação.
- Implementado `Outlet` para renderização das páginas internas.
- Adicionada navegação com `NavLink`.

---

## Dashboard

- Criada `src/pages/Dashboard.jsx`.
- Criado `src/services/dashboardService.js`.
- Criado `src/services/api.js`.
- Dashboard conectado a `GET /api/dashboard/resumo`.
- Mantido `credentials: 'include'` para sessão.
- Migrados indicadores de clientes, produtos, estoque, vendas, ticket médio, vendas recentes, estoque baixo e clientes recentes.

---

## Autenticação

- Criada `src/pages/Login.jsx`.
- Criado `src/services/authService.js`.
- Implementado login com sessão do Express.
- Criado `src/components/ProtectedRoute.jsx`.
- Implementada proteção real das rotas privadas.
- Implementado tratamento de erro `401`.
- Implementado redirecionamento para `/login`.
- Exibido usuário autenticado no Header.
- Implementado logout.
- Corrigido encoding do nome do usuário no seed.

Credenciais locais de desenvolvimento:

```text
E-mail: admin@waresync.com
Senha: senha123
Cargo: administrador
```

---

# Prisma ORM

- Instalado Prisma estável `7.10.0`.
- Instalados `@prisma/client` e `@prisma/adapter-pg`.
- Mantido `pg` temporariamente para módulos ainda não migrados.
- Criado `backend/prisma.config.ts`.
- Criado `backend/prisma/schema.prisma`.
- Configurado Prisma Client em CommonJS.
- Executado `npx prisma db pull`.
- Introspectados 20 modelos existentes.
- Executado `npx prisma generate`.
- Criado `backend/src/config/prisma.ts`.
- Validado build do backend.

---

# Produtos — Backend

O módulo de Produtos foi migrado integralmente para Prisma.

Operações migradas:

```text
listarProdutos()          ✅
buscarProdutoPorId()      ✅
criarProduto()            ✅
atualizarProduto()        ✅
inativarProduto()         ✅
registrarMovimentacao()   ✅
listarMovimentacoes()     ✅
```

Melhorias incluídas:

- busca por nome, SKU e código de barras;
- filtro por categoria;
- validação de SKU duplicado;
- validação de código de barras duplicado;
- inativação lógica;
- conversão de `Decimal` para `number`.

### Movimentação de estoque

- Migrada para `prisma.$transaction()`.
- Utilizado isolamento `Serializable`.
- Implementado retry para erro `P2034`.
- Mantidas regras de entrada, saída, ajuste e bloqueio de estoque negativo.

---

# Produtos — Frontend React

Criado `frontend/src/services/produtosService.js`.

Criada página de Produtos em React.

Funcionalidades concluídas:

- listagem;
- busca;
- cadastro;
- edição;
- inativação com confirmação;
- movimentação;
- histórico de movimentações.

Indicadores de estoque:

```text
Em estoque
Estoque baixo
Sem estoque
```

O produto novo começa com:

```text
estoque_atual = 0
```

e o saldo deve ser alterado através de movimentações.

---

# Categorias

## Backend

Categorias migradas para Prisma.

Operações:

```text
listar categorias   ✅
criar categoria     ✅
```

Foi utilizado `upsert()` para preservar o comportamento existente de conflito por nome.

## Frontend

Criado `frontend/src/services/categoriasService.js`.

Integrado ao formulário de Produtos:

- carregar categorias;
- criar categoria;
- selecionar categoria;
- salvar `categoria_id`.

### Correção realizada

As categorias eram recebidas corretamente pela API, mas não apareciam no `<select>`.

Foi corrigido o JSX para manter:

```jsx
{categorias.map(...)}
```

dentro do próprio `<select>`.

Funcionamento confirmado.

---

# Fornecedores

## Backend

O módulo de Fornecedores foi migrado de `pg` para Prisma.

Operações concluídas:

```text
listar fornecedores          ✅
criar fornecedor             ✅
editar fornecedor            ✅
inativar fornecedor          ✅
vincular fornecedor/produto  ✅
listar fornecedores produto  ✅
```

### Relação Produto ↔ Fornecedor

Mantida através de:

```text
produto_fornecedores
```

A atualização dos vínculos é feita em transação Prisma.

Também foi corrigido um erro TypeScript adicionando tipo explícito:

```typescript
(fornecedorId: number)
```

## Frontend

Criado `frontend/src/services/fornecedoresService.js`.

Integrado ao formulário de Produtos:

- carregar fornecedores;
- selecionar múltiplos fornecedores;
- salvar vínculos produto ↔ fornecedor;
- carregar fornecedores já vinculados ao editar.

O relacionamento Produto ↔ Fornecedor foi testado e confirmado como funcionando.

---

# Último ponto confirmado

O último ponto confirmado como funcionando foi:

```text
Produto ↔ Fornecedor
```

com múltiplos fornecedores sendo vinculados e recarregados corretamente na edição do produto.

---

# Próximo passo ao retomar

Foi proposto, mas ainda não confirmado como concluído, o cadastro de fornecedor diretamente pelo React.

Objetivo:

```text
+ Novo fornecedor
```

dentro do formulário de Produtos, abrindo um modal com:

- nome;
- documento;
- telefone;
- e-mail.

Fluxo planejado:

```text
Novo fornecedor
      ↓
POST /api/fornecedores
      ↓
Prisma
      ↓
PostgreSQL
      ↓
Atualiza lista no React
      ↓
Novo fornecedor fica selecionado
```

Depois disso, o próximo grande módulo planejado é:

```text
Clientes
```

---

# Situação atual resumida

```text
Frontend React                     ✅
React Router                       ✅
Layout principal                   ✅
Dashboard                          ✅
Login                              ✅
ProtectedRoute                     ✅
Sessão                             ✅
Logout                             ✅
PostgreSQL                         ✅
Prisma 7.10.0                      ✅
Prisma Client                      ✅
Produtos backend em Prisma         ✅
Produtos frontend                  ✅
Cadastro de Produto                ✅
Edição de Produto                  ✅
Inativação de Produto              ✅
Movimentação de Estoque            ✅
Histórico de Movimentações         ✅
Categorias backend em Prisma       ✅
Categorias no frontend             ✅
Fornecedores backend em Prisma     ✅
Produto ↔ Fornecedor               ✅
Novo fornecedor no React           ⏳ pendente de conclusão/teste
Clientes                           ⏳ próximo módulo
```

---

## Observações

- Não executar `npm audit fix` automaticamente sem revisar o impacto.
- Manter `frontend-legacy/` até a migração completa.
- Não editar manualmente `src/generated/prisma/`.
- Atualizar este arquivo sempre que uma nova funcionalidade, correção ou migração relevante for concluída.
