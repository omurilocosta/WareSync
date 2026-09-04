
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

async function carregarDashboard() {
  const content = qs('#page-content');
  content.innerHTML = `<div class="empty-state">Carregando painel...</div>`;

  try {
    const res = await fetch(`${API_BASE}/dashboard/resumo`);
    const data = await res.json();

    if (!data.success) {
      content.innerHTML = `<div class="empty-state">Não foi possível carregar o painel.</div>`;
      return;
    }

    renderDashboard(data.data);
  } catch (err) {
    content.innerHTML = `<div class="empty-state">Não foi possível conectar ao servidor. Verifique se o backend está rodando.</div>`;
  }
}

function renderDashboard(resumo) {
  const content = qs('#page-content');

  const estoqueBaixoRows = resumo.produtos_estoque_baixo.length
    ? resumo.produtos_estoque_baixo
        .map(
          (p) => `
        <tr>
          <td>${p.nome}</td>
          <td>${p.sku || '—'}</td>
          <td>${p.categoria_nome || '—'}</td>
          <td>${Number(p.estoque_atual).toLocaleString('pt-BR')}</td>
          <td><span class="badge-warning">Mín: ${Number(p.estoque_minimo).toLocaleString('pt-BR')}</span></td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="5" style="text-align:center;color:var(--color-text-faint);padding:24px">Nenhum produto abaixo do estoque mínimo. 🎉</td></tr>`;

  const clientesRows = resumo.clientes_recentes.length
    ? resumo.clientes_recentes
        .map(
          (c) => `
        <tr>
          <td>${c.nome}</td>
          <td>${c.email || '—'}</td>
          <td>${formatData(c.criado_em)}</td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="3" style="text-align:center;color:var(--color-text-faint);padding:24px">Nenhum cliente cadastrado ainda.</td></tr>`;

  const vendasRecentesRows = resumo.vendas_recentes.length
    ? resumo.vendas_recentes
        .map(
          (v) => `
        <tr>
          <td>${v.cliente_nome || 'Consumidor final'}</td>
          <td>${v.usuario_nome}</td>
          <td>${v.forma_pagamento || '—'}</td>
          <td class="text-right" style="font-weight:500">${formatMoeda(v.total)}</td>
          <td class="actions"><a href="vendas-consulta.html" class="btn-secondary" style="text-decoration:none">Ver / Devolver</a></td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="5" style="text-align:center;color:var(--color-text-faint);padding:24px">Nenhuma venda registrada ainda.</td></tr>`;

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Painel geral</h1>
        <p class="page-subtitle">Visão geral do Waresync</p>
      </div>
      <a href="produtos.html" class="btn-primary" style="text-decoration:none">+ Novo produto</a>
    </div>

    <div class="kpi-grid">
      <div class="card">
        <p class="kpi-label">Clientes ativos</p>
        <p class="kpi-value">${resumo.total_clientes}</p>
        <p class="kpi-hint">cadastrados no sistema</p>
      </div>
      <div class="card">
        <p class="kpi-label">Produtos ativos</p>
        <p class="kpi-value">${resumo.total_produtos}</p>
        <p class="kpi-hint">no catálogo</p>
      </div>
      <div class="card">
        <p class="kpi-label">Valor total em estoque</p>
        <p class="kpi-value">${formatMoeda(resumo.valor_estoque)}</p>
        <p class="kpi-hint">a preço de custo</p>
      </div>
      <div class="card">
        <p class="kpi-label">Vendas hoje</p>
        <p class="kpi-value">${formatMoeda(resumo.vendas_hoje)}</p>
        <p class="kpi-hint">${resumo.vendas_hoje_qtd} venda(s) · ticket médio ${formatMoeda(resumo.ticket_medio)}</p>
      </div>
    </div>

    <div class="table-card" style="margin-bottom:16px">
      <div style="padding:14px 16px;border-bottom:1px solid var(--color-border);font-size:14px;font-weight:600;display:flex;justify-content:space-between;align-items:center">
        <span>Vendas recentes</span>
        <span>
          <a href="vendas-consulta.html" class="btn-secondary" style="text-decoration:none">Consultar todas</a>
          <a href="vendas.html" class="btn-secondary" style="text-decoration:none">Ver PDV</a>
        </span>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>Cliente</th><th>Vendedor</th><th>Pagamento</th><th class="text-right">Total</th><th></th></tr>
        </thead>
        <tbody>${vendasRecentesRows}</tbody>
      </table>
    </div>

    <div style="display:grid;grid-template-columns:3fr 2fr;gap:16px">
      <div class="table-card">
        <div style="padding:14px 16px;border-bottom:1px solid var(--color-border);font-size:14px;font-weight:600">
          Produtos com estoque baixo
        </div>
        <table class="data-table">
          <thead>
            <tr><th>Produto</th><th>SKU</th><th>Categoria</th><th>Estoque atual</th><th></th></tr>
          </thead>
          <tbody>${estoqueBaixoRows}</tbody>
        </table>
      </div>

      <div class="table-card">
        <div style="padding:14px 16px;border-bottom:1px solid var(--color-border);font-size:14px;font-weight:600">
          Clientes recentes
        </div>
        <table class="data-table">
          <thead>
            <tr><th>Nome</th><th>E-mail</th><th>Desde</th></tr>
          </thead>
          <tbody>${clientesRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

document.addEventListener('shell:ready', carregarDashboard);
