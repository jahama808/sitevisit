import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const DJANGO_DB = {
  host: '127.0.0.1', port: 5432, database: 'dnd_scheduler',
  user: 'dnd_user', password: process.env.DJANGO_DB_PASSWORD || 'change-me',
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function migrate() {
  const pg = new Client(DJANGO_DB);
  await pg.connect();

  // 1. Users
  console.log('Migrating users...');
  const { rows: users } = await pg.query(
    'SELECT id, username, email, first_name, last_name, role, is_active, date_joined FROM accounts_user',
  );

  const userIdMap: Record<number, string> = {};

  for (const u of users) {
    const { data: authUser, error } = await supabase.auth.admin.createUser({
      email: u.email || `${u.username}@placeholder.local`, email_confirm: true,
    });
    if (error) { console.error(`  Failed ${u.username}: ${error.message}`); continue; }
    userIdMap[u.id] = authUser.user.id;
    await supabase.from('profiles').insert({
      id: authUser.user.id, username: u.username, email: u.email || '',
      first_name: u.first_name || '', last_name: u.last_name || '',
      role: u.role || 'requester', is_active: u.is_active, created_at: u.date_joined,
    });
    console.log(`  User ${u.username} -> ${authUser.user.id}`);
  }

  // 2. Designer profiles
  console.log('Migrating designer profiles...');
  const { rows: dps } = await pg.query('SELECT * FROM accounts_designerprofile');
  for (const dp of dps) {
    const uid = userIdMap[dp.user_id];
    if (!uid) { console.error(`  Skipping unmapped user ${dp.user_id}`); continue; }
    await supabase.from('designer_profiles').insert({
      user_id: uid, island_preferences: dp.island_preferences || [],
      additional_preferences: dp.additional_preferences || '', active: dp.active,
    });
  }

  // 3. Visits
  console.log('Migrating visits...');
  const { rows: visits } = await pg.query('SELECT * FROM visits_sitevisitrequest ORDER BY id');
  const visitIdMap: Record<number, number> = {};

  for (const v of visits) {
    const { data, error } = await supabase.from('site_visit_requests').insert({
      property_name: v.property_name, island: v.island,
      property_address: v.property_address || '',
      building_count: v.building_count, floor_count: v.floor_count,
      internet_connections: v.internet_connections,
      property_contact_name: v.property_contact_name || '',
      property_contact_phone: v.property_contact_phone || '',
      date_requested: v.date_requested, date_performed: v.date_performed,
      date_completed: v.date_completed,
      preferred_start: v.preferred_start, preferred_end: v.preferred_end,
      detailed_description: v.detailed_description || '',
      scope_fiber_enablement_pathing: v.scope_fiber_enablement_pathing || false,
      scope_common_area_requirements: v.scope_common_area_requirements || false,
      notes: v.notes || '', install_plan_url: v.install_plan_url || '',
      submitted_by: userIdMap[v.submitted_by_id],
      assigned_designer: v.assigned_designer_id ? userIdMap[v.assigned_designer_id] : null,
      assigned_by: v.assigned_by_id ? userIdMap[v.assigned_by_id] : null,
      status: v.status, request_status: v.request_status,
      wiring_plan_status: v.wiring_plan_status, costs_status: v.costs_status,
      admin_override: v.admin_override || false,
      created_at: v.created_at, updated_at: v.updated_at,
    }).select('id').single();
    if (error) { console.error(`  Failed visit ${v.id}: ${error.message}`); continue; }
    visitIdMap[v.id] = data!.id;
    console.log(`  Visit ${v.id} -> ${data!.id}`);
  }

  // 4. Change events
  console.log('Migrating change events...');
  const { rows: events } = await pg.query('SELECT * FROM visits_visitchangeevent ORDER BY id');
  for (const evt of events) {
    const newVisitId = visitIdMap[evt.visit_id];
    if (!newVisitId) continue;
    await supabase.from('visit_change_events').insert({
      event_type: evt.event_type, visit_id: newVisitId,
      actor_id: evt.actor_id ? userIdMap[evt.actor_id] : null,
      payload: evt.payload || {}, created_at: evt.created_at,
    });
  }

  // 5. API tokens
  console.log('Migrating API tokens...');
  const { rows: tokens } = await pg.query('SELECT * FROM integrations_apitoken');
  for (const t of tokens) {
    await supabase.from('api_tokens').insert({ name: t.name, token: t.token, active: t.active, created_at: t.created_at });
  }

  // 6. PDF attachments
  console.log('Migrating PDF attachments...');
  const mediaDir = '/home/jahama/servers-prod/DND/dnd_site/media';
  for (const v of visits) {
    if (!v.attachment) continue;
    const filePath = path.join(mediaDir, v.attachment);
    if (!fs.existsSync(filePath)) { console.error(`  File not found: ${filePath}`); continue; }
    const fileBuffer = fs.readFileSync(filePath);
    const { error } = await supabase.storage.from('request-pdfs').upload(v.attachment, fileBuffer, { contentType: 'application/pdf' });
    if (error) { console.error(`  Upload failed ${v.attachment}: ${error.message}`); continue; }
    const newVisitId = visitIdMap[v.id];
    if (newVisitId) await supabase.from('site_visit_requests').update({ attachment_path: v.attachment }).eq('id', newVisitId);
  }

  await pg.end();
  console.log('Migration complete!');
}

migrate().catch(console.error);
