import { buildApiUrlAsync, TOKEN_KEY } from "./runtime-config.js";

async function fetchTasks() {
  const token = localStorage.getItem(TOKEN_KEY);
  const container = document.getElementById("tasks-list");
  if (!container) return;
  container.innerHTML = "<p class=\"text-sm text-on-surface-variant\">Carregando tarefas...</p>";

  if (!token) {
    container.innerHTML = "<p class=\"text-sm text-on-surface-variant\">Você não está autenticado.</p>";
    return;
  }

  try {
    const tasksUrl = await buildApiUrlAsync('/api/v1/tasks');
    const res = await fetch(tasksUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401) {
      container.innerHTML = "<p class=\"text-sm text-on-surface-variant\">Token inválido ou expirado. Faça login novamente.</p>";
      return;
    }

    const data = await res.json();
    const tasks = data?.data || [];

    if (!tasks.length) {
      container.innerHTML = "<p class=\"text-sm text-on-surface-variant\">Nenhuma tarefa encontrada.</p>";
      return;
    }

    container.innerHTML = "";
    for (const t of tasks) {
      const el = document.createElement("div");
      el.className = "flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-colors group";
      const date = new Date(t.due_date || t.created_at || Date.now());
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString(undefined, { month: "short" });

      el.innerHTML = `
        <div class="flex items-center gap-6">
          <div class="w-14 h-14 rounded-2xl bg-tertiary-container flex flex-col items-center justify-center">
            <span class="text-[10px] font-bold text-tertiary-fixed-dim uppercase">${month}</span>
            <span class="text-xl font-bold text-tertiary-fixed-dim -mt-1">${day}</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] px-2 py-0.5 rounded-full font-bold">${(t.type || "TAREFA").toUpperCase()}</span>
              <h5 class="font-bold text-on-surface">${escapeHtml(t.title || "Sem título")}</h5>
            </div>
            <p class="text-sm text-on-surface-variant mt-0.5">${escapeHtml(t.description || "")}</p>
          </div>
        </div>
        <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all cursor-pointer">chevron_right</span>
      `;
      container.appendChild(el);
    }
  } catch (err) {
    container.innerHTML = "<p class=\"text-sm text-on-surface-variant\">Erro ao carregar tarefas.</p>";
    console.error(err);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Auto-run when module is imported
fetchTasks();
async function fetchSubjects() {
  const token = localStorage.getItem(TOKEN_KEY);
  const container = document.getElementById('subjects-list');
  if (!container) return;
  container.innerHTML = '<p class="text-sm text-on-surface-variant">Carregando disciplinas...</p>';

  if (!token) {
    container.innerHTML = '<p class="text-sm text-on-surface-variant">Você não está autenticado.</p>';
    return;
  }

  try {
    const url = await buildApiUrlAsync('/api/v1/subjects');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) {
      container.innerHTML = '<p class="text-sm text-on-surface-variant">Token inválido ou expirado.</p>';
      return;
    }
    const data = await res.json();
    const subjects = data?.data || [];
    if (!subjects.length) {
      container.innerHTML = '<p class="text-sm text-on-surface-variant">Nenhuma disciplina encontrada.</p>';
      return;
    }

    container.innerHTML = '';
    for (const s of subjects) {
      const el = document.createElement('div');
      el.className = 'group relative bg-surface-container-lowest p-6 rounded-xl transition-all duration-300 hover:translate-y-[-4px]';
      el.innerHTML = `
        <div class="relative z-10">
          <div class="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-on-primary-container">menu_book</span>
          </div>
          <h4 class="text-lg font-bold">${escapeHtml(s.name || 'Sem nome')}</h4>
          <p class="text-sm text-on-surface-variant mt-1">${escapeHtml(s.room || s.professor || '')}</p>
          <div class="mt-6 flex items-center justify-between">
            <span class="bg-secondary-container text-on-secondary-container text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">${s.is_active ? 'Ativa' : 'Inativa'}</span>
          </div>
        </div>
      `;
      container.appendChild(el);
    }
  } catch (err) {
    container.innerHTML = '<p class="text-sm text-on-surface-variant">Erro ao carregar disciplinas.</p>';
    console.error(err);
  }
}

// Auto-run when module is imported
fetchTasks();
fetchSubjects();

async function fetchProfile() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  try {
    const url = await buildApiUrlAsync('/api/v1/auth/validate-session');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) return;
    const data = await res.json();
    const user = data?.user || data?.user || data;

    const avatarEl = document.getElementById('profile-avatar');
    const nameEl = document.getElementById('profile-name');
    const roleEl = document.getElementById('profile-role');
    const headerNameEl = document.getElementById('header-account-name');
    const quoteNameEl = document.getElementById('concurso-quote-name');

    const metadata = user?.user_metadata || user?.user_metadata || {};
    const name = metadata?.full_name || metadata?.fullname || metadata?.name || user?.email || 'Você';
    const role = metadata?.role || metadata?.course || '';
    const avatar = metadata?.avatar_url || metadata?.avatar || '';

    if (avatarEl && avatar) avatarEl.src = avatar;
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = role;
    if (headerNameEl) headerNameEl.textContent = name;
    if (quoteNameEl) quoteNameEl.textContent = name;
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
  }
}

