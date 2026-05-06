const TOKEN_KEY = 'access_token';

function getApiOrigin() {
  const stored = localStorage.getItem('api_origin');
  if (stored) return stored;

  const host = window.location.hostname || 'localhost';
  const explicitPort = window.location.port;

  if (explicitPort === '3001' || explicitPort === '3002') {
    return `${window.location.protocol}//${host}:${explicitPort}`;
  }

  return `${window.location.protocol}//${host}:3001`;
}

function buildApiUrl(pathname) {
  return `${getApiOrigin()}${pathname}`;
}

async function resolveApiOrigin() {
  const stored = localStorage.getItem('api_origin');
  if (stored) return stored;

  const host = window.location.hostname || 'localhost';
  const protocol = window.location.protocol;
  const candidates = [3001, 3002, 3003, 3004, 3005];

  for (const port of candidates) {
    const origin = `${protocol}//${host}:${port}`;
    try {
      const res = await fetch(`${origin}/health`, { method: 'GET' });
      if (res.ok) {
        localStorage.setItem('api_origin', origin);
        return origin;
      }
    } catch {
      // Try next candidate port.
    }
  }

  return getApiOrigin();
}

async function buildApiUrlAsync(pathname) {
  const origin = await resolveApiOrigin();
  return `${origin}${pathname}`;
}

export { TOKEN_KEY, getApiOrigin, buildApiUrl, resolveApiOrigin, buildApiUrlAsync };
