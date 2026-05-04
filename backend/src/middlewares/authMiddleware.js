export function requireAuth(req, res, next) {
  // placeholder: validate JWT from Supabase on Authorization header
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  // in future: verify token and attach user info to req.user
  req.user = { id: auth.replace('Bearer ', '') };
  next();
}
