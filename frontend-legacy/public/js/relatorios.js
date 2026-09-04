
let abaRelatorio = 'vendas';

function qs(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
  return el;
}

function formatMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function periodoPadrao() {
  const fim = new Date().toISOString().slice(0, 10);
  const inicio = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  return { inicio, fim };
}

function renderShellPage() {
  const { inicio, fim } = periodoPadrao();

  qs('#page-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Relatórios</h1>
        <p class="page-subtitle">Vendas, estoque e financeiro</p>
      </div>
    </div>
    <div class="tabs">
      <button class="tab-btn" data-tab="vendas">Vendas</button>
      <button class="tab-btn" data-tab="estoque">Estoque</button>
      <button class="tab-btn" data-tab="financeiro">Financeiro</button>
    </div>
    <div class="filtro-periodo" id="filtroPeriodo" style="display:none">
      <label style="font-size:13px;color:var(--color-text-faint)">De</label>
      <input type="date" id="filtroInicio" value="${inicio}" />
      <label style="font-size:13px;color:var(--color-text-faint)">até</label>
      <input type="date" id="filtroFim" value="${fim}" />
      <button class="btn-secondary" id="aplicarFiltroBtn">Aplicar</button>
    </div>
    <div id="tabContent"></div>
  `;
}

function ativarAba(tab) {
  abaRelatorio = tab;
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  qs('#filtroPeriodo').style.display = tab === 'estoque' ? 'none' : 'flex';

  if (tab === 'vendas') carregarRelatorioVendas();
  if (tab === 'estoque') carregarRelatorioEstoque();
  if (tab === 'financeiro') carregarRelatorioFinanceiro();
}

function getPeriodo() {
  return {
    inicio: qs('#filtroInicio')?.value || periodoPadrao().inicio,
    fim: qs('#filtroFim')?.value || periodoPadrao().fim,
  };
}

// ---------- Vendas ----------

async function carregarRelatorioVendas() {
  const { inicio, fim } = getPeriodo();
  qs('#tabContent').innerHTML = `<div class="empty-state">Carregando...</div>`;

  const res = await fetch(`${API_BASE}/relatorios/vendas?inicio=${inicio}&fim=${fim}`);
  const { data } = await res.json();

  const porVendedorRows = data.por_vendedor.length
    ? data.por_vendedor
        .map((v) => `<tr><td>${v.vendedor}</td><td>${v.quantidade}</td><td class="text-right">${formatMoeda(v.total)}</td></tr>`)
        .join('')
    : `<tr><td colspan="3" class="empty-state">Sem vendas no período.</td></tr>`;

  const porProdutoRows = data.por_produto.length
    ? data.por_produto
        .map((p) => `<tr><td>${p.produto}</td><td>${Number(p.quantidade).toLocaleString('pt-BR')}</td><td class="text-right">${formatMoeda(p.total)}</td></tr>`)
        .join('')
    : `<tr><td colspan="3" class="empty-state">Sem vendas no período.</td></tr>`;

  qs('#tabContent').innerHTML = `
    <div class="kpi-grid">
      <div class="card"><p class="kpi-label">Total vendido no período</p><p class="kpi-value">${formatMoeda(data.resumo.total)}</p></div>
      <div class="card"><p class="kpi-label">Quantidade de vendas</p><p class="kpi-value">${data.resumo.quantidade}</p></div>
      <div class="card"><p class="kpi-label">Ticket médio</p><p class="kpi-value">${formatMoeda(data.resumo.quantidade > 0 ? data.resumo.total / data.resumo.quantidade : 0)}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="table-card">
        <div style="padding:14px 16px;border-bottom:1px solid var(--color-border);font-size:14px;font-weight:600">Por vendedor</div>
        <table class="data-table"><thead><tr><th>Vendedor</th><th>Vendas</th><th class="text-right">Total</th></tr></thead><tbody>${porVendedorRows}</tbody></table>
      </div>
      <div class="table-card">
        <div style="padding:14px 16px;border-bottom:1px solid var(--color-border);font-size:14px;font-weight:600">Produtos mais vendidos</div>
        <table class="data-table"><thead><tr><th>Produto</th><th>Qtd.</th><th class="text-right">Total</th></tr></thead><tbody>${porProdutoRows}</tbody></table>
      </div>
    </div>
  `;
}

// ---------- Estoque ----------

async function carregarRelatorioEstoque() {
  qs('#tabContent').innerHTML = `<div class="empty-state">Carregando...</div>`;

  const res = await fetch(`${API_BASE}/relatorios/estoque`);
  const { data } = await res.json();

  const produtosRows = data.produtos.length
    ? data.produtos
        .map(
          (p) => `
        <tr>
          <td>${p.nome}</td><td>${p.categoria_nome || '—'}</td>
          <td>${Number(p.estoque_atual).toLocaleString('pt-BR')}</td>
          <td class="text-right">${formatMoeda(p.valor_em_estoque)}</td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="4" class="empty-state">Nenhum produto cadastrado.</td></tr>`;

  const semVendaRows = data.produtos_sem_venda.length
    ? data.produtos_sem_venda.map((p) => `<tr><td>${p.nome}</td><td>${p.sku || '—'}</td></tr>`).join('')
    : `<tr><td colspan="2" class="empty-state">Todos os produtos já tiveram alguma venda. 🎉</td></tr>`;

  qs('#tabContent').innerHTML = `
    <div class="kpi-grid">
      <div class="card"><p class="kpi-label">Valor total em estoque</p><p class="kpi-value">${formatMoeda(data.valor_total_estoque)}</p></div>
      <div class="card"><p class="kpi-label">Produtos sem nenhuma venda</p><p class="kpi-value">${data.produtos_sem_venda.length}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px">
      <div class="table-card">
        <div style="padding:14px 16px;border-bottom:1px solid var(--color-border);font-size:14px;font-weight:600">Estoque atual (por valor)</div>
        <table class="data-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th class="text-right">Valor</th></tr></thead><tbody>${produtosRows}</tbody></table>
      </div>
      <div class="table-card">
        <div style="padding:14px 16px;border-bottom:1px solid var(--color-border);font-size:14px;font-weight:600">Produtos sem venda</div>
        <table class="data-table"><thead><tr><th>Produto</th><th>SKU</th></tr></thead><tbody>${semVendaRows}</tbody></table>
      </div>
    </div>
  `;
}

// ---------- Financeiro (DRE) ----------

async function carregarRelatorioFinanceiro() {
  const { inicio, fim } = getPeriodo();
  qs('#tabContent').innerHTML = `<div class="empty-state">Carregando...</div>`;

  const res = await fetch(`${API_BASE}/relatorios/financeiro?inicio=${inicio}&fim=${fim}`);
  const { data } = await res.json();

  qs('#tabContent').innerHTML = `
    <div class="kpi-grid">
      <div class="card"><p class="kpi-label">Receita bruta</p><p class="kpi-value">${formatMoeda(data.dre.receita_bruta)}</p></div>
      <div class="card"><p class="kpi-label">Custo dos produtos vendidos</p><p class="kpi-value">${formatMoeda(data.dre.custo_produtos_vendidos)}</p></div>
      <div class="card"><p class="kpi-label">Lucro bruto</p><p class="kpi-value">${formatMoeda(data.dre.lucro_bruto)}</p></div>
      <div class="card"><p class="kpi-label">Margem</p><p class="kpi-value">${data.dre.margem}%</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card">
        <p class="kpi-label">Contas a pagar em aberto</p>
        <p class="kpi-value" style="color:var(--color-danger-text)">${formatMoeda(data.contas_pagar_em_aberto)}</p>
      </div>
      <div class="card">
        <p class="kpi-label">Contas a receber pendentes</p>
        <p class="kpi-value" style="color:var(--color-success-text)">${formatMoeda(data.contas_receber_pendentes)}</p>
      </div>
    </div>
  `;
}

document.addEventListener('shell:ready', () => {
  renderShellPage();
  ativarAba(new URLSearchParams(window.location.search).get('aba') || 'vendas');

  document.body.addEventListener('click', (e) => {
    if (e.target.dataset.tab) ativarAba(e.target.dataset.tab);
    if (e.target.id === 'aplicarFiltroBtn') ativarAba(abaRelatorio);
  });
});
