import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export type Cargo = 'administrador' | 'gestor' | 'operacional';

/**
 * Garante que existe uma sessão de usuário autenticado.
 * RN01: Usuários deverão estar autenticados para acessar funcionalidades protegidas.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session.usuarioId) {
    throw new AppError('É necessário estar autenticado para acessar este recurso.', 401);
  }
  next();
}

/**
 * Restringe o acesso a uma lista de cargos autorizados.
 * RN02: Cada usuário somente poderá executar operações autorizadas.
 * RN29: Usuários sem autorização não poderão acessar funcionalidades administrativas.
 *
 * Uso: router.post('/', requireAuth, requireRole('administrador', 'gestor'), handler)
 */
export function requireRole(...cargosPermitidos: Cargo[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const cargo = req.session.cargo as Cargo | undefined;

    if (!cargo || !cargosPermitidos.includes(cargo)) {
      throw new AppError('Você não tem permissão para executar esta ação.', 403);
    }
    next();
  };
}
