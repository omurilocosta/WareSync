

let carrinho = []; // [{ produto_id, nome, preco_venda, estoque_atual, quantidade }]
let clientesCache = [];

function qs(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
  return el;
}

function formatMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderPage() {
  const content = qs('#page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Nova venda</h1>
        <p class="page-subtitle">PDV / Frente de caixa</p>
      </div>
      <a href="dashboard.html" class="btn-secondary" style="text-decoration:none">← Voltar ao painel</a>
    </div>

    <div class="pdv-grid">
      <div>
        <div class="table-card" style="padding:16px;margin-bottom:16px;position:relative">
          <input type="text" id="buscaProduto" placeholder="Buscar produto por nome ou SKU..."
            style="width:100%;border:1px solid var(--color-border);border-radius:8px;padding:10px 12px;font-size:13px;font-family:var(--font-sans);outline:none" />
          <div class="search-results" id="searchResults"></div>
        </div>

        <div class="table-card">
          <div style="padding:14px 16px;border-bottom:1px solid var(--color-border);font-size:14px;font-weight:600">
            Itens da venda
          </div>
          <div id="cartList" style="padding:0 16px"></div>
        </div>
      </div>

      <div>
        <div class="table-card" style="padding:16px;margin-bottom:16px">
          <div class="field">
            <label for="clienteSelect">Cliente (opcional)</label>
            <select id="clienteSelect" style="width:100%;border:1px solid var(--color-border);border-radius:8px;padding:9px 12px;font-size:13px;font-family:var(--font-sans)">
              <option value="">Consumidor final</option>
            </select>
          </div>

          <div class="field">
            <label for="formaPagamento">Forma de pagamento</label>
            <select id="formaPagamento" style="width:100%;border:1px solid var(--color-border);border-radius:8px;padding:9px 12px;font-size:13px;font-family:var(--font-sans)">
              <option value="Pix">Pix</option>
              <option value="Cartão">Cartão</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Crediário">Crediário</option>
            </select>
          </div>

          <div class="field">
            <label for="desconto">Desconto (R$)</label>
            <input type="number" id="desconto" step="0.01" min="0" placeholder="0,00"
              style="width:100%;border:1px solid var(--color-border);border-radius:8px;padding:9px 12px;font-size:13px;font-family:var(--font-sans)" />
          </div>
        </div>

        <div class="table-card" style="padding:16px">
          <div class="form-error" id="formError"></div>
          <div class="summary-row"><span>Subtotal</span><span id="subtotalValor">R$ 0,00</span></div>
          <div class="summary-row"><span>Desconto</span><span id="descontoValor">R$ 0,00</span></div>
          <div class="summary-total"><span>Total</span><span id="totalValor">R$ 0,00</span></div>
          <button class="btn-primary" id="finalizarBtn" style="width:100%;margin-top:16px">Finalizar venda</button>
        </div>
      </div>
    </div>
  `;
}

async function carregarClientes() {
  try {
    const res = await fetch(`${API_BASE}/clientes`);
    const data = await res.json();
    clientesCache = data.data || [];

    const select = qs('#clienteSelect');
    clientesCache.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nome;
      select.appendChild(opt);
    });
  } catch (err) {
    clientesCache = [];
  }
}

async function buscarProdutos(termo) {
  const resultsBox = qs('#searchResults');

  if (!termo || termo.length < 2) {
    resultsBox.classList.remove('show');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/produtos?busca=${encodeURIComponent(termo)}`);
    const data = await res.json();
    const produtos = data.data || [];

    if (produtos.length === 0) {
      resultsBox.innerHTML = `<div class="search-result-item">Nenhum produto encontrado</div>`;
      resultsBox.classList.add('show');
      return;
    }

    resultsBox.innerHTML = produtos
      .map(
        (p) => `
        <div class="search-result-item" data-id="${p.id}">
          <span>${p.nome} ${p.sku ? `<span style="color:var(--color-text-faint)">· ${p.sku}</span>` : ''}</span>
          <span>${formatMoeda(p.preco_venda)} ${Number(p.estoque_atual) <= 0 ? '<span class="out">sem estoque</span>' : ''}</span>
        </div>`
      )
      .join('');

    resultsBox.classList.add('show');

    resultsBox.querySelectorAll('[data-id]').forEach((el) => {
      el.addEventListener('click', () => {
        const produto = produtos.find((p) => p.id === Number(el.dataset.id));
        if (produto) adicionarAoCarrinho(produto);
        resultsBox.classList.remove('show');
        qs('#buscaProduto').value = '';
      });
    });
  } catch (err) {
    resultsBox.classList.remove('show');
  }
}

