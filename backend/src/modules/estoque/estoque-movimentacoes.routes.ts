import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { requireAuth } from '../../middlewares/auth.middleware';

export const estoqueMovimentacoesRoutes = Router();

estoqueMovimentacoesRoutes.use(requireAuth);

// GET /api/estoque/movimentacoes?produto=&tipo=&inicio=&fim=
estoqueMovimentacoesRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { produto, tipo, inicio, fim } = req.query;
    const condicoes: string[] = [];
    const params: unknown[] = [];

    if (produto) {
      params.push(`%${produto}%`);
      condicoes.push(`p.nome ILIKE $${params.length}`);
    }
    if (tipo) {
      params.push(tipo);
      condicoes.push(`m.tipo = $${params.length}`);
    }
    if (inicio) {
      params.push(inicio);
      condicoes.push(`m.criado_em::date >= $${params.length}`);
    }
    if (fim) {
      params.push(fim);
      condicoes.push(`m.criado_em::date <= $${params.length}`);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT m.*, p.nome AS produto_nome, p.sku, u.nome AS usuario_nome
       FROM movimentacoes_estoque m
       JOIN produtos p ON p.id = m.produto_id
       JOIN usuarios u ON u.id = m.usuario_id
       ${where}
       ORDER BY m.criado_em DESC
       LIMIT 200`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});
