import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';

export const caixaRoutes = Router();

caixaRoutes.use(requireAuth);

async function buscarSessaoAberta() {
  const { rows } = await pool.query(`SELECT * FROM caixa_sessoes WHERE status = 'aberto' LIMIT 1`);
  return rows[0] || null;
}

function calcularSaldo(valorAbertura: number, movimentacoes: any[]): number {
  return movimentacoes.reduce((acc: number, m: any) => {
    const valor = Number(m.valor);
    return m.tipo === 'saida' || m.tipo === 'sangria' ? acc - valor : acc + valor;
  }, valorAbertura);
}

// GET /api/caixa/atual — retorna a sessão aberta (com movimentações e saldo)
caixaRoutes.get('/atual', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sessao = await buscarSessaoAberta();

    if (!sessao) {
      res.json({ success: true, data: null });
      return;
    }

    const { rows: movimentacoes } = await pool.query(
      'SELECT * FROM caixa_movimentacoes WHERE caixa_sessao_id = $1 ORDER BY criado_em DESC',
      [sessao.id]
    );

    const saldo = calcularSaldo(Number(sessao.valor_abertura), movimentacoes);

    res.json({ success: true, data: { ...sessao, movimentacoes, saldo } });
  } catch (err) {
    next(err);
  }
});

// POST /api/caixa/abrir — { valor_abertura }
caixaRoutes.post('/abrir', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessaoExistente = await buscarSessaoAberta();
    if (sessaoExistente) {
      throw new AppError('Já existe um caixa aberto.', 422);
    }

    const usuarioId = req.session.usuarioId || 1;
    const valorAbertura = Number(req.body.valor_abertura) || 0;

    const { rows } = await pool.query(
      `INSERT INTO caixa_sessoes (usuario_id, valor_abertura) VALUES ($1, $2) RETURNING *`,
      [usuarioId, valorAbertura]
    );

    res.status(201).json({ success: true, message: 'Caixa aberto com sucesso.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/caixa/movimentacao — { tipo: 'sangria'|'suprimento', valor, descricao }
caixaRoutes.post('/movimentacao', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessao = await buscarSessaoAberta();
    if (!sessao) throw new AppError('Não há caixa aberto no momento.', 422);

    const { tipo, valor, descricao } = req.body;

    if (!['sangria', 'suprimento'].includes(tipo)) {
      throw new AppError('Tipo de movimentação inválido.', 422);
    }
    if (!valor || valor <= 0) {
      throw new AppError('Informe um valor maior que zero.', 422);
    }

    const { rows } = await pool.query(
      `INSERT INTO caixa_movimentacoes (caixa_sessao_id, tipo, valor, descricao)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [sessao.id, tipo, valor, descricao || null]
    );

    res.status(201).json({ success: true, message: 'Movimentação registrada.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/caixa/fechar
caixaRoutes.post('/fechar', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sessao = await buscarSessaoAberta();
    if (!sessao) throw new AppError('Não há caixa aberto no momento.', 422);

    const { rows: movimentacoes } = await pool.query(
      'SELECT * FROM caixa_movimentacoes WHERE caixa_sessao_id = $1',
      [sessao.id]
    );

    const saldo = calcularSaldo(Number(sessao.valor_abertura), movimentacoes);

    const { rows } = await pool.query(
      `UPDATE caixa_sessoes SET status = 'fechado', valor_fechamento = $1, fechado_em = NOW()
       WHERE id = $2 RETURNING *`,
      [saldo, sessao.id]
    );

    res.json({ success: true, message: 'Caixa fechado com sucesso.', data: rows[0] });
  } catch (err) {
    next(err);
  }
});
