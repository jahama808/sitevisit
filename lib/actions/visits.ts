'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateStatusField(visitId: number, field: string, value: string) {
  const allowedFields = ['request_status', 'wiring_plan_status', 'costs_status'];
  if (!allowedFields.includes(field)) throw new Error('Invalid field');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('site_visit_requests').update({ [field]: value }).eq('id', visitId);
  await supabase.from('visit_change_events').insert({
    event_type: 'visit.status_field_updated', visit_id: visitId,
    actor_id: user?.id, payload: { field, value },
  });
  revalidatePath('/visits');
}

export async function updateDateField(visitId: number, field: string, value: string) {
  const allowedFields = ['date_performed', 'date_completed'];
  if (!allowedFields.includes(field)) throw new Error('Invalid field');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const parsedValue = value || null;

  await supabase.from('site_visit_requests').update({ [field]: parsedValue }).eq('id', visitId);
  await supabase.from('visit_change_events').insert({
    event_type: 'visit.date_field_updated', visit_id: visitId,
    actor_id: user?.id, payload: { field, new_value: parsedValue },
  });
  revalidatePath('/visits');
}

export async function deleteVisit(visitId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: visit } = await supabase
    .from('site_visit_requests').select('property_name').eq('id', visitId).single();

  await supabase.from('visit_change_events').insert({
    event_type: 'visit.deleted', visit_id: visitId,
    actor_id: user?.id, payload: { deleted_visit_id: visitId, property_name: visit?.property_name },
  });
  await supabase.from('site_visit_requests').delete().eq('id', visitId);
  revalidatePath('/visits');
}

export async function createVisit(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const visit = {
    property_name: formData.get('property_name') as string,
    island: formData.get('island') as string,
    property_address: (formData.get('property_address') as string) ?? '',
    building_count: formData.get('building_count') ? Number(formData.get('building_count')) : null,
    floor_count: formData.get('floor_count') ? Number(formData.get('floor_count')) : null,
    internet_connections: formData.get('internet_connections') ? Number(formData.get('internet_connections')) : null,
    property_contact_name: (formData.get('property_contact_name') as string) ?? '',
    property_contact_phone: (formData.get('property_contact_phone') as string) ?? '',
    preferred_start: formData.get('preferred_start') as string,
    preferred_end: (formData.get('preferred_end') as string) || null,
    detailed_description: (formData.get('detailed_description') as string) ?? '',
    scope_fiber_enablement_pathing: formData.get('scope_fiber_enablement_pathing') === 'on',
    scope_common_area_requirements: formData.get('scope_common_area_requirements') === 'on',
    notes: (formData.get('notes') as string) ?? '',
    install_plan_url: (formData.get('install_plan_url') as string) ?? '',
    submitted_by: (formData.get('requestor_id') as string) || user.id,
  };

  const { data, error } = await supabase.from('site_visit_requests').insert(visit).select('id').single();
  if (error) return { error: error.message };

  await supabase.from('visit_change_events').insert({
    event_type: 'visit.created', visit_id: data.id,
    actor_id: user.id, payload: { property_name: visit.property_name },
  });
  redirect(`/visits/${data.id}`);
}

export async function updateVisit(visitId: number, _prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const updates = {
    property_name: formData.get('property_name') as string,
    island: formData.get('island') as string,
    property_address: (formData.get('property_address') as string) ?? '',
    building_count: formData.get('building_count') ? Number(formData.get('building_count')) : null,
    floor_count: formData.get('floor_count') ? Number(formData.get('floor_count')) : null,
    internet_connections: formData.get('internet_connections') ? Number(formData.get('internet_connections')) : null,
    property_contact_name: (formData.get('property_contact_name') as string) ?? '',
    property_contact_phone: (formData.get('property_contact_phone') as string) ?? '',
    preferred_start: formData.get('preferred_start') as string,
    preferred_end: (formData.get('preferred_end') as string) || null,
    detailed_description: (formData.get('detailed_description') as string) ?? '',
    scope_fiber_enablement_pathing: formData.get('scope_fiber_enablement_pathing') === 'on',
    scope_common_area_requirements: formData.get('scope_common_area_requirements') === 'on',
    notes: (formData.get('notes') as string) ?? '',
    install_plan_url: (formData.get('install_plan_url') as string) ?? '',
    submitted_by: (formData.get('requestor_id') as string) || undefined,
  };

  await supabase.from('site_visit_requests').update(updates).eq('id', visitId);
  await supabase.from('visit_change_events').insert({
    event_type: 'visit.updated', visit_id: visitId,
    actor_id: user?.id, payload: { property_name: updates.property_name },
  });
  redirect(`/visits/${visitId}`);
}

export async function assignDesigner(visitId: number, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const designerId = formData.get('designer_id') as string;

  await supabase.from('site_visit_requests').update({
    assigned_designer: designerId, assigned_by: user?.id, status: 'assigned',
  }).eq('id', visitId);

  await supabase.from('visit_change_events').insert({
    event_type: 'visit.assigned', visit_id: visitId,
    actor_id: user?.id, payload: { designer_id: designerId },
  });
  revalidatePath(`/visits/${visitId}`);
}
