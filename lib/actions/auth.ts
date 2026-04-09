'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function sendOtp(_prev: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  if (!email) return { error: 'Email is required' };

  // Use admin client to bypass RLS — user isn't authenticated yet
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (!profile) return { error: 'Account not found' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });
  if (error) return { error: error.message };

  redirect(`/login/verify?email=${encodeURIComponent(email)}`);
}

export async function verifyOtp(_prev: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const token = formData.get('code') as string;

  if (!email || !token) return { error: 'Email and code are required' };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) return { error: 'Invalid or expired code' };

  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
