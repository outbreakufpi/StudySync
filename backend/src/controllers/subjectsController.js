export async function listSubjects(req, res, next) {
  try {
    // stubbed response — substituir por chamada ao service
    const data = [
      { id: '1', name: 'Álgebra Linear', professor: 'Prof. A' },
      { id: '2', name: 'Macroeconomia', professor: 'Prof. B' }
    ];
    return res.json({ data });
  } catch (err) {
    next(err);
  }
}
