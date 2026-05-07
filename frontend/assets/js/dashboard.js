import { buildApiUrlAsync, TOKEN_KEY } from "./runtime-config.js?v=20260507";

function getPageMode() {
  const bodyMode = document.body?.dataset?.mode;
  if (bodyMode) return bodyMode;
  return window.location.pathname.includes('dash-concurso') ? 'competitive' : 'university';
}

function getModeLabel(mode) {
  return mode === 'competitive' ? 'Modo Concurso' : 'Modo Universitário';
}

function getRoleLabel(mode) {
  return mode === 'competitive' ? 'Concurseiro' : 'Universitário';
}

function getSubjectSectionMode() {
  return getPageMode();
}

let tasksCache = new Map();

async function syncCurrentMode(mode) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  try {
    const url = await buildApiUrlAsync('/api/v1/auth/me');
    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ current_mode: mode }),
    }).catch(() => null);
  } catch (err) {
    console.error('Erro ao sincronizar modo atual', err);
  }
}

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
    const tasks = sortTasksForDashboard(filterTasksForCurrentMode(data?.data || []));
    tasksCache = new Map(tasks.map((task) => [String(task.id), task]));

    if (!tasks.length) {
      container.innerHTML = "<p class=\"text-sm text-on-surface-variant\">Nenhuma tarefa encontrada.</p>";
      renderGrowthSummary([]);
      renderUniversityCalendar([]);
      return;
    }

    container.innerHTML = "";
    for (const t of tasks) {
      const el = document.createElement("div");
      el.dataset.taskCard = 'true';
      el.dataset.taskId = t.id;
      const due = formatTaskDueDate(t);
      const completed = isTaskCompleted(t);
      const subjectName = t.subject?.name || 'Sem disciplina';
      el.className = `flex items-start justify-between p-4 rounded-2xl transition-colors group cursor-pointer ${completed ? 'bg-secondary/5' : 'hover:bg-surface-container-low'}`;

      el.innerHTML = `
        <div class="flex items-start gap-4 md:gap-6 flex-1 min-w-0">
          <div class="w-14 h-14 rounded-2xl ${completed ? 'bg-secondary-container' : 'bg-tertiary-container'} flex flex-col items-center justify-center flex-shrink-0">
            <span class="text-[10px] font-bold ${completed ? 'text-on-secondary-container' : 'text-tertiary-fixed-dim'} uppercase">${escapeHtml(due.month)}</span>
            <span class="text-xl font-bold ${completed ? 'text-on-secondary-container' : 'text-tertiary-fixed-dim'} -mt-1">${escapeHtml(due.day)}</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0">${escapeHtml((t.type || "TAREFA").toUpperCase())}</span>
              <span class="bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0">${escapeHtml(subjectName)}</span>
              <h5 class="font-bold text-on-surface text-sm md:text-base truncate">${escapeHtml(t.title || "Sem título")}</h5>
            </div>
            <p class="text-sm text-on-surface-variant mt-0.5 line-clamp-2">${escapeHtml(t.description || "")}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" data-task-action="toggle" data-task-id="${t.id}" data-task-status="${escapeHtml(t.status || 'todo')}" class="px-3 py-1 rounded-full text-xs font-bold ${completed ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary'}">
                ${completed ? 'Feita' : 'Marcar feita'}
              </button>
              <button type="button" data-task-action="delete" data-task-id="${t.id}" class="px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant hover:text-error transition-colors">Apagar</button>
            </div>
          </div>
        </div>
        <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all cursor-pointer">chevron_right</span>
      `;
      container.appendChild(el);
    }

    renderGrowthSummary(tasks);
    renderUniversityCalendar(tasks);
    renderUniversityStats(tasks);
    bindTaskActions(container);
  } catch (err) {
    container.innerHTML = "<p class=\"text-sm text-on-surface-variant\">Erro ao carregar tarefas.</p>";
    console.error(err);
  }
}

function filterTasksForCurrentMode(tasks) {
  const mode = getPageMode();
  return tasks.filter((task) => {
    const subjectMode = String(task?.subject?.mode || '').trim();
    if (!subjectMode) return mode === 'university';
    return subjectMode === mode;
  });
}

