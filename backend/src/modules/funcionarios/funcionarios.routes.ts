import bcrypt from 'bcrypt';
import { Router, Request, Response, NextFunction, } from 'express';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth, requireRole, } from '../../middlewares/auth.middleware';
import { somenteNumeros, validarDocumento, } from '../../utils/documento';

export const funcionariosRoutes = Router();

funcionariosRoutes.use(requireAuth);

const cargosPermitidos = [ 'administrador', 'gestor', 'vendedor', ];

funcionariosRoutes.get('/',requireRole('administrador', 'gestor'), async ( req: Request, res: Response, next: NextFunction ) => {
    try {
        const busca = typeof req.query.busca === 'string'
            ? req.query.busca.trim()
            : '';

        const funcionarios = await prisma.usuarios.findMany({
            where: {
                ativo: true,

                ...(busca
                    ? {
                        OR: [
                        {
                            nome: {
                            contains: busca,
                            mode: 'insensitive',
                            },
                        },
                        {
                            email: {
                            contains: busca,
                            mode: 'insensitive',
                            },
                        },
                        {
                            documento: {
                            contains: somenteNumeros(busca),
                            },
                        },
                        ],
                    }
                    : {}),
            },

            select: {
                id: true,
                nome: true,
                email: true,
                cargo: true,
                ativo: true,
                criado_em: true,
                documento: true,
                telefone: true,
                endereco: true,
                numero: true,
                bairro: true,
                cidade: true,
                estado: true,
                cep: true,
                observacoes: true,
            },

            orderBy: {
                nome: 'asc',
            },
        });

        res.json({
            success: true,
            data: funcionarios,
        });
    } catch (err) {
        next(err);
    }
});

