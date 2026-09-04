# Guia de Instalação — Waresync

Este guia parte do zero: instalar os programas, configurar o banco, rodar o backend e abrir o frontend. Siga na ordem.

---

## Parte 1 — Instalar os programas necessários

### 1.1 Visual Studio Code
Baixe em **https://code.visualstudio.com** e instale normalmente. Se já tiver, pule.

### 1.2 Node.js (necessário para o backend em TypeScript)
Baixe a versão **LTS** em **https://nodejs.org** e instale.

Para confirmar que funcionou, abra um terminal e rode:
```bash
node -v
npm -v
```
Ambos devem mostrar um número de versão.

### 1.3 PostgreSQL
Baixe em **https://www.postgresql.org/download** conforme seu sistema operacional.

Durante a instalação, ele vai pedir para definir uma **senha para o usuário `postgres`** — anote essa senha, você vai precisar dela em vários passos daqui pra frente.

- **Windows**: o instalador já inclui o pgAdmin (interface visual) e adiciona os comandos ao PATH automaticamente na maioria dos casos.
- **Mac**: `brew install postgresql@16` (via Homebrew) também funciona.
- **Linux**: `sudo apt install postgresql postgresql-contrib`

Para confirmar que funcionou:
```bash
psql --version
```

### 1.4 Extensões do VS Code
Abra o VS Code, clique no ícone de Extensions (`Ctrl+Shift+X`) e instale:
- **Live Server** (autor: Ritwick Dey) — para abrir o frontend
- **PostgreSQL** (autor: Microsoft ou Chris Kolkman) — opcional, pra visualizar tabelas direto no VS Code

---

## Parte 2 — Organizar o projeto

1. Baixe o arquivo `waresync-completo.zip` (anexado nesta conversa) e extraia em um local de fácil acesso, por exemplo `Documentos/waresync`.
2. Abra o VS Code → **File > Open Folder** → selecione a pasta `waresync` extraída.

Você deve ver duas pastas no Explorer: `backend` e `frontend`.

---

## Parte 3 — Configurar o banco de dados PostgreSQL

Abra o terminal integrado do VS Code (`` Ctrl+` ``).

### 3.1 Criar o banco
```bash
psql -U postgres -c "CREATE DATABASE waresync"
```
Vai pedir a senha do usuário `postgres` que você definiu na instalação.

> Se der erro de "comando não encontrado", o PostgreSQL não está no PATH. No Windows, adicione a pasta `C:\Program Files\PostgreSQL\16\bin` (ajuste a versão) ao PATH do sistema e reabra o terminal.

### 3.2 Rodar as migrações — nesta ordem exata
Dentro da pasta `backend`, rode uma de cada vez:
```bash
psql -U postgres -d waresync -f database/schema.sql
psql -U postgres -d waresync -f database/002_estoque.sql
psql -U postgres -d waresync -f database/003_financeiro.sql
psql -U postgres -d waresync -f database/004_complementos.sql
psql -U postgres -d waresync -f database/005_fluxograma.sql
```

Depois de rodar as 5 migrações, gere o usuário de teste com uma senha real (dentro da pasta `backend`, após o `npm install` da Parte 4):
```bash
npm run seed
```

Isso cria todas as tabelas (usuários, produtos, vendas, financeiro, inventário, fornecedores, devoluções etc.) e um usuário de teste:
- **E-mail:** `admin@waresync.com`
- **Senha:** `senha123`
- **Cargo:** administrador

### 3.3 Conferir (opcional)
```bash
psql -U postgres -d waresync -c "\dt"
```
Deve listar todas as tabelas criadas.

---

## Parte 4 — Configurar e rodar o backend

### 4.1 Variáveis de ambiente
Dentro da pasta `backend`, copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Abra o `.env` no VS Code e ajuste `DB_PASSWORD` para a senha do PostgreSQL que você definiu na Parte 1.3. Os outros valores podem ficar como estão para uso local.

### 4.2 Instalar as dependências
Ainda dentro de `backend`:
```bash
npm install
```
Isso vai baixar Express, PostgreSQL driver, bcrypt, etc. Pode levar um ou dois minutos.

### 4.3 Rodar o servidor
```bash
npm run dev
```
Se tudo estiver certo, o terminal deve mostrar:
```
[Waresync] Conectado ao PostgreSQL com sucesso.
[Waresync] Servidor rodando em http://localhost:3000
```

**Deixe esse terminal aberto rodando** — é o backend ativo. Para parar, `Ctrl+C`.

---

## Parte 5 — Rodar o frontend

O frontend é HTML/CSS/JS puro — não precisa de build nem de `npm install`.

1. No Explorer do VS Code, clique com o botão direito em `frontend/public/login.html`.
2. Escolha **"Open with Live Server"**.
3. O navegador abre automaticamente a tela de login.

> Se o botão "Open with Live Server" não aparecer, confirme que a extensão foi instalada (Parte 1.4) e reinicie o VS Code.

---

## Parte 6 — Testar o sistema

1. Na tela de login, entre com:
   - E-mail: `admin@waresync.com`
   - Senha: `senha123`
2. Você deve cair no **Painel** com os cards zerados (nenhum dado ainda).
3. Roteiro sugerido pra testar tudo:
   - **Produtos** → cadastre 1 ou 2 produtos (defina um preço e um estoque mínimo).
   - **Produtos** → clique em "Movimentar" → registre uma **entrada** de estoque (senão o produto fica com saldo zero e não pode ser vendido).
   - **Clientes** → cadastre um cliente.
   - **Vendas** → busque o produto, adicione ao carrinho, finalize a venda.
   - **Painel** → confira se "Vendas hoje" e "Vendas recentes" atualizaram.
   - **Financeiro** → aba Caixa → abra o caixa (com um valor de abertura) *antes* de fazer vendas à vista, senão elas não lançam automaticamente no caixa.
   - **Estoque** → crie um inventário, faça uma contagem, finalize e veja o ajuste aplicado.

---

## Erros comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `ECONNREFUSED` ao rodar `npm run dev` | PostgreSQL não está rodando, ou senha errada no `.env` | Confirme o serviço do PostgreSQL está ativo e a senha no `.env` está certa |
| Tela de login sem estilo/sem cor | Live Server não está sendo usado (abriu o HTML direto com duplo clique) | Sempre abra via "Open with Live Server" |
| "Não foi possível conectar ao servidor" ao tentar logar | Backend não está rodando | Confirme que o terminal do `npm run dev` está ativo sem erros |
| Erro 401 "É necessário estar autenticado" em qualquer tela após o login | Sessão anterior de um teste antigo travada | Limpe os cookies do site (F12 > Application > Cookies > localhost > botão direito > Clear) e faça login de novo. Desde a última atualização, o backend aceita qualquer porta em localhost/127.0.0.1 automaticamente, então isso raramente é problema de CORS |
| `psql: command not found` | PostgreSQL não está no PATH | Veja a nota na Parte 3.1 |
| Erro ao rodar as migrações (tabela já existe) | Você rodou a mesma migração duas vezes | Sem problema, os scripts usam `IF NOT EXISTS` na maioria dos casos — mas se der erro de constraint duplicada, pode ignorar |

---

## Próxima vez que for abrir o projeto

Você só precisa repetir a **Parte 4.3** (`npm run dev` dentro de `backend`) e a **Parte 5** (Live Server no `login.html`). O banco de dados já fica salvo — não precisa rodar as migrações de novo.