function bindTaskActions(container) {
  if (!container || container.dataset.boundActions === 'true') return;
  container.dataset.boundActions = 'true';

  container.addEventListener('click', async (event) => {
    const actionButton = event.target.closest('[data-task-action]');
    if (!actionButton) return;

    const taskId = actionButton.dataset.taskId;
    const action = actionButton.dataset.taskAction;
    if (!taskId || !action) return;

    if (action === 'toggle') {
      const currentStatus = actionButton.dataset.taskStatus || 'todo';
      const nextStatus = isTaskCompleted({ status: currentStatus }) ? 'todo' : 'done';
      await patchTask(taskId, { status: nextStatus });
      await fetchTasks();
    }

    if (action === 'delete') {
      if (!confirm('Apagar esta tarefa?')) return;
      await deleteTask(taskId);
      await fetchTasks();
    }
  });

  container.addEventListener('click', (event) => {
    if (event.target.closest('[data-task-action]')) return;
    const taskCard = event.target.closest('[data-task-card]');
    if (!taskCard) return;

    const taskId = String(taskCard.dataset.taskId || '');
    const task = tasksCache.get(taskId);
    if (!task) return;

    openTaskDetailModal(task);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseDateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isTaskCompleted(task) {
  const status = String(task?.status || '').toLowerCase();
  return ['done', 'completed', 'feito', 'feita'].includes(status);
}

function sortTasksForDashboard(tasks) {
  return [...tasks].sort((left, right) => {
    const leftDate = parseDateValue(left?.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDate = parseDateValue(right?.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (leftDate !== rightDate) return leftDate - rightDate;
    const leftCreated = parseDateValue(left?.created_at)?.getTime() ?? 0;
    const rightCreated = parseDateValue(right?.created_at)?.getTime() ?? 0;
    return rightCreated - leftCreated;
  });
}

function formatTaskDueDate(task) {
  const date = parseDateValue(task?.due_date);
  if (!date) return { day: '--', month: 'Sem prazo', weekday: 'Sem prazo' };
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleString('pt-BR', { month: 'short' }),
    weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' })
  };
}

async function patchJson(pathname, payload, method = 'PATCH') {
  const token = localStorage.getItem(TOKEN_KEY);
  const url = await buildApiUrlAsync(pathname);
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || 'Falha na atualização');
  }
  return res.json();
}

async function patchTask(taskId, payload) {
  return patchJson(`/api/v1/tasks/${taskId}`, payload, 'PATCH');
}

async function deleteTask(taskId) {
  return patchJson(`/api/v1/tasks/${taskId}`, {}, 'DELETE');
}

async function patchSubject(subjectId, payload) {
  return patchJson(`/api/v1/subjects/${subjectId}`, payload, 'PATCH');
}

async function deleteSubject(subjectId) {
  return patchJson(`/api/v1/subjects/${subjectId}`, {}, 'DELETE');
}

function buildTaskDetailModal() {
  const existing = document.getElementById('task-detail-modal');
  if (existing) return existing;

  const modal = document.createElement('div');
  modal.id = 'task-detail-modal';
  modal.className = 'fixed inset-0 z-[80] hidden items-center justify-center bg-black/60 p-4';
  modal.innerHTML = `
    <div class="w-full max-w-2xl rounded-2xl bg-surface-container-lowest p-6 md:p-8 shadow-2xl">
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-secondary font-bold">Detalhe da tarefa</p>
          <h3 id="task-detail-title" class="text-xl md:text-2xl font-extrabold tracking-tight mt-1">-</h3>
        </div>
        <button type="button" data-task-detail-close class="text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="rounded-2xl bg-surface-container-low p-4 md:p-5 md:col-span-2">
          <p class="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold">Descrição</p>
          <p id="task-detail-description" class="text-sm md:text-base mt-2 whitespace-pre-wrap text-on-surface">-</p>
        </div>
        <div class="rounded-2xl bg-surface-container-low p-4 md:p-5">
          <p class="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold">Disciplina</p>
          <p id="task-detail-subject" class="text-sm md:text-base font-bold mt-2">-</p>
        </div>
        <div class="rounded-2xl bg-surface-container-low p-4 md:p-5">
          <p class="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold">Prazo</p>
          <p id="task-detail-due" class="text-sm md:text-base font-bold mt-2">-</p>
        </div>
        <div class="rounded-2xl bg-surface-container-low p-4 md:p-5">
          <p class="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold">Status</p>
          <p id="task-detail-status" class="text-sm md:text-base font-bold mt-2">-</p>
        </div>
        <div class="rounded-2xl bg-surface-container-low p-4 md:p-5">
          <p class="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold">Tipo</p>
          <p id="task-detail-type" class="text-sm md:text-base font-bold mt-2">-</p>
        </div>
        <div class="rounded-2xl bg-surface-container-low p-4 md:p-5">
          <p class="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold">Prioridade</p>
          <p id="task-detail-priority" class="text-sm md:text-base font-bold mt-2">-</p>
        </div>
        <div class="rounded-2xl bg-surface-container-low p-4 md:p-5">
          <p class="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold">Criada em</p>
          <p id="task-detail-created" class="text-sm md:text-base font-bold mt-2">-</p>
        </div>
        <div class="rounded-2xl bg-surface-container-low p-4 md:p-5">
          <p class="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold">Concluída em</p>
          <p id="task-detail-completed" class="text-sm md:text-base font-bold mt-2">-</p>
        </div>
        <div class="rounded-2xl bg-surface-container-low p-4 md:p-5 md:col-span-2">
          <p class="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold">Metadados</p>
          <pre id="task-detail-metadata" class="text-xs md:text-sm mt-2 whitespace-pre-wrap break-words text-on-surface">{}</pre>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button type="button" data-task-detail-close class="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold">Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function openTaskDetailModal(task) {
  if (!task) return;
  const modal = buildTaskDetailModal();

  const setText = (selector, value) => {
    const element = modal.querySelector(selector);
    if (element) element.textContent = value;
  };

  const dueDate = parseDateValue(task?.due_date);
  const createdAt = parseDateValue(task?.created_at);
  const completedAt = parseDateValue(task?.completed_at);
  const statusLabel = String(task?.status || 'todo') === 'done' ? 'Feita' : String(task?.status || 'todo');

  setText('#task-detail-title', task?.title || 'Sem título');
  setText('#task-detail-description', task?.description || 'Sem descrição');
  setText('#task-detail-subject', task?.subject?.name || 'Sem disciplina');
  setText('#task-detail-due', dueDate ? dueDate.toLocaleDateString('pt-BR') : 'Sem prazo');
  setText('#task-detail-status', statusLabel);
  setText('#task-detail-type', task?.type || 'task');
  setText('#task-detail-priority', Number.isFinite(Number(task?.priority)) ? String(task.priority) : '0');
  setText('#task-detail-created', createdAt ? createdAt.toLocaleString('pt-BR') : 'Não informado');
  setText('#task-detail-completed', completedAt ? completedAt.toLocaleString('pt-BR') : 'Não concluída');

  const metadataElement = modal.querySelector('#task-detail-metadata');
  if (metadataElement) {
    metadataElement.textContent = JSON.stringify(task?.metadata || {}, null, 2);
  }

  const closeModal = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };

  modal.querySelectorAll('[data-task-detail-close]').forEach((button) => {
    button.onclick = closeModal;
  });
  modal.onclick = (event) => {
    if (event.target === modal) closeModal();
  };

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function renderUniversityStats(tasks = [], subjects = [], profile = null) {
  const section = document.getElementById('stats-section');
  if (!section) return;

  const completed = tasks.filter((task) => isTaskCompleted(task)).length;
  const upcoming = tasks.filter((task) => parseDateValue(task?.due_date) && !isTaskCompleted(task)).length;
  const loginCount = Number(profile?.metadata?.login_count || 0);
  const lastLoginAt = profile?.metadata?.last_login_at ? new Date(profile.metadata.last_login_at).toLocaleString('pt-BR') : 'Sem histórico';

  const loginCountEl = document.getElementById('dashboard-login-count');
  const completedEl = document.getElementById('dashboard-completed-tasks');
  const upcomingEl = document.getElementById('dashboard-upcoming-tasks');
  const subjectCountEl = document.getElementById('dashboard-subject-count');
  const lastLoginEl = document.getElementById('dashboard-last-login');

  if (loginCountEl) loginCountEl.textContent = `${loginCount}`;
  if (completedEl) completedEl.textContent = `${completed}`;
  if (upcomingEl) upcomingEl.textContent = `${upcoming}`;
  if (subjectCountEl) subjectCountEl.textContent = `${subjects.length}`;
  if (lastLoginEl) lastLoginEl.textContent = lastLoginAt;
}

function renderContestStats(sessions = [], subjects = [], profile = null) {
  const section = document.getElementById('stats-section');
  if (!section) return;

  const loginCount = Number(profile?.metadata?.login_count || 0);
  const totalHours = sessions.reduce((sum, session) => sum + getSessionDurationMinutes(session), 0);
  const totalQuestions = sessions.reduce((sum, session) => sum + Number(session?.questions_answered || 0), 0);
  const simuladoCount = sessions.filter((session) => session?.metadata?.is_simulado || session?.metadata?.simulado || session?.metadata?.score != null).length;

  const loginCountEl = document.getElementById('contest-login-count');
  const hoursEl = document.getElementById('contest-stat-hours');
  const questionsEl = document.getElementById('contest-stat-questions');
  const simulatedEl = document.getElementById('contest-stat-simulados');
  const subjectCountEl = document.getElementById('contest-stat-subjects');

  if (loginCountEl) loginCountEl.textContent = `${loginCount}`;
  if (hoursEl) hoursEl.textContent = `${(totalHours / 60).toFixed(totalHours % 60 === 0 ? 0 : 1)}h`;
  if (questionsEl) questionsEl.textContent = `${totalQuestions}`;
  if (simulatedEl) simulatedEl.textContent = `${simuladoCount}`;
  if (subjectCountEl) subjectCountEl.textContent = `${subjects.length}`;
}

function buildSubjectModal(mode) {
  const existing = document.getElementById('create-subject-modal');
  if (existing) return existing;

  const modal = document.createElement('div');
  modal.id = 'create-subject-modal';
  modal.className = 'fixed inset-0 z-60 hidden items-center justify-center bg-black/50 p-4';
  modal.innerHTML = `
    <div class="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-6 md:p-8 shadow-2xl">
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-secondary font-bold">${escapeHtml(getModeLabel(mode))}</p>
          <h3 class="text-xl md:text-2xl font-extrabold tracking-tight mt-1">Nova Matéria</h3>
        </div>
        <button type="button" data-subject-close class="text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="space-y-2 md:col-span-2">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nome</span>
          <input id="subject-name" type="text" placeholder="Ex: PDSI 2, Direito Constitucional..." class="w-full p-3 rounded-xl border border-outline-variant/30 bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Professor/Área</span>
          <input id="subject-professor" type="text" placeholder="Opcional" class="w-full p-3 rounded-xl border border-outline-variant/30 bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sala/Observação</span>
          <input id="subject-room" type="text" placeholder="Opcional" class="w-full p-3 rounded-xl border border-outline-variant/30 bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Cor</span>
          <input id="subject-color" type="color" value="#006a60" class="w-full h-12 rounded-xl border border-outline-variant/30 bg-white p-1" />
        </label>
        <label class="space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Código</span>
          <input id="subject-code" type="text" placeholder="Opcional" class="w-full p-3 rounded-xl border border-outline-variant/30 bg-white" />
        </label>
      </div>
      <div class="mt-6 flex items-center justify-end gap-3">
        <button type="button" data-subject-close class="px-4 py-2 rounded-xl border border-outline-variant/20 text-sm font-semibold">Cancelar</button>
        <button type="button" id="subject-submit" class="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold">Salvar matéria</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

async function openCreateSubjectModal(mode = getSubjectSectionMode()) {
  const modal = buildSubjectModal(mode);
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  const closeModal = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };

  modal.querySelectorAll('[data-subject-close]').forEach((button) => {
    button.onclick = closeModal;
  });
  modal.onclick = (event) => {
    if (event.target === modal) closeModal();
  };

  modal.querySelector('#subject-submit').onclick = async () => {
    const name = modal.querySelector('#subject-name').value.trim();
    const professor = modal.querySelector('#subject-professor').value.trim();
    const room = modal.querySelector('#subject-room').value.trim();
    const color = modal.querySelector('#subject-color').value;
    const code = modal.querySelector('#subject-code').value.trim();

    if (!name) {
      alert('Nome da matéria é obrigatório');
      return;
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const postUrl = await buildApiUrlAsync('/api/v1/subjects');
      const res = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          professor: professor || null,
          room: room || null,
          color,
          code: code || null,
          mode,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Erro ao criar matéria');
      }

      closeModal();
      await fetchSubjects();
      await fetchTasks();
      await fetchSessions();
    } catch (err) {
      alert('Falha ao criar matéria: ' + err.message);
    }
  };
}

function renderGrowthSummary(tasks) {
  const completed = tasks.filter((task) => isTaskCompleted(task)).length;
  const pending = Math.max(tasks.length - completed, 0);
  const completedEl = document.getElementById('growth-completed-count');
  const pendingEl = document.getElementById('growth-pending-count');
  if (completedEl) completedEl.textContent = `${completed} feitas`;
  if (pendingEl) pendingEl.textContent = `${pending} pendentes`;
}

function renderUniversityCalendar(tasks) {
  const card = document.getElementById('university-calendar-card');
  if (!card) return;

  const upcoming = sortTasksForDashboard(tasks)
    .filter((task) => parseDateValue(task?.due_date))
    .slice(0, 5);

  const emptyState = '<p class="text-white/70 text-sm">Sem tarefas com prazo definido ainda.</p>';
  card.innerHTML = `
    <div class="relative z-10">
      <div class="flex justify-between items-center mb-4 md:mb-6">
        <h3 class="text-lg md:text-xl font-bold">Calendário</h3>
        <button class="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all" type="button" aria-label="Atualizar calendário">
          <span class="material-symbols-outlined text-sm">event</span>
        </button>
      </div>
      <div class="space-y-2 md:space-y-4">
        ${upcoming.length ? upcoming.map((task) => {
          const due = formatTaskDueDate(task);
          const subject = task?.subject?.name ? ` • ${escapeHtml(task.subject.name)}` : '';
          return `
            <div class="p-2 md:p-3 bg-white/5 border border-white/10 rounded-xl">
              <p class="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-secondary">${escapeHtml(due.weekday)}</p>
              <p class="text-xs md:text-sm font-semibold mt-1">${escapeHtml(task.title || 'Sem título')}</p>
              <p class="text-[8px] md:text-[10px] opacity-60 mt-0.5">${escapeHtml(due.day)} ${escapeHtml(due.month)}${subject}</p>
            </div>
          `;
        }).join('') : emptyState}
      </div>
    </div>
  `;
}

// Auto-run when module is imported
fetchTasks();
fetchSubjects();

async function fetchSubjects() {
  const token = localStorage.getItem(TOKEN_KEY);
  const mode = getSubjectSectionMode();
  const container = document.getElementById(mode === 'competitive' ? 'contest-subjects-list' : 'subjects-list');
  if (!container) return;
  container.innerHTML = '<p class="text-sm text-on-surface-variant">Carregando disciplinas...</p>';

  if (!token) {
    container.innerHTML = '<p class="text-sm text-on-surface-variant">Você não está autenticado.</p>';
    return;
  }

  try {
    const url = await buildApiUrlAsync(`/api/v1/subjects?mode=${encodeURIComponent(mode)}`);
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
          <div class="mt-6 flex items-center justify-between gap-2 flex-wrap">
            <span class="bg-secondary-container text-on-secondary-container text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">${s.is_active ? 'Ativa' : 'Inativa'}</span>
            <div class="flex gap-2">
              <button type="button" data-subject-action="edit" data-subject-id="${s.id}" data-subject-name="${escapeHtml(s.name || '')}" data-subject-professor="${escapeHtml(s.professor || '')}" data-subject-room="${escapeHtml(s.room || '')}" class="text-[10px] font-bold uppercase tracking-wider text-secondary hover:underline">Editar</button>
              <button type="button" data-subject-action="delete" data-subject-id="${s.id}" class="text-[10px] font-bold uppercase tracking-wider text-error hover:underline">Apagar</button>
            </div>
          </div>
        </div>
      `;
      container.appendChild(el);
    }

    if (container.dataset.boundActions !== 'true') {
      container.dataset.boundActions = 'true';
      container.addEventListener('click', async (event) => {
        const actionButton = event.target.closest('[data-subject-action]');
        if (!actionButton) return;

        const subjectId = actionButton.dataset.subjectId;
        const action = actionButton.dataset.subjectAction;
        if (!subjectId || !action) return;

        if (action === 'edit') {
          const name = prompt('Nome da matéria', actionButton.dataset.subjectName || '');
          if (!name || !name.trim()) return;
          const professor = prompt('Professor', actionButton.dataset.subjectProfessor || '');
          const room = prompt('Sala', actionButton.dataset.subjectRoom || '');
          await patchSubject(subjectId, { name: name.trim(), professor: professor?.trim() || null, room: room?.trim() || null });
          await fetchSubjects();
        }

        if (action === 'delete') {
          if (!confirm('Apagar esta matéria? As tarefas associadas continuam no histórico.')) return;
          await deleteSubject(subjectId);
          await fetchSubjects();
          await fetchTasks();
          await fetchSessions();
        }
      });
    }
  } catch (err) {
    container.innerHTML = '<p class="text-sm text-on-surface-variant">Erro ao carregar disciplinas.</p>';
    console.error(err);
  }
}

async function fetchProfile() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    console.warn('No token in localStorage, skipping profile fetch');
    return;
  }

  try {
    const url = await buildApiUrlAsync('/api/v1/auth/validate-session');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    
    if (!res.ok) {
      console.warn(`Profile fetch returned ${res.status}`);
      return;
    }
    
    const data = await res.json();
    console.log('Profile data from API:', data);
    
    const user = data?.user || {};
    const profile = data?.profile || user?.profile || {};

    const avatarEl = document.getElementById('profile-avatar');
    const nameEl = document.getElementById('profile-name');
    const roleEl = document.getElementById('profile-role');
    const headerNameEl = document.getElementById('header-account-name');
    const headerRoleEl = document.getElementById('header-account-role');
    const quoteNameEl = document.getElementById('concurso-quote-name');

    const metadata = profile?.metadata || user?.user_metadata || {};
    const name = profile?.full_name || metadata?.full_name || metadata?.fullname || metadata?.name || user?.email || 'Você';
    const role = profile?.current_mode || metadata?.role || metadata?.course || '';
    const avatar = profile?.avatar_url || metadata?.avatar_url || metadata?.avatar || '';
    const pageMode = getPageMode();

    console.log('Updating profile elements with name:', name);

    if (avatarEl && avatar) avatarEl.src = avatar;
    if (nameEl) {
      nameEl.textContent = name;
      console.log('Updated profile-name element to:', name);
    }
    if (roleEl) roleEl.textContent = role === 'competitive' ? 'Concurseiro' : role === 'university' ? 'Universitário' : (role || getRoleLabel(pageMode));
    if (headerNameEl) headerNameEl.textContent = name;
    if (headerRoleEl) headerRoleEl.textContent = getModeLabel(pageMode);
    if (quoteNameEl) quoteNameEl.textContent = name;

    const subjects = await fetchSubjectsForStatsOnly(pageMode);
    const tasks = await fetchTasksForStatsOnly();
    const sessions = await fetchSessionsForStatsOnly();
    if (pageMode === 'competitive') {
      renderContestStats(sessions, subjects, profile);
    } else {
      renderUniversityStats(tasks, subjects, profile);
    }
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
    const contestSubjects = window.location.pathname.includes('dash-concurso') ? await fetchSubjectsForStatsOnly('competitive') : [];
    const subjectLookup = new Map((contestSubjects || []).map((subject) => [subject.id, subject]));
    if (!sessions.length) {
      container.innerHTML = '<div class="min-w-[300px] bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary">Nenhuma sessão encontrada.</div>';
      renderContestMetrics([]);
      renderContestSimulados([]);
      return;
    }

    container.innerHTML = '';
    for (const session of sessions.slice(0, 6)) {
      const card = document.createElement('div');
      card.className = 'min-w-[300px] bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary';
      const started = new Date(session.started_at || session.created_at || Date.now());
      const hours = String(started.getHours()).padStart(2, '0');
      const minutes = String(started.getMinutes()).padStart(2, '0');
      const subjectName = getSessionSubjectName(session, subjectLookup);
      card.innerHTML = `
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
            <span class="material-symbols-outlined text-primary">history_edu</span>
          </div>
          <div>
            <p class="text-sm font-bold">${escapeHtml(subjectName || 'Sessão de estudo')}</p>
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

    renderContestMetrics(sessions);
    renderContestSimulados(sessions, subjectLookup);
    const masterySubjects = await fetchSubjectsForStatsOnly('competitive');
    renderContestMastery(masterySubjects, sessions);
    renderContestFocus(sessions, subjectLookup);
    renderContestStats(sessions, masterySubjects, await getCurrentProfileForStatsOnly());
  } catch (err) {
    container.innerHTML = '<div class="min-w-[300px] bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary">Erro ao carregar sessões.</div>';
    console.error(err);
  }
}

async function fetchTasksForStatsOnly() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return [];
  try {
    const url = await buildApiUrlAsync('/api/v1/tasks');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const data = await res.json();
    return filterTasksForCurrentMode(data?.data || []);
  } catch {
    return [];
  }
}

