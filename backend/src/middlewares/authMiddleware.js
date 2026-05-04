import supabase from '../config/supabaseClient.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const accessToken = authHeader.replace('Bearer ', '').trim();

    // Use Supabase client to validate token and get user
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // attach user info to request
    req.user = {
      id: data.user.id,
      email: data.user.email,
      user: data.user
    };
    return next();
  } catch (err) {
    return res.status(500).json({ error: 'Authentication error' });
  }
}
