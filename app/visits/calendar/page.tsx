import { requireAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { CalendarView } from '@/components/CalendarView';

const COLOR_PALETTE = ['#00A7E1', '#00C49A', '#FF8C42', '#8B5CF6', '#F43F5E', '#14B8A6', '#3B82F6', '#F59E0B', '#EF4444', '#10B981'];

export default async function CalendarPage() {
  await requireAuth();
  const supabase = await createClient();
  const { data: visits } = await supabase
    .from('site_visit_requests')
    .select('id, property_name, preferred_start, preferred_end, island, assigned_designer')
    .not('status', 'eq', 'cancelled');

  const designerIds = [...new Set((visits ?? []).map((v) => v.assigned_designer).filter(Boolean))];
  const colorMap: Record<string, string> = {};
  designerIds.forEach((id, i) => { colorMap[id!] = COLOR_PALETTE[i % COLOR_PALETTE.length]; });

  const events = (visits ?? []).map((v) => ({
    id: String(v.id), title: v.property_name, start: v.preferred_start,
    end: v.preferred_end ?? v.preferred_start,
    color: v.assigned_designer ? colorMap[v.assigned_designer] : '#6b7280',
  }));

  return (<><h4 className="mb-3">Visit Calendar</h4><div className="card border-0 shadow-sm"><div className="card-body"><CalendarView events={events} /></div></div></>);
}
