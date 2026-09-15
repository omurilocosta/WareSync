import { useEffect, useState } from 'react';
import { atualizarCliente, buscarDetalhesCliente, criarCliente, inativarCliente, listarClientes } from '../services/clientesService';
import { useToast } from '../contexts/ToastContext';
import { formatarDocumento, validarDocumento, formatarTelefone, validarTelefone } from '../utils/documento';
import { listarFornecedores, criarFornecedor, atualizarFornecedor } from '../services/fornecedoresService';
import { listarFuncionarios, criarFuncionario, atualizarFuncionario, inativarFuncionario } from '../services/funcionariosService';

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor || 0));
}

export default function Clientes() {
    const toast = useToast();
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
        cep: '',
        observacoes: '',
        limite_credito: '',
    });

    const [clienteEmEdicao, setClienteEmEdicao] =useState(null);

    const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
    const [clienteDetalhes, setClienteDetalhes] = useState(null);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);

    const [abaAtiva, setAbaAtiva] = useState('cliente');

    const [fornecedores, setFornecedores] = useState([]);
    const [buscaFornecedor, setBuscaFornecedor] = useState('');
    const [carregandoFornecedores, setCarregandoFornecedores] = useState(false);

    const [modalFornecedorAberto, setModalFornecedorAberto] = useState(false);
    const [fornecedorEditando, setFornecedorEditando] = useState(null);

    const [fornecedorForm, setFornecedorForm] = useState({
        nome: '',
        documento: '',
        telefone: '',
        email: '',
        endereco: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: '',
    });

    const [funcionarios, setFuncionarios] = useState([]);
    const [buscaFuncionario, setBuscaFuncionario] = useState('');
    const [carregandoFuncionarios, setCarregandoFuncionarios] = useState(false);

    const [modalFuncionarioAberto, setModalFuncionarioAberto] = useState(false);
    const [funcionarioEditando, setFuncionarioEditando] = useState(null);

    const [funcionarioForm, setFuncionarioForm] = useState({
        nome: '',
        documento: '',
        telefone: '',
        email: '',
        senha: '',
        cargo: 'operacional',
        cep: '',
        endereco: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        observacoes: '',
    });

    const [funcionarioParaInativar, setFuncionarioParaInativar] = useState(null);

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

        let novoValor = value;

        if (name === 'telefone') {
            novoValor = formatarTelefone(value);
        }

        if (name === 'documento') {
            novoValor = formatarDocumento(value);
        }

        setForm((anterior) => ({
            ...anterior,
            [name]: novoValor,
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
            cep: '',
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
            toast.warning('O nome do cliente é obrigatório.');
            return;
        }
        if (form.documento.trim() && !validarDocumento(form.documento)) {
            toast.warning('Informe um CPF ou CNPJ válido.')
            return;
        }
        if (form.telefone.trim() && !validarTelefone(form.telefone)) {
            toast.warning('Informe um telefone válido com DDD.');
            return;
        }
        if (form.endereco.trim() && !form.numero.trim()) {
            toast.warning('Informe o número do endereço.');
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
                cep: form.cep.trim() || null,
                observacoes: form.observacoes.trim() || null,
                limite_credito: form.limite_credito === '' ? 0 : Number(form.limite_credito),
            };
            if (clienteEmEdicao) {
                await atualizarCliente(
                    clienteEmEdicao.id,
                    dados
                )
                toast.success('Cliente atualizado com sucesso.');
            } else {
                await criarCliente(dados)
                toast.success('Cliente criado com sucesso.');
            }

            fecharModal();
            await carregarClientes(busca);
        } catch (error) {
            const mensagem = error?.message || 'Não foi possível salvar o cliente.';
            setErro(mensagem);
            toast.error(mensagem);
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
            cep: cliente.cep || '',
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
            toast.success('Cliente inativado com sucesso.');
            await carregarClientes(busca)
        } catch (error) {
            const mensagem = error?.message || 'Não foi possível inativar o cliente.';
            toast.error(mensagem);
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

    async function buscarCep() {
        const cep = form.cep.replace(/\D/g, '');

        if (!cep) {
            return;
        }

        if (cep.length !== 8) {
            toast.warning('Informe um CEP válido com 8 dígitos.');
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

            if (!response.ok) {
                throw new Error('Não foi possível consultar o CEP.');
            }

            const dadosCep = await response.json();

            if (dadosCep.erro) {
                toast.warning('CEP não encontrado.');
                return;
            }

            setForm((anterior) => ({
                ...anterior,
                cep: dadosCep.cep || anterior.cep,
                endereco: dadosCep.logradouro || '',
                bairro: dadosCep.bairro || '',
                cidade: dadosCep.localidade || '',
                estado: dadosCep.uf || '',
            }));

            toast.success('Endereço encontrado.');
        } catch (error) {
            toast.error(
            error?.message ||
            'Não foi possível consultar o CEP.'
            );
        }
    }

    async function carregarFornecedores() {
        try {
            setCarregandoFornecedores(true);
            const response = await listarFornecedores(buscaFornecedor);
            setFornecedores(response.data || []);
        } catch (error) {
            toast.error( error?.message || 'Não foi possível carregar os fornecedores.' );
        } finally {
            setCarregandoFornecedores(false);
        }
    }

    useEffect(() => {
        if (abaAtiva === 'fornecedor') {
            carregarFornecedores();
        }
    }, [abaAtiva, buscaFornecedor]);

    useEffect(() => {
        const timer = setTimeout(() => {
            carregarClientes(busca);
        }, 300);
        return () => clearTimeout(timer);
    }, [busca]);

    function limparFornecedorForm() {
        setFornecedorForm({
            nome: '',
            documento: '',
            telefone: '',
            email: '',
            cep: '',
            endereco: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: '',
            observacoes: '',
        });
    }

    function abrirNovoFornecedor() {
        setFornecedorEditando(null);
        limparFornecedorForm();
        setModalFornecedorAberto(true);
    }

    function fecharModalFornecedor() {
        setModalFornecedorAberto(false);
        setFornecedorEditando(null);
        limparFornecedorForm();
    }

    function handleFornecedorChange(event) {
        const { name, value } = event.target;

        let novoValor = value;

        if (name === 'documento') {
            novoValor = formatarDocumento(value);
        }

        if (name === 'telefone') {
            novoValor = formatarTelefone(value);
        }

        if (name === 'cep') {
            const numeros = value
                .replace(/\D/g, '')
                .slice(0, 8);

            novoValor = numeros.replace(
                /^(\d{5})(\d)/,
                '$1-$2'
            );
        }

        if (name === 'estado') {
            novoValor = value
                .replace(/[^a-zA-Z]/g, '')
                .slice(0, 2)
                .toUpperCase();
        }

        setFornecedorForm((anterior) => ({
            ...anterior,
            [name]: novoValor,
        }));
    }

    async function buscarCepFornecedor() {
        const cep = fornecedorForm.cep.replace(/\D/g, '');

        if (!cep) {
            return;
        }

        if (cep.length !== 8) {
            toast.warning( 'Informe um CEP válido com 8 dígitos.' );
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

            if (!response.ok) {
                throw new Error( 'Não foi possível consultar o CEP.' );
            }

            const dadosCep = await response.json();

            if (dadosCep.erro) {
                toast.warning('CEP não encontrado.');
                return;
            }

            setFornecedorForm((anterior) => ({
                ...anterior,
                cep: dadosCep.cep || anterior.cep,
                endereco: dadosCep.logradouro || '',
                bairro: dadosCep.bairro || '',
                cidade: dadosCep.localidade || '',
                estado: dadosCep.uf || '',
            }));

            toast.success('Endereço encontrado.');
        } catch (error) {
            toast.error( error?.message || 'Não foi possível consultar o CEP.' );
        }
    }

    async function handleSalvarFornecedor(event) {
        event.preventDefault();

        if (!fornecedorForm.nome.trim()) {
            toast.warning( 'O nome do fornecedor é obrigatório.' );
            return;
        }
        if ( fornecedorForm.documento.trim() && !validarDocumento(fornecedorForm.documento) ) {
            toast.warning( 'Informe um CPF ou CNPJ válido.' );
            return;
        }
        if ( fornecedorForm.telefone.trim() && !validarTelefone(fornecedorForm.telefone) ) {
            toast.warning( 'Informe um telefone válido com DDD.' );
            return;
        }
        if ( fornecedorForm.endereco.trim() && !fornecedorForm.numero.trim() ) {
            toast.warning( 'Informe o número do endereço.' );
            return;
        }

        const cepNumeros = fornecedorForm.cep.replace(/\D/g, '');

        if ( fornecedorForm.cep.trim() && cepNumeros.length !== 8 ) {
            toast.warning( 'Informe um CEP válido com 8 dígitos.' );
            return;
        }

        const dados = {
            nome: fornecedorForm.nome.trim(),
            documento: fornecedorForm.documento.trim() || null,
            telefone: fornecedorForm.telefone.trim() || null,
            email: fornecedorForm.email.trim() || null, 
            cep: fornecedorForm.cep.trim() || null, 
            endereco: fornecedorForm.endereco.trim() || null, 
            numero: fornecedorForm.numero.trim() || null, 
            bairro: fornecedorForm.bairro.trim() || null, 
            cidade: fornecedorForm.cidade.trim() || null, 
            estado: fornecedorForm.estado.trim() || null, 
            observacoes: fornecedorForm.observacoes.trim() || null,
        };

        try {
            if (fornecedorEditando) {
                await atualizarFornecedor( fornecedorEditando.id, dados );
                toast.success( 'Fornecedor atualizado com sucesso.' );
            } else {
                await criarFornecedor(dados);
                toast.success( 'Fornecedor cadastrado com sucesso.' );
            }
            fecharModalFornecedor();
            await carregarFornecedores();
        } catch (error) {
            toast.error(error?.message || 'Não foi possível salvar o fornecedor.' );
        }
    }

    async function carregarFuncionarios() {
        try {
            setCarregandoFuncionarios(true);

            const response = await listarFuncionarios(
                buscaFuncionario
            );

            setFuncionarios(response.data || []);
        } catch (error) {
            toast.error(
                error?.message ||
                'Não foi possível carregar os funcionários.'
            );
        } finally {
            setCarregandoFuncionarios(false);
        }
    }
    useEffect(() => {
        if (abaAtiva === 'funcionario') {
            carregarFuncionarios();
        }
    }, [abaAtiva, buscaFuncionario]);
    function limparFuncionarioForm() {
    setFuncionarioForm({
        nome: '',
        documento: '',
        telefone: '',
        email: '',
        senha: '',
        cargo: 'operacional',
        cep: '',
        endereco: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        observacoes: '',
    });
    }
    function fecharModalFuncionario() {
        setModalFuncionarioAberto(false);
        setFuncionarioEditando(null);
        limparFuncionarioForm();
    }
    async function buscarCepFuncionario() {
    const cep = funcionarioForm.cep.replace(/\D/g, '');

    if (!cep) {
        return;
    }

    if (cep.length !== 8) {
        toast.warning(
            'Informe um CEP válido com 8 dígitos.'
        );
        return;
    }

    try {
        const response = await fetch(
            `https://viacep.com.br/ws/${cep}/json/`
        );

        if (!response.ok) {
            throw new Error(
                'Não foi possível consultar o CEP.'
            );
        }

        const dadosCep = await response.json();

        if (dadosCep.erro) {
            toast.warning('CEP não encontrado.');
            return;
        }

        setFuncionarioForm((anterior) => ({
            ...anterior,
            cep: dadosCep.cep || anterior.cep,
            endereco: dadosCep.logradouro || '',
            bairro: dadosCep.bairro || '',
            cidade: dadosCep.localidade || '',
            estado: dadosCep.uf || '',
        }));

        toast.success('Endereço encontrado.');
    } catch (error) {
        toast.error(
            error?.message ||
            'Não foi possível consultar o CEP.'
        );
    }
    }
    async function handleSalvarFuncionario(event) {
    event.preventDefault();

    if (!funcionarioForm.nome.trim()) {
        toast.warning(
            'O nome do funcionário é obrigatório.'
        );
        return;
    }

    if (!funcionarioForm.email.trim()) {
        toast.warning(
            'O e-mail do funcionário é obrigatório.'
        );
        return;
    }

    if (
        !funcionarioEditando &&
        funcionarioForm.senha.length < 6
    ) {
        toast.warning(
            'A senha precisa ter pelo menos 6 caracteres.'
        );
        return;
    }

    if (
        funcionarioEditando &&
        funcionarioForm.senha &&
        funcionarioForm.senha.length < 6
    ) {
        toast.warning(
            'A nova senha precisa ter pelo menos 6 caracteres.'
        );
        return;
    }

    if (
        funcionarioForm.documento.trim() &&
        !validarDocumento(funcionarioForm.documento)
    ) {
        toast.warning(
            'Informe um CPF ou CNPJ válido.'
        );
        return;
    }

    if (
        funcionarioForm.telefone.trim() &&
        !validarTelefone(funcionarioForm.telefone)
    ) {
        toast.warning(
            'Informe um telefone válido com DDD.'
        );
        return;
    }

    if (
        funcionarioForm.endereco.trim() &&
        !funcionarioForm.numero.trim()
    ) {
        toast.warning(
            'Informe o número do endereço.'
        );
        return;
    }

    const cepNumeros =
        funcionarioForm.cep.replace(/\D/g, '');

    if (
        funcionarioForm.cep.trim() &&
        cepNumeros.length !== 8
    ) {
        toast.warning(
            'Informe um CEP válido com 8 dígitos.'
        );
        return;
    }

    const dados = {
        nome: funcionarioForm.nome.trim(),
        documento:
            funcionarioForm.documento.trim() || null,
        telefone:
            funcionarioForm.telefone.trim() || null,
        email: funcionarioForm.email.trim(),
        cargo: funcionarioForm.cargo,
        cep:
            funcionarioForm.cep.trim() || null,
        endereco:
            funcionarioForm.endereco.trim() || null,
        numero:
            funcionarioForm.numero.trim() || null,
        bairro:
            funcionarioForm.bairro.trim() || null,
        cidade:
            funcionarioForm.cidade.trim() || null,
        estado:
            funcionarioForm.estado.trim() || null,
        observacoes:
            funcionarioForm.observacoes.trim() || null,
    };

    if (funcionarioForm.senha) {
        dados.senha = funcionarioForm.senha;
    }

    try {
        if (funcionarioEditando) {
            await atualizarFuncionario(
                funcionarioEditando.id,
                dados
            );

            toast.success(
                'Funcionário atualizado com sucesso.'
            );
        } else {
            await criarFuncionario({
                ...dados,
                senha: funcionarioForm.senha,
            });

            toast.success(
                'Funcionário cadastrado com sucesso.'
            );
        }

        fecharModalFuncionario();
        await carregarFuncionarios();
    } catch (error) {
        toast.error(
            error?.message ||
            'Não foi possível salvar o funcionário.'
        );
    }
    }
    function handleFuncionarioChange(event) {
        const { name, value } = event.target;

        let novoValor = value;

        if (name === 'documento') {
            novoValor = formatarDocumento(value);
        }

        if (name === 'telefone') {
            novoValor = formatarTelefone(value);
        }

        if (name === 'cep') {
            const numeros = value
                .replace(/\D/g, '')
                .slice(0, 8);

            novoValor = numeros.replace(
                /^(\d{5})(\d)/,
                '$1-$2'
            );
        }

        if (name === 'estado') {
            novoValor = value
                .replace(/[^a-zA-Z]/g, '')
                .slice(0, 2)
                .toUpperCase();
        }

        setFuncionarioForm((anterior) => ({
            ...anterior,
            [name]: novoValor,
        }));
    }
    async function handleInativarFuncionario() {
        if (!funcionarioParaInativar) {
            return;
        }

        try {
            await inativarFuncionario(
                funcionarioParaInativar.id
            );

            toast.success(
                'Funcionário inativado com sucesso.'
            );

            setFuncionarioParaInativar(null);

            await carregarFuncionarios();
        } catch (error) {
            toast.error(
                error?.message ||
                'Não foi possível inativar o funcionário.'
            );
        }
    }

    return (
        <div className="page-container">
            <div className="cadastro-tabs">
                <button type="button" className={`cadastro-tab ${abaAtiva === 'cliente' ? 'active' : ''}`} onClick={() => setAbaAtiva('cliente')}>Cliente</button>
                <button type="button" className={`cadastro-tab ${abaAtiva === 'fornecedor' ? 'active' : ''}`} onClick={() => setAbaAtiva('fornecedor')}>Fornecedor</button>
                <button type="button" className={`cadastro-tab ${abaAtiva === 'funcionario' ? 'active' : ''}`} onClick={() => setAbaAtiva('funcionario')}>Funcionário</button>
            </div>

            {abaAtiva === 'cliente' && (
                <>
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

                                            <div className="form-field">
                                                <label>CEP</label>
                                                <div className='cep-field'>
                                                    <input name="cep" value={form.cep} onChange={handleChange} onBlur={buscarCep} maxLength={9} placeholder="Ex.: 00000-000"/>
                                                    <button type="button" className="btn-secondary" onClick={buscarCep}>Buscar</button>
                                                </div>
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
                </>
            )}
            {abaAtiva === 'fornecedor' && (
                <>
                    <div className="page-header">
                        <div>
                            <h1 className='page-title'>Fornecedores</h1>
                            <p className='page-subtitle'>Gerencie os fornecedores cadastrados no sistema.</p>
                        </div>
                        <button type="button" className="btn-primary" onClick={abrirNovoFornecedor} >
                            + Novo fornecedor
                        </button>
                    </div>
                    <div className="page-toolbar">
                        <input className='clientes-search' type="search" value={buscaFornecedor} onChange={(event) => setBuscaFornecedor(event.target.value) } placeholder="Buscar fornecedor..." />                
                    </div>

                    <div className="table-wrapper">
                        <table className='data-table'>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Documento</th>
                                    <th>Telefone</th>
                                    <th>E-mail</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {carregandoFornecedores ? (
                                    <tr>
                                        <td colSpan="5">Carregando fornecedores...</td>
                                    </tr>
                                ) : fornecedores.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">Nenhum fornecedor encontrado.</td>
                                    </tr>
                                ) : (
                                    fornecedores.map((fornecedor) => (
                                        <tr key={fornecedor.id}>
                                            <td>{fornecedor.nome}</td>
                                            <td> {fornecedor.documento ? formatarDocumento( fornecedor.documento ) : '-'} </td>
                                            <td> {fornecedor.telefone ? formatarTelefone( fornecedor.telefone ) : '-'} </td>
                                            <td>{fornecedor.email || '-'}</td>
                                            <td>
                                                <button type="button" className="btn-secondary btn-small"
                                                    onClick={() => {
                                                        setFornecedorEditando(
                                                            fornecedor
                                                        );

                                                        setFornecedorForm({
                                                            nome: fornecedor.nome || '',
                                                            documento: formatarDocumento(fornecedor.documento || ''),
                                                            telefone: formatarTelefone( fornecedor.telefone || '' ), 
                                                            email: fornecedor.email || '',
                                                            cep: fornecedor.cep || '',
                                                            endereco: fornecedor.endereco || '',
                                                            numero: fornecedor.numero || '',
                                                            bairro: fornecedor.bairro || '',
                                                            cidade: fornecedor.cidade || '',
                                                            estado: fornecedor.estado || '',
                                                            observacoes: fornecedor.observacoes || '',
                                                        });

                                                        setModalFornecedorAberto(
                                                            true
                                                        );
                                                    }}
                                                >
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {modalFornecedorAberto && (
                        <div className="modal-backdrop">
                            <div className="modal-card">
                                <div className="modal-header">
                                    <div>
                                        <h2>{fornecedorEditando ? 'Editar fornecedor' : 'Novo fornecedor'} </h2>
                                        <p> Informe os dados do fornecedor. </p>
                                    </div>
                                    <button type="button" className="modal-close" onClick={fecharModalFornecedor} > × </button>
                                </div>

                                <form onSubmit={handleSalvarFornecedor}>
                                    <div className="modal-body">
                                        <div className="form-field">
                                            <label>Nome *</label>
                                            <input name="nome" value={fornecedorForm.nome} onChange={handleFornecedorChange} required />
                                        </div>

                                        <div className="form-grid">
                                            <div className="form-field">
                                                <label>CPF / CNPJ</label>
                                                <input name="documento" value={fornecedorForm.documento} onChange={handleFornecedorChange} maxLength={18} />
                                            </div>

                                            <div className="form-field">
                                                <label>Telefone</label>
                                                <input name="telefone" value={fornecedorForm.telefone} onChange={handleFornecedorChange} maxLength={15} />
                                            </div>

                                            <div className="form-field">
                                                <label>E-mail</label>
                                                <input type="email" name="email" value={fornecedorForm.email} onChange={handleFornecedorChange} />
                                            </div>

                                            <div className="form-field">
                                                <label>CEP</label>
                                                <div className="cep-field">
                                                    <input name="cep" value={fornecedorForm.cep} onChange={handleFornecedorChange} onBlur={buscarCepFornecedor} maxLength={9} />
                                                    <button type="button" className="btn-secondary btn-small" onClick={buscarCepFornecedor} > Buscar </button>
                                                </div>
                                            </div>

                                            <div className="form-field">
                                                <label>Endereço</label>
                                                <input name="endereco" value={fornecedorForm.endereco} onChange={handleFornecedorChange} />
                                            </div>

                                            <div className="form-field">
                                                <label>Número</label>
                                                <input name="numero" value={fornecedorForm.numero} onChange={handleFornecedorChange} maxLength={20} />
                                            </div>

                                            <div className="form-field">
                                                <label>Bairro</label>
                                                <input name="bairro" value={fornecedorForm.bairro} onChange={handleFornecedorChange} />
                                            </div>

                                            <div className="form-field">
                                                <label>Cidade</label>
                                                <input name="cidade" value={fornecedorForm.cidade} onChange={handleFornecedorChange} />
                                            </div>

                                            <div className="form-field">
                                                <label>Estado</label>
                                                <input name="estado" value={fornecedorForm.estado} onChange={handleFornecedorChange} maxLength={2} />
                                            </div>
                                        </div>

                                        <div className="form-field">
                                            <label>Observações</label>
                                            <textarea name="observacoes" value={fornecedorForm.observacoes} onChange={handleFornecedorChange} rows={3} />
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button type="button" className="btn-secondary" onClick={fecharModalFornecedor} > Cancelar </button>
                                        <button type="submit" className="btn-primary" > {fornecedorEditando ? 'Salvar alterações' : 'Cadastrar fornecedor'} </button> 
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
            {abaAtiva === 'funcionario' && (
                <>
                    <div className="page-header">
                        <div>
                            <h1 className='page-title'>Funcionários</h1>
                            <p className='page-subtitle'>Gerencie os funcionários cadastrados no sistema.</p>
                        </div>
                        <button type="button" className="btn-primary" onClick={() => {
                                setFuncionarioEditando(null);
                                setFuncionarioForm({
                                    nome: '',
                                    documento: '',
                                    telefone: '',
                                    email: '',
                                    senha: '',
                                    cargo: 'operacional',
                                    cep: '',
                                    endereco: '',
                                    numero: '',
                                    bairro: '',
                                    cidade: '',
                                    estado: '',
                                    observacoes: '',
                                });
                                setModalFuncionarioAberto(true);
                            }}
                        >
                            + Novo funcionário
                        </button>
                    </div>
                    <div className="page-toolbar">
                        <input className='clientes-search'
                            type="text"
                            value={buscaFuncionario}
                            onChange={(event) =>
                                setBuscaFuncionario(event.target.value)
                            }
                            placeholder="Buscar funcionário..."
                        />

                        
                    </div>

                    <div className="table-wraper">
                        <table className='data-table'>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Documento</th>
                                    <th>Telefone</th>
                                    <th>E-mail</th>
                                    <th>Cargo</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {carregandoFuncionarios ? (
                                    <tr>
                                        <td colSpan="6">
                                            Carregando funcionários...
                                        </td>
                                    </tr>
                                ) : funcionarios.length === 0 ? (
                                    <tr>
                                        <td colSpan="6">
                                            Nenhum funcionário encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    funcionarios.map((funcionario) => (
                                        <tr key={funcionario.id}>
                                            <td>{funcionario.nome}</td>

                                            <td>
                                                {funcionario.documento
                                                    ? formatarDocumento(
                                                        funcionario.documento
                                                    )
                                                    : '-'}
                                            </td>

                                            <td>
                                                {funcionario.telefone
                                                    ? formatarTelefone(
                                                        funcionario.telefone
                                                    )
                                                    : '-'}
                                            </td>

                                            <td>
                                                {funcionario.email || '-'}
                                            </td>

                                            <td>
                                                {funcionario.cargo || '-'}
                                            </td>

                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        type="button"
                                                        className="btn-secondary btn-small"
                                                        onClick={() => {
                                                            setFuncionarioEditando(
                                                                funcionario
                                                            );

                                                            setFuncionarioForm({
                                                                nome:
                                                                    funcionario.nome ||
                                                                    '',
                                                                documento:
                                                                    formatarDocumento(
                                                                        funcionario.documento ||
                                                                            ''
                                                                    ),
                                                                telefone:
                                                                    formatarTelefone(
                                                                        funcionario.telefone ||
                                                                            ''
                                                                    ),
                                                                email:
                                                                    funcionario.email ||
                                                                    '',
                                                                senha: '',
                                                                cargo:
                                                                    funcionario.cargo ||
                                                                    'operacional',
                                                                cep:
                                                                    funcionario.cep ||
                                                                    '',
                                                                endereco:
                                                                    funcionario.endereco ||
                                                                    '',
                                                                numero:
                                                                    funcionario.numero ||
                                                                    '',
                                                                bairro:
                                                                    funcionario.bairro ||
                                                                    '',
                                                                cidade:
                                                                    funcionario.cidade ||
                                                                    '',
                                                                estado:
                                                                    funcionario.estado ||
                                                                    '',
                                                                observacoes:
                                                                    funcionario.observacoes ||
                                                                    '',
                                                            });

                                                            setModalFuncionarioAberto(
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button type='button' className='btn-danger btn-small' onClick={() => setFuncionarioParaInativar(funcionario)}>Inativar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {modalFuncionarioAberto && (
                        <div className="modal-backdrop">
                            <div className="modal-card">
                                <div className="modal-header">
                                    <div>
                                        <h2>
                                            {funcionarioEditando
                                                ? 'Editar funcionário'
                                                : 'Novo funcionário'}
                                        </h2>

                                        <p>
                                            Informe os dados e o acesso do funcionário.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="modal-close"
                                        onClick={fecharModalFuncionario}
                                    >
                                        ×
                                    </button>
                                </div>

                                <form onSubmit={handleSalvarFuncionario}>
                                    <div className="modal-body">
                                        <div className="form-field">
                                            <label>Nome *</label>
                                            <input
                                                name="nome"
                                                value={funcionarioForm.nome}
                                                onChange={handleFuncionarioChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-grid">
                                            <div className="form-field">
                                                <label>CPF / CNPJ</label>
                                                <input
                                                    name="documento"
                                                    value={funcionarioForm.documento}
                                                    onChange={handleFuncionarioChange}
                                                    maxLength={18}
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label>Telefone</label>
                                                <input
                                                    name="telefone"
                                                    value={funcionarioForm.telefone}
                                                    onChange={handleFuncionarioChange}
                                                    maxLength={15}
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label>E-mail *</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={funcionarioForm.email}
                                                    onChange={handleFuncionarioChange}
                                                    required
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label>Cargo *</label>

                                                <select
                                                    name="cargo"
                                                    value={funcionarioForm.cargo}
                                                    onChange={handleFuncionarioChange}
                                                >
                                                    <option value="operacional">
                                                        Operacional
                                                    </option>

                                                    <option value="gestor">
                                                        Gestor
                                                    </option>

                                                    <option value="administrador">
                                                        Administrador
                                                    </option>
                                                </select>
                                            </div>

                                            <div className="form-field">
                                                <label>
                                                    {funcionarioEditando
                                                        ? 'Nova senha'
                                                        : 'Senha *'}
                                                </label>

                                                <input
                                                    type="password"
                                                    name="senha"
                                                    value={funcionarioForm.senha}
                                                    onChange={handleFuncionarioChange}
                                                    placeholder={
                                                        funcionarioEditando
                                                            ? 'Deixe vazio para manter'
                                                            : 'Mínimo de 6 caracteres'
                                                    }
                                                    required={!funcionarioEditando}
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label>CEP</label>

                                                <div className="cep-field">
                                                    <input
                                                        name="cep"
                                                        value={funcionarioForm.cep}
                                                        onChange={handleFuncionarioChange}
                                                        onBlur={buscarCepFuncionario}
                                                        maxLength={9}
                                                    />

                                                    <button
                                                        type="button"
                                                        className="btn-secondary btn-small"
                                                        onClick={buscarCepFuncionario}
                                                    >
                                                        Buscar
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="form-field">
                                                <label>Endereço</label>
                                                <input
                                                    name="endereco"
                                                    value={funcionarioForm.endereco}
                                                    onChange={handleFuncionarioChange}
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label>Número</label>
                                                <input
                                                    name="numero"
                                                    value={funcionarioForm.numero}
                                                    onChange={handleFuncionarioChange}
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label>Bairro</label>
                                                <input
                                                    name="bairro"
                                                    value={funcionarioForm.bairro}
                                                    onChange={handleFuncionarioChange}
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label>Cidade</label>
                                                <input
                                                    name="cidade"
                                                    value={funcionarioForm.cidade}
                                                    onChange={handleFuncionarioChange}
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label>Estado</label>
                                                <input
                                                    name="estado"
                                                    value={funcionarioForm.estado}
                                                    onChange={handleFuncionarioChange}
                                                    maxLength={2}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-field">
                                            <label>Observações</label>

                                            <textarea
                                                name="observacoes"
                                                value={funcionarioForm.observacoes}
                                                onChange={handleFuncionarioChange}
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={fecharModalFuncionario}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn-primary"
                                        >
                                            {funcionarioEditando
                                                ? 'Salvar alterações'
                                                : 'Cadastrar funcionário'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                    {funcionarioParaInativar && (
                        <div className="modal-backdrop">
                            <div className="modal-card modal-card-small">
                                <div className="modal-header">
                                    <div>
                                        <h2>Inativar funcionário</h2>

                                        <p>
                                            Confirme a inativação deste usuário.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="modal-close"
                                        onClick={() =>
                                            setFuncionarioParaInativar(null)
                                        }
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="modal-body">
                                    <p>
                                        Deseja realmente inativar{' '}
                                        <strong>
                                            {funcionarioParaInativar.nome}
                                        </strong>
                                        ?
                                    </p>

                                    <p className="table-muted">
                                        O funcionário não poderá mais acessar
                                        o sistema enquanto estiver inativo.
                                    </p>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() =>
                                            setFuncionarioParaInativar(null)
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-danger"
                                        onClick={handleInativarFuncionario}
                                    >
                                        Inativar funcionário
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
} 