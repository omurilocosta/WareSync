export interface Produto {
  id: number;
  nome: string;
  sku: string | null;
  codigo_barras: string | null;
  descricao: string | null;
  grupo: string | null;
  unidade_medida: string | null;
  categoria_id: number | null;
  categoria_nome?: string | null;
  preco_venda: number;
  preco_custo: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number | null;
  ncm: string | null;
  cfop: string | null;
  cest: string | null;
  origem_fiscal: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface ProdutoInput {
  nome: string;
  sku?: string;
  codigo_barras?: string;
  descricao?: string;
  grupo?: string;
  unidade_medida?: string;
  categoria_id?: number | null;
  preco_venda?: number;
  preco_custo?: number;
  estoque_minimo?: number;
  estoque_maximo?: number;
  ncm?: string;
  cfop?: string;
  cest?: string;
  origem_fiscal?: string;
}

export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste';

export interface MovimentacaoInput {
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo?: string;
}

export interface MovimentacaoEstoque {
  id: number;
  produto_id: number;
  usuario_id: number;
  tipo: TipoMovimentacao;
  quantidade: number;
  estoque_resultante: number;
  motivo: string | null;
  criado_em: string;
  usuario_nome?: string | null;
}