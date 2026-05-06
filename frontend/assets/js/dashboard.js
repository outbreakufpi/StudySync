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
    const tasks = sortTasksForDashboard(data?.data || []);

    if (!tasks.length) {
      container.innerHTML = "<p class=\"text-sm text-on-surface-variant\">Nenhuma tarefa encontrada.</p>";
      renderGrowthSummary([]);
      renderUniversityCalendar([]);
      return;
    }

    container.innerHTML = "";
    for (const t of tasks) {
      const el = document.createElement("div");
      const due = formatTaskDueDate(t);
      const completed = isTaskCompleted(t);
      const subjectName = t.subject?.name || 'Sem disciplina';
      el.className = `flex items-start justify-between p-4 rounded-2xl transition-colors group ${completed ? 'bg-secondary/5' : 'hover:bg-surface-container-low'}`;

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
    bindTaskActions(container);
  } catch (err) {
    container.innerHTML = "<p class=\"text-sm text-on-surface-variant\">Erro ao carregar tarefas.</p>";
    console.error(err);
  }
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
        }
      });
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

    renderContestMetrics(sessions);
    renderContestSimulados(sessions);
  } catch (err) {
    container.innerHTML = '<div class="min-w-[300px] bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary">Erro ao carregar sessões.</div>';
    console.error(err);
  }
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

function renderContestSimulados(sessions) {
  const container = document.getElementById('contest-simulated-list');
  if (!container) return;

  const simulatedSessions = sessions.filter((session) => session?.metadata?.is_simulado || session?.metadata?.simulado || session?.metadata?.score != null)
    .slice(0, 3);

  if (!simulatedSessions.length) {
    container.innerHTML = '<p class="text-sm text-on-surface-variant">Nenhum simulado registrado ainda.</p>';
    return;
  }

  container.innerHTML = simulatedSessions.map((session) => {
    const initials = String(session?.subject?.name || 'Simulado')
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
            <p class="text-xs md:text-sm font-bold truncate">${escapeHtml(session?.metadata?.simulado_name || session?.subject?.name || 'Simulado')}</p>
            <p class="text-[8px] md:text-[10px] text-on-surface-variant">Pontuação: ${escapeHtml(score)}</p>
          </div>
        </div>
        <span class="material-symbols-outlined text-secondary text-sm flex-shrink-0">verified</span>
      </div>
    `;
  }).join('');
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
    const url = await buildApiUrlAsync('/api/v1/subjects');
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

  logoutButton.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '../login/index.html';
  });
}

// Auto-run profile fetch
fetchProfile();
fetchSessions();

export { fetchTasks, fetchSubjects, fetchProfile, fetchSessions, bindDashboardLogout, bindDashboardNotifications, openCreateSessionModal };

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
  const sessionBtn = document.getElementById('open-session-modal-btn');
  if (sessionBtn) sessionBtn.addEventListener('click', openCreateSessionModal);
  bindDashboardNotifications();
  bindDashboardLogout();
});
