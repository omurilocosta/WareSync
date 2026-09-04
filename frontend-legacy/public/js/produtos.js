

let produtosCache = [];
let categoriasCache = [];
let fornecedoresCache = [];
let editandoId = null;
let tipoMovimentacao = 'entrada';

function qs(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
  return el;
}

function formatMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function badgeEstoque(produto) {
  const atual = Number(produto.estoque_atual);
  const minimo = Number(produto.estoque_minimo);

  if (atual <= 0) return `<span class="stock-badge stock-out">Sem estoque</span>`;
  if (atual <= minimo) return `<span class="stock-badge stock-low">Estoque baixo</span>`;
  return `<span class="stock-badge stock-ok">Em estoque</span>`;
}

async function carregarCategorias() {
  try {
    const res = await fetch(`${API_BASE}/categorias`);
    const data = await res.json();
    categoriasCache = data.data || [];

    const list = document.getElementById('categoriasList');
    if (list) {
      list.innerHTML = categoriasCache.map((c) => `<option value="${c.nome}"></option>`).join('');
    }
  } catch (err) {
    categoriasCache = [];
  }
}

async function carregarFornecedores() {
  try {
    const res = await fetch(`${API_BASE}/fornecedores`);
    const data = await res.json();
    fornecedoresCache = data.data || [];
  } catch (err) {
    fornecedoresCache = [];
  }
}

async function carregarProdutos(busca) {
  const content = qs('#page-content');
  content.innerHTML = renderPageShell();

  const url = busca ? `${API_BASE}/produtos?busca=${encodeURIComponent(busca)}` : `${API_BASE}/produtos`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    produtosCache = data.data || [];
    renderTabela();
  } catch (err) {
    qs('#tabelaWrap').innerHTML = `<div class="empty-state">Não foi possível carregar os produtos. Verifique se o backend está rodando.</div>`;
  }
}

function renderPageShell() {
  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Produtos</h1>
        <p class="page-subtitle">Cadastro e controle de estoque</p>
      </div>
      <button class="btn-primary" id="novoProdutoBtn">+ Novo produto</button>
    </div>

    <div class="table-card" style="margin-bottom:16px">
      <div style="padding:12px 16px;border-bottom:1px solid var(--color-border)">
        <input type="text" id="buscaInput" placeholder="Buscar por nome ou SKU..."
          style="width:100%;border:1px solid var(--color-border);border-radius:8px;padding:9px 12px;font-size:13px;font-family:var(--font-sans);outline:none" />
      </div>
    </div>

    <div class="table-card" id="tabelaWrap"></div>
  `;
}

function renderTabela() {
  const wrap = qs('#tabelaWrap');

  if (produtosCache.length === 0) {
    wrap.innerHTML = `<div class="empty-state">Nenhum produto encontrado.</div>`;
    return;
  }

  const rows = produtosCache
    .map(
      (p) => `
      <tr>
        <td>${p.nome}</td>
        <td>${p.sku || '—'}</td>
        <td>${p.categoria_nome || '—'}</td>
        <td>${formatMoeda(p.preco_venda)}</td>
        <td>${Number(p.estoque_atual).toLocaleString('pt-BR')}</td>
        <td>${badgeEstoque(p)}</td>
        <td class="actions">
          <button class="btn-secondary" data-mov="${p.id}">Movimentar</button>
          <button class="btn-secondary" data-transferir="${p.id}">Transferir</button>
          <button class="btn-secondary" data-edit="${p.id}">Editar</button>
          <button class="btn-danger" data-delete="${p.id}">Inativar</button>
        </td>
      </tr>`
    )
    .join('');

  wrap.innerHTML = `
    <table class="data-table">
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
      <tbody>${rows}</tbody>
    </table>
  `;

  wrap.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => abrirModalEdicao(Number(btn.dataset.edit)));
  });
  wrap.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => confirmarInativacao(Number(btn.dataset.delete)));
  });
  wrap.querySelectorAll('[data-mov]').forEach((btn) => {
    btn.addEventListener('click', () => abrirModalMovimentacao(Number(btn.dataset.mov)));
  });
  wrap.querySelectorAll('[data-transferir]').forEach((btn) => {
    btn.addEventListener('click', () => registrarTransferencia(Number(btn.dataset.transferir)));
  });
}

async function registrarTransferencia(id) {
  const produto = produtosCache.find((p) => p.id === id);
  if (!produto) return;

  const origem = prompt(`Transferir "${produto.nome}" — local de origem:`, 'Estoque principal');
  if (!origem) return;

  const destino = prompt('Local de destino:', 'Loja 2');
  if (!destino) return;

  const quantidade = Number(prompt(`Quantidade a transferir (estoque atual: ${produto.estoque_atual}):`, '1'));
  if (!quantidade || quantidade <= 0) return;

  const res = await fetch(`${API_BASE}/transferencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ produto_id: id, quantidade, origem, destino }),
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.message || 'Não foi possível registrar a transferência.');
    return;
  }

  alert(
    'Transferência registrada no histórico. Observação: o Waresync ainda opera com estoque único consolidado, então o saldo total do produto não muda — a transferência fica só como registro auditável de para onde a mercadoria foi.'
  );
}

