-- ============================================================
-- Waresync — Schema PostgreSQL (núcleo do ERP)
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id            SERIAL PRIMARY KEY,
    nome          VARCHAR(150)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    senha_hash    VARCHAR(255)  NOT NULL,
    cargo         VARCHAR(50)   NOT NULL DEFAULT 'vendedor',
    ativo         BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_resets (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expira_em   TIMESTAMPTZ  NOT NULL,
    usado       BOOLEAN      NOT NULL DEFAULT FALSE,
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
    id            SERIAL PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    documento     VARCHAR(20)  UNIQUE,       -- CPF ou CNPJ
    email         VARCHAR(150),
    telefone      VARCHAR(20),
    endereco      TEXT,
    limite_credito NUMERIC(12,2) DEFAULT 0,
    ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
    id     SERIAL PRIMARY KEY,
    nome   VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS produtos (
    id            SERIAL PRIMARY KEY,
    nome          VARCHAR(150)   NOT NULL,
    sku           VARCHAR(50)    UNIQUE,
    categoria_id  INTEGER        REFERENCES categorias(id),
    preco_venda   NUMERIC(12,2)  NOT NULL DEFAULT 0,
    preco_custo   NUMERIC(12,2)  NOT NULL DEFAULT 0,
    estoque_atual NUMERIC(12,3)  NOT NULL DEFAULT 0,
    estoque_minimo NUMERIC(12,3) NOT NULL DEFAULT 0,
    ativo         BOOLEAN        NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendas (
    id           SERIAL PRIMARY KEY,
    cliente_id   INTEGER       REFERENCES clientes(id),
    usuario_id   INTEGER       NOT NULL REFERENCES usuarios(id),
    status       VARCHAR(20)   NOT NULL DEFAULT 'aberta', -- aberta, finalizada, cancelada
    forma_pagamento VARCHAR(30),
    desconto     NUMERIC(12,2) NOT NULL DEFAULT 0,
    total        NUMERIC(12,2) NOT NULL DEFAULT 0,
    criado_em    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS venda_itens (
    id           SERIAL PRIMARY KEY,
    venda_id     INTEGER       NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id   INTEGER       NOT NULL REFERENCES produtos(id),
    quantidade   NUMERIC(12,3) NOT NULL,
    preco_unitario NUMERIC(12,2) NOT NULL,
    subtotal     NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_produtos_sku ON produtos(sku);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_venda_itens_venda ON venda_itens(venda_id);

INSERT INTO usuarios (nome, email, senha_hash, cargo)
VALUES ('Usuário Waresync', 'admin@waresync.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administrador')
ON CONFLICT (email) DO NOTHING;
