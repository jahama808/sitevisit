'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function updateDesignerProfile(profileId: number, formData: FormData) {
  const supabase = await createClient();
  await supabase.from('designer_profiles').update({
    island_preferences: formData.getAll('island_preferences') as string[],
    additional_preferences: (formData.get('additional_preferences') as string) ?? '',
    active: formData.get('active') === 'on',
  }).eq('id', profileId);
  redirect('/accounts/designers');
}
