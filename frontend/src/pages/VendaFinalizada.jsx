import { use, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { buscarVendaPorId } from '../services/vendasService';

function moeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor || 0));
}

export default function VendaFinalizada() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const [venda, setVenda] = useState(location.state?.venda || null);
    const [carregando, setCarregando] = useState(!location.state?.venda);
    const [erro, setErro] = useState('');

    useEffect(() => {
        async function carregarVenda() {
            try {
                setCarregando(true);
                setErro('');

                const response = await buscarVendaPorId(id);
                setVenda(response.data);    
            } catch (error) {
                setErro(error.message || 'Não foi possível carregar os dados da venda.');
            } finally {
                setCarregando(false);
            }
        }
        carregarVenda();
    }, [id]);

    function gerarCupom() {
        const subtotal = venda.itens?.reduce(
            (total, item) => total + Number(item.subtotal || 0),
            0
        ) || 0;

        const itensHtml = venda.itens?.length
            ? venda.itens.map(item => `
                <div class="item">
                <div class="item-nome">
                    ${item.produto_nome || `Produto #${item.produto_id}`}
                </div>

                <div class="item-detalhes">
                    <span>
                    ${item.quantidade} x ${moeda(item.preco_unitario)}
                    </span>

                    <strong>
                    ${moeda(item.subtotal)}
                    </strong>
                </div>
                </div>
            `).join('')
            : '<p>Nenhum item encontrado.</p>';

        const conteudo = `
            <html>
            <head>
                <title>Cupom da Venda #${venda.id}</title>

                <style>
                * {
                    box-sizing: border-box;
                }

                body {
                    width: 320px;
                    margin: 20px auto;

                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    color: #111;
                }

                h1 {
                    margin: 0;
                    text-align: center;
                    font-size: 20px;
                }

                .subtitulo {
                    margin-top: 4px;
                    text-align: center;
                }

                .aviso-topo {
                    margin: 12px 0;
                    padding: 8px;

                    border: 1px dashed #111;

                    text-align: center;
                    font-weight: bold;
                }

                .linha {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;

                    margin: 6px 0;
                }

                .separador {
                    margin: 12px 0;
                    border-top: 1px dashed #777;
                }

                .item {
                    margin: 10px 0;
                }

                .item-nome {
                    margin-bottom: 4px;
                    font-weight: bold;
                }

                .item-detalhes {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                }

                .total {
                    font-size: 15px;
                    font-weight: bold;
                }

                .rodape {
                    margin-top: 20px;
                    padding-top: 12px;

                    border-top: 1px dashed #777;

                    text-align: center;
                    font-weight: bold;
                }

                .obrigado {
                    margin-top: 14px;
                    text-align: center;
                }

                @media print {
                    body {
                    margin: 0 auto;
                    }
                }
                </style>
            </head>

            <body>
                <h1>WareSync</h1>

                <div class="subtitulo">
                Comprovante de venda
                </div>

                <div class="aviso-topo">
                COMPROVANTE NÃO FISCAL
                </div>

                <div class="linha">
                <span>Venda:</span>
                <strong>#${venda.id}</strong>
                </div>

                <div class="linha">
                <span>Data:</span>
                <strong>
                    ${
                    venda.criado_em
                        ? new Date(venda.criado_em).toLocaleString('pt-BR')
                        : new Date().toLocaleString('pt-BR')
                    }
                </strong>
                </div>

                <div class="linha">
                <span>Cliente:</span>
                <strong>${venda.cliente_nome || 'Consumidor final'}</strong>
                </div>

                <div class="linha">
                <span>Vendedor:</span>
                <strong>${venda.usuario_nome || '—'}</strong>
                </div>

                <div class="linha">
                <span>Pagamento:</span>
                <strong>${venda.forma_pagamento || '—'}</strong>
                </div>

                <div class="separador"></div>

                ${itensHtml}

                <div class="separador"></div>

                <div class="linha">
                <span>Subtotal:</span>
                <strong>${moeda(subtotal)}</strong>
                </div>

                <div class="linha">
                <span>Desconto:</span>
                <strong>${moeda(venda.desconto)}</strong>
                </div>

                <div class="linha total">
                <span>TOTAL:</span>
                <strong>${moeda(venda.total)}</strong>
                </div>

                <div class="rodape">
                SEM VALIDADE FISCAL
                </div>

                <div class="obrigado">
                Obrigado pela preferência!
                </div>
            </body>
            </html>
        `;

        const janela = window.open(
            '',
            '_blank',
            'width=420,height=700'
        );

        if (!janela) {
            setErro(
            'Não foi possível abrir o cupom. Verifique se o navegador está bloqueando pop-ups.'
            );
            return;
        }

        janela.document.write(conteudo);
        janela.document.close();
        janela.focus();

        setTimeout(() => {
            janela.print();
        }, 300);
    }

    if (carregando) {
        return <div className="empty-state">Carregando dados da venda...</div>;
    }
    if (erro) {
        return (
            <div className='page-container'>
                <div className='alert-error'>{erro}</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="sale-success-card">
                <div className="sale-success-icon">✓</div>

                <h1>Venda finalizada com sucesso</h1>
                <p>A venda foi registrada e o estoque foi atualizado.</p>

                <div className="sale-success-details">
                    <div>
                        <span>Venda</span>
                        <strong>#{venda?.id || id}</strong>
                    </div>

                    <div>
                        <span>Total</span>
                        <strong>{moeda(venda?.total)}</strong>
                    </div>

                    <div>
                        <span>Pagamento</span>
                        <strong>{venda?.forma_pagamento || '—'}</strong>
                    </div>
                </div>

                <div className="sale-success-actions">
                    <button type="button" className="btn-primary" onClick={gerarCupom}> Gerar cupom </button>
                    <button type="button" className="btn-secondary" onClick={() => navigate('/vendas/nova')}> Nova venda </button>
                    <button type="button" className="btn-secondary" onClick={() => navigate('/vendas')} > Voltar para vendas </button>
                </div>

                <small className="sale-success-note">O cupom gerado será um comprovante sem validade fiscal. </small>
            </div>
        </div>
    );
}