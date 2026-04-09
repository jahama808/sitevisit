import { requireAuth } from '@/lib/utils';
import { createVisit } from '@/lib/actions/visits';
import { VisitForm } from '@/components/VisitForm';

export default async function NewVisitPage() {
  await requireAuth();
  return (<><h4 className="mb-3">New Visit Request</h4><VisitForm action={createVisit} /></>);
}
