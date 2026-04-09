import Link from 'next/link';
import { requireRole } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { deleteUser } from '@/lib/actions/users';
import { UserDeleteButton } from '@/components/UserDeleteButton';

export default async function UserListPage() {
  await requireRole('admin');
  const supabase = await createClient();
  const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Users</h4>
        <Link className="btn btn-primary" href="/accounts/users/new">New User</Link>
      </div>
      <div className="card border-0 shadow-sm"><div className="card-body">
        <table className="table table-hover align-middle">
          <thead><tr><th>Username</th><th>Email</th><th>Name</th><th>Role</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td><td>{u.email}</td><td>{u.first_name} {u.last_name}</td>
                <td><span className="badge text-bg-secondary">{u.role}</span></td>
                <td>{u.is_active ? 'Yes' : 'No'}</td>
                <td className="text-end">
                  <Link className="btn btn-sm btn-outline-primary" href={`/accounts/users/${u.id}/edit`}>Edit</Link>
                  <UserDeleteButton userId={u.id} username={u.username} action={deleteUser} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </>
  );
}
