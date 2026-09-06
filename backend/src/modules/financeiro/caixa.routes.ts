import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';

export const caixaRoutes = Router();

caixaRoutes.use(requireAuth);

async function buscarSessaoAberta(){
  return prisma.caixa_sessoes.findFirst({
    where:{status:'aberto'},
    orderBy:{aberto_em:'desc'}
  });
}

function calcularSaldo(valorAbertura:number,movimentacoes:any[]):number{
  return movimentacoes.reduce((acc,m) => {
    const valor = Number(m.valor);
    return m.tipo === 'saida' || m.tipo === 'sangria'
      ? acc - valor
      : acc + valor;
  },valorAbertura);
}

caixaRoutes.get('/atual', async(_req:Request,res:Response,next:NextFunction) => {
  try{
    const sessao = await buscarSessaoAberta();
    
    if(!sessao){
      res.json({
        success:true,data:null
      });
      return;
    }
    
    const movimentacoes = await prisma.caixa_movimentacoes.findMany({
      where:{caixa_sessao_id:sessao.id},
      orderBy:{criado_em:'desc'}
    });
    const saldo = calcularSaldo(Number(sessao.valor_abertura),movimentacoes);
    res.json({
      success:true,
      data: {
        ...sessao,
        valor_abertura: Number(sessao.valor_abertura),
        valor_fechamento: sessao.valor_fechamento === null
          ? null
          : Number(sessao.valor_fechamento),
        movimentacoes: movimentacoes.map(m=>({
          ...m,
          valor: Number(m.valor)
        })),saldo
      }
    });
  } catch(err){
    next(err);
  }
});

caixaRoutes.post("/abrir", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessaoExistente = await buscarSessaoAberta();

      if (sessaoExistente) throw new AppError("Já existe um caixa aberto.", 422);

      const usuarioId = req.session.usuarioId || 1;
      const valorAbertura = Number(req.body.valor_abertura) || 0;
      const sessao = await prisma.caixa_sessoes.create({
        data: { 
          usuario_id: usuarioId, 
          valor_abertura: valorAbertura },
      });
      res
        .status(201).json({
          success: true,
          message: "Caixa aberto com sucesso.",
          data: {
            ...sessao,
            valor_abertura: Number(sessao.valor_abertura),
            valor_fechamento:
              sessao.valor_fechamento === null
                ? null
                : Number(sessao.valor_fechamento),
          },
        });
    } catch (err) {
      next(err);
    }
  }
);

caixaRoutes.post("/movimentacao",async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessao = await buscarSessaoAberta();

    if (!sessao) throw new AppError("Não há caixa aberto no momento.", 422);

    const { tipo, valor, descricao } = req.body;

    if (!["sangria", "suprimento"].includes(tipo)) throw new AppError("Tipo de movimentação inválido.", 422);
    const valorNumerico = Number(valor);

    if (!valorNumerico || valorNumerico <= 0) throw new AppError("Informe um valor maior que zero.", 422);
    const movimentacao = await prisma.caixa_movimentacoes.create({
      data: {
        caixa_sessao_id: sessao.id,
        tipo,
        valor: valorNumerico,
        descricao: descricao || null,
      },
    });
    res.status(201).json({
      success: true,
      message: "Movimentação registrada.",
      data: { ...movimentacao, valor: Number(movimentacao.valor) },
    });
  } catch (err) {
    next(err);
  }
});
// POST /api/caixa/fechar
caixaRoutes.post("/fechar", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const sessao = await buscarSessaoAberta();
      if (!sessao) throw new AppError("Não há caixa aberto no momento.", 422);
      const movimentacoes = await prisma.caixa_movimentacoes.findMany({
        where: { caixa_sessao_id: sessao.id },
      });
      const saldo = calcularSaldo(Number(sessao.valor_abertura), movimentacoes);
      const sessaoFechada = await prisma.caixa_sessoes.update({
        where: { id: sessao.id },
        data: {
          status: "fechado",
          valor_fechamento: saldo,
          fechado_em: new Date(),
        },
      });
      res.json({
        success: true,
        message: "Caixa fechado com sucesso.",
        data: {
          ...sessaoFechada,
          valor_abertura: Number(sessaoFechada.valor_abertura),
          valor_fechamento:
            sessaoFechada.valor_fechamento === null
              ? null
              : Number(sessaoFechada.valor_fechamento),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);