export async function listTasks(req, res, next) {
  try {
    const data = [
      { id: 't1', title: 'Ler capítulo 1', status: 'todo' },
      { id: 't2', title: 'Trabalho de macro', status: 'in_progress' }
    ];
    return res.json({ data });
  } catch (err) {
    next(err);
  }
}
