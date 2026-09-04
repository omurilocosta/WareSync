export interface VendaItemInput {
  produto_id: number;
  quantidade: number;
}

export interface VendaInput {
  cliente_id?: number | null;
  forma_pagamento: string;
  desconto?: number;
  itens: VendaItemInput[];
}

export interface VendaItem {
  id: number;
  venda_id: number;
  produto_id: number;
  produto_nome?: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface Venda {
  id: number;
  cliente_id: number | null;
  cliente_nome?: string | null;
  usuario_id: number;
  usuario_nome?: string;
  status: 'aberta' | 'finalizada' | 'cancelada';
  forma_pagamento: string | null;
  desconto: number;
  total: number;
  criado_em: string;
  itens?: VendaItem[];
}
