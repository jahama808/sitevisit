'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/actions/auth';

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, null);

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-lg border-0">
            <div className="card-body p-4">
              <h4 className="mb-3">Reset Password</h4>
              {state?.success ? (
                <div className="alert alert-success">
                  If an account exists with that email, a password reset link has been sent.
                  <hr />
                  <p className="mb-0 small">
                    If you don&apos;t receive the email, contact your administrator for a manual password reset.
                  </p>
                </div>
              ) : (
                <>
                  {state?.error && (
                    <div className="alert alert-danger">{state.error}</div>
                  )}
                  <form action={action}>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input type="email" name="email" className="form-control" required autoFocus />
                    </div>
                    <button className="btn btn-primary w-100" type="submit" disabled={pending}>
                      {pending ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                </>
              )}
              <div className="text-center mt-3">
                <Link href="/login" className="text-muted small">Back to sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
