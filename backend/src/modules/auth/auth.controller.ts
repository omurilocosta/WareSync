import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middlewares/error.middleware';
import { autenticar, solicitarRedefinicaoSenha, redefinirSenha } from './auth.service';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      throw new AppError('Informe e-mail e senha.', 422);
    }

    const usuario = await autenticar(email, senha);

    req.session.usuarioId = usuario.id;
    req.session.cargo = usuario.cargo;
    req.session.nome = usuario.nome;

    res.json({ success: true, message: 'Login realizado com sucesso.', user: usuario });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Informe um e-mail.', 422);
    }

    await solicitarRedefinicaoSenha(email);

    res.json({
      success: true,
      message: 'Se o e-mail existir na nossa base, você vai receber um link em instantes.',
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, senha } = req.body;

    if (!token) {
      throw new AppError('Link de redefinição inválido.', 422);
    }

    await redefinirSenha(token, senha);

    res.json({ success: true, message: 'Senha redefinida com sucesso. Você já pode fazer login.' });
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response): void {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Sessão encerrada.' });
  });
}

export function sessaoAtual(req: Request, res: Response): void {
  if (!req.session.usuarioId) {
    res.json({ success: true, data: null });
    return;
  }
  res.json({
    success: true,
    data: { id: req.session.usuarioId, cargo: req.session.cargo, nome: req.session.nome },
  });
}