// ---------- Modal de produto ----------

function renderFornecedoresCheckboxes(selecionados = []) {
  const container = qs('#fornecedoresList');
  if (fornecedoresCache.length === 0) {
    container.innerHTML = `<span style="color:var(--color-text-faint)">Nenhum fornecedor cadastrado ainda.</span>`;
    return;
  }
  container.innerHTML = fornecedoresCache
    .map(
      (f) => `
      <label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer">
        <input type="checkbox" value="${f.id}" ${selecionados.includes(f.id) ? 'checked' : ''} class="fornecedor-check" />
        ${f.nome}
      </label>`
    )
    .join('');
}

function abrirModalNovo() {
  editandoId = null;
  qs('#modalTitle').textContent = 'Novo produto';
  qs('#produtoForm').reset();
  clearFormError();
  renderFornecedoresCheckboxes();
  qs('#produtoModal').classList.add('show');
}

async function abrirModalEdicao(id) {
  const produto = produtosCache.find((p) => p.id === id);
  if (!produto) return;

  editandoId = id;
  qs('#modalTitle').textContent = 'Editar produto';
  clearFormError();

  qs('#nome').value = produto.nome || '';
  qs('#sku').value = produto.sku || '';
  qs('#codigoBarras').value = produto.codigo_barras || '';
  qs('#descricao').value = produto.descricao || '';
  qs('#grupo').value = produto.grupo || '';
  qs('#unidadeMedida').value = produto.unidade_medida || 'UN';
  qs('#categoria').value = produto.categoria_nome || '';
  qs('#precoVenda').value = produto.preco_venda || '';
  qs('#precoCusto').value = produto.preco_custo || '';
  qs('#estoqueMinimo').value = produto.estoque_minimo || '';
  qs('#estoqueMaximo').value = produto.estoque_maximo || '';
  qs('#ncm').value = produto.ncm || '';
  qs('#cfop').value = produto.cfop || '';
  qs('#cest').value = produto.cest || '';
  qs('#origemFiscal').value = produto.origem_fiscal || '0';

  const res = await fetch(`${API_BASE}/fornecedores/produto/${id}`);
  const data = await res.json();
  const vinculados = (data.data || []).map((f) => f.id);
  renderFornecedoresCheckboxes(vinculados);

  qs('#produtoModal').classList.add('show');
}

function fecharModal() {
  qs('#produtoModal').classList.remove('show');
}

function showFormError(message) {
  const box = qs('#formError');
  box.textContent = message;
  box.classList.add('show');
}

function clearFormError() {
  qs('#formError').classList.remove('show');
}

async function resolverCategoriaId(nomeCategoria) {
  if (!nomeCategoria) return null;

  const existente = categoriasCache.find((c) => c.nome.toLowerCase() === nomeCategoria.toLowerCase());
  if (existente) return existente.id;

  // Categoria nova — cria na hora
  const res = await fetch(`${API_BASE}/categorias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: nomeCategoria }),
  });
  const data = await res.json();
  if (data.success) {
    categoriasCache.push(data.data);
    return data.data.id;
  }
  return null;
}

async function salvarProduto(event) {
  event.preventDefault();
  clearFormError();

  const nome = qs('#nome').value.trim();
  if (!nome) {
    showFormError('O nome do produto é obrigatório.');
    return;
  }

  const saveBtn = qs('#saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvando...';

  try {
    const categoriaId = await resolverCategoriaId(qs('#categoria').value.trim());

    const payload = {
      nome,
      sku: qs('#sku').value.trim(),
      codigo_barras: qs('#codigoBarras').value.trim(),
      descricao: qs('#descricao').value.trim(),
      grupo: qs('#grupo').value.trim(),
      unidade_medida: qs('#unidadeMedida').value,
      categoria_id: categoriaId,
      preco_venda: Number(qs('#precoVenda').value) || 0,
      preco_custo: Number(qs('#precoCusto').value) || 0,
      estoque_minimo: Number(qs('#estoqueMinimo').value) || 0,
      estoque_maximo: qs('#estoqueMaximo').value ? Number(qs('#estoqueMaximo').value) : null,
      ncm: qs('#ncm').value.trim(),
      cfop: qs('#cfop').value.trim(),
      cest: qs('#cest').value.trim(),
      origem_fiscal: qs('#origemFiscal').value,
    };

    const url = editandoId ? `${API_BASE}/produtos/${editandoId}` : `${API_BASE}/produtos`;
    const method = editandoId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.success) {
      showFormError(data.message || 'Não foi possível salvar o produto.');
      return;
    }

    const produtoId = editandoId || data.data.id;
    const fornecedorIds = Array.from(document.querySelectorAll('.fornecedor-check:checked')).map((el) =>
      Number(el.value)
    );

    await fetch(`${API_BASE}/fornecedores/produto/${produtoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fornecedor_ids: fornecedorIds }),
    });

    fecharModal();
    carregarProdutos(qs('#buscaInput')?.value);
  } catch (err) {
    showFormError('Não foi possível conectar ao servidor.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Salvar';
  }
}

