import Link from 'next/link';
import { requireRole } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { StatsCharts } from '@/components/StatsCharts';
import { StatsHeader } from '@/components/StatsHeader';

const STATUS_ORDER: Record<string, number> = { received: 0, scheduled: 1, completed: 2 };
const DELIVERY_LABELS: Record<string, string> = { in_progress: 'In Progress', sent: 'Sent' };
const STATUS_LABELS: Record<string, string> = { received: 'Received', scheduled: 'Scheduled', completed: 'Completed' };

function displayName(p: { first_name?: string; last_name?: string; username?: string } | null) {
  if (!p) return '-';
  return `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.username || '-';
}

export default async function StatsPage() {
  await requireRole('admin', 'manager');
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('visit_change_events').select('visit_id, created_at, payload')
    .eq('event_type', 'visit.status_field_updated').order('created_at', { ascending: true });

  const visitCompletedDate: Record<number, string> = {};
  const visitWiringSentDate: Record<number, string> = {};
  for (const evt of events ?? []) {
    const p = evt.payload as { field?: string; value?: string };
    if (p.field === 'request_status' && p.value === 'completed' && !visitCompletedDate[evt.visit_id]) visitCompletedDate[evt.visit_id] = evt.created_at;
    if (p.field === 'wiring_plan_status' && p.value === 'sent' && !visitWiringSentDate[evt.visit_id]) visitWiringSentDate[evt.visit_id] = evt.created_at;
  }

  const monthlyOnTime: Record<string, number> = {};
  const monthlyLate: Record<string, number> = {};
  for (const [vid, completedAt] of Object.entries(visitCompletedDate)) {
    const monthKey = completedAt.slice(0, 7);
    const wiringAt = visitWiringSentDate[Number(vid)];
    const diff = wiringAt ? (new Date(wiringAt).getTime() - new Date(completedAt).getTime()) / 86400000 : Infinity;
    if (diff <= 14) monthlyOnTime[monthKey] = (monthlyOnTime[monthKey] ?? 0) + 1;
    else monthlyLate[monthKey] = (monthlyLate[monthKey] ?? 0) + 1;
  }

  const allMonths = [...new Set([...Object.keys(monthlyOnTime), ...Object.keys(monthlyLate)])].sort();

  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  let pieWithin14 = 0, pieOver14 = 0;
  for (const [vid, completedAt] of Object.entries(visitCompletedDate)) {
    if (completedAt < yearStart) continue;
    const wiringAt = visitWiringSentDate[Number(vid)];
    const diff = wiringAt ? (new Date(wiringAt).getTime() - new Date(completedAt).getTime()) / 86400000 : Infinity;
    if (diff <= 14) pieWithin14++; else pieOver14++;
  }

  const { data: allVisits } = await supabase
    .from('site_visit_requests')
    .select('*, submitted_by_profile:profiles!submitted_by(*), assigned_designer_profile:profiles!assigned_designer(*)')
    .order('id', { ascending: true });
  const sortedVisits = [...(allVisits ?? [])].sort((a, b) => (STATUS_ORDER[a.request_status] ?? 99) - (STATUS_ORDER[b.request_status] ?? 99) || a.id - b.id);

  return (
    <>
      <h4 className="mb-4">Visit Stats</h4>
      <StatsHeader visits={(allVisits ?? []).map((v) => ({ request_status: v.request_status, wiring_plan_status: v.wiring_plan_status, created_at: v.created_at }))} />
      <StatsCharts barLabels={allMonths} barOnTime={allMonths.map(m => monthlyOnTime[m] ?? 0)} barLate={allMonths.map(m => monthlyLate[m] ?? 0)} pieWithin14={pieWithin14} pieOver14={pieOver14} />
      <div className="card border-0 shadow-sm mb-4"><div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">All Site Visits</h5>
          <div className="d-flex gap-2">
            <a className="btn btn-sm btn-outline-success" href="/api/export/csv"><i className="bi bi-file-earmark-spreadsheet" /> Export XLSX</a>
            <a className="btn btn-sm btn-outline-danger" href="/api/export/pdf" target="_blank" rel="noopener noreferrer"><i className="bi bi-filetype-pdf" /> Export PDF</a>
          </div>
        </div>
        <div className="table-responsive"><table className="table table-hover align-middle table-sm">
          <thead><tr><th>ID</th><th>Property</th><th>Island</th><th>Requestor</th><th>Status</th><th>Assigned</th><th>Date Performed</th><th>Date Completed</th><th>Wiring Plan</th><th>Costs</th></tr></thead>
          <tbody>
            {sortedVisits.map((v) => (
              <tr key={v.id}>
                <td><Link href={`/visits/${v.id}`}>#{v.id}</Link></td>
                <td>{v.property_name}</td><td>{v.island}</td>
                <td>{displayName(v.submitted_by_profile)}</td>
                <td>{STATUS_LABELS[v.request_status] ?? v.request_status}</td>
                <td>{displayName(v.assigned_designer_profile)}</td>
                <td>{v.date_performed ?? '-'}</td><td>{v.date_completed ?? '-'}</td>
                <td>{DELIVERY_LABELS[v.wiring_plan_status] ?? v.wiring_plan_status}</td>
                <td>{DELIVERY_LABELS[v.costs_status] ?? v.costs_status}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div></div>

      <SalesSummaryTable visits={allVisits ?? []} displayName={displayName} />
    </>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function SalesSummaryTable({ visits, displayName }: { visits: Array<{ submitted_by_profile: { first_name?: string; last_name?: string; username?: string } | null; created_at: string }>; displayName: (p: { first_name?: string; last_name?: string; username?: string } | null) => string }) {
  const salesByMonth: Record<string, Record<string, number>> = {};
  const allMonthKeys = new Set<string>();

  for (const v of visits) {
    const salesName = displayName(v.submitted_by_profile);
    const created = new Date(v.created_at);
    const monthKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
    allMonthKeys.add(monthKey);
    if (!salesByMonth[salesName]) salesByMonth[salesName] = {};
    salesByMonth[salesName][monthKey] = (salesByMonth[salesName][monthKey] ?? 0) + 1;
  }

  const sortedMonthKeys = [...allMonthKeys].sort();
  const monthLabels = sortedMonthKeys.map(k => {
    const [y, m] = k.split('-');
    return `${MONTHS[Number(m) - 1]} ${y}`;
  });

  const salespeople = Object.keys(salesByMonth).sort();

  return (
    <div className="card border-0 shadow-sm mb-4"><div className="card-body">
      <h5 className="mb-3">By Sales Person</h5>
      <div className="table-responsive"><table className="table table-hover align-middle table-sm">
        <thead>
          <tr>
            <th>Sales Person</th>
            {monthLabels.map(m => <th key={m}>{m}</th>)}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {salespeople.map(sp => {
            const counts = sortedMonthKeys.map(k => salesByMonth[sp][k] ?? 0);
            const total = counts.reduce((a, b) => a + b, 0);
            return (
              <tr key={sp}>
                <td>{sp}</td>
                {counts.map((c, i) => <td key={i}>{c || '-'}</td>)}
                <td><strong>{total}</strong></td>
              </tr>
            );
          })}
          <tr className="table-active">
            <td><strong>Total</strong></td>
            {sortedMonthKeys.map((k, i) => (
              <td key={i}><strong>{salespeople.reduce((sum, sp) => sum + (salesByMonth[sp][k] ?? 0), 0)}</strong></td>
            ))}
            <td><strong>{visits.length}</strong></td>
          </tr>
        </tbody>
      </table></div>
    </div></div>
  );
}
