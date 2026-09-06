import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const contasPagarRoutes = Router();

contasPagarRoutes.use(requireAuth, requireRole('administrador', 'gestor'));

contasPagarRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const contas = await prisma.contas_pagar.findMany({
      where: status ? { status } : undefined,
      orderBy: { vencimento: 'asc' },
    });

    const dados = contas.map(conta => ({
      ...conta,
      valor: Number(conta.valor),
      vencimento: conta.vencimento.toISOString(),
      pago_em: conta.pago_em?.toISOString() ?? null,
      criado_em: conta.criado_em.toISOString(),
    }));

    res.json({ success: true, data: dados });
  } catch (err) {
    next(err);
  }
});

contasPagarRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { descricao, fornecedor, valor, vencimento, categoria, forma_pagamento } = req.body;

    if (!descricao || !valor || !vencimento) {
      throw new AppError('Descrição, valor e vencimento são obrigatórios.', 422);
    }

    const valorNumerico = Number(valor);

    if (valorNumerico <= 0) {
      throw new AppError('O valor deve ser maior que zero.', 422);
    }

    const conta = await prisma.contas_pagar.create({
      data: {
        descricao: descricao.trim(),
        fornecedor: fornecedor?.trim() || null,
        valor: valorNumerico,
        vencimento: new Date(`${vencimento}T00:00:00`),
        categoria: categoria?.trim() || null,
        forma_pagamento: forma_pagamento || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Conta cadastrada.',
      data: {
        ...conta,
        valor: Number(conta.valor),
        vencimento: conta.vencimento.toISOString(),
        pago_em: conta.pago_em?.toISOString() ?? null,
        criado_em: conta.criado_em.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

contasPagarRoutes.post('/:id/baixar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('ID inválido.', 422);
    }

    const resultado = await prisma.contas_pagar.updateMany({
      where: { id, status: 'aberta' },
      data: { status: 'paga', pago_em: new Date() },
    });

    if (resultado.count === 0) {
      throw new AppError('Conta não encontrada ou já está paga.', 422);
    }

    const conta = await prisma.contas_pagar.findUnique({ where: { id } });

    res.json({
      success: true,
      message: 'Conta baixada com sucesso.',
      data: conta ? {
        ...conta,
        valor: Number(conta.valor),
        vencimento: conta.vencimento.toISOString(),
        pago_em: conta.pago_em?.toISOString() ?? null,
        criado_em: conta.criado_em.toISOString(),
      } : null,
    });
  } catch (err) {
    next(err);
  }
});

contasPagarRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('ID inválido.', 422);
    }

    await prisma.contas_pagar.deleteMany({
      where: { id, status: 'aberta' },
    });

    res.json({ success: true, message: 'Conta removida.' });
  } catch (err) {
    next(err);
  }
});
