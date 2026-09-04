import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { Cliente, ClienteInput } from './clientes.types';

export async function listarClientes(busca?: string): Promise<Cliente[]> {
  if (busca) {
    const { rows } = await pool.query(
      `SELECT * FROM clientes
       WHERE ativo = TRUE AND (nome ILIKE $1 OR documento ILIKE $1 OR email ILIKE $1)
       ORDER BY nome ASC`,
      [`%${busca}%`]
    );
    return rows;
  }

  const { rows } = await pool.query('SELECT * FROM clientes WHERE ativo = TRUE ORDER BY nome ASC');
  return rows;
}

export async function buscarClientePorId(id: number): Promise<Cliente> {
  const { rows } = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
  if (!rows[0]) {
    throw new AppError('Cliente não encontrado.', 404);
  }
  return rows[0];
}

export async function buscarDetalhesCliente(id: number) {
  const cliente = await buscarClientePorId(id);

  const { rows: compras } = await pool.query(
    `SELECT id, total, criado_em, status FROM vendas
     WHERE cliente_id = $1 AND status = 'finalizada'
     ORDER BY criado_em DESC LIMIT 20`,
    [id]
  );

  const { rows: resumo } = await pool.query(
    `SELECT COUNT(*)::int AS quantidade, COALESCE(SUM(total), 0)::numeric(14,2) AS total_comprado
     FROM vendas WHERE cliente_id = $1 AND status = 'finalizada'`,
    [id]
  );

  const { rows: situacaoFinanceira } = await pool.query(
    `SELECT COALESCE(SUM(valor), 0)::numeric(14,2) AS saldo_devedor
     FROM contas_receber WHERE cliente_id = $1 AND status = 'pendente'`,
    [id]
  );

  return {
    ...cliente,
    historico_compras: compras,
    total_compras: resumo[0].quantidade,
    valor_total_comprado: resumo[0].total_comprado,
    saldo_devedor: situacaoFinanceira[0].saldo_devedor,
    limite_disponivel: Number(cliente.limite_credito) - Number(situacaoFinanceira[0].saldo_devedor),
  };
}

export async function criarCliente(dados: ClienteInput): Promise<Cliente> {
  if (!dados.nome || dados.nome.trim() === '') {
    throw new AppError('O nome do cliente é obrigatório.', 422);
  }

  const { rows } = await pool.query(
    `INSERT INTO clientes (nome, documento, email, telefone, endereco, numero, bairro, cidade, estado, observacoes, limite_credito)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      dados.nome.trim(),
      dados.documento || null,
      dados.email || null,
      dados.telefone || null,
      dados.endereco || null,
      dados.numero || null,
      dados.bairro || null,
      dados.cidade || null,
      dados.estado || null,
      dados.observacoes || null,
      dados.limite_credito ?? 0,
    ]
  );

  return rows[0];
}

export async function atualizarCliente(id: number, dados: ClienteInput): Promise<Cliente> {
  await buscarClientePorId(id);

  if (!dados.nome || dados.nome.trim() === '') {
    throw new AppError('O nome do cliente é obrigatório.', 422);
  }

  const { rows } = await pool.query(
    `UPDATE clientes
     SET nome = $1, documento = $2, email = $3, telefone = $4, endereco = $5,
         numero = $6, bairro = $7, cidade = $8, estado = $9, observacoes = $10, limite_credito = $11
     WHERE id = $12
     RETURNING *`,
    [
      dados.nome.trim(),
      dados.documento || null,
      dados.email || null,
      dados.telefone || null,
      dados.endereco || null,
      dados.numero || null,
      dados.bairro || null,
      dados.cidade || null,
      dados.estado || null,
      dados.observacoes || null,
      dados.limite_credito ?? 0,
      id,
    ]
  );

  return rows[0];
}

export async function inativarCliente(id: number): Promise<void> {
  await buscarClientePorId(id);
  await pool.query('UPDATE clientes SET ativo = FALSE WHERE id = $1', [id]);
}
