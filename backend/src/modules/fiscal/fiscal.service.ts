import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { buscarVendaPorId } from '../vendas/vendas.service';

export async function listarDocumentosFiscais() {
    const documentos =
        await prisma.documentos_fiscais.findMany({
            orderBy: {
                emitido_em: 'desc',
            },
        });

    return documentos.map((documento) => ({
        ...documento,
        emitido_em: documento.emitido_em.toISOString(),
        cancelado_em:
            documento.cancelado_em?.toISOString() || null,
    }));
}

export async function buscarDocumentoFiscalPorId(
    id: number
) {
    const documento =
        await prisma.documentos_fiscais.findUnique({
            where: {id,},
        });

    if (!documento) {
        throw new AppError( 'Documento fiscal não encontrado.', 404);
    }

    return {
        ...documento,
        emitido_em: documento.emitido_em.toISOString(),
        cancelado_em: documento.cancelado_em?.toISOString() || null,
    };
}

export async function prepararEmissaoFiscal( vendaId: number) {
    const venda = await buscarVendaPorId(vendaId);

    if (!venda) {
        throw new AppError(
            'Venda não encontrada.',
            404
        );
    }

    if (venda.status !== 'finalizada') {
        throw new AppError( 'Somente vendas finalizadas podem gerar um documento demonstrativo.', 409);
    }

    return {
        aviso: 'DOCUMENTO DEMONSTRATIVO — SEM VALIDADE FISCAL',
        venda,
    };
}