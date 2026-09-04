import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { MovimentacaoEstoque, MovimentacaoInput, Produto, ProdutoInput } from './produtos.types';

export async function listarProdutos(busca?: string, categoriaId?: number): Promise<Produto[]> {
  const produtos = await prisma.produtos.findMany({
    where: {
      ativo: true,

      ...(busca
        ? {
          OR: [
            {
              nome: {
                contains: busca,
                mode: 'insensitive'
              },
            },
            {
              sku: {
                contains: busca,
                mode: 'insensitive'
              },
            },
            {
              codigo_barras: {
                contains: busca,
                mode: 'insensitive'
              },
            },
          ],
        }
      : {}),

      ...(categoriaId
        ? {
          categoria_id: categoriaId,
        }
      : {})
    },

    include: {
      categorias: {
        select: {
          nome: true,
        },
      },
    },

    orderBy: {
      nome: 'asc',
    },
  });

  return produtos.map(({ categorias, ...produto }) => ({
    ...produto,

    preco_venda: Number(produto.preco_venda),
    preco_custo: Number(produto.preco_custo),
    estoque_atual: Number(produto.estoque_atual),
    estoque_minimo: Number(produto.estoque_minimo),

    estoque_maximo:
      produto.estoque_maximo !== null
        ? Number(produto.estoque_maximo)
        : null,
    
    criado_em: produto.criado_em.toISOString(),
    categoria_nome: categorias?.nome ??null,
  }));
}

export async function buscarProdutoPorId(id: number): Promise<Produto> {
  const produto = await prisma.produtos.findUnique({
    where: {
      id,
    },

    include: {
      categorias: {
        select: {
          nome: true,
        },
      },
    },
  });

  if (!produto) {
    throw new AppError('Produto não encontrado.', 404);
  }

  const { categorias, ...dadosProduto } = produto;

  return {
    ...dadosProduto,

    preco_venda: Number(produto.preco_venda),
    preco_custo: Number(produto.preco_custo),
    estoque_atual: Number(produto.estoque_atual),
    estoque_minimo: Number(produto.estoque_minimo),

    estoque_maximo:
      produto.estoque_maximo !== null
        ? Number(produto.estoque_maximo)
        : null,

    criado_em: produto.criado_em.toISOString(),

    categoria_nome: categorias?.nome ?? null,
  };
}

export async function criarProduto(dados: ProdutoInput): Promise<Produto> {
  if (!dados.nome || dados.nome.trim() === '') {
    throw new AppError(
      'O nome do produto é obrigatório.',
      422
    );
  }

  const sku = dados.sku?.trim() || null;

  if (sku) {
    const existente = await prisma.produtos.findUnique({
      where: {
        sku,
      },

      select: {
        id: true,
      },
    });

    if (existente) {
      throw new AppError(
        'Já existe um produto com esse SKU.',
        422
      );
    }
  }

  const produto = await prisma.produtos.create({
    data: {
      nome: dados.nome.trim(),
      sku,

      codigo_barras: dados.codigo_barras?.trim() || null,
      descricao: dados.descricao?.trim() || null,
      grupo: dados.grupo?.trim() || null,
      unidade_medida: dados.unidade_medida?.trim() || 'UN',
      categoria_id: dados.categoria_id ?? null,
      preco_venda: dados.preco_venda ?? 0,
      preco_custo: dados.preco_custo ?? 0,
      estoque_atual: 0,
      estoque_minimo: dados.estoque_minimo ?? 0,
      estoque_maximo: dados.estoque_maximo ?? null,
      ncm: dados.ncm?.trim() || null,
      cfop: dados.cfop?.trim() || null,
      cest: dados.cest?.trim() || null,
      origem_fiscal: dados.origem_fiscal?.trim() || '0',
    },
  });

  return {
    ...produto,

    preco_venda: Number(produto.preco_venda),
    preco_custo: Number(produto.preco_custo),
    estoque_atual: Number(produto.estoque_atual),
    estoque_minimo: Number(produto.estoque_minimo),

    estoque_maximo:
      produto.estoque_maximo !== null
        ? Number(produto.estoque_maximo)
        : null,

    criado_em: produto.criado_em.toISOString(),
  };
}

export async function atualizarProduto(id: number, dados: ProdutoInput): Promise<Produto> {
  await buscarProdutoPorId(id);

  if (!dados.nome || dados.nome.trim() === '') {
    throw new AppError(
      'O nome do produto é obrigatório.',
      422
    );
  }

  const sku = dados.sku?.trim() || null;
  const codigoBarras = dados.codigo_barras?.trim() || null;

  if (sku) {
    const produtoComMesmoSku = await prisma.produtos.findFirst({
      where: {
        sku,
        id: {not: id,},
      },

      select: {id: true,},
    });

    if (produtoComMesmoSku) {
      throw new AppError(
        'Já existe outro produto com esse SKU.',
        422
      );
    }
  }

  if (codigoBarras) {
    const produtoComMesmoCodigo = await prisma.produtos.findFirst({
      where: {
        codigo_barras: codigoBarras,
        id: {
          not: id,
        },
      },

      select: {
        id: true,
      },
    });

    if (produtoComMesmoCodigo) {
      throw new AppError(
        'Já existe outro produto com esse código de barras.',
        422
      );
    }
  }

  const produto = await prisma.produtos.update({
    where: {id,},

    data: {
      nome: dados.nome.trim(),
      sku,
      codigo_barras: codigoBarras,
      descricao: dados.descricao?.trim() || null,
      grupo: dados.grupo?.trim() || null,
      unidade_medida: dados.unidade_medida?.trim() || 'UN',
      categoria_id: dados.categoria_id ?? null,
      preco_venda: dados.preco_venda ?? 0,
      preco_custo: dados.preco_custo ?? 0,
      estoque_minimo: dados.estoque_minimo ?? 0,
      estoque_maximo: dados.estoque_maximo ?? null,
      ncm: dados.ncm?.trim() || null,
      cfop: dados.cfop?.trim() || null,
      cest: dados.cest?.trim() || null,
      origem_fiscal: dados.origem_fiscal?.trim() || '0',
    },
  });

  return {
    ...produto,

    preco_venda: Number(produto.preco_venda),
    preco_custo: Number(produto.preco_custo),
    estoque_atual: Number(produto.estoque_atual),
    estoque_minimo: Number(produto.estoque_minimo),

    estoque_maximo:
      produto.estoque_maximo !== null
        ? Number(produto.estoque_maximo)
        : null,

    criado_em: produto.criado_em.toISOString(),
  };
}

