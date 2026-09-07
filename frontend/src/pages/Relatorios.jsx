import { useEffect, useState } from 'react';
import {buscarRelatorioEstoque,buscarRelatorioFinanceiro,buscarRelatorioVendas,} from '../services/relatoriosService';

function moeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor || 0));
}

function hojeISO() {
    return new Date().toISOString().slice(0, 10);
}

function trintaDiasAtrasISO() {
    const data = new Date();
    data.setDate(data.getDate() - 30);

    return data.toISOString().slice(0, 10);
}

export default function Relatorios() {
    const [aba, setAba] = useState('vendas');
    const [inicio, setInicio] = useState(trintaDiasAtrasISO());
    const [fim, setFim] = useState(hojeISO());

    const [vendas, setVendas] = useState(null);
    const [estoque, setEstoque] = useState(null);
    const [financeiro, setFinanceiro] = useState(null);

    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');

    async function carregarVendas() {
        const response = await buscarRelatorioVendas(inicio, fim);
        setVendas(response.data);
    }

    async function carregarEstoque() {
        const response = await buscarRelatorioEstoque();
        setEstoque(response.data);
    }

    async function carregarFinanceiro() {
        const response = await buscarRelatorioFinanceiro(inicio, fim);
        setFinanceiro(response.data);
    }

    async function carregar() {
        try {
            setCarregando(true);
            setErro('');

            if (aba === 'vendas') {
                await carregarVendas();
            }

            if (aba === 'estoque') {
                await carregarEstoque();
            }

            if (aba === 'financeiro') {
                await carregarFinanceiro();
            }
        } catch (error) {
            setErro(error.message);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregar();
    }, [aba]);

    function handleFiltrar(event) {
        event.preventDefault();
        carregar();
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className='page-title'>Relatórios</h1>
                    <p className='page-subtitle'>Acompanhe vendas, estoque e desempenho financeiro.</p>
                </div>
            </div>

            <div className="reports-tabs">
                <button type="button" className={`reports-tab ${aba === 'vendas' ? 'active' : ''}`} onClick={() => setAba('vendas')}>Vendas</button>

                <button type="button"className={`reports-tab ${aba === 'estoque' ? 'active' : ''}`} onClick={() => setAba('estoque')}>Estoque</button>

                <button type="button"className={`reports-tab ${aba === 'financeiro' ? 'active' : ''}`} onClick={() => setAba('financeiro')}>Financeiro</button>
            </div>

            {(aba === 'vendas' || aba === 'financeiro') && (
                <form className="page-toolbar reports-filters" onSubmit={handleFiltrar}>
                    <div className="form-field">
                        <label>Início</label>
                        <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Fim</label>
                        <input type="date" value={fim} onChange={e => setFim(e.target.value)} />
                    </div>

                    <button type="submit" className="btn-primary">
                        Filtrar
                    </button>
                </form>
            )}

            {erro && <div className="alert-error">{erro}</div>}

            {carregando ? (
                <div className="empty-state">Carregando relatório...</div>
            ) : (
                <>
                    {aba === 'vendas' && vendas && (
                        <RelatorioVendas dados={vendas} />
                    )}

                    {aba === 'estoque' && estoque && (
                        <RelatorioEstoque dados={estoque} />
                    )}

                    {aba === 'financeiro' && financeiro && (
                        <RelatorioFinanceiro dados={financeiro} />
                    )}
                </>
            )}
        </div>
    );
}

