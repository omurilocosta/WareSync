// Garante que toda chamada fetch() feita a partir do dashboard envie o cookie
// de sessão — necessário para o requireAuth/requireRole do backend funcionar.
(function patchFetchWithCredentials() {
  const originalFetch = window.fetch;
  window.fetch = (input, init = {}) => originalFetch(input, { ...init, credentials: init.credentials || 'include' });
})();

// Sempre usa o mesmo host que a página atual (localhost ou 127.0.0.1, o que
// o Live Server estiver usando) — evita o backend e o frontend ficarem em
// "sites" diferentes aos olhos do navegador, o que bloquearia o cookie de sessão.
const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000/api`;

// Estrutura em grupos: um módulo com "children" vira acordeão (expande ao
// clicar, sem navegar); um módulo sem "children" navega direto (caso do
// Painel, que não tem sub-telas).
const MENU = [
  { label: 'Painel', page: 'dashboard.html', icon: '📊' },
  {
    label: 'Vendas',
    icon: '🛒',
    children: [
      { label: 'Nova venda (PDV)', page: 'vendas.html' },
      { label: 'Consultar vendas', page: 'vendas-consulta.html' },
    ],
  },
  {
    label: 'Estoque',
    icon: '📦',
    children: [
      { label: 'Produtos', page: 'produtos.html' },
      { label: 'Movimentações', page: 'estoque-movimentacoes.html' },
      { label: 'Inventário', page: 'estoque.html' },
    ],
  },
  {
    label: 'Financeiro',
    icon: '💰',
    children: [
      { label: 'Contas a pagar', page: 'financeiro.html', query: 'aba=pagar' },
      { label: 'Contas a receber', page: 'financeiro.html', query: 'aba=receber' },
      { label: 'Caixa', page: 'financeiro.html', query: 'aba=caixa' },
      { label: 'Inadimplência', page: 'financeiro.html', query: 'aba=inadimplencia' },
      { label: 'Fluxo de caixa', page: 'financeiro.html', query: 'aba=fluxo' },
    ],
  },
  {
    label: 'Clientes',
    icon: '👥',
    children: [{ label: 'Cadastro e consulta', page: 'clientes.html' }],
  },
  {
    label: 'Fiscal',
    icon: '📄',
    children: [{ label: 'Documentos fiscais', page: 'fiscal.html' }],
  },
  {
    label: 'Relatórios',
    icon: '📈',
    children: [
      { label: 'Vendas', page: 'relatorios.html', query: 'aba=vendas' },
      { label: 'Estoque', page: 'relatorios.html', query: 'aba=estoque' },
      { label: 'Financeiro', page: 'relatorios.html', query: 'aba=financeiro' },
    ],
  },
  {
    label: 'Configurações',
    icon: '⚙️',
    children: [
      { label: 'Empresa', page: 'configuracoes.html', query: 'aba=empresa' },
      { label: 'Usuários', page: 'configuracoes.html', query: 'aba=usuarios' },
      { label: 'Caixa', page: 'configuracoes.html', query: 'aba=caixa' },
    ],
  },
];

function renderShell(activePage) {
  const root = document.getElementById('app-shell');
  if (!root) return;

  const currentPage = activePage || document.body.dataset.page || '';

  const navHtml = MENU.map((item) => {
    const hasChildren = !!item.children?.length;
    const isActiveGroup = hasChildren
      ? item.children.some((c) => c.page === currentPage)
      : item.page === currentPage;

    if (!hasChildren) {
      return `
        <a class="sidebar__item${isActiveGroup ? ' active' : ''}" href="${item.page}">
          <span>${item.icon}</span><span>${item.label}</span>
        </a>`;
    }

    const submenuItems = item.children
      .map((child) => {
        const href = child.query ? `${child.page}?${child.query}` : child.page;
        const isChildActive = child.page === currentPage;
        return `<a class="sidebar__subitem${isChildActive ? ' active' : ''}" href="${href}">${child.label}</a>`;
      })
      .join('');

    return `
      <div class="sidebar__group">
        <button type="button" class="sidebar__item sidebar__item--toggle${isActiveGroup ? ' active' : ''}" data-toggle-group>
          <span>${item.icon}</span><span style="flex:1;text-align:left">${item.label}</span>
          <span class="sidebar__chevron">⌄</span>
        </button>
        <div class="sidebar__submenu${isActiveGroup ? ' open' : ''}">${submenuItems}</div>
      </div>`;
  }).join('');

  root.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar__header">
        <img src="assets/logo/waresync-icon.png" alt="Waresync" />
        <span class="sidebar__logo">Waresync</span>
      </div>
      <nav class="sidebar__nav">${navHtml}</nav>
    </aside>
    <div class="app-main">
      <header class="topbar">
        <label class="topbar__search">
          <span>⌕</span>
          <input type="text" placeholder="Buscar..." />
        </label>
        <div style="position:relative">
          <button id="perfilBtn" style="display:flex;align-items:center;gap:8px;background:none;border:none;cursor:pointer;padding:4px">
            <div class="avatar" id="avatarInicial">--</div>
            <span id="nomeUsuario" style="font-size:13px;color:var(--color-chumbo)">Carregando...</span>
          </button>
          <div id="perfilMenu" style="display:none;position:absolute;right:0;top:44px;background:#fff;border:1px solid var(--color-border);border-radius:8px;box-shadow:var(--shadow-soft);min-width:160px;z-index:20">
            <div style="padding:10px 14px;border-bottom:1px solid var(--color-border)">
              <p id="cargoUsuario" style="font-size:12px;color:var(--color-text-faint);margin:0;text-transform:capitalize"></p>
            </div>
            <button id="logoutBtn" style="width:100%;text-align:left;padding:10px 14px;background:none;border:none;cursor:pointer;font-size:13px;color:var(--color-danger-text);font-family:var(--font-sans)">Sair</button>
          </div>
        </div>
      </header>
      <main class="app-content" id="page-content"></main>
    </div>
  `;

  document.querySelectorAll('[data-toggle-group]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const submenu = btn.nextElementSibling;
      const estavaAberto = submenu.classList.contains('open');

      document.querySelectorAll('.sidebar__submenu').forEach((el) => el.classList.remove('open'));
      document.querySelectorAll('.sidebar__item--toggle').forEach((el) => el.classList.remove('open'));

      if (!estavaAberto) {
        submenu.classList.add('open');
        btn.classList.add('open');
      }
    });
  });

  carregarSessao();

  document.getElementById('perfilBtn').addEventListener('click', () => {
    const menu = document.getElementById('perfilMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch (err) {
      // mesmo se a chamada falhar (backend fora do ar, rede etc.),
      // ainda assim tiramos o usuário da tela — a sessão do lado do
      // servidor pode não ter sido limpa, mas ele não fica preso aqui.
    }
    window.location.href = 'login.html';
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#perfilBtn') && !e.target.closest('#perfilMenu')) {
      const menu = document.getElementById('perfilMenu');
      if (menu) menu.style.display = 'none';
    }
  });
}

async function carregarSessao() {
  try {
    const res = await fetch(`${API_BASE}/auth/sessao`);
    const data = await res.json();

    if (!data.data) {
      window.location.href = 'login.html';
      return;
    }

    const nome = data.data.nome || 'Usuário';
    const iniciais = nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

    document.getElementById('avatarInicial').textContent = iniciais;
    document.getElementById('nomeUsuario').textContent = nome;
    document.getElementById('cargoUsuario').textContent = data.data.cargo;
  } catch (err) {
    // backend fora do ar — deixa a tela seguir, as próximas chamadas já vão avisar o usuário
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderShell();
  document.dispatchEvent(new CustomEvent('shell:ready'));
});
