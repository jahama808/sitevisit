# Password Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace OTP email authentication with email+password authentication using Supabase Auth's native password support.

**Architecture:** Stay within Supabase Auth for password hashing and session management. Add `must_change_password` flag to `profiles` table. Replace two-page OTP login with single-page password login. Add forgot-password, force-change-password, and self-service profile pages.

**Tech Stack:** Next.js 16 App Router, Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`), Bootstrap 5, React 19 `useActionState`.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/003_add_password_fields.sql` | Create | Add `must_change_password` column to profiles |
| `lib/validation.ts` | Create | Password validation utility (shared by client + server) |
| `lib/actions/auth.ts` | Modify | Replace OTP actions with password auth actions |
| `lib/actions/users.ts` | Modify | Add password to createUser, add resetPassword action |
| `lib/supabase/middleware.ts` | Modify | Add must_change_password redirect logic |
| `lib/types.ts` | Modify | Add `must_change_password` to Profile interface |
| `app/login/page.tsx` | Modify | Replace email-only form with email+password form |
| `app/login/verify/page.tsx` | Delete | No longer needed |
| `app/login/forgot-password/page.tsx` | Create | Forgot password email form |
| `app/login/change-password/page.tsx` | Create | Force change password page |
| `app/accounts/profile/page.tsx` | Create | Self-service profile + change password |
| `app/accounts/users/new/page.tsx` | Modify | Add password field + generate button |
| `app/accounts/users/[id]/edit/page.tsx` | Modify | Add reset password section |
| `components/Navbar.tsx` | Modify | Add My Account link |

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/003_add_password_fields.sql`

- [ ] **Step 1: Create the migration file**

```sql
ALTER TABLE profiles
ADD COLUMN must_change_password boolean NOT NULL DEFAULT true;
```

- [ ] **Step 2: Run the migration against your Supabase database**

Run: `psql "$DATABASE_URL" -f supabase/migrations/003_add_password_fields.sql`

Alternatively, run this via the Supabase SQL Editor in the dashboard.

- [ ] **Step 3: Set existing users to not require password change**

Run this in the SQL editor to avoid locking out existing users:

```sql
UPDATE profiles SET must_change_password = false;
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/003_add_password_fields.sql
git commit -m "feat: add must_change_password column to profiles"
```

---

### Task 2: Password Validation Utility

**Files:**
- Create: `lib/validation.ts`

- [ ] **Step 1: Create the validation module**

```typescript
export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) errors.push('Must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must contain an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Must contain a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Must contain a number');

  return { valid: errors.length === 0, errors };
}

export function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const all = upper + lower + digits;

  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  // Guarantee one of each required type
  const required = [pick(upper), pick(lower), pick(digits)];

  // Fill remaining 9 characters from full set
  const rest = Array.from({ length: 9 }, () => pick(all));

  // Shuffle all 12 characters
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/validation.ts
git commit -m "feat: add password validation and generation utilities"
```

---

### Task 3: Update Profile Type

**Files:**
- Modify: `lib/types.ts:7-16`

- [ ] **Step 1: Add `must_change_password` to Profile interface**

In `lib/types.ts`, add the field to the `Profile` interface:

```typescript
export interface Profile {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add must_change_password to Profile type"
```

---

### Task 4: Replace Auth Actions

**Files:**
- Modify: `lib/actions/auth.ts` (full rewrite)

- [ ] **Step 1: Replace the entire file with password-based actions**

```typescript
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validatePassword } from '@/lib/validation';

