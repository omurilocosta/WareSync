import { useEffect, useState } from 'react';
import { abrirCaixa, buscarCaixaAtual, fecharCaixa, registrarMovimentacao } from '../services/caixaService';

function moeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor || 0));
}

function dataHora(data) {
    return new Date(data).toLocaleString('pt-BR');
}

export default function Caixa() {
    const [caixa, setCaixa] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [valorAbertura, setValorAbertura] = useState('');
    const [tipo, setTipo] = useState('suprimento');
    const [valor, setValor] = useState('');
    const [descricao, setDescricao] = useState('');
    const [salvando, setSalvando] = useState(false);

    async function carregarCaixa() {
        try {
            setCarregando(true);
            setErro('');

            const response = await buscarCaixaAtual();
            setCaixa(response.data);
        } catch (error) {
            setErro(error.message);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarCaixa();
    }, []);

    async function handleAbrirCaixa(event) {
        event.preventDefault();

        try {
            setSalvando(true);
            setErro('');

            await abrirCaixa(Number(valorAbertura || 0));
            setValorAbertura('');
            await carregarCaixa();
        } catch (error) {
            setErro(error.message);
        } finally {
            setSalvando(false);
        }
    }

    async function handleMovimentacao(event) {
        event.preventDefault();

        if (!valor || Number(valor) <= 0) {
            setErro('Informe um valor maior que zero.');
            return;
        }

        try {
            setSalvando(true);
            setErro('');

            await registrarMovimentacao({
                tipo,
                valor: Number(valor),
                descricao: descricao.trim() || null,
            });

            setValor('');
            setDescricao('');
            await carregarCaixa();
        } catch (error) {
            setErro(error.message);
        } finally {
            setSalvando(false);
        }
    }

    async function handleFecharCaixa() {
        const confirmou = window.confirm('Deseja realmente fechar o caixa?');
        if (!confirmou) return;

        try {
            setSalvando(true);
            setErro('');

            await fecharCaixa();
            await carregarCaixa();
        } catch (error) {
            setErro(error.message);
        } finally {
            setSalvando(false);
        }
    }

    if (carregando) {
        return <div className="empty-state">Carregando caixa...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Caixa</h1>
                    <p>Controle de abertura, saldo e movimentações.</p>
                </div>
            </div>

            {erro && <div className="alert-error">{erro}</div>}

            {!caixa ? (
                <div className="cash-open-card">
                    <h2>Abrir caixa</h2>
                    <p>Informe o valor inicial disponível no caixa.</p>

                    <form onSubmit={handleAbrirCaixa}>
                        <div className="form-field">
                            <label>Valor de abertura</label>
                            <input type="number" min="0" step="0.01" value={valorAbertura} 
                            onChange={e => setValorAbertura(e.target.value)}/>
                        </div>

                        <button type="submit" className="btn-primary" disabled={salvando}>
                            {salvando ? 'Abrindo...' : 'Abrir caixa'}
                        </button>
                    </form>
                </div>
            ) : (
                <>
                    <div className="client-summary-grid">
                        <div className="summary-card">
                            <span>Valor de abertura</span>
                            <strong>{moeda(caixa.valor_abertura)}</strong>
                        </div>

                        <div className="summary-card">
                            <span>Saldo atual</span>
                            <strong>{moeda(caixa.saldo)}</strong>
                        </div>

                        <div className="summary-card">
                            <span>Status</span>
                            <strong>{caixa.status}</strong>
                        </div>
                    </div>

                    <div className="cash-actions">
                        <form onSubmit={handleMovimentacao}>
                            <h2>Nova movimentação</h2>

                            <div className="form-field">
                                <label>Tipo</label>
                                <select value={tipo} onChange={e => setTipo(e.target.value)}>
                                    <option value="suprimento">Suprimento</option>
                                    <option value="sangria">Sangria</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label>Valor</label>
                                <input type="number" min="0.01" step="0.01" value={valor} 
                                onChange={e => setValor(e.target.value)} />
                            </div>

                            <div className="form-field">
                                <label>Descrição</label>
                                <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição opcional" />
                            </div>

                            <button type="submit" className="btn-primary" disabled={salvando}>
                                Registrar movimentação
                            </button>
                        </form>

                        <div>
                            <h2>Movimentações</h2>

                            {caixa.movimentacoes?.length ? (
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Tipo</th>
                                                <th>Descrição</th>
                                                <th>Valor</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {caixa.movimentacoes.map(m => (
                                                <tr key={m.id}>
                                                    <td>{dataHora(m.criado_em)}</td>
                                                    <td>{m.tipo}</td>
                                                    <td>{m.descricao || '—'}</td>
                                                    <td>{moeda(m.valor)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-state">Nenhuma movimentação registrada.</div>
                            )}
                        </div>
                    </div>

                <div className="cash-footer">
                    <button type="button" className="btn-danger" disabled={salvando} onClick={handleFecharCaixa}>
                        Fechar caixa
                    </button>
                </div>
                </>
            )}
        </div>
    );
}