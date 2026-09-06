import { useEffect,useState } from 'react';
import { buscarVendaPorId, cancelarVenda, listarVendas } from '../services/vendasService';
import { useNavigate } from 'react-router';


function formatarMoeda(valor){
    return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(valor||0));
}
function formatarData(data){
    return new Date(data).toLocaleString('pt-BR');
}

export default function Vendas(){
    const [vendas,setVendas]=useState([]);
    const [carregando,setCarregando]=useState(true);
    const [erro,setErro]=useState('');
    const [filtros,setFiltros]=useState({
        numero:'',
        cliente:'',
        vendedor:'',
        status:'',
        data:''
    });

    const [modalDetalhesAberto,setModalDetalhesAberto]=useState(false);
    const [vendaDetalhes,setVendaDetalhes]=useState(null);
    const [carregandoDetalhes,setCarregandoDetalhes]=useState(false);

    const [modalCancelarAberto,setModalCancelarAberto]=useState(false);
    const [vendaCancelar,setVendaCancelar]=useState(null);
    const [motivoCancelamento,setMotivoCancelamento]=useState('');
    const [cancelando,setCancelando]=useState(false);

    const navigate=useNavigate();

    async function carregarVendas(){
        try{
            setCarregando(true);setErro('');
            const response=await listarVendas(filtros);
            setVendas(response.data||[]);
        } catch(error){
            setErro(error.message);
        } finally{
            setCarregando(false);
        }
    }

    async function abrirDetalhes(venda){
        try{setErro('');
            setCarregandoDetalhes(true);
            setModalDetalhesAberto(true);
            setVendaDetalhes(null);
            
            const response = await buscarVendaPorId(venda.id);
            setVendaDetalhes(response.data);
        } catch(error) {
            setErro(error.message);
            setModalDetalhesAberto(false);
        } finally {
            setCarregandoDetalhes(false);
        }
    }

    function abrirCancelamento(venda){
        setVendaCancelar(venda);
        setMotivoCancelamento('');
        setErro('');setModalCancelarAberto(true);
    }
    async function confirmarCancelamento(){
        if(!motivoCancelamento.trim()){
            setErro('Informe o motivo do cancelamento.');
            return;
        }
        try{
            setCancelando(true);
            setErro('');
            
            await cancelarVenda(vendaCancelar.id,motivoCancelamento.trim());

            setModalCancelarAberto(false);
            setVendaCancelar(null);
            setMotivoCancelamento('');
            
            await carregarVendas();
        } catch (error){
            setErro(error.message);
        } finally {
            setCancelando(false);
        }
    }

    useEffect(()=>{
        const timer = setTimeout(carregarVendas,300);
        return () => clearTimeout(timer);
    },[filtros]);

    function handleFiltro(event){
        const {name,value} = event.target;
        setFiltros(anterior=>({
            ...anterior,
            [name]:value})
        );
    }

    return(
        <div className="page-container">
            <div className="page-header">
                <div><h1>Vendas</h1><p>Consulte e gerencie as vendas realizadas.</p></div>
                <button type="button" className="btn-primary" onClick={()=>navigate('/vendas/nova')}>+ Nova venda</button>
            </div>

            <div className="page-toolbar">
                <input name="numero" placeholder="Número" value={filtros.numero} onChange={handleFiltro}/>
                <input name="cliente" placeholder="Cliente" value={filtros.cliente} onChange={handleFiltro}/>
                <input name="vendedor" placeholder="Vendedor" value={filtros.vendedor} onChange={handleFiltro}/>
                <input type="date" name="data" value={filtros.data} onChange={handleFiltro}/>
                <select name="status" value={filtros.status} onChange={handleFiltro}>
                    <option value="">Todos os status</option>
                    <option value="finalizada">Finalizada</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="aberta">Aberta</option>
                </select>
            </div>

            {erro&&<div className="alert-error">{erro}</div>}

            {carregando?
            <div className="empty-state">Carregando vendas...</div>
            :vendas.length===0 ?
                <div className="empty-state">Nenhuma venda encontrada.</div>:(
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Vendedor</th>
                                <th>Pagamento</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendas.map(venda=>(
                                <tr key={venda.id}>
                                    <td>#{venda.id}</td>
                                    <td>{formatarData(venda.criado_em)}</td>
                                    <td>{venda.cliente_nome||'Consumidor final'}</td>
                                    <td>{venda.usuario_nome||'—'}</td>
                                    <td>{venda.forma_pagamento||'—'}</td>
                                    <td>{formatarMoeda(venda.total)}</td>
                                    <td>{venda.status}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button type="button" className="btn-icon" onClick={()=>abrirDetalhes(venda)}>Detalhes</button>
                                            {venda.status==='finalizada'&&
                                                <button type="button" className="btn-icon btn-danger" onClick={() => abrirCancelamento(venda)}>Cancelar</button>
                                            }
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modalDetalhesAberto&&(
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <div className="modal-header">
                            <div>
                                <h2>Venda #{vendaDetalhes?.id||''}
                                </h2><p>Detalhes da venda e produtos vendidos.</p>
                            </div>
                            <button type="button" className="modal-close" onClick={()=>{setModalDetalhesAberto(false);setVendaDetalhes(null);}}>×</button>
                        </div>

                        <div className="modal-body">
                            {carregandoDetalhes?<div className="empty-state">Carregando detalhes...</div>:vendaDetalhes&&(
                                <>
                                    <div className="client-summary-grid">
                                        <div className="summary-card">
                                            <span>Cliente</span>
                                            <strong>{vendaDetalhes.cliente_nome||'Consumidor final'}</strong>
                                        </div>
                                        <div className="summary-card">
                                            <span>Vendedor</span>
                                            <strong>{vendaDetalhes.usuario_nome||'—'}</strong>
                                        </div>
                                        <div className="summary-card">
                                            <span>Pagamento</span>
                                            <strong>{vendaDetalhes.forma_pagamento||'—'}</strong>
                                        </div>
                                        <div className="summary-card">
                                            <span>Total</span>
                                            <strong>{formatarMoeda(vendaDetalhes.total)}</strong>
                                        </div>
                                    </div>

                                    <div className="client-details-info">
                                        <p><strong>Data:</strong> {formatarData(vendaDetalhes.criado_em)}</p>
                                        <p><strong>Status:</strong> {vendaDetalhes.status}</p>
                                        <p><strong>Desconto:</strong> {formatarMoeda(vendaDetalhes.desconto)}</p>
                                    </div>

                                    <h3>Itens da venda</h3>

                                    {vendaDetalhes.itens?.length?(
                                        <div className="table-wrapper">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Produto</th>
                                                        <th>Quantidade</th>
                                                        <th>Preço unitário</th>
                                                        <th>Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vendaDetalhes.itens.map(item => 
                                                        <tr key={item.id}>
                                                            <td>{item.produto_nome||`Produto #${item.produto_id}`}</td>
                                                            <td>{item.quantidade}</td>
                                                            <td>{formatarMoeda(item.preco_unitario)}</td>
                                                            <td>{formatarMoeda(item.subtotal)}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ):<div className="empty-state">Nenhum item encontrado.</div>}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {modalCancelarAberto&&
                <div className="modal-backdrop">
                    <div className="modal-card modal-card-small">
                        <div className="modal-header">
                            <div>
                                <h2>Cancelar venda #{vendaCancelar?.id}</h2>
                                <p>O estoque será devolvido e o lançamento financeiro será estornado.</p>
                            </div>
                            <button type="button" className="modal-close" onClick={()=>setModalCancelarAberto(false)}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="form-field">
                                <label>Motivo do cancelamento *</label>
                                <textarea rows={4} value={motivoCancelamento} onChange={e=>setMotivoCancelamento(e.target.value)} placeholder="Informe o motivo..."/>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setModalCancelarAberto(false)}>Voltar</button>
                            <button type="button" className="btn-primary" disabled={cancelando} 
                                onClick={confirmarCancelamento}>{
                                    cancelando
                                        ?'Cancelando...'
                                        :'Confirmar cancelamento'
                                }
                            </button>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}