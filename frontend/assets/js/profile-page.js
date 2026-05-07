import { buildApiUrlAsync, TOKEN_KEY } from './runtime-config.js?v=20260507';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  if (!value) return 'Não informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return date.toLocaleDateString('pt-BR');
}

async function fetchJson(pathname) {
  const token = localStorage.getItem(TOKEN_KEY);
  const url = await buildApiUrlAsync(pathname);
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Falha ao buscar ${pathname}`);
  }
  return res.json();
}

async function loadProfilePage() {
  const token = localStorage.getItem(TOKEN_KEY);
  const statusEl = document.getElementById('profile-status');
  if (!token) {
    if (statusEl) statusEl.textContent = 'Você não está autenticado.';
    return;
  }

  try {
    const session = await fetchJson('/api/v1/auth/validate-session');
    const user = session?.user || {};
    const profile = session?.profile || user?.profile || {};
    const metadata = profile?.metadata || user?.user_metadata || {};
    const name = profile?.full_name || metadata.full_name || metadata.fullname || metadata.name || user.email || 'Você';
    const role = profile?.current_mode === 'competitive'
      ? 'Concurseiro'
      : profile?.current_mode === 'university'
        ? 'Universitário'
        : metadata.role || metadata.course || 'Estudante';
    const avatar = profile?.avatar_url || metadata.avatar_url || metadata.avatar || '';

    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileRole = document.getElementById('profile-role');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileMode = document.getElementById('profile-mode');
    const profileCreated = document.getElementById('profile-created');
    const profileUpdated = document.getElementById('profile-updated');
    const profileMetadata = document.getElementById('profile-metadata');
    const profileStats = document.getElementById('profile-stats');
    const profileGreeting = document.getElementById('profile-greeting');

    if (profileName) profileName.textContent = name;
    if (profileEmail) profileEmail.textContent = user.email || 'Sem e-mail';
    if (profileRole) profileRole.textContent = role;
    if (profileAvatar && avatar) profileAvatar.src = avatar;
    if (profileMode) profileMode.textContent = profile?.current_mode || metadata.current_mode || 'university';
    if (profileCreated) profileCreated.textContent = formatDate(profile?.created_at || user.created_at);
    if (profileUpdated) profileUpdated.textContent = formatDate(profile?.updated_at || user.updated_at);
    if (profileGreeting) profileGreeting.textContent = `Olá, ${name}.`;

    if (profileMetadata) {
      const rows = Object.entries(metadata || {})
        .map(([key, value]) => `<div class="flex items-center justify-between gap-4 py-3 border-b border-outline-variant/20"><span class="text-sm text-on-surface-variant">${escapeHtml(key)}</span><span class="text-sm font-medium text-on-surface">${escapeHtml(typeof value === 'object' ? JSON.stringify(value) : value ?? '')}</span></div>`)
        .join('');
      profileMetadata.innerHTML = rows || '<p class="text-sm text-on-surface-variant">Sem metadados adicionais.</p>';
    }

    if (profileStats) {
      const [subjects, tasks, sessions] = await Promise.all([
        fetchJson('/api/v1/subjects'),
        fetchJson('/api/v1/tasks'),
        fetchJson('/api/v1/sessions'),
      ]);
      profileStats.innerHTML = `
        <div class="rounded-2xl bg-surface-container-lowest p-6"><p class="text-xs uppercase tracking-widest text-on-surface-variant">Disciplinas</p><p class="text-3xl font-extrabold mt-2">${(subjects?.data || []).length}</p></div>
        <div class="rounded-2xl bg-surface-container-lowest p-6"><p class="text-xs uppercase tracking-widest text-on-surface-variant">Tarefas</p><p class="text-3xl font-extrabold mt-2">${(tasks?.data || []).length}</p></div>
        <div class="rounded-2xl bg-surface-container-lowest p-6"><p class="text-xs uppercase tracking-widest text-on-surface-variant">Sessões</p><p class="text-3xl font-extrabold mt-2">${(sessions?.data || []).length}</p></div>
      `;
    }
  } catch (error) {
    console.error(error);
    if (statusEl) statusEl.textContent = 'Erro ao carregar perfil.';
  }
}

window.addEventListener('DOMContentLoaded', loadProfilePage);

const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        const url = await buildApiUrlAsync('/api/v1/auth/logout');
        await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);
      }
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '../login/index.html';
    }
  });
}
