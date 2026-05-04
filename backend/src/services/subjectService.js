// simple service stub — later replace with Supabase queries
export async function getAllSubjectsForUser(userId) {
  return [
    { id: '1', name: 'Álgebra Linear', professor: 'Prof. A', user_id: userId }
  ];
}
