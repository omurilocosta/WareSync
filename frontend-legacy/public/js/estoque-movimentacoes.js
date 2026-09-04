

function qs(s) {
  const el = document.querySelector(s);
  if (!el) throw new Error(`Elemento não encontrado: ${s}`);
  return el;
}
function formatData(iso) {
  return new Date(iso).toLocaleString('pt-BR');
}

const TIPO_LABEL = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste' };

function renderPage() {
  qs('#page-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Movimentações de estoque</h1>
        <p class="page-subtitle">Histórico completo de entradas, saídas e ajustes</p>
      </div>
      <a href="produtos.html" class="btn-primary" style="text-decoration:none">Ir para Produtos</a>
    </div>

    <div class="table-card" style="margin-bottom:16px">
      <div class="filtros-grid">
        <input type="text" id="fProduto" placeholder="Produto" />
        <select id="fTipo">
          <option value="">Todos os tipos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
          <option value="ajuste">Ajuste</option>
        </select>
        <input type="date" id="fInicio" />
        <input type="date" id="fFim" />
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
    ['fProduto', 'fTipo', 'fInicio', 'fFim'].forEach((id) => (qs(`#${id}`).value = ''));
    carregarLista();
  });
}

async function carregarLista() {
  const params = new URLSearchParams();
  if (qs('#fProduto').value) params.set('produto', qs('#fProduto').value);
  if (qs('#fTipo').value) params.set('tipo', qs('#fTipo').value);
  if (qs('#fInicio').value) params.set('inicio', qs('#fInicio').value);
  if (qs('#fFim').value) params.set('fim', qs('#fFim').value);

  const res = await fetch(`${API_BASE}/estoque/movimentacoes?${params.toString()}`);
  const data = await res.json();
  const movs = data.data || [];

  const rows = movs.length
    ? movs
        .map(
          (m) => `
        <tr>
          <td>${formatData(m.criado_em)}</td>
          <td>${m.produto_nome}</td>
          <td><span class="badge-status badge-${m.tipo}">${TIPO_LABEL[m.tipo]}</span></td>
          <td>${Number(m.quantidade).toLocaleString('pt-BR')}</td>
          <td>${Number(m.estoque_resultante).toLocaleString('pt-BR')}</td>
          <td>${m.motivo || '—'}</td>
          <td>${m.usuario_nome}</td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="7" class="empty-state">Nenhuma movimentação encontrada.</td></tr>`;

  qs('#listaWrap').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Quantidade</th><th>Estoque resultante</th><th>Motivo</th><th>Responsável</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

document.addEventListener('shell:ready', () => {
  renderPage();
  carregarLista();
});
