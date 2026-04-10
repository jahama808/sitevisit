import { requireAuth } from '@/lib/utils';
import ChangePasswordForm from './ChangePasswordForm';

export default async function ProfilePage() {
  const profile = await requireAuth();

  return (
    <>
      <h4 className="mb-3">My Account</h4>
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label text-muted small">Name</label>
              <p>{profile.first_name} {profile.last_name}</p>
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small">Email</label>
              <p>{profile.email}</p>
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small">Role</label>
              <p>{profile.role}</p>
            </div>
          </div>
        </div>
      </div>

      <h5 className="mb-3">Change Password</h5>
      <ChangePasswordForm />
    </>
  );
}
