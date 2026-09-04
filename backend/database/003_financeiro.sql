-- ============================================================
-- Waresync — Migração 003: módulo financeiro
-- psql -U postgres -d waresync -f database/003_financeiro.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS contas_pagar (
    id          SERIAL PRIMARY KEY,
    descricao   VARCHAR(255)  NOT NULL,
    fornecedor  VARCHAR(150),
    valor       NUMERIC(12,2) NOT NULL,
    vencimento  DATE          NOT NULL,
    status      VARCHAR(10)   NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'paga')),
    pago_em     TIMESTAMPTZ,
    criado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contas_receber (
    id          SERIAL PRIMARY KEY,
    cliente_id  INTEGER       REFERENCES clientes(id),
    venda_id    INTEGER       REFERENCES vendas(id),
    descricao   VARCHAR(255)  NOT NULL,
    valor       NUMERIC(12,2) NOT NULL,
    vencimento  DATE          NOT NULL,
    status      VARCHAR(10)   NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido')),
    recebido_em TIMESTAMPTZ,
    criado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caixa_sessoes (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER       NOT NULL REFERENCES usuarios(id),
    valor_abertura  NUMERIC(12,2) NOT NULL DEFAULT 0,
    valor_fechamento NUMERIC(12,2),
    status          VARCHAR(10)   NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
    aberto_em       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    fechado_em      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS caixa_movimentacoes (
    id               SERIAL PRIMARY KEY,
    caixa_sessao_id  INTEGER       NOT NULL REFERENCES caixa_sessoes(id),
    tipo             VARCHAR(15)   NOT NULL CHECK (tipo IN ('entrada', 'saida', 'sangria', 'suprimento')),
    valor            NUMERIC(12,2) NOT NULL,
    descricao        VARCHAR(255),
    criado_em        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(status);
CREATE INDEX IF NOT EXISTS idx_caixa_mov_sessao ON caixa_movimentacoes(caixa_sessao_id);
