
let abaAtual = 'pagar';

function qs(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
  return el;
}

function formatMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatData(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function renderShellPage() {
  qs('#page-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Financeiro</h1>
        <p class="page-subtitle">Contas a pagar, contas a receber e caixa</p>
      </div>
      <div id="pageActions"></div>
    </div>
    <div class="tabs">
      <button class="tab-btn" data-tab="pagar">Contas a pagar</button>
      <button class="tab-btn" data-tab="receber">Contas a receber</button>
      <button class="tab-btn" data-tab="caixa">Caixa</button>
      <button class="tab-btn" data-tab="inadimplencia">Inadimplência</button>
      <button class="tab-btn" data-tab="fluxo">Fluxo de Caixa</button>
    </div>
    <div id="tabContent"></div>
  `;
}

function ativarAba(tab) {
  abaAtual = tab;
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));

  if (tab === 'pagar') carregarContasPagar();
  if (tab === 'receber') carregarContasReceber();
  if (tab === 'caixa') carregarCaixa();
  if (tab === 'inadimplencia') carregarInadimplencia();
  if (tab === 'fluxo') carregarFluxoCaixa();
}

// ---------- Contas a pagar ----------

async function carregarContasPagar() {
  qs('#pageActions').innerHTML = `<button class="btn-primary" id="novaContaPagarBtn">+ Nova conta</button>`;
  qs('#tabContent').innerHTML = `<div class="table-card"><div class="empty-state">Carregando...</div></div>`;

  const res = await fetch(`${API_BASE}/financeiro/contas-pagar`);
  const data = await res.json();
  const contas = data.data || [];

  const rows = contas.length
    ? contas
        .map(
          (c) => `
        <tr>
          <td>${c.descricao}</td>
          <td>${c.fornecedor || '—'}</td>
          <td>${formatData(c.vencimento)}</td>
          <td>${formatMoeda(c.valor)}</td>
          <td><span class="badge-status badge-${c.status}">${c.status === 'aberta' ? 'Em aberto' : 'Paga'}</span></td>
          <td class="actions">${c.status === 'aberta' ? `<button class="btn-secondary" data-baixar-pagar="${c.id}">Baixar</button>` : ''}</td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="6" class="empty-state">Nenhuma conta a pagar cadastrada.</td></tr>`;

  qs('#tabContent').innerHTML = `
    <div class="table-card">
      <table class="data-table">
        <thead><tr><th>Descrição</th><th>Fornecedor</th><th>Vencimento</th><th>Valor</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  document.querySelectorAll('[data-baixar-pagar]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await fetch(`${API_BASE}/financeiro/contas-pagar/${btn.dataset.baixarPagar}/baixar`, { method: 'POST' });
      carregarContasPagar();
    });
  });
}

