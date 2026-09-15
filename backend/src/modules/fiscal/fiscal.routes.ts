import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { buscarVendaPorId } from '../vendas/vendas.service';

export const fiscalRoutes = Router();

fiscalRoutes.use(requireAuth);

/**
 * ATENÇÃO — SIMULAÇÃO
 * Emitir uma NF-e/NFC-e de verdade exige: certificado digital A1/A3 da
 * empresa, homologação junto à SEFAZ do estado, e normalmente um provedor
 * intermediário (Focus NFe, PlugNotas, eNotas, etc.) que fala o protocolo
 * SOAP/REST oficial. Nada disso está implementado aqui — esta função só
 * gera um número sequencial e marca como "autorizado" para manter o fluxo
 * de tela funcionando. Trocar por uma chamada real ao provedor escolhido
 * antes de usar em produção.
 */

async function emitirDocumentoDemonstrativo( tipo: 'NFE' | 'NFCE', vendaId: number, usuarioId: number) {
  const { rows } = await pool.query(
      `
      INSERT INTO documentos_fiscais (
          venda_id,
          tipo,
          status,
          chave_acesso,
          usuario_id,
          sem_validade_fiscal
      )
      VALUES (
          $1,
          $2,
          'demonstrativo',
          NULL,
          $3,
          TRUE
      )
      RETURNING *
      `,
      [vendaId, tipo, usuarioId]
  );

  const documento = rows[0];

  const numeroDemonstrativo =
      `DEM-${String(documento.id).padStart(6, '0')}`;

  const { rows: documentoAtualizado } =
      await pool.query(
          `
          UPDATE documentos_fiscais
          SET numero = $1
          WHERE id = $2
          RETURNING *
          `,
          [
              numeroDemonstrativo,
              documento.id,
          ]
      );

  return documentoAtualizado[0];
}

fiscalRoutes.post('/emitir', async (req: Request,res: Response, next: NextFunction) => {
  try {
      const { venda_id, tipo } = req.body;

      const usuarioId = req.session.usuarioId;

      if (!usuarioId) {
          throw new AppError(
              'Usuário não autenticado.',
              401
          );
      }

      if (
          !venda_id ||
          !['NFE', 'NFCE'].includes(tipo)
      ) {
          throw new AppError(
              'Informe a venda e o tipo de documento (NFE ou NFCE).',
              422
          );
      }

      const vendaId = Number(venda_id);

      if (
          !Number.isInteger(vendaId) ||
          vendaId <= 0
      ) {
          throw new AppError(
              'Venda inválida.',
              422
          );
      }

      const { rows: vendaRows } =
          await pool.query(
              `
              SELECT *
              FROM vendas
              WHERE id = $1
              `,
              [vendaId]
          );

      const venda = vendaRows[0];

      if (!venda) {
          throw new AppError(
              'Venda não encontrada.',
              404
          );
      }

      if (venda.status !== 'finalizada') {
          throw new AppError(
              'Só é possível gerar um documento demonstrativo para vendas finalizadas.',
              422
          );
      }

      const existente = await pool.query(
          `
          SELECT id
          FROM documentos_fiscais
          WHERE venda_id = $1
            AND tipo = $2
            AND status = 'demonstrativo'
          `,
          [vendaId, tipo]
      );

      if (existente.rows[0]) {
          throw new AppError(
              'Já existe um documento demonstrativo deste tipo para esta venda.',
              422
          );
      }

      const documento =
          await emitirDocumentoDemonstrativo(
              tipo,
              vendaId,
              usuarioId
          );

      return res.status(201).json({
          success: true,
          message:
              `${tipo === 'NFE' ? 'NF-e' : 'NFC-e'} demonstrativa gerada com sucesso.`,
          aviso:
              'DOCUMENTO DEMONSTRATIVO — SEM VALIDADE FISCAL — NÃO AUTORIZADO PELA SEFAZ',
          data: documento,
      });
  } catch (err) {
      next(err);
  }
});

fiscalRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { periodo_inicio, periodo_fim, cliente, numero, tipo, status } = req.query;
    const condicoes: string[] = [];
    const params: unknown[] = [];

    if (periodo_inicio) {
      params.push(periodo_inicio);
      condicoes.push(`df.emitido_em::date >= $${params.length}`);
    }
    if (periodo_fim) {
      params.push(periodo_fim);
      condicoes.push(`df.emitido_em::date <= $${params.length}`);
    }
    if (cliente) {
      params.push(`%${cliente}%`);
      condicoes.push(`c.nome ILIKE $${params.length}`);
    }
    if (numero) {
      params.push(`%${numero}%`);
      condicoes.push(`df.numero ILIKE $${params.length}`);
    }
    if (tipo) {
      params.push(tipo);
      condicoes.push(`df.tipo = $${params.length}`);
    }
    if (status) {
      params.push(status);
      condicoes.push(`df.status = $${params.length}`);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT df.*, v.total AS venda_total, c.nome AS cliente_nome
       FROM documentos_fiscais df
       JOIN vendas v ON v.id = df.venda_id
       LEFT JOIN clientes c ON c.id = v.cliente_id
       ${where}
       ORDER BY df.emitido_em DESC
       LIMIT 100`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

fiscalRoutes.get('/vendas/:vendaId/preparar',async (req: Request,res: Response,next: NextFunction) => {
  try {
      const vendaId = Number(req.params.vendaId);

      if (
          !Number.isInteger(vendaId) ||
          vendaId <= 0
      ) {
          throw new AppError(
              'Venda inválida.',
              422
          );
      }

      const venda =
          await buscarVendaPorId(vendaId);

      if (!venda) {
          throw new AppError(
              'Venda não encontrada.',
              404
          );
      }

      if (venda.status !== 'finalizada') {
          throw new AppError(
              'Somente vendas finalizadas podem gerar documento demonstrativo.',
              422
          );
      }

      let cliente = null;

      if (venda.cliente_id) {
          const { rows } = await pool.query(
              `
              SELECT
                  id,
                  nome,
                  documento,
                  email,
                  telefone,
                  cep,
                  endereco,
                  numero,
                  bairro,
                  cidade,
                  estado
              FROM clientes
              WHERE id = $1
              `,
              [venda.cliente_id]
          );

          cliente = rows[0] || null;
      }

      return res.json({
          success: true,

          aviso:
              'DOCUMENTO DEMONSTRATIVO — SEM VALIDADE FISCAL — NÃO AUTORIZADO PELA SEFAZ',

          data: {
              venda,

              cliente,

              documento: {
                  natureza_operacao:
                      'Venda de mercadoria',

                  finalidade:
                      'normal',

                  consumidor_final:
                      true,

                  presenca_comprador:
                      'presencial',

                  modalidade_frete:
                      'sem_frete',

                  informacoes_adicionais:
                      '',

                  sem_validade_fiscal:
                      true,
              },
          },
      });
  } catch (err) {
      next(err);
  }
});

fiscalRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      `SELECT df.*, v.total AS venda_total, c.nome AS cliente_nome
       FROM documentos_fiscais df
       JOIN vendas v ON v.id = df.venda_id
       LEFT JOIN clientes c ON c.id = v.cliente_id
       WHERE df.id = $1`,
      [id]
    );
    if (!rows[0]) throw new AppError('Documento fiscal não encontrado.', 404);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

fiscalRoutes.post('/:id/cancelar',async (req: Request,res: Response,next: NextFunction) => {
  try {
      const id = Number(req.params.id);
      const { motivo } = req.body;

      if (
          !Number.isInteger(id) ||
          id <= 0
      ) {
          throw new AppError(
              'Documento inválido.',
              422
          );
      }

      if (
          !motivo ||
          typeof motivo !== 'string' ||
          motivo.trim() === ''
      ) {
          throw new AppError(
              'Informe o motivo do cancelamento.',
              422
          );
      }

      const { rows } = await pool.query(
          `
          SELECT *
          FROM documentos_fiscais
          WHERE id = $1
          `,
          [id]
      );

      const documento = rows[0];

      if (!documento) {
          throw new AppError(
              'Documento demonstrativo não encontrado.',
              404
          );
      }

      if (documento.status === 'cancelado') {
          throw new AppError(
              'Este documento demonstrativo já está cancelado.',
              422
          );
      }

      if (documento.status !== 'demonstrativo') {
          throw new AppError(
              'Somente documentos demonstrativos podem ser cancelados por este fluxo.',
              422
          );
      }

      const { rows: documentoCancelado } =
          await pool.query(
              `
              UPDATE documentos_fiscais
              SET
                  status = 'cancelado',
                  motivo_cancelamento = $1,
                  cancelado_em = NOW()
              WHERE id = $2
              RETURNING *
              `,
              [
                  motivo.trim(),
                  id,
              ]
          );

      return res.json({
          success: true,
          message:
              'Documento demonstrativo cancelado com sucesso.',
          aviso:
              'DOCUMENTO DEMONSTRATIVO — SEM VALIDADE FISCAL',
          data: documentoCancelado[0],
      });
  } catch (err) {
      next(err);
  }
});
