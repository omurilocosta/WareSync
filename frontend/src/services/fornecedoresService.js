import { apiFetch } from './api';

export function listarFornecedores(busca = '') {
    const query = busca.trim()
        ? `?busca=${encodeURIComponent(busca.trim())}`
        : '';
    return apiFetch(`/fornecedores${query}`);
}

export function criarFornecedor(dados) {
    return apiFetch('/fornecedores', {
        method: 'POST',
        body: JSON.stringify(dados),
    });
}

export function listarFornecedoresDoProduto(produtoId) {
    return apiFetch(`/fornecedores/produto/${produtoId}`);
}

export function atualizarFornecedoresDoProduto(produtoId,fornecedorIds) {
    return apiFetch(`/fornecedores/produto/${produtoId}`, {
        method: 'PUT',
        body: JSON.stringify({
            fornecedor_ids: fornecedorIds,
        }),
    });
}