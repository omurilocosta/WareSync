import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma'
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';

export const categoriasRoutes = Router();

categoriasRoutes.use(requireAuth);

categoriasRoutes.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categorias = await prisma.categorias.findMany({
      orderBy: {
        nome: 'asc'
      }
    })
    res.json({
      success: true,
      data: categorias
    })
  } catch (err) {
    next(err);
  }
});

categoriasRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nome = (req.body.nome || '').trim();
    if (!nome) throw new AppError('O nome da categoria é obrigatório.', 422);

    const categoria = await prisma.categorias.upsert({
      where: {nome},
      update: {nome},
      create: {nome}
    });
    res.status(201).json({ success: true, data: categoria });
  } catch (err) {
    next(err);
  }
});
