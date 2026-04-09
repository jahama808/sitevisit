import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { updateVisit } from '@/lib/actions/visits';
import { VisitForm } from '@/components/VisitForm';

export default async function EditVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: visit } = await supabase.from('site_visit_requests').select('*').eq('id', Number(id)).single();
  if (!visit) notFound();

  // Sales users can only edit their own visits
  if (profile.role === 'sales' && visit.submitted_by !== profile.id) {
    notFound();
  }

  const { data: requestors } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, username')
    .in('role', ['sales', 'manager'])
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  const boundAction = updateVisit.bind(null, visit.id);
  return (
    <>
      <h4 className="mb-3">Edit Visit #{visit.id}</h4>
      <VisitForm action={boundAction} visit={visit} requestors={requestors ?? []} currentUserId={profile.id} />
    </>
  );
}
