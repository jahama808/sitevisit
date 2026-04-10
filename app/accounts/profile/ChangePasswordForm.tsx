'use client';

import { useActionState } from 'react';
import { changePassword } from '@/lib/actions/auth';

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        {state?.success && (
          <div className="alert alert-success">Password changed successfully.</div>
        )}
        {state?.error && (
          <div className="alert alert-danger">{state.error}</div>
        )}
        <form action={action}>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">Current Password</label>
              <input type="password" name="current_password" className="form-control" required />
            </div>
            <div className="col-md-4">
              <label className="form-label">New Password</label>
              <input type="password" name="new_password" className="form-control" required />
              <div className="form-text">Min 8 chars, uppercase, lowercase, and a number.</div>
            </div>
            <div className="col-md-4">
              <label className="form-label">Confirm New Password</label>
              <input type="password" name="confirm_password" className="form-control" required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
