'use client';

import { useActionState, useState } from 'react';
import { createUser } from '@/lib/actions/users';
import { generatePassword, validatePassword } from '@/lib/validation';

const ROLES = ['admin', 'manager', 'sales', 'requester', 'designer'];

export default function NewUserPage() {
  const [state, action, pending] = useActionState(createUser, null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validation = password ? validatePassword(password) : null;

  function handleGenerate() {
    const pw = generatePassword();
    setPassword(pw);
    setShowPassword(true);
  }

  return (
    <>
      <h4 className="mb-3">New User</h4>
      {state?.error && <div className="alert alert-danger">{state.error}</div>}
      <div className="card border-0 shadow-sm"><div className="card-body">
        <form action={action}>
          <div className="row g-3 mb-3">
            <div className="col-md-6"><label className="form-label">Username *</label><input name="username" className="form-control" required /></div>
            <div className="col-md-6"><label className="form-label">Email *</label><input name="email" type="email" className="form-control" required /></div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4"><label className="form-label">First Name</label><input name="first_name" className="form-control" /></div>
            <div className="col-md-4"><label className="form-label">Last Name</label><input name="last_name" className="form-control" /></div>
            <div className="col-md-4"><label className="form-label">Role *</label><select name="role" className="form-select" required>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">Temporary Password *</label>
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
              <div className="form-text">Min 8 chars, uppercase, lowercase, and a number. User will be required to change this on first login.</div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Creating...' : 'Create User'}</button>
        </form>
      </div></div>
    </>
  );
}
