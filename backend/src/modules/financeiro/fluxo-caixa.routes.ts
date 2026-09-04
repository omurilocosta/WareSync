import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const fluxoCaixaRoutes = Router();

fluxoCaixaRoutes.use(requireAuth, requireRole('administrador', 'gestor'));

// GET /api/financeiro/fluxo-caixa?inicio=&fim=
fluxoCaixaRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inicio = (req.query.inicio as string) || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const fim = (req.query.fim as string) || new Date().toISOString().slice(0, 10);

    const { rows: lancamentos } = await pool.query(
      `SELECT cm.*, cs.id AS sessao_id
       FROM caixa_movimentacoes cm
       JOIN caixa_sessoes cs ON cs.id = cm.caixa_sessao_id
       WHERE cm.criado_em::date BETWEEN $1 AND $2
       ORDER BY cm.criado_em DESC`,
      [inicio, fim]
    );

    const entradas = lancamentos
      .filter((l) => l.tipo === 'entrada' || l.tipo === 'suprimento')
      .reduce((acc, l) => acc + Number(l.valor), 0);
    const saidas = lancamentos
      .filter((l) => l.tipo === 'saida' || l.tipo === 'sangria')
      .reduce((acc, l) => acc + Number(l.valor), 0);

    // Projeção: contas a pagar/receber com vencimento futuro (ainda em aberto/pendente)
    const { rows: aPagarFuturo } = await pool.query(
      `SELECT COALESCE(SUM(valor), 0)::numeric(14,2) AS total FROM contas_pagar
       WHERE status = 'aberta' AND vencimento >= CURRENT_DATE`
    );
    const { rows: aReceberFuturo } = await pool.query(
      `SELECT COALESCE(SUM(valor), 0)::numeric(14,2) AS total FROM contas_receber
       WHERE status = 'pendente' AND vencimento >= CURRENT_DATE`
    );

    res.json({
      success: true,
      data: {
        periodo: { inicio, fim },
        entradas,
        saidas,
        saldo_periodo: entradas - saidas,
        lancamentos,
        projecao: {
          saidas_previstas: Number(aPagarFuturo[0].total),
          entradas_previstas: Number(aReceberFuturo[0].total),
          saldo_projetado: Number(aReceberFuturo[0].total) - Number(aPagarFuturo[0].total),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});
