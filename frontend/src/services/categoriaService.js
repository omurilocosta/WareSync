import { apiFetch } from './api';

export function listarCategorias() {
    return apiFetch('/categorias');
}

export function criarCategoria(nome) {
    return apiFetch('/categorias', {
        method: 'POST',
        body: JSON.stringify({ nome }),
    });
}