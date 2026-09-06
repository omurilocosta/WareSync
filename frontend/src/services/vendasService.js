import { apiFetch } from './api';

export function listarVendas(filtros = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([chave,valor]) => {
        if(valor !== undefined && valor !== null && String(valor).trim() !=='') {
            params.append(chave,String(valor));
        }
    });
    const query = params.toString()
        ? `?${params.toString()}`
        : '';
    return apiFetch(`/vendas${query}`);
}

export function buscarVendaPorId(id){
    return apiFetch(`/vendas/${id}`);
}

export function criarVenda(dados){
    return apiFetch('/vendas',{method:'POST',body:JSON.stringify(dados)});
}

export function cancelarVenda(id,motivo){
    return apiFetch(`/vendas/${id}/cancelar`,{method:'POST',body:JSON.stringify({motivo})});
}