import { requireAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { createVisit } from '@/lib/actions/visits';
import { VisitForm } from '@/components/VisitForm';

export default async function NewVisitPage() {
  const profile = await requireAuth();
  const supabase = await createClient();

  const { data: requestors } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, username')
    .in('role', ['sales', 'manager'])
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  return (
    <>
      <h4 className="mb-3">New Visit Request</h4>
      <VisitForm action={createVisit} requestors={requestors ?? []} currentUserId={profile.id} />
    </>
  );
}
