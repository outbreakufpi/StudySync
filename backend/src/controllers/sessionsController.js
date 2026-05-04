export async function listSessions(req, res, next) {
  try {
    const data = [
      { id: 's1', subject: 'Álgebra Linear', duration_minutes: 90 },
      { id: 's2', subject: 'Macroeconomia', duration_minutes: 60 }
    ];
    return res.json({ data });
  } catch (err) {
    next(err);
  }
}
