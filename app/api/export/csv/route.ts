import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/utils';
import * as XLSX from 'xlsx';

const STATUS_ORDER: Record<string, number> = { received: 0, scheduled: 1, completed: 2 };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  // Sheet 1: All Site Visits
  const allHeaders = ['ID', 'Property', 'Island', 'Requestor', 'Status', 'Assigned', 'Date Performed', 'Date Completed', 'Wiring Plan', 'Costs'];
  const allRows = sorted.map(v => [
    v.id, v.property_name, v.island, name(v.submitted_by_profile),
    v.request_status, name(v.assigned_designer_profile),
    v.date_performed ?? '', v.date_completed ?? '',
    v.wiring_plan_status, v.costs_status,
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet([allHeaders, ...allRows]);

  // Set column widths
  ws1['!cols'] = [
    { wch: 6 }, { wch: 30 }, { wch: 10 }, { wch: 20 },
    { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
    { wch: 14 }, { wch: 14 },
  ];

  // Sheet 2: By Sales Person — monthly breakdown
  // Build: { salesperson: { month: count } }
  const salesByMonth: Record<string, Record<string, number>> = {};
  const allMonthKeys = new Set<string>();

  for (const v of sorted) {
    const salesName = name(v.submitted_by_profile);
    const created = new Date(v.created_at);
    const monthKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = `${MONTHS[created.getMonth()]} ${created.getFullYear()}`;

    allMonthKeys.add(monthKey);
    if (!salesByMonth[salesName]) salesByMonth[salesName] = {};
    salesByMonth[salesName][monthKey] = (salesByMonth[salesName][monthKey] ?? 0) + 1;
  }

  const sortedMonthKeys = [...allMonthKeys].sort();
  const monthLabels = sortedMonthKeys.map(k => {
    const [y, m] = k.split('-');
    return `${MONTHS[Number(m) - 1]} ${y}`;
  });

  const salesHeaders = ['Sales Person', ...monthLabels, 'Total'];
  const salesRows: (string | number)[][] = [];

  const salespeople = Object.keys(salesByMonth).sort();
  for (const sp of salespeople) {
    const monthlyCounts = sortedMonthKeys.map(k => salesByMonth[sp][k] ?? 0);
    const total = monthlyCounts.reduce((a, b) => a + b, 0);
    salesRows.push([sp, ...monthlyCounts, total]);
  }

  // Add totals row
  const totalRow: (string | number)[] = ['Total'];
  for (let i = 0; i < sortedMonthKeys.length; i++) {
    totalRow.push(salesRows.reduce((sum, row) => sum + (row[i + 1] as number), 0));
  }
  totalRow.push(salesRows.reduce((sum, row) => sum + (row[row.length - 1] as number), 0));
  salesRows.push(totalRow);

  const ws2 = XLSX.utils.aoa_to_sheet([salesHeaders, ...salesRows]);

  // Set column widths for sheet 2
  ws2['!cols'] = [
    { wch: 22 },
    ...sortedMonthKeys.map(() => ({ wch: 12 })),
    { wch: 10 },
  ];

  // Build workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'All Site Visits');
  XLSX.utils.book_append_sheet(wb, ws2, 'By Sales Person');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="site_visits.xlsx"',
    },
  });
}
