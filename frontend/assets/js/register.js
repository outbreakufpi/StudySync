import { supabase } from './supabase-client.js';
import { buildApiUrlAsync } from './runtime-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = form.querySelector('#fullname')?.value?.trim();
    const email = form.querySelector('#email')?.value?.trim();
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
      // Use backend admin signup to auto-confirm user
      const signupUrl = await buildApiUrlAsync('/api/v1/auth/signup');
      const res = await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao criar conta');

      console.log('Signup success:', json);
      // Redireciona para a tela de login — usar replace evita histórico extra
      try {
        window.location.replace('/pages/login/index.html');
        // fallback caso replace seja bloqueado
        setTimeout(() => { window.location.href = '/pages/login/index.html'; }, 300);
      } catch (e) {
        console.error('Redirect failed, attempting href:', e);
        window.location.href = '/pages/login/index.html';
      }
    } catch (err) {
      alert(err.message || 'Erro ao cadastrar');
    }
  });
});