function RelatorioVendas({ dados }) {
    return (
        <>
            <div className="summary-grid">
                <div className="summary-card summary-card--neutral">
                    <span>Quantidade de vendas</span>
                    <strong>{dados.resumo?.quantidade || 0}</strong>
                </div>

                <div className="summary-card summary-card--success">
                    <span className='text-right'>Total vendido</span>
                    <strong>{moeda(dados.resumo?.total)}</strong>
                </div>
            </div>

            <div className="section-header">
                <h2>Vendas por dia</h2>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                        <th>Dia</th>
                        <th>Quantidade</th>
                        <th className='text-right'>Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        {dados.por_dia?.map(item => (
                        <tr key={item.dia}>
                            <td>{item.dia}</td>
                            <td>{item.quantidade}</td>
                            <td className='text-right' style={{ fontWeight: 600 }}>{moeda(item.total)}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="section-header">
                <h2>Por vendedor</h2>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Vendedor</th>
                            <th>Quantidade</th>
                            <th className='text-right'>Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        {dados.por_vendedor?.map(item => (
                        <tr key={item.vendedor}>
                            <td>{item.vendedor}</td>
                            <td>{item.quantidade}</td>
                            <td className='text-right' style={{ fontWeight: 600 }}>{moeda(item.total)}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="section-header">
                <h2>Produtos mais vendidos</h2>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Quantidade</th>
                            <th className='text-right'>Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        {dados.por_produto?.map(item => (
                        <tr key={item.produto}>
                            <td>{item.produto}</td>
                            <td>{Number(item.quantidade)}</td>
                            <td className='text-right' style={{ fontWeight: 600 }}>{moeda(item.total)}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function RelatorioEstoque({ dados }) {
    return (
        <>
            <div className="summary-grid">
                <div className="summary-card summary-card--success">
                    <span>Valor total em estoque</span>
                    <strong>{moeda(dados.valor_total_estoque)}</strong>
                </div>

                <div className="summary-card summary-card--danger">
                    <span>Produtos sem venda</span>
                    <strong>{dados.produtos_sem_venda?.length || 0}</strong>
                </div>
            </div>

            <div className="section-header">
                <h2>Produtos em estoque</h2>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                        <th>Produto</th>
                        <th>SKU</th>
                        <th>Categoria</th>
                        <th>Estoque</th>
                        <th>Mínimo</th>
                        <th className='text-right'>Custo</th>
                        <th className='text-right'>Valor em estoque</th>
                        </tr>
                    </thead>

                    <tbody>
                        {dados.produtos?.map(produto => (
                        <tr key={produto.sku}>
                            <td>{produto.nome}</td>
                            <td>{produto.sku}</td>
                            <td>{produto.categoria_nome || '—'}</td>
                            <td>{Number(produto.estoque_atual)}</td>
                            <td>{Number(produto.estoque_minimo)}</td>
                            <td className='text-right' style={{ fontWeight: 600 }}>{moeda(produto.preco_custo)}</td>
                            <td className='text-right' style={{ fontWeight: 600 }}>{moeda(produto.valor_em_estoque)}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="section-header">
                <h2>Produtos sem venda</h2>
            </div>

        <div className="table-wrapper">
            <table className="data-table">
                <thead>
                    <tr>
                    <th>Produto</th>
                    <th>SKU</th>
                    </tr>
                </thead>

                <tbody>
                    {dados.produtos_sem_venda?.map(produto => (
                    <tr key={produto.id}>
                        <td>{produto.nome}</td>
                        <td>{produto.sku}</td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
        </>
    );
}

function RelatorioFinanceiro({ dados }) {
    return (
        <>
            <div className="summary-grid">
                <div className="summary-card summary-card--success">
                    <span>Receita bruta</span>
                    <strong>{moeda(dados.dre?.receita_bruta)}</strong>
                </div>

                <div className="summary-card summary-card--danger">
                    <span>Custo dos produtos</span>
                    <strong>{moeda(dados.dre?.custo_produtos_vendidos)}</strong>
                </div>

                <div className="summary-card summary-card--neutral">
                    <span>Lucro bruto</span>
                    <strong>{moeda(dados.dre?.lucro_bruto)}</strong>
                </div>

                <div className="summary-card summary-card--warning">
                    <span>Margem</span>
                    <strong>{Number(dados.dre?.margem || 0).toFixed(1)}%</strong>
                </div>
            </div>

            <div className="summary-grid">
                <div className="summary-card">
                    <span>Contas a pagar em aberto</span>
                    <strong>{moeda(dados.contas_pagar_em_aberto)}</strong>
                </div>

                <div className="summary-card">
                    <span>Contas a receber pendentes</span>
                    <strong>{moeda(dados.contas_receber_pendentes)}</strong>
                </div>
            </div>
        </>
    );
}