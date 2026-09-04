import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  cargo: string;
}

export async function autenticar(email: string, senha: string): Promise<UsuarioAutenticado> {
  const { rows } = await pool.query(
    'SELECT id, nome, email, senha_hash, cargo, ativo FROM usuarios WHERE email = $1 LIMIT 1',
    [email]
  );
  const usuario = rows[0];

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
    throw new AppError('E-mail ou senha inválidos.', 401);
  }

  if (!usuario.ativo) {
    throw new AppError('Este usuário está inativo.', 403);
  }

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cargo: usuario.cargo,
  };
}

export async function solicitarRedefinicaoSenha(email: string): Promise<void> {
  const { rows } = await pool.query('SELECT id FROM usuarios WHERE email = $1 LIMIT 1', [email]);
  const usuario = rows[0];

  // Não revela se o e-mail existe — resposta sempre genérica no controller.
  if (!usuario) return;

  const token = crypto.randomBytes(32).toString('hex');
  const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await pool.query(
    'INSERT INTO password_resets (usuario_id, token, expira_em) VALUES ($1, $2, $3)',
    [usuario.id, token, expiraEm]
  );

  // Em produção: disparar e-mail real com o link de redefinição.
  console.log(`[Waresync] Link de redefinição para ${email}: /reset-password.html?token=${token}`);
}

/**
 * Conclui a redefinição: valida o token (existe, não usado, não expirado)
 * e grava a nova senha já hasheada.
 */
export async function redefinirSenha(token: string, novaSenha: string): Promise<void> {
  if (!novaSenha || novaSenha.length < 6) {
    throw new AppError('A nova senha precisa ter pelo menos 6 caracteres.', 422);
  }

  const { rows } = await pool.query(
    `SELECT * FROM password_resets WHERE token = $1 AND usado = FALSE AND expira_em > NOW()`,
    [token]
  );
  const reset = rows[0];

  if (!reset) {
    throw new AppError('Link inválido ou expirado. Solicite uma nova recuperação de senha.', 422);
  }

  const hash = await bcrypt.hash(novaSenha, 10);

  await pool.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [hash, reset.usuario_id]);
  await pool.query('UPDATE password_resets SET usado = TRUE WHERE id = $1', [reset.id]);
}
