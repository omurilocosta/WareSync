import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { Venda, VendaInput } from './vendas.types';

export async function listarVendas(filtros: {limite?: number;data?: string;cliente?: string;numero?: string;vendedor?: string;status?: string;}): Promise<Venda[]> {
  let dataInicio: Date | undefined;
  let dataFim: Date | undefined;

  if (filtros.data) {
    dataInicio = new Date(`${filtros.data}T00:00:00`);
    dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 1);
  }

  const numeroVenda = filtros.numero
    ? Number(filtros.numero) || 0
    : undefined;

  const vendas = await prisma.vendas.findMany({
    where: {
      ...(dataInicio && dataFim
        ? {
            criado_em: {
              gte: dataInicio,
              lt: dataFim,
            },
          }
        : {}),

      ...(filtros.cliente
        ? {
            clientes: {
              nome: {contains: filtros.cliente,mode: 'insensitive',},
            },
          }
        : {}),

      ...(numeroVenda !== undefined
        ? {id: numeroVenda,}
        : {}),

      ...(filtros.vendedor
        ? {
            usuarios: {
              nome: {
                contains: filtros.vendedor,
                mode: 'insensitive',
              },
            },
          }
        : {}),

      ...(filtros.status
        ? {status: filtros.status,}
        : {}),
    },
    include: {
      clientes: {select: {nome: true,},},
      usuarios: {select: {nome: true,},},
    },
    orderBy: {criado_em: 'desc',},
    take: filtros.limite || 50,
  });

  return vendas.map((venda) => ({
    id: venda.id,
    cliente_id: venda.cliente_id,
    cliente_nome: venda.clientes?.nome ?? null,
    usuario_id: venda.usuario_id,
    usuario_nome: venda.usuarios.nome,
    status:venda.status as Venda['status'],
    forma_pagamento: venda.forma_pagamento,
    desconto: Number(venda.desconto),
    total: Number(venda.total),
    criado_em: venda.criado_em.toISOString(),
  }));
}

export async function buscarVendaPorId(id: number): Promise<Venda> {
  const venda = await prisma.vendas.findUnique({
    where: {id,},

    include: {
      clientes: {
        select: {nome: true,},
      },

      usuarios: {
        select: {nome: true,},
      },

      venda_itens: {
        include: {
          produtos: {
            select: {nome: true,},
          },
        },
      },
    },
  });

  if (!venda) {
    throw new AppError('Venda não encontrada.',404);
  }

  return {
    id: venda.id,
    cliente_id: venda.cliente_id,
    cliente_nome: venda.clientes?.nome ?? null,
    usuario_id: venda.usuario_id,
    usuario_nome: venda.usuarios.nome,
    status:venda.status as Venda['status'],
    forma_pagamento: venda.forma_pagamento,
    desconto:Number(venda.desconto),
    total: Number(venda.total),
    criado_em: venda.criado_em.toISOString(),

    itens: venda.venda_itens.map((item) => ({
      id: item.id,
      venda_id:item.venda_id,
      produto_id:item.produto_id,
      produto_nome: item.produtos.nome,
      quantidade:Number(item.quantidade),
      preco_unitario: Number(item.preco_unitario),
      subtotal:Number(item.subtotal),
    })),
  };
}
/**
 * Cria uma venda com seus itens, baixa o estoque de cada produto e calcula o
 * total — tudo em uma única transação. Se qualquer item falhar (ex: estoque
 * insuficiente), a venda inteira é revertida, não fica pela metade.
 */
