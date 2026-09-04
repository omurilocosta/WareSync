import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { requireAuth } from '../../middlewares/auth.middleware';

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

dashboardRoutes.get('/resumo', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      { rows: totalClientes },
      { rows: totalProdutos },
      { rows: estoqueBaixo },
      { rows: valorEstoque },
      { rows: clientesRecentes },
      { rows: vendasHoje },
      { rows: vendasRecentes },
    ] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM clientes WHERE ativo = TRUE'),
      pool.query('SELECT COUNT(*)::int AS total FROM produtos WHERE ativo = TRUE'),
      pool.query(
        `SELECT p.id, p.nome, p.sku, p.estoque_atual, p.estoque_minimo, c.nome AS categoria_nome
         FROM produtos p
         LEFT JOIN categorias c ON c.id = p.categoria_id
         WHERE p.ativo = TRUE AND p.estoque_atual <= p.estoque_minimo
         ORDER BY p.estoque_atual ASC
         LIMIT 10`
      ),
      pool.query(
        `SELECT COALESCE(SUM(estoque_atual * preco_custo), 0)::numeric(14,2) AS total
         FROM produtos WHERE ativo = TRUE`
      ),
      pool.query(
        `SELECT id, nome, email, criado_em FROM clientes
         WHERE ativo = TRUE ORDER BY criado_em DESC LIMIT 5`
      ),
      pool.query(
        `SELECT COALESCE(SUM(total), 0)::numeric(14,2) AS total_vendido,
                COUNT(*)::int AS quantidade,
                COALESCE(AVG(total), 0)::numeric(14,2) AS ticket_medio
         FROM vendas
         WHERE status = 'finalizada' AND criado_em::date = CURRENT_DATE`
      ),
      pool.query(
        `SELECT v.id, v.total, v.forma_pagamento, v.criado_em, c.nome AS cliente_nome, u.nome AS usuario_nome
         FROM vendas v
         LEFT JOIN clientes c ON c.id = v.cliente_id
         JOIN usuarios u ON u.id = v.usuario_id
         WHERE v.status = 'finalizada'
         ORDER BY v.criado_em DESC
         LIMIT 5`
      ),
    ]);

    res.json({
      success: true,
      data: {
        total_clientes: totalClientes[0].total,
        total_produtos: totalProdutos[0].total,
        valor_estoque: valorEstoque[0].total,
        produtos_estoque_baixo: estoqueBaixo,
        clientes_recentes: clientesRecentes,
        vendas_hoje: vendasHoje[0].total_vendido,
        vendas_hoje_qtd: vendasHoje[0].quantidade,
        ticket_medio: vendasHoje[0].ticket_medio,
        vendas_recentes: vendasRecentes,
      },
    });
  } catch (err) {
    next(err);
  }
});
