import { Router, Request, Response, NextFunction } from 'express';
import {prisma} from '../../config/prisma'
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { somenteNumeros, validarDocumento} from '../../utils/documento';

export const fornecedoresRoutes = Router();

fornecedoresRoutes.use(requireAuth);

fornecedoresRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const busca = typeof req.query.busca === 'string' ? req.query.busca.trim() : '';

    const fornecedores = await prisma.fornecedores.findMany({
      where: {
        ativo: true,
        ...(busca
          ? {
            nome: {
              contains: busca,
              mode: 'insensitive'
            },
          }
          : {}),
      },
      orderBy: {nome:'asc'}
    })

    res.json({ success: true, data: fornecedores })
  } catch (err) {
    next(err);
  }
});

fornecedoresRoutes.post('/', requireRole('administrador', 'gestor'),async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      nome,
      documento,
      telefone,
      email,
      endereco,
      numero,
      bairro,
      cidade,
      estado,
      cep,
      observacoes,
    } = req.body;

    if (!nome || !nome.trim()) {
      throw new AppError(
        'O nome do fornecedor é obrigatório.',
        422
      );
    }

    const documentoNormalizado = documento
      ? somenteNumeros(documento)
      : null;

    if (
      documentoNormalizado &&
      !validarDocumento(documentoNormalizado)
    ) {
      throw new AppError(
        'Informe um CPF ou CNPJ válido.',
        400
      );
    }

    const telefoneNormalizado = telefone
      ? somenteNumeros(telefone)
      : null;

    if (
      telefoneNormalizado &&
      telefoneNormalizado.length !== 10 &&
      telefoneNormalizado.length !== 11
    ) {
      throw new AppError(
        'Informe um telefone válido com DDD.',
        400
      );
    }

    if (
      endereco?.trim() &&
      !numero?.trim()
    ) {
      throw new AppError(
        'Informe o número do endereço.',
        400
      );
    }

    const cepNumeros = cep
      ? somenteNumeros(cep)
      : null;

    if (
      cepNumeros &&
      cepNumeros.length !== 8
    ) {
      throw new AppError(
        'Informe um CEP válido.',
        400
      );
    }

    const fornecedor =
      await prisma.fornecedores.create({
        data: {
          nome: nome.trim(),
          documento: documentoNormalizado,
          telefone: telefoneNormalizado,
          email: email?.trim() || null,
          endereco: endereco?.trim() || null,
          numero: numero?.trim() || null,
          bairro: bairro?.trim() || null,
          cidade: cidade?.trim() || null,
          estado: estado?.trim() || null,
          cep: cep?.trim() || null,
          observacoes:
            observacoes?.trim() || null,
        },
      });

    res.status(201).json({
      success: true,
      message: 'Fornecedor cadastrado.',
      data: fornecedor,
    });
  } catch (err) {
    next(err);
  }
});

fornecedoresRoutes.put( '/:id', requireRole('administrador', 'gestor'), async ( req: Request, res: Response, next: NextFunction ) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(
        'ID do fornecedor inválido.',
        400
      );
    }

    const {
      nome,
      documento,
      telefone,
      email,
      endereco,
      numero,
      bairro,
      cidade,
      estado,
      cep,
      observacoes,
    } = req.body;

    if (!nome || !nome.trim()) {
      throw new AppError(
        'O nome do fornecedor é obrigatório.',
        422
      );
    }

    const documentoNormalizado = documento
      ? somenteNumeros(documento)
      : null;

    if (
      documentoNormalizado &&
      !validarDocumento(documentoNormalizado)
    ) {
      throw new AppError(
        'Informe um CPF ou CNPJ válido.',
        400
      );
    }

    const telefoneNormalizado = telefone
      ? somenteNumeros(telefone)
      : null;

    if (
      telefoneNormalizado &&
      telefoneNormalizado.length !== 10 &&
      telefoneNormalizado.length !== 11
    ) {
      throw new AppError(
        'Informe um telefone válido com DDD.',
        400
      );
    }

    if (
      endereco?.trim() &&
      !numero?.trim()
    ) {
      throw new AppError(
        'Informe o número do endereço.',
        400
      );
    }

    const cepNumeros = cep
      ? somenteNumeros(cep)
      : null;

    if (
      cepNumeros &&
      cepNumeros.length !== 8
    ) {
      throw new AppError(
        'Informe um CEP válido.',
        400
      );
    }

    const existente =
      await prisma.fornecedores.findUnique({
        where: { id },
        select: { id: true },
      });

    if (!existente) {
      throw new AppError(
        'Fornecedor não encontrado.',
        404
      );
    }

    const fornecedor =
      await prisma.fornecedores.update({
        where: { id },

        data: {
          nome: nome.trim(),
          documento: documentoNormalizado,
          telefone: telefoneNormalizado,
          email: email?.trim() || null,
          endereco: endereco?.trim() || null,
          numero: numero?.trim() || null,
          bairro: bairro?.trim() || null,
          cidade: cidade?.trim() || null,
          estado: estado?.trim() || null,
          cep: cep?.trim() || null,
          observacoes:
            observacoes?.trim() || null,
        },
      });

    res.json({
      success: true,
      message: 'Fornecedor atualizado.',
      data: fornecedor,
    });
  } catch (err) {
    next(err);
  }
});

fornecedoresRoutes.delete(
  '/:id',
  requireRole('administrador', 'gestor'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(
          'ID do fornecedor inválido.',
          400
        );
      }

      const existente = await prisma.fornecedores.findUnique({
        where: {id},
        select: { id: true},
      });

      if (!existente) { throw new AppError('Fornecedor não encontrado.',404); }

      await prisma.fornecedores.update({
        where: {id},
        data: {ativo: false},
      });

      res.json({ success: true, message: 'Fornecedor inativado.',});
    } catch (err) {
      next(err);
    }
  }
);

// Vincula/desvincula fornecedores de um produto
fornecedoresRoutes.put('/produto/:produtoId',requireRole('administrador', 'gestor'),async (req: Request,res: Response,next: NextFunction) => {
  try {
    const produtoId = Number(req.params.produtoId);
    const fornecedorIds = Array.isArray(req.body.fornecedor_ids)
      ? req.body.fornecedor_ids.map(Number)
      : [];

    if (!Number.isInteger(produtoId) || produtoId <= 0) { throw new AppError('ID do produto inválido.',400);}

    const produto = await prisma.produtos.findUnique({
      where: {id: produtoId},
      select: {id: true},
    });

    if (!produto) {throw new AppError('Produto não encontrado.',404);}

    await prisma.$transaction(async (tx) => {
      await tx.produto_fornecedores.deleteMany({
        where: { produto_id: produtoId },
      });

      if (fornecedorIds.length > 0) {
        await tx.produto_fornecedores.createMany({
          data: fornecedorIds.map((fornecedorId: number) => ({
            produto_id: produtoId,
            fornecedor_id: fornecedorId,
          })),
          skipDuplicates: true,
        });
      }
    });

    res.json({success: true, message:'Fornecedores do produto atualizados.',});
    } catch (err) {
      next(err);
    }
  }
);

fornecedoresRoutes.get('/produto/:produtoId', async (req: Request,res: Response,next: NextFunction) => {
  try {
    const produtoId = Number(req.params.produtoId);

    const vinculos = await prisma.produto_fornecedores.findMany({
      where: { produto_id: produtoId,},
      include: { fornecedores: true,},
    });

    const fornecedores = vinculos.map((vinculo) => vinculo.fornecedores);

    res.json({ success: true, data: fornecedores,});
  } catch (err) {
    next(err);
  }
});