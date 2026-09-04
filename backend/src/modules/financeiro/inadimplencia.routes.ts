import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const inadimplenciaRoutes = Router();

inadimplenciaRoutes.use(requireAuth, requireRole('administrador', 'gestor'));

inadimplenciaRoutes.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT cr.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
              (CURRENT_DATE - cr.vencimento) AS dias_atraso
       FROM contas_receber cr
       LEFT JOIN clientes c ON c.id = cr.cliente_id
       WHERE cr.status = 'pendente' AND cr.vencimento < CURRENT_DATE
       ORDER BY cr.vencimento ASC`
    );

    const totalEmAtraso = rows.reduce((acc, r) => acc + Number(r.valor), 0);

    res.json({ success: true, data: { titulos: rows, total_em_atraso: totalEmAtraso, quantidade: rows.length } });
  } catch (err) {
    next(err);
  }
});

inadimplenciaRoutes.post('/:id/receber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    const { rows } = await pool.query(
      `UPDATE contas_receber SET status = 'recebido', recebido_em = NOW()
       WHERE id = $1 AND status = 'pendente' RETURNING *`,
      [id]
    );

    if (!rows[0]) throw new AppError('Título não encontrado ou já foi baixado.', 422);

    res.json({ success: true, message: 'Recebimento registrado com sucesso.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});
