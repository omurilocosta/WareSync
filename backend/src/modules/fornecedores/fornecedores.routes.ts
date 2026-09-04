import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const fornecedoresRoutes = Router();

fornecedoresRoutes.use(requireAuth);

fornecedoresRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const busca = typeof req.query.busca === 'string' ? req.query.busca : undefined;

    const { rows } = busca
      ? await pool.query('SELECT * FROM fornecedores WHERE ativo = TRUE AND nome ILIKE $1 ORDER BY nome', [
          `%${busca}%`,
        ])
      : await pool.query('SELECT * FROM fornecedores WHERE ativo = TRUE ORDER BY nome ASC');

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

fornecedoresRoutes.post('/', requireRole('administrador', 'gestor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nome, documento, telefone, email } = req.body;
    if (!nome) throw new AppError('O nome do fornecedor é obrigatório.', 422);

    const { rows } = await pool.query(
      `INSERT INTO fornecedores (nome, documento, telefone, email) VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome.trim(), documento || null, telefone || null, email || null]
    );

    res.status(201).json({ success: true, message: 'Fornecedor cadastrado.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

fornecedoresRoutes.put('/:id', requireRole('administrador', 'gestor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { nome, documento, telefone, email } = req.body;
    if (!nome) throw new AppError('O nome do fornecedor é obrigatório.', 422);

    const { rows } = await pool.query(
      `UPDATE fornecedores SET nome = $1, documento = $2, telefone = $3, email = $4 WHERE id = $5 RETURNING *`,
      [nome.trim(), documento || null, telefone || null, email || null, id]
    );

    if (!rows[0]) throw new AppError('Fornecedor não encontrado.', 404);
    res.json({ success: true, message: 'Fornecedor atualizado.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

fornecedoresRoutes.delete('/:id', requireRole('administrador', 'gestor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await pool.query('UPDATE fornecedores SET ativo = FALSE WHERE id = $1', [id]);
    res.json({ success: true, message: 'Fornecedor inativado.' });
  } catch (err) {
    next(err);
  }
});

// Vincula/desvincula fornecedores de um produto
fornecedoresRoutes.put(
  '/produto/:produtoId',
  requireRole('administrador', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const produtoId = Number(req.params.produtoId);
      const { fornecedor_ids } = req.body as { fornecedor_ids: number[] };

      await pool.query('DELETE FROM produto_fornecedores WHERE produto_id = $1', [produtoId]);

      for (const fornecedorId of fornecedor_ids || []) {
        await pool.query(
          'INSERT INTO produto_fornecedores (produto_id, fornecedor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [produtoId, fornecedorId]
        );
      }

      res.json({ success: true, message: 'Fornecedores do produto atualizados.' });
    } catch (err) {
      next(err);
    }
  }
);

fornecedoresRoutes.get('/produto/:produtoId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const produtoId = Number(req.params.produtoId);
    const { rows } = await pool.query(
      `SELECT f.* FROM fornecedores f
       JOIN produto_fornecedores pf ON pf.fornecedor_id = f.id
       WHERE pf.produto_id = $1`,
      [produtoId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});
