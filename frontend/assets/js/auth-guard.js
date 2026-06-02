import { TOKEN_KEY, buildApiUrlAsync } from './runtime-config.js?v=20260507';

async function redirectToLogin() {
  // preserve the intended path for post-login redirect
  const dest = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
  window.location.replace(`/pages/login/index.html?redirect=${dest}`);
}

async function validate() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return redirectToLogin();

    const url = await buildApiUrlAsync('/api/v1/auth/validate-session');
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      localStorage.removeItem(TOKEN_KEY);
      return redirectToLogin();
    }

    // valid session — nothing to do
    return;
  } catch (err) {
    localStorage.removeItem(TOKEN_KEY);
    return redirectToLogin();
  }
}

// Run immediately — pages that include this script are protected
(function () {
  // If script is included asynchronously, guard on DOMContentLoaded too
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', validate);
  } else {
    validate();
  }
})();

export default {};
