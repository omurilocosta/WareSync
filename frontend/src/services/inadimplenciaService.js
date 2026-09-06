import { apiFetch } from './api';

export function listarInadimplencia() {
  return apiFetch('/financeiro/inadimplencia');
}

export function receberTitulo(id) {
  return apiFetch(`/financeiro/inadimplencia/${id}/receber`, {
    method: 'POST',
  });
}