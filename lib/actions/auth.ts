'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validatePassword } from '@/lib/validation';

export async function signIn(_prev: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  if (!email || !password) return { error: 'Email and password are required' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Invalid email or password' };

  // Check if user must change password
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('must_change_password')
    .eq('email', email)
    .single();

  if (profile?.must_change_password) {
    redirect('/login/change-password');
  }

  redirect('/');
}

export async function forgotPassword(_prev: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  if (!email) return { error: 'Email is required' };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login/change-password`,
  });

  // Always show success to prevent email enumeration
  return { success: true };
}

export async function forceChangePassword(_prev: unknown, formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirm_password') as string;

  if (!password || !confirmPassword) return { error: 'Both fields are required' };
  if (password !== confirmPassword) return { error: 'Passwords do not match' };

  const validation = validatePassword(password);
  if (!validation.valid) return { error: validation.errors.join('. ') };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  // Clear the must_change_password flag
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const admin = createAdminClient();
    await admin.from('profiles').update({ must_change_password: false }).eq('id', user.id);
  }

  redirect('/');
}

export async function changePassword(_prev: unknown, formData: FormData) {
  const currentPassword = formData.get('current_password') as string;
  const newPassword = formData.get('new_password') as string;
  const confirmPassword = formData.get('confirm_password') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All fields are required' };
  }
  if (newPassword !== confirmPassword) return { error: 'New passwords do not match' };

  const validation = validatePassword(newPassword);
  if (!validation.valid) return { error: validation.errors.join('. ') };

  // Verify current password by re-authenticating
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: 'Not authenticated' };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) return { error: 'Current password is incorrect' };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