function abrirModalContaPagar() {
  qs('#genericModalTitle').textContent = 'Nova conta a pagar';
  qs('#genericFormError').classList.remove('show');
  qs('#genericForm').innerHTML = `
    <div class="field"><label>Descrição *</label><input type="text" id="gDescricao" placeholder="Ex: Aluguel, fornecedor..." /></div>
    <div class="field"><label>Fornecedor</label><input type="text" id="gFornecedor" placeholder="Nome do fornecedor" /></div>
    <div class="field-row-2">
      <div class="field"><label>Valor (R$) *</label><input type="number" id="gValor" step="0.01" min="0" placeholder="0,00" /></div>
      <div class="field"><label>Vencimento *</label><input type="date" id="gVencimento" /></div>
    </div>
    <div class="field-row-2">
      <div class="field"><label>Categoria</label><input type="text" id="gCategoria" placeholder="Ex: Aluguel, Fornecedores, Impostos" /></div>
      <div class="field">
        <label>Forma de pagamento</label>
        <select id="gFormaPagamento" style="width:100%;border:1px solid var(--color-border);border-radius:8px;padding:10px;font-family:var(--font-sans)">
          <option value="">Não definida</option>
          <option value="Pix">Pix</option>
          <option value="Boleto">Boleto</option>
          <option value="Transferência">Transferência</option>
          <option value="Cartão">Cartão</option>
        </select>
      </div>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn-secondary" id="genericCancelBtn">Cancelar</button>
      <button type="submit" class="btn-primary">Salvar</button>
    </div>
  `;
  qs('#genericForm').onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
      descricao: qs('#gDescricao').value.trim(),
      fornecedor: qs('#gFornecedor').value.trim(),
      valor: Number(qs('#gValor').value),
      vencimento: qs('#gVencimento').value,
      categoria: qs('#gCategoria').value.trim(),
      forma_pagamento: qs('#gFormaPagamento').value,
    };
    if (!payload.descricao || !payload.valor || !payload.vencimento) {
      qs('#genericFormError').textContent = 'Preencha descrição, valor e vencimento.';
      qs('#genericFormError').classList.add('show');
      return;
    }
    await fetch(`${API_BASE}/financeiro/contas-pagar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    fecharGenericModal();
    carregarContasPagar();
  };
  qs('#genericModal').classList.add('show');
}

// ---------- Contas a receber ----------

async function carregarContasReceber() {
  qs('#pageActions').innerHTML = `<button class="btn-primary" id="novaContaReceberBtn">+ Novo recebimento</button>`;
  qs('#tabContent').innerHTML = `<div class="table-card"><div class="empty-state">Carregando...</div></div>`;

  const res = await fetch(`${API_BASE}/financeiro/contas-receber`);
  const data = await res.json();
  const contas = data.data || [];

  const rows = contas.length
    ? contas
        .map(
          (c) => `
        <tr>
          <td>${c.descricao}</td>
          <td>${c.cliente_nome || '—'}</td>
          <td>${formatData(c.vencimento)}</td>
          <td>${formatMoeda(c.valor)}</td>
          <td><span class="badge-status badge-${c.status}">${c.status === 'pendente' ? 'Pendente' : 'Recebido'}</span></td>
          <td class="actions">${c.status === 'pendente' ? `<button class="btn-secondary" data-baixar-receber="${c.id}">Baixar</button>` : ''}</td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="6" class="empty-state">Nenhum recebimento cadastrado.</td></tr>`;

  qs('#tabContent').innerHTML = `
    <div class="table-card">
      <table class="data-table">
        <thead><tr><th>Descrição</th><th>Cliente</th><th>Vencimento</th><th>Valor</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  document.querySelectorAll('[data-baixar-receber]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await fetch(`${API_BASE}/financeiro/contas-receber/${btn.dataset.baixarReceber}/baixar`, { method: 'POST' });
      carregarContasReceber();
    });
  });
}

async function abrirModalContaReceber() {
  const resClientes = await fetch(`${API_BASE}/clientes`);
  const clientes = (await resClientes.json()).data || [];

  qs('#genericModalTitle').textContent = 'Novo recebimento';
  qs('#genericFormError').classList.remove('show');
  qs('#genericForm').innerHTML = `
    <div class="field"><label>Descrição *</label><input type="text" id="gDescricao" placeholder="Ex: Venda a prazo" /></div>
    <div class="field">
      <label>Cliente</label>
      <select id="gCliente" style="width:100%;border:1px solid var(--color-border);border-radius:8px;padding:10px 12px;font-size:14px;font-family:var(--font-sans)">
        <option value="">Sem cliente vinculado</option>
        ${clientes.map((c) => `<option value="${c.id}">${c.nome}</option>`).join('')}
      </select>
    </div>
    <div class="field-row-2">
      <div class="field"><label>Valor (R$) *</label><input type="number" id="gValor" step="0.01" min="0" placeholder="0,00" /></div>
      <div class="field"><label>Vencimento *</label><input type="date" id="gVencimento" /></div>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn-secondary" id="genericCancelBtn">Cancelar</button>
      <button type="submit" class="btn-primary">Salvar</button>
    </div>
  `;
  qs('#genericForm').onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
      descricao: qs('#gDescricao').value.trim(),
      cliente_id: qs('#gCliente').value ? Number(qs('#gCliente').value) : null,
      valor: Number(qs('#gValor').value),
      vencimento: qs('#gVencimento').value,
    };
    if (!payload.descricao || !payload.valor || !payload.vencimento) {
      qs('#genericFormError').textContent = 'Preencha descrição, valor e vencimento.';
      qs('#genericFormError').classList.add('show');
      return;
    }
    await fetch(`${API_BASE}/financeiro/contas-receber`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    fecharGenericModal();
    carregarContasReceber();
  };
  qs('#genericModal').classList.add('show');
}

