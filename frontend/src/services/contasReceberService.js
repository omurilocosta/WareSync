import { apiFetch } from './api';

export function listarContasReceber(status = '') {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiFetch(`/financeiro/contas-receber${query}`)
}

export function criarContaReceber(dados) {
    return apiFetch('/financeiro/contas-receber', {
        method: 'POST',
        body: JSON.stringify(dados),
    });
}

export function baixarContaReceber(id) {
    return apiFetch(`/financeiro/contas-receber/${id}/baixar`, {
        method: 'POST',
    });
}

export function removerContaReceber(id) {
    return apiFetch(`/financeiro/contas-receber/${id}`, {	
        method: 'DELETE',
    });
}