async function fetchSessions() {
  const token = localStorage.getItem(TOKEN_KEY);
  const container = document.getElementById('recent-sessions-list');
  if (!container) return;
  container.innerHTML = '<div class="min-w-[300px] bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary">Carregando sessões...</div>';

  if (!token) {
    container.innerHTML = '<div class="min-w-[300px] bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary">Você não está autenticado.</div>';
    return;
  }

  try {
    const url = await buildApiUrlAsync('/api/v1/sessions');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) {
      container.innerHTML = '<div class="min-w-[300px] bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary">Token inválido ou expirado.</div>';
      return;
    }

    const data = await res.json();
    const sessions = data?.data || [];
    if (!sessions.length) {
      container.innerHTML = '<div class="min-w-[300px] bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary">Nenhuma sessão encontrada.</div>';
      return;
    }

    container.innerHTML = '';
    for (const session of sessions.slice(0, 6)) {
      const card = document.createElement('div');
      card.className = 'min-w-[300px] bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary';
      const started = new Date(session.started_at || session.created_at || Date.now());
      const hours = String(started.getHours()).padStart(2, '0');
      const minutes = String(started.getMinutes()).padStart(2, '0');
      card.innerHTML = `
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
            <span class="material-symbols-outlined text-primary">history_edu</span>
          </div>
          <div>
            <p class="text-sm font-bold">${escapeHtml(session.subject?.name || 'Sessão de estudo')}</p>
            <p class="text-xs text-on-surface-variant">${started.toLocaleDateString('pt-BR')} • ${hours}:${minutes}</p>
          </div>
        </div>
        <div class="flex justify-between items-center text-xs font-bold text-on-surface-variant">
          <span>${session.duration_minutes || 0} min de foco</span>
          <span class="text-secondary">${session.depth ? `Profundidade ${session.depth}` : 'Sessão registrada'}</span>
        </div>
      `;
      container.appendChild(card);
    }
  } catch (err) {
    container.innerHTML = '<div class="min-w-[300px] bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary">Erro ao carregar sessões.</div>';
    console.error(err);
  }
}

// Auto-run profile fetch
fetchProfile();
fetchSessions();

export { fetchTasks, fetchSubjects, fetchProfile, fetchSessions };

// --- Create Task UI/logic ---
function buildCreateModal() {
  const existing = document.getElementById('create-task-modal');
  if (existing) return existing;

  const modal = document.createElement('div');
  modal.id = 'create-task-modal';
  modal.className = 'fixed inset-0 z-60 flex items-center justify-center bg-black/40 hidden';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg p-6">
      <h3 class="text-lg font-bold mb-4">Criar Tarefa</h3>
      <div class="space-y-3">
        <input id="ct-title" class="w-full p-3 rounded-md border" placeholder="Título da tarefa" />
        <textarea id="ct-desc" class="w-full p-3 rounded-md border" placeholder="Descrição (opcional)"></textarea>
        <div class="flex gap-2">
          <select id="ct-subject" class="flex-1 p-3 rounded-md border"><option value="">Sem disciplina</option></select>
          <input id="ct-due" type="date" class="p-3 rounded-md border" />
        </div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button id="ct-cancel" class="px-4 py-2 rounded-md border">Cancelar</button>
        <button id="ct-submit" class="px-4 py-2 rounded-md bg-primary text-white">Criar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

async function openCreateTaskModal() {
  const modal = buildCreateModal();
  modal.classList.remove('hidden');

  // populate subjects
  const select = modal.querySelector('#ct-subject');
  select.innerHTML = '<option value="">Sem disciplina</option>';
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const url = await buildApiUrlAsync('/api/v1/subjects');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      const subjects = data?.data || [];
      for (const s of subjects) {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        select.appendChild(opt);
      }
    }
  } catch (err) {
    console.error('Erro ao buscar disciplinas para modal', err);
  }

  modal.querySelector('#ct-cancel').onclick = () => { modal.classList.add('hidden'); };
  modal.querySelector('#ct-submit').onclick = async () => {
    const title = modal.querySelector('#ct-title').value.trim();
    const description = modal.querySelector('#ct-desc').value.trim();
    const subject_id = modal.querySelector('#ct-subject').value || null;
    const due_date = modal.querySelector('#ct-due').value || null;
    if (!title) return alert('Título é obrigatório');

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const postUrl = await buildApiUrlAsync('/api/v1/tasks');
      const res = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, subject_id, due_date })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Erro ao criar tarefa');
      }
      modal.classList.add('hidden');
      // refresh lists
      await fetchTasks();
      // optionally refresh subjects
      await fetchSubjects();
    } catch (err) {
      console.error(err);
      alert('Falha ao criar tarefa: ' + err.message);
    }
  };
}

// attach to floating button if present
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('create-task-btn');
  if (btn) btn.addEventListener('click', openCreateTaskModal);
});
