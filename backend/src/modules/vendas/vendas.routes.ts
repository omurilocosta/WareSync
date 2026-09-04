import { Router } from 'express';
import { index, show, store, cancel } from './vendas.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

export const vendasRoutes = Router();

vendasRoutes.use(requireAuth);

vendasRoutes.get('/', index);
vendasRoutes.get('/:id', show);
vendasRoutes.post('/', store);
vendasRoutes.post('/:id/cancelar', cancel);
