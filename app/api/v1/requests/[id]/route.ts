import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await validateApiKey(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabase.from('site_visit_requests').select('*').eq('id', Number(id)).single();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}
