import authService from '../services/authService.js';

export const signup = async (req, res) => {
  try {
    const { email, password, ...userData } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.signup(email, password, userData);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.login(email, password);
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