import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { getDashboardResumo } from '../services/dashboardService';

function formatMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function formatData(data) {
    if (!data) {
        return '—';
    }

    return new Date(data).toLocaleDateString('pt-BR');
}

function Dashboard() {
    const navigate = useNavigate();

    const [resumo, setResumo] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        async function carregarDashboard() {
            try {
                setCarregando(true);
                setErro('');

                const response = await getDashboardResumo();

                setResumo(response.data);
            } catch (error) {
                if (error.status === 401) {
                    navigate('/login', {
                        replace: true,
                    });
                    return;
                }
                setErro(error.message)
            } finally {
                setCarregando(false);
            }
        }

        carregarDashboard();
    }, [navigate]);

    if (carregando) {
        return (
            <div className="empty-state"> Carregando painel...</div>
        );
    }

    if (erro) {
        return (
            <div className="empty-state">
                <strong>Não foi possível carregar o painel.</strong>

                <p>{erro}</p>
                <p>Verifique se o backend está rodando e se você está autenticado.</p>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Painel geral</h1>
                    <p className="page-subtitle">Visão geral do Waresync</p>
                </div>

                <Link to="/estoque/produtos" className="btn-primary" style={{ textDecoration: 'none' }}>
                    + Novo produto
                </Link>
            </div>

            <div className="kpi-grid">
                <div className="card">
                    <p className="kpi-label">Clientes ativos</p>
                    <p className="kpi-value"> {resumo.total_clientes} </p>
                    <p className="kpi-hint"> cadastrados no sistema </p>
                </div>

                <div className="card">
                    <p className="kpi-label"> Produtos ativos </p>
                    <p className="kpi-value"> {resumo.total_produtos} </p> 
                    <p className="kpi-hint"> no catálogo </p>
                </div>

                <div className="card">
                    <p className="kpi-label"> Valor total em estoque </p>
                    <p className="kpi-value"> {formatMoeda(resumo.valor_estoque)} </p>
                    <p className="kpi-hint"> a preço de custo </p>
                </div>

                <div className="card">
                    <p className="kpi-label"> Vendas hoje </p>
                    <p className="kpi-value"> {formatMoeda(resumo.vendas_hoje)}</p>
                    <p className="kpi-hint"> {resumo.vendas_hoje_qtd} venda(s) · ticket médio{' '} {formatMoeda(resumo.ticket_medio)} </p>
                </div>
            </div>

            <div className="table-card" style={{ marginBottom: '16px' }}>
                <div className="dashboard-section-header">
                    <span>Vendas recentes</span>

                    <span className="dashboard-section-actions">
                        <Link to="/vendas" className="btn-secondary" style={{ textDecoration: 'none' }}>
                            Consultar todas
                        </Link>

                        <Link to="/vendas/nova" className="btn-secondary" style={{ textDecoration: 'none' }}>
                            Ver PDV
                        </Link>
                    </span>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Vendedor</th>
                            <th>Pagamento</th>
                            <th className="text-right"> Total</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody> {resumo.vendas_recentes.length > 0 ? (resumo.vendas_recentes.map((venda) => (
                        <tr key={venda.id}>
                            <td> {venda.cliente_nome || 'Consumidor final'}</td>
                            <td>{venda.usuario_nome}</td>
                            <td>{venda.forma_pagamento || '—'}</td>
                            <td className="text-right" style={{ fontWeight: 500 }}> {formatMoeda(venda.total)} </td>
                            <td className="actions">
                                <Link to="/vendas" className="btn-secondary" style={{ textDecoration: 'none' }}>
                                    Ver / Devolver
                                </Link>
                            </td>
                        </tr>
                        ))
                        ) : (
                        <tr>
                            <td colSpan="5" className="dashboard-empty-cell"> Nenhuma venda registrada ainda.</td>
                        </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="dashboard-grid">
                <div className="table-card">
                    <div className="dashboard-section-header">Produtos com estoque baixo</div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>SKU</th>
                                <th>Categoria</th>
                                <th>Estoque atual</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody> {resumo.produtos_estoque_baixo.length > 0 ? ( resumo.produtos_estoque_baixo.map((produto) => (
                            <tr key={produto.id}>
                                <td>{produto.nome}</td>
                                <td>{produto.sku || '—'}</td>
                                <td>{produto.categoria_nome || '—'}</td>
                                <td>{Number(produto.estoque_atual).toLocaleString('pt-BR')}</td>
                                <td>
                                    <span className="badge-warning">
                                        Mín:{' '}
                                        {Number(produto.estoque_minimo).toLocaleString('pt-BR')}
                                    </span>
                                </td>
                            </tr>
                            ))
                            ) : (
                            <tr>
                                <td colSpan="5" className="dashboard-empty-cell">
                                    Nenhum produto abaixo do estoque mínimo. 🎉
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="table-card">
                    <div className="dashboard-section-header">Clientes recentes</div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th>Desde</th>
                            </tr>
                        </thead>

                        <tbody> {resumo.clientes_recentes.length > 0 ? ( resumo.clientes_recentes.map((cliente) => (
                            <tr key={cliente.id}>
                                <td>{cliente.nome}</td>
                                <td>{cliente.email || '—'}</td>
                                <td>{formatData(cliente.criado_em)}</td>
                            </tr>
                            ))
                            ) : (
                            <tr>
                                <td colSpan="3" className="dashboard-empty-cell" >
                                    Nenhum cliente cadastrado ainda.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default Dashboard;