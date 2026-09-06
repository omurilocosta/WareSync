import { useEffect, useState } from 'react';
import { listarClientes } from '../services/clientesService';
import { baixarContaReceber, criarContaReceber, listarContasReceber, removerContaReceber, } from '../services/contasReceberService';

function moeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor || 0));
}

function dataBR(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

export default function ContasReceber() {
    const [contas, setContas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [status, setStatus] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const [form, setForm] = useState({
        cliente_id: '',
        descricao: '',
        valor: '',
        vencimento: '',
        categoria: '',
        forma_pagamento: '',
    });

    async function carregar() {
        try {
            setCarregando(true);
            setErro('');

            const [contasResp, clientesResp] = await Promise.all([
                listarContasReceber(status),
                listarClientes(),
            ]);

            setContas(contasResp.data || []);
            setClientes(clientesResp.data || []);
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
            cliente_id: '',
            descricao: '',
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

            await criarContaReceber({
                cliente_id: form.cliente_id ? Number(form.cliente_id) : null,
                descricao: form.descricao.trim(),
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
        if (!window.confirm(`Confirmar recebimento de "${conta.descricao}"?`)) return;

        try {
            setErro('');
            await baixarContaReceber(conta.id);
            await carregar();
        } catch (error) {
            setErro(error.message);
        }
    }

    async function handleRemover(conta) {
        if (!window.confirm(`Remover "${conta.descricao}"?`)) return;

        try {
            setErro('');
            await removerContaReceber(conta.id);
            await carregar();
        } catch (error) {
            setErro(error.message);
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className='page-title'>Contas a Receber</h1>
                    <p className='page-subtitle'>Gerencie recebimentos pendentes e concluídos.</p>
                </div>

                <button type="button" className="btn-primary" onClick={() => setModalAberto(true)}>
                    + Novo recebimento
                </button>
            </div>

            <div className="page-toolbar">
                <div className='form-field contas-receber__filter'>
                    <label>Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="">Todos os status</option>
                        <option value="pendente">Pendente</option>
                        <option value="recebido">Recebido</option>
                    </select>
                </div>
            </div>

            {erro && <div className="alert-error">{erro}</div>}

            {carregando ? (
                <div className="empty-state">Carregando recebimentos...</div>
            ) : contas.length === 0 ? (
                <div className="empty-state">Nenhum recebimento encontrado.</div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Cliente</th>
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
                                    <td>{conta.cliente_nome || '—'}</td>
                                    <td>{dataBR(conta.vencimento)}</td>
                                    <td>{moeda(conta.valor)}</td>
                                    <td>
                                        <span className={`status-badge ${conta.status === 'recebido'? 'status-badge--success': 'status-badge--warning'}`}>
                                            {conta.status === 'recebido' ? 'Recebido' : 'Pendente'}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="table-actions">
                                        {conta.status === 'pendente' ? (
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
                                <h2>Novo recebimento</h2>
                                <p>Cadastre uma conta a receber.</p>
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
                                        <input name="descricao" value={form.descricao} onChange={handleChange} placeholder='Ex.: Parcela de Cliente' required />
                                    </div>

                                    <div className="form-field">
                                        <label>Cliente</label>
                                        <select name="cliente_id" value={form.cliente_id} onChange={handleChange}>
                                            <option value="">Sem cliente</option>
                                            {clientes.map(cliente => (
                                                <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                                            ))}
                                        </select>
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
                                        <input name="categoria" value={form.categoria} onChange={handleChange} />
                                    </div>

                                    <div className="form-field">
                                        <label>Forma de pagamento</label>
                                        <select name="forma_pagamento" value={form.forma_pagamento} onChange={handleChange}>
                                            <option value="">Não informada</option>
                                            <option>Dinheiro</option>
                                            <option>Pix</option>
                                            <option>Cartão de Débito</option>
                                            <option>Cartão de Crédito</option>
                                            <option>Crediário</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>
                                    Cancelar
                                </button>

                                <button type="submit" className="btn-primary" disabled={salvando}>
                                    {salvando ? 'Salvando...' : 'Cadastrar recebimento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}