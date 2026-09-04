<img width="1282" height="640" alt="Image" src="https://github.com/user-attachments/assets/8157fd00-e498-4002-a040-b9fd3d5dadf6" />

Este arquivo registra as principais alterações, correções, integrações e melhorias realizadas no projeto **WareSync**.

> A ideia é manter este documento sempre atualizado conforme o desenvolvimento avança.

---

## 04/09/2026 - UP040920261740

### Estrutura geral do projeto

- Iniciada a migração do frontend legado em HTML/CSS/JavaScript para **React**.
- O frontend antigo foi preservado em `frontend-legacy/`.
- Criado um novo frontend em `frontend/`.
- O backend existente foi mantido em `backend/`.
- Mantida a arquitetura atual com Node.js, Express, TypeScript e PostgreSQL.

### Frontend — React

- Criado o novo frontend utilizando **React + Vite**.
- Configurado o projeto para utilizar **ESLint**.
- Instalado e configurado o **React Router**.
- Criada a estrutura inicial:

```text
frontend/
├── public/
├── src/
│   ├── components/
│   │   └── layouts/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
```

- Removidos arquivos padrões do Vite que não seriam utilizados.
- Reaproveitados os arquivos de estilo do frontend legado.
- Reaproveitados os assets e logos originais do WareSync.

### Layout principal

- Criado `src/components/layouts/AppLayout.jsx`.
- Migrado o layout compartilhado do antigo `shell.js` para React.
- Criada a sidebar com os grupos Painel, Vendas, Estoque, Financeiro, Clientes, Fiscal, Relatórios e Configurações.
- Implementados submenus expansíveis utilizando estado React.
- Criada a Topbar.
- Implementado `Outlet` para renderização das páginas internas.
- Adicionada navegação utilizando `NavLink`.
- Mantido o estilo visual original do WareSync.

### Dashboard

- Criada `src/pages/Dashboard.jsx`.
- Migrado o dashboard antigo para React.
- Criado `src/services/dashboardService.js`.
- Criado serviço central de API em `src/services/api.js`.
- Dashboard conectado à rota `GET /api/dashboard/resumo`.
- Mantida a utilização de `credentials: 'include'` para funcionamento da sessão via cookie.
- Migrados para React: total de clientes, total de produtos, valor total em estoque, vendas do dia, ticket médio, vendas recentes, produtos com estoque baixo e clientes recentes.

### Autenticação

- Criada `src/pages/Login.jsx`.
- Criado `src/services/authService.js`.
- Login conectado à API existente.
- Implementado login utilizando sessão do Express.
- Criado `src/components/ProtectedRoute.jsx`.
- Rotas internas agora exigem sessão válida.
- Corrigido comportamento em que `/dashboard` poderia abrir sem autenticação.
- Implementada verificação real da resposta de `GET /api/auth/sessao`.
- Adicionado tratamento para erros HTTP `401`.
- Implementado redirecionamento automático para `/login` quando não autenticado.
- Exibição do usuário real autenticado no Header.
- Geração automática das iniciais do usuário no avatar.
- Exibição do cargo do usuário.
- Implementado botão **Sair**.
- Logout integrado com `POST /api/auth/logout`.

### Correção de encoding

Foi identificado que o nome do usuário estava salvo como `UsuÃ¡rio Waresync` em vez de `Usuário Waresync`.

- Corrigido o script `backend/scripts/seed-admin.js`.
- O seed passou a atualizar também o nome do usuário administrador.
- Encoding corrigido na origem, diretamente no dado armazenado.

### Usuário administrador de desenvolvimento

O seed foi utilizado para criar/corrigir o usuário de teste:

```text
E-mail: admin@waresync.com
Senha: senha123
Cargo: administrador
```

> Estas credenciais são destinadas apenas ao ambiente de desenvolvimento.

---

## Prisma ORM

### Instalação

