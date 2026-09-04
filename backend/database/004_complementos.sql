-- ============================================================
-- Waresync — Migração 004: complementos do escopo original
-- psql -U postgres -d waresync -f database/004_complementos.sql
-- ============================================================

-- ---------- 1. Padronização de cargos (Administrador / Gestor / Operacional) ----------
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_cargo_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_cargo_check
  CHECK (cargo IN ('administrador', 'gestor', 'operacional'));
UPDATE usuarios SET cargo = 'administrador' WHERE cargo NOT IN ('administrador', 'gestor', 'operacional');

-- ---------- 2. Fornecedores + informações fiscais do produto ----------
CREATE TABLE IF NOT EXISTS fornecedores (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    documento   VARCHAR(20),
    telefone    VARCHAR(20),
    email       VARCHAR(150),
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produto_fornecedores (
    produto_id     INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    fornecedor_id  INTEGER NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
    PRIMARY KEY (produto_id, fornecedor_id)
);

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS ncm VARCHAR(10);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cfop VARCHAR(10);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cest VARCHAR(10);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS origem_fiscal VARCHAR(2) DEFAULT '0';

-- ---------- 3. Devoluções (RF14 / RN10) ----------
CREATE TABLE IF NOT EXISTS devolucoes (
    id          SERIAL PRIMARY KEY,
    venda_id    INTEGER       NOT NULL REFERENCES vendas(id),
    usuario_id  INTEGER       NOT NULL REFERENCES usuarios(id),
    motivo      VARCHAR(255),
    valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    criado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devolucao_itens (
    id              SERIAL PRIMARY KEY,
    devolucao_id    INTEGER       NOT NULL REFERENCES devolucoes(id) ON DELETE CASCADE,
    venda_item_id   INTEGER       NOT NULL REFERENCES venda_itens(id),
    produto_id      INTEGER       NOT NULL REFERENCES produtos(id),
    quantidade      NUMERIC(12,3) NOT NULL,
    valor           NUMERIC(12,2) NOT NULL
);

-- ---------- 4. Inventário completo (RF19 / RN14) ----------
CREATE TABLE IF NOT EXISTS inventarios (
    id           SERIAL PRIMARY KEY,
    usuario_id   INTEGER      NOT NULL REFERENCES usuarios(id),
    status       VARCHAR(15)  NOT NULL DEFAULT 'contagem'
                 CHECK (status IN ('contagem', 'conferencia', 'finalizado')),
    criado_em    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    finalizado_em TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS inventario_itens (
    id               SERIAL PRIMARY KEY,
    inventario_id    INTEGER       NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
    produto_id       INTEGER       NOT NULL REFERENCES produtos(id),
    estoque_sistema  NUMERIC(12,3) NOT NULL,
    estoque_contado  NUMERIC(12,3),
    divergencia      NUMERIC(12,3)
);

-- ---------- 5. Transferências (RF18 / RN15) ----------
-- Registro de movimentação entre locais/filiais. Como o Waresync ainda opera
-- com um único estoque consolidado, a transferência é registrada como log
-- auditável (origem/destino em texto), sem alterar o saldo total do produto.
CREATE TABLE IF NOT EXISTS transferencias_estoque (
    id          SERIAL PRIMARY KEY,
    produto_id  INTEGER       NOT NULL REFERENCES produtos(id),
    usuario_id  INTEGER       NOT NULL REFERENCES usuarios(id),
    quantidade  NUMERIC(12,3) NOT NULL,
    origem      VARCHAR(100)  NOT NULL,
    destino     VARCHAR(100)  NOT NULL,
    motivo      VARCHAR(255),
    criado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------- 6. Crediário: vínculo da conta a receber com a venda já existe ----------
-- (contas_receber.venda_id já foi criado na migração 003)

CREATE INDEX IF NOT EXISTS idx_devolucoes_venda ON devolucoes(venda_id);
CREATE INDEX IF NOT EXISTS idx_inventario_itens_inv ON inventario_itens(inventario_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_produto ON transferencias_estoque(produto_id);
