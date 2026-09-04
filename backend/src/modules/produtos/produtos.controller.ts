import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middlewares/error.middleware';
import {
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  inativarProduto,
  registrarMovimentacao,
  listarMovimentacoes,
} from './produtos.service';

export async function index(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const busca = typeof req.query.busca === 'string' ? req.query.busca : undefined;
    const categoriaId = req.query.categoria_id ? Number(req.query.categoria_id) : undefined;
    const produtos = await listarProdutos(busca, categoriaId);
    res.json({ success: true, data: produtos });
  } catch (err) {
    next(err);
  }
}

export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID inválido.', 422);

    const produto = await buscarProdutoPorId(id);
    res.json({ success: true, data: produto });
  } catch (err) {
    next(err);
  }
}

export async function store(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const produto = await criarProduto(req.body);
    res.status(201).json({ success: true, message: 'Produto cadastrado com sucesso.', data: produto });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID inválido.', 422);

    const produto = await atualizarProduto(id, req.body);
    res.json({ success: true, message: 'Produto atualizado com sucesso.', data: produto });
  } catch (err) {
    next(err);
  }
}

export async function destroy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID inválido.', 422);

    await inativarProduto(id);
    res.json({ success: true, message: 'Produto inativado com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function movimentar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID inválido.', 422);

    // TODO: quando o middleware de autenticação estiver ativo, usar req.session.usuarioId
    const usuarioId = req.session.usuarioId || 1;

    const resultado = await registrarMovimentacao(id, usuarioId, req.body);
    res.json({
      success: true,
      message: 'Movimentação registrada com sucesso.',
      data: resultado,
    });
  } catch (err) {
    next(err);
  }
}

export async function historico(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID inválido.', 422);

    const movimentacoes = await listarMovimentacoes(id);
    res.json({ success: true, data: movimentacoes });
  } catch (err) {
    next(err);
  }
}
