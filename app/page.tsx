import Link from 'next/link';
import { requireAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  await requireAuth();
  const supabase = await createClient();

  const { count: totalRequests } = await supabase
    .from('site_visit_requests').select('*', { count: 'exact', head: true });
  const { count: newRequests } = await supabase
    .from('site_visit_requests').select('*', { count: 'exact', head: true }).eq('status', 'new');
  const { count: assignedRequests } = await supabase
    .from('site_visit_requests').select('*', { count: 'exact', head: true }).eq('status', 'assigned');
  const { data: recentRequests } = await supabase
    .from('site_visit_requests').select('*').order('created_at', { ascending: false }).limit(8);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Site Visit Operations</h3>
        <div className="d-flex gap-2">
          <Link className="btn btn-primary" href="/visits/new"><i className="bi bi-plus-circle" /> New Request</Link>
          <Link className="btn btn-outline-primary" href="/visits"><i className="bi bi-list-ul" /> View Queue</Link>
          <Link className="btn btn-outline-primary" href="/visits/calendar"><i className="bi bi-calendar3" /> Calendar</Link>
        </div>
      </div>
      <div className="row g-3 mb-3">
        <div className="col-md-4"><div className="card stat-card p-3"><div className="label">Total</div><div className="value">{totalRequests ?? 0}</div></div></div>
        <div className="col-md-4"><div className="card stat-card p-3"><div className="label">New</div><div className="value">{newRequests ?? 0}</div></div></div>
        <div className="col-md-4"><div className="card stat-card p-3"><div className="label">Assigned</div><div className="value">{assignedRequests ?? 0}</div></div></div>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">Recent Requests</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead><tr><th>ID</th><th>Property</th><th>Island</th><th>Status</th><th>Preferred</th></tr></thead>
              <tbody>
                {recentRequests && recentRequests.length > 0 ? (
                  recentRequests.map((r) => (
                    <tr key={r.id}>
                      <td><Link href={`/visits/${r.id}`}>#{r.id}</Link></td>
                      <td>{r.property_name}</td>
                      <td>{r.island}</td>
                      <td><span className="badge text-bg-secondary">{r.status}</span></td>
                      <td>{new Date(r.preferred_start).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="text-muted">No requests yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
