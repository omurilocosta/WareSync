import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';

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
async function emitirDocumentoSimulado(tipo: 'NFE' | 'NFCE', vendaId: number, usuarioId: number) {
  const { rows: numeroRows } = await pool.query(
    `SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) + 1 AS proximo FROM documentos_fiscais WHERE tipo = $1`,
    [tipo]
  );
  const numero = String(numeroRows[0].proximo).padStart(6, '0');
  const chaveAcesso = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('');

  const { rows } = await pool.query(
    `INSERT INTO documentos_fiscais (venda_id, tipo, numero, status, chave_acesso, usuario_id)
     VALUES ($1, $2, $3, 'autorizado', $4, $5)
     RETURNING *`,
    [vendaId, tipo, numero, chaveAcesso, usuarioId]
  );
  return rows[0];
}

fiscalRoutes.post('/emitir', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { venda_id, tipo } = req.body;
    const usuarioId = req.session.usuarioId || 1;

    if (!venda_id || !['NFE', 'NFCE'].includes(tipo)) {
      throw new AppError('Informe a venda e o tipo de documento (NFE ou NFCE).', 422);
    }

    const { rows: vendaRows } = await pool.query('SELECT * FROM vendas WHERE id = $1', [venda_id]);
    if (!vendaRows[0]) throw new AppError('Venda não encontrada.', 404);
    if (vendaRows[0].status !== 'finalizada') {
      throw new AppError('Só é possível emitir documento fiscal para vendas finalizadas.', 422);
    }

    const existente = await pool.query(
      `SELECT id FROM documentos_fiscais WHERE venda_id = $1 AND tipo = $2 AND status = 'autorizado'`,
      [venda_id, tipo]
    );
    if (existente.rows[0]) {
      throw new AppError('Já existe um documento autorizado para esta venda.', 422);
    }

    const documento = await emitirDocumentoSimulado(tipo, venda_id, usuarioId);

    res.status(201).json({
      success: true,
      message: `${tipo === 'NFE' ? 'NF-e' : 'NFC-e'} emitida (simulação).`,
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

fiscalRoutes.post('/:id/cancelar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { motivo } = req.body;

    if (!motivo || motivo.trim() === '') {
      throw new AppError('Informe o motivo do cancelamento.', 422);
    }

    const { rows } = await pool.query('SELECT * FROM documentos_fiscais WHERE id = $1', [id]);
    const documento = rows[0];
    if (!documento) throw new AppError('Documento não encontrado.', 404);
    if (documento.status !== 'autorizado') {
      throw new AppError('Só é possível cancelar documentos autorizados.', 422);
    }

    const horasDesdeEmissao = (Date.now() - new Date(documento.emitido_em).getTime()) / 3600000;
    if (horasDesdeEmissao > 24) {
      throw new AppError('Prazo para cancelamento expirado (mais de 24h desde a emissão).', 422);
    }

    await pool.query(
      `UPDATE documentos_fiscais SET status = 'cancelado', motivo_cancelamento = $1, cancelado_em = NOW() WHERE id = $2`,
      [motivo.trim(), id]
    );

    res.json({ success: true, message: 'Documento fiscal cancelado.' });
  } catch (err) {
    next(err);
  }
});
