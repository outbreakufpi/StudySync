import { TOKEN_KEY } from './runtime-config.js';

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);
  const label = document.getElementById('theme-label');
  if (label) label.textContent = theme === 'dark' ? 'Escuro' : 'Claro';
}

function loadSettingsPage() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  const token = localStorage.getItem(TOKEN_KEY);
  const statusEl = document.getElementById('settings-status');
  if (statusEl) {
    statusEl.textContent = token ? 'Configurações locais ativas. Você está autenticado.' : 'Você não está autenticado.';
  }

  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.addEventListener('change', (event) => applyTheme(event.target.value));
  }

  const clearCacheButton = document.getElementById('clear-cache-button');
  if (clearCacheButton) {
    clearCacheButton.addEventListener('click', () => {
      localStorage.removeItem('api_origin');
      localStorage.removeItem('theme');
      alert('Cache local limpo. Recarregue a página.');
    });
  }

  const logoutButton = document.getElementById('settings-logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '../login/index.html';
    });
  }
}

window.addEventListener('DOMContentLoaded', loadSettingsPage);