async function fetchSubjectsForStatsOnly(mode = getSubjectSectionMode()) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return [];
  try {
    const url = await buildApiUrlAsync(`/api/v1/subjects?mode=${encodeURIComponent(mode)}`);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || [];
  } catch {
    return [];
  }
}

async function fetchSessionsForStatsOnly() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return [];
  try {
    const url = await buildApiUrlAsync('/api/v1/sessions');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || [];
  } catch {
    return [];
  }
}

async function getCurrentProfileForStatsOnly() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const url = await buildApiUrlAsync('/api/v1/auth/validate-session');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.profile || data?.user?.profile || null;
  } catch {
    return null;
  }
}

function bindCreateSubjectButtons() {
  const mode = getPageMode();
  const universityBtn = document.getElementById('create-subject-btn');
  if (universityBtn) universityBtn.addEventListener('click', () => openCreateSubjectModal(mode));
  const contestBtn = document.getElementById('create-contest-subject-btn');
  if (contestBtn) contestBtn.addEventListener('click', () => openCreateSubjectModal(mode));
  const contestInlineBtn = document.getElementById('create-contest-subject-btn-inline');
  if (contestInlineBtn) contestInlineBtn.addEventListener('click', () => openCreateSubjectModal(mode));
}

function bindStatsLinks() {
  const statsLinks = Array.from(document.querySelectorAll('[data-stats-link]'));
  statsLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function bindModeSwitchButtons() {
  const mode = getPageMode();
  const targetUrl = mode === 'competitive' ? '../dash-universidade/index.html' : '../dash-concurso/index.html';
  const buttons = Array.from(document.querySelectorAll('[data-mode-switch]'));

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      await syncCurrentMode(mode === 'competitive' ? 'university' : 'competitive');
      window.location.href = targetUrl;
    });
  });
}

