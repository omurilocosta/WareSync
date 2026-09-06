import { useEffect, useState } from 'react';
import { listarInadimplencia, receberTitulo } from '../services/inadimplenciaService';

function moeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor || 0));
}

function dataBR(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

export default function Inadimplencia() {
    const [dados, setDados] = useState({
        titulos: [],
        total_em_atraso: 0,
        quantidade: 0,
    });

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [baixandoId, setBaixandoId] = useState(null);

    async function carregar() {
        try {
            setCarregando(true);
            setErro('');

            const response = await listarInadimplencia();

            setDados(response.data || {
                titulos: [],
                total_em_atraso: 0,
                quantidade: 0,
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

    async function handleReceber(titulo) {
        const confirmou = window.confirm(
            `Confirmar recebimento de "${titulo.descricao}" no valor de ${moeda(titulo.valor)}?`
        );

        if (!confirmou) return;

        try {
            setBaixandoId(titulo.id);
            setErro('');

            await receberTitulo(titulo.id);
            await carregar();
        } catch (error) {
            setErro(error.message);
        } finally {
            setBaixandoId(null);
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className='page-title'>Inadimplência</h1>
                    <p className='page-subtitle'>Acompanhe títulos vencidos e recebimentos em atraso.</p>
                </div>
            </div>

            {erro && <div className="alert-error">{erro}</div>}

            <div className="summary-grid">
                <div className="summary-card">
                    <span>Títulos em atraso</span>
                    <strong>{dados.quantidade || 0}</strong>
                </div>

                <div className="summary-card">
                    <span>Total em atraso</span>
                    <strong>{moeda(dados.total_em_atraso)}</strong>
                </div>
            </div>

            {carregando ? (
                <div className="empty-state">Carregando inadimplência...</div>
            ) : dados.titulos.length === 0 ? (
                <div className="empty-state">
                    <strong>Nenhum título em atraso.</strong>
                    <p>Todos os recebimentos estão em dia. 🎉</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Cliente</th>
                                <th>Telefone</th>
                                <th>Vencimento</th>
                                <th>Dias em atraso</th>
                                <th className='text-right'>Valor</th>
                                <th>Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                        {dados.titulos.map(titulo => (
                            <tr key={titulo.id}>
                                <td>{titulo.descricao}</td>
                                <td>{titulo.cliente_nome || '—'}</td>
                                <td>{titulo.cliente_telefone || '—'}</td>
                                <td>{dataBR(titulo.vencimento)}</td>
                                <td>
                                    <span className='status-badge status-badge--danger'>
                                        {titulo.dias_atraso} dia(s)
                                    </span>
                                </td>
                                <td className='text-right' style={{ fontWeight: 600 }}>{moeda(titulo.valor)}</td>
                                <td>
                                    <button type="button" className="btn-secondary btn-small" disabled={baixandoId === titulo.id} onClick={() => handleReceber(titulo)}>
                                        {baixandoId === titulo.id ? 'Recebendo...' : 'Receber'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}