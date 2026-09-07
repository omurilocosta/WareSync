import { useEffect,useMemo,useState } from 'react';
import { useNavigate } from 'react-router';
import { listarClientes } from '../services/clientesService';
import { listarProdutos } from '../services/produtoService';
import { criarVenda } from '../services/vendasService';

function moeda(valor){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(valor||0));}

export default function NovaVenda(){
    const navigate=useNavigate();
    const [clientes,setClientes]=useState([]);
    const [produtos,setProdutos]=useState([]);
    const [clienteId,setClienteId]=useState('');
    const [formaPagamento,setFormaPagamento]=useState('Dinheiro');
    const [desconto,setDesconto]=useState('');
    const [itens,setItens]=useState([]);
    const [buscaProduto,setBuscaProduto]=useState('');
    const [erro,setErro]=useState('');
    const [salvando,setSalvando]=useState(false);

    async function carregarDados(){
        try{setErro('');
            const [clientesResp,produtosResp] = await Promise.all([
                listarClientes(),
                listarProdutos()
            ]);
            setClientes(clientesResp.data||[]);
            setProdutos(produtosResp.data||[]);
        } catch(error) {
            setErro(error.message);
        }
    }

    useEffect(() => {
        carregarDados();
    },[]);

    const produtosFiltrados = useMemo(() => {
        const termo = buscaProduto.trim().toLowerCase();
        return produtos.filter(
            p => !termo || p.nome.toLowerCase().includes(termo) || p.sku?.toLowerCase().includes(termo)
        );
    },[produtos,buscaProduto]);

    const totalBruto = itens.reduce((total,item) => total + (Number(item.preco_venda)*item.quantidade),0);
    const total = Math.max(totalBruto-Number(desconto||0),0);

    function adicionarProduto(produto){
        if(Number(produto.estoque_atual) <=0) {
            setErro(`O produto "${produto.nome}" está sem estoque.`);
            return;
        }
        setErro('');
        setItens(atuais => {
            const existente = atuais.find(item => item.id === produto.id);
            if(existente) {
                if(existente.quantidade >= Number(produto.estoque_atual)) {
                    setErro(`Estoque máximo disponível para "${produto.nome}": ${produto.estoque_atual}.`);
                    return atuais;
                }
                return atuais.map(
                    item => item.id === produto.id
                        ? {...item,quantidade:item.quantidade+1}
                        : item
                );
            }
            return [...atuais,{...produto,quantidade:1}];
        });
    }

    function alterarQuantidade(id,quantidade) {
        const novaQuantidade = Number(quantidade);
        setItens(atuais => atuais.map(
            item => {
                if(item.id !== id) return item;
                if(novaQuantidade > Number(item.estoque_atual)) {
                    setErro(`Estoque máximo disponível para "${item.nome}": ${item.estoque_atual}.`);
                    return item;
                }
                return {...item,quantidade:Math.max(novaQuantidade,1)};
            }
        ));
    }

    function removerItem(id){
        setItens(atuais => atuais.filter(item => item.id !==id ));
    }

    async function finalizarVenda(){
        if(itens.length===0){
            setErro('Adicione ao menos um produto à venda.');
            return;
        }
        if(formaPagamento === 'Crediário' &&! clienteId) {
            setErro('Venda no crediário exige um cliente selecionado.');
            return;
        }

        try{
            setSalvando(true);setErro('');
            const response = await criarVenda({
                cliente_id: clienteId 
                    ? Number(clienteId) 
                    :null,
                forma_pagamento: formaPagamento,
                desconto: Number(desconto||0),
                itens: itens.map(
                    item => ({
                        produto_id: item.id,
                        quantidade:item.quantidade
                    })
                )
            });
            navigate(`/vendas`);
            console.log('Venda criada:',response.data);
        } catch(error) {
            setErro(error.message);
        } finally { 
            setSalvando(false);
        }
    }

    return(
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className='page-title'>Nova venda</h1>
                    <p className='page-subtitle'>Selecione os produtos e finalize a venda.</p>
                </div>
                <button type="button" className="btn-secondary" onClick={()=>navigate('/vendas')}>Voltar</button>
            </div>

            {erro&&<div className="alert-error">{erro}</div>}

            <div className="sale-grid">
                <div>
                    <div className="form-field ws-mb-2">
                        <label>Buscar produto</label>
                        <input className='sale-product-search' value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} placeholder="Nome ou SKU"/>
                    </div>

                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th className='text-right'>Preço</th>
                                    <th>Estoque</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {produtosFiltrados.map(produto=>
                                    <tr key={produto.id}>
                                        <td>
                                            <strong>{produto.nome}</strong>
                                            <div>
                                                <small>{produto.sku||'Sem SKU'}</small>
                                            </div>
                                        </td>
                                        <td className='text-right' style={{ fontWeight: 600 }}>{moeda(produto.preco_venda)}</td>
                                        <td>{produto.estoque_atual}</td>
                                        <td>
                                            <button type="button" className="btn-secondary btn-small" onClick={()=>adicionarProduto(produto)}>Adicionar</button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <div className="form-field">
                        <label>Cliente</label>
                        <select value={clienteId} onChange={e => setClienteId(e.target.value)}>
                            <option value="">Consumidor final</option>
                            {clientes.map(cliente => 
                                <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                            )}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Forma de pagamento</label>
                        <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
                            <option>Dinheiro</option>
                            <option>Pix</option>
                            <option>Cartão de Débito</option>
                            <option>Cartão de Crédito</option>
                            <option>Crediário</option>
                        </select>
                    </div>

                    <h3>Itens</h3>

                    {itens.length===0?<div className="empty-state">Nenhum produto adicionado.</div>:(
                        <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Qtd.</th>
                                    <th className='text-right'>Subtotal</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {itens.map(item=>
                                    <tr key={item.id}>
                                        <td>{item.nome}</td>
                                        <td>
                                            <input type="number" min="1" max={Number(item.estoque_atual)} 
                                            value={item.quantidade} onChange={e => alterarQuantidade(item.id,e.target.value)} 
                                            className='sale-quantity-input'/>
                                        </td>
                                        <td className='text-right' style={{ fontWeight: 600 }}>{moeda(Number(item.preco_venda)*item.quantidade)}</td>
                                        <td>
                                            <button type="button" className="btn-danger btn-small" onClick={()=>removerItem(item.id)}>Remover</button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </div>
                    )}

                    <div className="form-field">
                        <label>Desconto</label>
                        <input type="number" min="0" step="0.01" value={desconto} onChange={e => setDesconto(e.target.value)}/>
                    </div>

                    <div className="sale-totals">
                        <p>Subtotal <strong>{moeda(totalBruto)}</strong></p>
                        <p>Desconto <strong>{moeda(desconto)}</strong></p>
                        <p className="sale-total-final">Total <strong>{moeda(total)}</strong></p>
                    </div>

                    <button 
                        type="button" 
                        className="btn-primary ws-mt-4"
                        disabled={salvando||itens.length===0} 
                        onClick={finalizarVenda}
                    >
                        {salvando?'Finalizando...':'Finalizar venda'}
                    </button>
                </div>
            </div>
        </div>
    );
}