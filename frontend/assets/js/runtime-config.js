const TOKEN_KEY = 'access_token';
const API_ORIGIN = 'http://localhost:3001';

function getApiOrigin() {
  return API_ORIGIN;
}

function buildApiUrl(pathname) {
  return `${getApiOrigin()}${pathname}`;
}

async function resolveApiOrigin() {
  return getApiOrigin();
}

async function buildApiUrlAsync(pathname) {
  const origin = await resolveApiOrigin();
  return `${origin}${pathname}`;
}

export { TOKEN_KEY, getApiOrigin, buildApiUrl, resolveApiOrigin, buildApiUrlAsync };
