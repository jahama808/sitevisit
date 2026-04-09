import Link from 'next/link';
import { requireAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

export default async function DesignerListPage() {
  await requireAuth();
  const supabase = await createClient();
  const { data: designers } = await supabase.from('designer_profiles').select('*, user:profiles!user_id(*)').order('id', { ascending: true });

  return (
    <>
      <h4 className="mb-3">Designers</h4>
      <div className="card border-0 shadow-sm"><div className="card-body">
        <table className="table table-hover align-middle">
          <thead><tr><th>Name</th><th>Islands</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {(designers ?? []).map((d) => (
              <tr key={d.id}>
                <td className="admin-designer-name">{d.user?.first_name} {d.user?.last_name} ({d.user?.username})</td>
                <td>{(d.island_preferences as string[]).join(', ') || '-'}</td>
                <td>{d.active ? 'Yes' : 'No'}</td>
                <td><Link className="btn btn-sm btn-outline-primary" href={`/accounts/designers/${d.id}/edit`}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </>
  );
}
