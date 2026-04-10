'use client';

import { useActionState } from 'react';
import { forceChangePassword } from '@/lib/actions/auth';

export default function ChangePasswordPage() {
  const [state, action, pending] = useActionState(forceChangePassword, null);

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-lg border-0">
            <div className="card-body p-4">
              <h4 className="mb-3">Set New Password</h4>
              <p className="text-muted small">
                You must set a new password before continuing.
              </p>
              {state?.error && (
                <div className="alert alert-danger">{state.error}</div>
              )}
              <form action={action}>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input type="password" name="password" className="form-control" required autoFocus />
                  <div className="form-text">
                    Min 8 characters, with uppercase, lowercase, and a number.
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <input type="password" name="confirm_password" className="form-control" required />
                </div>
                <button className="btn btn-primary w-100" type="submit" disabled={pending}>
                  {pending ? 'Saving...' : 'Set Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
