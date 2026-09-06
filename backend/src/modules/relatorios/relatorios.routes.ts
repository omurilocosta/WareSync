import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const relatoriosRoutes = Router();

function obterPeriodo(req: Request) {
  const hoje = new Date();

  const inicioPadrao = new Date(hoje);
  inicioPadrao.setDate(inicioPadrao.getDate() - 30);

  const inicio =
    typeof req.query.inicio === 'string'
      ? req.query.inicio
      : inicioPadrao.toISOString().slice(0, 10);

  const fim =
    typeof req.query.fim === 'string'
      ? req.query.fim
      : hoje.toISOString().slice(0, 10);

  const inicioData = new Date(`${inicio}T00:00:00.000Z`);

  const fimData = new Date(`${fim}T00:00:00.000Z`);
  fimData.setUTCDate(fimData.getUTCDate() + 1);

  return {inicio,fim,inicioData,fimData,};
}

relatoriosRoutes.use(requireAuth, requireRole('administrador', 'gestor'));

// GET /api/relatorios/vendas?inicio=2026-08-01&fim=2026-08-31
relatoriosRoutes.get('/vendas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inicio, fim, inicioData, fimData } = obterPeriodo(req);

    const vendas = await prisma.vendas.findMany({
      where: {
        status: 'finalizada',
        criado_em: {
          gte: inicioData,
          lt: fimData,
        },
      },
      include: {
        usuarios: {
          select: {
            nome: true,
          },
        },
        venda_itens: {
          include: {
            produtos: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        criado_em: 'asc',
      },
    });

    const porDiaMap = new Map<
      string,
      {
        dia: string;
        quantidade: number;
        total: number;
      }
    >();

    const porVendedorMap = new Map<
      string,
      {
        vendedor: string;
        quantidade: number;
        total: number;
      }
    >();

    const porProdutoMap = new Map<
      string,
      {
        produto: string;
        quantidade: number;
        total: number;
      }
    >();

    for (const venda of vendas) {
      const dia = venda.criado_em.toISOString().slice(0, 10);
      const totalVenda = Number(venda.total);

      const registroDia = porDiaMap.get(dia) || {
        dia,
        quantidade: 0,
        total: 0,
      };

      registroDia.quantidade += 1;
      registroDia.total += totalVenda;

      porDiaMap.set(dia, registroDia);

      const vendedor = venda.usuarios?.nome || 'Sem vendedor';

      const registroVendedor = porVendedorMap.get(vendedor) || {
        vendedor,
        quantidade: 0,
        total: 0,
      };

      registroVendedor.quantidade += 1;
      registroVendedor.total += totalVenda;

      porVendedorMap.set(vendedor, registroVendedor);

      for (const item of venda.venda_itens) {
        const produto = item.produtos.nome;

        const registroProduto = porProdutoMap.get(produto) || {
          produto,
          quantidade: 0,
          total: 0,
        };

        registroProduto.quantidade += Number(item.quantidade);
        registroProduto.total += Number(item.subtotal);

        porProdutoMap.set(produto, registroProduto);
      }
    }

    const porDia = Array.from(porDiaMap.values());

    const porVendedor = Array.from(porVendedorMap.values())
      .sort((a, b) => b.total - a.total);

    const porProduto = Array.from(porProdutoMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const totalGeral = vendas.reduce(
      (acc, venda) => acc + Number(venda.total),
      0
    );

    res.json({
      success: true,
      data: {
        periodo: {
          inicio,
          fim,
        },
        resumo: {
          quantidade: vendas.length,
          total: totalGeral,
        },
        por_dia: porDia,
        por_vendedor: porVendedor,
        por_produto: porProduto,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/relatorios/estoque
relatoriosRoutes.get('/estoque', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [produtosDb, vendasFinalizadas] = await Promise.all([
      prisma.produtos.findMany({
        where: {
          ativo: true,
        },
        include: {
          categorias: {
            select: {
              nome: true,
            },
          },
        },
      }),

      prisma.vendas.findMany({
        where: {
          status: 'finalizada',
        },
        select: {
          venda_itens: {
            select: {
              produto_id: true,
            },
          },
        },
      }),
    ]);

    const produtosVendidos = new Set<number>();

    for (const venda of vendasFinalizadas) {
      for (const item of venda.venda_itens) {
        produtosVendidos.add(item.produto_id);
      }
    }

    const produtos = produtosDb
      .map(produto => {
        const estoqueAtual = Number(produto.estoque_atual);
        const precoCusto = Number(produto.preco_custo);

        return {
          nome: produto.nome,
          sku: produto.sku,
          estoque_atual: estoqueAtual,
          estoque_minimo: Number(produto.estoque_minimo),
          preco_custo: precoCusto,
          valor_em_estoque: estoqueAtual * precoCusto,
          categoria_nome: produto.categorias?.nome ?? null,
        };
      })
      .sort((a, b) => b.valor_em_estoque - a.valor_em_estoque);

    const semVenda = produtosDb
      .filter(produto => !produtosVendidos.has(produto.id))
      .map(produto => ({
        id: produto.id,
        nome: produto.nome,
        sku: produto.sku,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));

    const valorTotal = produtos.reduce(
      (acc, produto) => acc + produto.valor_em_estoque,
      0
    );

    res.json({
      success: true,
      data: {
        produtos,
        produtos_sem_venda: semVenda,
        valor_total_estoque: valorTotal,
      },
    });
  } catch (err) {
    next(err);
  }
});
// GET /api/relatorios/financeiro?inicio=...&fim=...
relatoriosRoutes.get('/financeiro', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inicio, fim, inicioData, fimData } = obterPeriodo(req);

    const [
      vendas,
      contasPagar,
      contasReceber,
    ] = await Promise.all([
      prisma.vendas.findMany({
        where: {
          status: 'finalizada',
          criado_em: {
            gte: inicioData,
            lt: fimData,
          },
        },
        select: {
          total: true,
          venda_itens: {
            select: {
              quantidade: true,
              produtos: {
                select: {
                  preco_custo: true,
                },
              },
            },
          },
        },
      }),

      prisma.contas_pagar.aggregate({
        where: {
          status: 'aberta',
        },
        _sum: {
          valor: true,
        },
      }),

      prisma.contas_receber.aggregate({
        where: {
          status: 'pendente',
        },
        _sum: {
          valor: true,
        },
      }),
    ]);

    const receita = vendas.reduce(
      (acc, venda) => acc + Number(venda.total),
      0
    );

    const custo = vendas.reduce((total, venda) => {
      const custoVenda = venda.venda_itens.reduce(
        (acc, item) => {
          const quantidade = Number(item.quantidade);
          const precoCusto = Number(item.produtos.preco_custo);

          return acc + quantidade * precoCusto;
        },
        0
      );

      return total + custoVenda;
    }, 0);

    const lucroBruto = receita - custo;

    res.json({
      success: true,
      data: {
        periodo: {
          inicio,
          fim,
        },

        dre: {
          receita_bruta: receita,
          custo_produtos_vendidos: custo,
          lucro_bruto: lucroBruto,
          margem:
            receita > 0
              ? Number(((lucroBruto / receita) * 100).toFixed(1))
              : 0,
        },

        contas_pagar_em_aberto: Number(
          contasPagar._sum.valor ?? 0
        ),

        contas_receber_pendentes: Number(
          contasReceber._sum.valor ?? 0
        ),
      },
    });
  } catch (err) {
    next(err);
  }
});