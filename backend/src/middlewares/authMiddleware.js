import supabase from '../config/supabaseClient.js';
import { createSupabaseUserClient } from '../config/supabaseClient.js';
import { ensureProfile } from '../services/userContext.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const accessToken = authHeader.replace('Bearer ', '').trim();
    const userClient = createSupabaseUserClient(accessToken);

    // Use Supabase client to validate token and get user
    const { data, error } = await userClient.auth.getUser(accessToken);
    if (error || !data || !data.user) {
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
    return res.status(500).json({ error: 'Authentication error' });
  }
}
