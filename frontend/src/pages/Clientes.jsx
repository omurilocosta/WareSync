import { useEffect, useState } from 'react';
import { atualizarCliente, buscarDetalhesCliente, criarCliente, inativarCliente, listarClientes } from '../services/clientesService';

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor || 0));
}

export default function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const [form, setForm] = useState({
        nome: '',
        documento: '',
        email: '',
        telefone: '',
        endereco: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        observacoes: '',
        limite_credito: '',
    });

    const [clienteEmEdicao, setClienteEmEdicao] =useState(null);

    const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
    const [clienteDetalhes, setClienteDetalhes] = useState(null);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);

    async function carregarClientes(termo = '') {
        try {
            setCarregando(true);
            setErro('');

            const response = await listarClientes(termo);

            setClientes(response.data || []);
        } catch (error) {
            setErro(error.message);
        } finally {
            setCarregando(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    }

    function limparFormulario() {
        setForm({
            nome: '',
            documento: '',
            email: '',
            telefone: '',
            endereco: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: '',
            observacoes: '',
            limite_credito: '',
        });
    }

    function fecharModal() {
        setModalAberto(false);
        setClienteEmEdicao(null);
        limparFormulario();
    }

    async function handleSalvarCliente(event) {
        event.preventDefault();

        if (!form.nome.trim()) {
            setErro('O nome do cliente é obrigatório.');
            return;
        }

        try {
            setSalvando(true);
            setErro('');

            const dados = {
                nome: form.nome.trim(),
                documento: form.documento.trim() || null,
                email: form.email.trim() || null,
                telefone: form.telefone.trim() || null,
                endereco: form.endereco.trim() || null,
                numero: form.numero.trim() || null,
                bairro: form.bairro.trim() || null,
                cidade: form.cidade.trim() || null,
                estado: form.estado.trim() || null,
                observacoes: form.observacoes.trim() || null,
                limite_credito: form.limite_credito === '' ? 0 : Number(form.limite_credito),
            };
            if (clienteEmEdicao) {
                await atualizarCliente(
                    clienteEmEdicao.id,
                    dados
                )
            } else {
                await criarCliente(dados)
            }

            fecharModal();
            await carregarClientes(busca);
        } catch (error) {
            setErro(error.message);
        } finally {
            setSalvando(false);
        }
    }

    function abrirEdicao(cliente) {
        setClienteEmEdicao(cliente)

        setForm({
            nome: cliente.nome || '',
            documento: cliente.documento || '',
            email: cliente.email || '',
            telefone: cliente.telefone || '',
            endereco: cliente.endereco || '',
            numero: cliente.numero || '',
            bairro: cliente.bairro || '',
            cidade: cliente.cidade || '',
            estado: cliente.estado || '',
            observacoes: cliente.observacoes || '',
            limite_credito: cliente.limite_credito ?? '',
        })

        setErro('')
        setModalAberto(true)
    }

    async function handleInativarCliente(cliente) {
        const confirmou = window.confirm(
            `Deseja realmente inativar o cliente "${cliente.nome}"?`
        )
        if (!confirmou) {
            return
        }
        try {
            setErro('')
            await inativarCliente(cliente.id)
            await carregarClientes(busca)
        } catch (error) {
            setErro(error.message)
        }
    }

    async function abrirDetalhes(cliente) {
        try {
            setErro('');
            setCarregandoDetalhes(true);
            setModalDetalhesAberto(true);
            setClienteDetalhes(null);

            const response = await buscarDetalhesCliente(cliente.id);

            setClienteDetalhes(response.data);
        } catch (error) {
            setErro(error.message);
            setModalDetalhesAberto(false);
        } finally {
            setCarregandoDetalhes(false);
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            carregarClientes(busca);
        }, 300);
        return () => clearTimeout(timer);
    }, [busca]);

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className='page-title'>Clientes</h1>
                    <p className='page-subtitle'>Gerencie os clientes cadastrados no sistema.</p>
                </div>
                <button type="button" className="btn-primary" onClick={() => {setClienteEmEdicao(null);limparFormulario();setErro('');setModalAberto(true)}}>
                    + Novo cliente
                </button>
            </div>

            <div className="page-toolbar">
                <input className='clientes-search' type="search" placeholder="Buscar por nome, documento ou e-mail..." value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                />
            </div>

            {erro && ( 
                <div className="alert-error"> 
                    {erro} 
                </div>
            )}

            {carregando ? (
                <div className="empty-state">Carregando clientes...</div>
            ) : clientes.length === 0 ? (
                <div className="empty-state">Nenhum cliente encontrado.</div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Documento</th>
                                <th>Contato</th>
                                <th>Cidade</th>
                                <th className='text-right'>Limite</th>
                                <th>Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                        {clientes.map((cliente) => (
                            <tr key={cliente.id}>
                                <td><strong>{cliente.nome}</strong></td>
                                <td>{cliente.documento || '—'}</td>
                                <td><div>{cliente.email || '—'}</div>{cliente.telefone && (<small>{cliente.telefone}</small>)}</td>
                                <td>{cliente.cidade ? `${cliente.cidade}${cliente.estado ? `/${cliente.estado}` : '' }`  : '—'}</td>
                                <td className='text-right' style={{ fontWeight: 600 }}>{formatarMoeda(cliente.limite_credito)}</td>
                                <td>
                                    <div className="table-actions">
                                        <button 
                                            type="button" 
                                            className="btn-secondary btn-small" 
                                            onClick={() => abrirDetalhes(cliente)}
                                        >
                                            Detalhes
                                        </button>

                                        <button 
                                            type="button" 
                                            className="btn-secondary btn-small" 
                                            onClick={() => abrirEdicao(cliente)}
                                        >
                                            Editar
                                        </button>

                                        <button 
                                            type="button" 
                                            className="btn-danger btn-small" 
                                            onClick={() => handleInativarCliente(cliente)}
                                        >
                                            Inativar
                                        </button>
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
                    <div className="modal-card modal-card--client">
                        <div className="modal-header">
                            <div>
                                <h2>{ clienteEmEdicao ? 'Editar cliente' : 'Novo cliente'}</h2>
                                <p>{ clienteEmEdicao ? 'Atualize os dados do cliente.' : 'Cadastre os dados do cliente.'}</p>
                            </div>
                            <button type="button" className="modal-close" onClick={fecharModal}>×</button>
                        </div>

                        <form onSubmit={handleSalvarCliente}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-field form-field-full">
                                        <label>Nome *</label>
                                        <input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome ou razão social" required/>
                                    </div>

                                    <div className="form-field">
                                        <label>CPF / CNPJ</label>
                                        <input name="documento" value={form.documento} onChange={handleChange} placeholder="CPF ou CNPJ" />
                                    </div>

                                    <div className="form-field">
                                        <label>E-mail</label>
                                        <input type="email" name="email" value={form.email} onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Telefone</label>
                                        <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000"/>
                                    </div>

                                    <div className="form-field">
                                        <label>Limite de crédito</label>
                                        <input type="number" min="0" step="0.01" name="limite_credito" value={form.limite_credito} onChange={handleChange}/>
                                    </div>

                                    <div className="form-field form-field-full">
                                        <label>Endereço</label>
                                        <input name="endereco" value={form.endereco} onChange={handleChange}/>
                                    </div>

                                    <div className="form-field">
                                        <label>Número</label>
                                        <input name="numero" value={form.numero} onChange={handleChange}/>
                                    </div>

                                    <div className="form-field">
                                        <label>Bairro</label>
                                        <input name="bairro" value={form.bairro} onChange={handleChange}/>
                                    </div>

                                    <div className="form-field">
                                        <label>Cidade</label>
                                        <input name="cidade" value={form.cidade} onChange={handleChange}/>
                                    </div>

                                    <div className="form-field">
                                        <label>Estado</label>
                                        <input name="estado" value={form.estado} onChange={handleChange} maxLength={2} placeholder="SP"/>
                                    </div>

                                    <div className="form-field form-field-full">
                                        <label>Observações</label>
                                        <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={3}/>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={fecharModal}> Cancelar </button>
                                <button type="submit" className="btn-primary" disabled={salvando}>
                                    {salvando
                                    ? 'Salvando...'
                                    : clienteEmEdicao
                                        ? 'Salvar alterações'
                                        : 'Cadastrar cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalDetalhesAberto && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <div className="modal-header">
                            <div>
                                <h2>Detalhes do cliente</h2>
                                <p>Histórico de compras e situação financeira.</p>
                            </div>

                            <button type="button" className="modal-close" onClick={() => {
                                setModalDetalhesAberto(false);
                                setClienteDetalhes(null);
                            }}>
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            {carregandoDetalhes ? (
                                <div className="empty-state">Carregando detalhes...</div>
                            ) : clienteDetalhes ? (
                                <>
                                    <div className="summary-grid">
                                        <div className="summary-card">
                                            <span>Total de compras</span><strong>{clienteDetalhes.total_compras || 0}</strong>
                                        </div>

                                        <div className="summary-card">
                                            <span>Valor comprado</span>
                                            <strong> {formatarMoeda(clienteDetalhes.valor_total_comprado)}</strong>
                                        </div>

                                        <div className="summary-card summary-card--danger">
                                            <span>Saldo devedor</span>
                                            <strong>{formatarMoeda(clienteDetalhes.saldo_devedor)}</strong>
                                        </div>

                                        <div className="summary-card summary-card--success">
                                            <span>Limite disponível</span>
                                            <strong>{formatarMoeda(clienteDetalhes.limite_disponivel)}</strong>
                                        </div>
                                    </div>

                                    <div className="client-details-info">
                                        <h3>{clienteDetalhes.nome}</h3>
                                        <p> <strong>Documento:</strong>{' '}{clienteDetalhes.documento || '—'}</p>
                                        <p><strong>E-mail:</strong>{' '}{clienteDetalhes.email || '—'}</p>
                                        <p><strong>Telefone:</strong>{' '}{clienteDetalhes.telefone || '—'}</p>
                                        <p><strong>Limite de crédito:</strong>{' '}{formatarMoeda(clienteDetalhes.limite_credito)}</p>
                                    </div>

                                    <h3>Histórico de compras</h3>

                                    {clienteDetalhes.historico_compras?.length ? (
                                    <div className="table-wrapper">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Venda</th>
                                                    <th>Data</th>
                                                    <th>Status</th>
                                                    <th className='text-right'>Total</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {clienteDetalhes.historico_compras.map(
                                                    (compra) => (
                                                        <tr key={compra.id}>
                                                            <td>#{compra.id}</td>
                                                            <td>{new Date(compra.criado_em).toLocaleString('pt-BR')}</td>
                                                            <td>
                                                                <span className={`status-badge ${
                                                                    compra.status === 'finalizada' 
                                                                    ? 'status-badge--success' 
                                                                    : compra.status === 'cancelada' 
                                                                        ? 'status-badge--danger' 
                                                                        : 'status-badge--warning'
                                                                }`}>
                                                                    {compra.status}
                                                                </span>
                                                            </td>
                                                            <td className='text-right' style={{ fontWeight: 600 }}>{formatarMoeda(compra.total)}</td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    ) : (
                                        <div className="empty-state">Nenhuma compra finalizada encontrada.</div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 