import { useEffect, useState } from 'react';
import { criarProduto, listarProdutos, movimentarEstoque } from '../services/produtoService';

function formatMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function StockBadge({ produto }) {
    const atual = Number(produto.estoque_atual);
    const minimo = Number(produto.estoque_minimo);

    if (atual <= 0) {
        return (
            <span className="stock-badge stock-out">Sem estoque</span>
        );
    }
    if (atual <= minimo) {
        return (
            <span className="stock-badge stock-low">Estoque baixo</span>
        );
    }
    return (
        <span className="stock-badge stock-ok">Em estoque</span>
    );
}

function Produtos() {
    const [produtos, setProdutos] = useState([]);
    const [busca, setBusca] = useState('');

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [modalAberto, setModalAberto] = useState(false);

    const [form, setForm] = useState({
        nome: '',
        sku: '',
        codigo_barras: '',
        descricao: '',
        unidade_medida: 'UN',
        preco_vendae: '',
        preco_custo: '',
        estoque_minimo: '',
        estoque_maximo: '',
        ncm: '',
        cfop: '',
        cest: '',
        origem_fiscal: '0',
    });

    const [modalMovimentacaoAberto, setModalMovimentacaoAberto] = useState(false);
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [movimentacao, setMovimentacao] = useState({
        tipo: 'entrada',
        quantidade: '',
        motivo: '',
    })

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
            sku: '',
            codigo_barras: '',
            descricao: '',
            unidade_medida: 'UN',
            preco_venda: '',
            preco_custo: '',
            estoque_minimo: '',
            estoque_maximo: '',
            ncm: '',
            cfop: '',
            cest: '',
            origem_fiscal: '0',
        });
    }

    async function handleCriarProduto(event) {
        event.preventDefault();

        try {
            setErro('');

            await criarProduto({
            ...form,

                preco_venda: form.preco_venda === ''
                    ? 0
                    : Number(form.preco_venda),

                preco_custo: form.preco_custo === ''
                    ? 0
                    : Number(form.preco_custo),

                estoque_minimo: form.estoque_minimo === ''
                    ? 0
                    : Number(form.estoque_minimo),

                estoque_maximo: form.estoque_maximo === ''
                    ? null
                    : Number(form.estoque_maximo),
            });

            setModalAberto(false);

            limparFormulario();

            await carregarProdutos();
        } catch (error) {
            setErro(error.message);
        }
    }

    function abrirMovimentacao(produto) {
        setProdutoSelecionado(produto);

        setMovimentacao({
            tipo: 'entrada',
            quantidade: '',
            motivo: ''
        })

        setModalMovimentacaoAberto(true)
    }

    function fecharMovimentacao() {
        setModalMovimentacaoAberto(false)
        setProdutoSelecionado(null)

        setMovimentacao({
            tipo: 'entrada',
            quantidade: '',
            motivo: ''
        })
    }

    function handleMovimentacaoChange(event) {
        const {name, value} = event.target;

        setMovimentacao((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    }

    async function handleMovimentacao(event) {
        event.preventDefault()

        try {
            setErro('')

            const quantidade = Number(movimentacao.quantidade)

            if (!quantidade || quantidade <= 0) {
                setErro('informe uma quantidade maior que zero')
                return
            }

            await movimentarEstoque(produtoSelecionado.id, {
                tipo: movimentacao.tipo,
                quantidade,
                motivo: movimentacao.motivo.trim() || null,
            })

            fecharMovimentacao();

            await carregarProdutos();
        } catch (error) {
            setErro(error.message)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            carregarProdutos();
        }, 300);

        return () => clearTimeout(timer);
    }, [busca]);

    async function carregarProdutos() {
        try {
            setCarregando(true);
            setErro('');

            const response = await listarProdutos(busca);

            setProdutos(response.data || []);
        } catch (error) {
            setErro(error.message);
        } finally {
            setCarregando(false);
        }
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Produtos</h1>
                    <p className="page-subtitle">Cadastro e controle de estoque</p>
                </div>

                <button type="button" className="btn-primary" onClick={() => setModalAberto(true)}>
                    + Novo produto
                </button>
            </div>

            <div className="table-card" style={{ marginBottom: '16px' }}>
                <div className="product-search">
                    <input type="text" placeholder="Buscar por nome ou SKU..." value={busca} onChange={(event) => setBusca(event.target.value)}/>
                </div>
            </div>

            <div className="table-card">
                {carregando ? (
                <div className="empty-state">Carregando produtos...</div>
                ) : erro ? (
                <div className="empty-state">{erro}</div>
                ) : produtos.length === 0 ? (
                <div className="empty-state">Nenhum produto encontrado.</div>
                ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>SKU</th>
                            <th>Categoria</th>
                            <th>Preço</th>
                            <th>Estoque</th>
                            <th>Situação</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody> {produtos.map((produto) => (
                        <tr key={produto.id}>
                            <td>{produto.nome}</td>
                            <td>{produto.sku || '—'}</td>
                            <td>{produto.categoria_nome || '—'}</td>
                            <td>{formatMoeda(produto.preco_venda)}</td>
                            <td>{Number(produto.estoque_atual).toLocaleString('pt-BR')}</td>
                            <td><StockBadge produto={produto}/></td>
                            <td className="actions">
                                <button type="button" className="btn-secondary" onClick={() => abrirMovimentacao(produto)}>Movimentar</button>
                                <button type="button" className="btn-secondary">Editar</button>
                                <button type="button" className="btn-danger">Inativar</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
            </div>

            {modalAberto && (
            <div className="modal-backdrop">
                <div className="modal-card">
                    <div className="modal-header">
                        <div>
                            <h2>Novo produto</h2>
                            <p>Cadastre um novo item no estoque.</p>
                        </div>

                        <button type="button" className="modal-close" onClick={() => { setModalAberto(false);limparFormulario();}}>×</button>
                    </div>

                    <form onSubmit={handleCriarProduto}>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-field form-field-full">
                                    <label>Nome *</label>
                                    <input name="nome" value={form.nome} onChange={handleChange} required/>
                                </div>

                                <div className="form-field">
                                    <label>SKU</label>
                                    <input name="sku" value={form.sku} onChange={handleChange}/>
                                </div>

                                <div className="form-field">
                                    <label>Código de barras</label>
                                    <input name="codigo_barras" value={form.codigo_barras} onChange={handleChange}  />
                                </div>

                                <div className="form-field">
                                    <label>Preço de venda</label>
                                    <input type="number" step="0.01" min="0" name="preco_venda" value={form.preco_venda} onChange={handleChange}/>
                                </div>

                                <div className="form-field">
                                    <label>Preço de custo</label>
                                    <input type="number" step="0.01" min="0" name="preco_custo" value={form.preco_custo} onChange={handleChange}/>
                                </div>

                                <div className="form-field">
                                    <label>Estoque mínimo</label>
                                    <input type="number" min="0" name="estoque_minimo" value={form.estoque_minimo} onChange={handleChange}/>
                                </div>

                                <div className="form-field">
                                    <label>Estoque máximo</label>
                                    <input type="number" min="0" name="estoque_maximo" value={form.estoque_maximo} onChange={handleChange}/>
                                </div>

                                <div className="form-field">
                                    <label>Unidade</label>
                                    <select name="unidade_medida" value={form.unidade_medida} onChange={handleChange}>
                                        <option value="UN">UN</option>
                                        <option value="KG">KG</option>
                                        <option value="LT">LT</option>
                                        <option value="CX">CX</option>
                                        <option value="PC">PC</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>Origem fiscal</label>
                                    <select name="origem_fiscal" value={form.origem_fiscal} onChange={handleChange}>
                                        <option value="0">0 - Nacional</option>
                                        <option value="1">1 - Estrangeira</option>
                                        <option value="2">2 - Estrangeira adquirida no mercado interno</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>NCM</label>
                                    <input name="ncm" value={form.ncm} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label>CFOP</label>
                                    <input name="cfop" value={form.cfop}onChange={handleChange}/>
                                </div>

                                <div className="form-field">
                                    <label>CEST</label>
                                    <input name="cest" value={form.cest} onChange={handleChange}/>
                                </div>

                                <div className="form-field form-field-full">
                                    <label>Descrição</label>
                                    <textarea name="descricao" rows="3" value={form.descricao} onChange={handleChange}/>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => {setModalAberto(false);limparFormulario();}}>
                                Cancelar
                            </button>

                            <button type="submit" className="btn-primary">
                                Salvar produto
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            )}

            {modalMovimentacaoAberto && produtoSelecionado && (
                <div className="modal-backdrop">
                    <div className="modal-card modal-card-small">
                        <div className="modal-header">
                            <div>
                                <h2>Movimentar estoque</h2>
                                <p>{produtoSelecionado.nome}</p>
                            </div>

                            <button type="button" className="modal-close" onClick={fecharMovimentacao}> × </button>
                        </div>

                        <form onSubmit={handleMovimentacao}>
                            <div className="modal-body">
                                <div className="stock-current">
                                    <span>Estoque atual</span> 
                                    <strong>
                                        {Number(produtoSelecionado.estoque_atual).toLocaleString('pt-BR')}
                                    </strong>
                                </div>

                                <div className="form-field">
                                    <label>Tipo de movimentação</label>
                                    <select name="tipo" value={movimentacao.tipo} onChange={handleMovimentacaoChange}>
                                        <option value="entrada">Entrada</option>
                                        <option value="saida">Saída</option>
                                        <option value="ajuste">Ajuste de estoque</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>{movimentacao.tipo === 'ajuste' ? 'Novo estoque' : 'Quantidade'} </label>
                                    <input type="number" min="0.01" step="0.01" name="quantidade" value={movimentacao.quantidade} onChange={handleMovimentacaoChange} required/>
                                </div>

                                <div className="form-field">
                                    <label>Motivo</label>
                                    <textarea name="motivo" rows="3" placeholder="Ex.: Compra de fornecedor" value={movimentacao.motivo} onChange={handleMovimentacaoChange}/>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={fecharMovimentacao}>Cancelar</button>
                                <button type="submit" className="btn-primary">Confirmar movimentação</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Produtos;