-- ============================================================
-- Waresync — Migração 002: movimentações de estoque
-- Execute após o schema.sql principal:
-- psql -U postgres -d waresync -f database/002_estoque.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id          SERIAL PRIMARY KEY,
    produto_id  INTEGER       NOT NULL REFERENCES produtos(id),
    usuario_id  INTEGER       NOT NULL REFERENCES usuarios(id),
    tipo        VARCHAR(10)   NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
    quantidade  NUMERIC(12,3) NOT NULL,
    estoque_resultante NUMERIC(12,3) NOT NULL,
    motivo      VARCHAR(255),
    criado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto ON movimentacoes_estoque(produto_id);
