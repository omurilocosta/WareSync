import { apiFetch } from './api';

export function buscarRelatorioVendas(inicio = '', fim = '') {
    const params = new URLSearchParams();

    if (inicio) params.append('inicio', inicio);
    if (fim) params.append('fim', fim);

    const query = params.toString();

    return apiFetch(`/relatorios/vendas${query ? `?${query}` : ''}`);
}

export function buscarRelatorioEstoque() {
    return apiFetch('/relatorios/estoque');
}

export function buscarRelatorioFinanceiro(inicio = '', fim = '') {
    const params = new URLSearchParams();

    if (inicio) params.append('inicio', inicio);
    if (fim) params.append('fim', fim);

    const query = params.toString();

    return apiFetch(`/relatorios/financeiro${query ? `?${query}` : ''}`);
}