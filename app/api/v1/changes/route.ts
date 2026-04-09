import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const supabase = await validateApiKey(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const since = request.nextUrl.searchParams.get('since');
  let query = supabase.from('visit_change_events').select('*').order('created_at', { ascending: false }).limit(200);
  if (since) query = query.gte('created_at', since);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
