import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { Cliente, ClienteInput } from './clientes.types';

export async function listarClientes(busca?: string): Promise<Cliente[]> {
  const termo = busca?.trim();

  const clientes = await prisma.clientes.findMany({
    where: {
      ativo: true,

      ...(termo
        ? {
            OR: [
              {
                nome: {
                  contains: termo,
                  mode: 'insensitive',
                },
              },
              {
                documento: {
                  contains: termo,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: termo,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    },

    orderBy: {nome: 'asc'},
  });

  return clientes.map((cliente) => ({
    ...cliente,
    limite_credito: Number(cliente.limite_credito),
    criado_em: cliente.criado_em.toISOString(),
  }));
}

export async function buscarClientePorId(id: number): Promise<Cliente> {
  const cliente = await prisma.clientes.findUnique({
    where: {id},
  });

  if (!cliente) { throw new AppError('Cliente não encontrado.', 404);}

  return {
    ...cliente,
    limite_credito: Number(cliente.limite_credito),
    criado_em: cliente.criado_em.toISOString()
  };
}

export async function buscarDetalhesCliente(id: number) {
  const cliente = await buscarClientePorId(id);

  const compras = await prisma.vendas.findMany({
    where: {
      cliente_id: id,
      status: 'finalizada',
    },

    select: {
      id: true,
      total: true,
      criado_em: true,
      status: true,
    },

    orderBy: {
      criado_em: 'desc',
    },

    take: 20,
  });

  const resumo = await prisma.vendas.aggregate({
    where: {
      cliente_id: id,
      status: 'finalizada',
    },

    _count: {
      _all: true,
    },

    _sum: {
      total: true,
    },
  });

  const situacaoFinanceira =
    await prisma.contas_receber.aggregate({
      where: {
        cliente_id: id,
        status: 'pendente',
      },

      _sum: {
        valor: true,
      },
    });

  const saldoDevedor = Number(
    situacaoFinanceira._sum.valor ?? 0
  );

  const limiteCredito = Number(
    cliente.limite_credito ?? 0
  );

  return {
    ...cliente,

    historico_compras: compras.map((compra) => ({
      ...compra,
      total: Number(compra.total),
    })),

    total_compras: resumo._count._all,

    valor_total_comprado: Number(
      resumo._sum.total ?? 0
    ),

    saldo_devedor: saldoDevedor,

    limite_disponivel:
      limiteCredito - saldoDevedor,
  };
}

export async function criarCliente(dados: ClienteInput): Promise<Cliente> {
  if (!dados.nome || dados.nome.trim() === '') {
    throw new AppError('O nome do cliente é obrigatório.', 422);  
  }

  const cliente = await prisma.clientes.create({
    data: {
      nome: dados.nome.trim(),
      documento: dados.documento || null,
      email: dados.email || null,
      telefone: dados.telefone || null,
      endereco: dados.endereco || null,
      numero: dados.numero || null,
      bairro: dados.bairro || null,
      cidade: dados.cidade || null,
      estado: dados.estado || null,
      observacoes: dados.observacoes || null,
      limite_credito: dados.limite_credito ?? 0,
    },
  });

  return {
    ...cliente,
    limite_credito: Number(cliente.limite_credito),
    criado_em: cliente.criado_em.toISOString(),
  };
}

export async function atualizarCliente(id: number, dados: ClienteInput): Promise<Cliente> {
  await buscarClientePorId(id);

  if (!dados.nome || dados.nome.trim() === '') {
    throw new AppError('O nome do cliente é obrigatório.', 422);
  }

  const cliente = await prisma.clientes.update({
    where: {id},

    data: {
      nome: dados.nome.trim(),
      documento: dados.documento || null,
      email: dados.email || null,
      telefone: dados.telefone || null,
      endereco: dados.endereco || null,
      numero: dados.numero || null,
      bairro: dados.bairro || null,
      cidade: dados.cidade || null,
      estado: dados.estado || null,
      observacoes: dados.observacoes || null,
      limite_credito: dados.limite_credito ?? 0,
    },
  });

  return {
    ...cliente,
    limite_credito: Number(cliente.limite_credito),
    criado_em: cliente.criado_em.toISOString(),
  };
}

export async function inativarCliente(id: number): Promise<void> {
  await buscarClientePorId(id);

  await prisma.clientes.update({
    where: { id, },
    data: { ativo: false, },
  });
}