import supabase from '../config/supabaseClient.js';
import { prisma, isPrismaEnabled } from '../config/prismaClient.js';

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

    const authUid = data.user.id;
    let profileId = authUid;

    // When Prisma is enabled, keep a local profile row linked to auth uid.
    if (isPrismaEnabled && prisma) {
      const fullName = data.user.user_metadata?.full_name || null;
      const profile = await prisma.profile.upsert({
        where: { auth_uid: authUid },
        update: {
          email: data.user.email || null,
          full_name: fullName,
          updated_at: new Date()
        },
        create: {
          auth_uid: authUid,
          email: data.user.email || null,
          full_name: fullName,
          locale: 'pt-BR'
        }
      });
      profileId = profile.id;
    }

    req.user = {
      id: profileId,
      authUid,
      email: data.user.email,
      user: data.user
    };
    return next();
  } catch (err) {
    return res.status(500).json({ error: 'Authentication error' });
  }
}