function getSessionDurationMinutes(session) {
  const started = parseDateValue(session?.started_at);
  const ended = parseDateValue(session?.ended_at);
  if (started && ended) {
    return Math.max(0, Math.round((ended.getTime() - started.getTime()) / 60000));
  }
  if (Number.isFinite(session?.duration_minutes)) return Number(session.duration_minutes);
  if (session?.metadata?.duration_minutes) return Number(session.metadata.duration_minutes);
  return 0;
}

function renderContestMetrics(sessions) {
  const totalMinutes = sessions.reduce((sum, session) => sum + getSessionDurationMinutes(session), 0);
  const totalHours = (totalMinutes / 60).toFixed(totalMinutes % 60 === 0 ? 0 : 1);
  const totalQuestions = sessions.reduce((sum, session) => sum + Number(session?.questions_answered || 0), 0);
  const totalSimulados = sessions.filter((session) => session?.metadata?.is_simulado || session?.metadata?.simulado || session?.metadata?.score != null).length;
  const scoredSessions = sessions.filter((session) => Number.isFinite(Number(session?.metadata?.score)));
  const averageScore = scoredSessions.length
    ? Math.round(scoredSessions.reduce((sum, session) => sum + Number(session.metadata.score || 0), 0) / scoredSessions.length)
    : Math.min(100, Math.round((totalQuestions / Math.max(1, totalQuestions + 40)) * 100));

  const totalHoursEl = document.getElementById('contest-total-hours');
  const questionsTotalEl = document.getElementById('contest-questions-total');
  const questionsRateEl = document.getElementById('contest-questions-rate');
  const questionsCorrectEl = document.getElementById('contest-questions-correct');
  const questionsWrongEl = document.getElementById('contest-questions-wrong');
  const simulatedCountEl = document.getElementById('contest-simulated-count');
  const simulatedScoreEl = document.getElementById('contest-simulated-score');

  if (totalHoursEl) totalHoursEl.textContent = `${totalHours}h`;
  if (questionsTotalEl) questionsTotalEl.textContent = `${totalQuestions}`;
  if (questionsRateEl) questionsRateEl.textContent = `${averageScore}% Concluído`;
  if (questionsCorrectEl) questionsCorrectEl.textContent = `${Math.round(totalQuestions * (averageScore / 100))}`;
  if (questionsWrongEl) questionsWrongEl.textContent = `${Math.max(totalQuestions - Math.round(totalQuestions * (averageScore / 100)), 0)}`;
  if (simulatedCountEl) simulatedCountEl.textContent = `${totalSimulados} simulados`;
  if (simulatedScoreEl) simulatedScoreEl.textContent = totalSimulados ? `Média ${averageScore}%` : 'Sem simulados';
}

