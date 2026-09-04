# Guia de Instalação — WareSync

Este guia descreve como preparar o ambiente, configurar o PostgreSQL, instalar as dependências, gerar o Prisma Client e executar o frontend e o backend do **WareSync**.

> Estado atual do projeto: frontend em **React + Vite**, backend em **Node.js + Express + TypeScript**, banco de dados **PostgreSQL** e acesso ao banco sendo migrado gradualmente para **Prisma ORM**.

---

## 1. Requisitos

Antes de começar, instale:

- **Git**
- **Node.js**
- **npm**
- **PostgreSQL**
- **Visual Studio Code** ou outro editor de sua preferência

O projeto está sendo desenvolvido atualmente com:

```text
Node.js: 24.15.0
npm: 11.14.0
Prisma: 7.10.0
PostgreSQL: 18.x
```

Versões próximas e compatíveis também podem funcionar.

### Conferir Node.js e npm

```bash
node -v
npm -v
```

### Conferir PostgreSQL

```bash
psql --version
```

### Conferir Git

```bash
git --version
```

---

## 2. Clonar o repositório

Clone o projeto:

```bash
git clone URL_DO_REPOSITORIO
```

Depois entre na pasta:

```bash
cd WareSync
```

A estrutura principal deverá ser semelhante a:

```text
WareSync/
├── backend/
├── frontend/
├── frontend-legacy/
├── .gitignore
├── LICENSE
├── UPDATES.md
└── GUIA_INSTALACAO.md
```

### Sobre `frontend-legacy`

A pasta:

```text
frontend-legacy/
```

contém a versão antiga do frontend em HTML/CSS/JavaScript.

Ela está sendo mantida temporariamente como referência durante a migração para React.

---

## 3. Criar o banco PostgreSQL

Abra um terminal e execute:

```bash
psql -U postgres -c "CREATE DATABASE waresync;"
```

Será solicitada a senha do usuário `postgres`.

Se o banco já existir, não é necessário criá-lo novamente.

### Windows — `psql` não encontrado

Caso apareça um erro informando que `psql` não foi encontrado, adicione a pasta `bin` do PostgreSQL ao `PATH`.

Exemplo:

```text
C:\Program Files\PostgreSQL\18\bin
```

Ajuste o número da versão conforme a instalação existente.

---

## 4. Criar as tabelas do banco

Entre na pasta do backend:

```bash
cd backend
```

Execute os scripts SQL na ordem:

```bash
psql -U postgres -d waresync -f database/schema.sql
psql -U postgres -d waresync -f database/002_estoque.sql
psql -U postgres -d waresync -f database/003_financeiro.sql
psql -U postgres -d waresync -f database/004_complementos.sql
psql -U postgres -d waresync -f database/005_fluxograma.sql
```

Esses scripts criam a estrutura principal do sistema, incluindo tabelas relacionadas a:

- usuários;
- clientes;
- categorias;
- produtos;
- vendas;
- estoque;
- movimentações;
- fornecedores;
- inventários;
- transferências;
- devoluções;
- financeiro;
- caixa;
- documentos fiscais.

### Conferir as tabelas

Opcionalmente:

```bash
psql -U postgres -d waresync -c "\dt"
```

---

## 5. Configurar o backend

Permaneça dentro de:

```text
backend/
```

### 5.1 Instalar dependências

```bash
npm install
```

O backend utiliza, entre outras dependências:

- Express;
- TypeScript;
- PostgreSQL (`pg`);
- Prisma ORM;
- `@prisma/client`;
- `@prisma/adapter-pg`;
- bcrypt;
- gerenciamento de sessão.

> O projeto ainda mantém `pg` porque alguns módulos estão sendo migrados gradualmente para Prisma.

---

## 6. Configurar o `.env`

O arquivo `.env` **não deve ser enviado para o GitHub**.

Se existir um `.env.example`, copie-o:

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### Linux/macOS

```bash
cp .env.example .env
```

Depois ajuste os dados reais de conexão.

Exemplo:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waresync
DB_USER=postgres
DB_PASSWORD=SUA_SENHA

DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/waresync?schema=public"
```

Mantenha também as demais variáveis já existentes no `.env`, como configurações de sessão e servidor.

### Atenção a caracteres especiais na senha

Se a senha do PostgreSQL possuir caracteres especiais como:

```text
@
:
/
#
%
```

eles podem precisar ser codificados na `DATABASE_URL`.

As variáveis `DB_*` continuam sendo utilizadas pelos módulos ainda não migrados para Prisma.

A `DATABASE_URL` é utilizada pelo Prisma.

---

## 7. Prisma ORM

O projeto utiliza:

```text
Prisma 7.10.0
```

A configuração principal está em:

```text
backend/prisma.config.ts
backend/prisma/schema.prisma
```

O Prisma Client é gerado em:

```text
backend/src/generated/prisma/
```

Essa pasta é gerada automaticamente e não deve ser editada manualmente.

### 7.1 Gerar o Prisma Client

Após instalar as dependências, execute:

```bash
npx prisma generate
```

O resultado esperado é semelhante a:

```text
Generated Prisma Client (...) to .\src\generated\prisma
```

### 7.2 `prisma db pull`

O banco já possui estrutura SQL própria e o `schema.prisma` deve ser mantido versionado no projeto.

Por isso, em uma instalação comum, normalmente basta:

```bash
npx prisma generate
```

Use:

```bash
npx prisma db pull
```

somente quando precisar atualizar o `schema.prisma` a partir de alterações feitas diretamente no PostgreSQL.

> Não execute `prisma migrate dev` ou `prisma db push` sem revisar antes a estratégia de migração do projeto.

---

## 8. Criar o usuário administrador de desenvolvimento

Dentro de `backend/`, execute:

```bash
npm run seed
```

O script cria ou atualiza o administrador de desenvolvimento:

```text
E-mail: admin@waresync.com
Senha: senha123
Cargo: administrador
```

Ele também garante que o usuário esteja ativo e com o nome corretamente codificado.

> Essas credenciais são destinadas ao ambiente local de desenvolvimento.

---

## 9. Executar o backend

Ainda dentro de:

```text
backend/
```

execute:

```bash
npm run dev
```

O servidor deverá ficar disponível em:

```text
http://localhost:3000
```

Mantenha esse terminal aberto.

Para parar o servidor:

```text
Ctrl + C
```

---

## 10. Configurar o frontend React

Abra **outro terminal** na raiz do projeto e entre em:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

O frontend atual utiliza:

- React;
- Vite;
- React Router;
- ESLint.

Não é mais necessário utilizar **Live Server** para executar o frontend principal.

---

## 11. Executar o frontend

Dentro de:

```text
frontend/
```

execute:

```bash
npm run dev
```

O Vite deverá exibir um endereço semelhante a:

```text
http://localhost:5173
```

Abra esse endereço no navegador.

O login está disponível em:

```text
http://localhost:5173/login
```

---

## 12. Fazer login

Utilize o usuário criado pelo seed:

```text
E-mail: admin@waresync.com
Senha: senha123
```

Após o login, o usuário será redirecionado para:

```text
/dashboard
```

O sistema utiliza sessão no backend e cookie no navegador.

O frontend envia as requisições com:

```javascript
credentials: 'include'
```

para manter a sessão autenticada.

---

## 13. Testar Produtos

A página de produtos está disponível em:

```text
/estoque/produtos
```

Atualmente já é possível:

- listar produtos;
- pesquisar por nome, SKU ou código de barras;
- cadastrar um produto;
- visualizar situação do estoque;
- registrar entrada;
- registrar saída;
- fazer ajuste de estoque.

### Cadastro inicial

Um produto novo começa com:

```text
estoque_atual = 0
```

Para adicionar saldo, utilize:

```text
Produtos → Movimentar → Entrada
```

Isso garante que a alteração de estoque fique registrada no histórico.

### Exemplo

Cadastre:

```text
Nome: Mouse Logitech G203
SKU: G203-001
Preço de venda: 149.90
Preço de custo: 90
Estoque mínimo: 5
```

Depois registre:

```text
Tipo: Entrada
Quantidade: 10
Motivo: Estoque inicial
```

O saldo passará de:

```text
0 → 10
```

---

## 14. Estrutura de execução durante o desenvolvimento

Durante o desenvolvimento, normalmente serão utilizados **dois terminais**.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Servidor:

```text
http://localhost:3000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:5173
```

O fluxo da aplicação é:

```text
React
   ↓
