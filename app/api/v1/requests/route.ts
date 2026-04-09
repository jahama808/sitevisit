import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const supabase = await validateApiKey(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase.from('site_visit_requests').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await validateApiKey(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { data, error } = await supabase.from('site_visit_requests').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.from('visit_change_events').insert({ event_type: 'visit.created', visit_id: data.id, payload: { property_name: data.property_name, source: 'api' } });
  return NextResponse.json(data, { status: 201 });
}