function renderContestSimulados(sessions, subjectLookup = new Map()) {
  const container = document.getElementById('contest-simulated-list');
  if (!container) return;

  const simulatedSessions = sessions.filter((session) => session?.metadata?.is_simulado || session?.metadata?.simulado || session?.metadata?.score != null)
    .slice(0, 3);

  if (!simulatedSessions.length) {
    container.innerHTML = '<p class="text-sm text-on-surface-variant">Nenhum simulado registrado ainda.</p>';
    return;
  }

  container.innerHTML = simulatedSessions.map((session) => {
    const subjectName = getSessionSubjectName(session, subjectLookup);
    const initials = String(subjectName || 'Simulado')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const score = session?.metadata?.score != null ? `${session.metadata.score}%` : 'Sem nota';
    return `
      <div class="p-3 md:p-4 bg-surface-container-low rounded-lg flex items-center justify-between">
        <div class="flex items-center gap-2 md:gap-3 min-w-0">
          <div class="w-8 md:w-10 h-8 md:h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-xs md:text-sm flex-shrink-0">${escapeHtml(initials || 'SM')}</div>
          <div class="min-w-0">
            <p class="text-xs md:text-sm font-bold truncate">${escapeHtml(session?.metadata?.simulado_name || subjectName || 'Simulado')}</p>
            <p class="text-[8px] md:text-[10px] text-on-surface-variant">Pontuação: ${escapeHtml(score)}</p>
          </div>
        </div>
        <span class="material-symbols-outlined text-secondary text-sm flex-shrink-0">verified</span>
      </div>
    `;
  }).join('');
}

