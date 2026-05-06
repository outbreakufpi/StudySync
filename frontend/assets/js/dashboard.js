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

export { fetchTasks };
