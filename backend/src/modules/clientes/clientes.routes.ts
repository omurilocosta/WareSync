import { Router } from 'express';
import { index, show, detalhes, store, update, destroy } from './clientes.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

export const clientesRoutes = Router();

clientesRoutes.use(requireAuth);

clientesRoutes.get('/', index);
clientesRoutes.get('/:id', show);
clientesRoutes.get('/:id/detalhes', detalhes);
clientesRoutes.post('/', requireRole('administrador', 'gestor'), store);
clientesRoutes.put('/:id', requireRole('administrador', 'gestor'), update);
clientesRoutes.delete('/:id', requireRole('administrador', 'gestor'), destroy);
