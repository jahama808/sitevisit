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
  const headerHtml = headers.map(h => `<th>${h}</th>`).join('');
  const rowsHtml = sorted.map(v => {
    const cells = [v.id, v.property_name, v.island, name(v.submitted_by_profile), v.request_status, name(v.assigned_designer_profile), v.date_performed??'-', v.date_completed??'-', v.wiring_plan_status, v.costs_status];
    return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
  }).join('');

  const html = `<!doctype html><html><head><title>Site Visits</title><style>body{font-family:sans-serif;font-size:10px;margin:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:4px 6px;text-align:left}th{background:#0067a5;color:#fff}tr:nth-child(even){background:#f5f5f5}@media print{body{margin:0}}</style></head><body><h3>Site Visits Report</h3><table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table><script>window.print()</script></body></html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
