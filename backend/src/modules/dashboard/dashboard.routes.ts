import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { requireAuth } from '../../middlewares/auth.middleware';

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

dashboardRoutes.get('/resumo', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const agora = new Date();

    const inicioHoje = new Date(
      Date.UTC(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
      )
    );

    const fimHoje = new Date(inicioHoje);
    fimHoje.setUTCDate(fimHoje.getUTCDate() + 1);

    const [
      clientes,
      produtos,
      vendasHoje,
      vendasRecentes,
    ] = await Promise.all([
      prisma.clientes.findMany({
        where: {
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          criado_em: true,
        },
        orderBy: {
          criado_em: 'desc',
        },
      }),

      prisma.produtos.findMany({
        where: {
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          sku: true,
          estoque_atual: true,
          estoque_minimo: true,
          preco_custo: true,
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
          criado_em: {
            gte: inicioHoje,
            lt: fimHoje,
          },
        },
        select: {
          total: true,
        },
      }),

      prisma.vendas.findMany({
        where: {
          status: 'finalizada',
        },
        take: 5,
        orderBy: {
          criado_em: 'desc',
        },
        include: {
          clientes: {
            select: {
              nome: true,
            },
          },
          usuarios: {
            select: {
              nome: true,
            },
          },
        },
      }),
    ]);

    const produtosEstoqueBaixo = produtos
      .filter(
        produto =>
          Number(produto.estoque_atual) <= Number(produto.estoque_minimo)
      )
      .sort(
        (a, b) =>
          Number(a.estoque_atual) - Number(b.estoque_atual)
      )
      .slice(0, 10)
      .map(produto => ({
        id: produto.id,
        nome: produto.nome,
        sku: produto.sku,
        estoque_atual: Number(produto.estoque_atual),
        estoque_minimo: Number(produto.estoque_minimo),
        categoria_nome: produto.categorias?.nome ?? null,
      }));

    const valorEstoque = produtos.reduce(
      (total, produto) =>
        total +
        Number(produto.estoque_atual) *
          Number(produto.preco_custo),
      0
    );

    const totalVendidoHoje = vendasHoje.reduce(
      (total, venda) => total + Number(venda.total),
      0
    );

    const quantidadeVendasHoje = vendasHoje.length;

    const ticketMedio =
      quantidadeVendasHoje > 0
        ? totalVendidoHoje / quantidadeVendasHoje
        : 0;

    const clientesRecentes = clientes
      .slice(0, 5)
      .map(cliente => ({
        ...cliente,
        criado_em: cliente.criado_em.toISOString(),
      }));

    const vendasRecentesFormatadas = vendasRecentes.map(venda => ({
      id: venda.id,
      total: Number(venda.total),
      forma_pagamento: venda.forma_pagamento,
      criado_em: venda.criado_em.toISOString(),
      cliente_nome: venda.clientes?.nome ?? null,
      usuario_nome: venda.usuarios.nome,
    }));

    res.json({
      success: true,
      data: {
        total_clientes: clientes.length,
        total_produtos: produtos.length,
        valor_estoque: valorEstoque,
        produtos_estoque_baixo: produtosEstoqueBaixo,
        clientes_recentes: clientesRecentes,
        vendas_hoje: totalVendidoHoje,
        vendas_hoje_qtd: quantidadeVendasHoje,
        ticket_medio: ticketMedio,
        vendas_recentes: vendasRecentesFormatadas,
      },
    });
  } catch (err) {
    next(err);
  }
});