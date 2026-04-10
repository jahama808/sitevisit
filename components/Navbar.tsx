import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Profile } from '@/lib/types';

export function Navbar({ profile }: { profile: Profile | null }) {
  return (
    <nav className="navbar navbar-expand-lg border-bottom glass-nav">
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-semibold" href="/">
          DND Scheduler
        </Link>
        {profile && (
          <div className="d-flex gap-2">
            {profile.role !== 'sales' && (
              <Link className="btn btn-sm btn-outline-primary" href="/visits">Queue</Link>
            )}
            {profile.role !== 'sales' && (
              <Link className="btn btn-sm btn-outline-primary" href="/visits/calendar">Calendar</Link>
            )}
            {profile.role !== 'sales' && (
              <Link className="btn btn-sm btn-outline-primary" href="/accounts/designers">Designers</Link>
            )}
            {(profile.role === 'admin' || profile.role === 'manager') && (
              <Link className="btn btn-sm btn-outline-primary" href="/visits/stats">Stats</Link>
            )}
            {profile.role === 'admin' && (
              <>
                <Link className="btn btn-sm btn-outline-primary" href="/accounts/admin-portal">Admin Portal</Link>
                <Link className="btn btn-sm btn-outline-primary" href="/accounts/users">Users</Link>
              </>
            )}
          </div>
        )}
        <div className="d-flex align-items-center gap-2">
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
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
