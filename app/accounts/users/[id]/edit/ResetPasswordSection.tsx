'use client';

import { useActionState, useState } from 'react';
import { resetUserPassword } from '@/lib/actions/users';
import { generatePassword, validatePassword } from '@/lib/validation';

export default function ResetPasswordSection({ userId }: { userId: string }) {
  const boundAction = resetUserPassword.bind(null, userId);
  const [state, action, pending] = useActionState(boundAction, null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validation = password ? validatePassword(password) : null;

  function handleGenerate() {
    const pw = generatePassword();
    setPassword(pw);
    setShowPassword(true);
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        {state?.success && (
          <div className="alert alert-success">Password has been reset. The user will be required to change it on next login.</div>
        )}
        {state?.error && (
          <div className="alert alert-danger">{state.error}</div>
        )}
        <form action={action}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">New Temporary Password</label>
              <div className="input-group">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`} />
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={handleGenerate}>
                  Generate
                </button>
              </div>
              {validation && !validation.valid && (
                <div className="form-text text-danger">{validation.errors.join('. ')}</div>
              )}
              <div className="form-text">User will be required to change this on next login.</div>
            </div>
          </div>
          <button type="submit" className="btn btn-warning" disabled={pending}>
            {pending ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
