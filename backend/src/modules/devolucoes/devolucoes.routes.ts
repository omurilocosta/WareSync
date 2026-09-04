import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';

export const devolucoesRoutes = Router();

devolucoesRoutes.use(requireAuth);

interface ItemDevolucaoInput {
  venda_item_id: number;
  quantidade: number;
}

// POST /api/devolucoes — { venda_id, motivo, itens: [{ venda_item_id, quantidade }] }
devolucoesRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();

  try {
    const { venda_id, motivo, itens } = req.body as {
      venda_id: number;
      motivo?: string;
      itens: ItemDevolucaoInput[];
    };

    if (!venda_id || !itens || itens.length === 0) {
      throw new AppError('Informe a venda e ao menos um item a devolver.', 422);
    }

    await client.query('BEGIN');

    const { rows: vendaRows } = await client.query('SELECT * FROM vendas WHERE id = $1 FOR UPDATE', [venda_id]);
    const venda = vendaRows[0];
    if (!venda) throw new AppError('Venda não encontrada.', 404);
    if (venda.status !== 'finalizada') {
      throw new AppError('Só é possível devolver itens de vendas finalizadas.', 422);
    }

    const usuarioId = req.session.usuarioId || 1;
    let valorTotalDevolucao = 0;

    const { rows: devolucaoRows } = await client.query(
      `INSERT INTO devolucoes (venda_id, usuario_id, motivo, valor_total) VALUES ($1, $2, $3, 0) RETURNING *`,
      [venda_id, usuarioId, motivo || null]
    );
    const devolucao = devolucaoRows[0];

    for (const item of itens) {
      const { rows: vendaItemRows } = await client.query(
        'SELECT * FROM venda_itens WHERE id = $1 AND venda_id = $2',
        [item.venda_item_id, venda_id]
      );
      const vendaItem = vendaItemRows[0];
      if (!vendaItem) throw new AppError(`Item de venda ${item.venda_item_id} não encontrado nesta venda.`, 404);

      const { rows: jaDevolvidoRows } = await client.query(
        `SELECT COALESCE(SUM(quantidade), 0) AS total FROM devolucao_itens WHERE venda_item_id = $1`,
        [item.venda_item_id]
      );
      const jaDevolvido = Number(jaDevolvidoRows[0].total);
      const disponivel = Number(vendaItem.quantidade) - jaDevolvido;

      if (item.quantidade <= 0 || item.quantidade > disponivel) {
        throw new AppError(
          `Quantidade inválida para devolução do item ${item.venda_item_id}. Disponível: ${disponivel}.`,
          422
        );
      }

      const valorItem = Number(vendaItem.preco_unitario) * item.quantidade;
      valorTotalDevolucao += valorItem;

      await client.query(
        `INSERT INTO devolucao_itens (devolucao_id, venda_item_id, produto_id, quantidade, valor)
         VALUES ($1, $2, $3, $4, $5)`,
        [devolucao.id, item.venda_item_id, vendaItem.produto_id, item.quantidade, valorItem]
      );

      const { rows: produtoRows } = await client.query(
        'SELECT * FROM produtos WHERE id = $1 FOR UPDATE',
        [vendaItem.produto_id]
      );
      const novoEstoque = Number(produtoRows[0].estoque_atual) + item.quantidade;

      await client.query('UPDATE produtos SET estoque_atual = $1 WHERE id = $2', [
        novoEstoque,
        vendaItem.produto_id,
      ]);

      await client.query(
        `INSERT INTO movimentacoes_estoque (produto_id, usuario_id, tipo, quantidade, estoque_resultante, motivo)
         VALUES ($1, $2, 'entrada', $3, $4, $5)`,
        [vendaItem.produto_id, usuarioId, item.quantidade, novoEstoque, `Devolução venda #${venda_id}`]
      );
    }

    await client.query('UPDATE devolucoes SET valor_total = $1 WHERE id = $2', [
      valorTotalDevolucao,
      devolucao.id,
    ]);

    const { rows: contaReceberRows } = await client.query(
      `SELECT id, valor FROM contas_receber WHERE venda_id = $1 AND status = 'pendente'`,
      [venda_id]
    );
    if (contaReceberRows[0]) {
      const novoValor = Math.max(Number(contaReceberRows[0].valor) - valorTotalDevolucao, 0);
      await client.query('UPDATE contas_receber SET valor = $1 WHERE id = $2', [
        novoValor,
        contaReceberRows[0].id,
      ]);
    } else {
      const { rows: sessaoRows } = await client.query(
        `SELECT id FROM caixa_sessoes WHERE status = 'aberto' LIMIT 1`
      );
      if (sessaoRows[0] && valorTotalDevolucao > 0) {
        await client.query(
          `INSERT INTO caixa_movimentacoes (caixa_sessao_id, tipo, valor, descricao)
           VALUES ($1, 'saida', $2, $3)`,
          [sessaoRows[0].id, valorTotalDevolucao, `Devolução venda #${venda_id}`]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ success: true, message: 'Devolução registrada com sucesso.', data: devolucao });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/devolucoes/venda/:vendaId — histórico de devoluções de uma venda
devolucoesRoutes.get('/venda/:vendaId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendaId = Number(req.params.vendaId);
    const { rows } = await pool.query(
      `SELECT d.*, di.produto_id, p.nome AS produto_nome, di.quantidade, di.valor
       FROM devolucoes d
       JOIN devolucao_itens di ON di.devolucao_id = d.id
       JOIN produtos p ON p.id = di.produto_id
       WHERE d.venda_id = $1
       ORDER BY d.criado_em DESC`,
      [vendaId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});
