const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000/api`;

export async function apiFetch(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(
            data.message ||
            data.error ||
            'Erro ao realizar requisição.'
        );

        error.status = response.status;

        throw error;
    }

    return data;
}