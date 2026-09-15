import { apiFetch } from './api';

export function listarFuncionarios(busca = '') {
    const query = busca.trim()
        ? `?busca=${encodeURIComponent(busca.trim())}`
        : '';

    return apiFetch(`/funcionarios${query}`);
}

export function criarFuncionario(dados) {
    return apiFetch('/funcionarios', {
        method: 'POST',
        body: JSON.stringify(dados),
    });
}

export function atualizarFuncionario(id, dados) {
    return apiFetch(`/funcionarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
    });
}

export function inativarFuncionario(id) {
    return apiFetch(`/funcionarios/${id}`, {
        method: 'DELETE',
    });
}