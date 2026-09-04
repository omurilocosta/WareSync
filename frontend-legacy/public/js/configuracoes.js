function qs(s) {
  const el = document.querySelector(s);
  if (!el) throw new Error(`Elemento não encontrado: ${s}`);
  return el;
}

function getAbaFromUrl() {
  return new URLSearchParams(window.location.search).get('aba') || 'empresa';
}

const CONTEUDO_PENDENTE = {
  empresa: 'Cadastro de dados da empresa (razão social, CNPJ, filiais) — ainda não implementado.',
  usuarios: 'Gerenciamento de usuários e permissões — ainda não implementado.',
  caixa: 'Configuração de caixas, formas de pagamento e impressoras — ainda não implementado.',
};

function renderPage() {
  const abaAtual = getAbaFromUrl();

  qs('#page-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Configurações</h1>
        <p class="page-subtitle">Empresa, usuários e parâmetros do sistema</p>
      </div>
    </div>
    <div class="tabs">
      <button class="tab-btn" data-tab="empresa">Empresa</button>
      <button class="tab-btn" data-tab="usuarios">Usuários</button>
      <button class="tab-btn" data-tab="caixa">Caixa</button>
    </div>
    <div class="table-card">
      <div class="empty-state" id="tabContent">${CONTEUDO_PENDENTE[abaAtual]}</div>
    </div>
  `;

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === abaAtual);
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      qs('#tabContent').textContent = CONTEUDO_PENDENTE[btn.dataset.tab];
    });
  });
}

document.addEventListener('shell:ready', renderPage);
