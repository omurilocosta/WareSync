import { useEffect, useState } from 'react';
import { buscarFluxoCaixa } from '../services/fluxoCaixaService';

function moeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor || 0));
}

function dataHoraBR(data) {
    return new Date(data).toLocaleString('pt-BR');
}

function hojeISO() {
    return new Date().toISOString().slice(0, 10);
}

function trintaDiasAtrasISO() {
    const data = new Date();
    data.setDate(data.getDate() - 30);

  return data.toISOString().slice(0, 10);
}

export default function FluxoCaixa() {
    const [dados, setDados] = useState({
        entradas: 0,
        saidas: 0,
        saldo_periodo: 0,
        lancamentos: [],
        projecao: {
        saidas_previstas: 0,
        entradas_previstas: 0,
        saldo_projetado: 0,
        },
    });

    const [inicio, setInicio] = useState(trintaDiasAtrasISO());
    const [fim, setFim] = useState(hojeISO());
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    async function carregar() {
        try {
            setCarregando(true);
            setErro('');

            const response = await buscarFluxoCaixa(inicio, fim);

            setDados(response.data || {
                entradas: 0,
                saidas: 0,
                saldo_periodo: 0,
                lancamentos: [],
                projecao: {
                saidas_previstas: 0,
                entradas_previstas: 0,
                saldo_projetado: 0,
                },
            });
        } catch (error) {
            setErro(error.message);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    function handleFiltrar(event) {
        event.preventDefault();
        carregar();
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className='page-title'>Fluxo de Caixa</h1>
                    <p className='page-subtitle'>Acompanhe entradas, saídas e projeções financeiras.</p>
                </div>
            </div>

            <form className="page-toolbar fluxo-caixa__filters" onSubmit={handleFiltrar}>
                <div className="form-field">
                    <label>Início</label>
                    <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
                </div>

                <div className="form-field">
                    <label>Fim</label>
                    <input type="date"value={fim}onChange={e => setFim(e.target.value)}/>
                </div>

                <button type="submit" className="btn-primary">
                    Filtrar
                </button>
            </form>

            {erro && <div className="alert-error">{erro}</div>}

            <div className="summary-grid">
                <div className="summary-card summary-card--success">
                    <span>Entradas</span>
                    <strong>{moeda(dados.entradas)}</strong>
                </div>

                <div className="summary-card summary-card--danger">
                    <span>Saídas</span>
                    <strong>{moeda(dados.saidas)}</strong>
                </div>

                <div className="summary-card summary-card--neutral">
                    <span>Saldo do período</span>
                    <strong>{moeda(dados.saldo_periodo)}</strong>
                </div>
            </div>

            <div className="page-header">
                <div className='section-header'>
                    <h2>Projeção financeira</h2>
                </div>
            </div>

            <div className="summary-grid">
                <div className="summary-card summary-card--success">
                    <span>Entradas previstas</span>
                    <strong>{moeda(dados.projecao?.entradas_previstas)}</strong>
                </div>

                <div className="summary-card summary-card--danger">
                    <span>Saídas previstas</span>
                    <strong>{moeda(dados.projecao?.saidas_previstas)}</strong>
                </div>

                <div className="summary-card summary-card--neutral">
                    <span>Saldo projetado</span>
                    <strong>{moeda(dados.projecao?.saldo_projetado)}</strong>
                </div>
            </div>

            <div className="page-header">
                <div className='section-header'>
                    <h2>Lançamentos</h2>
                </div>
            </div>

            {carregando ? (
                <div className="empty-state">Carregando fluxo de caixa...</div>
            ) : dados.lancamentos.length === 0 ? (
                <div className="empty-state">
                    <strong>Nenhum lançamento encontrado.</strong>
                    <p>Não há movimentações registradas no período.</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Tipo</th>
                                <th>Descrição</th>
                                <th className='text-right'>Valor</th>
                                <th>Sessão</th>
                            </tr>
                        </thead>

                        <tbody>
                        {dados.lancamentos.map(lancamento => (
                            <tr key={lancamento.id}>
                                <td>{dataHoraBR(lancamento.criado_em)}</td>
                                <td>
                                    <span className={`status-badge ${lancamento.tipo === 'entrada' || lancamento.tipo === 'suprimento' ? 'status-badge--success' : 'status-badge--danger'}`}>
                                        {lancamento.tipo}
                                    </span>
                                </td>
                                <td>{lancamento.descricao || '—'}</td>
                                <td className='text-right' style={{ fontWeight: 600 }}>{moeda(lancamento.valor)}</td>
                                <td>#{lancamento.sessao_id}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}