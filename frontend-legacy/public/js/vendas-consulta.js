
let vendaSelecionada = null;

function qs(s) {
  const el = document.querySelector(s);
  if (!el) throw new Error(`Elemento não encontrado: ${s}`);
  return el;
}

function formatMoeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatData(iso) {
  return new Date(iso).toLocaleString('pt-BR');
}

const STATUS_LABEL = { aberta: 'Aberta', finalizada: 'Finalizada', cancelada: 'Cancelada' };

function renderPage() {
  qs('#page-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Consultar vendas</h1>
        <p class="page-subtitle">Busque, cancele ou registre devoluções de vendas já realizadas</p>
      </div>
      <a href="vendas.html" class="btn-primary" style="text-decoration:none">+ Nova venda</a>
    </div>

    <div class="table-card" style="margin-bottom:16px">
      <div class="filtros-grid">
        <input type="date" id="fData" />
        <input type="text" id="fCliente" placeholder="Cliente" />
        <input type="number" id="fNumero" placeholder="Nº da venda" />
        <input type="text" id="fVendedor" placeholder="Vendedor" />
        <select id="fStatus">
          <option value="">Todos os status</option>
          <option value="finalizada">Finalizada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>
      <div style="padding:0 16px 14px">
        <button class="btn-secondary" id="filtrarBtn">Filtrar</button>
        <button class="btn-secondary" id="limparBtn">Limpar</button>
      </div>
    </div>

    <div class="table-card" id="listaWrap"><div class="empty-state">Carregando...</div></div>
  `;

  qs('#filtrarBtn').addEventListener('click', carregarLista);
  qs('#limparBtn').addEventListener('click', () => {
    ['fData', 'fCliente', 'fNumero', 'fVendedor', 'fStatus'].forEach((id) => (qs(`#${id}`).value = ''));
    carregarLista();
  });
}

