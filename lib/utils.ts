import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Profile, UserRole } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  return profile;
}

export async function requireRole(...roles: UserRole[]): Promise<Profile> {
  const profile = await requireAuth();
  if (!roles.includes(profile.role)) redirect('/');
  return profile;
}

export async function validateApiKey(request: NextRequest): Promise<SupabaseClient | null> {
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey) return null;
  const admin = createAdminClient();
  const { data } = await admin.from('api_tokens').select('id').eq('token', apiKey).eq('active', true).single();
  return data ? admin : null;
}
