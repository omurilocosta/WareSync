import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const fluxoCaixaRoutes = Router();

fluxoCaixaRoutes.use(requireAuth, requireRole('administrador', 'gestor'));

// GET /api/financeiro/fluxo-caixa?inicio=&fim=
fluxoCaixaRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hoje = new Date();

    const inicioPadrao = new Date(hoje);
    inicioPadrao.setDate(inicioPadrao.getDate() - 30);

    const inicio =
      typeof req.query.inicio === 'string'
        ? req.query.inicio
        : inicioPadrao.toISOString().slice(0, 10);

    const fim =
      typeof req.query.fim === 'string'
        ? req.query.fim
        : hoje.toISOString().slice(0, 10);

    const inicioData = new Date(`${inicio}T00:00:00.000Z`);

    const fimData = new Date(`${fim}T00:00:00.000Z`);
    fimData.setUTCDate(fimData.getUTCDate() + 1);

    const hojeData = new Date(
      Date.UTC(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
      )
    );

    const [
      movimentacoes,
      contasPagar,
      contasReceber,
    ] = await Promise.all([
      prisma.caixa_movimentacoes.findMany({
        where: {
          criado_em: {
            gte: inicioData,
            lt: fimData,
          },
        },
        orderBy: {criado_em: 'desc',},
      }),

      prisma.contas_pagar.aggregate({
        where: {
          status: 'aberta',
          vencimento: {gte: hojeData,},
        },
        _sum: {valor: true,},
      }),

      prisma.contas_receber.aggregate({
        where: {
          status: 'pendente',
          vencimento: {gte: hojeData,},
        },
        _sum: {valor: true,},
      }),
    ]);

    const lancamentos = movimentacoes.map(lancamento => ({
      ...lancamento,
      valor: Number(lancamento.valor),
      criado_em: lancamento.criado_em.toISOString(),
      sessao_id: lancamento.caixa_sessao_id,
    }));

    const entradas = lancamentos
      .filter(
        lancamento =>
          lancamento.tipo === 'entrada' ||
          lancamento.tipo === 'suprimento'
      )
      .reduce(
        (total, lancamento) => total + lancamento.valor,
        0
      );

    const saidas = lancamentos
      .filter(
        lancamento =>
          lancamento.tipo === 'saida' ||
          lancamento.tipo === 'sangria'
      )
      .reduce(
        (total, lancamento) => total + lancamento.valor,
        0
      );

    const saidasPrevistas = Number(contasPagar._sum.valor ?? 0);

    const entradasPrevistas = Number(contasReceber._sum.valor ?? 0);

    res.json({
      success: true,
      data: {
        periodo: {inicio,fim,},
        entradas,
        saidas,
        saldo_periodo: entradas - saidas,
        lancamentos,
        projecao: {
          saidas_previstas: saidasPrevistas,
          entradas_previstas: entradasPrevistas,
          saldo_projetado: entradasPrevistas - saidasPrevistas,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});