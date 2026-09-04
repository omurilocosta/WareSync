import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middlewares/error.middleware';
import {
  listarClientes,
  buscarClientePorId,
  buscarDetalhesCliente,
  criarCliente,
  atualizarCliente,
  inativarCliente,
} from './clientes.service';

export async function index(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const busca = typeof req.query.busca === 'string' ? req.query.busca : undefined;
    const clientes = await listarClientes(busca);
    res.json({ success: true, data: clientes });
  } catch (err) {
    next(err);
  }
}

export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID inválido.', 422);

    const cliente = await buscarClientePorId(id);
    res.json({ success: true, data: cliente });
  } catch (err) {
    next(err);
  }
}

export async function detalhes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID inválido.', 422);

    const dados = await buscarDetalhesCliente(id);
    res.json({ success: true, data: dados });
  } catch (err) {
    next(err);
  }
}

export async function store(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cliente = await criarCliente(req.body);
    res.status(201).json({ success: true, message: 'Cliente cadastrado com sucesso.', data: cliente });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID inválido.', 422);

    const cliente = await atualizarCliente(id, req.body);
    res.json({ success: true, message: 'Cliente atualizado com sucesso.', data: cliente });
  } catch (err) {
    next(err);
  }
}

export async function destroy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID inválido.', 422);

    await inativarCliente(id);
    res.json({ success: true, message: 'Cliente inativado com sucesso.' });
  } catch (err) {
    next(err);
  }
}