export async function criarVenda(usuarioId: number, dados: VendaInput): Promise<Venda> {
  if (!dados.itens || dados.itens.length === 0) throw new AppError('A venda precisa ter ao menos um item.', 422);

  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const venda = await tx.vendas.create({
          data:{
            cliente_id:dados.cliente_id || null,
            usuario_id:usuarioId,status:'aberta',
            forma_pagamento:dados.forma_pagamento || null,
            desconto:dados.desconto ?? 0,
            total:0
          }
        });
        let totalBruto = 0;

        for (const item of dados.itens) {
          if (!item.quantidade || item.quantidade <= 0) throw new AppError('Quantidade inválida em um dos itens.', 422);

          const produto = await tx.produtos.findUnique({
            where:{id:item.produto_id}
          });

          if (!produto) throw new AppError(`Produto ${item.produto_id} não encontrado.`, 404);

          const estoqueAtual = Number(produto.estoque_atual);
          if (estoqueAtual < item.quantidade) throw new AppError(`Estoque insuficiente para "${produto.nome}".`, 422);

          const precoUnitario = Number(produto.preco_venda);
          const subtotal = precoUnitario * item.quantidade;
          const novoEstoque = estoqueAtual - item.quantidade;
          totalBruto += subtotal;

          await tx.venda_itens.create({
            data:{
              venda_id:venda.id,
              produto_id:item.produto_id,
              quantidade:item.quantidade,
              preco_unitario:precoUnitario,
              subtotal
            }
          });
          await tx.produtos.update({
            where:{id:item.produto_id},
            data:{estoque_atual:novoEstoque}
          });
          await tx.movimentacoes_estoque.create({
            data:{
              produto_id:item.produto_id,
              usuario_id:usuarioId,
              tipo:'saida',
              quantidade:item.quantidade,
              estoque_resultante:novoEstoque,
              motivo:`Venda #${venda.id}`
            }
          });
        }

        const desconto = dados.desconto ?? 0;
        const total = Math.max(totalBruto - desconto, 0);

        if (dados.forma_pagamento === 'Crediário') {
          if (!dados.cliente_id) throw new AppError('Venda no crediário exige um cliente selecionado.', 422);

          const cliente = await tx.clientes.findUnique({
            where:{id:dados.cliente_id}
          });
          if (!cliente) throw new AppError('Cliente não encontrado.', 404);

          const pendente = await tx.contas_receber.aggregate({
            where:{
              cliente_id:dados.cliente_id,
              status:'pendente'
            },
            _sum:{valor:true}
          });
          const saldoPendente = Number(pendente._sum.valor ?? 0);
          const limite = Number(cliente.limite_credito);

          if (saldoPendente + total > limite) {
            throw new AppError(`Limite de crédito insuficiente. Disponível: ${(limite - saldoPendente).toFixed(2)}, necessário: ${total.toFixed(2)}.`, 422);
          }

          const vencimento = new Date();
          vencimento.setDate(vencimento.getDate() + 30);

          await tx.contas_receber.create({
            data:{
              cliente_id:dados.cliente_id,
              venda_id:venda.id,
              descricao:`Venda #${venda.id} (crediário)`,
              valor:total,
              vencimento
            }
          });
        } else {
          const sessao = await tx.caixa_sessoes.findFirst({
            where:{status:'aberto'},
            select:{id:true}
          });
          if (sessao && total > 0) await tx.caixa_movimentacoes.create({
            data:{
              caixa_sessao_id:sessao.id,
              tipo:'entrada',
              valor:total,
              descricao:`Venda #${venda.id} (${dados.forma_pagamento || 'pagamento'})`
            }
          });
        }

        const vendaFinal = await tx.vendas.update({
          where:{id:venda.id},
          data:{total,status:'finalizada'}
        });

        return {
          id:vendaFinal.id,
          cliente_id:vendaFinal.cliente_id,
          usuario_id:vendaFinal.usuario_id,
          status:vendaFinal.status as Venda['status'],
          forma_pagamento:vendaFinal.forma_pagamento,
          desconto:Number(vendaFinal.desconto),
          total:Number(vendaFinal.total),
          criado_em:vendaFinal.criado_em.toISOString(),
        };
      }, {isolationLevel:'Serializable'});
    } catch (err) {
      if ((err as {code?: string}).code === 'P2034' && tentativa < 3) continue;
      throw err;
    }
  }
  throw new AppError('Não foi possível concluir a venda após múltiplas tentativas.', 409);
}

/**
 * Cancela uma venda finalizada e devolve os itens ao estoque.
 */
export async function cancelarVenda(id:number,usuarioId:number,motivo:string):Promise<void>{
  if(!motivo||motivo.trim()==='') throw new AppError('Informe o motivo do cancelamento.',422);

  for(let tentativa=1;tentativa<=3;tentativa++){
    try{
      await prisma.$transaction(async(tx)=>{
        const venda=await tx.vendas.findUnique({
          where:{id},
          include:{venda_itens:true}
        });
        if(!venda) throw new AppError('Venda não encontrada.',404);
        if(venda.status!=='finalizada') throw new AppError('Só é possível cancelar vendas finalizadas.',422);

        for(const item of venda.venda_itens){
          const produto=await tx.produtos.findUnique({
            where:{id:item.produto_id}
          });
          if(!produto) throw new AppError(`Produto ${item.produto_id} não encontrado.`,404);

          const quantidade=Number(item.quantidade);
          const novoEstoque=Number(produto.estoque_atual)+quantidade;

          await tx.produtos.update({
            where:{id:item.produto_id},
            data:{estoque_atual:novoEstoque}
          });
          await tx.movimentacoes_estoque.create({
            data:{
              produto_id:item.produto_id,
              usuario_id:usuarioId,tipo:'entrada',
              quantidade,
              estoque_resultante:novoEstoque,
              motivo:`Cancelamento venda #${id}`
            }
          });
        }

        await tx.vendas.update({
          where:{id},
          data:{
            status:'cancelada',
            motivo_cancelamento:motivo.trim()
          }
        });

        const contaReceber=await tx.contas_receber.findFirst({
          where:{venda_id:id,status:'pendente'},
          select:{id:true}
        });

        if(contaReceber){
          await tx.contas_receber.delete({where:{id:contaReceber.id}});
        }else{
          const sessao=await tx.caixa_sessoes.findFirst({
            where:{status:'aberto'},
            select:{id:true}
          });
          if(sessao&&Number(venda.total)>0) await tx.caixa_movimentacoes.create({
            data:{
              caixa_sessao_id:sessao.id,
              tipo:'saida',
              valor:Number(venda.total),
              descricao:`Estorno venda #${id} (cancelamento)`
            }
          });
        }
      },{isolationLevel:'Serializable'});

      return;
    }catch(err){
      if((err as {code?:string}).code==='P2034'&&tentativa<3) continue;
      throw err;
    }
  }

  throw new AppError('Não foi possível cancelar a venda após múltiplas tentativas.',409);
}