async function carregarLista() {
  const params = new URLSearchParams();
  if (qs('#fData').value) params.set('data', qs('#fData').value);
  if (qs('#fCliente').value) params.set('cliente', qs('#fCliente').value);
  if (qs('#fNumero').value) params.set('numero', qs('#fNumero').value);
  if (qs('#fVendedor').value) params.set('vendedor', qs('#fVendedor').value);
  if (qs('#fStatus').value) params.set('status', qs('#fStatus').value);

  const res = await fetch(`${API_BASE}/vendas?${params.toString()}`);
  const data = await res.json();
  const vendas = data.data || [];

  const rows = vendas.length
    ? vendas
        .map(
          (v) => `
        <tr>
          <td>#${v.id}</td>
          <td>${formatData(v.criado_em)}</td>
          <td>${v.cliente_nome || 'Consumidor final'}</td>
          <td>${v.usuario_nome}</td>
          <td><span class="badge-status badge-${v.status}">${STATUS_LABEL[v.status]}</span></td>
          <td class="text-right">${formatMoeda(v.total)}</td>
          <td class="actions">
            <button class="btn-secondary" data-detalhe="${v.id}">Ver</button>
            ${v.status === 'finalizada' ? `<button class="btn-secondary" data-devolver="${v.id}">Devolver</button><button class="btn-danger" data-cancelar="${v.id}">Cancelar</button>` : ''}
          </td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="7" class="empty-state">Nenhuma venda encontrada com esses filtros.</td></tr>`;

  qs('#listaWrap').innerHTML = `
    <table class="data-table">
      <thead><tr><th>#</th><th>Data</th><th>Cliente</th><th>Vendedor</th><th>Status</th><th class="text-right">Total</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  document.querySelectorAll('[data-detalhe]').forEach((b) => b.addEventListener('click', () => verDetalhe(Number(b.dataset.detalhe))));
  document.querySelectorAll('[data-cancelar]').forEach((b) => b.addEventListener('click', () => abrirCancelar(Number(b.dataset.cancelar))));
  document.querySelectorAll('[data-devolver]').forEach((b) => b.addEventListener('click', () => abrirDevolucao(Number(b.dataset.devolver))));
}

async function buscarVenda(id) {
  const res = await fetch(`${API_BASE}/vendas/${id}`);
  const data = await res.json();
  return data.data;
}

async function verDetalhe(id) {
  const venda = await buscarVenda(id);
  vendaSelecionada = venda;

  const itensRows = (venda.itens || [])
    .map((i) => `<tr><td>${i.produto_nome}</td><td>${i.quantidade}</td><td>${formatMoeda(i.preco_unitario)}</td><td>${formatMoeda(i.subtotal)}</td></tr>`)
    .join('');

  qs('#detalheTitulo').textContent = `Venda #${venda.id}`;
  qs('#detalheConteudo').innerHTML = `
    <p style="font-size:13px;color:var(--color-text-faint);margin:0 0 12px">
      ${formatData(venda.criado_em)} · ${venda.cliente_nome || 'Consumidor final'} · ${venda.usuario_nome} ·
      <span class="badge-status badge-${venda.status}">${STATUS_LABEL[venda.status]}</span>
    </p>
    ${venda.motivo_cancelamento ? `<p style="font-size:13px;color:var(--color-danger-text);margin:0 0 12px">Motivo do cancelamento: ${venda.motivo_cancelamento}</p>` : ''}
    <table class="data-table">
      <thead><tr><th>Produto</th><th>Qtd.</th><th>Preço</th><th>Subtotal</th></tr></thead>
      <tbody>${itensRows}</tbody>
    </table>
    <p style="text-align:right;font-weight:600;margin-top:12px">Total: ${formatMoeda(venda.total)}</p>
  `;

  qs('#detalheModal').classList.add('show');
}

function abrirCancelar(id) {
  qs('#cancelarVendaId').value = id;
  qs('#motivoCancelamento').value = '';
  qs('#cancelarFormError').classList.remove('show');
  qs('#cancelarModal').classList.add('show');
}

async function abrirDevolucao(id) {
  const venda = await buscarVenda(id);
  vendaSelecionada = venda;

  qs('#devolucaoVendaId').value = id;
  qs('#devolucaoItem').innerHTML = (venda.itens || [])
    .map((i) => `<option value="${i.id}" data-max="${i.quantidade}">${i.produto_nome} (vendido: ${i.quantidade})</option>`)
    .join('');
  qs('#devolucaoQtd').value = '';
  qs('#devolucaoMotivo').value = '';
  qs('#devolucaoFormError').classList.remove('show');
  qs('#devolucaoModal').classList.add('show');
}

document.addEventListener('shell:ready', () => {
  renderPage();
  carregarLista();

  qs('#fecharDetalheBtn').addEventListener('click', () => qs('#detalheModal').classList.remove('show'));
  qs('#cancelarVoltarBtn').addEventListener('click', () => qs('#cancelarModal').classList.remove('show'));
  qs('#devolucaoVoltarBtn').addEventListener('click', () => qs('#devolucaoModal').classList.remove('show'));

  qs('#cancelarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = qs('#cancelarVendaId').value;
    const motivo = qs('#motivoCancelamento').value.trim();

    if (!motivo) {
      qs('#cancelarFormError').textContent = 'Informe o motivo do cancelamento.';
      qs('#cancelarFormError').classList.add('show');
      return;
    }

    const res = await fetch(`${API_BASE}/vendas/${id}/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    });
    const data = await res.json();

    if (!data.success) {
      qs('#cancelarFormError').textContent = data.message;
      qs('#cancelarFormError').classList.add('show');
      return;
    }

    qs('#cancelarModal').classList.remove('show');
    carregarLista();
  });

  qs('#devolucaoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const vendaId = Number(qs('#devolucaoVendaId').value);
    const select = qs('#devolucaoItem');
    const vendaItemId = Number(select.value);
    const max = Number(select.selectedOptions[0]?.dataset.max || 0);
    const quantidade = Number(qs('#devolucaoQtd').value);
    const motivo = qs('#devolucaoMotivo').value.trim();

    if (!quantidade || quantidade <= 0 || quantidade > max) {
      qs('#devolucaoFormError').textContent = `Informe uma quantidade entre 1 e ${max}.`;
      qs('#devolucaoFormError').classList.add('show');
      return;
    }

    const res = await fetch(`${API_BASE}/devolucoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venda_id: vendaId, motivo, itens: [{ venda_item_id: vendaItemId, quantidade }] }),
    });
    const data = await res.json();

    if (!data.success) {
      qs('#devolucaoFormError').textContent = data.message;
      qs('#devolucaoFormError').classList.add('show');
      return;
    }

    qs('#devolucaoModal').classList.remove('show');
    carregarLista();
  });
});
