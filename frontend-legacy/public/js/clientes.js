

let clientesCache = [];
let editandoId = null;

function qs(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
  return el;
}

function formatMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function carregarClientes(busca) {
  const content = qs('#page-content');
  content.innerHTML = renderPageShell();

  const url = busca
    ? `${API_BASE}/clientes?busca=${encodeURIComponent(busca)}`
    : `${API_BASE}/clientes`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    clientesCache = data.data || [];
    renderTabela();
  } catch (err) {
    qs('#tabelaWrap').innerHTML = `<div class="empty-state">Não foi possível carregar os clientes. Verifique se o backend está rodando.</div>`;
  }
}

function renderPageShell() {
  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">Cadastro e consulta de clientes</p>
      </div>
      <button class="btn-primary" id="novoClienteBtn">+ Novo cliente</button>
    </div>

    <div class="table-card" style="margin-bottom:16px">
      <div style="padding:12px 16px;border-bottom:1px solid var(--color-border)">
        <input type="text" id="buscaInput" placeholder="Buscar por nome, documento ou e-mail..."
          style="width:100%;border:1px solid var(--color-border);border-radius:8px;padding:9px 12px;font-size:13px;font-family:var(--font-sans);outline:none" />
      </div>
    </div>

    <div class="table-card" id="tabelaWrap"></div>
  `;
}

function renderTabela() {
  const wrap = qs('#tabelaWrap');

  if (clientesCache.length === 0) {
    wrap.innerHTML = `<div class="empty-state">Nenhum cliente encontrado.</div>`;
    return;
  }

  const rows = clientesCache
    .map(
      (c) => `
      <tr>
        <td>${c.nome}</td>
        <td>${c.documento || '—'}</td>
        <td>${c.email || '—'}</td>
        <td>${c.telefone || '—'}</td>
        <td>${formatMoeda(c.limite_credito)}</td>
        <td class="actions">
          <button class="btn-secondary" data-ver="${c.id}">Ver</button>
          <button class="btn-secondary" data-edit="${c.id}">Editar</button>
          <button class="btn-danger" data-delete="${c.id}">Inativar</button>
        </td>
      </tr>`
    )
    .join('');

  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Documento</th>
          <th>E-mail</th>
          <th>Telefone</th>
          <th>Limite de crédito</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  wrap.querySelectorAll('[data-ver]').forEach((btn) => {
    btn.addEventListener('click', () => verDetalhes(Number(btn.dataset.ver)));
  });
  wrap.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => abrirModalEdicao(Number(btn.dataset.edit)));
  });
  wrap.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => confirmarInativacao(Number(btn.dataset.delete)));
  });
}

async function verDetalhes(id) {
  const res = await fetch(`${API_BASE}/clientes/${id}/detalhes`);
  const data = await res.json();
  const c = data.data;

  const comprasRows = c.historico_compras.length
    ? c.historico_compras
        .map((v) => `<tr><td>#${v.id}</td><td>${new Date(v.criado_em).toLocaleDateString('pt-BR')}</td><td class="text-right">${formatMoeda(v.total)}</td></tr>`)
        .join('')
    : `<tr><td colspan="3" class="empty-state">Nenhuma compra ainda.</td></tr>`;

  qs('#detalheClienteTitulo').textContent = c.nome;
  qs('#detalheClienteConteudo').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div><p style="font-size:12px;color:var(--color-text-faint);margin:0">Total comprado</p><p style="font-weight:600;margin:2px 0 0">${formatMoeda(c.valor_total_comprado)}</p></div>
      <div><p style="font-size:12px;color:var(--color-text-faint);margin:0">Saldo devedor</p><p style="font-weight:600;color:var(--color-danger-text);margin:2px 0 0">${formatMoeda(c.saldo_devedor)}</p></div>
      <div><p style="font-size:12px;color:var(--color-text-faint);margin:0">Crédito disponível</p><p style="font-weight:600;color:var(--color-success-text);margin:2px 0 0">${formatMoeda(c.limite_disponivel)}</p></div>
    </div>
    <p style="font-size:13px;color:var(--color-text-faint);margin:0 0 12px">
      ${c.endereco || ''} ${c.numero || ''}${c.bairro ? ', ' + c.bairro : ''}${c.cidade ? ' — ' + c.cidade : ''}${c.estado ? '/' + c.estado : ''}
    </p>
    ${c.observacoes ? `<p style="font-size:13px;color:var(--color-text-faint);margin:0 0 12px"><strong>Obs:</strong> ${c.observacoes}</p>` : ''}
    <table class="data-table">
      <thead><tr><th>Venda</th><th>Data</th><th class="text-right">Valor</th></tr></thead>
      <tbody>${comprasRows}</tbody>
    </table>
  `;

  qs('#detalheClienteModal').classList.add('show');
}

function abrirModalNovo() {
  editandoId = null;
  qs('#modalTitle').textContent = 'Novo cliente';
  qs('#clienteForm').reset();
  clearFormError();
  qs('#clienteModal').classList.add('show');
}

function abrirModalEdicao(id) {
  const cliente = clientesCache.find((c) => c.id === id);
  if (!cliente) return;

  editandoId = id;
  qs('#modalTitle').textContent = 'Editar cliente';
  clearFormError();

  qs('#nome').value = cliente.nome || '';
  qs('#documento').value = cliente.documento || '';
  qs('#telefone').value = cliente.telefone || '';
  qs('#email').value = cliente.email || '';
  qs('#endereco').value = cliente.endereco || '';
  qs('#numero').value = cliente.numero || '';
  qs('#bairro').value = cliente.bairro || '';
  qs('#cidade').value = cliente.cidade || '';
  qs('#estado').value = cliente.estado || '';
  qs('#observacoes').value = cliente.observacoes || '';
  qs('#limiteCredito').value = cliente.limite_credito || '';

  qs('#clienteModal').classList.add('show');
}

function fecharModal() {
  qs('#clienteModal').classList.remove('show');
}

function showFormError(message) {
  const box = qs('#formError');
  box.textContent = message;
  box.classList.add('show');
}

function clearFormError() {
  qs('#formError').classList.remove('show');
}

async function salvarCliente(event) {
  event.preventDefault();
  clearFormError();

  const payload = {
    nome: qs('#nome').value.trim(),
    documento: qs('#documento').value.trim(),
    telefone: qs('#telefone').value.trim(),
    email: qs('#email').value.trim(),
    endereco: qs('#endereco').value.trim(),
    numero: qs('#numero').value.trim(),
    bairro: qs('#bairro').value.trim(),
    cidade: qs('#cidade').value.trim(),
    estado: qs('#estado').value.trim().toUpperCase(),
    observacoes: qs('#observacoes').value.trim(),
    limite_credito: Number(qs('#limiteCredito').value) || 0,
  };

  if (!payload.nome) {
    showFormError('O nome do cliente é obrigatório.');
    return;
  }

  const saveBtn = qs('#saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvando...';

  try {
    const url = editandoId ? `${API_BASE}/clientes/${editandoId}` : `${API_BASE}/clientes`;
    const method = editandoId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.success) {
      showFormError(data.message || 'Não foi possível salvar o cliente.');
      return;
    }

    fecharModal();
    carregarClientes(qs('#buscaInput')?.value);
  } catch (err) {
    showFormError('Não foi possível conectar ao servidor.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Salvar';
  }
}

async function confirmarInativacao(id) {
  const cliente = clientesCache.find((c) => c.id === id);
  if (!cliente) return;

  const confirmado = window.confirm(`Inativar o cliente "${cliente.nome}"? Ele deixará de aparecer nas listagens.`);
  if (!confirmado) return;

  try {
    await fetch(`${API_BASE}/clientes/${id}`, { method: 'DELETE' });
    carregarClientes(qs('#buscaInput')?.value);
  } catch (err) {
    alert('Não foi possível inativar o cliente.');
  }
}

document.addEventListener('shell:ready', () => {
  carregarClientes();

  document.body.addEventListener('click', (e) => {
    if (e.target.id === 'novoClienteBtn') abrirModalNovo();
    if (e.target.id === 'cancelBtn') fecharModal();
  });

  document.body.addEventListener('submit', (e) => {
    if (e.target.id === 'clienteForm') salvarCliente(e);
  });

  let debounce;
  document.body.addEventListener('input', (e) => {
    if (e.target.id === 'buscaInput') {
      clearTimeout(debounce);
      debounce = setTimeout(() => carregarClientes(e.target.value), 300);
    }
  });

  qs('#clienteModal').addEventListener('click', (e) => {
    if (e.target.id === 'clienteModal') fecharModal();
  });

  qs('#fecharDetalheClienteBtn').addEventListener('click', () => qs('#detalheClienteModal').classList.remove('show'));
  qs('#detalheClienteModal').addEventListener('click', (e) => {
    if (e.target.id === 'detalheClienteModal') qs('#detalheClienteModal').classList.remove('show');
  });
});
