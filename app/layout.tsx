import type { Metadata } from 'next';
import { ThemeScript } from '@/components/ThemeScript';
import { Navbar } from '@/components/Navbar';
import { getProfile } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'DND Site Visit Scheduler',
};

async function NavbarWrapper() {
  const profile = await getProfile();
  return <Navbar profile={profile} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <ThemeScript />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/css/theme.css" />
      </head>
      <body>
        <NavbarWrapper />
        <div className="container py-4">{children}</div>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" defer />
      </body>
    </html>
  );
}
