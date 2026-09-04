

function qs(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
  return el;
}

function formatData(iso) {
  return new Date(iso).toLocaleString('pt-BR');
}

const STATUS_LABEL = { contagem: 'Em contagem', conferencia: 'Em conferência', finalizado: 'Finalizado' };

async function carregarLista() {
  const content = qs('#page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventário</h1>
        <p class="page-subtitle">Contagem física e conferência de divergências de estoque</p>
      </div>
      <button class="btn-primary" id="novoInventarioBtn">+ Novo inventário</button>
    </div>
    <div class="table-card" id="listaWrap"><div class="empty-state">Carregando...</div></div>
  `;

  const res = await fetch(`${API_BASE}/inventarios`);
  const data = await res.json();
  const inventarios = data.data || [];

  const rows = inventarios.length
    ? inventarios
        .map(
          (i) => `
        <tr>
          <td>#${i.id}</td>
          <td>${i.usuario_nome}</td>
          <td>${formatData(i.criado_em)}</td>
          <td><span class="badge-status badge-${i.status}">${STATUS_LABEL[i.status]}</span></td>
          <td class="actions"><button class="btn-secondary" data-abrir="${i.id}">Abrir</button></td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="5" class="empty-state">Nenhum inventário criado ainda.</td></tr>`;

  qs('#listaWrap').innerHTML = `
    <table class="data-table">
      <thead><tr><th>#</th><th>Responsável</th><th>Criado em</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  qs('#novoInventarioBtn').addEventListener('click', criarInventario);
  document.querySelectorAll('[data-abrir]').forEach((btn) => {
    btn.addEventListener('click', () => carregarDetalhe(Number(btn.dataset.abrir)));
  });
}

async function criarInventario() {
  if (!confirm('Criar um novo inventário? Isso vai tirar uma "foto" do estoque atual de todos os produtos ativos para contagem.')) return;

  const res = await fetch(`${API_BASE}/inventarios`, { method: 'POST' });
  const data = await res.json();

  if (!data.success) {
    alert(data.message || 'Não foi possível criar o inventário.');
    return;
  }

  carregarDetalhe(data.data.id);
}

async function carregarDetalhe(id) {
  const content = qs('#page-content');
  content.innerHTML = `<div class="empty-state">Carregando inventário...</div>`;

  const res = await fetch(`${API_BASE}/inventarios/${id}`);
  const { data: inventario } = await res.json();

  if (inventario.status === 'contagem') {
    renderContagem(inventario);
  } else if (inventario.status === 'conferencia') {
    renderConferencia(inventario);
  } else {
    renderFinalizado(inventario);
  }
}

function renderContagem(inventario) {
  const content = qs('#page-content');

  const rows = inventario.itens
    .map(
      (item) => `
      <tr>
        <td>${item.produto_nome}</td>
        <td>${item.sku || '—'}</td>
        <td>${Number(item.estoque_sistema).toLocaleString('pt-BR')}</td>
        <td><input type="number" class="qty-input-inv" data-produto="${item.produto_id}" min="0" step="0.01" placeholder="Contar" /></td>
      </tr>`
    )
    .join('');

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventário #${inventario.id} — Contagem</h1>
        <p class="page-subtitle">Informe a quantidade contada fisicamente para cada produto</p>
      </div>
      <button class="btn-secondary" id="voltarBtn">← Voltar</button>
    </div>
    <div class="table-card">
      <table class="data-table">
        <thead><tr><th>Produto</th><th>SKU</th><th>Estoque no sistema</th><th>Contagem física</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="margin-top:16px;text-align:right">
      <button class="btn-primary" id="salvarContagemBtn">Salvar contagem e ir para conferência</button>
    </div>
  `;

  qs('#voltarBtn').addEventListener('click', carregarLista);
  qs('#salvarContagemBtn').addEventListener('click', async () => {
    const itens = Array.from(document.querySelectorAll('.qty-input-inv'))
      .filter((input) => input.value !== '')
      .map((input) => ({ produto_id: Number(input.dataset.produto), estoque_contado: Number(input.value) }));

    if (itens.length === 0) {
      alert('Informe a contagem de ao menos um produto.');
      return;
    }

    await fetch(`${API_BASE}/inventarios/${inventario.id}/contagem`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens }),
    });

    carregarDetalhe(inventario.id);
  });
}

function renderConferencia(inventario) {
  const content = qs('#page-content');

  const itensContados = inventario.itens.filter((i) => i.estoque_contado !== null);
  const divergentes = itensContados.filter((i) => Number(i.divergencia) !== 0);

  const rows = itensContados
    .map((item) => {
      const div = Number(item.divergencia);
      const cls = div > 0 ? 'divergencia-pos' : div < 0 ? 'divergencia-neg' : '';
      const sinal = div > 0 ? '+' : '';
      return `
        <tr>
          <td>${item.produto_nome}</td>
          <td>${Number(item.estoque_sistema).toLocaleString('pt-BR')}</td>
          <td>${Number(item.estoque_contado).toLocaleString('pt-BR')}</td>
          <td class="${cls}">${sinal}${div.toLocaleString('pt-BR')}</td>
        </tr>`;
    })
    .join('');

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventário #${inventario.id} — Conferência</h1>
        <p class="page-subtitle">${divergentes.length} produto(s) com divergência de ${itensContados.length} contado(s)</p>
      </div>
      <button class="btn-secondary" id="voltarBtn">← Voltar</button>
    </div>
    <div class="table-card">
      <table class="data-table">
        <thead><tr><th>Produto</th><th>Sistema</th><th>Contado</th><th>Divergência</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="margin-top:16px;text-align:right">
      <button class="btn-primary" id="finalizarBtn">Finalizar inventário (aplica ajustes no estoque)</button>
    </div>
  `;

  qs('#voltarBtn').addEventListener('click', carregarLista);
  qs('#finalizarBtn').addEventListener('click', async () => {
    if (!confirm('Finalizar o inventário? As divergências serão aplicadas como ajuste de estoque, e isso não pode ser desfeito.')) return;

    const res = await fetch(`${API_BASE}/inventarios/${inventario.id}/finalizar`, { method: 'POST' });
    const data = await res.json();

    if (!data.success) {
      alert(data.message || 'Não foi possível finalizar. Verifique se você tem permissão (gestor/admin).');
      return;
    }

    alert(data.message);
    carregarLista();
  });
}

function renderFinalizado(inventario) {
  const content = qs('#page-content');
  const rows = inventario.itens
    .filter((i) => i.estoque_contado !== null)
    .map(
      (item) => `
      <tr>
        <td>${item.produto_nome}</td>
        <td>${Number(item.estoque_sistema).toLocaleString('pt-BR')}</td>
        <td>${Number(item.estoque_contado).toLocaleString('pt-BR')}</td>
        <td>${Number(item.divergencia).toLocaleString('pt-BR')}</td>
      </tr>`
    )
    .join('');

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventário #${inventario.id} — Finalizado</h1>
        <p class="page-subtitle">Concluído em ${formatData(inventario.finalizado_em)}</p>
      </div>
      <button class="btn-secondary" id="voltarBtn">← Voltar</button>
    </div>
    <div class="table-card">
      <table class="data-table">
        <thead><tr><th>Produto</th><th>Sistema (antes)</th><th>Contado</th><th>Divergência aplicada</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
  qs('#voltarBtn').addEventListener('click', carregarLista);
}

document.addEventListener('shell:ready', carregarLista);
