'use client';

import { useActionState } from 'react';
import type { SiteVisitRequest } from '@/lib/types';

const ISLANDS = ['Oahu', 'Maui', 'Kauai', 'Hawaii'];

interface VisitFormProps {
  action: (_prev: unknown, formData: FormData) => Promise<{ error?: string } | void>;
  visit?: SiteVisitRequest;
}

export function VisitForm({ action, visit }: VisitFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <div className="card border-0 shadow-sm tech-form"><div className="card-body">
      {state?.error && <div className="alert alert-danger">{state.error}</div>}
      <form action={formAction}>
        <div className="section-title">Property</div>
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label">Property Name *</label>
            <input name="property_name" className="form-control" required defaultValue={visit?.property_name ?? ''} />
          </div>
          <div className="col-md-3">
            <label className="form-label">Island *</label>
            <select name="island" className="form-select" required defaultValue={visit?.island ?? ''}>
              <option value="">Select...</option>
              {ISLANDS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Address</label>
          <textarea name="property_address" className="form-control" rows={2} defaultValue={visit?.property_address ?? ''} />
        </div>
        <div className="row g-3 mb-3">
          <div className="col-md-4"><label className="form-label">Buildings</label><input name="building_count" type="number" className="form-control" defaultValue={visit?.building_count ?? ''} /></div>
          <div className="col-md-4"><label className="form-label">Floors</label><input name="floor_count" type="number" className="form-control" defaultValue={visit?.floor_count ?? ''} /></div>
          <div className="col-md-4"><label className="form-label">Internet Connections</label><input name="internet_connections" type="number" className="form-control" defaultValue={visit?.internet_connections ?? ''} /></div>
        </div>
        <div className="section-title">Contact &amp; Schedule</div>
        <div className="row g-3 mb-3">
          <div className="col-md-4"><label className="form-label">Contact Name</label><input name="property_contact_name" className="form-control" defaultValue={visit?.property_contact_name ?? ''} /></div>
          <div className="col-md-4"><label className="form-label">Contact Phone</label><input name="property_contact_phone" className="form-control" defaultValue={visit?.property_contact_phone ?? ''} /></div>
        </div>
        <div className="row g-3 mb-3">
          <div className="col-md-6"><label className="form-label">Preferred Start *</label><input name="preferred_start" type="datetime-local" className="form-control" required defaultValue={visit?.preferred_start?.slice(0, 16) ?? ''} /></div>
          <div className="col-md-6"><label className="form-label">Preferred End</label><input name="preferred_end" type="datetime-local" className="form-control" defaultValue={visit?.preferred_end?.slice(0, 16) ?? ''} /></div>
        </div>
        <div className="section-title">Scope</div>
        <div className="mb-3">
          <div className="form-check"><input name="scope_fiber_enablement_pathing" type="checkbox" className="form-check-input" defaultChecked={visit?.scope_fiber_enablement_pathing ?? false} /><label className="form-check-label">Fiber Enablement Pathing</label></div>
          <div className="form-check"><input name="scope_common_area_requirements" type="checkbox" className="form-check-input" defaultChecked={visit?.scope_common_area_requirements ?? false} /><label className="form-check-label">Common Area Requirements</label></div>
        </div>
        <div className="section-title">Documentation</div>
        <div className="mb-3"><label className="form-label">Description</label><textarea name="detailed_description" className="form-control" rows={3} defaultValue={visit?.detailed_description ?? ''} /></div>
        <div className="mb-3"><label className="form-label">Notes</label><textarea name="notes" className="form-control" rows={2} defaultValue={visit?.notes ?? ''} /></div>
        <div className="mb-3"><label className="form-label">Install Plan URL</label><input name="install_plan_url" type="url" className="form-control" defaultValue={visit?.install_plan_url ?? ''} /></div>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Saving...' : (visit ? 'Save Changes' : 'Submit Request')}</button>
      </form>
    </div></div>
  );
}
