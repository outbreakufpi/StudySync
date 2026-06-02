import authService from '../services/authService.js';

// Controller actions for authentication endpoints.
export const signup = async (req, res) => {
  try {
    const { email, password, ...userData } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase().replace(/\s+/g, '');

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = await authService.signup(normalizedEmail, password, userData);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase().replace(/\s+/g, '');

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.login(normalizedEmail, password);
    // Set HttpOnly cookie with access token for browser navigations
    try {
      const accessToken = result.session?.access_token || '';
      const expiresAt = result.session?.expires_at ? Number(result.session.expires_at) * 1000 : null; // seconds -> ms
      const maxAge = expiresAt ? Math.max(0, expiresAt - Date.now()) : 60 * 60 * 1000; // default 1h
      if (accessToken) {
        res.cookie('access_token', accessToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge,
          path: '/',
        });
      }
    } catch (e) {
      // non-fatal
    }

    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    // accept token from header or cookie
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : '';
    const cookieHeader = req.headers.cookie || '';
    const cookieToken = (cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('access_token=')) || '').split('=')[1] || '';
    const accessToken = tokenFromHeader || cookieToken;

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const result = await authService.logout(accessToken);
    // clear cookie
    res.clearCookie('access_token', { path: '/' });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await authService.resetPassword(email);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const validateSession = async (req, res) => {
  try {
    // accept token from header or cookie for validation
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : '';
    const cookieHeader = req.headers.cookie || '';
    const cookieToken = (cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('access_token=')) || '').split('=')[1] || '';
    const accessToken = tokenFromHeader || cookieToken;

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const result = await authService.validateSession(accessToken);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const me = validateSession;

export const updateMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : '';
    const cookieHeader = req.headers.cookie || '';
    const cookieToken = (cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('access_token=')) || '').split('=')[1] || '';
    const accessToken = tokenFromHeader || cookieToken;
    if (!accessToken) return res.status(401).json({ error: 'Missing authorization token' });
    const result = await authService.updateMe(accessToken, req.body || {});
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};