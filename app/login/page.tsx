'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signIn } from '@/lib/actions/auth';

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-lg border-0">
            <div className="card-body p-4">
              <h4 className="mb-3">Sign In</h4>
              {state?.error && (
                <div className="alert alert-danger">{state.error}</div>
              )}
              <form action={action}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-control" required autoFocus />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" name="password" className="form-control" required />
                </div>
                <button className="btn btn-primary w-100" type="submit" disabled={pending}>
                  {pending ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              <div className="text-center mt-3">
                <Link href="/login/forgot-password" className="text-muted small">
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
