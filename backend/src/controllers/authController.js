import authService from '../services/authService.js';

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
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const accessToken = authHeader.replace('Bearer ', '').trim();

    const result = await authService.logout(accessToken);
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const accessToken = authHeader.replace('Bearer ', '').trim();

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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const accessToken = authHeader.replace('Bearer ', '').trim();
    const result = await authService.updateMe(accessToken, req.body || {});
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};