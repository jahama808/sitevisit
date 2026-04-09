import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { assignDesigner } from '@/lib/actions/visits';

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireAuth();
  const { id } = await params;
  const supabase = await createClient();

  const { data: visit } = await supabase
    .from('site_visit_requests')
    .select('*, submitted_by_profile:profiles!submitted_by(*), assigned_designer_profile:profiles!assigned_designer(*)')
    .eq('id', Number(id)).single();
  if (!visit) notFound();

  const { data: designers } = await supabase
    .from('profiles').select('id, username, first_name, last_name').eq('role', 'designer').eq('is_active', true);

  const boundAssign = assignDesigner.bind(null, visit.id);

  function dn(p: { first_name?: string; last_name?: string; username?: string } | null) {
    if (!p) return '-';
    return `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.username || '-';
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Visit #{visit.id} — {visit.property_name}</h4>
        <Link className="btn btn-outline-primary" href={`/visits/${visit.id}/edit`}>Edit</Link>
      </div>
      <div className="row g-3">
        <div className="col-md-8"><div className="card border-0 shadow-sm"><div className="card-body">
          <div className="section-title">Property Details</div>
          <div className="row mb-2"><div className="col-sm-4 text-muted">Island</div><div className="col-sm-8">{visit.island}</div></div>
          <div className="row mb-2"><div className="col-sm-4 text-muted">Address</div><div className="col-sm-8">{visit.property_address || '-'}</div></div>
          <div className="row mb-2"><div className="col-sm-4 text-muted">Buildings / Floors / Connections</div><div className="col-sm-8">{visit.building_count ?? '-'} / {visit.floor_count ?? '-'} / {visit.internet_connections ?? '-'}</div></div>
          <div className="row mb-2"><div className="col-sm-4 text-muted">Contact</div><div className="col-sm-8">{visit.property_contact_name || '-'} {visit.property_contact_phone}</div></div>
          <div className="row mb-2"><div className="col-sm-4 text-muted">Preferred</div><div className="col-sm-8">{new Date(visit.preferred_start).toLocaleString()}</div></div>
          <div className="row mb-2"><div className="col-sm-4 text-muted">Status</div><div className="col-sm-8">{visit.request_status}</div></div>
          <div className="row mb-2"><div className="col-sm-4 text-muted">Requestor</div><div className="col-sm-8">{dn(visit.submitted_by_profile)}</div></div>
          {visit.detailed_description && <><div className="section-title mt-3">Description</div><p>{visit.detailed_description}</p></>}
          {visit.notes && <><div className="section-title mt-3">Notes</div><p>{visit.notes}</p></>}
        </div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body">
          <div className="section-title">Assignment</div>
          <p><strong>Assigned to:</strong> {dn(visit.assigned_designer_profile)}</p>
          {(profile.role === 'admin' || profile.role === 'manager') && designers && (
            <form action={boundAssign}>
              <div className="mb-2">
                <label className="form-label">Assign Designer</label>
                <select name="designer_id" className="form-select" required>
                  <option value="">Select designer...</option>
                  {designers.map((d) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name} ({d.username})</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-sm">Assign</button>
            </form>
          )}
        </div></div></div>
      </div>
    </>
  );
}
