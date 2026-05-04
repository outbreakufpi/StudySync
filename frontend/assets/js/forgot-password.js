import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
  const requestForm = document.getElementById('recovery-request-form');
  const resetForm = document.getElementById('reset-password-form');
  const resetWrapper = document.getElementById('reset-password-wrapper');
  const emailInput = document.getElementById('email');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const statusMessage = document.getElementById('status-message');
  const pageTitle = document.getElementById('page-title');
  const pageDescription = document.getElementById('page-description');
  const requestButton = document.getElementById('request-button');
  const requestButtonText = document.getElementById('request-button-text');
  const resetButton = document.getElementById('reset-button');
  const resetButtonText = document.getElementById('reset-button-text');

  if (!requestForm || !resetForm || !resetWrapper) {
    return;
  }

  const recoveryRedirectTo = `${window.location.origin}${window.location.pathname}?mode=recovery`;
  const currentUrl = new URL(window.location.href);
  const recoveryModeByUrl = currentUrl.searchParams.get('mode') === 'recovery';

  const ui = {
    request: {
      form: requestForm,
      button: requestButton,
      label: requestButtonText,
    },
    reset: {
      form: resetForm,
      button: resetButton,
      label: resetButtonText,
    },
  };

  function showMessage(message, tone = 'info') {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'border-red-200', 'bg-red-50', 'text-red-700', 'border-green-200', 'bg-green-50', 'text-green-700');

    if (tone === 'error') {
      statusMessage.classList.add('border-red-200', 'bg-red-50', 'text-red-700');
      return;
    }

    if (tone === 'success') {
      statusMessage.classList.add('border-green-200', 'bg-green-50', 'text-green-700');
    }
  }

  function setLoading(target, loading) {
    target.button.disabled = loading;
    target.label.textContent = loading ? 'Processando...' : target.label.dataset.defaultLabel;
  }

  function setMode(isRecovery) {
    requestForm.classList.toggle('hidden', isRecovery);
    resetWrapper.classList.toggle('hidden', !isRecovery);
    pageTitle.textContent = isRecovery ? 'Definir Nova Senha' : 'Recuperar Senha';
    pageDescription.textContent = isRecovery
      ? 'Digite sua nova senha para concluir a redefinição.'
      : 'Insira seu e-mail para receber as instruções de redefinição.';
  }

  requestButtonText.dataset.defaultLabel = requestButtonText.textContent;
  resetButtonText.dataset.defaultLabel = resetButtonText.textContent;

  setMode(recoveryModeByUrl);

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      setMode(true);
      showMessage('Sessão de recuperação iniciada. Defina sua nova senha.', 'success');
    }
  });

  requestForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      showMessage('Informe seu e-mail para continuar.', 'error');
      return;
    }

    try {
      setLoading(ui.request, true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: recoveryRedirectTo });

      if (error) {
        throw error;
      }

      showMessage('Enviamos o link de redefinição para o seu e-mail.', 'success');
    } catch (error) {
      showMessage(error?.message || 'Não foi possível enviar a recuperação de senha.', 'error');
    } finally {
      setLoading(ui.request, false);
    }
  });

  resetForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!newPassword || !confirmPassword) {
      showMessage('Preencha e confirme a nova senha.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('As senhas não conferem.', 'error');
      return;
    }

    try {
      setLoading(ui.reset, true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      showMessage('Senha atualizada com sucesso. Redirecionando para o login.', 'success');
      setTimeout(() => {
        window.location.href = '../login/index.html';
      }, 1600);
    } catch (error) {
      showMessage(error?.message || 'Não foi possível atualizar a senha.', 'error');
    } finally {
      setLoading(ui.reset, false);
    }
  });
});
