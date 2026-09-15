import { Request, Response, NextFunction } from 'express';
import * as fiscalService from './fiscal.service';
import { AppError } from '../../middlewares/error.middleware';

export async function listarDocumentos(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const documentos =
            await fiscalService.listarDocumentosFiscais();

        return res.status(200).json({
            data: documentos,
        });
    } catch (error) {
        next(error);
    }
}

export async function buscarDocumento(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            throw new AppError(
                'ID do documento fiscal inválido.',
                400
            );
        }

        const documento =
            await fiscalService.buscarDocumentoFiscalPorId(
                id
            );

        return res.status(200).json({
            data: documento,
        });
    } catch (error) {
        next(error);
    }
}

export async function prepararEmissao(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const vendaId = Number(req.params.vendaId);

        if (
            !Number.isInteger(vendaId) ||
            vendaId <= 0
        ) {
            throw new AppError(
                'ID da venda inválido.',
                400
            );
        }

        const dados =
            await fiscalService.prepararEmissaoFiscal(
                vendaId
            );

        return res.status(200).json({
            data: dados,
        });
    } catch (error) {
        next(error);
    }
}