import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middlewares/error.middleware';
import { listarVendas, buscarVendaPorId, criarVenda, cancelarVenda } from './vendas.service';

export async function index(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendas = await listarVendas({
      data: req.query.data as string,
      cliente: req.query.cliente as string,
      numero: req.query.numero as string,
      vendedor: req.query.vendedor as string,
      status: req.query.status as string,
    });
    res.json({ success: true, data: vendas });
  } catch (err) {
    next(err);
  }
}

export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID inválido.', 422);

    const venda = await buscarVendaPorId(id);
    res.json({ success: true, data: venda });
  } catch (err) {
    next(err);
  }
}

export async function store(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: quando o middleware de autenticação estiver ativo, usar req.session.usuarioId
    const usuarioId = req.session.usuarioId || 1;

    const venda = await criarVenda(usuarioId, req.body);
    res.status(201).json({ success: true, message: 'Venda finalizada com sucesso.', data: venda });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID inválido.', 422);

    const usuarioId = req.session.usuarioId || 1;
    const { motivo } = req.body;

    await cancelarVenda(id, usuarioId, motivo);
    res.json({ success: true, message: 'Venda cancelada e itens devolvidos ao estoque.' });
  } catch (err) {
    next(err);
  }
}
