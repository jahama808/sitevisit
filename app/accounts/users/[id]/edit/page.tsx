import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { updateUser } from '@/lib/actions/users';
import ResetPasswordSection from './ResetPasswordSection';

const ROLES = ['admin', 'manager', 'sales', 'requester', 'designer'];

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin');
  const { id } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (!user) notFound();

  const boundAction = updateUser.bind(null, user.id);
  return (
    <>
      <h4 className="mb-3">Edit User — {user.username}</h4>
      <div className="card border-0 shadow-sm"><div className="card-body">
        <form action={boundAction}>
          <div className="row g-3 mb-3">
            <div className="col-md-6"><label className="form-label">Email</label><input name="email" type="email" className="form-control" defaultValue={user.email} required /></div>
            <div className="col-md-3"><label className="form-label">Role</label><select name="role" className="form-select" defaultValue={user.role}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4"><label className="form-label">First Name</label><input name="first_name" className="form-control" defaultValue={user.first_name} /></div>
            <div className="col-md-4"><label className="form-label">Last Name</label><input name="last_name" className="form-control" defaultValue={user.last_name} /></div>
          </div>
          <div className="form-check mb-3"><input name="is_active" type="checkbox" className="form-check-input" defaultChecked={user.is_active} /><label className="form-check-label">Active</label></div>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div></div>

      <h5 className="mt-4 mb-3">Reset Password</h5>
      <ResetPasswordSection userId={user.id} />
    </>
  );
}
