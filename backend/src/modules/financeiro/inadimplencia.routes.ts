import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const inadimplenciaRoutes = Router();

inadimplenciaRoutes.use(requireAuth, requireRole('administrador', 'gestor'));

inadimplenciaRoutes.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const agora = new Date();

    const hojeUTC = new Date(
      Date.UTC(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
      )
    );

    const contas = await prisma.contas_receber.findMany({
      where: {status: 'pendente',vencimento: {lt: hojeUTC,},},
      include: {
        clientes: {
          select: {nome: true,telefone: true,},},
      },
      orderBy: {vencimento: 'asc',},
    });

    const titulos = contas.map(conta => {
      const vencimentoUTC = Date.UTC(
        conta.vencimento.getUTCFullYear(),
        conta.vencimento.getUTCMonth(),
        conta.vencimento.getUTCDate()
      );

      const hojeEmMs = Date.UTC(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
      );

      const diasAtraso = Math.floor(
        (hojeEmMs - vencimentoUTC) / 86400000
      );

      return {
        ...conta,
        valor: Number(conta.valor),
        vencimento: conta.vencimento.toISOString(),
        recebido_em: conta.recebido_em?.toISOString() ?? null,
        criado_em: conta.criado_em.toISOString(),
        cliente_nome: conta.clientes?.nome ?? null,
        cliente_telefone: conta.clientes?.telefone ?? null,
        dias_atraso: diasAtraso,
        clientes: undefined,
      };
    });

    const totalEmAtraso = titulos.reduce(
      (total, titulo) => total + titulo.valor,
      0
    );

    res.json({
      success: true,
      data: {
        titulos,
        total_em_atraso: totalEmAtraso,
        quantidade: titulos.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

inadimplenciaRoutes.post('/:id/receber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('ID inválido.', 422);
    }

    const resultado = await prisma.contas_receber.updateMany({
      where: { id, status: 'pendente'},
      data: {status: 'recebido',recebido_em: new Date(),},
    });

    if (resultado.count === 0) {
      throw new AppError('Título não encontrado ou já foi baixado.', 422);
    }

    const conta = await prisma.contas_receber.findUnique({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Recebimento registrado com sucesso.',
      data: conta ? {
        ...conta,
        valor: Number(conta.valor),
        vencimento: conta.vencimento.toISOString(),
        recebido_em: conta.recebido_em?.toISOString() ?? null,
        criado_em: conta.criado_em.toISOString(),
      } : null,
    });
  } catch (err) {
    next(err);
  }
});
