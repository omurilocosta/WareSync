import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const relatoriosRoutes = Router();

relatoriosRoutes.use(requireAuth, requireRole('administrador', 'gestor'));

// GET /api/relatorios/vendas?inicio=2026-08-01&fim=2026-08-31
relatoriosRoutes.get('/vendas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inicio = (req.query.inicio as string) || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const fim = (req.query.fim as string) || new Date().toISOString().slice(0, 10);

    const { rows: porDia } = await pool.query(
      `SELECT criado_em::date AS dia, COUNT(*)::int AS quantidade, COALESCE(SUM(total), 0)::numeric(14,2) AS total
       FROM vendas
       WHERE status = 'finalizada' AND criado_em::date BETWEEN $1 AND $2
       GROUP BY criado_em::date ORDER BY dia ASC`,
      [inicio, fim]
    );

    const { rows: porVendedor } = await pool.query(
      `SELECT u.nome AS vendedor, COUNT(*)::int AS quantidade, COALESCE(SUM(v.total), 0)::numeric(14,2) AS total
       FROM vendas v JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.status = 'finalizada' AND v.criado_em::date BETWEEN $1 AND $2
       GROUP BY u.nome ORDER BY total DESC`,
      [inicio, fim]
    );

    const { rows: porProduto } = await pool.query(
      `SELECT p.nome AS produto, SUM(vi.quantidade)::numeric(14,3) AS quantidade, SUM(vi.subtotal)::numeric(14,2) AS total
       FROM venda_itens vi
       JOIN vendas v ON v.id = vi.venda_id
       JOIN produtos p ON p.id = vi.produto_id
       WHERE v.status = 'finalizada' AND v.criado_em::date BETWEEN $1 AND $2
       GROUP BY p.nome ORDER BY total DESC LIMIT 10`,
      [inicio, fim]
    );

    const { rows: totalGeral } = await pool.query(
      `SELECT COUNT(*)::int AS quantidade, COALESCE(SUM(total), 0)::numeric(14,2) AS total
       FROM vendas WHERE status = 'finalizada' AND criado_em::date BETWEEN $1 AND $2`,
      [inicio, fim]
    );

    res.json({
      success: true,
      data: { periodo: { inicio, fim }, resumo: totalGeral[0], por_dia: porDia, por_vendedor: porVendedor, por_produto: porProduto },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/relatorios/estoque
relatoriosRoutes.get('/estoque', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: produtos } = await pool.query(
      `SELECT p.nome, p.sku, p.estoque_atual, p.estoque_minimo, p.preco_custo,
              (p.estoque_atual * p.preco_custo)::numeric(14,2) AS valor_em_estoque,
              c.nome AS categoria_nome
       FROM produtos p LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.ativo = TRUE ORDER BY valor_em_estoque DESC`
    );

    const { rows: semVenda } = await pool.query(
      `SELECT p.id, p.nome, p.sku FROM produtos p
       WHERE p.ativo = TRUE AND NOT EXISTS (
         SELECT 1 FROM venda_itens vi
         JOIN vendas v ON v.id = vi.venda_id
         WHERE vi.produto_id = p.id AND v.status = 'finalizada'
       )
       ORDER BY p.nome ASC`
    );

    const valorTotal = produtos.reduce((acc, p) => acc + Number(p.valor_em_estoque), 0);

    res.json({
      success: true,
      data: { produtos, produtos_sem_venda: semVenda, valor_total_estoque: valorTotal },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/relatorios/financeiro?inicio=...&fim=...
relatoriosRoutes.get('/financeiro', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inicio = (req.query.inicio as string) || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const fim = (req.query.fim as string) || new Date().toISOString().slice(0, 10);

    const [
      { rows: receitaVendas },
      { rows: custoVendas },
      { rows: contasPagarAbertas },
      { rows: contasReceberPendentes },
    ] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(total), 0)::numeric(14,2) AS total FROM vendas
         WHERE status = 'finalizada' AND criado_em::date BETWEEN $1 AND $2`,
        [inicio, fim]
      ),
      pool.query(
        `SELECT COALESCE(SUM(vi.quantidade * p.preco_custo), 0)::numeric(14,2) AS total
         FROM venda_itens vi
         JOIN vendas v ON v.id = vi.venda_id
         JOIN produtos p ON p.id = vi.produto_id
         WHERE v.status = 'finalizada' AND v.criado_em::date BETWEEN $1 AND $2`,
        [inicio, fim]
      ),
      pool.query(`SELECT COALESCE(SUM(valor), 0)::numeric(14,2) AS total FROM contas_pagar WHERE status = 'aberta'`),
      pool.query(`SELECT COALESCE(SUM(valor), 0)::numeric(14,2) AS total FROM contas_receber WHERE status = 'pendente'`),
    ]);

    const receita = Number(receitaVendas[0].total);
    const custo = Number(custoVendas[0].total);
    const lucroBruto = receita - custo;

    res.json({
      success: true,
      data: {
        periodo: { inicio, fim },
        dre: {
          receita_bruta: receita,
          custo_produtos_vendidos: custo,
          lucro_bruto: lucroBruto,
          margem: receita > 0 ? Number(((lucroBruto / receita) * 100).toFixed(1)) : 0,
        },
        contas_pagar_em_aberto: Number(contasPagarAbertas[0].total),
        contas_receber_pendentes: Number(contasReceberPendentes[0].total),
      },
    });
  } catch (err) {
    next(err);
  }
});
