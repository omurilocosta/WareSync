

function qs(s) {
  const el = document.querySelector(s);
  if (!el) throw new Error(`Elemento não encontrado: ${s}`);
  return el;
}
function formatData(iso) {
  return new Date(iso).toLocaleString('pt-BR');
}

const STATUS_LABEL = { pendente: 'Pendente', autorizado: 'Autorizado', rejeitado: 'Rejeitado', cancelado: 'Cancelado' };

function renderPage() {
  qs('#page-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Fiscal</h1>
        <p class="page-subtitle">Emissão e consulta de NF-e / NFC-e</p>
      </div>
      <button class="btn-primary" id="emitirBtn">+ Emitir documento</button>
    </div>

    <div class="aviso-simulacao">
      ⚠️ Este módulo está em modo <strong>simulação</strong>: os números e status são gerados localmente, sem enviar nada para a SEFAZ.
      Para emissão fiscal real, é necessário certificado digital da empresa e integração com um provedor homologado
      (ex: Focus NFe, PlugNotas, eNotas).
    </div>

    <div class="table-card" style="margin-bottom:16px">
      <div class="filtros-grid">
        <input type="date" id="fInicio" />
        <input type="date" id="fFim" />
        <input type="text" id="fCliente" placeholder="Cliente" />
        <select id="fTipo">
          <option value="">Todos os tipos</option>
          <option value="NFE">NF-e</option>
          <option value="NFCE">NFC-e</option>
        </select>
        <select id="fStatus">
          <option value="">Todos os status</option>
          <option value="autorizado">Autorizado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
      <div style="padding:0 16px 14px">
        <button class="btn-secondary" id="filtrarBtn">Filtrar</button>
      </div>
    </div>

    <div class="table-card" id="listaWrap"><div class="empty-state">Carregando...</div></div>
  `;

  qs('#filtrarBtn').addEventListener('click', carregarLista);
  qs('#emitirBtn').addEventListener('click', () => {
    qs('#vendaIdEmitir').value = '';
    qs('#emitirFormError').classList.remove('show');
    qs('#emitirModal').classList.add('show');
  });
}

async function carregarLista() {
  const params = new URLSearchParams();
  if (qs('#fInicio').value) params.set('periodo_inicio', qs('#fInicio').value);
  if (qs('#fFim').value) params.set('periodo_fim', qs('#fFim').value);
  if (qs('#fCliente').value) params.set('cliente', qs('#fCliente').value);
  if (qs('#fTipo').value) params.set('tipo', qs('#fTipo').value);
  if (qs('#fStatus').value) params.set('status', qs('#fStatus').value);

  const res = await fetch(`${API_BASE}/fiscal?${params.toString()}`);
  const data = await res.json();
  const docs = data.data || [];

  const rows = docs.length
    ? docs
        .map(
          (d) => `
        <tr>
          <td>${d.tipo === 'NFE' ? 'NF-e' : 'NFC-e'}</td>
          <td>${d.numero || '—'}</td>
          <td>${d.cliente_nome || 'Consumidor final'}</td>
          <td>${formatData(d.emitido_em)}</td>
          <td><span class="badge-status badge-${d.status}">${STATUS_LABEL[d.status]}</span></td>
          <td class="actions">${d.status === 'autorizado' ? `<button class="btn-danger" data-cancelar="${d.id}">Cancelar</button>` : ''}</td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="6" class="empty-state">Nenhum documento fiscal encontrado.</td></tr>`;

  qs('#listaWrap').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Tipo</th><th>Número</th><th>Cliente</th><th>Emitido em</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  document.querySelectorAll('[data-cancelar]').forEach((b) =>
    b.addEventListener('click', () => {
      qs('#cancelarFiscalId').value = b.dataset.cancelar;
      qs('#motivoCancelamentoFiscal').value = '';
      qs('#cancelarFiscalError').classList.remove('show');
      qs('#cancelarFiscalModal').classList.add('show');
    })
  );
}

document.addEventListener('shell:ready', () => {
  renderPage();
  carregarLista();

  qs('#emitirVoltarBtn').addEventListener('click', () => qs('#emitirModal').classList.remove('show'));
  qs('#cancelarFiscalVoltarBtn').addEventListener('click', () => qs('#cancelarFiscalModal').classList.remove('show'));

  qs('#emitirForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const venda_id = Number(qs('#vendaIdEmitir').value);
    const tipo = qs('#tipoDocumento').value;

    if (!venda_id) {
      qs('#emitirFormError').textContent = 'Informe o número da venda.';
      qs('#emitirFormError').classList.add('show');
      return;
    }

    const res = await fetch(`${API_BASE}/fiscal/emitir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venda_id, tipo }),
    });
    const data = await res.json();

    if (!data.success) {
      qs('#emitirFormError').textContent = data.message;
      qs('#emitirFormError').classList.add('show');
      return;
    }

    qs('#emitirModal').classList.remove('show');
    carregarLista();
  });

  qs('#cancelarFiscalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = qs('#cancelarFiscalId').value;
    const motivo = qs('#motivoCancelamentoFiscal').value.trim();

    if (!motivo) {
      qs('#cancelarFiscalError').textContent = 'Informe o motivo.';
      qs('#cancelarFiscalError').classList.add('show');
      return;
    }

    const res = await fetch(`${API_BASE}/fiscal/${id}/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    });
    const data = await res.json();

    if (!data.success) {
      qs('#cancelarFiscalError').textContent = data.message;
      qs('#cancelarFiscalError').classList.add('show');
      return;
    }

    qs('#cancelarFiscalModal').classList.remove('show');
    carregarLista();
  });
});
