import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { updateDesignerProfile } from '@/lib/actions/designers';

const ISLANDS = ['Oahu', 'Maui', 'Kauai', 'Hawaii'];

export default async function EditDesignerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase.from('designer_profiles').select('*, user:profiles!user_id(*)').eq('id', Number(id)).single();
  if (!profile) notFound();

  const boundAction = updateDesignerProfile.bind(null, profile.id);
  const currentIslands = profile.island_preferences as string[];

  return (
    <>
      <h4 className="mb-3">Edit Designer — {profile.user?.first_name} {profile.user?.last_name}</h4>
      <div className="card border-0 shadow-sm"><div className="card-body">
        <form action={boundAction}>
          <div className="mb-3">
            <label className="form-label">Island Preferences</label>
            {ISLANDS.map(island => (
              <div className="form-check" key={island}>
                <input name="island_preferences" type="checkbox" className="form-check-input" value={island} defaultChecked={currentIslands.includes(island)} />
                <label className="form-check-label">{island}</label>
              </div>
            ))}
          </div>
          <div className="mb-3"><label className="form-label">Additional Preferences</label><textarea name="additional_preferences" className="form-control" rows={3} defaultValue={profile.additional_preferences} /></div>
          <div className="form-check mb-3"><input name="active" type="checkbox" className="form-check-input" defaultChecked={profile.active} /><label className="form-check-label">Active</label></div>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div></div>
    </>
  );
}