Inicialmente foi instalada uma versão Release Candidate do Prisma 8.

Ela foi substituída pela versão estável:

```text
Prisma CLI: 7.10.0
@prisma/client: 7.10.0
@prisma/adapter-pg: 7.10.0
```

- Mantido `pg`, pois outros módulos do backend ainda utilizam SQL manual.
- Prisma e `pg` coexistem temporariamente durante a migração gradual.

### Configuração do Prisma

- Criado `backend/prisma.config.ts`.
- Adicionada variável `DATABASE_URL` ao `.env`, apontando para o mesmo PostgreSQL já utilizado pelo backend.
- Criado `backend/prisma/schema.prisma`.
- Configuração do Prisma Client:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}
```

- Utilizado `moduleFormat = "cjs"` para compatibilidade com o backend TypeScript/CommonJS atual.

### Introspecção do banco

Executado:

```bash
npx prisma db pull
```

Resultado:

```text
20 models introspected
```

- O Prisma passou a utilizar a estrutura já existente no PostgreSQL.
- Nenhuma tabela foi recriada.
- Nenhum dado foi apagado.
- As `CHECK CONSTRAINTS` existentes continuam sendo aplicadas pelo PostgreSQL.

Executado:

```bash
npx prisma generate
```

Prisma Client gerado em `backend/src/generated/prisma`.

### Conexão Prisma

- Criado `backend/src/config/prisma.ts`.
- Configurado `PrismaClient`.
- Configurado `PrismaPg`.
- Utilizada a mesma `DATABASE_URL` do PostgreSQL.
- O build do backend foi validado com sucesso após a integração.

---

## Módulo Produtos — Migração para Prisma

O módulo de Produtos foi migrado de SQL manual com `pg` para Prisma.

Arquivo principal:

```text
backend/src/modules/produtos/produtos.service.ts
```

### Listagem de produtos

Migrado `listarProdutos()` de `pool.query()` para `prisma.produtos.findMany()`.

Mantidos:

- filtro de produtos ativos;
- busca por nome;
- busca por SKU;
- busca por código de barras;
- filtro por categoria;
- relacionamento com categoria;
- ordenação por nome.

Também foi implementada conversão de campos `Decimal` do Prisma para `number`.

### Busca por ID

Migrado `buscarProdutoPorId()` para Prisma utilizando `findUnique()`.

- Mantida a relação com categoria.
- Mantido erro `404` para produto inexistente.

### Cadastro de produto

Migrado `criarProduto()` para Prisma utilizando `findUnique()` e `create()`.

- Mantida validação de nome obrigatório.
- Implementada validação amigável para SKU duplicado.
- Mantidos valores padrão.
- Produtos são cadastrados inicialmente com `estoque_atual = 0`.
- O estoque deve ser alterado através de movimentações.

### Atualização de produto

Migrado `atualizarProduto()` para Prisma.

Melhorias adicionadas:

- validação de SKU utilizado por outro produto;
- validação de código de barras utilizado por outro produto;
- preservação das regras existentes;
- conversão correta de valores numéricos.

### Inativação de produto

Migrado `inativarProduto()` para Prisma.

- O produto não é apagado fisicamente.
- É utilizado `ativo = false`.
- Isso preserva relacionamentos históricos com vendas, movimentações, inventários e demais registros.

### Movimentação de estoque

Migrado `registrarMovimentacao()` para Prisma.

A implementação antiga utilizava:

```text
BEGIN
SELECT ... FOR UPDATE
UPDATE
INSERT
COMMIT / ROLLBACK
```

A nova implementação utiliza `prisma.$transaction()` com nível de isolamento `Serializable`.

Também foi implementado retry automático para conflitos Prisma `P2034`, com até 3 tentativas.

Foram preservadas as regras:

- entrada de estoque;
- saída de estoque;
- ajuste de estoque;
- bloqueio de saída maior que o saldo;
- registro do usuário responsável;
- registro do motivo;
- atualização do estoque e criação da movimentação dentro da mesma transação.

### Histórico de movimentações

Migrado `listarMovimentacoes()` para Prisma.

- Relacionamento com usuário carregado pelo Prisma.
- Mantido limite das últimas 50 movimentações.
- Mantida ordenação por data decrescente.
- Adicionado `usuario_nome` ao tipo `MovimentacaoEstoque`.

Com isso, o módulo de Produtos deixou de depender diretamente de `pool.query()`.

---

## Produtos — Frontend React

Criado `frontend/src/services/produtosService.js` com serviços para:

- listar produtos;
- buscar produto por ID;
- criar produto;
- atualizar produto;
- inativar produto;
- registrar movimentação;
- listar movimentações.

### Página de produtos

Criada a página React de Produtos em `frontend/src/pages/Produtos.jsx` ou `Produto.jsx`, conforme o nome utilizado localmente no projeto.

Rota criada:

```text
/estoque/produtos
```

Implementados:

- listagem de produtos;
- busca em tempo real;
- debounce de 300 ms;
- preço formatado em BRL;
- exibição de estoque;
- indicadores `Em estoque`, `Estoque baixo` e `Sem estoque`.

### Cadastro de produto

Implementado modal **Novo produto**.

Campos implementados:

- nome;
- SKU;
- código de barras;
- descrição;
- unidade de medida;
- preço de venda;
- preço de custo;
- estoque mínimo;
- estoque máximo;
- NCM;
- CFOP;
- CEST;
- origem fiscal.

Após salvar:

- o produto é criado via API;
- o modal é fechado;
- o formulário é limpo;
- a listagem é atualizada automaticamente.

Foi corrigido também um erro de escopo em que `setForm` não estava acessível por `handleChange`.

### Movimentação de estoque no React

Implementado botão `Movimentar`.

Criado modal de movimentação com:

- produto selecionado;
- estoque atual;
- tipo da movimentação;
- quantidade;
- motivo.

Tipos disponíveis:

```text
Entrada
Saída
Ajuste
```

Fluxo atual:

```text
React
↓
produtosService.js
↓
API Express
↓
Prisma Transaction
↓
PostgreSQL
```

Testes realizados com sucesso:

- entrada de estoque;
- saída de estoque;
- atualização automática do saldo na tabela;
- bloqueio de saída maior que o estoque disponível.

---

## Situação atual

Até este ponto:

```text
Frontend React                 ✅
React Router                   ✅
Layout principal               ✅
Dashboard                      ✅
Login                          ✅
ProtectedRoute                 ✅
Sessão                         ✅
Logout                         ✅
PostgreSQL                     ✅
Prisma 7.10.0                  ✅
Prisma Client                  ✅
Módulo Produtos no Prisma      ✅
Listagem React de produtos     ✅
Cadastro React de produtos     ✅
Movimentação React             ✅
```

---

## Próximo passo

O desenvolvimento foi pausado após validar a movimentação de estoque pela interface React.

O próximo passo planejado é:

```text
Implementar o botão "Editar" na página de Produtos
```

A intenção é reutilizar o mesmo formulário/modal de cadastro, evitando duplicação de código.

Depois disso, a sequência prevista inclui:

- inativação pela interface React;
- histórico de movimentações no frontend;
- categorias;
- fornecedores;
- migração dos demais módulos do backend para Prisma;
- migração das demais páginas HTML para React.

---

## Observações

- Não executar `npm audit fix` automaticamente sem revisar as atualizações, pois o projeto ainda está em migração e atualizações de dependências podem introduzir incompatibilidades.
- O frontend legado deve permanecer em `frontend-legacy/` até a migração completa.
- O diretório gerado pelo Prisma em `src/generated/prisma` não deve ser editado manualmente.
- Novas alterações devem ser adicionadas neste arquivo em ordem cronológica.
