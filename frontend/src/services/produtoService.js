import { apiFetch } from './api';

export function listarProdutos(busca = '') {
    const query = busca.trim()
        ? `?busca=${encodeURIComponent(busca.trim())}`
        : '';
    return apiFetch(`/produtos${query}`);
}
export function buscarProdutoPorId(id) {
    return apiFetch(`/produtos/${id}`);
}
export function criarProduto(dados) {
    return apiFetch('/produtos', {
        method: 'POST',
        body: JSON.stringify(dados),
    });
}
export function atualizarProduto(id, dados) {
    return apiFetch(`/produtos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
    });
}
export function inativarProduto(id) {
    return apiFetch(`/produtos/${id}`, {
        method: 'DELETE',
    });
}
export function movimentarEstoque(id, dados) {
    return apiFetch(`/produtos/${id}/movimentacao`, {
        method: 'POST',
        body: JSON.stringify(dados),
    });
}
export function listarMovimentacoes(id) {
    return apiFetch(`/produtos/${id}/movimentacoes`);
}