async function confirmarInativacao(id) {
  const produto = produtosCache.find((p) => p.id === id);
  if (!produto) return;

  const confirmado = window.confirm(`Inativar o produto "${produto.nome}"?`);
  if (!confirmado) return;

  try {
    await fetch(`${API_BASE}/produtos/${id}`, { method: 'DELETE' });
    carregarProdutos(qs('#buscaInput')?.value);
  } catch (err) {
    alert('Não foi possível inativar o produto.');
  }
}

// ---------- Modal de movimentação de estoque ----------

function abrirModalMovimentacao(id) {
  const produto = produtosCache.find((p) => p.id === id);
  if (!produto) return;

  qs('#movProdutoId').value = id;
  qs('#movProdutoNome').textContent = produto.nome;
  qs('#movEstoqueAtual').textContent = Number(produto.estoque_atual).toLocaleString('pt-BR');
  qs('#movForm').reset();
  clearMovFormError();
  selecionarTipoMovimentacao('entrada');

  qs('#movModal').classList.add('show');
}

function fecharModalMovimentacao() {
  qs('#movModal').classList.remove('show');
}

function selecionarTipoMovimentacao(tipo) {
  tipoMovimentacao = tipo;

  document.querySelectorAll('.mov-type-btn').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.tipo === tipo);
  });

  const label = qs('#movQuantidadeLabel');
  if (tipo === 'entrada') label.textContent = 'Quantidade a adicionar';
  else if (tipo === 'saida') label.textContent = 'Quantidade a retirar';
  else label.textContent = 'Novo valor de estoque (ajuste)';
}

function showMovFormError(message) {
  const box = qs('#movFormError');
  box.textContent = message;
  box.classList.add('show');
}

function clearMovFormError() {
  qs('#movFormError').classList.remove('show');
}

async function salvarMovimentacao(event) {
  event.preventDefault();
  clearMovFormError();

  const produtoId = Number(qs('#movProdutoId').value);
  const quantidade = Number(qs('#movQuantidade').value);
  const motivo = qs('#movMotivo').value.trim();

  if (!quantidade || quantidade < 0) {
    showMovFormError('Informe uma quantidade válida.');
    return;
  }

  const saveBtn = qs('#movSaveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Confirmando...';

  try {
    const res = await fetch(`${API_BASE}/produtos/${produtoId}/movimentacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: tipoMovimentacao, quantidade, motivo }),
    });

    const data = await res.json();

    if (!data.success) {
      showMovFormError(data.message || 'Não foi possível registrar a movimentação.');
      return;
    }

    fecharModalMovimentacao();
    carregarProdutos(qs('#buscaInput')?.value);
  } catch (err) {
    showMovFormError('Não foi possível conectar ao servidor.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Confirmar';
  }
}

// ---------- Eventos ----------

document.addEventListener('shell:ready', async () => {
  await carregarCategorias();
  await carregarFornecedores();
  carregarProdutos();

  document.body.addEventListener('click', (e) => {
    if (e.target.id === 'novoProdutoBtn') abrirModalNovo();
    if (e.target.id === 'cancelBtn') fecharModal();
    if (e.target.id === 'movCancelBtn') fecharModalMovimentacao();
    if (e.target.classList.contains('mov-type-btn')) selecionarTipoMovimentacao(e.target.dataset.tipo);
  });

  document.body.addEventListener('submit', (e) => {
    if (e.target.id === 'produtoForm') salvarProduto(e);
    if (e.target.id === 'movForm') salvarMovimentacao(e);
  });

  let debounce;
  document.body.addEventListener('input', (e) => {
    if (e.target.id === 'buscaInput') {
      clearTimeout(debounce);
      debounce = setTimeout(() => carregarProdutos(e.target.value), 300);
    }
  });

  qs('#produtoModal').addEventListener('click', (e) => {
    if (e.target.id === 'produtoModal') fecharModal();
  });
  qs('#movModal').addEventListener('click', (e) => {
    if (e.target.id === 'movModal') fecharModalMovimentacao();
  });
});
