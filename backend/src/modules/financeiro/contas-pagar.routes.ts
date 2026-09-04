import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const contasPagarRoutes = Router();

contasPagarRoutes.use(requireAuth, requireRole('administrador', 'gestor'));

contasPagarRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const { rows } = status
      ? await pool.query('SELECT * FROM contas_pagar WHERE status = $1 ORDER BY vencimento ASC', [status])
      : await pool.query('SELECT * FROM contas_pagar ORDER BY vencimento ASC');

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

contasPagarRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { descricao, fornecedor, valor, vencimento, categoria, forma_pagamento } = req.body;

    if (!descricao || !valor || !vencimento) {
      throw new AppError('Descrição, valor e vencimento são obrigatórios.', 422);
    }

    const { rows } = await pool.query(
      `INSERT INTO contas_pagar (descricao, fornecedor, valor, vencimento, categoria, forma_pagamento)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [descricao, fornecedor || null, valor, vencimento, categoria || null, forma_pagamento || null]
    );

    res.status(201).json({ success: true, message: 'Conta cadastrada.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

contasPagarRoutes.post('/:id/baixar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      `UPDATE contas_pagar SET status = 'paga', pago_em = NOW()
       WHERE id = $1 AND status = 'aberta' RETURNING *`,
      [id]
    );

    if (!rows[0]) throw new AppError('Conta não encontrada ou já está paga.', 422);

    res.json({ success: true, message: 'Conta baixada com sucesso.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

contasPagarRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await pool.query('DELETE FROM contas_pagar WHERE id = $1 AND status = $2', [id, 'aberta']);
    res.json({ success: true, message: 'Conta removida.' });
  } catch (err) {
    next(err);
  }
});
