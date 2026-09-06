import { useEffect, useState } from 'react';
import {  baixarContaPagar, criarContaPagar, listarContasPagar, removerContaPagar} from '../services/contasPagarService';

function moeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor || 0));
}

function dataBR(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

export default function ContasPagar() {
    const [contas, setContas] = useState([]);
    const [status, setStatus] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const [form, setForm] = useState({
        descricao: '',
        fornecedor: '',
        valor: '',
        vencimento: '',
        categoria: '',
        forma_pagamento: '',
    });

    async function carregar() {
        try {
            setCarregando(true);
            setErro('');

            const response = await listarContasPagar(status);
            setContas(response.data || []);
        } catch (error) {
            setErro(error.message);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregar();
    }, [status]);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm(anterior => ({ ...anterior, [name]: value }));
    }

    function limparFormulario() {
        setForm({
            descricao: '',
            fornecedor: '',
            valor: '',
            vencimento: '',
            categoria: '',
            forma_pagamento: '',
        });
    }

    async function handleSalvar(event) {
        event.preventDefault();

        try {
            setSalvando(true);
            setErro('');

            await criarContaPagar({
                descricao: form.descricao.trim(),
                fornecedor: form.fornecedor.trim() || null,
                valor: Number(form.valor),
                vencimento: form.vencimento,
                categoria: form.categoria.trim() || null,
                forma_pagamento: form.forma_pagamento || null,
            });

            setModalAberto(false);
            limparFormulario();
            await carregar();
        } catch (error) {
            setErro(error.message);
        } finally {
            setSalvando(false);
        }
    }

    async function handleBaixar(conta) {
        if (!window.confirm(`Confirmar pagamento de "${conta.descricao}"?`)) return;

        try {
            setErro('');
            await baixarContaPagar(conta.id);
            await carregar();
        } catch (error) {
            setErro(error.message);
        }
    }

    async function handleRemover(conta) {
        if (!window.confirm(`Remover "${conta.descricao}"?`)) return;

        try {
            setErro('');
            await removerContaPagar(conta.id);
            await carregar();
        } catch (error) {
            setErro(error.message);
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Contas a Pagar</h1>
                    <p className="page-subtitle">Gerencie contas abertas e pagamentos concluídos.</p>
                </div>

                <button type="button" className="btn-primary" onClick={() => setModalAberto(true)}>
                    + Nova conta
                </button>
            </div>

            <div className="page-toolbar">
                <div className="form-field contas-pagar__filter">
                    <label>Status</label>
                    <select value={status}onChange={e => setStatus(e.target.value)}>
                        <option value="">Todos os status</option>
                        <option value="aberta">Aberta</option>
                        <option value="paga">Paga</option>
                    </select>
                </div>
            </div>

            {erro && <div className="alert-error">{erro}</div>}

            {carregando ? (
                <div className="empty-state">Carregando contas...</div>
            ) : contas.length === 0 ? (
                <div className="empty-state">Nenhuma conta encontrada.</div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Fornecedor</th>
                                <th>Vencimento</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                            {contas.map(conta => (
                                <tr key={conta.id}>
                                    <td>{conta.descricao}</td>
                                    <td>{conta.fornecedor || '—'}</td>
                                    <td>{dataBR(conta.vencimento)}</td>
                                    <td>{moeda(conta.valor)}</td>
                                    <td>
                                        <span className={`status-badge ${conta.status === 'paga'? 'status-badge--success': 'status-badge--warning'}`}>
                                            {conta.status === 'paga' ? 'Paga' : 'Aberta'}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="table-actions">
                                        {conta.status === 'aberta' ? (
                                            <>
                                                <button type="button" className="btn-secondary btn-small" onClick={() => handleBaixar(conta)}>
                                                    Baixar
                                                </button>

                                                <button type="button" className="btn-danger btn-small" onClick={() => handleRemover(conta)}>
                                                    Remover
                                                </button>
                                            </>
                                        ):(
                                            <span className='table-tmuted'>Sem ações</span>
                                        )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modalAberto && (
                <div className="modal-backdrop">
                    <div className="modal-card modal-card--financial">
                        <div className="modal-header">
                            <div>
                                <h2>Nova conta</h2>
                                <p>Cadastre uma conta a pagar.</p>
                            </div>

                            <button type="button" className="modal-close" onClick={() => setModalAberto(false)}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSalvar}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-field form-field-full">
                                        <label>Descrição *</label>
                                        <input name="descricao" value={form.descricao} onChange={handleChange} placeholder='Ex.: Conta de energia' required />
                                    </div>

                                    <div className="form-field">
                                        <label>Fornecedor</label>
                                        <input name="fornecedor" value={form.fornecedor} onChange={handleChange} placeholder="Ex.: Fornecedor XYZ" />
                                    </div>

                                    <div className="form-field">
                                        <label>Valor *</label>
                                        <input type="number" min="0.01" step="0.01" name="valor" value={form.valor} onChange={handleChange} required />
                                    </div>

                                    <div className="form-field">
                                        <label>Vencimento *</label>
                                        <input type="date" name="vencimento" value={form.vencimento} onChange={handleChange} required />
                                    </div>

                                    <div className="form-field">
                                        <label>Categoria</label>
                                        <input name="categoria" value={form.categoria} onChange={handleChange} placeholder="Ex.: Despesas operacionais" />
                                    </div>

                                    <div className="form-field">
                                        <label>Forma de pagamento</label>
                                        <select name="forma_pagamento" value={form.forma_pagamento} onChange={handleChange}>
                                            <option value="">Não informada</option>
                                            <option>Dinheiro</option>
                                            <option>Pix</option>
                                            <option>Boleto</option>
                                            <option>Cartão de Débito</option>
                                            <option>Cartão de Crédito</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>
                                    Cancelar
                                </button>

                                <button type="submit" className="btn-primary" disabled={salvando}>
                                    {salvando ? 'Salvando...' : 'Cadastrar conta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}