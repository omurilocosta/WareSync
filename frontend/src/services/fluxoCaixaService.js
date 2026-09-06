import { apiFetch } from './api';

export function buscarFluxoCaixa(inicio = '', fim = '') {
    const params = new URLSearchParams();

    if (inicio) params.append('inicio', inicio);
    if (fim) params.append('fim', fim);

    const query = params.toString();

    return apiFetch(`/financeiro/fluxo-caixa${query ? `?${query}` : ''}`);
}