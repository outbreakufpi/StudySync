import supabase from '../config/supabaseClient.js';
import { createSupabaseUserClient } from '../config/supabaseClient.js';
import { ensureProfile } from '../services/userContext.js';

// Middleware that checks the request bearer token and loads user profile.
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    // allow token via HttpOnly cookie as a fallback for browser navigations
    const cookieHeader = req.headers.cookie || '';
    const cookieToken = (cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('access_token=')) || '').split('=')[1] || '';

    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : '';
    const accessToken = tokenFromHeader || cookieToken;

    if (!accessToken) {
      // If the request accepts HTML (browser navigation), redirect to login page
      if (req.accepts && req.accepts('html')) {
        const dest = encodeURIComponent(req.originalUrl || req.url || '/');
        return res.redirect(`/pages/login/index.html?redirect=${dest}`);
      }
      return res.status(401).json({ error: 'Missing or invalid authorization token' });
    }

    const userClient = createSupabaseUserClient(accessToken);

    // Use Supabase client to validate token and get user
    const { data, error } = await userClient.auth.getUser(accessToken);
    if (error || !data || !data.user) {
      if (req.accepts && req.accepts('html')) {
        const dest = encodeURIComponent(req.originalUrl || req.url || '/');
        return res.redirect(`/pages/login/index.html?redirect=${dest}`);
      }
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const authUid = data.user.id;
    const profile = await ensureProfile(userClient, data.user);

    req.user = {
      id: profile.id,
      authUid,
      email: data.user.email,
      user: {
        ...data.user,
        profile
      },
      profile,
      client: userClient
    };
    return next();
  } catch (err) {
    if (req.accepts && req.accepts('html')) {
      const dest = encodeURIComponent(req.originalUrl || req.url || '/');
      return res.redirect(`/pages/login/index.html?redirect=${dest}`);
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
}
