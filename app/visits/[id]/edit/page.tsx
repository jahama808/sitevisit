import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { updateVisit } from '@/lib/actions/visits';
import { VisitForm } from '@/components/VisitForm';

export default async function EditVisitPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createClient();
  const { data: visit } = await supabase.from('site_visit_requests').select('*').eq('id', Number(id)).single();
  if (!visit) notFound();
  const boundAction = updateVisit.bind(null, visit.id);
  return (<><h4 className="mb-3">Edit Visit #{visit.id}</h4><VisitForm action={boundAction} visit={visit} /></>);
}
