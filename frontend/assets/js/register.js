import { buildApiUrlAsync, TOKEN_KEY } from './runtime-config.js?v=20260507';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (!form) return;
  const submitButton = form.querySelector('button[type="submit"]');
  let isSubmitting = false;

  async function postJson(pathname, payload) {
    const url = await buildApiUrlAsync(pathname);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = body?.error || 'Erro ao processar requisição';
      const err = new Error(message);
      err.status = res.status;
      err.body = body;
      throw err;
    }

    return body;
  }

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

      // Prefer backend signup to avoid Supabase rate limiting on the client.
      await postJson('/api/v1/auth/signup', {
        email,
        password,
        full_name: fullName || null,
      });

      // Auto-login via backend to obtain a valid access token
      const loginResult = await postJson('/api/v1/auth/login', { email, password });
      const accessToken = loginResult?.session?.access_token;
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
      const normalized = message.toLowerCase();
      if (normalized.includes('rate limit') || normalized.includes('too many') || normalized.includes('muitas tentativas')) {
        alert('Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente, ou crie o usuário manualmente no Supabase Auth.');
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
