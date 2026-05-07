import { supabase } from './supabase-client.js?v=20260507';
import { buildApiUrlAsync, TOKEN_KEY } from './runtime-config.js?v=20260507';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (!form) return;
  const submitButton = form.querySelector('button[type="submit"]');
  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const fullName = form.querySelector('#fullname')?.value?.trim();
    const email = form.querySelector('#email')?.value?.trim().toLowerCase().replace(/\s+/g, '');
    const password = form.querySelector('#password')?.value;
    const confirm = form.querySelector('#confirm-password')?.value;

    if (!email || !password) {
      alert('E-mail e senha são obrigatórios');
      return;
    }
    if (password !== confirm) {
      alert('As senhas não conferem');
      return;
    }

    try {
      isSubmitting = true;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Cadastrando...';
      }

      // Use Supabase Auth directly
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (signUpError) throw signUpError;

      // Try to sign in immediately to obtain session and create profile via backend
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        // If sign in failed (e.g., confirmation required), just redirect to login with message
        alert('Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.');
        window.location.replace('/pages/login/index.html');
        return;
      }

      const accessToken = signInData?.session?.access_token;
      if (accessToken) {
        localStorage.setItem(TOKEN_KEY, accessToken);
        // call backend to ensure profile exists
        const authMeUrl = await buildApiUrlAsync('/api/v1/auth/me');
        await fetch(authMeUrl, { headers: { Authorization: `Bearer ${accessToken}` } }).catch(()=>null);
      }

      // Redirect to home
      window.location.replace('/pages/home/index.html');

    } catch (err) {
      const message = String(err?.message || 'Erro ao cadastrar');
      if (message.toLowerCase().includes('rate limit')) {
        alert('Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente, ou use outro e-mail.');
        return;
      }
      alert(message);
    } finally {
      isSubmitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Criar conta';
      }
    }
  });
});
