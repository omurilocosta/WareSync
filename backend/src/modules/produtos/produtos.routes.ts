import { Router } from 'express';
import { index, show, store, update, destroy, movimentar, historico } from './produtos.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const produtosRoutes = Router();

produtosRoutes.use(requireAuth);

produtosRoutes.get('/', index);
produtosRoutes.get('/:id', show);
produtosRoutes.post('/', requireRole('administrador', 'gestor'), store);
produtosRoutes.put('/:id', requireRole('administrador', 'gestor'), update);
produtosRoutes.delete('/:id', requireRole('administrador', 'gestor'), destroy);
// Movimentação de estoque também é atribuição do Funcionário Operacional (RF15-RF17)
produtosRoutes.post('/:id/movimentacao', movimentar);
produtosRoutes.get('/:id/movimentacoes', historico);
