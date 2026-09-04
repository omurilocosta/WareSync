import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const contasReceberRoutes = Router();

contasReceberRoutes.use(requireAuth, requireRole('administrador', 'gestor'));

contasReceberRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const query = `
      SELECT cr.*, c.nome AS cliente_nome
      FROM contas_receber cr
      LEFT JOIN clientes c ON c.id = cr.cliente_id
      ${status ? 'WHERE cr.status = $1' : ''}
      ORDER BY cr.vencimento ASC
    `;

    const { rows } = status ? await pool.query(query, [status]) : await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

contasReceberRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cliente_id, descricao, valor, vencimento, categoria, forma_pagamento } = req.body;

    if (!descricao || !valor || !vencimento) {
      throw new AppError('Descrição, valor e vencimento são obrigatórios.', 422);
    }

    const { rows } = await pool.query(
      `INSERT INTO contas_receber (cliente_id, descricao, valor, vencimento, categoria, forma_pagamento)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cliente_id || null, descricao, valor, vencimento, categoria || null, forma_pagamento || null]
    );

    res.status(201).json({ success: true, message: 'Recebimento cadastrado.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

contasReceberRoutes.post('/:id/baixar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      `UPDATE contas_receber SET status = 'recebido', recebido_em = NOW()
       WHERE id = $1 AND status = 'pendente' RETURNING *`,
      [id]
    );

    if (!rows[0]) throw new AppError('Recebimento não encontrado ou já foi baixado.', 422);

    res.json({ success: true, message: 'Recebimento baixado com sucesso.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

contasReceberRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await pool.query('DELETE FROM contas_receber WHERE id = $1 AND status = $2', [id, 'pendente']);
    res.json({ success: true, message: 'Recebimento removido.' });
  } catch (err) {
    next(err);
  }
});