funcionariosRoutes.post( '/', requireRole('administrador', 'gestor'), async ( req: Request, res: Response, next: NextFunction ) => {
    try {
        const {
            nome,
            email,
            senha,
            cargo,
            documento,
            telefone,
            endereco,
            numero,
            bairro,
            cidade,
            estado,
            cep,
            observacoes,
        } = req.body;

        if (!nome?.trim()) {
            throw new AppError( 'O nome do funcionário é obrigatório.', 422 );
        }

        if (!email?.trim()) {
            throw new AppError( 'O e-mail do funcionário é obrigatório.', 422 );
        }

        if (!senha || senha.length < 6) {
            throw new AppError( 'A senha precisa ter pelo menos 6 caracteres.', 422 );
        }

        if ( !cargo || !cargosPermitidos.includes(cargo) ) {
            throw new AppError( 'Cargo inválido.', 422 );
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

        const emailNormalizado =
            email.trim().toLowerCase();

        const emailExistente =
            await prisma.usuarios.findUnique({
            where: {
                email: emailNormalizado,
            },
            select: {
                id: true,
            },
            });

        if (emailExistente) {
            throw new AppError(
            'Já existe um funcionário com este e-mail.',
            409
            );
        }

        if (documentoNormalizado) {
            const documentoExistente =
            await prisma.usuarios.findFirst({
                where: {
                documento: documentoNormalizado,
                },
                select: {
                id: true,
                },
            });

            if (documentoExistente) {
            throw new AppError(
                'Já existe um funcionário com este CPF/CNPJ.',
                409
            );
            }
        }

        const senhaHash = await bcrypt.hash(
            senha,
            10
        );

        const funcionario =
            await prisma.usuarios.create({
            data: {
                nome: nome.trim(),
                email: emailNormalizado,
                senha_hash: senhaHash,
                cargo,
                documento: documentoNormalizado,
                telefone: telefoneNormalizado,
                endereco: endereco?.trim() || null,
                numero: numero?.trim() || null,
                bairro: bairro?.trim() || null,
                cidade: cidade?.trim() || null,
                estado:
                estado?.trim().toUpperCase() || null,
                cep: cep?.trim() || null,
                observacoes:
                observacoes?.trim() || null,
            },

            select: {
                id: true,
                nome: true,
                email: true,
                cargo: true,
                ativo: true,
                criado_em: true,
                documento: true,
                telefone: true,
                endereco: true,
                numero: true,
                bairro: true,
                cidade: true,
                estado: true,
                cep: true,
                observacoes: true,
            },
            });

        res.status(201).json({
            success: true,
            message: 'Funcionário cadastrado.',
            data: funcionario,
        });
    } catch (err) {
    next(err);
    }
});

funcionariosRoutes.put(
  '/:id',
  requireRole('administrador', 'gestor'),
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(
          'ID do funcionário inválido.',
          400
        );
      }

      const existente = await prisma.usuarios.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existente) {
        throw new AppError(
          'Funcionário não encontrado.',
          404
        );
      }

      const {
        nome,
        email,
        senha,
        cargo,
        documento,
        telefone,
        endereco,
        numero,
        bairro,
        cidade,
        estado,
        cep,
        observacoes,
      } = req.body;

      if (!nome?.trim()) {
        throw new AppError(
          'O nome do funcionário é obrigatório.',
          422
        );
      }

      if (!email?.trim()) {
        throw new AppError(
          'O e-mail do funcionário é obrigatório.',
          422
        );
      }

      if (
        !cargo ||
        !cargosPermitidos.includes(cargo)
      ) {
        throw new AppError(
          'Cargo inválido.',
          422
        );
      }

      if (
        senha &&
        senha.length < 6
      ) {
        throw new AppError(
          'A senha precisa ter pelo menos 6 caracteres.',
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

      const emailNormalizado =
        email.trim().toLowerCase();

      const emailExistente =
        await prisma.usuarios.findFirst({
          where: {
            email: emailNormalizado,
            NOT: {
              id,
            },
          },
          select: {
            id: true,
          },
        });

      if (emailExistente) {
        throw new AppError(
          'Já existe um funcionário com este e-mail.',
          409
        );
      }

      if (documentoNormalizado) {
        const documentoExistente =
          await prisma.usuarios.findFirst({
            where: {
              documento: documentoNormalizado,
              NOT: {
                id,
              },
            },
            select: {
              id: true,
            },
          });

        if (documentoExistente) {
          throw new AppError(
            'Já existe um funcionário com este CPF/CNPJ.',
            409
          );
        }
      }

      const senhaHash = senha
        ? await bcrypt.hash(senha, 10)
        : null;

      const funcionario =
        await prisma.usuarios.update({
          where: { id },

          data: {
            nome: nome.trim(),
            email: emailNormalizado,
            cargo,
            documento: documentoNormalizado,
            telefone: telefoneNormalizado,
            endereco: endereco?.trim() || null,
            numero: numero?.trim() || null,
            bairro: bairro?.trim() || null,
            cidade: cidade?.trim() || null,
            estado:
              estado?.trim().toUpperCase() || null,
            cep: cep?.trim() || null,
            observacoes:
              observacoes?.trim() || null,

            ...(senhaHash
              ? { senha_hash: senhaHash }
              : {}),
          },

          select: {
            id: true,
            nome: true,
            email: true,
            cargo: true,
            ativo: true,
            criado_em: true,
            documento: true,
            telefone: true,
            endereco: true,
            numero: true,
            bairro: true,
            cidade: true,
            estado: true,
            cep: true,
            observacoes: true,
          },
        });

      res.json({
        success: true,
        message: 'Funcionário atualizado.',
        data: funcionario,
      });
    } catch (err) {
      next(err);
    }
  }
);

funcionariosRoutes.delete(
  '/:id',
  requireRole('administrador', 'gestor'),
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(
          'ID do funcionário inválido.',
          400
        );
      }

      const existente = await prisma.usuarios.findUnique({
        where: { id },
        select: {
          id: true,
          ativo: true,
        },
      });

      if (!existente) {
        throw new AppError(
          'Funcionário não encontrado.',
          404
        );
      }

      if (req.session.usuarioId === id) {
        throw new AppError(
          'Você não pode inativar o seu próprio usuário.',
          409
        );
      }

      await prisma.usuarios.update({
        where: { id },
        data: {
          ativo: false,
        },
      });

      res.json({
        success: true,
        message: 'Funcionário inativado.',
      });
    } catch (err) {
      next(err);
    }
  }
);