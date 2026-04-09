'use client';

import { useActionState } from 'react';
import { sendOtp } from '@/lib/actions/auth';

export default function LoginPage() {
  const [state, action, pending] = useActionState(sendOtp, null);

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-lg border-0">
            <div className="card-body p-4">
              <h4 className="mb-3">Secure Login</h4>
              {state?.error && (
                <div className="alert alert-danger">{state.error}</div>
              )}
              <form action={action}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-control" required autoFocus />
                </div>
                <button className="btn btn-primary w-100" type="submit" disabled={pending}>
                  {pending ? 'Sending code...' : 'Send login code'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
