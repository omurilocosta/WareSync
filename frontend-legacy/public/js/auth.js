

function qs(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
  return el;
}

function showView(view) {
  qs('#loginView').style.display = view === 'login' ? 'block' : 'none';
  qs('#forgotView').style.display = view === 'forgot' ? 'block' : 'none';
}

function togglePasswordVisibility() {
  const input = qs('#password');
  const label = qs('#toggleLabel');
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  label.textContent = isPassword ? 'ocultar' : 'mostrar';
}

function setLoading(button, loading, idleText) {
  button.disabled = loading;
  button.textContent = loading ? 'Enviando...' : idleText;
}

function showFormError(formId, message) {
  let box = document.querySelector(`#${formId} .form-error`);
  if (!box) {
    box = document.createElement('div');
    box.className = 'form-error';
    qs(`#${formId}`).prepend(box);
  }
  box.textContent = message;
  box.classList.add('show');
}

function clearFormError(formId) {
  const box = document.querySelector(`#${formId} .form-error`);
  if (box) box.classList.remove('show');
}

async function handleLogin(event) {
  event.preventDefault();
  clearFormError('loginView');

  const email = qs('#email').value.trim();
  const senha = qs('#password').value;
  const button = qs('#loginButton');

  if (!email || !senha) {
    showFormError('loginView', 'Preencha e-mail e senha.');
    return;
  }

  setLoading(button, true, 'Entrar');

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, senha }),
    });

    const data = await res.json();

    if (!data.success) {
      showFormError('loginView', data.message);
      return;
    }

    window.location.href = 'dashboard.html';
  } catch (err) {
    showFormError('loginView', 'Não foi possível conectar ao servidor. Tente novamente.');
  } finally {
    setLoading(button, false, 'Entrar');
  }
}

async function handleForgotPassword(event) {
  event.preventDefault();

  const email = qs('#forgotEmail').value.trim();
  const button = qs('#forgotButton');
  const successBox = qs('#successBox');

  if (!email) {
    showFormError('forgotView', 'Informe seu e-mail.');
    return;
  }

  setLoading(button, true, 'Enviar link de redefinição');

  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    successBox.textContent = data.message;
    successBox.classList.add('show');
  } catch (err) {
    showFormError('forgotView', 'Não foi possível conectar ao servidor. Tente novamente.');
  } finally {
    setLoading(button, false, 'Enviar link de redefinição');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  qs('#toggleLabel').addEventListener('click', togglePasswordVisibility);
  qs('#showForgotBtn').addEventListener('click', () => showView('forgot'));
  qs('#showLoginBtn').addEventListener('click', () => showView('login'));
  qs('#loginForm').addEventListener('submit', handleLogin);
  qs('#forgotForm').addEventListener('submit', handleForgotPassword);
});
