import Link from 'next/link';
import { requireAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { StatusSelect } from '@/components/StatusSelect';
import { DateInput } from '@/components/DateInput';
import { DeleteButton } from '@/components/DeleteButton';
import { SearchInput } from '@/components/SearchInput';
import { updateStatusField, updateDateField, deleteVisit } from '@/lib/actions/visits';

const REQUEST_STATUS_OPTIONS = [
  { value: 'received', label: 'Received' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
];

const DELIVERY_OPTIONS = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'sent', label: 'Sent' },
];

function displayName(p: { first_name?: string; last_name?: string; username?: string } | null) {
  if (!p) return '-';
  const full = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
  return full || p.username || '-';
}

export default async function VisitListPage() {
  const profile = await requireAuth();
  const isSales = profile.role === 'sales';
  const supabase = await createClient();

  // Fetch visits — sales users only see their own
  let query = supabase
    .from('site_visit_requests')
    .select('*, submitted_by_profile:profiles!submitted_by(*), assigned_designer_profile:profiles!assigned_designer(*)')
    .order('created_at', { ascending: false });

  if (isSales) {
    query = query.eq('submitted_by', profile.id);
  }

  const { data: allVisits } = await query;

  const isCompleted = (v: { request_status: string; wiring_plan_status: string; costs_status: string }) =>
    v.request_status === 'completed' && v.wiring_plan_status === 'sent' && v.costs_status === 'sent';

  const allActive = (allVisits ?? []).filter((v) => !isCompleted(v));
  const completedVisits = (allVisits ?? []).filter(isCompleted);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Visit Requests</h4>
        <Link className="btn btn-primary" href="/visits/new">New Request</Link>
      </div>
      <div className="mb-3"><SearchInput /></div>

      <div className="card border-0 shadow-sm queue-table-card mb-4"><div className="card-body">
        <h5 className="mb-3">Active</h5>
        <div className="table-responsive queue-table-wrap">
          <table className="table table-hover align-middle queue-table">
            <thead><tr><th>ID</th><th>Property</th><th>Island</th><th>Requestor</th><th>Status</th><th>Assigned</th><th>Completed</th><th>Wiring Plan</th><th>Costs</th><th></th></tr></thead>
            <tbody>
              {allActive.length > 0 ? allActive.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/visits/${r.id}`}>#{r.id}</Link></td>
                  <td>{r.property_name}</td>
                  <td>{r.island}</td>
                  <td>{displayName(r.submitted_by_profile)}</td>
                  <td><StatusSelect visitId={r.id} field="request_status" currentValue={r.request_status} options={REQUEST_STATUS_OPTIONS} action={updateStatusField} /></td>
                  <td>{displayName(r.assigned_designer_profile)}</td>
                  <td>{r.request_status === 'completed'
                    ? <DateInput visitId={r.id} field="date_completed" value={r.date_completed} action={updateDateField} />
                    : <span className="text-muted">Pending</span>}
                  </td>
                  <td><StatusSelect visitId={r.id} field="wiring_plan_status" currentValue={r.wiring_plan_status} options={DELIVERY_OPTIONS} action={updateStatusField} /></td>
                  <td><StatusSelect visitId={r.id} field="costs_status" currentValue={r.costs_status} options={DELIVERY_OPTIONS} action={updateStatusField} /></td>
                  <td className="text-end">
                    {(!isSales || r.submitted_by === profile.id) && (
                      <Link className="btn btn-sm btn-outline-primary" href={`/visits/${r.id}/edit`}>Edit</Link>
                    )}
                    {!isSales && <DeleteButton visitId={r.id} action={deleteVisit} />}
                  </td>
                </tr>
              )) : <tr><td colSpan={10} className="text-muted">No active records</td></tr>}
            </tbody>
          </table>
        </div>
      </div></div>

      <div className="card border-0 shadow-sm queue-table-card"><div className="card-body">
        <h5 className="mb-3">Completed</h5>
        <div className="table-responsive queue-table-wrap">
          <table className="table table-hover align-middle queue-table">
            <thead><tr><th>ID</th><th>Property</th><th>Island</th><th>Requestor</th><th>Assigned</th><th>Date Performed</th><th>Date Completed</th><th>Wiring Plan</th><th>Costs</th><th></th></tr></thead>
            <tbody>
              {completedVisits && completedVisits.length > 0 ? completedVisits.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/visits/${r.id}`}>#{r.id}</Link></td>
                  <td>{r.property_name}</td>
                  <td>{r.island}</td>
                  <td>{displayName(r.submitted_by_profile)}</td>
                  <td>{displayName(r.assigned_designer_profile)}</td>
                  <td><DateInput visitId={r.id} field="date_performed" value={r.date_performed} action={updateDateField} /></td>
                  <td><DateInput visitId={r.id} field="date_completed" value={r.date_completed} action={updateDateField} /></td>
                  <td><StatusSelect visitId={r.id} field="wiring_plan_status" currentValue={r.wiring_plan_status} options={DELIVERY_OPTIONS} action={updateStatusField} /></td>
                  <td><StatusSelect visitId={r.id} field="costs_status" currentValue={r.costs_status} options={DELIVERY_OPTIONS} action={updateStatusField} /></td>
                  <td className="text-end">
                    {(!isSales || r.submitted_by === profile.id) && (
                      <Link className="btn btn-sm btn-outline-primary" href={`/visits/${r.id}/edit`}>Edit</Link>
                    )}
                    {!isSales && <DeleteButton visitId={r.id} action={deleteVisit} />}
                  </td>
                </tr>
              )) : <tr><td colSpan={10} className="text-muted">No completed records</td></tr>}
            </tbody>
          </table>
        </div>
      </div></div>
    </>
  );
}