function adicionarAoCarrinho(produto) {
  if (Number(produto.estoque_atual) <= 0) {
    alert('Este produto está sem estoque.');
    return;
  }

  const existente = carrinho.find((i) => i.produto_id === produto.id);
  if (existente) {
    if (existente.quantidade + 1 > Number(produto.estoque_atual)) {
      alert('Quantidade maior que o estoque disponível.');
      return;
    }
    existente.quantidade += 1;
  } else {
    carrinho.push({
      produto_id: produto.id,
      nome: produto.nome,
      preco_venda: Number(produto.preco_venda),
      estoque_atual: Number(produto.estoque_atual),
      quantidade: 1,
    });
  }

  renderCarrinho();
}

function renderCarrinho() {
  const list = qs('#cartList');

  if (carrinho.length === 0) {
    list.innerHTML = `<div class="empty-state">Nenhum item adicionado. Busque um produto acima.</div>`;
  } else {
    list.innerHTML = carrinho
      .map(
        (item, index) => `
        <div class="cart-item">
          <div style="flex:1">
            <div>${item.nome}</div>
            <div style="color:var(--color-text-faint);font-size:12px">${formatMoeda(item.preco_venda)} / un.</div>
          </div>
          <div class="qty">
            <input type="number" min="1" max="${item.estoque_atual}" value="${item.quantidade}" data-index="${index}" class="qty-input" />
          </div>
          <div style="width:80px;text-align:right;font-weight:500">${formatMoeda(item.preco_venda * item.quantidade)}</div>
          <button class="remove" data-remove="${index}">×</button>
        </div>`
      )
      .join('');
  }

  atualizarResumo();
}

function atualizarResumo() {
  const subtotal = carrinho.reduce((acc, item) => acc + item.preco_venda * item.quantidade, 0);
  const desconto = Number(qs('#desconto')?.value) || 0;
  const total = Math.max(subtotal - desconto, 0);

  qs('#subtotalValor').textContent = formatMoeda(subtotal);
  qs('#descontoValor').textContent = formatMoeda(desconto);
  qs('#totalValor').textContent = formatMoeda(total);
}

function showFormError(message) {
  const box = qs('#formError');
  box.textContent = message;
  box.classList.add('show');
}

function clearFormError() {
  const box = qs('#formError');
  box.classList.remove('show');
}

async function finalizarVenda() {
  clearFormError();

  if (carrinho.length === 0) {
    showFormError('Adicione ao menos um item à venda.');
    return;
  }

  const btn = qs('#finalizarBtn');
  btn.disabled = true;
  btn.textContent = 'Finalizando...';

  const payload = {
    cliente_id: qs('#clienteSelect').value ? Number(qs('#clienteSelect').value) : null,
    forma_pagamento: qs('#formaPagamento').value,
    desconto: Number(qs('#desconto').value) || 0,
    itens: carrinho.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade })),
  };

  try {
    const res = await fetch(`${API_BASE}/vendas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.success) {
      showFormError(data.message || 'Não foi possível finalizar a venda.');
      return;
    }

    carrinho = [];
    renderPage();
    initEventos();
    alert('Venda finalizada com sucesso!');
  } catch (err) {
    showFormError('Não foi possível conectar ao servidor.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Finalizar venda';
  }
}

function initEventos() {
  carregarClientes();
  renderCarrinho();

  let debounce;
  qs('#buscaProduto').addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => buscarProdutos(e.target.value), 250);
  });

  document.body.addEventListener('click', (e) => {
    if (e.target.id === 'finalizarBtn') finalizarVenda();
    if (e.target.dataset.remove !== undefined) {
      carrinho.splice(Number(e.target.dataset.remove), 1);
      renderCarrinho();
    }
    if (!e.target.closest('#searchResults') && e.target.id !== 'buscaProduto') {
      qs('#searchResults').classList.remove('show');
    }
  });

  document.body.addEventListener('input', (e) => {
    if (e.target.classList.contains('qty-input')) {
      const index = Number(e.target.dataset.index);
      const valor = Number(e.target.value) || 1;
      carrinho[index].quantidade = Math.min(valor, carrinho[index].estoque_atual);
      atualizarResumo();
    }
    if (e.target.id === 'desconto') atualizarResumo();
  });
}

document.addEventListener('shell:ready', () => {
  renderPage();
  initEventos();
});
