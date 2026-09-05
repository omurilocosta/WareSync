import { useEffect, useState } from 'react';
import { atualizarProduto, criarProduto, inativarProduto, listarMovimentacoes, listarProdutos, movimentarEstoque} from '../services/produtoService'
import { criarCategoria, listarCategorias } from '../services/categoriaService';
import { atualizarFornecedoresDoProduto, criarFornecedor, listarFornecedores,  listarFornecedoresDoProduto } from '../services/fornecedoresService';

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
        categoria_id: '',
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

    const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);

    const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
    const [historico, setHistorico] = useState([]);
    const [carregandoHistorico, setCarregandoHistorico] = useState(false);

    const [categorias, setCategorias] = useState([]);
    const [novaCategoria, setNovaCategoria] = useState('');

    const [fornecedores, setFornecedores] = useState([]);
    const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState([]);

    const [modalFornecedorAberto, setModalFornecedorAberto] = useState(false);

    const [salvandoFornecedor, setSalvandoFornecedor] =  useState(false);

    const [fornecedorForm, setFornecedorForm] = useState({
        nome: '',
        documento: '',
        telefone: '',
        email: '',
    });

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    }

    function limparFormulario() {
        setProdutoEmEdicao(null);
        setForm({
            nome: '',
            sku: '',
            codigo_barras: '',
            descricao: '',
            categoria_id: '',
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

    async function handleSalvarProduto(event) {
        event.preventDefault();
        try {
            setErro('');
            const dados = {
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
                categoria_id: form.categoria_id === ''
                    ? null
                    : Number(form.categoria_id),
            };

            let produtoSalvo;

            if (produtoEmEdicao) {
                const response = await atualizarProduto(produtoEmEdicao.id, dados);
                produtoSalvo = response.data || produtoEmEdicao;
            } else {
                const response = await criarProduto(dados);
                produtoSalvo = response.data;
            }
            if (produtoSalvo?.id) {
                await atualizarFornecedoresDoProduto(produtoSalvo.id, fornecedoresSelecionados)
            }

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

    async function abrirEdicao(produto) {
        setProdutoEmEdicao(produto)

        setForm({
            nome: produto.nome || '',
            sku: produto.sku || '',
            codigo_barras: produto.codigo_barras || '',
            descricao: produto.descricao || '',
            categoria_id: produto.categoria_id ?? '',
            unidade_medida: produto.unidade_medida || 'UN',
            preco_venda: produto.preco_venda ?? '',
            preco_custo: produto.preco_custo ?? '',
            estoque_minimo: produto.estoque_minimo ?? '',
            estoque_maximo: produto.estoque_maximo ?? '',
            ncm: produto.ncm || '',
            cfop: produto.cfop || '',
            cest: produto.cest || '',
            origem_fiscal: produto.origem_fiscal || '',
        })
        try{
            const response = await listarFornecedoresDoProduto(produto.id)
            setFornecedoresSelecionados(
                (response.data || []).map(
                    (fornecedor) => fornecedor.id
                )
            )
        } catch (error) {
            setErro(error.message)
        }
        setModalAberto(true)
    }

    function toggleFornecedor(fornecedorId) {
        setFornecedoresSelecionados((atuais) => {
            if (atuais.includes(fornecedorId)) {
                return atuais.filter((id) => id !== fornecedorId);
            }
            return [...atuais, fornecedorId];
        } );
    }

    async function abrirHistorico(produto) {
        try {
            setProdutoSelecionado(produto);
            setModalHistoricoAberto(true);
            setCarregandoHistorico(true);
            setErro('');

            const response = await listarMovimentacoes(produto.id);

            setHistorico(response.data || []);
        } catch (error) {
            setErro(error.message);
        } finally {
            setCarregandoHistorico(false);
        }
    }

    function fecharHistorico() {
        setModalHistoricoAberto(false);
        setHistorico([]);
        setProdutoSelecionado(null);
    }

    async function handleInativarProduto(produto) {
        const confirmou = window.confirm(
            `Deseja realmente inativar o produto "${produto.nome}"?`
        );

        if (!confirmou) {
            return;
        }

        try {
            setErro('');
            await inativarProduto(produto.id);
            await carregarProdutos();
        } catch (error) {
            setErro(error.message);
        }
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

    async function carregarCategorias() {
        try {
            const response = await listarCategorias();

            setCategorias(response.data || []);
        } catch (error) {
            setErro(error.message);
        }
    }

    async function handleCriarCategoria() {
        const nome = novaCategoria.trim()

        if (!nome){
            setErro('Digite o nome da categoria.')
            return;
        }
        try{
            setErro('');
            const response = await criarCategoria(nome);
            const categoriaCriada = response.data
            await carregarCategorias()

            if(!categoriaCriada?.id){
                throw new Error('A categoria foi criada, mas a API não retornou os dados corretamente.')
            }
            
            setForm((anterior) => ({
                ...anterior,
                categoria_id: String(categoriaCriada.id),
            }))
            setNovaCategoria('')
        } catch (error) {
            setErro(error.message)
        }
    }

    async function carregarFornecedores() {
        try {
            const response = await listarFornecedores();

            setFornecedores(response.data || []);
        } catch (error) {
            setErro(error.message);
        }
    }

    function handleFornecedorChange(event) {
        const { name, value } = event.target;

        setFornecedorForm((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    }

    function limparFornecedorForm() {
        setFornecedorForm({
            nome: '',
            documento: '',
            telefone: '',
            email: '',
        });
    }

    function fecharModalFornecedor() {
        setModalFornecedorAberto(false);
        limparFornecedorForm();
    }

    async function handleCriarFornecedor(event) {
        event.preventDefault();

        const nome = fornecedorForm.nome.trim();

        if (!nome) {
            setErro('Informe o nome do fornecedor.');
            return;
        }

        try {
            setSalvandoFornecedor(true);
            setErro('');

            const response = await criarFornecedor({
                nome,
                documento: fornecedorForm.documento.trim() || null,
                telefone: fornecedorForm.telefone.trim() || null,
                email: fornecedorForm.email.trim() || null,
            });

            const fornecedorCriado = response.data;

            if (!fornecedorCriado?.id) { throw new Error('Não foi possível identificar o fornecedor criado.');}

            // Atualiza a lista sem precisar recarregar a página
            setFornecedores((atuais) =>
                [...atuais, fornecedorCriado].sort((a, b) =>
                    a.nome.localeCompare(b.nome)
                )
            );

            // Já deixa o novo fornecedor marcado no produto
            setFornecedoresSelecionados((atuais) => [
                ...new Set([
                    ...atuais,
                    fornecedorCriado.id,
                ]),
            ]);

            fecharModalFornecedor();
        } catch (error) {
            setErro(error.message);
        } finally {
            setSalvandoFornecedor(false);
        }
    }

    useEffect(() => {
        carregarCategorias();
        carregarFornecedores();
    }, []);

    useEffect(() => {
        carregarCategorias();
    }, []);

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

                <button type="button" className="btn-primary" onClick={() => {limparFormulario(); setModalAberto(true)}}>
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
                                <button type='button' className='btn-secondary' onClick={() => abrirHistorico(produto)}>Histórico</button>
                                <button type="button" className="btn-secondary" onClick={() => abrirEdicao(produto)}>Editar</button>
                                <button type="button" className="btn-danger" onClick={() => handleInativarProduto(produto)}>Inativar</button>
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
                            <h2>{produtoEmEdicao ? 'Editar produto' : 'Novo produto'}</h2>
                            <p>{produtoEmEdicao ? 'Atualize as informações do produto.' : 'Cadastre um novo item no estoque.'}</p>
                        </div>

                        <button type="button" className="modal-close" onClick={() => { setModalAberto(false);limparFormulario();}}>×</button>
                    </div>

                    <form onSubmit={handleSalvarProduto}>
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
                                    <label>Categoria</label>
                                    <select name="categoria_id" value={form.categoria_id} onChange={handleChange}>
                                        <option value="">Sem Categoria</option>
                                        {categorias.map((categoria) => {
                                            return(
                                                <option key={categoria.id} value={String(categoria.id)}>{categoria.nome}</option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="form-field form-field-full">
                                    <label>Nova categoria</label>
                                    <div className="category-create">
                                        <input type="text" placeholder='Ex.: Periféricos' value={novaCategoria} onChange={(event) => setNovaCategoria(event.target.value)}/>
                                        <button type='button' className='btn-secondary' onClick={handleCriarCategoria}>Adicionar</button>
                                    </div>
                                </div>

                                <div className="form-field form-field-full">
                                    <label>Fornecedores</label>
                                    <button type='button' className='btn-secondary' onClick={() => setModalFornecedorAberto(true)}>+ Novo fornecedor</button>
                                    {fornecedores.length === 0 ? (
                                        <div className="empty-state">Nenhum fornecedor cadastrado.</div>
                                        ) : (
                                        <div className="supplier-list">{fornecedores.map((fornecedor) => (
                                            <label key={fornecedor.id} className="supplier-option">
                                                <input type="checkbox" checked={fornecedoresSelecionados.includes(fornecedor.id)} onChange={() => toggleFornecedor(fornecedor.id)}/>
                                                <span>{fornecedor.nome}</span>
                                            </label>
                                        ))}
                                        </div>
                                    )}
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
                                {produtoEmEdicao ? 'Salvar alterações' : 'Salvar produto'}
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

            {modalHistoricoAberto && produtoSelecionado && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <div className="modal-header">
                            <div>
                                <h2>Histórico de movimentações</h2>
                                <p>{produtoSelecionado.nome}</p>
                            </div>

                            <button type="button" className="modal-close" onClick={fecharHistorico}> × </button>
                        </div>

                        <div className="modal-body">{carregandoHistorico ? (
                        <div className="empty-state">Carregando histórico...</div>
                            ) : historico.length === 0 ? (
                            <div className="empty-state">Nenhuma movimentação registrada.</div>
                            ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Tipo</th>
                                        <th>Quantidade</th>
                                        <th>Saldo</th>
                                        <th>Usuário</th>
                                        <th>Motivo</th>
                                    </tr>
                                </thead>

                                <tbody>
                                {historico.map((movimentacao) => (
                                    <tr key={movimentacao.id}>
                                        <td>{new Date(movimentacao.criado_em).toLocaleString('pt-BR')}</td>

                                        <td>
                                            <span className={`movement-badge movement-${movimentacao.tipo}`}>{movimentacao.tipo}</span>
                                        </td>

                                        <td>{Number(movimentacao.quantidade).toLocaleString('pt-BR')}</td>

                                        <td>{Number(movimentacao.estoque_resultante).toLocaleString('pt-BR')}</td>

                                        <td>{movimentacao.usuario_nome || '—'}</td>

                                        <td>{movimentacao.motivo || '—'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={fecharHistorico}>Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {modalFornecedorAberto && (
                <div className="modal-backdrop">
                    <div className="modal-card modal-card-small">
                        <div className="modal-header">
                            <div>
                                <h2>Novo fornecedor</h2>
                                <p>  Cadastre um fornecedor para vincular ao produto.</p>
                            </div>

                            <button type="button" className="modal-close" onClick={fecharModalFornecedor}> × </button>
                        </div>

                        <form onSubmit={handleCriarFornecedor}>
                            <div className="modal-body">
                                <div className="form-field">
                                    <label>Nome *</label>
                                    <input name="nome" value={fornecedorForm.nome} onChange={handleFornecedorChange} placeholder="Nome do fornecedor" required/>
                                </div>

                                <div className="form-field">
                                    <label>Documento</label>
                                    <input name="documento" value={fornecedorForm.documento} onChange={handleFornecedorChange} placeholder="CNPJ ou CPF"/>
                                </div>

                                <div className="form-field">
                                    <label>Telefone</label>
                                    <input name="telefone" value={fornecedorForm.telefone} onChange={handleFornecedorChange} placeholder="(00) 00000-0000"/>
                                </div>

                                <div className="form-field">
                                    <label>E-mail</label>
                                    <input type="email" name="email" value={fornecedorForm.email} onChange={handleFornecedorChange} placeholder="fornecedor@empresa.com"/>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={fecharModalFornecedor}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={salvandoFornecedor}>
                                    {salvandoFornecedor ? 'Salvando...': 'Cadastrar fornecedor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Produtos;