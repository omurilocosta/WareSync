export interface Cliente {
  id: number;
  nome: string;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  limite_credito: number;
  ativo: boolean;
  criado_em: string;
}

export interface ClienteInput {
  nome: string;
  documento?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  limite_credito?: number;
}
