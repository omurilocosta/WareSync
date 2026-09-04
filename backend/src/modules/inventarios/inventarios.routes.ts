import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const inventariosRoutes = Router();

inventariosRoutes.use(requireAuth);

// POST /api/inventarios — cria um novo inventário com snapshot do estoque atual de todos os produtos ativos
inventariosRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const usuarioId = req.session.usuarioId || 1;

    const { rows: inventarioRows } = await client.query(
      `INSERT INTO inventarios (usuario_id, status) VALUES ($1, 'contagem') RETURNING *`,
      [usuarioId]
    );
    const inventario = inventarioRows[0];

    const { rows: produtos } = await client.query('SELECT id, estoque_atual FROM produtos WHERE ativo = TRUE');

    for (const produto of produtos) {
      await client.query(
        `INSERT INTO inventario_itens (inventario_id, produto_id, estoque_sistema)
         VALUES ($1, $2, $3)`,
        [inventario.id, produto.id, produto.estoque_atual]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Inventário criado com ${produtos.length} produto(s) para contagem.`,
      data: inventario,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/inventarios — lista inventários (mais recente primeiro)
inventariosRoutes.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, u.nome AS usuario_nome FROM inventarios i
       JOIN usuarios u ON u.id = i.usuario_id ORDER BY i.criado_em DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/inventarios/:id — detalhe com itens
inventariosRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { rows: invRows } = await pool.query('SELECT * FROM inventarios WHERE id = $1', [id]);
    if (!invRows[0]) throw new AppError('Inventário não encontrado.', 404);

    const { rows: itens } = await pool.query(
      `SELECT ii.*, p.nome AS produto_nome, p.sku
       FROM inventario_itens ii JOIN produtos p ON p.id = ii.produto_id
       WHERE ii.inventario_id = $1 ORDER BY p.nome ASC`,
      [id]
    );

    res.json({ success: true, data: { ...invRows[0], itens } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/inventarios/:id/contagem — { itens: [{ produto_id, estoque_contado }] }
inventariosRoutes.put('/:id/contagem', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { itens } = req.body as { itens: { produto_id: number; estoque_contado: number }[] };

    const { rows: invRows } = await pool.query('SELECT * FROM inventarios WHERE id = $1', [id]);
    const inventario = invRows[0];
    if (!inventario) throw new AppError('Inventário não encontrado.', 404);
    if (inventario.status !== 'contagem') {
      throw new AppError('Este inventário não está mais na etapa de contagem.', 422);
    }

    for (const item of itens) {
      await pool.query(
        `UPDATE inventario_itens
         SET estoque_contado = $1, divergencia = $1 - estoque_sistema
         WHERE inventario_id = $2 AND produto_id = $3`,
        [item.estoque_contado, id, item.produto_id]
      );
    }

    await pool.query(`UPDATE inventarios SET status = 'conferencia' WHERE id = $1`, [id]);

    res.json({ success: true, message: 'Contagem registrada. Inventário em conferência.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/inventarios/:id/finalizar — aplica as divergências como ajuste de estoque
inventariosRoutes.post(
  '/:id/finalizar',
  requireRole('administrador', 'gestor'),
  async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();

    try {
      const id = Number(req.params.id);
      const usuarioId = req.session.usuarioId || 1;

      await client.query('BEGIN');

      const { rows: invRows } = await client.query('SELECT * FROM inventarios WHERE id = $1 FOR UPDATE', [id]);
      const inventario = invRows[0];
      if (!inventario) throw new AppError('Inventário não encontrado.', 404);
      if (inventario.status !== 'conferencia') {
        throw new AppError('O inventário precisa estar em conferência para ser finalizado.', 422);
      }

      const { rows: itens } = await client.query(
        `SELECT * FROM inventario_itens WHERE inventario_id = $1 AND estoque_contado IS NOT NULL`,
        [id]
      );

      for (const item of itens) {
        if (Number(item.divergencia) === 0) continue;

        await client.query('UPDATE produtos SET estoque_atual = $1 WHERE id = $2', [
          item.estoque_contado,
          item.produto_id,
        ]);

        await client.query(
          `INSERT INTO movimentacoes_estoque (produto_id, usuario_id, tipo, quantidade, estoque_resultante, motivo)
           VALUES ($1, $2, 'ajuste', $3, $3, $4)`,
          [item.produto_id, usuarioId, item.estoque_contado, `Inventário #${id} — divergência ajustada`]
        );
      }

      await client.query(
        `UPDATE inventarios SET status = 'finalizado', finalizado_em = NOW() WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Inventário finalizado. ${itens.filter((i) => Number(i.divergencia) !== 0).length} produto(s) ajustado(s).`,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);
