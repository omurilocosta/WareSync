import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';

export const categoriasRoutes = Router();

categoriasRoutes.use(requireAuth);

categoriasRoutes.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categorias ORDER BY nome ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

categoriasRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nome = (req.body.nome || '').trim();
    if (!nome) throw new AppError('O nome da categoria é obrigatório.', 422);

    const { rows } = await pool.query(
      'INSERT INTO categorias (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome RETURNING *',
      [nome]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});