// ---------- Caixa ----------

async function carregarCaixa() {
  qs('#pageActions').innerHTML = '';
  qs('#tabContent').innerHTML = `<div class="caixa-box"><div class="empty-state">Carregando...</div></div>`;

  const res = await fetch(`${API_BASE}/financeiro/caixa/atual`);
  const data = await res.json();
  const sessao = data.data;

  if (!sessao) {
    qs('#tabContent').innerHTML = `
      <div class="caixa-box" style="text-align:center">
        <p style="color:var(--color-text-faint);margin-bottom:16px">Nenhum caixa aberto no momento.</p>
        <div class="field" style="max-width:220px;margin:0 auto 12px">
          <label>Valor de abertura (R$)</label>
          <input type="number" id="valorAbertura" step="0.01" min="0" placeholder="0,00"
            style="width:100%;border:1px solid var(--color-border);border-radius:8px;padding:9px 12px" />
        </div>
        <button class="btn-primary" id="abrirCaixaBtn">Abrir caixa</button>
      </div>
    `;
    qs('#abrirCaixaBtn').addEventListener('click', async () => {
      const valor = Number(qs('#valorAbertura').value) || 0;
      await fetch(`${API_BASE}/financeiro/caixa/abrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_abertura: valor }),
      });
      carregarCaixa();
    });
    return;
  }

  const movRows = sessao.movimentacoes.length
    ? sessao.movimentacoes
        .map(
          (m) => `
        <tr>
          <td>${m.tipo}</td>
          <td>${m.descricao || '—'}</td>
          <td class="text-right" style="color:${m.tipo === 'sangria' || m.tipo === 'saida' ? 'var(--color-danger-text)' : 'var(--color-success-text)'}">
            ${m.tipo === 'sangria' || m.tipo === 'saida' ? '−' : '+'} ${formatMoeda(m.valor)}
          </td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="3" class="empty-state">Nenhuma movimentação ainda.</td></tr>`;

  qs('#tabContent').innerHTML = `
    <div class="caixa-box">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <p style="font-size:12px;color:var(--color-text-faint);margin:0 0 4px">Saldo atual</p>
          <p style="font-size:26px;font-weight:600;margin:0">${formatMoeda(sessao.saldo)}</p>
          <p style="font-size:12px;color:var(--color-text-faint);margin:4px 0 0">Aberto em ${formatData(sessao.aberto_em)} · abertura ${formatMoeda(sessao.valor_abertura)}</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary" id="sangriaBtn">Sangria</button>
          <button class="btn-secondary" id="suprimentoBtn">Suprimento</button>
          <button class="btn-primary" id="fecharCaixaBtn">Fechar caixa</button>
        </div>
      </div>
    </div>
    <div class="table-card">
      <div style="padding:14px 16px;border-bottom:1px solid var(--color-border);font-size:14px;font-weight:600">Movimentações</div>
      <table class="data-table">
        <thead><tr><th>Tipo</th><th>Descrição</th><th class="text-right">Valor</th></tr></thead>
        <tbody>${movRows}</tbody>
      </table>
    </div>
  `;

  qs('#sangriaBtn').addEventListener('click', () => abrirModalMovimentacaoCaixa('sangria'));
  qs('#suprimentoBtn').addEventListener('click', () => abrirModalMovimentacaoCaixa('suprimento'));
  qs('#fecharCaixaBtn').addEventListener('click', async () => {
    if (!confirm('Fechar o caixa? Não será possível registrar mais movimentações nesta sessão.')) return;
    await fetch(`${API_BASE}/financeiro/caixa/fechar`, { method: 'POST' });
    carregarCaixa();
  });
}

function abrirModalMovimentacaoCaixa(tipo) {
  qs('#genericModalTitle').textContent = tipo === 'sangria' ? 'Registrar sangria' : 'Registrar suprimento';
  qs('#genericFormError').classList.remove('show');
  qs('#genericForm').innerHTML = `
    <div class="field"><label>Valor (R$) *</label><input type="number" id="gValor" step="0.01" min="0" placeholder="0,00" /></div>
    <div class="field"><label>Descrição</label><input type="text" id="gDescricao" placeholder="Motivo (opcional)" /></div>
    <div class="modal-actions">
      <button type="button" class="btn-secondary" id="genericCancelBtn">Cancelar</button>
      <button type="submit" class="btn-primary">Confirmar</button>
    </div>
  `;
  qs('#genericForm').onsubmit = async (e) => {
    e.preventDefault();
    const valor = Number(qs('#gValor').value);
    if (!valor || valor <= 0) {
      qs('#genericFormError').textContent = 'Informe um valor maior que zero.';
      qs('#genericFormError').classList.add('show');
      return;
    }
    await fetch(`${API_BASE}/financeiro/caixa/movimentacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, valor, descricao: qs('#gDescricao').value.trim() }),
    });
    fecharGenericModal();
    carregarCaixa();
  };
  qs('#genericModal').classList.add('show');
}

