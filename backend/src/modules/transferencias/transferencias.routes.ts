import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';

export const transferenciasRoutes = Router();

transferenciasRoutes.use(requireAuth);

// POST /api/transferencias — { produto_id, quantidade, origem, destino, motivo }
// Nota: como o Waresync ainda opera com um único estoque consolidado (sem
// multi-filial modelada), a transferência é um registro auditável — não
// altera o saldo total do produto, só documenta a movimentação física.
transferenciasRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { produto_id, quantidade, origem, destino, motivo } = req.body;
    const usuarioId = req.session.usuarioId || 1;

    if (!produto_id || !quantidade || quantidade <= 0 || !origem || !destino) {
      throw new AppError('Informe produto, quantidade, origem e destino.', 422);
    }

    const { rows: produtoRows } = await pool.query('SELECT * FROM produtos WHERE id = $1', [produto_id]);
    if (!produtoRows[0]) throw new AppError('Produto não encontrado.', 404);

    const { rows } = await pool.query(
      `INSERT INTO transferencias_estoque (produto_id, usuario_id, quantidade, origem, destino, motivo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [produto_id, usuarioId, quantidade, origem, destino, motivo || null]
    );

    res.status(201).json({ success: true, message: 'Transferência registrada.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/transferencias?produto_id=...
transferenciasRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const produtoId = req.query.produto_id ? Number(req.query.produto_id) : undefined;

    const query = `
      SELECT t.*, p.nome AS produto_nome, u.nome AS usuario_nome
      FROM transferencias_estoque t
      JOIN produtos p ON p.id = t.produto_id
      JOIN usuarios u ON u.id = t.usuario_id
      ${produtoId ? 'WHERE t.produto_id = $1' : ''}
      ORDER BY t.criado_em DESC LIMIT 50
    `;

    const { rows } = produtoId ? await pool.query(query, [produtoId]) : await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});
