import { requireRole } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

export default async function AdminPortalPage() {
  await requireRole('admin');
  const supabase = await createClient();

  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: requesters } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'requester');
  const { count: designers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'designer');
  const { count: admins } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin');

  return (
    <>
      <h4 className="mb-3">Admin Portal</h4>
      <div className="row g-3">
        <div className="col-md-3"><div className="card stat-card p-3"><div className="label">Total Users</div><div className="value">{totalUsers ?? 0}</div></div></div>
        <div className="col-md-3"><div className="card stat-card p-3"><div className="label">Requesters</div><div className="value">{requesters ?? 0}</div></div></div>
        <div className="col-md-3"><div className="card stat-card p-3"><div className="label">Designers</div><div className="value">{designers ?? 0}</div></div></div>
        <div className="col-md-3"><div className="card stat-card p-3"><div className="label">Admins</div><div className="value">{admins ?? 0}</div></div></div>
      </div>
    </>
  );
}
