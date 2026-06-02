import { supabase } from './supabase-client.js?v=20260507';
import { buildApiUrlAsync, TOKEN_KEY } from './runtime-config.js?v=20260507';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]').value.trim().toLowerCase().replace(/\s+/g, '');
    const password = form.querySelector('input[type="password"]').value;

    if (!email || !password) {
      alert('Preencha e-mail e senha');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // store access token for backend calls
      const accessToken = data?.session?.access_token;
      if (accessToken) {
        localStorage.setItem(TOKEN_KEY, accessToken);
      }

      // notify backend to set HttpOnly cookie (best-effort)
      try {
        const loginUrl = await buildApiUrlAsync('/api/v1/auth/login');
        fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        }).catch(() => null);
      } catch (e) {
        // ignore — this is a best-effort step to let backend set cookie
      }

      const authMeUrl = await buildApiUrlAsync('/api/v1/auth/me');
      await fetch(authMeUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).catch(() => null);

      // redirect to mode selection page (choose university or concurso)
      try {
        const params = new URLSearchParams(window.location.search || '');
        const redirect = params.get('redirect');
        let target = '/pages/home/index.html';
        if (redirect) {
          try {
            const decoded = decodeURIComponent(redirect);
            // only allow internal redirects
            if (decoded.startsWith('/')) target = decoded;
          } catch (e) {
            // ignore invalid decode
          }
        }
        window.location.replace(target);
        setTimeout(() => { window.location.href = target; }, 300);
      } catch (e) {
        window.location.href = '/pages/home/index.html';
      }
    } catch (err) {
      const message = String(err?.message || 'Erro ao fazer login');
      if (message.toLowerCase().includes('rate limit')) {
        alert('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
        return;
      }
      alert(message);
    }
  });
});
