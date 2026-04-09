'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { verifyOtp } from '@/lib/actions/auth';

function VerifyForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [state, action, pending] = useActionState(verifyOtp, null);

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-lg border-0">
            <div className="card-body p-4">
              <h4 className="mb-3">Enter Code</h4>
              <p className="text-muted">
                A login code was sent to <strong>{email}</strong>
              </p>
              {state?.error && (
                <div className="alert alert-danger">{state.error}</div>
              )}
              <form action={action}>
                <input type="hidden" name="email" value={email} />
                <div className="mb-3">
                  <label className="form-label">Code</label>
                  <input
                    type="text" name="code" className="form-control"
                    required autoFocus maxLength={6} pattern="[0-9]{6}" placeholder="000000"
                  />
                </div>
                <button className="btn btn-primary w-100" type="submit" disabled={pending}>
                  {pending ? 'Verifying...' : 'Verify'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
