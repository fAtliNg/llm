import { NavLink, Outlet } from 'react-router';

import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
  );

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <nav aria-label="Main" className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
          <span className="mr-4 font-semibold">{import.meta.env.VITE_APP_NAME ?? 'Template'}</span>
          <NavLink to="/" end className={navLinkClass}>
            Tasks
          </NavLink>
          <NavLink to="/tasks/new" className={navLinkClass}>
            New task
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
