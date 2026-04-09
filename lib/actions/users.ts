'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRole } from '@/lib/types';

export async function createUser(_prev: unknown, formData: FormData) {
  const email = (formData.get('email') as string).trim().toLowerCase();
  const username = (formData.get('username') as string).trim();
  const firstName = (formData.get('first_name') as string) ?? '';
  const lastName = (formData.get('last_name') as string) ?? '';
  const role = formData.get('role') as UserRole;

  const admin = createAdminClient();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (authError) return { error: authError.message };

  const { error: profileError } = await admin.from('profiles').insert({
    id: authUser.user.id, username, email, first_name: firstName, last_name: lastName, role,
  });
  if (profileError) return { error: profileError.message };

  if (role === 'designer') {
    await admin.from('designer_profiles').insert({ user_id: authUser.user.id });
  }

  redirect('/accounts/users');
}

export async function updateUser(userId: string, formData: FormData) {
  const admin = createAdminClient();
  await admin.from('profiles').update({
    email: (formData.get('email') as string).trim().toLowerCase(),
    first_name: (formData.get('first_name') as string) ?? '',
    last_name: (formData.get('last_name') as string) ?? '',
    role: formData.get('role') as UserRole,
    is_active: formData.get('is_active') === 'on',
  }).eq('id', userId);
  redirect('/accounts/users');
}

export async function deleteUser(userId: string) {
  const admin = createAdminClient();
  await admin.from('profiles').update({ is_active: false }).eq('id', userId);
  revalidatePath('/accounts/users');
}