export async function inativarProduto(id: number): Promise<void> {
  await buscarProdutoPorId(id);
  await prisma.produtos.update({
    where: {id},
    data: {ativo: false},
  });
}

/**
 * Registra uma movimentação de estoque e atualiza o saldo do produto
 * dentro de uma única transação — evita saldo inconsistente se algo falhar no meio.
 */
export async function registrarMovimentacao(produtoId: number, usuarioId: number, dados: MovimentacaoInput): Promise<{produto: Produto;movimentacao: MovimentacaoEstoque;}> {
  if (!dados.quantidade || dados.quantidade <= 0) {
    throw new AppError(
      'Informe uma quantidade maior que zero.',
      422
    );
  }

  if (!['entrada', 'saida', 'ajuste'].includes(dados.tipo)) {
    throw new AppError(
      'Tipo de movimentação inválido.',
      422
    );
  }

  const MAX_TENTATIVAS = 3;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const produtoAtual = await tx.produtos.findUnique({
            where: {id: produtoId,},
          });

          if (!produtoAtual) {
            throw new AppError(
              'Produto não encontrado.',
              404
            );
          }

          const estoqueAtual = Number(produtoAtual.estoque_atual);

          let novoEstoque: number;

          switch (dados.tipo) {
            case 'entrada':
              novoEstoque = estoqueAtual + dados.quantidade;
              break;
            case 'saida':
              novoEstoque = estoqueAtual - dados.quantidade;

              if (novoEstoque < 0) {
                throw new AppError(
                  'Estoque insuficiente para essa saída.',
                  422
                );
              }
              break;

            case 'ajuste':
              novoEstoque = dados.quantidade;
              break;

            default:
              throw new AppError(
                'Tipo de movimentação inválido.',
                422
              );
          }

          const produtoAtualizado = await tx.produtos.update({
              where: {id: produtoId,},
              data: { estoque_atual: novoEstoque,},
            });

          const movimentacao = await tx.movimentacoes_estoque.create({
            data: {
              produto_id: produtoId,
              usuario_id: usuarioId,
              tipo: dados.tipo,
              quantidade: dados.quantidade,
              estoque_resultante: novoEstoque,
              motivo: dados.motivo?.trim() || null,
            },
          });

          return {
            produto: {
              ...produtoAtualizado,

              preco_venda: Number(produtoAtualizado.preco_venda),
              preco_custo: Number(produtoAtualizado.preco_custo),
              estoque_atual: Number(produtoAtualizado.estoque_atual),
              estoque_minimo: Number(produtoAtualizado.estoque_minimo),
              estoque_maximo:
                produtoAtualizado.estoque_maximo !== null
                  ? Number(produtoAtualizado.estoque_maximo)
                  : null,
              criado_em: produtoAtualizado.criado_em.toISOString(),
            },

            movimentacao: {
              ...movimentacao,
              tipo: movimentacao.tipo as MovimentacaoEstoque['tipo'],
              quantidade: Number(movimentacao.quantidade),
              estoque_resultante: Number(movimentacao.estoque_resultante),
              criado_em: movimentacao.criado_em.toISOString(),
            },
          };
        },
        {
          isolationLevel: 'Serializable',
        }
      );
    } catch (error) {
      const codigoPrisma = (error as { code?: string }).code;

      if (
        codigoPrisma === 'P2034' &&
        tentativa < MAX_TENTATIVAS
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new AppError(
    'Não foi possível concluir a movimentação de estoque.',
    500
  );
}

export async function listarMovimentacoes(produtoId: number): Promise<MovimentacaoEstoque[]> {
  const movimentacoes = await prisma.movimentacoes_estoque.findMany({
    where: {produto_id: produtoId,},
    include: {
      usuarios: {
        select: {nome: true,},
      },
    },
    orderBy: { criado_em: 'desc',},
    take: 50,
  });

  return movimentacoes.map(
    ({ usuarios, ...movimentacao }) => ({
      ...movimentacao,
      tipo: movimentacao.tipo as MovimentacaoEstoque['tipo'],
      quantidade: Number(movimentacao.quantidade),
      estoque_resultante: Number(movimentacao.estoque_resultante),
      criado_em: movimentacao.criado_em.toISOString(),
      usuario_nome: usuarios.nome,
    })
  );
}