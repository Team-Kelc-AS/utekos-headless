import { createSupabaseContext } from '@/lib/supabase/server';

export default async function Notes() {
  const { data: ctx, error } = await createSupabaseContext({ auth: 'none' });

  if (error || !ctx) {
    return <div>Failed to load notes: {error?.message}</div>;
  }

  const { supabase } = ctx;

  const { data: notes } = await supabase.from('notes').select('*');

  return (
    <ul>
      {notes?.map((note: { id: number; title: string }) => (
        <li key={note.id}>{note.title}</li>
      ))}
    </ul>
  );
}
