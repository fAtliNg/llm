import { Outlet } from 'react-router';

/** The document shell. Header, menu and footer come from `meta/layouts`, not from here. */
export function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  );
}
