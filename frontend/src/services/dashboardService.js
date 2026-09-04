import { apiFetch } from './api';

export async function getDashboardResumo() {
    return apiFetch('/dashboard/resumo');
}