# Password-Based Authentication

Replace OTP email authentication with email+password authentication using Supabase Auth's built-in password support.

## Motivation

OTP emails sent via Supabase (through Proton Mail SMTP) are silently deleted by some ISP mail servers (e.g., hawaiiantel.com) due to the single-part HTML MIME format that Supabase sends. Switching to password auth eliminates the dependency on email delivery for day-to-day login while keeping email reset as an optional recovery path with an admin-reset fallback.

## Database Changes

Add `must_change_password` boolean column to `profiles` table, defaulting to `true`. Set to `true` when an admin creates a user or resets their password. Set to `false` after the user successfully changes their password. No other schema changes — Supabase Auth's `auth.users` table handles password hashes.

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Login Flow

### Login Page (`/login`)

Replace the two-page OTP flow (`/login` + `/login/verify`) with a single page:

- Email and password fields
- "Sign In" button calls `signInWithPassword()`
- "Forgot Password?" link navigates to `/login/forgot-password`
- On success: check `must_change_password` on the user's profile
  - `true` — redirect to `/login/change-password`
  - `false` — redirect to `/`

### Forgot Password Page (`/login/forgot-password`)

- Email field + "Send Reset Link" button
- Calls Supabase's `resetPasswordForEmail()`
- Displays: "If an account exists, a reset email has been sent"
- Includes note: "If you don't receive the email, contact your administrator for a manual reset"

### Force Change Password Page (`/login/change-password`)

- New password + confirm password fields
- Client-side and server-side password validation (8+ chars, uppercase, lowercase, number)
- On success: sets `must_change_password: false`, redirects to `/`

## User Management Changes

### Create User (`/accounts/users/new`)

- Add password field to the existing form
- "Generate Password" button creates a random 12-character string meeting complexity requirements
- Generated password displayed to the admin to share with the user
- Creates user via `admin.auth.admin.createUser()` with `email_confirm: true` and the password
- Profile created with `must_change_password: true`

### Edit User (`/accounts/users/[id]/edit`)

- Add "Reset Password" section
- Admin can type a new temporary password or click "Generate" to auto-generate
- Uses `admin.auth.admin.updateUserById()` to set the new password
- Sets `must_change_password: true` on the profile

### My Account Page (`/accounts/profile` — new)

- Accessible to all logged-in users
- Displays name, email, role (read-only)
- "Change Password" section: current password, new password, confirm new password
- Uses `supabase.auth.updateUser()` (requires current session)
- Link added to existing navigation

## Middleware Changes

Update `lib/supabase/middleware.ts`:

- Existing: unauthenticated users redirected to `/login`
- Add: authenticated users with `must_change_password: true` redirected to `/login/change-password`
  - Exceptions: `/login/change-password` itself, `/api/auth/signout`, static assets
- Public pages: `/login`, `/login/forgot-password`, `/login/change-password` (remove `/login/verify`)
- Fetch profile to check `must_change_password` only for authenticated users not already on the change-password page

## Auth Actions (`lib/actions/auth.ts`)

Remove:
- `sendOtp()`
- `verifyOtp()`

Add:
- `signIn(formData)` — email+password sign-in, check `must_change_password`, redirect accordingly
- `forgotPassword(formData)` — send Supabase password reset email
- `changePassword(formData)` — for My Account page, requires current password
- `forceChangePassword(formData)` — for first-login forced change, sets `must_change_password: false`

Unchanged:
- `signOut()`

## Cleanup

- Delete `/app/login/verify/page.tsx`
- Remove OTP-related code from auth actions

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/` | New migration: add `must_change_password` to profiles |
| `lib/actions/auth.ts` | Replace OTP actions with password actions |
| `lib/actions/users.ts` | Add password to createUser, add resetPassword logic to updateUser |
| `app/login/page.tsx` | Replace email-only form with email+password form |
| `app/login/verify/page.tsx` | Delete |
| `app/login/forgot-password/page.tsx` | New page |
| `app/login/change-password/page.tsx` | New page |
| `app/accounts/profile/page.tsx` | New page |
| `lib/supabase/middleware.ts` | Add must_change_password redirect logic |
| Navigation component | Add link to My Account page |