function renderContestMastery(subjects, sessions) {
  const container = document.getElementById('contest-mastery-list');
  if (!container) return;

  const subjectHours = new Map();
  for (const subject of subjects || []) {
    subjectHours.set(subject.id, { name: subject.name || 'Sem nome', minutes: 0 });
  }

  for (const session of sessions || []) {
    const subjectId = session?.subject_id;
    if (!subjectId || !subjectHours.has(subjectId)) continue;
    const current = subjectHours.get(subjectId);
    current.minutes += getSessionDurationMinutes(session);
  }

  const ordered = Array.from(subjectHours.values())
    .filter((item) => item.minutes > 0)
    .sort((left, right) => right.minutes - left.minutes)
    .slice(0, 5);

  if (!ordered.length) {
    container.innerHTML = '<p class="text-sm text-on-surface-variant">Sem horas registradas nas matérias do concurso.</p>';
    return;
  }

  const maxMinutes = Math.max(...ordered.map((item) => item.minutes), 1);
  container.innerHTML = ordered.map((item) => {
    const percent = Math.max(8, Math.round((item.minutes / maxMinutes) * 100));
    return `
      <div>
        <div class="flex justify-between items-end mb-2 gap-3">
          <span class="text-xs md:text-sm font-bold truncate">${escapeHtml(item.name)}</span>
          <span class="text-[10px] text-on-surface-variant font-medium whitespace-nowrap">${escapeHtml(formatMinutesLabel(item.minutes))}</span>
        </div>
        <div class="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <div class="h-full bg-secondary rounded-full" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderContestFocus(sessions, subjectLookup = new Map()) {
  const lastSession = [...(sessions || [])].sort((left, right) => {
    const leftDate = parseDateValue(left?.started_at)?.getTime() ?? 0;
    const rightDate = parseDateValue(right?.started_at)?.getTime() ?? 0;
    return rightDate - leftDate;
  })[0];

  const lastSessionEl = document.getElementById('contest-last-session');
  const subjectEl = document.getElementById('contest-focus-subject');
  const durationEl = document.getElementById('contest-focus-duration');
  const scoreEl = document.getElementById('contest-focus-score');

  if (!lastSession) {
    if (lastSessionEl) lastSessionEl.textContent = 'Sem sessões registradas';
    if (subjectEl) subjectEl.textContent = '-';
    if (durationEl) durationEl.textContent = '0h';
    if (scoreEl) scoreEl.textContent = '-';
    return;
  }

  const started = parseDateValue(lastSession?.started_at) || new Date();
  const subjectName = getSessionSubjectName(lastSession, subjectLookup);
  const durationMinutes = getSessionDurationMinutes(lastSession);
  const score = lastSession?.metadata?.score != null ? `${lastSession.metadata.score}%` : 'Sem nota';

  if (lastSessionEl) lastSessionEl.textContent = `${started.toLocaleDateString('pt-BR')} às ${started.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  if (subjectEl) subjectEl.textContent = subjectName;
  if (durationEl) durationEl.textContent = formatMinutesLabel(durationMinutes);
  if (scoreEl) scoreEl.textContent = score;
}

function formatMinutesLabel(totalMinutes) {
  const minutes = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) return `${remainingMinutes} min`;
  if (!remainingMinutes) return `${hours}h`;
  return `${hours}h ${remainingMinutes}min`;
}

function getSessionSubjectName(session, subjectLookup = new Map()) {
  return session?.subject?.name || subjectLookup.get(session?.subject_id)?.name || 'Sem matéria';
}

function buildSessionModal() {
  const existing = document.getElementById('create-session-modal');
  if (existing) return existing;

  const modal = document.createElement('div');
  modal.id = 'create-session-modal';
  modal.className = 'fixed inset-0 z-60 hidden items-center justify-center bg-black/50 p-4';
  modal.innerHTML = `
    <div class="w-full max-w-xl rounded-2xl bg-surface-container-lowest p-6 md:p-8 shadow-2xl">
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-secondary font-bold">Modo Concurso</p>
          <h3 class="text-xl md:text-2xl font-extrabold tracking-tight mt-1">Registrar Sessão de Estudo</h3>
        </div>
        <button type="button" data-session-close class="text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="space-y-2 md:col-span-2">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Matéria</span>
          <select id="session-subject" class="w-full p-3 rounded-xl border border-outline-variant/30 bg-white">
            <option value="">Sem matéria</option>
          </select>
        </label>
        <label class="space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tempo</span>
          <input id="session-duration-value" type="number" min="1" step="1" value="60" class="w-full p-3 rounded-xl border border-outline-variant/30 bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Unidade</span>
          <select id="session-duration-unit" class="w-full p-3 rounded-xl border border-outline-variant/30 bg-white">
            <option value="minutes">Minutos</option>
            <option value="hours">Horas</option>
          </select>
        </label>
        <label class="space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Questões respondidas</span>
          <input id="session-questions" type="number" min="0" step="1" value="0" class="w-full p-3 rounded-xl border border-outline-variant/30 bg-white" />
        </label>
        <label class="space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Pontuação do simulado</span>
          <input id="session-score" type="number" min="0" max="100" step="1" placeholder="Opcional" class="w-full p-3 rounded-xl border border-outline-variant/30 bg-white" />
        </label>
        <label class="space-y-2 md:col-span-2">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nome do simulado</span>
          <input id="session-simulado-name" type="text" placeholder="Opcional" class="w-full p-3 rounded-xl border border-outline-variant/30 bg-white" />
        </label>
        <label class="space-y-2 md:col-span-2">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Observações</span>
          <textarea id="session-notes" rows="3" placeholder="Notas da sessão, edital, contexto..." class="w-full p-3 rounded-xl border border-outline-variant/30 bg-white"></textarea>
        </label>
      </div>
      <div class="mt-6 flex items-center justify-between gap-4">
        <label class="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
          <input id="session-is-simulado" type="checkbox" class="w-4 h-4 rounded border-outline-variant" />
          Marcar como simulado
        </label>
        <div class="flex gap-3">
          <button type="button" data-session-close class="px-4 py-2 rounded-xl border border-outline-variant/20 text-sm font-semibold">Cancelar</button>
          <button type="button" id="session-submit" class="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold">Salvar sessão</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

async function openCreateSessionModal() {
  const modal = buildSessionModal();
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  const closeModal = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };

  modal.querySelectorAll('[data-session-close]').forEach((button) => {
    button.onclick = closeModal;
  });
  modal.onclick = (event) => {
    if (event.target === modal) closeModal();
  };

  const select = modal.querySelector('#session-subject');
  select.innerHTML = '<option value="">Sem matéria</option>';
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const url = await buildApiUrlAsync('/api/v1/subjects?mode=competitive');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      for (const subject of data?.data || []) {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        select.appendChild(option);
      }
    }
  } catch (err) {
    console.error('Erro ao buscar disciplinas para sessão', err);
  }

  modal.querySelector('#session-submit').onclick = async () => {
    const subject_id = select.value || null;
    const durationValue = Number(modal.querySelector('#session-duration-value').value || 0);
    const durationUnit = modal.querySelector('#session-duration-unit').value || 'minutes';
    const questions_answered = Number(modal.querySelector('#session-questions').value || 0);
    const scoreValue = modal.querySelector('#session-score').value;
    const simuladoName = modal.querySelector('#session-simulado-name').value.trim();
    const notes = modal.querySelector('#session-notes').value.trim();
    const isSimulado = modal.querySelector('#session-is-simulado').checked || Boolean(scoreValue);

    if (!subject_id) {
      alert('Selecione uma matéria para a sessão');
      return;
    }

    if (!durationValue || durationValue <= 0) {
      alert('Informe a duração da sessão');
      return;
    }

    const durationMinutes = durationUnit === 'hours' ? durationValue * 60 : durationValue;
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - durationMinutes * 60000);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const postUrl = await buildApiUrlAsync('/api/v1/sessions');
      const res = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject_id,
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
          questions_answered,
          depth: null,
          notes,
          metadata: {
            duration_minutes: durationMinutes,
            is_simulado: isSimulado,
            simulado_name: simuladoName || null,
            score: scoreValue ? Number(scoreValue) : null,
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Falha ao criar sessão');
      }

      closeModal();
      await fetchSessions();
    } catch (err) {
      alert(err.message || 'Falha ao salvar sessão');
      console.error(err);
    }
  };
}

function hideNotificationPopover(popover) {
  if (!popover) return;
  popover.classList.add('hidden');
}

function bindDashboardNotifications() {
  const button = document.getElementById('dashboard-notifications-button');
  if (!button) return;

  let popover = document.getElementById('dashboard-notifications-popover');
  if (!popover) {
    popover = document.createElement('div');
    popover.id = 'dashboard-notifications-popover';
    popover.className = 'hidden fixed z-[70] w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl p-4';
    popover.innerHTML = `
      <div class="flex items-start justify-between gap-3 mb-3">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-secondary font-bold">Notificações</p>
          <h4 class="text-sm font-bold text-on-surface mt-1">Central rápida</h4>
        </div>
        <button type="button" data-notification-close class="text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined text-base">close</span>
        </button>
      </div>
      <p class="text-sm text-on-surface-variant leading-relaxed">Nenhuma notificação nova no momento. Quando houver alertas do estudo, eles vão aparecer aqui.</p>
    `;
    document.body.appendChild(popover);
    popover.querySelector('[data-notification-close]')?.addEventListener('click', () => hideNotificationPopover(popover));
  }

  const positionPopover = () => {
    const rect = button.getBoundingClientRect();
    popover.style.top = `${Math.round(rect.bottom + 12)}px`;
    popover.style.left = `${Math.max(16, Math.round(rect.right - popover.offsetWidth))}px`;
  };

  const togglePopover = (event) => {
    event.stopPropagation();
    const isHidden = popover.classList.contains('hidden');
    if (isHidden) {
      popover.classList.remove('hidden');
      positionPopover();
    } else {
      hideNotificationPopover(popover);
    }
  };

  button.addEventListener('click', togglePopover);
  window.addEventListener('resize', () => {
    if (!popover.classList.contains('hidden')) positionPopover();
  });
  document.addEventListener('click', (event) => {
    if (popover.classList.contains('hidden')) return;
    if (popover.contains(event.target) || button.contains(event.target)) return;
    hideNotificationPopover(popover);
  });
}

function bindDashboardLogout() {
  const logoutButton = document.getElementById('dashboard-logout-button');
  if (!logoutButton) return;

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

// Nota: fetchProfile() e fetchSessions() agora são chamados em initializeDashboard()
// quando o DOM está pronto, não na raiz do módulo

export { fetchTasks, fetchSubjects, fetchProfile, fetchSessions, bindDashboardLogout, bindDashboardNotifications, openCreateSessionModal, openCreateTaskModal };

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
          <input id="ct-due" type="date" class="p-3 rounded-md border" required />
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
    const url = await buildApiUrlAsync('/api/v1/subjects?mode=university');
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
    if (!due_date) return alert('A data de entrega é obrigatória');

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

// expose for callers that import as modules or need a global hook
window.openCreateTaskModal = openCreateTaskModal;

// attach to floating button if present
const initializeDashboard = () => {
  const btn = document.getElementById('create-task-btn');
  if (btn) btn.addEventListener('click', openCreateTaskModal);
  const sessionBtn = document.getElementById('open-session-modal-btn');
  if (sessionBtn) sessionBtn.addEventListener('click', openCreateSessionModal);
  bindDashboardNotifications();
  bindDashboardLogout();
  bindCreateSubjectButtons();
  bindStatsLinks();
  bindModeSwitchButtons();
  syncCurrentMode(getPageMode());
  
  // Ensure profile and sessions are fetched after DOM is ready
  console.log('Dashboard initialization: Calling fetchProfile and fetchSessions');
  fetchProfile();
  fetchSessions();
};

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  // DOM is already loaded (script was loaded at end of body)
  initializeDashboard();
}
