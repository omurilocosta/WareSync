

function qs(selector) {
  return document.querySelector(selector);
}

function getToken() {
  return new URLSearchParams(window.location.search).get('token');
}

function togglePasswordVisibility() {
  const input = qs('#novaSenha');
  const label = qs('#toggleLabel');
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  label.textContent = isPassword ? 'ocultar' : 'mostrar';
}

function showError(message) {
  const box = qs('#formError');
  box.textContent = message;
  box.classList.add('show');
}

function clearError() {
  qs('#formError').classList.remove('show');
}

async function handleSubmit(event) {
  event.preventDefault();
  clearError();

  const token = getToken();
  const senha = qs('#novaSenha').value;
  const confirmar = qs('#confirmarSenha').value;

  if (!senha || senha.length < 6) {
    showError('A senha precisa ter pelo menos 6 caracteres.');
    return;
  }
  if (senha !== confirmar) {
    showError('As senhas não coincidem.');
    return;
  }

  const button = qs('#resetButton');
  button.disabled = true;
  button.textContent = 'Salvando...';

  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, senha }),
    });
    const data = await res.json();

    if (!data.success) {
      showError(data.message);
      return;
    }

    qs('#formView').style.display = 'none';
    qs('#successView').style.display = 'block';
  } catch (err) {
    showError('Não foi possível conectar ao servidor.');
  } finally {
    button.disabled = false;
    button.textContent = 'Salvar nova senha';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!getToken()) {
    qs('#formView').style.display = 'none';
    qs('#invalidView').style.display = 'block';
    return;
  }

  qs('#toggleLabel').addEventListener('click', togglePasswordVisibility);
  qs('#resetForm').addEventListener('submit', handleSubmit);
});