export async function signIn(_prev: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  if (!email || !password) return { error: 'Email and password are required' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Invalid email or password' };

  // Check if user must change password
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('must_change_password')
    .eq('email', email)
    .single();

  if (profile?.must_change_password) {
    redirect('/login/change-password');
  }

  redirect('/');
}

export async function forgotPassword(_prev: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  if (!email) return { error: 'Email is required' };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login/change-password`,
  });

  // Always show success to prevent email enumeration
  return { success: true };
}

export async function forceChangePassword(_prev: unknown, formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirm_password') as string;

  if (!password || !confirmPassword) return { error: 'Both fields are required' };
  if (password !== confirmPassword) return { error: 'Passwords do not match' };

  const validation = validatePassword(password);
  if (!validation.valid) return { error: validation.errors.join('. ') };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  // Clear the must_change_password flag
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const admin = createAdminClient();
    await admin.from('profiles').update({ must_change_password: false }).eq('id', user.id);
  }

  redirect('/');
}

export async function changePassword(_prev: unknown, formData: FormData) {
  const currentPassword = formData.get('current_password') as string;
  const newPassword = formData.get('new_password') as string;
  const confirmPassword = formData.get('confirm_password') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All fields are required' };
  }
  if (newPassword !== confirmPassword) return { error: 'New passwords do not match' };

  const validation = validatePassword(newPassword);
  if (!validation.valid) return { error: validation.errors.join('. ') };

  // Verify current password by re-authenticating
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: 'Not authenticated' };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) return { error: 'Current password is incorrect' };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```

- [ ] **Step 2: Verify the dev server has no import errors**

Run: `npm run build` or check the dev server console for errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/auth.ts
git commit -m "feat: replace OTP auth actions with password-based auth"
```

---

### Task 5: Update Middleware

**Files:**
- Modify: `lib/supabase/middleware.ts`

- [ ] **Step 1: Replace the middleware with updated auth logic**

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/login/forgot-password' ||
    pathname === '/login/change-password';
  const isApiRoute = pathname.startsWith('/api/v1');
  const isSignOutRoute = pathname === '/api/auth/signout';

  // Unauthenticated users can only access auth pages and public API routes
  if (!user && !isAuthPage && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated users: check must_change_password
  if (user && !isAuthPage && !isSignOutRoute && !isApiRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('must_change_password')
      .eq('id', user.id)
      .single();

    if (profile?.must_change_password) {
      const url = request.nextUrl.clone();
      url.pathname = '/login/change-password';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabase/middleware.ts
git commit -m "feat: add must_change_password redirect to middleware"
```

---

### Task 6: Replace Login Page

**Files:**
- Modify: `app/login/page.tsx` (full rewrite)
- Delete: `app/login/verify/page.tsx`

- [ ] **Step 1: Replace the login page with email+password form**

```tsx
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
```

- [ ] **Step 2: Delete the verify page**

```bash
rm app/login/verify/page.tsx
```

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git rm app/login/verify/page.tsx
git commit -m "feat: replace OTP login with email+password login"
```

---

### Task 7: Forgot Password Page

**Files:**
- Create: `app/login/forgot-password/page.tsx`

- [ ] **Step 1: Create the forgot password page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add app/login/forgot-password/page.tsx
git commit -m "feat: add forgot password page"
```

---

### Task 8: Force Change Password Page

**Files:**
- Create: `app/login/change-password/page.tsx`

- [ ] **Step 1: Create the change password page**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add app/login/change-password/page.tsx
git commit -m "feat: add force change password page"
```

---

### Task 9: Update User Creation with Password

**Files:**
- Modify: `lib/actions/users.ts:8-29` (createUser function)
- Modify: `app/accounts/users/new/page.tsx`

- [ ] **Step 1: Update the createUser action to accept a password**

Add the import at the top of `lib/actions/users.ts`:

```typescript
import { validatePassword } from '@/lib/validation';
```

Replace the `createUser` function in `lib/actions/users.ts`:

```typescript
export async function createUser(_prev: unknown, formData: FormData) {
  const email = (formData.get('email') as string).trim().toLowerCase();
  const username = (formData.get('username') as string).trim();
  const firstName = (formData.get('first_name') as string) ?? '';
  const lastName = (formData.get('last_name') as string) ?? '';
  const role = formData.get('role') as UserRole;
  const password = formData.get('password') as string;

  if (!password) return { error: 'Password is required' };

  const validation = validatePassword(password);
  if (!validation.valid) return { error: validation.errors.join('. ') };

  const admin = createAdminClient();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) return { error: authError.message };

  const { error: profileError } = await admin.from('profiles').insert({
    id: authUser.user.id, username, email, first_name: firstName, last_name: lastName, role,
    must_change_password: true,
  });
  if (profileError) return { error: profileError.message };

  if (role === 'designer') {
    await admin.from('designer_profiles').insert({ user_id: authUser.user.id });
  }

  redirect('/accounts/users');
}
```

- [ ] **Step 2: Update the new user form to include password field and generate button**

Replace `app/accounts/users/new/page.tsx`:

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add lib/actions/users.ts app/accounts/users/new/page.tsx
git commit -m "feat: add password field to user creation"
```

---

### Task 10: Add Password Reset to Edit User Page

**Files:**
- Modify: `lib/actions/users.ts` (add resetUserPassword action)
- Modify: `app/accounts/users/[id]/edit/page.tsx`

- [ ] **Step 1: Add the resetUserPassword action**

Add this function to the end of `lib/actions/users.ts` (before the closing of the file):

```typescript
export async function resetUserPassword(userId: string, _prev: unknown, formData: FormData) {
  const password = formData.get('password') as string;
  if (!password) return { error: 'Password is required' };

  const validation = validatePassword(password);
  if (!validation.valid) return { error: validation.errors.join('. ') };

  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.updateUserById(userId, { password });
  if (authError) return { error: authError.message };

  await admin.from('profiles').update({ must_change_password: true }).eq('id', userId);

  return { success: true };
}
```

Also add the import for `validatePassword` at the top of `lib/actions/users.ts` (if not already added in Task 9):

```typescript
import { validatePassword } from '@/lib/validation';
```

- [ ] **Step 2: Replace the edit user page to include password reset section**

```tsx
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { updateUser } from '@/lib/actions/users';
import ResetPasswordSection from './ResetPasswordSection';

const ROLES = ['admin', 'manager', 'sales', 'requester', 'designer'];

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin');
  const { id } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (!user) notFound();

  const boundAction = updateUser.bind(null, user.id);
  return (
    <>
      <h4 className="mb-3">Edit User — {user.username}</h4>
      <div className="card border-0 shadow-sm"><div className="card-body">
        <form action={boundAction}>
          <div className="row g-3 mb-3">
            <div className="col-md-6"><label className="form-label">Email</label><input name="email" type="email" className="form-control" defaultValue={user.email} required /></div>
            <div className="col-md-3"><label className="form-label">Role</label><select name="role" className="form-select" defaultValue={user.role}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4"><label className="form-label">First Name</label><input name="first_name" className="form-control" defaultValue={user.first_name} /></div>
            <div className="col-md-4"><label className="form-label">Last Name</label><input name="last_name" className="form-control" defaultValue={user.last_name} /></div>
          </div>
          <div className="form-check mb-3"><input name="is_active" type="checkbox" className="form-check-input" defaultChecked={user.is_active} /><label className="form-check-label">Active</label></div>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div></div>

      <h5 className="mt-4 mb-3">Reset Password</h5>
      <ResetPasswordSection userId={user.id} />
    </>
  );
}
```

- [ ] **Step 3: Create the ResetPasswordSection client component**

Create `app/accounts/users/[id]/edit/ResetPasswordSection.tsx`:

```tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add lib/actions/users.ts app/accounts/users/\[id\]/edit/page.tsx app/accounts/users/\[id\]/edit/ResetPasswordSection.tsx
git commit -m "feat: add admin password reset to edit user page"
```

---

### Task 11: My Account / Profile Page

**Files:**
- Create: `app/accounts/profile/page.tsx`

- [ ] **Step 1: Create the profile page**

```tsx
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
```

- [ ] **Step 2: Create the ChangePasswordForm client component**

Create `app/accounts/profile/ChangePasswordForm.tsx`:

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add app/accounts/profile/page.tsx app/accounts/profile/ChangePasswordForm.tsx
git commit -m "feat: add my account page with self-service password change"
```

---

### Task 12: Add My Account Link to Navbar

**Files:**
- Modify: `components/Navbar.tsx`

- [ ] **Step 1: Add My Account link to the navbar**

In `components/Navbar.tsx`, add the "My Account" link in the right-side section, just before the sign-out form. Replace the user info / sign-out block:

Find this block:
```tsx
          {profile && (
            <>
              <span className="small text-secondary-emphasis">
                {profile.username} ({profile.role})
              </span>
              <form action="/api/auth/signout" method="post">
                <button type="submit" className="btn btn-sm btn-outline-secondary">Logout</button>
              </form>
            </>
          )}
```

Replace with:
```tsx
          {profile && (
            <>
              <span className="small text-secondary-emphasis">
                {profile.username} ({profile.role})
              </span>
              <Link className="btn btn-sm btn-outline-secondary" href="/accounts/profile">
                My Account
              </Link>
              <form action="/api/auth/signout" method="post">
                <button type="submit" className="btn btn-sm btn-outline-secondary">Logout</button>
              </form>
            </>
          )}
```

- [ ] **Step 2: Commit**

```bash
git add components/Navbar.tsx
git commit -m "feat: add My Account link to navbar"
```

---

### Task 13: Add NEXT_PUBLIC_SITE_URL Environment Variable

The `forgotPassword` action uses `NEXT_PUBLIC_SITE_URL` for the password reset redirect. This needs to be set in the environment.

- [ ] **Step 1: Add the environment variable**

Add `NEXT_PUBLIC_SITE_URL` to your `.env.local` (or Supabase dashboard redirect URLs config):

```
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

Also configure the redirect URL in **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**. Add:
```
https://your-production-domain.com/login/change-password
```

- [ ] **Step 2: Commit any .env.example updates if applicable**

---

### Task 14: Set Passwords for Existing Users

Since existing users were created without passwords, you need to set temporary passwords for them via the Supabase dashboard or a one-time script.

- [ ] **Step 1: For each existing user, set a temporary password**

In the Supabase SQL Editor or via the dashboard:

```sql
-- First, check which users need passwords set
SELECT p.email, p.username FROM profiles p WHERE p.is_active = true;
```

Then for each user, use the Supabase Dashboard → Authentication → Users → select user → Update Password, or use the admin API in a one-time script.

- [ ] **Step 2: Set must_change_password for users who got new passwords**

```sql
UPDATE profiles SET must_change_password = true WHERE is_active = true;
```

---

### Task 15: Manual Smoke Test

- [ ] **Step 1: Test login flow**

1. Navigate to `/login`
2. Enter email + temporary password
3. Verify redirect to `/login/change-password`
4. Set new password (verify validation: try short, no uppercase, no number)
5. Verify redirect to `/` after successful change
6. Log out, log back in with new password — should go directly to `/`

- [ ] **Step 2: Test forgot password**

1. Navigate to `/login/forgot-password`
2. Enter email, submit
3. Verify success message appears (regardless of whether email exists)
4. Check email for reset link (if using a deliverable email)

- [ ] **Step 3: Test admin user creation**

1. Log in as admin
2. Go to Users → New User
3. Test Generate Password button
4. Create user with generated password
5. Log out, log in as new user — verify forced password change

- [ ] **Step 4: Test admin password reset**

1. Log in as admin
2. Go to Users → Edit a user
3. Use Reset Password section (test both manual and generated)
4. Verify success message
5. Log in as that user — verify forced password change

- [ ] **Step 5: Test My Account**

1. Navigate to My Account from navbar
2. Verify profile info displays correctly
3. Change password (verify current password check works, validation works)
4. Verify success message
5. Log out, log in with new password

- [ ] **Step 6: Test middleware enforcement**

1. Set `must_change_password = true` for a user in the database
2. Log in as that user
3. Try navigating directly to `/visits` — verify redirect to `/login/change-password`
4. Verify sign-out still works from the change-password page
