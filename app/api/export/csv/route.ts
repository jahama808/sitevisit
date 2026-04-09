import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/utils';

const STATUS_ORDER: Record<string, number> = { received: 0, scheduled: 1, completed: 2 };

export async function GET() {
  await requireRole('admin', 'manager');
  const supabase = await createClient();
  const { data: visits } = await supabase
    .from('site_visit_requests')
    .select('*, submitted_by_profile:profiles!submitted_by(*), assigned_designer_profile:profiles!assigned_designer(*)')
    .order('id', { ascending: true });

  const sorted = [...(visits ?? [])].sort((a, b) => (STATUS_ORDER[a.request_status] ?? 99) - (STATUS_ORDER[b.request_status] ?? 99) || a.id - b.id);
  function name(p: { first_name?: string; last_name?: string; username?: string } | null) {
    if (!p) return '-';
    return `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.username || '-';
  }

  const headers = ['ID','Property','Island','Requestor','Status','Assigned','Date Performed','Date Completed','Wiring Plan','Costs'];
  const rows = sorted.map(v => [v.id, v.property_name, v.island, name(v.submitted_by_profile), v.request_status, name(v.assigned_designer_profile), v.date_performed??'', v.date_completed??'', v.wiring_plan_status, v.costs_status]);
  const csv = [headers,...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');

  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="site_visits.csv"' } });
}
