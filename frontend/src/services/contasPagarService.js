import { apiFetch } from './api';

export function listarContasPagar(status = '') {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiFetch(`/financeiro/contas-pagar${query}`);
}

export function criarContaPagar(dados) {
    return apiFetch('/financeiro/contas-pagar', {
        method: 'POST',
        body: JSON.stringify(dados),
    });
}

export function baixarContaPagar(id) {
    return apiFetch(`/financeiro/contas-pagar/${id}/baixar`, {
        method: 'POST',
    });
}

export function removerContaPagar(id) {
    return apiFetch(`/financeiro/contas-pagar/${id}`, {
        method: 'DELETE',
    });
}