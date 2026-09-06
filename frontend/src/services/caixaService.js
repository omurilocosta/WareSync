import { apiFetch } from './api';

export function buscarCaixaAtual() {
    return apiFetch('/caixa/atual');
}

export function abrirCaixa(valorAbertura) {
    return apiFetch('/caixa/abrir', {
        method: 'POST',
        body: JSON.stringify({ valor_abertura: valorAbertura }),
    });
}

export function registrarMovimentacao(dados) {
    return apiFetch('/caixa/movimentacao', {
        method: 'POST',
        body: JSON.stringify(dados),
    });
}

export function fecharCaixa() {
    return apiFetch('/caixa/fechar', {
        method: 'POST',
    });
}