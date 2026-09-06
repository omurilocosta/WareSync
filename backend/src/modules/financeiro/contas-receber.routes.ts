import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const contasReceberRoutes = Router();

contasReceberRoutes.use(requireAuth, requireRole('administrador', 'gestor'));

contasReceberRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const contas = await prisma.contas_receber.findMany({
      where: status ? { status } : undefined,
      include: {
        clientes: {
          select: { nome: true },
        },
      },
      orderBy: { vencimento: 'asc' },
    });

    const dados = contas.map(conta => ({
      ...conta,
      valor: Number(conta.valor),
      vencimento: conta.vencimento.toISOString(),
      recebido_em: conta.recebido_em?.toISOString() ?? null,
      criado_em: conta.criado_em.toISOString(),
      cliente_nome: conta.clientes?.nome ?? null,
      clientes: undefined,
    }));

    res.json({ success: true, data: dados });
  } catch (err) {
    next(err);
  }
});

contasReceberRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cliente_id, descricao, valor, vencimento, categoria, forma_pagamento } = req.body;

    if (!descricao || !valor || !vencimento) {
      throw new AppError('Descrição, valor e vencimento são obrigatórios.', 422);
    }

    const valorNumerico = Number(valor);
    if (valorNumerico <= 0) throw new AppError('O valor deve ser maior que zero.', 422);

    const conta = await prisma.contas_receber.create({
      data: {
        cliente_id: cliente_id ? Number(cliente_id) : null,
        descricao: descricao.trim(),
        valor: valorNumerico,
        vencimento: new Date(`${vencimento}T00:00:00`),
        categoria: categoria || null,
        forma_pagamento: forma_pagamento || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Recebimento cadastrado.',
      data: {
        ...conta,
        valor: Number(conta.valor),
        vencimento: conta.vencimento.toISOString(),
        recebido_em: conta.recebido_em?.toISOString() ?? null,
        criado_em: conta.criado_em.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

contasReceberRoutes.post('/:id/baixar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new AppError('ID inválido.', 422);

    const resultado = await prisma.contas_receber.updateMany({
      where: { id, status: 'pendente' },
      data: { status: 'recebido', recebido_em: new Date() },
    });

    if (resultado.count === 0) {
      throw new AppError('Recebimento não encontrado ou já foi baixado.', 422);
    }

    const conta = await prisma.contas_receber.findUnique({ where: { id } });

    res.json({
      success: true,
      message: 'Recebimento baixado com sucesso.',
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

contasReceberRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new AppError('ID inválido.', 422);

    await prisma.contas_receber.deleteMany({
      where: { id, status: 'pendente' },
    });

    res.json({ success: true, message: 'Recebimento removido.' });
  } catch (err) {
    next(err);
  }
});
