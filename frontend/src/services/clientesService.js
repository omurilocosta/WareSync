import { apiFetch } from './api';

export function listarClientes(busca = '') {
    const query = busca.trim()
        ? `?busca=${encodeURIComponent(busca.trim())}`
        : '';

    return apiFetch(`/clientes${query}`);
}

export function buscarClientePorId(id) {
    return apiFetch(`/clientes/${id}`);
}

export function buscarDetalhesCliente(id) {
    return apiFetch(`/clientes/${id}/detalhes`);
}

export function criarCliente(dados) {
    return apiFetch('/clientes', {
        method: 'POST',
        body: JSON.stringify(dados),
  });
}

export function atualizarCliente(id, dados) {
    return apiFetch(`/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
  });
}

export function inativarCliente(id) {
    return apiFetch(`/clientes/${id}`, {
        method: 'DELETE',
    });
}