function fecharGenericModal() {
  qs('#genericModal').classList.remove('show');
}

// ---------- Inadimplência ----------

async function carregarInadimplencia() {
  qs('#pageActions').innerHTML = '';
  qs('#tabContent').innerHTML = `<div class="table-card"><div class="empty-state">Carregando...</div></div>`;

  const res = await fetch(`${API_BASE}/financeiro/inadimplencia`);
  const { data } = await res.json();

  const rows = data.titulos.length
    ? data.titulos
        .map(
          (t) => `
        <tr>
          <td>${t.cliente_nome || '—'}</td>
          <td>${t.descricao}</td>
          <td>${formatData(t.vencimento)}</td>
          <td style="color:var(--color-danger-text);font-weight:500">${t.dias_atraso} dia(s)</td>
          <td>${formatMoeda(t.valor)}</td>
          <td class="actions"><button class="btn-secondary" data-receber="${t.id}">Registrar recebimento</button></td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="6" class="empty-state">Nenhum título em atraso. 🎉</td></tr>`;

  qs('#tabContent').innerHTML = `
    <div class="kpi-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:16px">
      <div class="caixa-box"><p style="font-size:12px;color:var(--color-text-faint);margin:0 0 4px">Total em atraso</p><p style="font-size:22px;font-weight:600;color:var(--color-danger-text);margin:0">${formatMoeda(data.total_em_atraso)}</p></div>
      <div class="caixa-box"><p style="font-size:12px;color:var(--color-text-faint);margin:0 0 4px">Títulos vencidos</p><p style="font-size:22px;font-weight:600;margin:0">${data.quantidade}</p></div>
    </div>
    <div class="table-card">
      <table class="data-table">
        <thead><tr><th>Cliente</th><th>Descrição</th><th>Vencimento</th><th>Atraso</th><th>Valor</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  document.querySelectorAll('[data-receber]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await fetch(`${API_BASE}/financeiro/inadimplencia/${btn.dataset.receber}/receber`, { method: 'POST' });
      carregarInadimplencia();
    });
  });
}

// ---------- Fluxo de Caixa ----------

async function carregarFluxoCaixa() {
  qs('#pageActions').innerHTML = '';
  const { inicio, fim } = getPeriodoFinanceiro();
  qs('#tabContent').innerHTML = `<div class="table-card"><div class="empty-state">Carregando...</div></div>`;

  const res = await fetch(`${API_BASE}/financeiro/fluxo-caixa?inicio=${inicio}&fim=${fim}`);
  const { data } = await res.json();

  const lancRows = data.lancamentos.length
    ? data.lancamentos
        .map((l) => {
          const positivo = l.tipo === 'entrada' || l.tipo === 'suprimento';
          return `<tr><td>${formatData(l.criado_em)}</td><td>${l.tipo}</td><td>${l.descricao || '—'}</td>
            <td class="text-right" style="color:${positivo ? 'var(--color-success-text)' : 'var(--color-danger-text)'}">${positivo ? '+' : '−'} ${formatMoeda(l.valor)}</td></tr>`;
        })
        .join('')
    : `<tr><td colspan="4" class="empty-state">Nenhum lançamento no período.</td></tr>`;

  qs('#tabContent').innerHTML = `
    <div class="filtro-periodo" style="display:flex;gap:8px;align-items:center;margin-bottom:16px">
      <label style="font-size:13px;color:var(--color-text-faint)">De</label>
      <input type="date" id="fluxoInicio" value="${inicio}" style="border:1px solid var(--color-border);border-radius:8px;padding:8px" />
      <label style="font-size:13px;color:var(--color-text-faint)">até</label>
      <input type="date" id="fluxoFim" value="${fim}" style="border:1px solid var(--color-border);border-radius:8px;padding:8px" />
      <button class="btn-secondary" id="aplicarFluxoBtn">Aplicar</button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:16px">
      <div class="caixa-box"><p style="font-size:12px;color:var(--color-text-faint);margin:0 0 4px">Entradas no período</p><p style="font-size:20px;font-weight:600;color:var(--color-success-text);margin:0">${formatMoeda(data.entradas)}</p></div>
      <div class="caixa-box"><p style="font-size:12px;color:var(--color-text-faint);margin:0 0 4px">Saídas no período</p><p style="font-size:20px;font-weight:600;color:var(--color-danger-text);margin:0">${formatMoeda(data.saidas)}</p></div>
      <div class="caixa-box"><p style="font-size:12px;color:var(--color-text-faint);margin:0 0 4px">Saldo do período</p><p style="font-size:20px;font-weight:600;margin:0">${formatMoeda(data.saldo_periodo)}</p></div>
    </div>

    <div class="caixa-box" style="margin-bottom:16px">
      <p style="font-size:13px;font-weight:600;margin:0 0 10px">Projeção (contas a pagar/receber futuras)</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        <div><p style="font-size:12px;color:var(--color-text-faint);margin:0">A receber</p><p style="font-weight:600;color:var(--color-success-text);margin:2px 0 0">${formatMoeda(data.projecao.entradas_previstas)}</p></div>
        <div><p style="font-size:12px;color:var(--color-text-faint);margin:0">A pagar</p><p style="font-weight:600;color:var(--color-danger-text);margin:2px 0 0">${formatMoeda(data.projecao.saidas_previstas)}</p></div>
        <div><p style="font-size:12px;color:var(--color-text-faint);margin:0">Saldo projetado</p><p style="font-weight:600;margin:2px 0 0">${formatMoeda(data.projecao.saldo_projetado)}</p></div>
      </div>
    </div>

    <div class="table-card">
      <div style="padding:14px 16px;border-bottom:1px solid var(--color-border);font-size:14px;font-weight:600">Lançamentos do período</div>
      <table class="data-table">
        <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th class="text-right">Valor</th></tr></thead>
        <tbody>${lancRows}</tbody>
      </table>
    </div>
  `;

  qs('#aplicarFluxoBtn').addEventListener('click', carregarFluxoCaixa);
}

function getPeriodoFinanceiro() {
  const inicioInput = document.getElementById('fluxoInicio');
  const fimInput = document.getElementById('fluxoFim');
  if (inicioInput && fimInput) return { inicio: inicioInput.value, fim: fimInput.value };

  const fim = new Date().toISOString().slice(0, 10);
  const inicio = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  return { inicio, fim };
}

document.addEventListener('shell:ready', () => {
  renderShellPage();
  ativarAba(new URLSearchParams(window.location.search).get('aba') || 'pagar');

  document.body.addEventListener('click', (e) => {
    if (e.target.dataset.tab) ativarAba(e.target.dataset.tab);
    if (e.target.id === 'novaContaPagarBtn') abrirModalContaPagar();
    if (e.target.id === 'novaContaReceberBtn') abrirModalContaReceber();
    if (e.target.id === 'genericCancelBtn') fecharGenericModal();
  });

  qs('#genericModal').addEventListener('click', (e) => {
    if (e.target.id === 'genericModal') fecharGenericModal();
  });
});
