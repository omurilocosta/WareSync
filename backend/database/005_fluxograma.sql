-- ============================================================
-- Waresync — Migração 005: alinhamento com o fluxograma completo
-- psql -U postgres -d waresync -f database/005_fluxograma.sql
-- ============================================================

-- ---------- 1. Produtos: campos que faltavam no fluxograma de cadastro ----------
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(50);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS grupo VARCHAR(100);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS unidade_medida VARCHAR(10) DEFAULT 'UN';
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS estoque_maximo NUMERIC(12,3);
CREATE UNIQUE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos(codigo_barras) WHERE codigo_barras IS NOT NULL;

-- ---------- 2. Clientes: endereço detalhado + observações ----------
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- ---------- 3. Categoria em contas a pagar / receber ----------
ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);
ALTER TABLE contas_receber ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);
ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(30);
ALTER TABLE contas_receber ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(30);

-- ---------- 4. Motivo obrigatório no cancelamento de venda ----------
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS motivo_cancelamento VARCHAR(255);

-- ---------- 5. Documentos fiscais (NF-e / NFC-e) ----------
-- Estrutura pronta para os dados; a EMISSÃO REAL exige integração com um
-- provedor homologado junto à SEFAZ (ex.: Focus NFe, PlugNotas, eNotas) e
-- certificado digital A1/A3 da empresa. Sem isso, o "emitir" abaixo simula
-- o fluxo (gera número, muda status) mas não é uma nota fiscal válida.
CREATE TABLE IF NOT EXISTS documentos_fiscais (
    id            SERIAL PRIMARY KEY,
    venda_id      INTEGER      REFERENCES vendas(id),
    tipo          VARCHAR(10)  NOT NULL CHECK (tipo IN ('NFE', 'NFCE')),
    numero        VARCHAR(20),
    serie         VARCHAR(5)   DEFAULT '1',
    status        VARCHAR(15)  NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente', 'autorizado', 'rejeitado', 'cancelado')),
    motivo_rejeicao      VARCHAR(255),
    motivo_cancelamento  VARCHAR(255),
    chave_acesso  VARCHAR(44),
    usuario_id    INTEGER      NOT NULL REFERENCES usuarios(id),
    emitido_em    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    cancelado_em  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_documentos_fiscais_venda ON documentos_fiscais(venda_id);
CREATE INDEX IF NOT EXISTS idx_documentos_fiscais_status ON documentos_fiscais(status);

-- ---------- 6. "Realizar Logout" — nada a criar aqui, a sessão já existe
-- via express-session; o endpoint /api/auth/logout só limpa a sessão.