API Express
   ↓
Services
   ↓
Prisma / pg
   ↓
PostgreSQL
```

---

## 15. Build

### Backend

Para validar o TypeScript:

```bash
cd backend
npm run build
```

### Frontend

Para gerar o build de produção:

```bash
cd frontend
npm run build
```

O Vite criará:

```text
frontend/dist/
```

Essa pasta não precisa ser enviada para o Git.

---

## 16. Arquivos que não devem ser enviados ao Git

O `.gitignore` deve impedir o versionamento de arquivos como:

```text
node_modules/
.env
dist/
build/
backend/src/generated/prisma/
*.log
```

Por outro lado, estes arquivos **devem** ser versionados:

```text
package.json
package-lock.json
prisma/schema.prisma
prisma.config.ts
UPDATES.md
GUIA_INSTALACAO.md
LICENSE
.env.example
```

O `.env.example` não deve possuir senhas ou secrets reais.

---

## 17. Erros comuns

| Erro / Sintoma | Causa provável | Solução |
|---|---|---|
| `ECONNREFUSED` | PostgreSQL não está rodando ou conexão está incorreta | Confira o serviço do PostgreSQL e o `.env` |
| `P1001` | Prisma não consegue acessar o PostgreSQL | Confira `DATABASE_URL`, porta e serviço do banco |
| `DATABASE_URL não foi definida` | Variável ausente no `.env` | Adicione `DATABASE_URL` e reinicie o backend |
| `É necessário estar autenticado` | Sessão não existe ou foi perdida | Entre novamente em `/login` |
| Dashboard abre sem dados | Sessão inválida ou backend indisponível | Faça login novamente e confirme `npm run dev` no backend |
| `psql` não encontrado | PostgreSQL não está no PATH | Adicione a pasta `bin` do PostgreSQL ao PATH |
| Prisma Client não encontrado | Client ainda não foi gerado | Execute `npx prisma generate` |
| Porta `5173` ocupada | Outro Vite está rodando | Pare o outro processo ou utilize a porta indicada pelo Vite |
| Porta `3000` ocupada | Outro backend está rodando | Encerre o processo anterior |
| `SKU já existe` | Outro produto já utiliza o mesmo SKU | Utilize um SKU diferente |
| `Estoque insuficiente` | Saída maior que o saldo disponível | Reduza a quantidade ou registre uma entrada |
| Texto como `UsuÃ¡rio` | Dado salvo com encoding incorreto | Rode novamente o seed atualizado ou corrija o dado no banco |

---

## 18. Vulnerabilidades apontadas pelo npm

Ao executar:

```bash
npm install
```

o npm pode informar vulnerabilidades em dependências.

Não execute automaticamente:

```bash
npm audit fix
```

sem revisar o impacto das atualizações.

Durante a migração do WareSync, alterações automáticas de versões podem introduzir incompatibilidades.

Para apenas consultar os detalhes:

```bash
npm audit
```

---

## 19. Próxima vez que abrir o projeto

Depois que o ambiente já estiver configurado, **não é necessário recriar o banco, executar os scripts SQL ou rodar o seed toda vez**.

Normalmente basta iniciar o backend:

```bash
cd backend
npm run dev
```

e, em outro terminal, iniciar o frontend:

```bash
cd frontend
npm run dev
```

Depois acesse:

```text
http://localhost:5173
```

O PostgreSQL mantém os dados entre as execuções.

---

## 20. Acompanhamento do desenvolvimento

As mudanças implementadas ao longo da migração são registradas em:

```text
UPDATES.md
```

Esse arquivo deve ser atualizado sempre que uma nova funcionalidade, correção, integração ou alteração estrutural relevante for concluída.

O frontend legado deve continuar preservado em:

```text
frontend-legacy/
```

até que a migração para React esteja concluída.
