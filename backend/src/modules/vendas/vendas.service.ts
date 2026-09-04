import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { Venda, VendaInput } from './vendas.types';

export async function listarVendas(filtros: {
  limite?: number;
  data?: string;
  cliente?: string;
  numero?: string;
  vendedor?: string;
  status?: string;
}): Promise<Venda[]> {
  const condicoes: string[] = [];
  const params: unknown[] = [];

  if (filtros.data) {
    params.push(filtros.data);
    condicoes.push(`v.criado_em::date = $${params.length}`);
  }
  if (filtros.cliente) {
    params.push(`%${filtros.cliente}%`);
    condicoes.push(`c.nome ILIKE $${params.length}`);
  }
  if (filtros.numero) {
    params.push(Number(filtros.numero) || 0);
    condicoes.push(`v.id = $${params.length}`);
  }
  if (filtros.vendedor) {
    params.push(`%${filtros.vendedor}%`);
    condicoes.push(`u.nome ILIKE $${params.length}`);
  }
  if (filtros.status) {
    params.push(filtros.status);
    condicoes.push(`v.status = $${params.length}`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  params.push(filtros.limite || 50);

  const { rows } = await pool.query(
    `SELECT v.*, c.nome AS cliente_nome, u.nome AS usuario_nome
     FROM vendas v
     LEFT JOIN clientes c ON c.id = v.cliente_id
     JOIN usuarios u ON u.id = v.usuario_id
     ${where}
     ORDER BY v.criado_em DESC
     LIMIT $${params.length}`,
    params
  );
  return rows;
}

export async function buscarVendaPorId(id: number): Promise<Venda> {
  const { rows: vendaRows } = await pool.query(
    `SELECT v.*, c.nome AS cliente_nome, u.nome AS usuario_nome
     FROM vendas v
     LEFT JOIN clientes c ON c.id = v.cliente_id
     JOIN usuarios u ON u.id = v.usuario_id
     WHERE v.id = $1`,
    [id]
  );

  const venda = vendaRows[0];
  if (!venda) {
    throw new AppError('Venda não encontrada.', 404);
  }

  const { rows: itensRows } = await pool.query(
    `SELECT vi.*, p.nome AS produto_nome
     FROM venda_itens vi
     JOIN produtos p ON p.id = vi.produto_id
     WHERE vi.venda_id = $1`,
    [id]
  );

  venda.itens = itensRows;
  return venda;
}

/**
 * Cria uma venda com seus itens, baixa o estoque de cada produto e calcula o
 * total — tudo em uma única transação. Se qualquer item falhar (ex: estoque
 * insuficiente), a venda inteira é revertida, não fica pela metade.
 */
export async function criarVenda(usuarioId: number, dados: VendaInput): Promise<Venda> {
  if (!dados.itens || dados.itens.length === 0) {
    throw new AppError('A venda precisa ter ao menos um item.', 422);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: vendaRows } = await client.query(
      `INSERT INTO vendas (cliente_id, usuario_id, status, forma_pagamento, desconto, total)
       VALUES ($1, $2, 'aberta', $3, $4, 0)
       RETURNING *`,
      [dados.cliente_id || null, usuarioId, dados.forma_pagamento || null, dados.desconto ?? 0]
    );
    const venda = vendaRows[0];

    let totalBruto = 0;

    for (const item of dados.itens) {
      if (!item.quantidade || item.quantidade <= 0) {
        throw new AppError('Quantidade inválida em um dos itens.', 422);
      }

      const { rows: produtoRows } = await client.query(
        'SELECT * FROM produtos WHERE id = $1 FOR UPDATE',
        [item.produto_id]
      );
      const produto = produtoRows[0];

      if (!produto) {
        throw new AppError(`Produto ${item.produto_id} não encontrado.`, 404);
      }

      if (Number(produto.estoque_atual) < item.quantidade) {
        throw new AppError(`Estoque insuficiente para "${produto.nome}".`, 422);
      }

      const precoUnitario = Number(produto.preco_venda);
      const subtotal = precoUnitario * item.quantidade;
      totalBruto += subtotal;

      await client.query(
        `INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [venda.id, item.produto_id, item.quantidade, precoUnitario, subtotal]
      );

      const novoEstoque = Number(produto.estoque_atual) - item.quantidade;

      await client.query('UPDATE produtos SET estoque_atual = $1 WHERE id = $2', [
        novoEstoque,
        item.produto_id,
      ]);

      await client.query(
        `INSERT INTO movimentacoes_estoque (produto_id, usuario_id, tipo, quantidade, estoque_resultante, motivo)
         VALUES ($1, $2, 'saida', $3, $4, $5)`,
        [item.produto_id, usuarioId, item.quantidade, novoEstoque, `Venda #${venda.id}`]
      );
    }

    const desconto = dados.desconto ?? 0;
    const total = Math.max(totalBruto - desconto, 0);

    // RN31: a venda deverá gerar o registro financeiro correspondente.
    if (dados.forma_pagamento === 'Crediário') {
      if (!dados.cliente_id) {
        throw new AppError('Venda no crediário exige um cliente selecionado.', 422);
      }

      const { rows: clienteRows } = await client.query(
        'SELECT * FROM clientes WHERE id = $1 FOR UPDATE',
        [dados.cliente_id]
      );
      const cliente = clienteRows[0];
      if (!cliente) throw new AppError('Cliente não encontrado.', 404);

      // RF29 / RN23: operações de crédito devem respeitar o limite configurado.
      const { rows: pendenteRows } = await client.query(
        `SELECT COALESCE(SUM(valor), 0)::numeric(14,2) AS total FROM contas_receber
         WHERE cliente_id = $1 AND status = 'pendente'`,
        [dados.cliente_id]
      );
      const saldoPendente = Number(pendenteRows[0].total);
      const limite = Number(cliente.limite_credito);

      if (saldoPendente + total > limite) {
        throw new AppError(
          `Limite de crédito insuficiente. Disponível: ${(limite - saldoPendente).toFixed(2)}, necessário: ${total.toFixed(2)}.`,
          422
        );
      }

      await client.query(
        `INSERT INTO contas_receber (cliente_id, venda_id, descricao, valor, vencimento)
         VALUES ($1, $2, $3, $4, CURRENT_DATE + INTERVAL '30 days')`,
        [dados.cliente_id, venda.id, `Venda #${venda.id} (crediário)`, total]
      );
    } else {
      // RN30/RN31: formas de pagamento à vista entram direto no caixa aberto, se houver.
      const { rows: sessaoRows } = await client.query(
        `SELECT id, valor_abertura FROM caixa_sessoes WHERE status = 'aberto' LIMIT 1`
      );
      if (sessaoRows[0] && total > 0) {
        await client.query(
          `INSERT INTO caixa_movimentacoes (caixa_sessao_id, tipo, valor, descricao)
           VALUES ($1, 'entrada', $2, $3)`,
          [sessaoRows[0].id, total, `Venda #${venda.id} (${dados.forma_pagamento || 'pagamento'})`]
        );
      }
    }

    const { rows: vendaFinalRows } = await client.query(
      `UPDATE vendas SET total = $1, status = 'finalizada' WHERE id = $2 RETURNING *`,
      [total, venda.id]
    );

    await client.query('COMMIT');

    return { ...vendaFinalRows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Cancela uma venda finalizada e devolve os itens ao estoque.
 */
export async function cancelarVenda(id: number, usuarioId: number, motivo: string): Promise<void> {
  if (!motivo || motivo.trim() === '') {
    throw new AppError('Informe o motivo do cancelamento.', 422);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: vendaRows } = await client.query('SELECT * FROM vendas WHERE id = $1 FOR UPDATE', [id]);
    const venda = vendaRows[0];

    if (!venda) throw new AppError('Venda não encontrada.', 404);
    if (venda.status !== 'finalizada') {
      throw new AppError('Só é possível cancelar vendas finalizadas.', 422);
    }

    const { rows: itens } = await client.query('SELECT * FROM venda_itens WHERE venda_id = $1', [id]);

    for (const item of itens) {
      const { rows: produtoRows } = await client.query(
        'SELECT * FROM produtos WHERE id = $1 FOR UPDATE',
        [item.produto_id]
      );
      const produto = produtoRows[0];
      const novoEstoque = Number(produto.estoque_atual) + Number(item.quantidade);

      await client.query('UPDATE produtos SET estoque_atual = $1 WHERE id = $2', [
        novoEstoque,
        item.produto_id,
      ]);

      await client.query(
        `INSERT INTO movimentacoes_estoque (produto_id, usuario_id, tipo, quantidade, estoque_resultante, motivo)
         VALUES ($1, $2, 'entrada', $3, $4, $5)`,
        [item.produto_id, usuarioId, item.quantidade, novoEstoque, `Cancelamento venda #${id}`]
      );
    }

    await client.query(
      `UPDATE vendas SET status = 'cancelada', motivo_cancelamento = $1 WHERE id = $2`,
      [motivo.trim(), id]
    );

    // Reverte o lançamento financeiro que a venda havia gerado.
    const { rows: contaReceberRows } = await client.query(
      `SELECT id FROM contas_receber WHERE venda_id = $1 AND status = 'pendente'`,
      [id]
    );
    if (contaReceberRows[0]) {
      await client.query('DELETE FROM contas_receber WHERE id = $1', [contaReceberRows[0].id]);
    } else {
      const { rows: sessaoRows } = await client.query(
        `SELECT id FROM caixa_sessoes WHERE status = 'aberto' LIMIT 1`
      );
      if (sessaoRows[0] && Number(venda.total) > 0) {
        await client.query(
          `INSERT INTO caixa_movimentacoes (caixa_sessao_id, tipo, valor, descricao)
           VALUES ($1, 'saida', $2, $3)`,
          [sessaoRows[0].id, venda.total, `Estorno venda #${id} (cancelamento)`]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
