import { apiFetch } from "./api";

export function login(email, senha) {
    return apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email,
            senha
        }),
    });
}

export function getSessao() {
    return apiFetch('/auth/sessao')
}

export function logout() {
    return apiFetch('/auth/logout', {
        method: 'POST'
    })
}